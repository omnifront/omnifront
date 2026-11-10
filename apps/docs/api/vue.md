# @omnifront/vue

Vue 3.3+. About 1 KB gzipped. See the [Vue guide](/guide/vue).

### `QueryPlugin`

`app.use(QueryPlugin, client)`.

### `provideQueryClient`

`provideQueryClient(client)`: call in `setup()` to override the client for a subtree.

### `useQueryClient`

Returns the injected client; throws a helpful error if none is installed.

### `useQuery`

`useQuery(options)` where `options` is an object, a `ref`/`computed` or a getter (reactive keys are tracked). Returns a `UseQueryReturn`.

### `UseQueryReturn`

One `ComputedRef` per field of [`QueryResult`](/api/query#queryresult) (`status`, `data`, `error`, `isFetching`, `isStale`, `isPending`, `isLoading`, `isRefetching`, `isSuccess`, `isError`, `isLoadingError`, `isRefetchError`, `failureCount`, `failureReason`, ...) and `refetch(options?)`.

### `UseQueryOptions`

`QueryObserverOptions & { select? }`. `select: (data) => derived` makes `data` the derived value; the cache keeps the original. It runs inside a `computed`, so refs it reads are tracked.

### `useMutation`

`useMutation(options)`; `options` may be reactive too. Returns a `UseMutationReturn`.

### `UseMutationReturn`

One `ComputedRef` per field of [`MutationState`](/api/query#mutationstate) (`status`, `data`, `error`, `variables`, `isIdle`, `isPending`, `isSuccess`, `isError`, `isPaused`, `failureCount`, `failureReason`, `submittedAt`), plus `mutate(variables, callbacks?)`, `mutateAsync(variables, callbacks?)` and `reset`.

### `useStore`

`useStore(source, selector?, equals?)` returns a `ComputedRef` of the selected slice of any `Subscribable`.

## Infinite queries (`@omnifront/vue/infinite`)

### `useInfiniteQuery`

`useInfiniteQuery(options)`; options may be an object, a ref or a getter. Returns a `UseInfiniteQueryReturn`.

### `UseInfiniteQueryReturn`

`ComputedRef`s for `status`, `data`, `error`, `isFetching`, `isStale`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, `isFetchingPreviousPage`, plus `fetchNextPage()`, `fetchPreviousPage()` and `refetch()`.

### `InfiniteQueryObserverOptions`

Re-exported from `@omnifront/query-infinite` ([options](/api/query-infinite#infinitequeryobserveroptions)). `InfiniteData` and `InfiniteQueryResult` are re-exported too.

## Several queries (`@omnifront/vue/queries`)

### `useQueries`

`useQueries(queries)`; `queries` may be an array, a ref or a getter. Returns a `ComputedRef` of an array with one plain result per query (`results.value[0].data`), each with `refetch()`. Server-side it prefetches them all and fails fast. `useQueries(queries, { combine })` returns a `ComputedRef` of whatever `combine(results)` returns instead; see [Queries](/guide/queries#combining-the-results).

### `QueriesResult`

One query's result in that array: the [query result](/api/query#queryresult) fields plus `refetch`.

## Activity (`@omnifront/vue/activity`)

### `useIsFetching`

`useIsFetching(filter?)` returns a `ComputedRef<number>` of the queries fetching right now (first loads and background refetches), for a global spinner. `filter` is `{ queryKey?, exact? }` like `invalidateQueries`, and may be a ref or getter. Stops with the scope; does not subscribe on the server. See [Queries](/guide/queries#a-global-loading-indicator).

### `useMutationState`

`useMutationState({ filters?, select? })` returns a `ComputedRef` of the state of the mutations under the plugin's client that pass the filters. `select` picks what to keep of each (default: the whole state). The options may be a ref or a getter.

### `useIsMutating`

`useIsMutating(filters?)` (`filters`: [`MutationFilters`](/api/query#mutationfilters), plain, a ref or a getter) returns a `ComputedRef<number>` of the pending mutations started with [`useMutation`](/api/vue#usemutation) while the plugin is installed. `useMutation` still works without the plugin; it just has no client to count towards.
