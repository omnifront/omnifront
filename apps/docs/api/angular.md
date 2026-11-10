# @omnifront/angular

Angular 17+. About 0.9 KB gzipped. See the [Angular guide](/guide/angular).

### `provideOmnifront`

`provideOmnifront(client)`: environment providers; use in `bootstrapApplication` or a route's `providers`.

### `injectQueryClient`

Returns the provided client; throws a helpful error if `provideOmnifront` is missing. Like all `inject*` functions it must run in an injection context.

### `injectQuery`

`injectQuery(options)` where `options` is an object or a function reading signals. Returns an `InjectQueryResult`.

### `InjectQueryResult`

`result` (the whole `QueryResult` as one signal), one signal per field of [`QueryResult`](/api/query#queryresult) (`status`, `data`, `error`, `isFetching`, `isStale`, `isPending`, `isLoading`, `isRefetching`, `isSuccess`, `isError`, `isLoadingError`, `isRefetchError`, `failureCount`, `failureReason`, ...) and `refetch(options?)`.

### `InjectQueryOptions`

`QueryObserverOptions & { select? }`. `select: (data) => derived` makes `data` (also inside `result`) the derived value; the cache keeps the original. It runs inside a `computed`, so signals it reads are tracked.

### `injectMutation`

`injectMutation(options)`; `options` may be a function reading signals. Returns an `InjectMutationResult`.

### `InjectMutationResult`

`status`, `data`, `error`, `variables` as signals, plus `mutate`, `mutateAsync`, `reset`.

### `injectStore`

`injectStore(source, selector?, equals?)` returns a read-only `Signal` of the selected slice of any `Subscribable`.

## Infinite queries (`@omnifront/angular/infinite`)

### `injectInfiniteQuery`

`injectInfiniteQuery(options)`; options may be an object or a function reading signals. Returns an `InjectInfiniteQueryResult`.

### `InjectInfiniteQueryResult`

`result` and one signal per field (`status`, `data`, `error`, `isFetching`, `isStale`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, `isFetchingPreviousPage`), plus `fetchNextPage()`, `fetchPreviousPage()` and `refetch()`.

### `InfiniteQueryObserverOptions`

Re-exported from `@omnifront/query-infinite` ([options](/api/query-infinite#infinitequeryobserveroptions)). `InfiniteData` and `InfiniteQueryResult` are re-exported too.

## Server rendering (`@omnifront/angular/ssr`)

### `provideOmnifrontSsr`

Environment providers: on the server, wait for started queries and write the cache into `TransferState`; in the browser, load it. Add next to `provideOmnifront`. See [Server-side rendering](/guide/ssr#angular).

## Several queries (`@omnifront/angular/queries`)

### `injectQueries`

`injectQueries(queries)`; `queries` may be an array or a function reading signals. Returns one `Signal` of an array of results, each with `refetch()`. `injectQueries(queries, { combine })` returns a `Signal` of whatever `combine(results)` returns instead; see [Queries](/guide/queries#combining-the-results).

### `QueriesResult`

A [query result](/api/query#queryresult) plus `refetch`.

## Activity (`@omnifront/angular/activity`)

### `injectIsFetching`

`injectIsFetching(filter?)` returns a `Signal<number>` of the queries fetching right now (first loads and background refetches), for a global spinner. `filter` is `{ queryKey?, exact? }` like `invalidateQueries`, or a function reading signals to make it reactive. Must run in an injection context. See [Queries](/guide/queries#a-global-loading-indicator).

### `injectIsMutating`

`injectIsMutating()` returns a `Signal<number>` of the pending mutations started with [`injectMutation`](/api/angular#injectmutation) under the same `provideOmnifront` client. `injectMutation` still works without a provider; it just has no client to count towards.
