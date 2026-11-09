import { hashKey, QueryObserver, type DefaultError, type QueryObserverOptions, type QueryResult } from "@omnifront/query"
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react"
import { useQueryClient } from "./provider"

export interface UseQueryResult<TData, TError = DefaultError> extends QueryResult<TData, TError> {
	refetch: () => Promise<TData>
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

export function useQuery<TData, TError = DefaultError>(options: QueryObserverOptions<TData, TError>): UseQueryResult<TData, TError> {
	const [observer, snapshot] = useObservedQuery(options)
	return useMemo(() => ({ ...snapshot, refetch: () => observer.refetch() }), [snapshot, observer])
}
