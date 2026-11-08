# @unicore/vue

Vue 3.3+. About 0.8 KB gzipped. See the [Vue guide](/guide/vue).

### `QueryPlugin`

`app.use(QueryPlugin, client)`.

### `provideQueryClient`

`provideQueryClient(client)`: call in `setup()` to override the client for a subtree.

### `useQueryClient`

Returns the injected client; throws a helpful error if none is installed.

### `useQuery`

`useQuery(options)` where `options` is an object, a `ref`/`computed` or a getter (reactive keys are tracked). Returns a `UseQueryReturn`.

### `UseQueryReturn`

One `ComputedRef` per field (`status`, `data`, `error`, `isFetching`, `isStale`, `isInvalidated`, `isPlaceholderData`, `failureCount`, `dataUpdatedAt`) and `refetch()`.

### `useMutation`

`useMutation(options)`; `options` may be reactive too. Returns a `UseMutationReturn`.

### `UseMutationReturn`

`status`, `data`, `error`, `variables` as `ComputedRef`s, plus `mutate`, `mutateAsync`, `reset`.

### `useStore`

`useStore(source, selector?, equals?)` returns a `ComputedRef` of the selected slice of any `Subscribable`.

## Infinite queries (`@unicore/vue/infinite`)

### `useInfiniteQuery`

`useInfiniteQuery(options)`; options may be an object, a ref or a getter. Returns a `UseInfiniteQueryReturn`.

### `UseInfiniteQueryReturn`

`ComputedRef`s for `status`, `data`, `error`, `isFetching`, `isStale`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, `isFetchingPreviousPage`, plus `fetchNextPage()`, `fetchPreviousPage()` and `refetch()`.

### `InfiniteQueryObserverOptions`

Re-exported from `@unicore/query-infinite` ([options](/api/query-infinite#infinitequeryobserveroptions)). `InfiniteData` and `InfiniteQueryResult` are re-exported too.

## Several queries (`@unicore/vue/queries`)

### `useQueries`

`useQueries(queries)`; `queries` may be an array, a ref or a getter. Returns a `ComputedRef` of an array with one plain result per query (`results.value[0].data`), each with `refetch()`. Server-side it prefetches them all and fails fast.

### `QueriesResult`

One query's result in that array: the [query result](/api/query#queryresult) fields plus `refetch`.
