# @omnifront/react

React 18+. About 0.8 KB gzipped. See the [React guide](/guide/react).

### `QueryProvider`

`<QueryProvider client={client}>`: provides a `QueryClient` to the tree. Props type: `QueryProviderProps`.

### `useQueryClient`

Returns the provided client; throws a helpful error without a provider.

### `useQuery`

`useQuery(options: QueryObserverOptions)` returns a `UseQueryResult`: the full [`QueryResult`](/api/query#queryresult) plus `refetch()`. A new key creates a new observer (which inherits the previous one's data for `keepPreviousData`), so render never touches a subscribed one; other option changes are applied after commit. Uses the observer's `getServerSnapshot` on the server and while hydrating.

### `UseQueryResult`

`QueryResult & { refetch: (options?) => Promise<TData> }`. `refetch({ cancelRefetch: true })` aborts a request in flight instead of joining it.

### `UseQueryOptions`

`QueryObserverOptions & { select? }`. `select: (data) => derived` makes `data` (and what `refetch` resolves with) the derived value; the cache keeps the original. It is memoized with `useMemo` on the data and the function, so pass a stable function to avoid recomputing on every render. `useSuspenseQuery` takes it too.

### `useMutation`

`useMutation(options: MutationOptions)` returns a `UseMutationResult`: `status`, `data`, `error`, `variables`, `mutate`, `mutateAsync`, `reset`.

### `UseMutationResult`

The state fields plus the three functions.

### `useStore`

`useStore(source, selector?, equals?)`: the selected slice of any `Subscribable` (a store, a query observer, ...). Re-renders only when the selection changes. Keep `selector` and `equals` stable.

### `HydrationBoundary`

`<HydrationBoundary state={dehydratedState}>`: hydrates server-fetched data into the client's cache before its children render. Props type: `HydrationBoundaryProps`.

## Infinite queries (`@omnifront/react/infinite`)

### `useInfiniteQuery`

`useInfiniteQuery(options)` returns a `UseInfiniteQueryResult`. Same per-key observer model as `useQuery`.

### `UseInfiniteQueryResult`

An [`InfiniteQueryResult`](/api/query-infinite#infinitequeryresult) plus `fetchNextPage()`, `fetchPreviousPage()` and `refetch()`.

### `InfiniteQueryObserverOptions`

Re-exported from `@omnifront/query-infinite` ([options](/api/query-infinite#infinitequeryobserveroptions)). `InfiniteData` and `InfiniteQueryResult` are re-exported too.

## Suspense (`@omnifront/react/suspense`)

### `useSuspenseQuery`

`useSuspenseQuery(options)`: suspends while there is no data, throws errors to the error boundary. See the [Suspense guide](/guide/suspense).

### `UseSuspenseQueryResult`

Like `UseQueryResult` but `data` is always defined and `status` is `"success" | "error"`.

## Several queries (`@omnifront/react/queries`)

### `useQueries`

`useQueries([options, ...])` runs several queries at once and returns an array of [`UseQueryResult`](/api/react#usequeryresult)s in the same order. With a tuple each result keeps its own data type. A changed set of keys creates new observers. `useQueries(queries, { combine })` returns whatever `combine(results)` returns instead of the array; see [Queries](/guide/queries#combining-the-results). See [Queries](/guide/queries#several-queries-at-once).

### `UseQueriesResults`

The mapped result type of `useQueries`: one `UseQueryResult` per query.

### `useSuspenseInfiniteQuery`

`useSuspenseInfiniteQuery(options)` is [`useInfiniteQuery`](/api/react#useinfinitequery) for Suspense and error boundaries (same rules as `useSuspenseQuery`), exported from `@omnifront/react/suspense`.

### `UseSuspenseInfiniteQueryResult`

Like `UseInfiniteQueryResult` with `data` always defined and `status` `"success" | "error"`.

## Activity (`@omnifront/react/activity`)

### `useIsFetching`

`useIsFetching(filter?)` returns the number of queries fetching right now (first loads and background refetches), for a global spinner. `filter` is `{ queryKey?, exact? }` like `invalidateQueries`; defining it inline is fine, it is compared by value. Renders `0` on the server and while hydrating. See [Queries](/guide/queries#a-global-loading-indicator).

### `useIsMutating`

`useIsMutating()` returns the number of pending mutations started with [`useMutation`](/api/react#usemutation) under the same `QueryProvider`. `useMutation` still works without a provider; it just has no client to count towards.
