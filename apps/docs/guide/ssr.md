# Server-side rendering

SSR with unicore is three steps: **prefetch** on the server, **dehydrate** the cache into JSON, **hydrate** it in the browser before components render.

```ts
// server
const client = new QueryClient({ gcTime: Infinity })
await client.fetchQuery(["todos"], listTodos)
const state = dehydrate(client)            // plain JSON: { queries: [{ queryKey, data, dataUpdatedAt }] }

// browser
hydrate(browserClient, state)              // never overwrites newer data
```

In React, `<HydrationBoundary state={state}>` does the browser step during render (not in an effect), so the first client render matches the server markup. `@unicore/next` wraps all of this; see [Next.js](/guide/next).

`dehydrate` includes successful queries by default. Pass `shouldDehydrate` to choose:

```ts
dehydrate(client, { shouldDehydrate: ({ queryKey }) => queryKey[0] !== "private" })
```

## The rules

1. **A new client per request.** A shared server client leaks one user's data to the next. `getQueryClient()` (Next App Router) and `createServerQueryClient()` handle this.
2. **`gcTime: Infinity` on the server.** The default 5-minute timers would keep the process alive.
3. **Data must be JSON-safe.** No `Date`, `Map`, `Set` or class instances; convert them inside the `queryFn`.
4. **Use the same query key on both sides.**

## Why there are no hydration mismatches

Components render from `getServerSnapshot()` on the server **and** during hydration. For a query observer that snapshot never reads the clock: freshness is judged as of the moment the data arrived (so it is stale only when `staleTime` is `0`, or the data is missing or invalidated). The server and the browser disagree on "now", and a time-based `isStale` would render differently on each side.

`hydrate` keeps the server's `dataUpdatedAt`, so `staleTime` keeps counting from the real fetch time. A server clock ahead of the browser's is clamped to the browser's "now" so fresh data never looks like it comes from the future.

The repository's tests render on a "server", hydrate on a "browser" whose clock is hundreds of seconds ahead, behind and equal, and fail on any hydration warning.

## Other frameworks

`dehydrate` and `hydrate` are framework-free. The Vue and Angular adapters do not subscribe on the server and have no SSR helpers yet (Nuxt, Angular `TransferState`); you can bridge the dehydrated JSON yourself.
