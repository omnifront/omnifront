import { combine } from "@omnifront/core"
import { hashKey, QueryObserver, type QueryObserverOptions } from "@omnifront/query"
import {
	computed,
	getCurrentInstance,
	getCurrentScope,
	onMounted,
	onScopeDispose,
	onServerPrefetch,
	shallowRef,
	toValue,
	watch,
	type ComputedRef,
	type MaybeRefOrGetter,
} from "vue"
import { useQueryClient } from "./plugin"
import type { UseQueryReturn } from "./use-query"

/** One plain object per query (not refs): `results.value[0].data`. */
export type QueriesResult<TData> = { [K in keyof UseQueryReturn<TData>]: UseQueryReturn<TData>[K] extends ComputedRef<infer V> ? V : UseQueryReturn<TData>[K] }

/** A query without `select`: the data is what the query function resolves to. */
export type PlainQuery<TData> = QueryObserverOptions<TData> & { select?: undefined }
/** A query with `select`: the data is what it returns; the query function's own type is not checked against it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the type `select` reads is the query function's, which a list of queries does not track
export type SelectedQuery<TData> = QueryObserverOptions<any> & { select: (data: any) => TData }
export type UseQueriesOption<TData> = PlainQuery<TData> | SelectedQuery<TData>

type Select = ((data: unknown) => unknown) | undefined

/**
 * Run several queries at once; `queries` may be an array, a ref or a getter (the list can grow and
 * shrink). Dependent queries: set `enabled` on the later ones. A query may have a `select`: give
 * every query one, or none, so the list has one data type.
 */
export function useQueries<TData = unknown>(queries: MaybeRefOrGetter<readonly PlainQuery<TData>[]>): ComputedRef<QueriesResult<TData>[]>
export function useQueries<TData = unknown>(queries: MaybeRefOrGetter<readonly SelectedQuery<TData>[]>): ComputedRef<QueriesResult<TData>[]>
/** With `combine` you get a ref of its return value; it runs again only when some result changed. */
export function useQueries<TData, TCombined>(
	queries: MaybeRefOrGetter<readonly PlainQuery<TData>[]>,
	options: { combine: (results: QueriesResult<TData>[]) => TCombined },
): ComputedRef<TCombined>
export function useQueries<TData, TCombined>(
	queries: MaybeRefOrGetter<readonly SelectedQuery<TData>[]>,
	options: { combine: (results: QueriesResult<TData>[]) => TCombined },
): ComputedRef<TCombined>
export function useQueries<TData = unknown>(
	queries: MaybeRefOrGetter<readonly UseQueriesOption<TData>[]>,
	options?: { combine?: (results: QueriesResult<TData>[]) => unknown },
): ComputedRef<unknown> {
	const client = useQueryClient()
	type Options = QueryObserverOptions<TData>
	const serverOptions = (list: readonly UseQueriesOption<TData>[]): Options[] =>
		(typeof window === "undefined" ? list.map((q) => ({ ...q, retry: q.retry ?? false })) : list) as Options[]
	const build = (list: readonly UseQueriesOption<TData>[]) => {
		const observers = serverOptions(list).map((q) => new QueryObserver(client, q))
		return { observers, combined: combine(observers), keys: JSON.stringify(list.map((q) => hashKey(q.queryKey))) }
	}

	let state = build(toValue(queries))
	let selects: Select[] = toValue(queries).map((q) => q.select as Select)
	// `select` per query, remembered per position: a result that did not change keeps its derived data.
	const memo: Array<{ raw: unknown; select: Select; out: unknown } | undefined> = []
	let live = !getCurrentInstance()
	let unsubscribe: (() => void) | undefined
	const read = () =>
		state.observers.map((observer, i) => {
			const r = live ? observer.getSnapshot() : observer.getServerSnapshot()
			const select = selects[i]
			let data = r.data
			if (select && data !== undefined) {
				const last = memo[i]
				if (last && last.raw === data && last.select === select) data = last.out as TData
				else memo[i] = { raw: data, select, out: (data = select(data) as TData) }
			}
			return {
				...r,
				data,
				refetch: (o?: { cancelRefetch?: boolean | undefined }) =>
					(state.observers[i] as QueryObserver<TData>).refetch(o).then((raw) => (select ? select(raw) : raw)),
			}
		})
	const results = shallowRef(read() as unknown as QueriesResult<TData>[])
	const refresh = () => {
		results.value = read() as unknown as QueriesResult<TData>[]
	}
	const listen = () => {
		unsubscribe?.()
		unsubscribe = state.combined.subscribe(refresh)
		refresh()
	}

	if (typeof window === "undefined") {
		onServerPrefetch(async () => {
			await Promise.all(state.observers.filter((o) => o.getServerSnapshot().isFetching).map((o) => o.refetch().catch(() => {})))
			refresh()
		})
	} else {
		const start = () => {
			live = true
			listen()
		}
		if (live) start()
		else onMounted(start)
		if (getCurrentScope()) onScopeDispose(() => unsubscribe?.())
	}

	watch(
		() => toValue(queries),
		(list) => {
			selects = list.map((q) => q.select as Select)
			if (JSON.stringify(list.map((q) => hashKey(q.queryKey))) === state.keys) {
				serverOptions(list).forEach((q, i) => state.observers[i]?.setOptions(q))
				if (selects.some(Boolean)) refresh() // a new `select` changes what is shown
				return
			}
			state = build(list)
			if (unsubscribe || live) listen()
			else refresh()
		},
	)
	// A computed only re-runs when `results` got a new array, so `combine` runs once per change.
	const combineResults = options?.combine
	return computed(() => (combineResults ? combineResults(results.value) : results.value))
}
