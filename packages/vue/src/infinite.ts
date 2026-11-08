import type { QueryStatus } from "@unicore/query"
import {
	InfiniteQueryObserver,
	type InfiniteData,
	type InfiniteQueryObserverOptions,
	type InfiniteQueryResult,
} from "@unicore/query-infinite"
import { computed, getCurrentScope, onScopeDispose, shallowRef, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue"
import { useQueryClient } from "./plugin"

export type { InfiniteData, InfiniteQueryObserverOptions, InfiniteQueryResult }

export interface UseInfiniteQueryReturn<TPage, TPageParam = unknown> {
	status: ComputedRef<QueryStatus>
	data: ComputedRef<InfiniteData<TPage, TPageParam> | undefined>
	error: ComputedRef<unknown>
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
export function useInfiniteQuery<TPage, TPageParam = unknown>(
	options: MaybeRefOrGetter<InfiniteQueryObserverOptions<TPage, TPageParam>>,
): UseInfiniteQueryReturn<TPage, TPageParam> {
	const observer = new InfiniteQueryObserver(useQueryClient(), toValue(options))
	const snapshot = shallowRef<InfiniteQueryResult<TPage, TPageParam>>(observer.getSnapshot())
	if (typeof window !== "undefined") {
		const unsubscribe = observer.subscribe(() => {
			snapshot.value = observer.getSnapshot()
		})
		snapshot.value = observer.getSnapshot()
		if (getCurrentScope()) onScopeDispose(unsubscribe)
	}
	watch(
		() => toValue(options),
		(next) => {
			observer.setOptions(next)
			snapshot.value = observer.getSnapshot()
		},
	)
	const pick = <K extends keyof InfiniteQueryResult<TPage, TPageParam>>(key: K) => computed(() => snapshot.value[key])
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
