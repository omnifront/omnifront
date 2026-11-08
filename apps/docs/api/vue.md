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

One `ComputedRef` per field (`status`, `data`, `error`, `isFetching`, `isStale`, `isInvalidated`, `failureCount`, `dataUpdatedAt`) and `refetch()`.

### `useMutation`

`useMutation(options)`; `options` may be reactive too. Returns a `UseMutationReturn`.

### `UseMutationReturn`

`status`, `data`, `error`, `variables` as `ComputedRef`s, plus `mutate`, `mutateAsync`, `reset`.

### `useStore`

`useStore(source, selector?, equals?)` returns a `ComputedRef` of the selected slice of any `Subscribable`.
