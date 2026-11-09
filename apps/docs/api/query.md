# @omnifront/query

Query client, observers, mutations. About 2.4 KB gzipped (excluding `@omnifront/core`). Hydration helpers are in the subpath `@omnifront/query/hydration`.

## Client

### `QueryClient`

```ts
new QueryClient({ scheduler?, gcTime? })
```

Options type: `QueryClientOptions`. `gcTime` is the default for new entries (5 minutes if omitted); `scheduler` replaces the real clock, mostly for tests; `structuralSharing` is an opt-in function (see below).

| Method | |
|---|---|
| `fetchQuery(key, fn, retryOptions?)` | Fetch or join the in-flight request. Resolves with the data. No retries unless `retryOptions` is given. |
| `getQueryData(key)` / `getQueryState(key)` | Read the cache (`undefined` if no entry). |
| `setQueryData(key, data or updater)` | Write the cache (new data, or a function from the old data); the entry becomes `success`. |
| `invalidateQueries({ queryKey?, exact? })` | Mark entries outdated; active observers refetch. Resolves when those refetches finish. Filter type: `InvalidateFilter`. |
| `cancelQuery(key)` | Abort the in-flight fetch and retry; rejects it with `CancelledError`. |
| `getQuery(key, gcTime?)` | The cache entry (a `Query`), created if missing. |
| `getQueries()` | All entries as `{ key, query }` (used by `dehydrate` and the devtools). |
| `clear()` | Drop every entry and cancel in-flight fetches. |
| `scheduler` | The `Scheduler` in use. |

### `Query`

One cache entry. It is a `Subscribable<QueryState>`. Methods: `fetch(fn, retryOptions?)`, `setData(data, updatedAt?)`, `invalidate()`, `cancel()`, `settled()`, `updateGcTime(ms)`, `destroy()`. You rarely use it directly.

### `QueryObserver`

```ts
new QueryObserver(client, options)         // QueryObserverOptions
```

What the adapters use. It is a `Subscribable<QueryResult>`: the first subscription starts the fetch (if stale and enabled), the last unsubscribe lets the entry start its gc timer.

| Member | |
|---|---|
| `getSnapshot()` | The current `QueryResult` (same reference until something changes). Before anyone subscribes, an entry that will fetch on mount already reports `isFetching: true`. |
| `getServerSnapshot()` | Clock-independent result for SSR and hydration. |
| `refetch()` | Run the query function again (joins an in-flight request). Rejects on failure. |
| `setOptions(options)` | Switch key / update options. Safe to call on every render. |
| `inherit(observer)` | Adopt another observer's "previous data", for adapters that create a new observer per key (so `keepPreviousData` survives key changes). |

### `QueryObserverOptions`

`queryKey`, `queryFn`, `staleTime`, `gcTime`, `enabled`, `retry`, `retryDelay`, `refetchOnWindowFocus`, `refetchOnReconnect`, `refetchInterval`, `initialData`, `placeholderData`. See the [options table](/guide/queries#options-reference).

### `QueryResult`

A `QueryState` plus `isStale` and `isPlaceholderData`.

### `QueryState`

`status`, `data`, `error`, `isFetching`, `isInvalidated`, `failureCount`, `dataUpdatedAt`. `QueryStatus` is `"idle" | "loading" | "success" | "error"`.

### `QueryFn`

`(context: QueryFnContext) => Promise<TData>`; `QueryFnContext` is `{ signal: AbortSignal }`.

### `QueryKey`

`readonly unknown[]`.

### `CancelledError`

Thrown (rejects the promise) when a fetch is cancelled.

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
new Mutation({ mutationFn, onSuccess?, onError?, onSettled? })   // MutationOptions
```

A `Subscribable<MutationState>` (type parameters: data, variables, context). Members: `mutate(variables)` (fire and forget), `mutateAsync(variables)`, `reset()`, `setOptions(options)`. Details in [Mutations](/guide/mutations).

### `MutationOptions`

`mutationFn(variables) => Promise<TData>` and the optional `onMutate(variables)` (returns the context), `onSuccess(data, variables, context)`, `onError(error, variables, context)`, `onSettled(data, error, variables, context)` callbacks (may return promises, which are awaited).

### `MutationState`

`status`, `data`, `error`, `variables`. `MutationStatus` is `"idle" | "pending" | "success" | "error"`.

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
