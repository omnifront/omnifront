---
"@omnifront/query": minor
"@omnifront/react": minor
"@omnifront/vue": minor
"@omnifront/angular": minor
---

Add a cache-wide loading signal: `useIsFetching` / `useIsMutating` (React, Vue) and `injectIsFetching` / `injectIsMutating` (Angular) in each adapter's `/activity` entry, built on `createFetchingCount`, `createMutatingCount` and `trackMutation` from `@omnifront/query/activity`. `QueryClient` gets `onChange(listener)`; the `@omnifront/query` size budget goes from 3 KB to 3.1 KB (ADR-0011).
