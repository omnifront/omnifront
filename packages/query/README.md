# @omnifront/query

Framework-agnostic query cache: fetching, deduplication, retries, invalidation, mutations and SSR hydration.

> Pre-release: not published to npm yet, and the API can still change.

```ts
import { QueryClient, QueryObserver, Mutation } from "@omnifront/query"
import { dehydrate, hydrate } from "@omnifront/query/hydration"

const client = new QueryClient()
const todos = await client.fetchQuery(["todos"], () => fetch("/api/todos").then((r) => r.json()))
```

Documentation: [omnifront docs](https://github.com/omnifront/omnifront/tree/main/apps/docs) (guides and API reference) and the [repository README](https://github.com/omnifront/omnifront#readme).
