import {
	QueryObserver,
	type DefaultError,
	type QueryObserverOptions,
	type QueryResult,
	type QueryStatus,
} from "@omnifront/query"
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

const noop = (): void => {}

export interface UseQueryReturn<TData, TError = DefaultError> {
	status: ComputedRef<QueryStatus>
	data: ComputedRef<TData | undefined>
	error: ComputedRef<TError | undefined>
	isFetching: ComputedRef<boolean>
	isStale: ComputedRef<boolean>
	isInvalidated: ComputedRef<boolean>
	isPlaceholderData: ComputedRef<boolean>
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
export function useQuery<TData, TError = DefaultError>(
	options: MaybeRefOrGetter<QueryObserverOptions<TData, TError>>,
): UseQueryReturn<TData, TError> {
	// On the server a failing request must not hold the render open through retries with backoff
	// (~7 s by default): fail fast and let the browser retry. An explicit `retry` is respected.
	const forServer = (o: QueryObserverOptions<TData, TError>): QueryObserverOptions<TData, TError> =>
		typeof window === "undefined" ? { ...o, retry: o.retry ?? false } : o
	const observer = new QueryObserver(useQueryClient(), forServer(toValue(options)))

	// shallowRef: the snapshot is an immutable object we replace wholesale, so deep reactivity
	// would only add cost. Each field below is a computed over it, so templates can destructure.
	//
	// The first render uses the SERVER snapshot, which never reads the clock, so a server-rendered
	// page hydrates without mismatches (the server and the browser disagree on "now"). Once the
	// component is mounted we switch to the live snapshot. Outside a component there is no
	// hydration, so it is live from the start.
	let live = !getCurrentInstance()
	const read = () => (live ? observer.getSnapshot() : observer.getServerSnapshot())
	const snapshot = shallowRef<QueryResult<TData, TError>>(read())

	if (typeof window === "undefined") {
		// Server: no subscription (nothing would ever unsubscribe it). Vue waits for onServerPrefetch
		// before rendering this component, so fetch here; the server snapshot says whether a fetch is due.
		onServerPrefetch(async () => {
			if (observer.getServerSnapshot().isFetching) await observer.refetch().catch(noop)
			snapshot.value = observer.getServerSnapshot()
		})
	} else {
		// Subscribe once mounted (immediately when there is no component). Doing it in setup() would start
		// the fetch before the first render, and a hydrating page must render exactly what the server did.
		let unsubscribe: (() => void) | undefined
		const start = () => {
			live = true
			unsubscribe = observer.subscribe(() => {
				snapshot.value = observer.getSnapshot()
			})
			snapshot.value = observer.getSnapshot()
		}
		if (live) start()
		else onMounted(start)
		// Tie the subscription to the surrounding component (or effectScope): when it is
		// destroyed, the last unsubscribe lets the cache entry start its gc timer.
		if (getCurrentScope()) onScopeDispose(() => unsubscribe?.())
	}

	// Re-run when reactive inputs change. Default flush ("pre") runs before the component
	// re-renders, so the render already sees the new query.
	watch(
		() => toValue(options),
		(next) => {
			observer.setOptions(forServer(next))
			snapshot.value = read()
		},
	)

	const pick = <K extends keyof QueryResult<TData, TError>>(key: K) => computed(() => snapshot.value[key])
	return {
		status: pick("status"),
		data: pick("data"),
		error: pick("error"),
		isFetching: pick("isFetching"),
		isStale: pick("isStale"),
		isInvalidated: pick("isInvalidated"),
		isPlaceholderData: pick("isPlaceholderData"),
		failureCount: pick("failureCount"),
		dataUpdatedAt: pick("dataUpdatedAt"),
		refetch: () => observer.refetch(),
	}
}
