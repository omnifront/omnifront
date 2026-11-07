import { defaultScheduler, type Scheduler } from "@unicore/core"
import { hashKey, type QueryKey } from "./hash-key"
import { DEFAULT_GC_TIME, Query, type QueryFn, type QueryState } from "./query"
import type { RetryOptions } from "./retry"

export interface QueryClientOptions {
	scheduler?: Scheduler
	/** Default gcTime for new cache entries (ms). */
	gcTime?: number
}

export class QueryClient {
	readonly scheduler: Scheduler
	private readonly defaultGcTime: number
	private readonly queries = new Map<string, Query<unknown>>()

	constructor(options: QueryClientOptions = {}) {
		this.scheduler = options.scheduler ?? defaultScheduler
		this.defaultGcTime = options.gcTime ?? DEFAULT_GC_TIME
	}

	/** Get the cache entry for `key`, creating it on first use. */
	getQuery<TData>(key: QueryKey, gcTime?: number): Query<TData> {
		const hash = hashKey(key)
		let query = this.queries.get(hash)
		if (!query) {
			const created: Query<unknown> = new Query<unknown>(this.scheduler, {
				gcTime: gcTime ?? this.defaultGcTime,
				onGc: () => {
					if (this.queries.get(hash) === created) this.queries.delete(hash)
				},
			})
			this.queries.set(hash, created)
			query = created
		} else if (gcTime !== undefined) {
			query.updateGcTime(gcTime)
		}
		return query as Query<TData>
	}

	fetchQuery<TData>(key: QueryKey, fn: QueryFn<TData>, retry?: RetryOptions): Promise<TData> {
		return this.getQuery<TData>(key).fetch(fn, retry)
	}

	/** Abort the in-flight fetch for `key`, if any. */
	cancelQuery(key: QueryKey): void {
		this.queries.get(hashKey(key))?.cancel()
	}

	getQueryState<TData>(key: QueryKey): QueryState<TData> | undefined {
		return (this.queries.get(hashKey(key)) as Query<TData> | undefined)?.getSnapshot()
	}

	getQueryData<TData>(key: QueryKey): TData | undefined {
		return this.getQueryState<TData>(key)?.data
	}

	setQueryData<TData>(key: QueryKey, data: TData): void {
		this.getQuery<TData>(key).setData(data)
	}

	clear(): void {
		for (const query of this.queries.values()) query.destroy()
		this.queries.clear()
	}
}
