import { defaultScheduler, notifyManager, type Scheduler } from "@unicore/core"
import { hashKey, matchesKey, type QueryKey } from "./hash-key"
import { DEFAULT_GC_TIME, Query, type QueryFn, type QueryState } from "./query"
import type { RetryOptions } from "./retry"
import { noop, resolve } from "./resolve"

export interface QueryClientOptions {
	scheduler?: Scheduler
	/** Default gcTime for new cache entries (ms). */
	gcTime?: number
	/**
	 * Reuse unchanged parts of data across refetches (stable references). Pass `replaceEqualDeep` from
	 * `@unicore/query/structural`. Off by default to keep the core small.
	 */
	structuralSharing?: ((previous: unknown, next: unknown) => unknown) | undefined
}

export interface InvalidateFilter {
	/** Only queries whose key starts with / contains this key. Omit for all queries. */
	queryKey?: QueryKey
	/** Match `queryKey` exactly instead of as a prefix. */
	exact?: boolean
}

interface Entry {
	key: QueryKey
	query: Query<unknown>
}


export class QueryClient {
	readonly scheduler: Scheduler
	private readonly entries = new Map<string, Entry>()

	constructor(private readonly options: QueryClientOptions = {}) {
		this.scheduler = options.scheduler ?? defaultScheduler
	}

	/** Get the cache entry for `key`, creating it on first use. */
	getQuery<TData>(key: QueryKey, gcTime?: number): Query<TData> {
		const hash = hashKey(key)
		let entry = this.entries.get(hash)
		if (!entry) {
			const created: Entry = {
				key,
				query: new Query<unknown>(this.scheduler, {
					gcTime: gcTime ?? this.options.gcTime ?? DEFAULT_GC_TIME,
					structuralSharing: this.options.structuralSharing,
					onGc: () => {
						if (this.entries.get(hash) === created) this.entries.delete(hash)
					},
				}),
			}
			this.entries.set(hash, created)
			entry = created
		} else if (gcTime !== undefined) {
			entry.query.updateGcTime(gcTime)
		}
		return entry.query as Query<TData>
	}

	fetchQuery<TData>(key: QueryKey, fn: QueryFn<TData>, retry?: RetryOptions): Promise<TData> {
		return this.getQuery<TData>(key).fetch(fn, retry)
	}

	/** Abort the in-flight fetch for `key`, if any. */
	cancelQuery(key: QueryKey): void {
		this.entries.get(hashKey(key))?.query.cancel()
	}

	/**
	 * Mark matching queries outdated. Ones with active observers refetch right away;
	 * the rest refetch when next observed. Resolves when those refetches finish.
	 */
	invalidateQueries(filter: InvalidateFilter = {}): Promise<void> {
		const matched = this.match(filter)
		notifyManager.batch(() => {
			for (const query of matched) query.invalidate()
		})
		return Promise.all(matched.map((query) => query.settled())).then(noop)
	}

	/** Every cache entry with its key (used by dehydrate). */
	getQueries(): Array<{ key: QueryKey; query: Query<unknown> }> {
		return [...this.entries.values()]
	}

	getQueryState<TData>(key: QueryKey): QueryState<TData> | undefined {
		return (this.entries.get(hashKey(key))?.query as Query<TData> | undefined)?.getSnapshot()
	}

	getQueryData<TData>(key: QueryKey): TData | undefined {
		return this.getQueryState<TData>(key)?.data
	}

	/** Pass the new data, or a function from the old data (`undefined` if none) to the new. */
	setQueryData<TData>(key: QueryKey, data: TData | ((old: TData | undefined) => TData)): void {
		const query = this.getQuery<TData>(key)
		query.setData(resolve(data, query.getSnapshot().data))
	}

	clear(): void {
		for (const { query } of this.entries.values()) query.destroy()
		this.entries.clear()
	}

	private match({ queryKey, exact }: InvalidateFilter): Query<unknown>[] {
		const matched: Query<unknown>[] = []
		for (const [hash, entry] of this.entries) {
			if (!queryKey || (exact ? hash === hashKey(queryKey) : matchesKey(entry.key, queryKey))) {
				matched.push(entry.query)
			}
		}
		return matched
	}
}
