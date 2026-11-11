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
	isPending: ComputedRef<boolean>
	isLoading: ComputedRef<boolean>
	isRefetching: ComputedRef<boolean>
	isSuccess: ComputedRef<boolean>
	isError: ComputedRef<boolean>
	isLoadingError: ComputedRef<boolean>
	isRefetchError: ComputedRef<boolean>
	failureCount: ComputedRef<number>
	failureReason: ComputedRef<TError | undefined>
	dataUpdatedAt: ComputedRef<number | undefined>
	/** Joins a request in flight; `{ cancelRefetch: true }` aborts it and starts over. */
	refetch: (options?: { cancelRefetch?: boolean | undefined }) => Promise<TData>
}

export type UseQueryOptions<TQueryFnData, TError = DefaultError, TData = TQueryFnData> = QueryObserverOptions<TQueryFnData, TError> & {
	/**
	 * Derive what the component needs from the cached data. `data` (and `refetch`) give the derived
	 * value; the cache keeps the original. It is a `computed`, so refs it reads are tracked.
	 */
	select?: ((data: TQueryFnData) => TData) | undefined
}



/**
 * `options` may be a plain object, a ref/computed, or a getter. Reactive inputs (a key built from
 * a ref, say) are tracked: when they change the query switches, just like a changing key in React.
 *
 *   const id = ref(1)
 *   const { data } = useQuery(() => ({ queryKey: ['user', id.value], queryFn: () => fetchUser(id.value) }))
 */
export function useQuery<TQueryFnData, TError = DefaultError, TData = TQueryFnData>(
	options: MaybeRefOrGetter<UseQueryOptions<TQueryFnData, TError, TData>>,
): UseQueryReturn<TData, TError> {
	// On the server a failing request must not hold the render open through retries with backoff
	// (~7 s by default): fail fast and let the browser retry. An explicit `retry` is respected.
	const forServer = (o: QueryObserverOptions<TQueryFnData, TError>): QueryObserverOptions<TQueryFnData, TError> =>
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
	const snapshot = shallowRef<QueryResult<TQueryFnData, TError>>(read())

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

	// `select` runs inside a computed: Vue memoizes it and tracks whatever refs it reads.
	const selected = (raw: TQueryFnData | undefined): TData | undefined => {
		const { select } = toValue(options)
		return select && raw !== undefined ? select(raw) : (raw as TData | undefined)
	}
	const fields: Record<string, ComputedRef<unknown>> = {}
	// One computed per field of the result, so templates can destructure. The snapshot always has
	// every field, so its keys are the list (`data` gets its own computed below, for `select`).
	for (const key of Object.keys(snapshot.value) as Array<keyof QueryResult<TQueryFnData, TError>>) {
		fields[key] = computed(() => snapshot.value[key])
	}
	return {
		...(fields as unknown as Omit<UseQueryReturn<TData, TError>, "data" | "refetch">),
		data: computed(() => selected(snapshot.value.data)),
		refetch: (o) => observer.refetch(o).then((raw) => selected(raw) as TData),
	}
}
