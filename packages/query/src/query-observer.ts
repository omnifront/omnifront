import { BaseSubscribable, type TimerHandle } from "@unicore/core"
import { hashKey, type QueryKey } from "./hash-key"
import type { Query, QueryState } from "./query"
import type { QueryClient } from "./query-client"

export interface QueryObserverOptions<TData> {
	queryKey: QueryKey
	queryFn: () => Promise<TData>
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
const MAX_TIMEOUT = 2 ** 31 - 1
const noop = (): void => {}

/** What a UI subscribes to: one query's state plus freshness, with fetch-on-mount. */
export class QueryObserver<TData> extends BaseSubscribable<QueryResult<TData>> {
	private query: Query<TData>
	private result: QueryResult<TData> | undefined
	private source: QueryState<TData> | undefined
	private detachQuery: (() => void) | undefined
	private staleTimer: TimerHandle | undefined

	constructor(
		private readonly client: QueryClient,
		private options: QueryObserverOptions<TData>,
	) {
		super()
		this.query = client.getQuery<TData>(options.queryKey, options.gcTime)
	}

	/** Same reference until the query state or its staleness changes. */
	getSnapshot(): QueryResult<TData> {
		const state = this.query.getSnapshot()
		const isStale = this.isStale(state)
		if (this.result && this.source === state && this.result.isStale === isStale) return this.result
		this.source = state
		this.result = { ...state, isStale }
		return this.result
	}

	/** Manual refetch. Joins a request already in flight. Rejects on failure. */
	refetch(): Promise<TData> {
		return this.query.fetch(this.options.queryFn)
	}

	/** Update options (e.g. a reactive key changed). Switches queries when the key differs. */
	setOptions(options: QueryObserverOptions<TData>): void {
		const keyChanged = hashKey(options.queryKey) !== hashKey(this.options.queryKey)
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
			this.scheduleStale()
			this.maybeFetch()
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
		if (state.dataUpdatedAt === undefined) return true
		return this.client.scheduler.now() - state.dataUpdatedAt >= (this.options.staleTime ?? 0)
	}

	private maybeFetch(): void {
		if (this.options.enabled === false || !this.isStale(this.query.getSnapshot())) return
		// Errors live in the query state; don't leave an unhandled rejection behind.
		this.query.fetch(this.options.queryFn).catch(noop)
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
