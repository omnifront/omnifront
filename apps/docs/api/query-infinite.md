# @unicore/query-infinite

Infinite and paginated queries. About 1 KB gzipped (excluding core and query). See the [infinite queries guide](/guide/infinite-queries).

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
