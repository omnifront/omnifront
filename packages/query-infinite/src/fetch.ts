import type { DataTag, DefaultError, QueryClient, QueryKey } from "@omnifront/query"
import type { InfiniteData, InfiniteQueryObserverOptions } from "./infinite-observer"

const noop = (): void => {}

export interface FetchInfiniteQueryOptions<TPage, TError = DefaultError, TPageParam = unknown>
	extends Pick<
		InfiniteQueryObserverOptions<TPage, TError, TPageParam>,
		"queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam" | "retry" | "retryDelay"
	> {
	/** How many pages to load, following `getNextPageParam`. Default 1. Stops early when there is no next page. */
	pages?: number | undefined
	/** Skip the fetch when the cached pages are younger than this (ms). Default 0: always fetch. */
	staleTime?: number | undefined
}

/**
 * Load the first page(s) of an infinite query into the cache, outside a component (a route loader,
 * the server). Returns cached pages that are still fresh; joins a request in flight. Rejects on failure.
 */
export function fetchInfiniteQuery<TPage, TError = DefaultError, TPageParam = unknown>(
	client: QueryClient,
	options: FetchInfiniteQueryOptions<TPage, TError, TPageParam>,
): Promise<InfiniteData<TPage, TPageParam>> {
	const { queryKey, queryFn, getNextPageParam } = options
	const { data, dataUpdatedAt, isInvalidated } = client.getQuery<InfiniteData<TPage, TPageParam>, TError>(queryKey).getSnapshot()
	if (data && !isInvalidated && client.scheduler.now() - (dataUpdatedAt ?? 0) < (options.staleTime ?? 0)) {
		return Promise.resolve(data)
	}
	return client.fetchQuery<InfiniteData<TPage, TPageParam>, TError>(
		queryKey,
		async ({ signal }) => {
			const pages: TPage[] = []
			const pageParams: TPageParam[] = []
			let param: TPageParam | undefined | null = options.initialPageParam
			for (let i = 0; i < (options.pages ?? 1) && param != null; i++) {
				const page = await queryFn({ signal, pageParam: param })
				pages.push(page)
				pageParams.push(param)
				param = getNextPageParam(page, pages, param, pageParams)
			}
			return { pages, pageParams }
		},
		options,
	)
}

/** `fetchInfiniteQuery` that never rejects: a failure stays in the cache and the component retries. */
export function prefetchInfiniteQuery<TPage, TError = DefaultError, TPageParam = unknown>(
	client: QueryClient,
	options: FetchInfiniteQueryOptions<TPage, TError, TPageParam>,
): Promise<void> {
	return fetchInfiniteQuery(client, options).then(noop, noop)
}

/** The cached pages when there are some (however old), otherwise `fetchInfiniteQuery`. */
export function ensureInfiniteQueryData<TPage, TError = DefaultError, TPageParam = unknown>(
	client: QueryClient,
	options: FetchInfiniteQueryOptions<TPage, TError, TPageParam>,
): Promise<InfiniteData<TPage, TPageParam>> {
	const data = client.getQueryData<InfiniteData<TPage, TPageParam>>(options.queryKey)
	return data ? Promise.resolve(data) : fetchInfiniteQuery(client, options)
}

/**
 * Define an infinite query once and reuse it (`useInfiniteQuery(feed)`, `fetchInfiniteQuery(client, feed)`).
 * Returns the same object; the key remembers the data type for `client.getQueryData(feed.queryKey)`.
 */
export function infiniteQueryOptions<TPage, TError = DefaultError, TPageParam = unknown, const TKey extends QueryKey = QueryKey>(
	options: Omit<InfiniteQueryObserverOptions<TPage, TError, TPageParam>, "queryKey"> & { queryKey: TKey },
): Omit<InfiniteQueryObserverOptions<TPage, TError, TPageParam>, "queryKey"> & {
	queryKey: DataTag<TKey, InfiniteData<TPage, TPageParam>>
} {
	return options as never
}
