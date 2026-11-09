import { BaseSubscribable, type TimerHandle } from "@omnifront/core"
import { focusManager, onlineManager } from "./environment"
import { hashKey, type QueryKey } from "./hash-key"
import type { Query, QueryFn, QueryState } from "./query"
import type { DefaultError } from "./register"
import type { RetryOptions } from "./retry"
import type { QueryClient } from "./query-client"
import { noop, resolve } from "./resolve"

export interface QueryObserverOptions<TData, TError = DefaultError> extends RetryOptions<TError> {
	queryKey: QueryKey
	queryFn: QueryFn<TData>
	/** Ms data counts as fresh. Default 0 (stale immediately). Infinity = never stale. */
	staleTime?: number
	/** Ms to keep the entry after the last observer leaves. */
	gcTime?: number
	/** Set false to never fetch automatically. Default true. */
	enabled?: boolean
	/** Refetch stale data when the page becomes visible again. Default true. */
	refetchOnWindowFocus?: boolean | undefined
	/** Refetch stale data when the network comes back. Default true. */
	refetchOnReconnect?: boolean | undefined
	/** Refetch every N ms while observed and the page is visible. Fetches even if the data is fresh. */
	refetchInterval?: number | undefined
	/** Data to start with when the cache has none. Stored in the cache like fetched data. */
	initialData?: TData | (() => TData) | undefined
	/**
	 * Shown as `data` (with `isPlaceholderData: true`) while there is none. Never stored in the cache.
	 * A function receives the data this observer showed before, e.g. `keepPreviousData`.
	 */
	placeholderData?: TData | ((previousData: TData | undefined) => TData | undefined) | undefined
}

/** `placeholderData: keepPreviousData` keeps showing the previous key's data while the next loads. */
export const keepPreviousData = <TData>(previousData: TData | undefined): TData | undefined => previousData

export interface QueryResult<TData, TError = DefaultError> extends QueryState<TData, TError> {
	isStale: boolean
	/** `data` is the `placeholderData`, not real data. */
	isPlaceholderData: boolean
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
	private lastData: TData | undefined

	constructor(
		private readonly client: QueryClient,
		private options: QueryObserverOptions<TData, TError>,
	) {
		super()
		this.query = client.getQuery<TData, TError>(options.queryKey, options.gcTime)
		this.seed()
	}

	/** `initialData` goes into the cache like fetched data, unless the cache already has some. */
	private seed(): void {
		const { initialData } = this.options
		if (initialData !== undefined && this.query.getSnapshot().data === undefined) {
			this.query.setData(resolve(initialData))
		}
	}

	/**
	 * Same reference until the query state or its staleness changes.
	 * Before anyone subscribes, an entry that will be fetched on mount already reports
	 * `isFetching` (and `loading` if empty), so a first render doesn't flash an idle state.
	 */
	getSnapshot(): QueryResult<TData, TError> {
		const state = this.query.getSnapshot()
		const isStale = this.isStale(state)
		const optimistic = isStale && !state.isFetching && !this.hasListeners && this.options.enabled !== false
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
		const isStale = state.isInvalidated || state.dataUpdatedAt === undefined || (this.options.staleTime ?? 0) <= 0
		const optimistic = isStale && !state.isFetching && this.options.enabled !== false
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
		slot.result =
			placeholder === undefined
				? { ...base, isStale, isPlaceholderData: false }
				: { ...base, status: "success", data: placeholder, isStale, isPlaceholderData: true }
		return slot.result
	}

	/** For adapters that make a new observer per key: carry over what `placeholderData` calls "previous". */
	inherit(from: QueryObserver<TData, TError>): void {
		this.lastData = from.lastData
	}

	/** Observers retry failed fetches 3 times by default (unlike imperative fetchQuery). */
	private fetchQuery(): Promise<TData> {
		const { queryFn, retry, retryDelay } = this.options
		return this.query.fetch(queryFn, { retry: retry ?? 3, retryDelay })
	}

	/** Manual refetch. Joins a request already in flight. Rejects on failure. */
	refetch(): Promise<TData> {
		return this.fetchQuery()
	}

	/** Update options (e.g. a reactive key changed). Switches queries when the key differs. */
	setOptions(options: QueryObserverOptions<TData, TError>): void {
		const previous = this.options
		const keyChanged = hashKey(options.queryKey) !== hashKey(previous.queryKey)
		this.options = options
		const active = this.hasListeners
		if (keyChanged) {
			if (active) this.detach()
			this.query = this.client.getQuery<TData, TError>(options.queryKey, options.gcTime)
			this.seed()
			if (active) {
				this.attach()
				this.notify()
			}
		} else if (active) {
			// UI hooks call this on every render, so only react to changes that matter:
			// never refetch just because data is stale (with staleTime 0 that would loop forever).
			if (previous.enabled === false && options.enabled !== false) this.maybeFetch()
			if (previous.staleTime !== options.staleTime) {
				this.scheduleStale()
				this.notify()
			}
			if (previous.refetchInterval !== options.refetchInterval) this.schedulePoll()
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
				if (manager.getSnapshot() && this.options[option] !== false) this.maybeFetch()
			}),
		)
		this.scheduleStale()
		this.schedulePoll()
		this.maybeFetch()
	}

	private detach(): void {
		this.detachQuery?.()
		this.detachQuery = undefined
		this.detachEnvironment.forEach((off) => off())
		this.detachEnvironment = []
		this.clearStale()
		this.clearPoll()
	}

	/** Polling: refetch every `refetchInterval` ms, skipping ticks while the page is hidden. */
	private schedulePoll(): void {
		this.clearPoll()
		const { refetchInterval } = this.options
		if (!(refetchInterval && refetchInterval > 0) || !this.hasListeners) return
		this.pollTimer = this.client.scheduler.setTimeout(() => {
			this.pollTimer = undefined
			if (this.options.enabled !== false && focusManager.getSnapshot()) this.fetchQuery().catch(noop)
			this.schedulePoll()
		}, Math.min(refetchInterval, MAX_TIMEOUT))
	}

	private clearPoll(): void {
		this.clearTimer(this.pollTimer)
		this.pollTimer = undefined
	}

	private clearTimer(handle: TimerHandle | undefined): void {
		if (handle !== undefined) this.client.scheduler.clearTimeout(handle)
	}

	private isStale(state: QueryState<TData, TError>): boolean {
		if (state.isInvalidated || state.dataUpdatedAt === undefined) return true
		return this.client.scheduler.now() - state.dataUpdatedAt >= (this.options.staleTime ?? 0)
	}

	private maybeFetch(): void {
		if (this.options.enabled === false || !this.isStale(this.query.getSnapshot())) return
		// Errors live in the query state; don't leave an unhandled rejection behind.
		this.fetchQuery().catch(noop)
	}

	/** Arm a timer for the moment fresh data turns stale, so listeners hear about it. */
	private scheduleStale(): void {
		this.clearStale()
		const { dataUpdatedAt } = this.query.getSnapshot()
		const staleTime = this.options.staleTime ?? 0
		if (dataUpdatedAt === undefined || staleTime === Infinity) return
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
