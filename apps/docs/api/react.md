# @omnifront/react

React 18+. About 1 KB gzipped. See the [React guide](/guide/react).

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

`useMutation(options: MutationOptions)` returns a `UseMutationResult`: every field of [`MutationState`](/api/query#mutationstate) (`status`, `data`, `error`, `variables`, `isIdle`, `isPending`, `isSuccess`, `isError`, `isPaused`, `failureCount`, `failureReason`, `submittedAt`), plus `mutate(variables, callbacks?)`, `mutateAsync(variables, callbacks?)` and `reset`. Under a `QueryProvider` it starts from the client's `defaultOptions.mutations`.

### `UseMutationResult`

The state fields plus the three functions.

### `useStore`

`useStore(source, selector?, equals?)`: the selected slice of any `Subscribable` (a store, a query observer, ...). Re-renders only when the selection changes. Keep `selector` and `equals` stable.

### `HydrationBoundary`

`<HydrationBoundary state={dehydratedState} options?>`: hydrates server-fetched data into the client's cache before its children render. `options` is `{ deserializeData }` when the server used `serializeData` (keep it stable). Props type: `HydrationBoundaryProps`.

## Infinite queries (`@omnifront/react/infinite`)

### `useInfiniteQuery`

`useInfiniteQuery(options)` returns a `UseInfiniteQueryResult`. Same per-key observer model as `useQuery`.

### `UseInfiniteQueryOptions`

`InfiniteQueryObserverOptions` plus `select: (data: InfiniteData) => derived`. `data` (and what `refetch` resolves with) is the derived value; the cache keeps the pages. It is memoized with `useMemo`, so keep it stable. `useSuspenseInfiniteQuery` takes it too.

### `UseInfiniteQueryResult`

An [`InfiniteQueryResult`](/api/query-infinite#infinitequeryresult) plus `fetchNextPage()`, `fetchPreviousPage()` and `refetch()`.

### `InfiniteQueryObserverOptions`

Re-exported from `@omnifront/query-infinite` ([options](/api/query-infinite#infinitequeryobserveroptions)). `InfiniteData` and `InfiniteQueryResult` are re-exported too.

## Suspense (`@omnifront/react/suspense`)

### `useSuspenseQuery`

`useSuspenseQuery(options)`: suspends while there is no data, throws errors to the error boundary. See the [Suspense guide](/guide/suspense).

### `UseSuspenseQueryResult`

Like `UseQueryResult` but `data` is always defined and `status` is `"success" | "error"`.

### `usePrefetchQuery`

`usePrefetchQuery({ queryKey, queryFn, staleTime? })`: starts the request while the component renders, unless the query is already in the cache. Put it above a child that suspends so the two requests do not queue. It returns nothing. See the [Suspense guide](/guide/suspense#several-queries-at-once-and-no-waterfalls).

## Several queries (`@omnifront/react/queries`)

### `useQueries`

`useQueries([options, ...])` runs several queries at once and returns an array of [`UseQueryResult`](/api/react#usequeryresult)s in the same order. With a tuple each result keeps its own data type. Any query may have a `select`, which should be stable (defined outside the component). A changed set of keys creates new observers. `useQueries(queries, { combine })` returns whatever `combine(results)` returns instead of the array; see [Queries](/guide/queries#combining-the-results). See [Queries](/guide/queries#several-queries-at-once).

`useQueries({ queries, combine })` is the same hook with TanStack's single-object shape.

### `useSuspenseQueries`

`useSuspenseQueries({ queries, combine? })`: `useQueries` for Suspense and error boundaries. Suspends until every query has data (they load in parallel), throws the first failure, and every `data` is defined. `enabled` and `placeholderData` are ignored and `staleTime` defaults to 1 second, as in `useSuspenseQuery`. Results are typed by [`UseSuspenseQueriesResultsOf`](/api/react#usesuspensequeriesresultsof).

### `UseSuspenseQueriesResultsOf`

`UseSuspenseQueriesResultsOf<Q>`: the results of a list `Q` of options, each a `UseSuspenseQueryResult` of its `QueryData`.

### `UseQueriesOption`

What every query of `useQueries` looks like: `QueryObserverOptions` plus an optional `select`. Each result's data type is read off the real options by `QueryData`: what `select` returns, else what the query function resolves to.

### `QueryData`

`QueryData<O>`: the data type a query of `useQueries` ends up with.

### `UseQueriesResultsOf`

`UseQueriesResultsOf<Q>`: the results of a list `Q` of options (`UseQueriesResults` of their `QueryData`).

### `UseQueriesResults`

The mapped result type of `useQueries`: one `UseQueryResult` per query.

### `useSuspenseInfiniteQuery`

`useSuspenseInfiniteQuery(options)` is [`useInfiniteQuery`](/api/react#useinfinitequery) for Suspense and error boundaries (same rules as `useSuspenseQuery`), exported from `@omnifront/react/suspense`.

### `UseSuspenseInfiniteQueryResult`

Like `UseInfiniteQueryResult` with `data` always defined and `status` `"success" | "error"`.

## Errors (`@omnifront/react/errors`)

`useQuery` takes `throwOnError: true | (error) => boolean`: a failure that has settled (not one being retried or refetched) is thrown during render, so the nearest error boundary shows it. This is the main entry; the retry helpers below are opt-in.

### `QueryErrorResetBoundary`

`<QueryErrorResetBoundary>{({ reset }) => ...}</QueryErrorResetBoundary>`: gives its children (a node, or a function of `{ reset }`) a `reset` to call from your error boundary's retry. It renders nothing of its own.

### `useQueryErrorResetBoundary`

`useQueryErrorResetBoundary()` returns `{ reset }` for the nearest client. `reset()` marks every failed query outdated, so the query loads again the next time it renders or mounts instead of rethrowing the old error.

### `QueryErrorReset`

The `{ reset }` type.

## Activity (`@omnifront/react/activity`)

### `useIsFetching`

`useIsFetching(filter?)` returns the number of queries fetching right now (first loads and background refetches), for a global spinner. `filter` is `{ queryKey?, exact? }` like `invalidateQueries`; defining it inline is fine, it is compared by value. Renders `0` on the server and while hydrating. See [Queries](/guide/queries#a-global-loading-indicator).

### `useMutationState`

```ts
const adding = useMutationState({ filters: { mutationKey: ["addTodo"], status: "pending" }, select: (m) => m.state.variables })
```

The state of the mutations under the same `QueryProvider` that pass the filters, for showing elsewhere what a mutation is doing (an optimistic row in a list, say). `select` picks what to keep of each; default: the whole state.

### `useIsMutating`

`useIsMutating(filters?)` returns the number of pending mutations (`filters`: [`MutationFilters`](/api/query#mutationfilters), compared by value, so writing them inline is fine) started with [`useMutation`](/api/react#usemutation) under the same `QueryProvider`. `useMutation` still works without a provider; it just has no client to count towards.
