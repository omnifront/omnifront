import { DestroyRef, computed, effect, inject, signal, untracked, type Signal } from "@angular/core"
import { combine } from "@omnifront/core"
import { hashKey, QueryObserver, type QueryObserverOptions, type QueryResult } from "@omnifront/query"
import { injectQueryClient } from "./provide"

export type QueriesResult<TData> = QueryResult<TData> & { refetch: () => Promise<TData> }

/** A query without `select`: the data is what the query function resolves to. */
export type PlainQuery<TData> = QueryObserverOptions<TData> & { select?: undefined }
/** A query with `select`: the data is what it returns; the query function's own type is not checked against it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the type `select` reads is the query function's, which a list of queries does not track
export type SelectedQuery<TData> = QueryObserverOptions<any> & { select: (data: any) => TData }
export type InjectQueriesOption<TData> = PlainQuery<TData> | SelectedQuery<TData>

type Select = ((data: unknown) => unknown) | undefined

/**
 * Run several queries at once. `queries` may be an array or a function reading signals (the list can
 * grow and shrink). Returns one signal holding an array of results. Dependent queries: set `enabled`
 * on the later ones. A query may have a `select`: give every query one, or none, so the list has one
 * data type. Must run in an injection context.
 */
export function injectQueries<TData = unknown>(
	queries: readonly PlainQuery<TData>[] | (() => readonly PlainQuery<TData>[]),
): Signal<QueriesResult<TData>[]>
export function injectQueries<TData = unknown>(
	queries: readonly SelectedQuery<TData>[] | (() => readonly SelectedQuery<TData>[]),
): Signal<QueriesResult<TData>[]>
/** With `combine` you get a signal of its return value; it runs again only when some result changed. */
export function injectQueries<TData, TCombined>(
	queries: readonly PlainQuery<TData>[] | (() => readonly PlainQuery<TData>[]),
	options: { combine: (results: QueriesResult<TData>[]) => TCombined },
): Signal<TCombined>
export function injectQueries<TData, TCombined>(
	queries: readonly SelectedQuery<TData>[] | (() => readonly SelectedQuery<TData>[]),
	options: { combine: (results: QueriesResult<TData>[]) => TCombined },
): Signal<TCombined>
export function injectQueries<TData = unknown>(
	queries: readonly InjectQueriesOption<TData>[] | (() => readonly InjectQueriesOption<TData>[]),
	options?: { combine?: (results: QueriesResult<TData>[]) => unknown },
): Signal<unknown> {
	type Options = QueryObserverOptions<TData>
	const client = injectQueryClient()
	const read = (): readonly InjectQueriesOption<TData>[] => {
		const list = typeof queries === "function" ? queries() : queries
		return (typeof window === "undefined" ? list.map((q) => ({ ...q, retry: q.retry ?? false })) : list) as InjectQueriesOption<TData>[]
	}
	const keysOf = (list: readonly InjectQueriesOption<TData>[]) => JSON.stringify(list.map((q) => hashKey(q.queryKey)))

	let observers: QueryObserver<TData>[] = []
	let keys = ""
	let selects: Select[] = []
	let snapshots: readonly QueryResult<TData>[] = []
	let stop: (() => void) | undefined
	// `select` per query, remembered per position: a result that did not change keeps its derived data.
	const memo: Array<{ raw: unknown; select: Select; out: unknown } | undefined> = []
	const results = signal<QueriesResult<TData>[]>([])
	const update = () =>
		results.set(
			snapshots.map((r, i) => {
				const select = selects[i]
				let data = r.data
				if (select && data !== undefined) {
					const last = memo[i]
					if (last && last.raw === data && last.select === select) data = last.out as TData
					else memo[i] = { raw: data, select, out: (data = select(data) as TData) }
				}
				return { ...r, data, refetch: () => (observers[i] as QueryObserver<TData>).refetch().then((raw) => (select ? select(raw) : raw)) as Promise<TData> }
			}),
		)
	const rebuild = (list: readonly InjectQueriesOption<TData>[]) => {
		stop?.()
		observers = list.map((q) => new QueryObserver(client, q as Options))
		keys = keysOf(list)
		selects = list.map((q) => q.select as Select)
		const combined = combine(observers)
		stop = combined.subscribe(() => {
			snapshots = combined.getSnapshot()
			update()
		})
		snapshots = combined.getSnapshot()
		update()
	}

	rebuild(untracked(read))
	inject(DestroyRef).onDestroy(() => stop?.())
	effect(() => {
		const list = read()
		untracked(() => {
			if (keysOf(list) === keys) {
				list.forEach((q, i) => observers[i]?.setOptions(q as Options))
				selects = list.map((q) => q.select as Select)
				if (selects.some(Boolean)) update() // a new `select` changes what is shown
			} else rebuild(list)
		})
	})
	// A computed re-runs only when `results` got a new array, so `combine` runs once per change.
	const combineResults = options?.combine
	return combineResults ? computed(() => combineResults(results())) : results.asReadonly()
}
