# Queries

A query is a cached, shared, deduplicated async read. Its identity is its **key**.

## Keys

A key is an array. Two keys that are structurally equal are the same cache entry; the order of properties inside objects does not matter.

```ts
["todos"]
["todos", { page: 1, done: false }]   // equals ["todos", { done: false, page: 1 }]
["user", userId]
```

Invalidation and cancellation match **by prefix**: `["todos"]` also matches `["todos", { page: 1 }]` (objects match as subsets). Pass `exact: true` to match one key only.

## What the result tells you

| Field | Meaning |
|---|---|
| `status` | `"idle"` (never fetched, not going to), `"loading"` (no data yet, fetching), `"success"` (has data), `"error"` (last fetch failed; old `data` is kept if there was any) |
| `data` | Last successful data, or `undefined` |
| `error` | Error of the last failed fetch |
| `isFetching` | A request (or a retry wait) is in progress, including background refetches |
| `isStale` | The data is older than `staleTime`, was invalidated, or does not exist |
| `isInvalidated` | Marked outdated by `invalidateQueries`; cleared when the next fetch starts |
| `failureCount` | Failures so far in the current fetch (for "retrying…" UI) |
| `dataUpdatedAt` | Scheduler time of the last success |
| `isPlaceholderData` | `data` is the `placeholderData`, not real data |
| `failureReason` | Error of the latest failed attempt, also while it is being retried |
| `isPending` | No data yet (`status` is `"idle"` or `"loading"`) |
| `isLoading` | The first load is running (`isPending && isFetching`) |
| `isRefetching` | A background refetch is running (there is data, and `isFetching`) |
| `fetchStatus`, `isPaused` | `"fetching"`, `"paused"` (waiting for the network; `isFetching` is false then) or `"idle"` |
| `isSuccess`, `isError` | `status` is `"success"` / `"error"` |
| `isLoadingError`, `isRefetchError` | Failed with nothing to show / a refetch failed and the old data is kept |

`status` and `isFetching` are independent: a background refetch of existing data is `status: "success"` with `isFetching: true`.

## Freshness: `staleTime` and `gcTime`

- **`staleTime`** (default `0`): how long data counts as fresh. While fresh, mounting another component that uses the key does **not** refetch. `Infinity` means never stale. When data goes stale while someone is watching, listeners are notified (so `isStale` updates), but omnifront does not refetch on its own; it refetches on mount, on `invalidateQueries`, or when you call `refetch()`.
- **`gcTime`** (default 5 minutes): how long an entry nobody observes is kept before it is removed. When several observers ask for different values, the longest wins. `Infinity` keeps it forever.

```ts
useQuery({ queryKey: ["config"], queryFn: loadConfig, staleTime: 60_000, gcTime: 10 * 60_000 })
```

## Retries and cancellation

Queries run through observers (the hooks) retry **3 times** with exponential backoff (1 s, 2 s, 4 s, ... capped at 30 s). Calls to `client.fetchQuery` do not retry unless you pass options.

```ts
useQuery({
	queryKey: ["flaky"],
	queryFn: load,
	retry: (failureCount, error) => failureCount < 5 && !(error instanceof NotFound),
	retryDelay: (failureCount) => failureCount * 500,
})
```

`queryFn` receives `{ signal }`, an `AbortSignal`. Pass it to `fetch` so a cancelled request really stops. `client.cancelQuery(key)` aborts the in-flight request and any pending retry, restores the previous state (data stays, or the entry returns to `"idle"`) and rejects the promise with `CancelledError`.

## Refetching automatically

Besides mounting and invalidation, stale queries refetch when the world changes:

- **Window focus**: when the page becomes visible again (`refetchOnWindowFocus`, default `true`).
- **Reconnect**: when the browser goes back online (`refetchOnReconnect`, default `true`).
- **Polling**: `refetchInterval: 5000` refetches every 5 seconds while observed, even if the data is fresh, and skips ticks while the page is hidden.

Focus and reconnect only refetch **stale** data, so a `staleTime` shields a query from them. Both signals are plain objects you can drive yourself, which is how you support React Native or tests:

```ts
import { focusManager, onlineManager } from "@omnifront/query"
focusManager.set(AppState.currentState === "active")   // React Native
onlineManager.set(false)
```

They only attach browser listeners while some query is observed, so they cost nothing in Node or on the server.

## Starting data: `initialData` and `placeholderData`

```ts
// Real data you already have (from a list, from localStorage). Cached like fetched data,
// ages like fetched data, and is refetched on mount if it is stale.
useQuery({ queryKey: ["todo", id], queryFn: loadTodo, initialData: () => findInList(id), staleTime: 30_000 })

// A stand-in shown while loading. Never cached; `isPlaceholderData` tells you it is not real.
useQuery({ queryKey: ["todo", id], queryFn: loadTodo, placeholderData: { title: "Loading…" } })
```

`initialData` is ignored when the cache already has data for the key. While a placeholder is shown, `status` is `"success"`, `data` is the placeholder, `isPlaceholderData` is `true` and `isFetching` is `true`.

### Pagination without flicker

`placeholderData` can be a function of the data this component showed before. `keepPreviousData` is exactly that:

```ts
import { keepPreviousData } from "@omnifront/query"

const page = ref(1)
const { data, isPlaceholderData } = useQuery(() => ({
	queryKey: ["items", page.value],
	queryFn: () => loadItems(page.value),
	placeholderData: keepPreviousData, // keep page 1 on screen until page 2 arrives
}))
```

## Several queries at once

`useQueries` (React), `useQueries` (Vue) and `injectQueries` (Angular) run a list of queries in parallel and give back their results in order. The list can be built at run time and can grow and shrink.

```tsx
import { useQueries } from "@omnifront/react/queries"

const [user, posts] = useQueries([
	{ queryKey: ["user", id], queryFn: () => loadUser(id) },
	{ queryKey: ["posts", id], queryFn: () => loadPosts(id), enabled: user.data !== undefined }, // dependent
])
```

Vue: `import { useQueries } from "@omnifront/vue/queries"` (one array of plain results). Angular: `injectQueries` from `@omnifront/angular/queries` (one signal of an array). **Dependent queries** need no special API: set `enabled` on the later query. (The `user` above is the previous render's result, so the second query starts once the first has data.)

### Combining the results

Pass `combine` in a second argument to turn the results into one value, for example a single loading flag or a merged list. The hook returns what `combine` returns instead of the array:

```tsx
const combine = (results) => ({
	loading: results.some((r) => r.status === "loading"),
	data: results.map((r) => r.data),
})

const { loading, data } = useQueries(
	[
		{ queryKey: ["user", id], queryFn: () => loadUser(id) },
		{ queryKey: ["posts", id], queryFn: () => loadPosts(id) },
	],
	{ combine },
)
```

`combine` runs again only when some result changed, and its return value keeps its identity until then, so it is safe to feed into memoized children or effects. Keep the function itself stable (define it outside the component, or memoize it): a new function means it runs again. In Vue and Angular the same second argument gives you a `ref` / `Signal` of the combined value (`useQueries(queries, { combine })`, `injectQueries(queries, { combine })`). Unlike TanStack Query, the list goes first and `combine` second, not `{ queries, combine }` in one object.

## Stable references: structural sharing

By default a refetch that returns equal data still produces a new object, so anything memoized on it re-runs. Opt in to keep the old references for the parts that did not change:

```ts
import { QueryClient } from "@omnifront/query"
import { replaceEqualDeep } from "@omnifront/query/structural"

const client = new QueryClient({ structuralSharing: replaceEqualDeep })
```

A refetch returning the same list with one item changed keeps the identity of every other item (and of the list, if nothing changed). It works on plain objects and arrays (JSON-like data) and costs a deep comparison per fetch, so it is off by default. It also applies to `setQueryData`.

## Prefetching

Warm the cache before a component needs the data, for example when the user hovers a link:

```ts
import { prefetchQuery } from "@omnifront/query/prefetch"

prefetchQuery(client, { queryKey: ["user", id], queryFn: () => loadUser(id), staleTime: 30_000 })
```

It skips the fetch when the cached data is younger than `staleTime` (default 0: always fetch, unless a request is already running, which it joins). It **never rejects**; a failure stays in the cache and the component that mounts later retries by itself. Use `client.fetchQuery` when you need the error, for example to prefetch on the server and fail the request. It is a separate entry so apps that do not prefetch do not pay for it ([ADR-0010](https://github.com/omnifront/omnifront/blob/main/docs/adr/0010-prefetch.md)).

## A global loading indicator

For a top progress bar or a spinner next to the logo, count what is loading across the whole cache:

```tsx
import { useIsFetching, useIsMutating } from "@omnifront/react/activity"

function TopBar() {
	const fetching = useIsFetching()                              // every query, first loads and background refetches
	const todos = useIsFetching({ queryKey: ["todos"] })          // only queries whose key starts with "todos"
	const saving = useIsMutating()                                // pending mutations
	return fetching + saving > 0 ? <ProgressBar /> : null
}
```

Vue has the same names returning a `ComputedRef<number>` (the filter may be a ref or getter); Angular has `injectIsFetching()` and `injectIsMutating()` returning a `Signal<number>` (the filter may be a function reading signals). Outside a framework, `createFetchingCount(client, filter?)` and `createMutatingCount(client)` from `@omnifront/query/activity` are plain subscribables.

`useIsMutating` counts mutations started with `useMutation` under the same provider; it has no filter because mutations have no key. They are separate entries, so apps without a global indicator do not pay for them ([ADR-0011](https://github.com/omnifront/omnifront/blob/main/docs/adr/0011-activity.md)).

## Turning a query off

`enabled: false` means no automatic fetch; the entry stays `"idle"`. Flipping it to `true` fetches.

```ts
useQuery({ queryKey: ["user", id], queryFn: () => loadUser(id), enabled: id !== undefined })
```

`skipToken` says the same through the function, which keeps TypeScript happy without a non-null assertion:

```ts
import { skipToken } from "@omnifront/query/options"

useQuery({ queryKey: ["user", id], queryFn: id ? () => loadUser(id) : skipToken })
```

## Deriving data: `select`

```ts
const { data: names } = useQuery({ ...todosQuery, select: (todos) => todos.map((t) => t.title) })
```

`data` is what `select` returns; the cache keeps the original, so other components can select something else from the same entry. The adapters memoize it with their framework's own tool (`useMemo` in React, `computed` in Vue and Angular). In React that means: a function defined inline is a new function on every render and runs again each time, so define it outside the component or wrap it in `useCallback` when the work is not trivial. Outside the adapters, [`derive`](/api/core) does the same for any `Subscribable`. Queries in `useQueries` and [infinite queries](/guide/infinite-queries#deriving-data-select) take `select` too; in a list of queries give every query one, or none (React reads each result's type off its own options, Vue and Angular give a list one data type).

## Defaults for every query

```ts
const client = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })
```

Every hook of this client starts from these; a query's own options win. They apply to observers (the hooks), not to `client.fetchQuery`.

## Refetching and the cache

```ts
const todos = useQuery(/* ... */)
await todos.refetch()                        // run the queryFn again (joins an in-flight request)

client.invalidateQueries({ queryKey: ["todos"] })   // mark outdated; active observers refetch now
client.setQueryData(["todos"], newList)             // write the cache directly
client.setQueryData<string[]>(["todos"], (old) => [...(old ?? []), "new"]) // or from the old value
client.getQueryData<string[]>(["todos"])            // read it
client.fetchQuery(["todos"], loadTodos)             // imperative fetch (also for prefetching)
```

`invalidateQueries` returns a promise that resolves when the refetches it triggered have finished. Entries without an active observer are only marked, and refetch the next time something observes them. Observers with `enabled: false` are not refetched.

## Deduplication

While a request for a key is in flight, every other fetch of that key (another component, `refetch()`, `fetchQuery`) joins it instead of starting a new one.

## Options reference

| Option | Default | |
|---|---|---|
| `queryKey` | required | Array identifying the entry |
| `queryFn` | required | `({ signal, queryKey, meta, client }) => Promise<T>`, or `skipToken` |
| `staleTime` | `0` | ms data stays fresh; `"static"` = never refetched once loaded; or a function of the state |
| `gcTime` | 5 min | ms an unobserved entry is kept |
| `enabled` | `true` | `false` (or a function of the state returning it) disables automatic fetching |
| `retry` | `3` for observers, `0` for `fetchQuery` | number, boolean or `(failureCount, error) => boolean` |
| `retryDelay` | exponential, max 30 s | number or `(failureCount, error) => number` |
| `refetchOnMount` | `true` | when a component starts watching: `true` fetches stale data, `false` only loads missing data, `"always"` refetches fresh data too |
| `refetchOnWindowFocus` | `true` | the same three values, for when the page is shown again |
| `refetchOnReconnect` | `true` | the same, for when the network is back |
| `refetchInterval` | off | ms between polls, or a function of the state (return `false` to stop) |
| `refetchIntervalInBackground` | `false` | keep polling while the page is hidden |
| `networkMode` | `"online"` | `"online"` waits for the network (`fetchStatus: "paused"`), `"always"` never waits, `"offlineFirst"` tries once first |
| `meta` | none | free-form object handed to the query function |
| `select` | none | adapters only: derive `data` from the cached value |
| `initialData` | none | data (or a function returning it) to seed an empty cache entry |
| `initialDataUpdatedAt` | now | when that data was fetched, so it can count as stale |
| `placeholderData` | none | data, or `(previousData) => data`, shown while there is none |
