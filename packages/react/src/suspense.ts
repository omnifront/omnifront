import type { QueryObserverOptions } from "@unicore/query"
import { useMemo } from "react"
import { useObservedQuery, type UseQueryResult } from "./use-query"

export interface UseSuspenseQueryResult<TData> extends Omit<UseQueryResult<TData>, "data" | "status"> {
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
export function useSuspenseQuery<TData>(options: QueryObserverOptions<TData>): UseSuspenseQueryResult<TData> {
	const [observer, snapshot] = useObservedQuery<TData>({
		...options,
		enabled: true,
		staleTime: options.staleTime ?? 1000,
		placeholderData: undefined,
	})

	const hasData = snapshot.data !== undefined && !snapshot.isPlaceholderData
	// Declared before any throw so the hook order never changes between renders.
	const result = useMemo(
		() => (hasData ? { ...snapshot, data: snapshot.data as TData, refetch: () => observer.refetch() } : undefined),
		[hasData, snapshot, observer],
	)
	if (result) return result as UseSuspenseQueryResult<TData>

	// A failed load (not invalidated since) goes to the error boundary.
	if (snapshot.status === "error" && !snapshot.isInvalidated) throw snapshot.error
	// Otherwise wait for the fetch. refetch() joins a request already in flight, so every render
	// of every component waiting on this key waits on the same one.
	throw observer.refetch().then(noop, noop)
}
