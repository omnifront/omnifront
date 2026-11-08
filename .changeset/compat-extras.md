---
"@omnifront/core": minor
"@omnifront/query": minor
"@omnifront/query-infinite": minor
"@omnifront/react": minor
"@omnifront/vue": minor
"@omnifront/angular": minor
"@omnifront/next": patch
---

Add `combine`, `useQueries` / `injectQueries`, opt-in structural sharing (`@omnifront/query/structural`), `maxPages` for infinite queries and `useSuspenseInfiniteQuery`. Fix the export maps so CommonJS consumers get CommonJS types, publish `@omnifront/next/client` as CommonJS so Next.js 14 can read it, and make `getQueries()` return `{ key, query }`.
