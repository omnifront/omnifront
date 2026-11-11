import { BaseSubscribable, type TimerHandle } from "@omnifront/core"
import { focusManager, onlineManager } from "./environment"
import { hashKey, type QueryKey } from "./hash-key"
import type { NetworkMode } from "./online"
import type { Query, QueryFn, QueryState, SkipToken } from "./query"
import type { DefaultError } from "./register"
import type { RetryOptions } from "./retry"
import type { QueryClient } from "./query-client"
import { noop, resolve } from "./resolve"

/** A value, or a function that works it out from the query's current state. */
export type FromState<T, TData, TError = DefaultError> = T | ((state: QueryState<TData, TError>) => T)
/** `true`: when the data is stale. `"always"`: even when it is fresh. `false`: never. */
export type RefetchWhen = boolean | "always"

export interface QueryObserverOptions<TData, TError = DefaultError> extends RetryOptions<TError> {
	queryKey: QueryKey
	/** `skipToken` (from `@omnifront/query/options`) instead of a function disables the query, type-safely. */
	queryFn: QueryFn<TData> | SkipToken
	/**
	 * Ms data counts as fresh. Default 0 (stale immediately). Infinity = never stale, but still
	 * refetched when invalidated. `"static"` = never refetched at all once loaded.
	 */
	staleTime?: FromState<number | "static", TData, TError>
	/** Ms to keep the entry after the last observer leaves. */
	gcTime?: number
	/** Set false to never fetch automatically. Default true. */
	enabled?: FromState<boolean, TData, TError>
	/**
	 * What to do when a component starts watching. Default true: fetch if stale. `false` only
	 * loads data that is missing; `"always"` refetches fresh data too.
	 */
	refetchOnMount?: FromState<RefetchWhen, TData, TError> | undefined
	/** Refetch when the page becomes visible again. Default true (stale data only). */
	refetchOnWindowFocus?: FromState<RefetchWhen, TData, TError> | undefined
	/** Refetch when the network comes back. Default true (stale data only). */
	refetchOnReconnect?: FromState<RefetchWhen, TData, TError> | undefined
	/**
	 * Refetch every N ms while observed. Fetches even if the data is fresh. A function is asked again
	 * after every change, so it can stop the polling (`false`) once the data says so.
	 */
	refetchInterval?: FromState<number | false | undefined, TData, TError> | undefined
	/** Keep polling while the page is hidden. Default false. */
	refetchIntervalInBackground?: boolean | undefined
	/** What to do without a network. Default `"online"`: wait for it (the query is "paused"). */
	networkMode?: NetworkMode | undefined
	/** Free-form data handed to the query function as `context.meta`. */
	meta?: Record<string, unknown> | undefined
	/** Data to start with when the cache has none. Stored in the cache like fetched data. */
	initialData?: TData | (() => TData) | undefined
	/** When `initialData` was fetched (ms, same clock as the scheduler), so it can count as stale. Default: now. */
	initialDataUpdatedAt?: number | (() => number | undefined) | undefined
	/**
	 * Shown as `data` (with `isPlaceholderData: true`) while there is none. Never stored in the cache.
	 * A function receives the data this observer showed before, e.g. `keepPreviousData`.
	 */
	placeholderData?: TData | ((previousData: TData | undefined) => TData | undefined) | undefined
}

/** `placeholderData: keepPreviousData` keeps showing the previous key's data while the next loads. */
export const keepPreviousData = <TData>(previousData: TData | undefined): TData | undefined => previousData

export interface QueryResult<TData, TError = DefaultError> extends QueryState<TData, TError> {
	/** A request is running. Unlike the cache entry's own flag, this is false while it waits for the network. */
	isFetching: boolean
	/** `"fetching"`, `"paused"` (waiting for the network) or `"idle"`. */
	fetchStatus: "fetching" | "paused" | "idle"
	isStale: boolean
	/** `data` is the `placeholderData`, not real data. */
	isPlaceholderData: boolean
	/** No data yet (`status` is `"idle"` or `"loading"`). */
	isPending: boolean
	/** The first load is running: `isPending && isFetching`. */
	isLoading: boolean
	/** A background refetch is running: there is data and `isFetching`. */
	isRefetching: boolean
	isSuccess: boolean
	isError: boolean
	/** Failed with nothing to show. */
	isLoadingError: boolean
	/** A refetch failed; the previous data is still there. */
	isRefetchError: boolean
}

interface SnapshotSlot<TData, TError> {
	result?: QueryResult<TData, TError>
	source?: QueryState<TData, TError>
	optimistic?: boolean
	previous?: TData | undefined
}

// Longest delay setTimeout supports; longer waits are re-armed on expiry.
const MAX_TIMEOUT = 2 ** 31 - 1

/** What a UI subscribes to: one query's state plus freshness, with fetch-on-mount. */
export class QueryObserver<TData, TError = DefaultError> extends BaseSubscribable<QueryResult<TData, TError>> {
	private query: Query<TData, TError>
	private readonly live: SnapshotSlot<TData, TError> = {}
	private readonly server: SnapshotSlot<TData, TError> = {}
	private detachQuery: (() => void) | undefined
	private detachEnvironment: Array<() => void> = []
	private staleTimer: TimerHandle | undefined
	private pollTimer: TimerHandle | undefined
	private pollMs = 0
	private lastData: TData | undefined
	private options: QueryObserverOptions<TData, TError>

	constructor(
		private readonly client: QueryClient,
		options: QueryObserverOptions<TData, TError>,
	) {
		super()
		this.options = this.withDefaults(options)
		this.query = client.getQuery<TData, TError>(options.queryKey, this.options.gcTime)
		this.seed()
	}

	private withDefaults(options: QueryObserverOptions<TData, TError>): QueryObserverOptions<TData, TError> {
		return { ...(this.client.getDefaultOptions().queries as Partial<QueryObserverOptions<TData, TError>>), ...options }
	}

	/** `initialData` goes into the cache like fetched data, unless the cache already has some. */
	private seed(): void {
		const { initialData, initialDataUpdatedAt } = this.options
		if (initialData !== undefined && this.query.getSnapshot().data === undefined) {
			this.query.setData(resolve(initialData), resolve(initialDataUpdatedAt))
		}
	}

	private enabled(state: QueryState<TData, TError>): boolean {
		return typeof this.options.queryFn == "function" && resolve(this.options.enabled, state) !== false
	}

	private staleTime(state: QueryState<TData, TError>): number | "static" {
		return resolve(this.options.staleTime, state) ?? 0
	}

	/**
	 * Whether `option` (refetchOnMount / refetchOnWindowFocus / refetchOnReconnect) asks for a fetch now.
	 * Mounting is special: with `false` it still loads data that is missing.
	 */
	private wants(
		option: FromState<RefetchWhen, TData, TError> | undefined,
		state: QueryState<TData, TError>,
		isStale: boolean,
		mount?: boolean,
	): boolean {
		const when = resolve(option, state) ?? true
		return (
			this.enabled(state) &&
			((when === "always" && this.staleTime(state) !== "static") || (when ? isStale : !!mount && state.data === undefined))
		)
	}

	/**
	 * Same reference until the query state or its staleness changes.
	 * Before anyone subscribes, an entry that will be fetched on mount already reports
	 * `isFetching` (and `loading` if empty), so a first render doesn't flash an idle state.
	 */
	getSnapshot(): QueryResult<TData, TError> {
		const state = this.query.getSnapshot()
		const isStale = this.isStale(state)
		const optimistic = !state.isFetching && !this.hasListeners && this.wants(this.options.refetchOnMount, state, isStale, true)
		return this.view(this.live, state, isStale, optimistic)
	}

	/**
	 * What to render on the server and during hydration. It must not depend on the clock: the
	 * server and the browser disagree on "now", and a different `isStale` would be a hydration
	 * mismatch. So staleness is judged as of the moment the data arrived: stale only if
	 * `staleTime` is 0 (or the data is missing / invalidated). The live snapshot takes over
	 * right after hydration.
	 */
	getServerSnapshot(): QueryResult<TData, TError> {
		const state = this.query.getSnapshot()
		const isStale = this.isStale(state, true)
		const optimistic = !state.isFetching && this.wants(this.options.refetchOnMount, state, isStale, true)
		return this.view(this.server, state, isStale, optimistic)
	}

	private view(
		slot: SnapshotSlot<TData, TError>,
		state: QueryState<TData, TError>,
		isStale: boolean,
		optimistic: boolean,
	): QueryResult<TData, TError> {
		if (state.data !== undefined) this.lastData = state.data
		const previous = slot.result
		if (
			previous &&
			slot.source === state &&
			previous.isStale === isStale &&
			slot.optimistic === optimistic &&
			slot.previous === this.lastData
		) {
			return previous
		}
		slot.source = state
		slot.optimistic = optimistic
		slot.previous = this.lastData
		const base = optimistic
			? { ...state, status: state.status === "idle" ? ("loading" as const) : state.status, isFetching: true }
			: state
		// Placeholder: only while there is no real data. Computed here, not on every read, so a
		// placeholder function that builds a new object still gives a stable snapshot.
		const { placeholderData } = this.options
		const placeholder =
			state.data === undefined && placeholderData !== undefined ? resolve(placeholderData, this.lastData) : undefined
		const shown = placeholder === undefined ? base : { ...base, status: "success" as const, data: placeholder }
		const { status, isPaused } = shown
		const isFetching = shown.isFetching && !isPaused
		const isPending = status === "idle" || status === "loading"
		const isError = status === "error"
		const hasData = shown.data !== undefined
		slot.result = {
			...shown,
			isFetching,
			fetchStatus: isFetching ? "fetching" : isPaused ? "paused" : "idle",
			isStale,
			isPlaceholderData: placeholder !== undefined,
			isPending,
			isLoading: isPending && isFetching,
			isRefetching: !isPending && isFetching,
			isSuccess: status === "success",
			isError,
			isLoadingError: isError && !hasData,
			isRefetchError: isError && hasData,
		}
		return slot.result
	}

	/** For adapters that make a new observer per key: carry over what `placeholderData` calls "previous". */
	inherit(from: QueryObserver<TData, TError>): void {
		this.lastData = from.lastData
	}

	/** Observers retry failed fetches 3 times by default (unlike imperative fetchQuery). */
	private fetchQuery(): Promise<TData> {
		const { options } = this
		return this.query.fetch(options.queryFn as QueryFn<TData>, { ...options, retry: options.retry ?? 3 })
	}

	/**
	 * Manual refetch. Joins a request already in flight, or with `cancelRefetch: true` aborts it and
	 * starts over. Rejects on failure.
	 */
	refetch(options?: { cancelRefetch?: boolean | undefined }): Promise<TData> {
		if (options?.cancelRefetch) this.query.cancel()
		return this.fetchQuery()
	}

	/** Update options (e.g. a reactive key changed). Switches queries when the key differs. */
	setOptions(options: QueryObserverOptions<TData, TError>): void {
		const state = this.query.getSnapshot()
		const keyChanged = hashKey(options.queryKey) !== hashKey(this.options.queryKey)
		// Function-form options are new functions on every render: compare what they resolve to.
		const wasEnabled = this.enabled(state)
		const staleTime = this.staleTime(state)
		this.options = this.withDefaults(options)
		const active = this.hasListeners
		if (keyChanged) {
			if (active) this.detach()
			this.query = this.client.getQuery<TData, TError>(options.queryKey, this.options.gcTime)
			this.seed()
			if (active) {
				this.attach()
				this.notify()
			}
		} else if (active) {
			// UI hooks call this on every render, so only react to changes that matter:
			// never refetch just because data is stale (with staleTime 0 that would loop forever).
			if (!wasEnabled) this.maybeFetch()
			if (staleTime !== this.staleTime(state)) {
				this.scheduleStale()
				this.notify()
			}
			this.syncPoll()
		}
	}

	protected override onSubscribe(): void {
		this.attach()
	}

	protected override onUnsubscribe(): void {
		this.detach()
	}

	private attach(): void {
		this.detachQuery = this.query.subscribe(() => {
			this.scheduleStale()
			const state = this.query.getSnapshot()
			// Invalidated while we're watching: refetch now (respects `enabled`).
			if (state.isInvalidated && !state.isFetching) this.maybeFetch()
			this.syncPoll() // a `refetchInterval` function may answer differently now
			this.notify()
		})
		// Refetch stale data when the page is shown again / the network is back.
		this.detachEnvironment = (
			[
				[focusManager, "refetchOnWindowFocus"],
				[onlineManager, "refetchOnReconnect"],
			] as const
		).map(([manager, option]) =>
			manager.subscribe(() => {
				if (manager.getSnapshot()) this.maybeFetch(this.options[option])
			}),
		)
		this.scheduleStale()
		this.schedulePoll()
		this.maybeFetch(this.options.refetchOnMount, true)
	}

	private detach(): void {
		this.detachQuery?.()
		this.detachQuery = undefined
		this.detachEnvironment.forEach((off) => off())
		this.detachEnvironment = []
		this.clearStale()
		this.clearPoll()
	}

	private interval(): number {
		const ms = resolve(this.options.refetchInterval, this.query.getSnapshot())
		return ms && ms > 0 && this.hasListeners ? Math.min(ms, MAX_TIMEOUT) : 0
	}

	/** Re-arm the poll timer only when the interval really changed, so a re-render does not restart the countdown. */
	private syncPoll(): void {
		if (this.interval() !== this.pollMs) this.schedulePoll()
	}

	/** Polling: refetch every `refetchInterval` ms; ticks are skipped while the page is hidden unless asked otherwise. */
	private schedulePoll(): void {
		this.clearPoll()
		this.pollMs = this.interval()
		if (!this.pollMs) return
		this.pollTimer = this.client.scheduler.setTimeout(() => {
			this.pollTimer = undefined
			if (
				this.enabled(this.query.getSnapshot()) &&
				(this.options.refetchIntervalInBackground || focusManager.getSnapshot())
			) {
				this.fetchQuery().catch(noop)
			}
			this.schedulePoll()
		}, this.pollMs)
	}

	private clearPoll(): void {
		this.clearTimer(this.pollTimer)
		this.pollTimer = undefined
	}

	private clearTimer(handle: TimerHandle | undefined): void {
		if (handle !== undefined) this.client.scheduler.clearTimeout(handle)
	}

	/** `clockless` is for the server snapshot: judge staleness as of the moment the data arrived. */
	private isStale(state: QueryState<TData, TError>, clockless?: boolean): boolean {
		const staleTime = this.staleTime(state)
		if (state.dataUpdatedAt === undefined) return true
		if (staleTime === "static") return false
		return (
			state.isInvalidated ||
			(clockless ? staleTime <= 0 : this.client.scheduler.now() - state.dataUpdatedAt >= staleTime)
		)
	}

	private maybeFetch(option?: FromState<RefetchWhen, TData, TError>, mount?: boolean): void {
		const state = this.query.getSnapshot()
		// Errors live in the query state; don't leave an unhandled rejection behind.
		if (this.wants(option, state, this.isStale(state), mount)) this.fetchQuery().catch(noop)
	}

	/** Arm a timer for the moment fresh data turns stale, so listeners hear about it. */
	private scheduleStale(): void {
		this.clearStale()
		const state = this.query.getSnapshot()
		const { dataUpdatedAt } = state
		const staleTime = this.staleTime(state)
		if (dataUpdatedAt === undefined || staleTime === "static" || staleTime === Infinity) return
		const wait = dataUpdatedAt + staleTime - this.client.scheduler.now()
		if (wait <= 0) return
		this.staleTimer = this.client.scheduler.setTimeout(() => {
			this.staleTimer = undefined
			this.scheduleStale()
			this.notify()
		}, Math.min(wait, MAX_TIMEOUT))
	}

	private clearStale(): void {
		this.clearTimer(this.staleTimer)
		this.staleTimer = undefined
	}
}
