import { defaultScheduler, notifyManager, type Scheduler } from "@omnifront/core"
import { hashKey, matchesKey, type DataTag, type QueryKey, type UntaggedKey } from "./hash-key"
import { DEFAULT_GC_TIME, Query, type FetchOptions, type QueryFn, type QueryState } from "./query"
import type { QueryObserverOptions } from "./query-observer"
import type { DefaultError } from "./register"
import type { RetryOptions } from "./retry"
import { noop, resolve } from "./resolve"

/** Options every query gets unless it sets its own. */
export interface DefaultOptions {
	queries?:
		| Partial<Omit<QueryObserverOptions<unknown>, "queryKey" | "queryFn" | "initialData" | "initialDataUpdatedAt" | "placeholderData">>
		| undefined
}

/** `fetchQuery` as one object, as in TanStack Query. */
export interface FetchQueryOptions<TData, TError = DefaultError> extends FetchOptions<TError> {
	queryKey: QueryKey
	queryFn: QueryFn<TData>
	/** Return the cached data instead of fetching when it is younger than this (ms). Default 0: always fetch. */
	staleTime?: number | undefined
}

export interface QueryClientOptions {
	/** Defaults for every observer (the hooks) of this client. */
	defaultOptions?: DefaultOptions | undefined
	scheduler?: Scheduler
	/** Default gcTime for new cache entries (ms). */
	gcTime?: number
	/**
	 * Reuse unchanged parts of data across refetches (stable references). Pass `replaceEqualDeep` from
	 * `@omnifront/query/structural`. Off by default to keep the core small.
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
	private readonly changeListeners = new Set<() => void>()
	private defaults: DefaultOptions

	constructor(private readonly options: QueryClientOptions = {}) {
		this.scheduler = options.scheduler ?? defaultScheduler
		this.defaults = options.defaultOptions ?? {}
	}

	getDefaultOptions(): DefaultOptions {
		return this.defaults
	}

	/** Applies to observers created (or given new options) from now on. */
	setDefaultOptions(defaults: DefaultOptions): void {
		this.defaults = defaults
	}

	/** Get the cache entry for `key`, creating it on first use. */
	getQuery<TData, TError = DefaultError>(key: QueryKey, gcTime?: number): Query<TData, TError> {
		const hash = hashKey(key)
		let entry = this.entries.get(hash)
		if (!entry) {
			const created: Entry = {
				key,
				query: new Query<unknown>(this.scheduler, {
					gcTime: gcTime ?? this.options.gcTime ?? DEFAULT_GC_TIME,
					structuralSharing: this.options.structuralSharing,
					queryKey: key,
					client: this,
					onChange: () => this.emit(),
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
		return entry.query as unknown as Query<TData, TError>
	}

	/**
	 * Fetch into the cache, joining a request already in flight. Rejects on failure. The object form
	 * also takes `staleTime`: cached data younger than that is returned without fetching.
	 */
	fetchQuery<TData, TError = DefaultError>(options: FetchQueryOptions<TData, TError>): Promise<TData>
	fetchQuery<TData, TError = DefaultError>(key: QueryKey, fn: QueryFn<TData>, retry?: RetryOptions<TError>): Promise<TData>
	fetchQuery<TData, TError>(
		first: QueryKey | FetchQueryOptions<TData, TError>,
		fn?: QueryFn<TData>,
		retry?: RetryOptions<TError>,
	): Promise<TData> {
		const options = (Array.isArray(first) ? { ...retry, queryKey: first, queryFn: fn } : first) as FetchQueryOptions<TData, TError>
		const query = this.getQuery<TData, TError>(options.queryKey)
		const { data, dataUpdatedAt, isInvalidated } = query.getSnapshot()
		return dataUpdatedAt !== undefined && !isInvalidated && this.scheduler.now() - dataUpdatedAt < (options.staleTime ?? 0)
			? Promise.resolve(data as TData)
			: query.fetch(options.queryFn, options)
	}

	/** Abort the in-flight fetch for `key`, if any. */
	cancelQuery(key: QueryKey): void {
		this.entries.get(hashKey(key))?.query.cancel()
	}

	/** Drop the entry for `key`. Meant for entries nothing is watching; a mounted component keeps its own copy. */
	removeQuery(key: QueryKey): void {
		const hash = hashKey(key)
		this.entries.get(hash)?.query.destroy()
		if (this.entries.delete(hash)) this.emit()
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

	// The first overload of each reads the data type off a key made by `queryOptions` (types only).
	getQueryState<TData>(key: DataTag<QueryKey, TData>): QueryState<TData> | undefined
	getQueryState<TData = unknown, TError = DefaultError>(key: QueryKey): QueryState<TData, TError> | undefined
	getQueryState(key: QueryKey): QueryState | undefined {
		return this.entries.get(hashKey(key))?.query.getSnapshot()
	}

	getQueryData<TData>(key: DataTag<QueryKey, TData>): TData | undefined
	getQueryData<TData = unknown>(key: QueryKey): TData | undefined
	getQueryData(key: QueryKey): unknown {
		return this.getQueryState(key)?.data
	}

	/** Pass the new data, or a function from the old data (`undefined` if none) to the new. */
	setQueryData<TData>(key: DataTag<QueryKey, TData>, data: TData | ((old: TData | undefined) => TData)): void
	setQueryData<TData, TKey extends QueryKey = QueryKey>(
		key: UntaggedKey<TKey>,
		data: TData | ((old: TData | undefined) => TData),
	): void
	setQueryData<TData>(key: QueryKey, data: TData | ((old: TData | undefined) => TData)): void {
		const query = this.getQuery<TData>(key)
		query.setData(resolve(data, query.getSnapshot().data))
	}

	/**
	 * Run `listener` after any cache entry changes, and once when the cache is cleared. Subscribing to
	 * the client (not to each query) keeps unobserved entries collectable. Used by `@omnifront/query/activity`.
	 */
	onChange(listener: () => void): () => void {
		this.changeListeners.add(listener)
		return () => void this.changeListeners.delete(listener)
	}

	clear(): void {
		for (const { query } of this.entries.values()) query.destroy()
		this.entries.clear()
		this.emit()
	}

	private emit(): void {
		for (const listener of this.changeListeners) listener()
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
