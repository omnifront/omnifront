import { hashKey, QueryObserver, type DefaultError, type QueryObserverOptions, type QueryResult } from "@omnifront/query"
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react"
import { useQueryClient } from "./provider"

export interface UseQueryResult<TData, TError = DefaultError> extends QueryResult<TData, TError> {
	/** Joins a request in flight; `{ cancelRefetch: true }` aborts it and starts over. */
	refetch: (options?: { cancelRefetch?: boolean | undefined }) => Promise<TData>
}

export type UseQueryOptions<TQueryFnData, TError = DefaultError, TData = TQueryFnData> = QueryObserverOptions<TQueryFnData, TError> & {
	/**
	 * Derive what the component needs from the cached data. `data` (and `refetch`) give the derived
	 * value; the cache keeps the original. Runs when the data or the function changes, so pass a
	 * stable function (defined outside the component, or with `useCallback`) to keep it memoized.
	 */
	select?: ((data: TQueryFnData) => TData) | undefined
	/**
	 * Throw the error during render, so the nearest error boundary shows it, instead of returning it:
	 * `true` for every error, or a function that says which. Only a settled failure throws (not one
	 * that is being retried or refetched). `QueryErrorResetBoundary` (`@omnifront/react/errors`)
	 * lets the boundary's retry button load the query again.
	 */
	throwOnError?: boolean | ((error: TError) => boolean) | undefined
}

/** `select(data)`, memoized on both. React's own memo does the job: nothing about it lives in the cache. */
export function useSelected<TQueryFnData, TData>(
	data: TQueryFnData | undefined,
	select: ((data: TQueryFnData) => TData) | undefined,
): TData | undefined {
	return useMemo(() => (select && data !== undefined ? select(data) : (data as TData | undefined)), [data, select])
}

/** The observer behind a hook and its current snapshot. Shared by useQuery and useSuspenseQuery. */
export function useObservedQuery<TData, TError = DefaultError>(
	options: QueryObserverOptions<TData, TError>,
): [QueryObserver<TData, TError>, QueryResult<TData, TError>] {
	const client = useQueryClient()
	const hash = hashKey(options.queryKey)

	// One observer per (client, key). A new key means a new observer, so rendering never
	// touches an observer that is already subscribed; React just re-subscribes to the new one.
	// `options` is intentionally not a dependency: other option changes are synced in the effect below.
	const committed = useRef<QueryObserver<TData, TError> | undefined>(undefined)
	const observer = useMemo(() => {
		const next = new QueryObserver(client, options)
		if (committed.current) next.inherit(committed.current) // keepPreviousData across keys
		return next
	}, [client, hash])
	useEffect(() => {
		committed.current = observer
	}, [observer])

	// Same key, other options (queryFn, staleTime, enabled, ...): apply after commit.
	useEffect(() => observer.setOptions(options))

	// Bound on purpose: getSnapshot is a method and React calls it detached.
	const getSnapshot = useCallback(() => observer.getSnapshot(), [observer])
	// On the server and while hydrating React uses this one. It never looks at the clock, so the
	// browser's first render produces the same markup the server did.
	const getServerSnapshot = useCallback(() => observer.getServerSnapshot(), [observer])
	return [observer, useSyncExternalStore(observer.subscribe, getSnapshot, getServerSnapshot)]
}

export function useQuery<TQueryFnData, TError = DefaultError, TData = TQueryFnData>(
	options: UseQueryOptions<TQueryFnData, TError, TData>,
): UseQueryResult<TData, TError> {
	const [observer, snapshot] = useObservedQuery<TQueryFnData, TError>(options)
	const data = useSelected(snapshot.data, options.select)
	// The latest `select` for `refetch`, without making the returned object depend on its identity.
	const select = useRef(options.select)
	useEffect(() => {
		select.current = options.select
	})
	const result = useMemo(
		() =>
			({
				...snapshot,
				data,
				refetch: (o) => observer.refetch(o).then((raw) => (select.current ? select.current(raw) : raw)),
			}) as UseQueryResult<TData, TError>,
		[snapshot, data, observer],
	)
	const { throwOnError: t } = options
	// A reset (invalidated) failure is let through: the query is about to load again.
	if (t && snapshot.status === "error" && !snapshot.isFetching && !snapshot.isInvalidated && (t === true || t(snapshot.error as TError))) throw snapshot.error
	return result
}
