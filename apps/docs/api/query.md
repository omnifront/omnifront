# @omnifront/query

Query client, observers, mutations. About 2.4 KB gzipped (excluding `@omnifront/core`). Hydration helpers are in the subpath `@omnifront/query/hydration`.

## Client

### `QueryClient`

```ts
new QueryClient({ defaultOptions?, scheduler?, gcTime? })
```

Options type: `QueryClientOptions`. `defaultOptions` (`DefaultOptions`) is `{ queries }`: options every observer of this client gets unless it sets its own. `gcTime` is the default for new entries (5 minutes if omitted); `scheduler` replaces the real clock, mostly for tests; `structuralSharing` is an opt-in function (see below).

| Method | |
|---|---|
| `fetchQuery(key, fn, retryOptions?)` | Fetch or join the in-flight request. Resolves with the data. No retries unless `retryOptions` is given. |
| `fetchQuery({ queryKey, queryFn, staleTime?, retry?, retryDelay?, meta? })` | The same as one object (`FetchQueryOptions`). With `staleTime`, cached data younger than that is returned without fetching. |
| `getDefaultOptions()` / `setDefaultOptions(defaults)` | Read or replace `defaultOptions`. Observers pick the new ones up when created or given new options. |
| `removeQuery(key)` | Drop the entry. For entries nothing is watching; see `removeQueries`. |
| `getQueryData(key)` / `getQueryState(key)` | Read the cache (`undefined` if no entry). |
| `setQueryData(key, data or updater)` | Write the cache (new data, or a function from the old data); the entry becomes `success`. |
| `invalidateQueries({ queryKey?, exact? })` | Mark entries outdated; active observers refetch. Resolves when those refetches finish. Filter type: `InvalidateFilter`. |
| `onChange(listener)` | Run `listener` after any entry changes (and once on `clear()`); returns the way to stop. One listener on the client instead of one per query, so unobserved entries stay collectable. What [`createFetchingCount`](/api/query#createfetchingcount) is built on. |
| `cancelQuery(key)` | Abort the in-flight fetch and retry; rejects it with `CancelledError`. |
| `getQuery(key, gcTime?)` | The cache entry (a `Query`), created if missing. |
| `getQueries()` | All entries as `{ key, query }` (used by `dehydrate` and the devtools). |
| `clear()` | Drop every entry and cancel in-flight fetches. |
| `scheduler` | The `Scheduler` in use. |

### `Query`

One cache entry. It is a `Subscribable<QueryState>`. Methods: `fetch(fn, options?)` (`FetchOptions`: the retry options and `meta`), `setData(data, updatedAt?)`, `invalidate()`, `reset()`, `cancel()`, `settled()`, `updateGcTime(ms)`, `destroy()`. You rarely use it directly.

### `QueryObserver`

```ts
new QueryObserver(client, options)         // QueryObserverOptions
```

What the adapters use. It is a `Subscribable<QueryResult>`: the first subscription starts the fetch (if stale and enabled), the last unsubscribe lets the entry start its gc timer.

| Member | |
|---|---|
| `getSnapshot()` | The current `QueryResult` (same reference until something changes). Before anyone subscribes, an entry that will fetch on mount already reports `isFetching: true`. |
| `getServerSnapshot()` | Clock-independent result for SSR and hydration. |
| `refetch({ cancelRefetch? })` | Run the query function again. Joins an in-flight request, or with `cancelRefetch: true` aborts it and starts over. Rejects on failure. |
| `setOptions(options)` | Switch key / update options. Safe to call on every render. |
| `inherit(observer)` | Adopt another observer's "previous data", for adapters that create a new observer per key (so `keepPreviousData` survives key changes). |

### `QueryObserverOptions`

`queryKey`, `queryFn`, `staleTime`, `gcTime`, `enabled`, `retry`, `retryDelay`, `networkMode`, `refetchOnMount`, `refetchOnWindowFocus`, `refetchOnReconnect`, `refetchInterval`, `refetchIntervalInBackground`, `meta`, `initialData`, `initialDataUpdatedAt`, `placeholderData`. See the [options table](/guide/queries#options-reference).

### `FromState`

`FromState<T> = T | ((state: QueryState) => T)`: how `staleTime`, `enabled`, `refetchInterval` and the three `refetchOn…` options accept either a value or a function of the query's current state.

### `RefetchWhen`

`boolean | "always"`. `true` refetches stale data, `"always"` refetches fresh data too, `false` never.

### `DefaultOptions`

`{ queries?: Partial<QueryObserverOptions>, mutations?: Partial<MutationOptions> }` without the per-query fields (`queryKey`, `queryFn`, `initialData`, `initialDataUpdatedAt`, `placeholderData`).

### `FetchQueryOptions`

The object form of `fetchQuery`: `queryKey`, `queryFn`, `staleTime`, `retry`, `retryDelay`, `meta`.

### `FetchOptions`

`RetryOptions` plus `meta`: the second argument of `Query.fetch`.

### `QueryResult`

A `QueryState` plus `isStale`, `isPlaceholderData`, `fetchStatus` (`"fetching"`, `"paused"` or `"idle"`) and the flags `isPending`, `isLoading`, `isRefetching`, `isSuccess`, `isError`, `isLoadingError`, `isRefetchError`.

### `QueryState`

`status`, `data`, `error`, `isFetching`, `isPaused`, `isInvalidated`, `failureCount`, `failureReason`, `dataUpdatedAt`. On the cache entry `isFetching` stays true while a fetch waits for the network (`isPaused`); the observer's `QueryResult.isFetching` is false then. `QueryStatus` is `"idle" | "loading" | "success" | "error"`.

### `QueryFn`

`(context: QueryFnContext) => Promise<TData>`; `QueryFnContext` is `{ signal, queryKey, meta, client }`.

### `SkipToken`

The type of `skipToken`: accepted wherever an observer takes a `queryFn`.

### `QueryKey`

`readonly unknown[]`.

### `DataTag`

`DataTag<TKey, TData>`: a query key that also carries the type of the data stored under it (a type only; the value is the plain key). `queryOptions` returns one, and `getQueryData`, `setQueryData` and `getQueryState` read the data type from it.

### `CancelledError`

Thrown (rejects the promise) when a fetch is cancelled.

### `DefaultError`

The error type of queries and mutations that do not name their own: `Error`, unless `Register` says otherwise. Every type that carries an error takes it as its **second** type argument, as in TanStack Query: `QueryObserver<TData, TError>`, `QueryResult<TData, TError>`, `Mutation<TData, TError, TVariables, TContext>`. It is a type only; nothing checks what a query function really throws.

### `Register`

```ts
declare module "@omnifront/query" {
	interface Register {
		defaultError: ApiError
	}
}
```

Augment it to change `DefaultError` for the whole app.

### `RetryOptions`

`{ retry?, retryDelay? }`. `RetryValue` is `boolean | number | ((failureCount, error) => boolean)` (a number means that many retries); `RetryDelayValue` is `number | ((failureCount, error) => number)`. `failureCount` is 1 on the first failure.

## Staying up to date

### `focusManager`

An [`EnvironmentSignal`](/api/core#environmentsignal): whether the page is visible. Observers refetch stale data when it turns `true`. Follows `visibilitychange` while observed; call `focusManager.set(bool)` to drive it yourself (React Native, tests).

### `onlineManager`

An `EnvironmentSignal`: whether the network is up (`online`/`offline` events). Observers refetch stale data when it turns `true`.

### `keepPreviousData`

`placeholderData: keepPreviousData` keeps the data this observer showed for the previous key until the new key has data.

## Keys

### `hashKey`

`hashKey(key)`: stable string for a key; object property order is ignored.

### `matchesKey`

`matchesKey(key, filter)`: true if `key` starts with / contains everything in `filter` (arrays by position, objects as subsets).

## Mutations

### `Mutation`

```ts
new Mutation({ mutationFn, onSuccess?, onError?, onSettled? }, client?)   // MutationOptions
```

A `Subscribable<MutationState>` (type parameters: data, error, variables, context). Members: `mutate(variables, callbacks?)` (fire and forget), `mutateAsync(variables, callbacks?)`, `reset()`, `setOptions(options)`, `options` (the options in effect). With a `client` it starts from that client's `defaultOptions.mutations` and uses its scheduler for retry delays; the adapters pass theirs. Details in [Mutations](/guide/mutations).

### `MutationOptions`

`mutationFn(variables) => Promise<TData>` and the optional `onMutate(variables)` (returns the context), `onSuccess(data, variables, context)`, `onError(error, variables, context)`, `onSettled(data, error, variables, context)` callbacks (may return promises, which are awaited). Also `retry` / `retryDelay` (default: no retries), `networkMode`, `mutationKey` and `meta` (both for the filters of `useIsMutating` and `useMutationState`).

### `MutateOptions`

`{ onSuccess?, onError?, onSettled? }` for one `mutate` call. They run after the callbacks in the options, only for the latest call, and are not awaited.

### `NetworkMode`

`"online"` (default): wait for the network before fetching and before each retry; the query or mutation is paused meanwhile. `"always"`: never wait (for work that does not use the network). `"offlineFirst"`: try once regardless, then wait before retrying. An option of queries and mutations.

### `MutationState`

`status`, `data`, `error`, `variables`, the flags `isIdle`, `isPending`, `isSuccess`, `isError`, `isPaused` (waiting for the network), and `failureCount`, `failureReason`, `submittedAt`. `MutationStatus` is `"idle" | "pending" | "success" | "error"`.

## Hydration (`@omnifront/query/hydration`)

### `dehydrate`

`dehydrate(client, { shouldDehydrate? })` returns a `DehydratedState`, plain JSON with the successful queries.

### `hydrate`

`hydrate(client, state)` loads it into a client, keeping the server's `dataUpdatedAt` and never overwriting newer data. Accepts `null`/`undefined`.

### `DehydratedState`

`{ queries: Array<{ queryKey, data, dataUpdatedAt }> }`. `DehydrateOptions` is `{ shouldDehydrate?({ queryKey, state }) => boolean }`.

## Structural sharing (`@omnifront/query/structural`)

### `replaceEqualDeep`

`replaceEqualDeep(previous, next)` returns `next`, but with every part that is deeply equal to the same part of `previous` replaced by the previous reference (the whole thing if nothing changed). Plain objects and arrays only; everything else is compared by reference. Enable it with `new QueryClient({ structuralSharing: replaceEqualDeep })`; see [Queries](/guide/queries#stable-references-structural-sharing).

## Prefetching (`@omnifront/query/prefetch`)

### `prefetchQuery`

```ts
prefetchQuery(client, { queryKey, queryFn, staleTime?, retry?, retryDelay? }): Promise<void>
```

Fetch unless the cache holds fresh data (younger than `staleTime`, not invalidated). Joins a request in flight. Never rejects. See [Queries](/guide/queries#prefetching).

### `PrefetchOptions`

The options object of `prefetchQuery`: `queryKey`, `queryFn`, `staleTime` and the retry options.

## Activity (`@omnifront/query/activity`)

How much is loading right now, for a global spinner or top progress bar. The adapters wrap these as `useIsFetching` / `useIsMutating`; use them directly from any other UI. See [Queries](/guide/queries#a-global-loading-indicator) and [ADR-0011](https://github.com/omnifront/omnifront/blob/main/docs/adr/0011-activity.md).

### `createFetchingCount`

```ts
createFetchingCount(client, filter?: InvalidateFilter): Subscribable<number>
```

The number of queries fetching right now, first loads and background refetches alike. `filter` is the same as for `invalidateQueries`: `{ queryKey }` matches by prefix, add `exact: true` for that one key. It only listens to the client while somebody is subscribed, and only notifies when the number changes. `getServerSnapshot()` is `0`.

### `createMutatingCount`

```ts
createMutatingCount(client, filters?: MutationFilters): Subscribable<number>
```

The number of **tracked** mutations that are `pending` (see `trackMutation`) and pass the filters.

### `MutationFilters`

`mutationKey` (prefix match), `exact`, `status` and `predicate: (mutation: MutationInfo) => boolean`.

### `MutationInfo`

`{ mutationKey, meta, state }`: what a `predicate` or `select` sees of a tracked mutation.

### `createMutationState`

```ts
createMutationState(client, { filters?, select? }): Subscribable<TResult[]>
```

The state of every tracked mutation that passes the filters (`select` picks what to keep of each; default: the whole state). The array keeps its identity until a selected value changes. Only mutations that are mounted or still pending are tracked: unlike TanStack's mutation cache, a finished one disappears with the component that owned it.

### `MutationStateOptions`

The options object of `createMutationState`.

### `trackMutation`

```ts
trackMutation(client, mutation): () => void
```

Make a `Mutation` count towards `createMutatingCount(client)`. The adapters' `useMutation` / `injectMutation` call it for you when a client is provided; call it yourself if you create `Mutation`s by hand. The returned function stops tracking, but a mutation that is still pending keeps counting until it settles.

## Filters (`@omnifront/query/filters`)

The `QueryClient` methods that work on many queries at once, as functions that take the client first. They are built on `client.getQueries()`, so they cost nothing unless imported.

### `QueryFilters`

| Field | |
|---|---|
| `queryKey` | Prefix match (objects as subsets). Omit for every query. |
| `exact` | Match `queryKey` exactly. |
| `type` | `"active"` (observed), `"inactive"` (unobserved) or `"all"` (default). |
| `stale` | `true`: invalidated or without data. `false`: the rest. `staleTime` is per observer, so the cache cannot tell that data merely got old. |
| `fetchStatus` | `"fetching"` or `"idle"`. |
| `predicate` | `(query: QueryInfo) => boolean`, run last. |

### `QueryInfo`

`{ queryKey, state, observed }`: what a `predicate` sees of a cache entry.

### `findQueries`

```ts
findQueries(client, filters?): Array<{ key: QueryKey; query: Query }>
```

Every cache entry that passes the filters.

### `matchQuery`

```ts
matchQuery(entry, filters): boolean
```

Test one entry of `client.getQueries()`.

### `invalidateQueries`

```ts
invalidateQueries(client, filters?): Promise<void>
```

`client.invalidateQueries` with the full filters.

### `refetchQueries`

```ts
refetchQueries(client, filters?): Promise<void>
```

Refetch the matching queries that are on screen (observed and enabled), fresh or not. Unobserved entries are left alone, because the cache keeps no query function for them. Never rejects.

### `cancelQueries`

```ts
cancelQueries(client, filters?): void
```

Abort the in-flight fetch of every match.

### `removeQueries`

```ts
removeQueries(client, filters?): void
```

Drop every match from the cache. Meant for entries nothing is watching (a logged-out user's data): a mounted component keeps showing its own copy, so use `resetQueries` for what is on screen.

### `resetQueries`

```ts
resetQueries(client, filters?): Promise<void>
```

Put every match back to its empty state, cancelling fetches in flight. Queries on screen show their loading state and load again; resolves when they have. `initialData` is not restored.

### `getQueriesData`

```ts
getQueriesData<TData>(client, filters?): Array<[QueryKey, TData | undefined]>
```

### `setQueriesData`

```ts
setQueriesData<TData>(client, filters, dataOrUpdater): Array<[QueryKey, TData | undefined]>
```

Update every match. An updater that returns `undefined` leaves that entry untouched.

### `ensureQueryData`

```ts
ensureQueryData(client, { queryKey, queryFn, revalidateIfStale?, staleTime?, retry?, retryDelay? }): Promise<TData>
```

The cached data when there is some (however old), otherwise fetch it. Made for route loaders. With `revalidateIfStale`, stale data is also refetched in the background.

### `EnsureQueryDataOptions`

The options object of `ensureQueryData`.

### `isCancelledError`

```ts
isCancelledError(error): error is CancelledError
```

## Events (`@omnifront/query/events`)

Cache-wide callbacks, for one error toast or logger instead of an `onError` in every component (TanStack's `QueryCache` / `MutationCache` callbacks).

### `onQueryEvents`

```ts
onQueryEvents(client, { onSuccess?, onError?, onSettled? }): () => void
```

Handlers run once per fetch, however many components show the query: `onSuccess(data, query)`, `onError(error, query)` after the retries, `onSettled(data, error, query)`. `query` is `{ queryKey, state }`. Cancelled fetches, `setQueryData` and hydration report nothing. Returns the function that stops listening.

### `QueryEventHandlers`

The handlers object of `onQueryEvents`.

### `QueryEventInfo`

`{ queryKey, state }`.

### `onMutationEvents`

```ts
onMutationEvents(client, { onMutate?, onSuccess?, onError?, onSettled? }): () => void
```

The same for the mutations **tracked** for the client (see `trackMutation`; the adapters' mutation hooks track themselves): `onMutate(variables)`, `onSuccess(data, variables)`, `onError(error, variables)`, `onSettled(data, error, variables)`.

### `MutationEventHandlers`

The handlers object of `onMutationEvents`.

## Options helpers (`@omnifront/query/options`)

### `queryOptions`

```ts
const todos = queryOptions({ queryKey: ["todos"], queryFn: fetchTodos, staleTime: 5_000 })
useQuery(todos)                          // or injectQuery(todos), prefetchQuery(client, todos)
client.getQueryData(todos.queryKey)      // typed as Todo[] | undefined
```

Returns the same object. The key becomes a `DataTag`, so the cache methods know the data type without a generic.

### `skipToken`

```ts
useQuery({ queryKey: ["user", id], queryFn: id ? () => fetchUser(id) : skipToken })
```

Use instead of a query function to say "nothing to fetch yet". The query stays `"idle"` until a real function arrives.

### `mutationOptions`

```ts
mutationOptions({ mutationFn, onSuccess?, ... })
```

Returns the same object; it exists for type inference when a mutation is defined outside a component.
