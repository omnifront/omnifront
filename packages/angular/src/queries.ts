import { DestroyRef, effect, inject, signal, untracked, type Signal } from "@angular/core"
import { combine } from "@unicore/core"
import { hashKey, QueryObserver, type QueryObserverOptions, type QueryResult } from "@unicore/query"
import { injectQueryClient } from "./provide"

export type QueriesResult<TData> = QueryResult<TData> & { refetch: () => Promise<TData> }

/**
 * Run several queries at once. `queries` may be an array or a function reading signals (the list can
 * grow and shrink). Returns one signal holding an array of results. Dependent queries: set `enabled`
 * on the later ones. Must run in an injection context.
 */
export function injectQueries<TData = unknown>(
	queries: readonly QueryObserverOptions<TData>[] | (() => readonly QueryObserverOptions<TData>[]),
): Signal<QueriesResult<TData>[]> {
	const client = injectQueryClient()
	const read = () => {
		const list = typeof queries === "function" ? queries() : queries
		return typeof window === "undefined" ? list.map((q) => ({ ...q, retry: q.retry ?? false })) : list
	}
	const keysOf = (list: readonly QueryObserverOptions<TData>[]) => JSON.stringify(list.map((q) => hashKey(q.queryKey)))

	let observers: QueryObserver<TData>[] = []
	let keys = ""
	let stop: (() => void) | undefined
	const results = signal<QueriesResult<TData>[]>([])
	const rebuild = (list: readonly QueryObserverOptions<TData>[]) => {
		stop?.()
		observers = list.map((q) => new QueryObserver(client, q))
		keys = keysOf(list)
		const combined = combine(observers)
		const update = () =>
			results.set(combined.getSnapshot().map((r, i) => ({ ...r, refetch: () => (observers[i] as QueryObserver<TData>).refetch() })))
		stop = combined.subscribe(update)
		update()
	}

	rebuild(untracked(read))
	inject(DestroyRef).onDestroy(() => stop?.())
	effect(() => {
		const list = read()
		untracked(() => {
			if (keysOf(list) === keys) list.forEach((q, i) => observers[i]?.setOptions(q))
			else rebuild(list)
		})
	})
	return results.asReadonly()
}
