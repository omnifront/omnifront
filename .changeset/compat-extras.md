---
"@unicore/core": minor
"@unicore/query": minor
"@unicore/query-infinite": minor
"@unicore/react": minor
"@unicore/vue": minor
"@unicore/angular": minor
"@unicore/next": patch
---

Add `combine`, `useQueries` / `injectQueries`, opt-in structural sharing (`@unicore/query/structural`), `maxPages` for infinite queries and `useSuspenseInfiniteQuery`. Fix the export maps so CommonJS consumers get CommonJS types, publish `@unicore/next/client` as CommonJS so Next.js 14 can read it, and make `getQueries()` return `{ key, query }`.
