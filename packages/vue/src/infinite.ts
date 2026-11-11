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

export type UseInfiniteQueryOptions<TPage, TError = DefaultError, TPageParam = unknown, TData = InfiniteData<TPage, TPageParam>> =
	InfiniteQueryObserverOptions<TPage, TError, TPageParam> & {
		/**
		 * Derive what the component needs from the loaded pages (`pages.flat()`, say). `data` (and what
		 * `refetch` resolves with) is the derived value; the cache keeps the pages. It is a `computed`,
		 * so refs it reads are tracked.
		 */
		select?: ((data: InfiniteData<TPage, TPageParam>) => TData) | undefined
	}

export interface UseInfiniteQueryReturn<TPage, TError = DefaultError, TPageParam = unknown, TData = InfiniteData<TPage, TPageParam>> {
	status: ComputedRef<QueryStatus>
	data: ComputedRef<TData | undefined>
	error: ComputedRef<TError | undefined>
	isFetching: ComputedRef<boolean>
	isStale: ComputedRef<boolean>
	isPending: ComputedRef<boolean>
	isLoading: ComputedRef<boolean>
	isRefetching: ComputedRef<boolean>
	isSuccess: ComputedRef<boolean>
	isError: ComputedRef<boolean>
	isLoadingError: ComputedRef<boolean>
	isRefetchError: ComputedRef<boolean>
	hasNextPage: ComputedRef<boolean>
	hasPreviousPage: ComputedRef<boolean>
	isFetchingNextPage: ComputedRef<boolean>
	isFetchingPreviousPage: ComputedRef<boolean>
	/** Load the next page. Never rejects; a failure shows up in `error`. */
	fetchNextPage: () => Promise<void>
	fetchPreviousPage: () => Promise<void>
	refetch: () => Promise<TData>
}

/** Same as `useQuery`, but the data is `{ pages, pageParams }` and you can load more. Options may be reactive. */
export function useInfiniteQuery<TPage, TError = DefaultError, TPageParam = unknown, TData = InfiniteData<TPage, TPageParam>>(
	options: MaybeRefOrGetter<UseInfiniteQueryOptions<TPage, TError, TPageParam, TData>>,
): UseInfiniteQueryReturn<TPage, TError, TPageParam, TData> {
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
	// `select` runs inside a computed: Vue memoizes it and tracks whatever refs it reads.
	const selected = (raw: InfiniteData<TPage, TPageParam> | undefined): TData | undefined => {
		const { select } = toValue(options)
		return select && raw !== undefined ? select(raw) : (raw as TData | undefined)
	}
	const fields: Record<string, ComputedRef<unknown>> = {}
	for (const key of Object.keys(snapshot.value) as Array<keyof InfiniteQueryResult<TPage, TError, TPageParam>>) {
		fields[key] = computed(() => snapshot.value[key])
	}
	return {
		...(fields as unknown as Omit<UseInfiniteQueryReturn<TPage, TError, TPageParam, TData>, "data" | "fetchNextPage" | "fetchPreviousPage" | "refetch">),
		data: computed(() => selected(snapshot.value.data)),
		fetchNextPage: () => observer.fetchNextPage(),
		fetchPreviousPage: () => observer.fetchPreviousPage(),
		refetch: () => observer.refetch().then((raw) => selected(raw) as TData),
	}
}
