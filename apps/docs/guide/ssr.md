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

## Vue

`useQuery` is SSR-ready on its own. On the server it does not subscribe (nothing would ever unsubscribe it); instead it registers `onServerPrefetch`, which Vue awaits before rendering the component, so the HTML contains the data. In the browser it renders the clock-independent server snapshot first and switches to live data (and starts its subscription) when the component is mounted, so hydration matches the server.

```ts
// server.ts, once per request
const client = new QueryClient({ gcTime: Infinity })
const html = await renderToString(createSSRApp(App).use(QueryPlugin, client))
const state = dehydrate(client)           // after rendering: every prefetch has finished
// put `state` in the page, e.g. <script>window.__UNICORE__ = ...</script> (escape "<" as \u003c)

// browser, before mounting
hydrate(client, window.__UNICORE__)
createSSRApp(App).use(QueryPlugin, client).mount("#app")
```

`examples/vue-ssr` is a complete runnable Vite SSR server doing exactly this.

### Nuxt

With Nuxt you only need a plugin that moves the cache through the payload:

```ts
// plugins/unicore.ts
import { QueryClient } from "@unicore/query"
import { dehydrate, hydrate, type DehydratedState } from "@unicore/query/hydration"
import { QueryPlugin } from "@unicore/vue"

export default defineNuxtPlugin((nuxtApp) => {
	const client = new QueryClient(import.meta.server ? { gcTime: Infinity } : {})
	nuxtApp.vueApp.use(QueryPlugin, client)
	if (import.meta.server) nuxtApp.hooks.hook("app:rendered", () => { nuxtApp.payload.unicore = dehydrate(client) })
	else if (nuxtApp.payload.unicore) hydrate(client, nuxtApp.payload.unicore as DehydratedState)
})
```

This follows Nuxt's documented plugin and payload hooks and uses the same unicore code path as the Vite example, but it has not been run inside a Nuxt app in this repository.

## Angular

Add `provideUnicoreSsr()` (from `@unicore/angular/ssr`) next to `provideUnicore`. It needs Angular 18+ for the server-side wait (`PendingTasks`).

```ts
// app.config.ts (shared by browser and server)
providers: [provideUnicore(new QueryClient()), provideUnicoreSsr()]
```

On the server, after the first render, it holds the application "unstable" until every query that started has finished (queries that start other queries are followed too), and then writes the cache into Angular's `TransferState`; the serialized state ends up in the page's `ng-state` script. In the browser it loads that state before any component asks for data. `injectQuery` itself needs no change.

Use a new `QueryClient` per request: `provideUnicore(new QueryClient())` inside the server `ApplicationConfig` that Angular builds per request, not a module-level singleton shared by all requests. The repository's tests render with Angular's real `renderApplication` (platform-server), including the second request not seeing the first one's data; they do not run a full `@angular/ssr` Express app.

## React and Next.js

See [Next.js](/guide/next); plain React SSR uses `HydrationBoundary` as shown above, and [Suspense](/guide/suspense) works with streaming.
