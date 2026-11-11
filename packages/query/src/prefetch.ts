import type { QueryKey } from "./hash-key"
import type { QueryClient } from "./query-client"
import type { QueryFn } from "./query"
import type { RetryOptions } from "./retry"
import { noop } from "./resolve"

export interface PrefetchOptions<TData> extends RetryOptions {
	queryKey: QueryKey
	queryFn: QueryFn<TData>
	/** Skip the fetch when the cached data is younger than this (ms). Default 0: always fetch unless one is already running. */
	staleTime?: number | undefined
}

/**
 * Warm the cache before a component asks for the data (on hover, on route change, on the server).
 *
 * - Does nothing when fresh data is cached (younger than `staleTime`, not invalidated).
 * - Joins a request already in flight instead of starting another.
 * - Never rejects: a failed prefetch leaves the error in the cache and the component that mounts
 *   later retries on its own. Use `client.fetchQuery` when you need the error.
 */
export function prefetchQuery<TData>(client: QueryClient, options: PrefetchOptions<TData>): Promise<void> {
	return client.fetchQuery(options).then(noop, noop)
}
