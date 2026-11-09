import type { DefaultError, QueryStatus } from "@omnifront/query"
import {
	InfiniteQueryObserver,
	type InfiniteData,
	type InfiniteQueryObserverOptions,
	type InfiniteQueryResult,
} from "@omnifront/query-infinite"
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

export type { InfiniteData, InfiniteQueryObserverOptions, InfiniteQueryResult }

export interface UseInfiniteQueryReturn<TPage, TError = DefaultError, TPageParam = unknown> {
	status: ComputedRef<QueryStatus>
	data: ComputedRef<InfiniteData<TPage, TPageParam> | undefined>
	error: ComputedRef<TError | undefined>
	isFetching: ComputedRef<boolean>
	isStale: ComputedRef<boolean>
	hasNextPage: ComputedRef<boolean>
	hasPreviousPage: ComputedRef<boolean>
	isFetchingNextPage: ComputedRef<boolean>
	isFetchingPreviousPage: ComputedRef<boolean>
	/** Load the next page. Never rejects; a failure shows up in `error`. */
	fetchNextPage: () => Promise<void>
	fetchPreviousPage: () => Promise<void>
	refetch: () => Promise<InfiniteData<TPage, TPageParam>>
}

/** Same as `useQuery`, but the data is `{ pages, pageParams }` and you can load more. Options may be reactive. */
export function useInfiniteQuery<TPage, TError = DefaultError, TPageParam = unknown>(
	options: MaybeRefOrGetter<InfiniteQueryObserverOptions<TPage, TError, TPageParam>>,
): UseInfiniteQueryReturn<TPage, TError, TPageParam> {
	// On the server a failing request must not hold the render open through retries (see useQuery).
	const forServer = (o: InfiniteQueryObserverOptions<TPage, TError, TPageParam>): InfiniteQueryObserverOptions<TPage, TError, TPageParam> =>
		typeof window === "undefined" ? { ...o, retry: o.retry ?? false } : o
	const observer = new InfiniteQueryObserver(useQueryClient(), forServer(toValue(options)))
	// Same SSR approach as useQuery: server snapshot for the first render, live after mount.
	let live = !getCurrentInstance()
	const read = () => (live ? observer.getSnapshot() : observer.getServerSnapshot())
	const snapshot = shallowRef<InfiniteQueryResult<TPage, TError, TPageParam>>(read())
	if (typeof window === "undefined") {
		onServerPrefetch(async () => {
			if (observer.getServerSnapshot().isFetching) await observer.refetch().catch(() => {})
			snapshot.value = observer.getServerSnapshot()
		})
	} else {
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
		if (getCurrentScope()) onScopeDispose(() => unsubscribe?.())
	}
	watch(
		() => toValue(options),
		(next) => {
			observer.setOptions(forServer(next))
			snapshot.value = read()
		},
	)
	const pick = <K extends keyof InfiniteQueryResult<TPage, TError, TPageParam>>(key: K) => computed(() => snapshot.value[key])
	return {
		status: pick("status"),
		data: pick("data"),
		error: pick("error"),
		isFetching: pick("isFetching"),
		isStale: pick("isStale"),
		hasNextPage: pick("hasNextPage"),
		hasPreviousPage: pick("hasPreviousPage"),
		isFetchingNextPage: pick("isFetchingNextPage"),
		isFetchingPreviousPage: pick("isFetchingPreviousPage"),
		fetchNextPage: () => observer.fetchNextPage(),
		fetchPreviousPage: () => observer.fetchPreviousPage(),
		refetch: () => observer.refetch(),
	}
}
