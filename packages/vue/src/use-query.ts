import {
	QueryObserver,
	type QueryObserverOptions,
	type QueryResult,
	type QueryStatus,
} from "@unicore/query"
import { computed, getCurrentScope, onScopeDispose, shallowRef, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue"
import { useQueryClient } from "./plugin"

export interface UseQueryReturn<TData> {
	status: ComputedRef<QueryStatus>
	data: ComputedRef<TData | undefined>
	error: ComputedRef<unknown>
	isFetching: ComputedRef<boolean>
	isStale: ComputedRef<boolean>
	isInvalidated: ComputedRef<boolean>
	failureCount: ComputedRef<number>
	dataUpdatedAt: ComputedRef<number | undefined>
	refetch: () => Promise<TData>
}

/**
 * `options` may be a plain object, a ref/computed, or a getter. Reactive inputs (a key built from
 * a ref, say) are tracked: when they change the query switches, just like a changing key in React.
 *
 *   const id = ref(1)
 *   const { data } = useQuery(() => ({ queryKey: ['user', id.value], queryFn: () => fetchUser(id.value) }))
 */
export function useQuery<TData>(options: MaybeRefOrGetter<QueryObserverOptions<TData>>): UseQueryReturn<TData> {
	const observer = new QueryObserver(useQueryClient(), toValue(options))

	// shallowRef: the snapshot is an immutable object we replace wholesale, so deep reactivity
	// would only add cost. Each field below is a computed over it, so templates can destructure.
	const snapshot = shallowRef<QueryResult<TData>>(observer.getSnapshot())

	// Subscribe right away in setup (not onMounted): this is what starts the fetch, and it makes
	// the data available to code that runs before mount. On the server there is no unmount, so we
	// never subscribe there; the server just reads the snapshot (SSR prefetching comes later).
	if (typeof window !== "undefined") {
		const unsubscribe = observer.subscribe(() => {
			snapshot.value = observer.getSnapshot()
		})
		snapshot.value = observer.getSnapshot() // subscribing may have started a fetch
		// Tie the subscription to the surrounding component (or effectScope): when it is
		// destroyed, the last unsubscribe lets the cache entry start its gc timer.
		if (getCurrentScope()) onScopeDispose(unsubscribe)
	}

	// Re-run when reactive inputs change. Default flush ("pre") runs before the component
	// re-renders, so the render already sees the new query.
	watch(
		() => toValue(options),
		(next) => {
			observer.setOptions(next)
			snapshot.value = observer.getSnapshot()
		},
	)

	const pick = <K extends keyof QueryResult<TData>>(key: K) => computed(() => snapshot.value[key])
	return {
		status: pick("status"),
		data: pick("data"),
		error: pick("error"),
		isFetching: pick("isFetching"),
		isStale: pick("isStale"),
		isInvalidated: pick("isInvalidated"),
		failureCount: pick("failureCount"),
		dataUpdatedAt: pick("dataUpdatedAt"),
		refetch: () => observer.refetch(),
	}
}
