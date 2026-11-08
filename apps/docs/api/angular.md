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

## Infinite queries (`@unicore/angular/infinite`)

### `injectInfiniteQuery`

`injectInfiniteQuery(options)`; options may be an object or a function reading signals. Returns an `InjectInfiniteQueryResult`.

### `InjectInfiniteQueryResult`

`result` and one signal per field (`status`, `data`, `error`, `isFetching`, `isStale`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, `isFetchingPreviousPage`), plus `fetchNextPage()`, `fetchPreviousPage()` and `refetch()`.

### `InfiniteQueryObserverOptions`

Re-exported from `@unicore/query-infinite` ([options](/api/query-infinite#infinitequeryobserveroptions)). `InfiniteData` and `InfiniteQueryResult` are re-exported too.

## Server rendering (`@unicore/angular/ssr`)

### `provideUnicoreSsr`

Environment providers: on the server, wait for started queries and write the cache into `TransferState`; in the browser, load it. Add next to `provideUnicore`. See [Server-side rendering](/guide/ssr#angular).
