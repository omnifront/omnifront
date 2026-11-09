---
"@omnifront/react": minor
"@omnifront/vue": minor
"@omnifront/angular": minor
---

Add a `combine` option to `useQueries` / `injectQueries`: `useQueries(queries, { combine })` returns what `combine(results)` returns (a value, `ref` or `Signal`), recomputed only when a result changes.
