import { defaultScheduler, type Scheduler } from "@unicore/core"
import { hashKey, type QueryKey } from "./hash-key"
import { Query, type QueryState } from "./query"

export interface QueryClientOptions {
	scheduler?: Scheduler
}

export class QueryClient {
	readonly scheduler: Scheduler
	private readonly queries = new Map<string, Query<unknown>>()

	constructor(options: QueryClientOptions = {}) {
		this.scheduler = options.scheduler ?? defaultScheduler
	}

	/** Get the cache entry for `key`, creating it on first use. */
	getQuery<TData>(key: QueryKey): Query<TData> {
		const hash = hashKey(key)
		let query = this.queries.get(hash)
		if (!query) {
			query = new Query<unknown>(this.scheduler)
			this.queries.set(hash, query)
		}
		return query as Query<TData>
	}

	fetchQuery<TData>(key: QueryKey, fn: () => Promise<TData>): Promise<TData> {
		return this.getQuery<TData>(key).fetch(fn)
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
		this.queries.clear()
	}
}
