# Reddit drafts

Post one at a time, a few days apart, and answer every comment. Read each subreddit's self-promotion rules first and adjust (some want a flair, some want the post as a discussion). Never post the same text in two subreddits.

## r/reactjs

**Title:** I built a 3 KB data-fetching/cache layer with React hooks that also runs in Vue and Angular. Feedback welcome

Hi all. I work with React but my team also has Angular and Vue apps, and we kept rewriting the same fetching/caching logic. omnifront is a framework-free core (query cache, mutations, a tiny store, HTTP client) plus thin adapters.

For React you get `useQuery`, `useMutation`, `useQueries` (with `combine`), infinite queries, `useSuspenseQuery`, a Next.js package for App Router and Pages Router, and a `useIsFetching` for a global loading bar. The React hooks sit on `useSyncExternalStore`, so they are concurrent-safe, and the whole thing is 3.78 KB gzip with the client (TanStack Query is 10.27 KB for the same slice, measured with esbuild).

It does less than TanStack Query on purpose (no `fetchStatus` flags yet, API still changing), so please do not read this as "replace TanStack Query". The interesting part for me is sharing one data layer across frameworks and migrating between them.

Repo: <repo URL> · Docs: <docs URL>. What would you want to see before trying something like this?

## r/vuejs

**Title:** A composable-style query/cache library whose core is shared with React and Angular (3 KB)

Hi r/vuejs. I built omnifront so the data layer can be shared across frameworks. The Vue adapter is `useQuery`/`useMutation`/`useQueries`/`useIsFetching` composables returning refs (reactive keys work, a ref or getter can be the key), `app.use(QueryPlugin, client)`, cleanup through `onScopeDispose`, and SSR support (`onServerPrefetch`, verified in a Nuxt 4 app and a Vite SSR app).

The Vue adapter is about 1 KB gzip on top of a 3 KB core. It does less than TanStack Query (no `fetchStatus` flags yet) and the API is not stable, so I would like feedback from Vue people on the composable shapes, especially `useQueries` returning a ref of an array and the `combine` option.

Repo: <repo URL> · Docs: <docs URL>

## r/Angular2

**Title:** Signals-first query/cache layer (`injectQuery`) that shares its core with React and Vue

Hi r/Angular2. omnifront gives you `injectQuery`, `injectMutation`, `injectQueries` and `injectIsFetching`, all returning signals, with lifecycle through `DestroyRef`, `provideOmnifront(client)` for standalone apps, and SSR through `@angular/ssr` (TransferState and PendingTasks, tested with real server rendering). Supported: Angular 17+.

The reason it exists: teams with Angular next to React or Vue apps can share the query and store definitions and migrate gradually. It is small (about 0.9 KB for the adapter on a 3 KB core) and deliberately smaller than TanStack Query's Angular package, so some features are missing and the API can change.

Repo: <repo URL> · Docs: <docs URL>. I would especially like feedback on the signal shapes and on what you would expect from `injectQuery` options.
