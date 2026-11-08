# @unicore/react

React 18+. About 0.7 KB gzipped. See the [React guide](/guide/react).

### `QueryProvider`

`<QueryProvider client={client}>`: provides a `QueryClient` to the tree. Props type: `QueryProviderProps`.

### `useQueryClient`

Returns the provided client; throws a helpful error without a provider.

### `useQuery`

`useQuery(options: QueryObserverOptions)` returns a `UseQueryResult`: the full [`QueryResult`](/api/query#queryresult) plus `refetch()`. A new key creates a new observer (which inherits the previous one's data for `keepPreviousData`), so render never touches a subscribed one; other option changes are applied after commit. Uses the observer's `getServerSnapshot` on the server and while hydrating.

### `UseQueryResult`

`QueryResult & { refetch: () => Promise<TData> }`.

### `useMutation`

`useMutation(options: MutationOptions)` returns a `UseMutationResult`: `status`, `data`, `error`, `variables`, `mutate`, `mutateAsync`, `reset`.

### `UseMutationResult`

The state fields plus the three functions.

### `useStore`

`useStore(source, selector?, equals?)`: the selected slice of any `Subscribable` (a store, a query observer, ...). Re-renders only when the selection changes. Keep `selector` and `equals` stable.

### `HydrationBoundary`

`<HydrationBoundary state={dehydratedState}>`: hydrates server-fetched data into the client's cache before its children render. Props type: `HydrationBoundaryProps`.

## Infinite queries (`@unicore/react/infinite`)

### `useInfiniteQuery`

`useInfiniteQuery(options)` returns a `UseInfiniteQueryResult`. Same per-key observer model as `useQuery`.

### `UseInfiniteQueryResult`

An [`InfiniteQueryResult`](/api/query-infinite#infinitequeryresult) plus `fetchNextPage()`, `fetchPreviousPage()` and `refetch()`.

### `InfiniteQueryObserverOptions`

Re-exported from `@unicore/query-infinite` ([options](/api/query-infinite#infinitequeryobserveroptions)). `InfiniteData` and `InfiniteQueryResult` are re-exported too.

## Suspense (`@unicore/react/suspense`)

### `useSuspenseQuery`

`useSuspenseQuery(options)`: suspends while there is no data, throws errors to the error boundary. See the [Suspense guide](/guide/suspense).

### `UseSuspenseQueryResult`

Like `UseQueryResult` but `data` is always defined and `status` is `"success" | "error"`.

## Several queries (`@unicore/react/queries`)

### `useQueries`

`useQueries([options, ...])` runs several queries at once and returns an array of [`UseQueryResult`](/api/react#usequeryresult)s in the same order. With a tuple each result keeps its own data type. A changed set of keys creates new observers. See [Queries](/guide/queries#several-queries-at-once).

### `UseQueriesResults`

The mapped result type of `useQueries`: one `UseQueryResult` per query.

### `useSuspenseInfiniteQuery`

`useSuspenseInfiniteQuery(options)` is [`useInfiniteQuery`](/api/react#useinfinitequery) for Suspense and error boundaries (same rules as `useSuspenseQuery`), exported from `@unicore/react/suspense`.

### `UseSuspenseInfiniteQueryResult`

Like `UseInfiniteQueryResult` with `data` always defined and `status` `"success" | "error"`.
