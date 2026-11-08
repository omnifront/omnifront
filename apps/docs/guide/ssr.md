# Server-side rendering

SSR with omnifront is three steps: **prefetch** on the server, **dehydrate** the cache into JSON, **hydrate** it in the browser before components render.

```ts
// server
const client = new QueryClient({ gcTime: Infinity })
await client.fetchQuery(["todos"], listTodos)
const state = dehydrate(client)            // plain JSON: { queries: [{ queryKey, data, dataUpdatedAt }] }

// browser
hydrate(browserClient, state)              // never overwrites newer data
```

In React, `<HydrationBoundary state={state}>` does the browser step during render (not in an effect), so the first client render matches the server markup. `@omnifront/next` wraps all of this; see [Next.js](/guide/next).

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
// put `state` in the page, e.g. <script>window.__OMNIFRONT__ = ...</script> (escape "<" as \u003c)

// browser, before mounting
hydrate(client, window.__OMNIFRONT__)
createSSRApp(App).use(QueryPlugin, client).mount("#app")
```

`examples/vue-ssr` is a complete runnable Vite SSR server doing exactly this.

On the server a failing request does not retry with backoff (that would hold the render open for several seconds); it renders the error state, `dehydrate` skips it, and the browser fetches it again. Set `retry` explicitly if you want server-side retries.

### Nuxt

With Nuxt you only need a plugin that moves the cache through the payload:

```ts
// plugins/omnifront.ts
import { QueryClient } from "@omnifront/query"
import { dehydrate, hydrate, type DehydratedState } from "@omnifront/query/hydration"
import { QueryPlugin } from "@omnifront/vue"

export default defineNuxtPlugin((nuxtApp) => {
	const client = new QueryClient(import.meta.server ? { gcTime: Infinity } : {})
	nuxtApp.vueApp.use(QueryPlugin, client)
	if (import.meta.server) nuxtApp.hooks.hook("app:rendered", () => { nuxtApp.payload.omnifront = dehydrate(client) })
	else if (nuxtApp.payload.omnifront) hydrate(client, nuxtApp.payload.omnifront as DehydratedState)
})
```

This exact plugin runs in `examples/nuxt` (Nuxt 4): the server renders the list into the HTML, the cache travels in the payload, and the browser hydrates without console warnings or an initial request. Use `$fetch` in the `queryFn`: on the server Nuxt calls the API handler directly, in the browser it does a normal request.

## Angular

Add `provideOmnifrontSsr()` (from `@omnifront/angular/ssr`) next to `provideOmnifront`. It needs Angular 18+ for the server-side wait (`PendingTasks`).

```ts
// app.config.ts (shared by browser and server)
providers: [provideOmnifront(new QueryClient()), provideOmnifrontSsr()]
```

On the server, after the first render, it holds the application "unstable" until every query that started has finished, and then writes the cache into Angular's `TransferState`; the serialized state ends up in the page's `ng-state` script. In the browser it loads that state before any component asks for data. Queries that only start after other data arrives (a child component behind an `@if`) are followed too: after each round it gives change detection one turn to render what the new data revealed and looks again. As in Vue, a failing request does not retry with backoff on the server. `injectQuery` itself needs no change.

Use a new `QueryClient` per request: `provideOmnifront(new QueryClient())` inside the server `ApplicationConfig` that Angular builds per request, not a module-level singleton shared by all requests. `examples/angular-ssr` is a complete `@angular/ssr` app (Express server, `RenderMode.Server`, client hydration): the HTML has the data, `ng-state` carries the cache, a second request does not see the first one's data, and the browser starts with no initial request. Two details from that app: build the config in a **function** called per request (`createAppConfig()`), because a module-level `provideOmnifront(new QueryClient())` would be one client for all users; and Angular rejects unknown `Host` headers, so give `AngularNodeAppEngine` an `allowedHosts` list for your domains. The unit tests additionally render with `renderApplication` directly.

## React and Next.js

See [Next.js](/guide/next); plain React SSR uses `HydrationBoundary` as shown above, and [Suspense](/guide/suspense) works with streaming.
