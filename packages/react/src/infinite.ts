import type { DefaultError } from "@omnifront/query"
import {
	type InfiniteData,
	type InfiniteQueryObserverOptions,
	type InfiniteQueryResult,
} from "@omnifront/query-infinite"
import { useMemo } from "react"
import { useObservedInfinite } from "./observed-infinite"
import { useSelected } from "./use-query"

export type { InfiniteData, InfiniteQueryObserverOptions, InfiniteQueryResult }

export type UseInfiniteQueryOptions<TPage, TError = DefaultError, TPageParam = unknown, TData = InfiniteData<TPage, TPageParam>> =
	InfiniteQueryObserverOptions<TPage, TError, TPageParam> & {
		/**
		 * Derive what the component needs from the loaded pages (`pages.flat()`, say). `data` (and what
		 * `refetch` resolves with) is the derived value; the cache keeps the pages. Keep it stable.
		 */
		select?: ((data: InfiniteData<TPage, TPageParam>) => TData) | undefined
	}

export interface UseInfiniteQueryResult<TPage, TError = DefaultError, TPageParam = unknown, TData = InfiniteData<TPage, TPageParam>>
	extends Omit<InfiniteQueryResult<TPage, TError, TPageParam>, "data"> {
	data: TData | undefined
	/** Load the next page. Never rejects; a failure shows up in `error`. */
	fetchNextPage: () => Promise<void>
	fetchPreviousPage: () => Promise<void>
	/** Reload every loaded page. */
	refetch: () => Promise<TData>
}

/** Same shape as `useQuery`, but the data is `{ pages, pageParams }` and you can load more. */
export function useInfiniteQuery<TPage, TError = DefaultError, TPageParam = unknown, TData = InfiniteData<TPage, TPageParam>>(
	options: UseInfiniteQueryOptions<TPage, TError, TPageParam, TData>,
): UseInfiniteQueryResult<TPage, TError, TPageParam, TData> {
	const [observer, snapshot] = useObservedInfinite<TPage, TError, TPageParam>(options)
	const { select } = options
	const data = useSelected(snapshot.data, select)
	return useMemo(
		() =>
			({
				...snapshot,
				data,
				fetchNextPage: () => observer.fetchNextPage(),
				fetchPreviousPage: () => observer.fetchPreviousPage(),
				refetch: () => observer.refetch().then((raw) => (select ? select(raw) : raw)),
			}) as UseInfiniteQueryResult<TPage, TError, TPageParam, TData>,
		[snapshot, data, observer, select],
	)
}
