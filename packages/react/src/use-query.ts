import { hashKey, QueryObserver, type QueryObserverOptions, type QueryResult } from "@unicore/query"
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react"
import { useQueryClient } from "./provider"

export interface UseQueryResult<TData> extends QueryResult<TData> {
	refetch: () => Promise<TData>
}

export function useQuery<TData>(options: QueryObserverOptions<TData>): UseQueryResult<TData> {
	const client = useQueryClient()
	const hash = hashKey(options.queryKey)

	// One observer per (client, key). A new key means a new observer, so rendering never
	// touches an observer that is already subscribed; React just re-subscribes to the new one.
	// `options` is intentionally not a dependency: other option changes are synced in the effect below.
	const observer = useMemo(() => new QueryObserver(client, options), [client, hash])

	// Same key, other options (queryFn, staleTime, enabled, ...): apply after commit.
	useEffect(() => observer.setOptions(options))

	// Bound on purpose: getSnapshot is a method and React calls it detached.
	const getSnapshot = useCallback(() => observer.getSnapshot(), [observer])
	const snapshot = useSyncExternalStore(observer.subscribe, getSnapshot, getSnapshot)

	return useMemo(() => ({ ...snapshot, refetch: () => observer.refetch() }), [snapshot, observer])
}
