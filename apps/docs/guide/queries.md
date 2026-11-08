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

`status` and `isFetching` are independent: a background refetch of existing data is `status: "success"` with `isFetching: true`.

## Freshness: `staleTime` and `gcTime`

- **`staleTime`** (default `0`): how long data counts as fresh. While fresh, mounting another component that uses the key does **not** refetch. `Infinity` means never stale. When data goes stale while someone is watching, listeners are notified (so `isStale` updates), but unicore does not refetch on its own; it refetches on mount, on `invalidateQueries`, or when you call `refetch()`.
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
import { focusManager, onlineManager } from "@unicore/query"
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
import { keepPreviousData } from "@unicore/query"

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
import { useQueries } from "@unicore/react/queries"

const [user, posts] = useQueries([
	{ queryKey: ["user", id], queryFn: () => loadUser(id) },
	{ queryKey: ["posts", id], queryFn: () => loadPosts(id), enabled: user.data !== undefined }, // dependent
])
```

Vue: `import { useQueries } from "@unicore/vue/queries"` (one array of plain results). Angular: `injectQueries` from `@unicore/angular/queries` (one signal of an array). **Dependent queries** need no special API: set `enabled` on the later query. (The `user` above is the previous render's result, so the second query starts once the first has data.)

## Stable references: structural sharing

By default a refetch that returns equal data still produces a new object, so anything memoized on it re-runs. Opt in to keep the old references for the parts that did not change:

```ts
import { QueryClient } from "@unicore/query"
import { replaceEqualDeep } from "@unicore/query/structural"

const client = new QueryClient({ structuralSharing: replaceEqualDeep })
```

A refetch returning the same list with one item changed keeps the identity of every other item (and of the list, if nothing changed). It works on plain objects and arrays (JSON-like data) and costs a deep comparison per fetch, so it is off by default. It also applies to `setQueryData`.

## Turning a query off

`enabled: false` means no automatic fetch; the entry stays `"idle"`. Flipping it to `true` fetches.

```ts
useQuery({ queryKey: ["user", id], queryFn: () => loadUser(id), enabled: id !== undefined })
```

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
| `queryFn` | required | `({ signal }) => Promise<T>` |
| `staleTime` | `0` | ms data stays fresh |
| `gcTime` | 5 min | ms an unobserved entry is kept |
| `enabled` | `true` | `false` disables automatic fetching |
| `retry` | `3` for observers, `0` for `fetchQuery` | number, boolean or `(failureCount, error) => boolean` |
| `retryDelay` | exponential, max 30 s | number or `(failureCount, error) => number` |
| `refetchOnWindowFocus` | `true` | refetch stale data when the page is shown again |
| `refetchOnReconnect` | `true` | refetch stale data when the network is back |
| `refetchInterval` | off | ms between polls |
| `initialData` | none | data (or a function returning it) to seed an empty cache entry |
| `placeholderData` | none | data, or `(previousData) => data`, shown while there is none |
