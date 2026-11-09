import { notifyManager } from "@omnifront/core"
import { hashKey, matchesKey, type QueryKey } from "./hash-key"
import { CancelledError } from "./cancelled-error"
import type { Query, QueryFn, QueryState } from "./query"
import type { QueryClient } from "./query-client"
import type { RetryOptions } from "./retry"
import { noop, resolve } from "./resolve"

/** What a `predicate` sees of a cache entry. */
export interface QueryInfo {
	queryKey: QueryKey
	state: QueryState
	/** Something is subscribed to the entry (a mounted component). */
	observed: boolean
}

export interface QueryFilters {
	/** Only queries whose key starts with / contains this key. Omit for all queries. */
	queryKey?: QueryKey | undefined
	/** Match `queryKey` exactly instead of as a prefix. */
	exact?: boolean | undefined
	/** `"active"`: observed entries only. `"inactive"`: unobserved only. Default `"all"`. */
	type?: "all" | "active" | "inactive" | undefined
	/**
	 * `true`: entries that are invalidated or hold no data. `false`: the others. `staleTime` belongs to
	 * each observer, so the cache cannot tell that data merely got old.
	 */
	stale?: boolean | undefined
	/** `"fetching"`: a request is in flight. `"idle"`: none is. */
	fetchStatus?: "fetching" | "idle" | undefined
	/** Runs last, on the entries the other filters let through. */
	predicate?: ((query: QueryInfo) => boolean) | undefined
}

interface Entry {
	key: QueryKey
	query: Query<unknown>
}

/** Whether one cache entry (as returned by `client.getQueries()`) passes `filters`. */
export function matchQuery({ key, query }: Entry, filters: QueryFilters): boolean {
	const { queryKey, exact, type, stale, fetchStatus, predicate } = filters
	if (queryKey && !(exact ? hashKey(key) === hashKey(queryKey) : matchesKey(key, queryKey))) return false
	const state = query.getSnapshot()
	const observed = query.hasListeners
	if (type && type !== "all" && (type === "active") !== observed) return false
	if (stale !== undefined && stale !== (state.isInvalidated || state.dataUpdatedAt === undefined)) return false
	if (fetchStatus && (fetchStatus === "fetching") !== state.isFetching) return false
	return !predicate || predicate({ queryKey: key, state, observed })
}

/** Every cache entry that passes `filters` (all of them without filters). */
export function findQueries(client: QueryClient, filters: QueryFilters = {}): Entry[] {
	return client.getQueries().filter((entry) => matchQuery(entry, filters))
}

function invalidate(matched: Entry[]): Promise<void> {
	notifyManager.batch(() => {
		for (const { query } of matched) query.invalidate()
	})
	return Promise.all(matched.map(({ query }) => query.settled())).then(noop)
}

/**
 * `client.invalidateQueries` with the full set of filters: mark the matches outdated. Observed ones
 * refetch right away, the rest when next observed. Resolves when those refetches finish.
 */
export function invalidateQueries(client: QueryClient, filters: QueryFilters = {}): Promise<void> {
	return invalidate(findQueries(client, filters))
}

/**
 * Refetch the matching queries that are on screen (observed and enabled), fresh or not. Unobserved
 * entries are left alone: the cache keeps no query function for them. Never rejects; failures are in
 * each query's state.
 */
export function refetchQueries(client: QueryClient, filters: QueryFilters = {}): Promise<void> {
	return invalidate(findQueries(client, { ...filters, type: "active" }))
}

/** Abort the in-flight fetch of every match. Each query goes back to the state it had before. */
export function cancelQueries(client: QueryClient, filters: QueryFilters = {}): void {
	notifyManager.batch(() => {
		for (const { query } of findQueries(client, filters)) query.cancel()
	})
}

/** The data of every match, with its key. */
export function getQueriesData<TData = unknown>(
	client: QueryClient,
	filters: QueryFilters = {},
): Array<[QueryKey, TData | undefined]> {
	return findQueries(client, filters).map(({ key, query }) => [key, query.getSnapshot().data as TData | undefined])
}

/**
 * Update the data of every match. The updater gets the old data (`undefined` if none); returning
 * `undefined` leaves that entry untouched. Returns what `getQueriesData` would afterwards.
 */
export function setQueriesData<TData>(
	client: QueryClient,
	filters: QueryFilters,
	data: TData | ((old: TData | undefined) => TData | undefined),
): Array<[QueryKey, TData | undefined]> {
	const matched = findQueries(client, filters) as unknown as Array<{ key: QueryKey; query: Query<TData> }>
	notifyManager.batch(() => {
		for (const { query } of matched) {
			const next = resolve(data, query.getSnapshot().data)
			if (next !== undefined) query.setData(next)
		}
	})
	return matched.map(({ key, query }) => [key, query.getSnapshot().data])
}

export interface EnsureQueryDataOptions<TData> extends RetryOptions {
	queryKey: QueryKey
	queryFn: QueryFn<TData>
	/** With `revalidateIfStale`: how old (ms) cached data may be before it is refetched. Default 0. */
	staleTime?: number | undefined
	/** Return the cached data but also refetch it in the background when it is stale. */
	revalidateIfStale?: boolean | undefined
}

/**
 * The cached data when there is some (however old), otherwise fetch it. For route loaders: the page
 * can render at once, and the component's own query decides whether to refresh. Rejects if the fetch fails.
 */
export function ensureQueryData<TData>(client: QueryClient, options: EnsureQueryDataOptions<TData>): Promise<TData> {
	const { queryKey, queryFn } = options
	const { data, dataUpdatedAt, isInvalidated } = client.getQuery<TData>(queryKey).getSnapshot()
	if (data === undefined) return client.fetchQuery(queryKey, queryFn, options)
	const age = client.scheduler.now() - (dataUpdatedAt ?? 0)
	if (options.revalidateIfStale && (isInvalidated || age >= (options.staleTime ?? 0))) {
		client.fetchQuery(queryKey, queryFn, options).catch(noop)
	}
	return Promise.resolve(data)
}

/** A fetch promise rejected because the query was cancelled (not because it failed). */
export function isCancelledError(error: unknown): error is CancelledError {
	return error instanceof CancelledError
}
