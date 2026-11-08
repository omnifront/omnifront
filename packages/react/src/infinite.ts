import {
	type InfiniteData,
	type InfiniteQueryObserverOptions,
	type InfiniteQueryResult,
} from "@omnifront/query-infinite"
import { useMemo } from "react"
import { useObservedInfinite } from "./observed-infinite"

export type { InfiniteData, InfiniteQueryObserverOptions, InfiniteQueryResult }

export interface UseInfiniteQueryResult<TPage, TPageParam = unknown> extends InfiniteQueryResult<TPage, TPageParam> {
	/** Load the next page. Never rejects; a failure shows up in `error`. */
	fetchNextPage: () => Promise<void>
	fetchPreviousPage: () => Promise<void>
	/** Reload every loaded page. */
	refetch: () => Promise<InfiniteData<TPage, TPageParam>>
}

/** Same shape as `useQuery`, but the data is `{ pages, pageParams }` and you can load more. */
export function useInfiniteQuery<TPage, TPageParam = unknown>(
	options: InfiniteQueryObserverOptions<TPage, TPageParam>,
): UseInfiniteQueryResult<TPage, TPageParam> {
	const [observer, snapshot] = useObservedInfinite(options)
	return useMemo(
		() => ({
			...snapshot,
			fetchNextPage: () => observer.fetchNextPage(),
			fetchPreviousPage: () => observer.fetchPreviousPage(),
			refetch: () => observer.refetch(),
		}),
		[snapshot, observer],
	)
}
