import { combine } from "@omnifront/core"
import { hashKey, QueryObserver, type QueryObserverOptions } from "@omnifront/query"
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react"
import { useQueryClient } from "./provider"
import type { UseQueryResult } from "./use-query"

export type UseQueriesResults<T extends readonly unknown[]> = { [K in keyof T]: UseQueryResult<T[K]> }

/**
 * What every query of `useQueries` looks like. The data type of each result is read off the real
 * options: the `select` it returns, or else what the query function resolves to.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the data types come from the actual options, see QueryData
export type UseQueriesOption = QueryObserverOptions<any> & {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the type `select` reads is the query function's
	select?: ((data: any) => unknown) | undefined
}

/** The data type a query of `useQueries` ends up with. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see UseQueriesOption
export type QueryData<O> = O extends { select: (data: any) => infer R }
	? R
	: O extends { queryFn: (...args: never[]) => Promise<infer D> }
		? D
		: unknown

/** The results of a list of `useQueries` options. */
export type UseQueriesResultsOf<Q extends readonly unknown[]> = UseQueriesResults<{ [K in keyof Q]: QueryData<Q[K]> }>

type Select = ((data: unknown) => unknown) | undefined

/** A number that goes up whenever one of the `select` functions is not the function it was last render. */
function useSelectsVersion(selects: readonly Select[]): number {
	const ref = useRef<{ selects: readonly Select[]; version: number }>({ selects: [], version: 0 })
	const last = ref.current
	if (selects.length !== last.selects.length || selects.some((select, i) => select !== last.selects[i])) {
		ref.current = { selects, version: last.version + 1 }
	}
	return ref.current.version
}

/**
 * Run several queries at once. Pass a fixed tuple (each result keeps its own data type) or an array
 * built at run time. For dependent queries, set `enabled` on the later ones. A query may have a
 * `select`; keep it stable (defined outside the component) so it only runs when its data changes.
 *
 *   const [user, posts] = useQueries([
 *     { queryKey: ["user", id], queryFn: () => loadUser(id) },
 *     { queryKey: ["posts", id], queryFn: () => loadPosts(id), enabled: userLoaded },
 *   ])
 *
 * With `combine` you get its return value instead of the array. It runs again only when some
 * result changed (or when the function itself changes: keep it stable, define it outside the
 * component or memoize it), and its return value keeps its identity in between.
 *
 *   const { loading, data } = useQueries(queries, {
 *     combine: (results) => ({ loading: results.some((r) => r.status === "loading"), data: results.map((r) => r.data) }),
 *   })
 */
export function useQueries<const Q extends readonly UseQueriesOption[]>(queries: readonly [...Q]): UseQueriesResultsOf<Q>
export function useQueries<const Q extends readonly UseQueriesOption[], TCombined>(
	queries: readonly [...Q],
	options: { combine: (results: UseQueriesResultsOf<Q>) => TCombined },
): TCombined
export function useQueries(
	queries: readonly UseQueriesOption[],
	options?: { combine?: (results: never) => unknown },
): unknown {
	const client = useQueryClient()
	const list = queries
	// A new set of keys means new observers (and a new combined view); rendering never touches subscribed ones.
	const identity = JSON.stringify(list.map((q) => hashKey(q.queryKey)))
	const observers = useMemo(() => list.map((q) => new QueryObserver(client, q)), [client, identity])
	const combined = useMemo(() => combine(observers), [observers])
	useEffect(() => observers.forEach((observer, i) => observer.setOptions(list[i] as QueryObserverOptions<unknown>)))

	const getSnapshot = useCallback(() => combined.getSnapshot(), [combined])
	const getServerSnapshot = useCallback(() => combined.getServerSnapshot?.() ?? combined.getSnapshot(), [combined])
	const snapshots = useSyncExternalStore(combined.subscribe, getSnapshot, getServerSnapshot)

	// `select` per query, remembered per position: a result that did not change keeps its derived data.
	const selectsVersion = useSelectsVersion(list.map((q) => q.select as Select))
	const memo = useRef<Array<{ raw: unknown; select: Select; out: unknown } | undefined>>([])
	const combineResults = options?.combine
	return useMemo(() => {
		const results = snapshots.map((result, i) => {
			const select = list[i]?.select as Select
			let data = result.data
			if (select && data !== undefined) {
				const last = memo.current[i]
				if (last && last.raw === data && last.select === select) data = last.out
				else memo.current[i] = { raw: data, select, out: (data = select(data)) }
			}
			const refetch = (o?: { cancelRefetch?: boolean | undefined }) =>
				(observers[i] as QueryObserver<unknown>).refetch(o).then((raw) => (select ? select(raw) : raw))
			return { ...result, data, refetch }
		})
		return combineResults ? combineResults(results as never) : results
	}, [snapshots, observers, combineResults, selectsVersion])
}
