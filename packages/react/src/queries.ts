import { combine } from "@unicore/core"
import { hashKey, QueryObserver, type QueryObserverOptions } from "@unicore/query"
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react"
import { useQueryClient } from "./provider"
import type { UseQueryResult } from "./use-query"

export type UseQueriesResults<T extends readonly unknown[]> = { [K in keyof T]: UseQueryResult<T[K]> }

/**
 * Run several queries at once. Pass a fixed tuple (each result keeps its own data type) or an array
 * built at run time. For dependent queries, set `enabled` on the later ones.
 *
 *   const [user, posts] = useQueries([
 *     { queryKey: ["user", id], queryFn: () => loadUser(id) },
 *     { queryKey: ["posts", id], queryFn: () => loadPosts(id), enabled: userLoaded },
 *   ])
 */
export function useQueries<T extends readonly unknown[]>(
	queries: readonly [...{ [K in keyof T]: QueryObserverOptions<T[K]> }],
): UseQueriesResults<T> {
	const client = useQueryClient()
	const list = queries as readonly QueryObserverOptions<unknown>[]
	// A new set of keys means new observers (and a new combined view); rendering never touches subscribed ones.
	const identity = JSON.stringify(list.map((q) => hashKey(q.queryKey)))
	const observers = useMemo(() => list.map((q) => new QueryObserver(client, q)), [client, identity])
	const combined = useMemo(() => combine(observers), [observers])
	useEffect(() => observers.forEach((observer, i) => observer.setOptions(list[i] as QueryObserverOptions<unknown>)))

	const getSnapshot = useCallback(() => combined.getSnapshot(), [combined])
	const getServerSnapshot = useCallback(() => combined.getServerSnapshot?.() ?? combined.getSnapshot(), [combined])
	const snapshots = useSyncExternalStore(combined.subscribe, getSnapshot, getServerSnapshot)

	return useMemo(
		() => snapshots.map((result, i) => ({ ...result, refetch: () => (observers[i] as QueryObserver<unknown>).refetch() })),
		[snapshots, observers],
	) as unknown as UseQueriesResults<T>
}
