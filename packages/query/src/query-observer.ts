import { BaseSubscribable, type TimerHandle } from "@unicore/core"
import { hashKey, type QueryKey } from "./hash-key"
import type { Query, QueryFn, QueryState } from "./query"
import type { RetryOptions } from "./retry"
import type { QueryClient } from "./query-client"

export interface QueryObserverOptions<TData> extends RetryOptions {
	queryKey: QueryKey
	queryFn: QueryFn<TData>
	/** Ms data counts as fresh. Default 0 (stale immediately). Infinity = never stale. */
	staleTime?: number
	/** Ms to keep the entry after the last observer leaves. */
	gcTime?: number
	/** Set false to never fetch automatically. Default true. */
	enabled?: boolean
}

export interface QueryResult<TData> extends QueryState<TData> {
	isStale: boolean
}

// Longest delay setTimeout supports; longer waits are re-armed on expiry.
interface SnapshotSlot<TData> {
	result?: QueryResult<TData>
	source?: QueryState<TData>
	optimistic?: boolean
}

const MAX_TIMEOUT = 2 ** 31 - 1
const noop = (): void => {}

/** What a UI subscribes to: one query's state plus freshness, with fetch-on-mount. */
export class QueryObserver<TData> extends BaseSubscribable<QueryResult<TData>> {
	private query: Query<TData>
	private readonly live: SnapshotSlot<TData> = {}
	private readonly server: SnapshotSlot<TData> = {}
	private detachQuery: (() => void) | undefined
	private staleTimer: TimerHandle | undefined

	constructor(
		private readonly client: QueryClient,
		private options: QueryObserverOptions<TData>,
	) {
		super()
		this.query = client.getQuery<TData>(options.queryKey, options.gcTime)
	}

	/**
	 * Same reference until the query state or its staleness changes.
	 * Before anyone subscribes, an entry that will be fetched on mount already reports
	 * `isFetching` (and `loading` if empty), so a first render doesn't flash an idle state.
	 */
	getSnapshot(): QueryResult<TData> {
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
	getServerSnapshot(): QueryResult<TData> {
		const state = this.query.getSnapshot()
		const isStale = state.isInvalidated || state.dataUpdatedAt === undefined || (this.options.staleTime ?? 0) <= 0
		const optimistic = isStale && !state.isFetching && this.options.enabled !== false
		return this.view(this.server, state, isStale, optimistic)
	}

	private view(
		slot: SnapshotSlot<TData>,
		state: QueryState<TData>,
		isStale: boolean,
		optimistic: boolean,
	): QueryResult<TData> {
		const previous = slot.result
		if (previous && slot.source === state && previous.isStale === isStale && slot.optimistic === optimistic) {
			return previous
		}
		slot.source = state
		slot.optimistic = optimistic
		slot.result = optimistic
			? { ...state, status: state.status === "idle" ? "loading" : state.status, isFetching: true, isStale }
			: { ...state, isStale }
		return slot.result
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
	setOptions(options: QueryObserverOptions<TData>): void {
		const previous = this.options
		const keyChanged = hashKey(options.queryKey) !== hashKey(previous.queryKey)
		this.options = options
		const active = this.hasListeners
		if (keyChanged) {
			if (active) this.detach()
			this.query = this.client.getQuery<TData>(options.queryKey, options.gcTime)
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
		this.scheduleStale()
		this.maybeFetch()
	}

	private detach(): void {
		this.detachQuery?.()
		this.detachQuery = undefined
		this.clearStale()
	}

	private isStale(state: QueryState<TData>): boolean {
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
		if (this.staleTimer !== undefined) this.client.scheduler.clearTimeout(this.staleTimer)
		this.staleTimer = undefined
	}
}
