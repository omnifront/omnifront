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

/**
 * Run several queries at once; `queries` may be an array, a ref or a getter (the list can grow and
 * shrink). Dependent queries: set `enabled` on the later ones.
 */
export function useQueries<TData = unknown>(queries: MaybeRefOrGetter<readonly QueryObserverOptions<TData>[]>): ComputedRef<QueriesResult<TData>[]> {
	const client = useQueryClient()
	const serverOptions = (list: readonly QueryObserverOptions<TData>[]) =>
		typeof window === "undefined" ? list.map((q) => ({ ...q, retry: q.retry ?? false })) : list
	const build = (list: readonly QueryObserverOptions<TData>[]) => {
		const observers = serverOptions(list).map((q) => new QueryObserver(client, q))
		return { observers, combined: combine(observers), keys: JSON.stringify(list.map((q) => hashKey(q.queryKey))) }
	}

	let state = build(toValue(queries))
	let live = !getCurrentInstance()
	let unsubscribe: (() => void) | undefined
	const read = () =>
		state.observers.map((observer, i) => {
			const r = live ? observer.getSnapshot() : observer.getServerSnapshot()
			return { ...r, refetch: () => (state.observers[i] as QueryObserver<TData>).refetch() }
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
			if (JSON.stringify(list.map((q) => hashKey(q.queryKey))) === state.keys) {
				serverOptions(list).forEach((q, i) => state.observers[i]?.setOptions(q))
				return
			}
			state = build(list)
			if (unsubscribe || live) listen()
			else refresh()
		},
	)
	return computed(() => results.value)
}
