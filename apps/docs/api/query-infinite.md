# @omnifront/query-infinite

Infinite and paginated queries. About 1.4 KB gzipped (excluding core and query). See the [infinite queries guide](/guide/infinite-queries).

### `InfiniteQueryObserver`

```ts
new InfiniteQueryObserver(client, options)       // options: InfiniteQueryObserverOptions
```

A `Subscribable<InfiniteQueryResult>` built on a `QueryObserver`.

| Member | |
|---|---|
| `getSnapshot()` / `getServerSnapshot()` | The current result (stable reference; the server one never reads the clock). |
| `fetchNextPage()` | Load the page after the last. Resolves when done; never rejects. |
| `fetchPreviousPage()` | Load the page before the first (needs `getPreviousPageParam`). |
| `refetch()` | Reload every loaded page in order. Rejects on failure. |
| `setOptions(options)` | Update options / switch key. |
| `inherit(observer)` | Carry over the previous data (for adapters that create an observer per key). |

### `InfiniteQueryObserverOptions`

Every [query option](/guide/queries#options-reference) except `queryFn`, plus `queryFn` (loads one page), `initialPageParam`, `getNextPageParam` and the optional `getPreviousPageParam` and `maxPages`.

### `InfiniteQueryFnContext`

`{ signal, pageParam }`: the `AbortSignal` and the cursor of the page to load.

### `InfiniteData`

`{ pages: TPage[]; pageParams: TPageParam[] }`, what the cache entry holds.

### `InfiniteQueryResult`

A [`QueryResult`](/api/query#queryresult) of `InfiniteData`, plus `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, `isFetchingPreviousPage`.

## Outside components

### `fetchInfiniteQuery`

```ts
fetchInfiniteQuery(client, { queryKey, queryFn, initialPageParam, getNextPageParam, pages?, staleTime?, retry?, retryDelay? }): Promise<InfiniteData>
```

Load the first page (or the first `pages` pages) into the cache from a route loader or the server. Returns cached pages younger than `staleTime` without fetching; joins a request in flight. Rejects on failure.

### `prefetchInfiniteQuery`

The same, but never rejects: a failure stays in the cache and the component retries when it mounts.

### `ensureInfiniteQueryData`

The cached pages when there are some (however old), otherwise `fetchInfiniteQuery`.

### `FetchInfiniteQueryOptions`

The options object of the three functions above.

### `infiniteQueryOptions`

```ts
const feed = infiniteQueryOptions({ queryKey: ["feed"], queryFn, initialPageParam: 0, getNextPageParam })
```

Define an infinite query once and pass it to `useInfiniteQuery`, `injectInfiniteQuery` or `fetchInfiniteQuery`. Returns the same object; `feed.queryKey` carries the data type for `client.getQueryData`.
