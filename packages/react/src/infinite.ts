import { hashKey } from "@unicore/query"
import {
	InfiniteQueryObserver,
	type InfiniteData,
	type InfiniteQueryObserverOptions,
	type InfiniteQueryResult,
} from "@unicore/query-infinite"
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react"
import { useQueryClient } from "./provider"

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
	const client = useQueryClient()
	const hash = hashKey(options.queryKey)

	// One observer per (client, key), exactly like useQuery.
	const committed = useRef<InfiniteQueryObserver<TPage, TPageParam> | undefined>(undefined)
	const observer = useMemo(() => {
		const next = new InfiniteQueryObserver(client, options)
		if (committed.current) next.inherit(committed.current)
		return next
	}, [client, hash])
	useEffect(() => {
		committed.current = observer
	}, [observer])
	useEffect(() => observer.setOptions(options))

	const getSnapshot = useCallback(() => observer.getSnapshot(), [observer])
	const getServerSnapshot = useCallback(() => observer.getServerSnapshot(), [observer])
	const snapshot = useSyncExternalStore(observer.subscribe, getSnapshot, getServerSnapshot)

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
