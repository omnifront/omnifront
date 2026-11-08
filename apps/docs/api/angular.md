# @unicore/angular

Angular 17+. About 0.7 KB gzipped. See the [Angular guide](/guide/angular).

### `provideUnicore`

`provideUnicore(client)`: environment providers; use in `bootstrapApplication` or a route's `providers`.

### `injectQueryClient`

Returns the provided client; throws a helpful error if `provideUnicore` is missing. Like all `inject*` functions it must run in an injection context.

### `injectQuery`

`injectQuery(options)` where `options` is an object or a function reading signals. Returns an `InjectQueryResult`.

### `InjectQueryResult`

`result` (the whole `QueryResult` as one signal), one signal per field (`status`, `data`, `error`, `isFetching`, `isStale`, `isInvalidated`, `isPlaceholderData`, `failureCount`, `dataUpdatedAt`) and `refetch()`.

### `injectMutation`

`injectMutation(options)`; `options` may be a function reading signals. Returns an `InjectMutationResult`.

### `InjectMutationResult`

`status`, `data`, `error`, `variables` as signals, plus `mutate`, `mutateAsync`, `reset`.

### `injectStore`

`injectStore(source, selector?, equals?)` returns a read-only `Signal` of the selected slice of any `Subscribable`.
