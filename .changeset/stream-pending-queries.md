---
"@omnifront/query": minor
"@omnifront/next": minor
---

`shouldDehydratePending` (from `@omnifront/query/hydration` and `@omnifront/next`): `dehydrate` can include queries that are still loading, each with a promise of its data, and `hydrate` fills them in when it settles. Lets a Server Component send the page without waiting for a fetch.
