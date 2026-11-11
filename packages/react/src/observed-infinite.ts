import { hashKey, type DefaultError } from "@omnifront/query"
import { InfiniteQueryObserver, type InfiniteQueryObserverOptions, type InfiniteQueryResult } from "@omnifront/query-infinite"
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react"
import { useQueryClient } from "./provider"

/** The observer behind an infinite hook and its current snapshot (shared with useSuspenseInfiniteQuery). */
export function useObservedInfinite<TPage, TError = DefaultError, TPageParam = unknown>(
	options: InfiniteQueryObserverOptions<TPage, TError, TPageParam>,
): [InfiniteQueryObserver<TPage, TError, TPageParam>, InfiniteQueryResult<TPage, TError, TPageParam>] {
	const client = useQueryClient()
	const hash = hashKey(options.queryKey)

	// One observer per (client, key), exactly like useQuery.
	const committed = useRef<InfiniteQueryObserver<TPage, TError, TPageParam> | undefined>(undefined)
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
	return [observer, useSyncExternalStore(observer.subscribe, getSnapshot, getServerSnapshot)]
}
