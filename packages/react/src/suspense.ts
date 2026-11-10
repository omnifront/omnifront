import type { DefaultError } from "@omnifront/query"
import { useMemo } from "react"
import type { UseInfiniteQueryResult } from "./infinite"
import { useObservedInfinite } from "./observed-infinite"
import type { InfiniteData, InfiniteQueryObserverOptions } from "@omnifront/query-infinite"
import { useObservedQuery, useSelected, type UseQueryOptions, type UseQueryResult } from "./use-query"

export interface UseSuspenseQueryResult<TData, TError = DefaultError> extends Omit<UseQueryResult<TData, TError>, "data" | "status"> {
	/** Always there: the component does not render until it is. */
	data: TData
	/** `"success"`, or `"error"` when a background refetch failed and the old data is kept. */
	status: "success" | "error"
}

const noop = (): void => {}

/**
 * Like `useQuery`, but for `<Suspense>` and error boundaries: while there is no data the component
 * suspends (the nearest Suspense boundary shows its fallback), and if loading fails it throws the
 * error to the nearest error boundary. Once it renders, `data` is always defined.
 *
 * - `enabled` and `placeholderData` are ignored: a suspending query exists to have real data.
 * - `staleTime` defaults to 1 second here (not 0), otherwise the data that just finished
 *   loading would be refetched the moment the component mounts.
 * - To retry after an error, call `client.invalidateQueries({ queryKey })` from the error
 *   boundary's reset, then re-render: an invalidated failed query loads again instead of throwing.
 */
export function useSuspenseQuery<TQueryFnData, TError = DefaultError, TData = TQueryFnData>(
	options: UseQueryOptions<TQueryFnData, TError, TData>,
): UseSuspenseQueryResult<TData, TError> {
	const { select } = options
	const [observer, snapshot] = useObservedQuery<TQueryFnData, TError>({
		...options,
		enabled: true,
		staleTime: options.staleTime ?? 1000,
		placeholderData: undefined,
	})

	const hasData = snapshot.data !== undefined && !snapshot.isPlaceholderData
	const data = useSelected(snapshot.data, select)
	// Declared before any throw so the hook order never changes between renders.
	const result = useMemo(
		() =>
			hasData
				? { ...snapshot, data, refetch: () => observer.refetch().then((raw) => (select ? select(raw) : raw)) }
				: undefined,
		[hasData, snapshot, data, observer, select],
	)
	if (result) return result as UseSuspenseQueryResult<TData, TError>

	// A failed load (not invalidated since) goes to the error boundary.
	if (snapshot.status === "error" && !snapshot.isInvalidated) throw snapshot.error
	// Otherwise wait for the fetch. refetch() joins a request already in flight, so every render
	// of every component waiting on this key waits on the same one.
	throw observer.refetch().then(noop, noop)
}

export interface UseSuspenseInfiniteQueryResult<TPage, TError = DefaultError, TPageParam = unknown>
	extends Omit<UseInfiniteQueryResult<TPage, TError, TPageParam>, "data" | "status"> {
	data: InfiniteData<TPage, TPageParam>
	status: "success" | "error"
}

/** `useInfiniteQuery` for `<Suspense>` and error boundaries; same rules as {@link useSuspenseQuery}. */
export function useSuspenseInfiniteQuery<TPage, TError = DefaultError, TPageParam = unknown>(
	options: InfiniteQueryObserverOptions<TPage, TError, TPageParam>,
): UseSuspenseInfiniteQueryResult<TPage, TError, TPageParam> {
	const [observer, snapshot] = useObservedInfinite<TPage, TError, TPageParam>({
		...options,
		enabled: true,
		staleTime: options.staleTime ?? 1000,
		placeholderData: undefined,
	})
	const hasData = snapshot.data !== undefined && !snapshot.isPlaceholderData
	const result = useMemo(
		() =>
			hasData
				? {
						...snapshot,
						fetchNextPage: () => observer.fetchNextPage(),
						fetchPreviousPage: () => observer.fetchPreviousPage(),
						refetch: () => observer.refetch(),
					}
				: undefined,
		[hasData, snapshot, observer],
	)
	if (result) return result as unknown as UseSuspenseInfiniteQueryResult<TPage, TError, TPageParam>
	if (snapshot.status === "error" && !snapshot.isInvalidated) throw snapshot.error
	throw observer.refetch().then(noop, noop)
}
