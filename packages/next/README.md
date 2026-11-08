# @omnifront/next

Next.js helpers for omnifront: per-request query clients, dehydrate/hydrate and a client entry for the App Router and Pages Router.

> Pre-release: not published to npm yet, and the API can still change.

```tsx
// Server Component
import { dehydrate, getQueryClient } from "@omnifront/next"
import { HydrationBoundary } from "@omnifront/next/client"

const client = getQueryClient()
await client.fetchQuery(["todos"], listTodos)
// <HydrationBoundary state={dehydrate(client)}><Todos /></HydrationBoundary>
```

Documentation: [omnifront docs](https://github.com/omnifront/omnifront/tree/main/apps/docs) (guides and API reference) and the [repository README](https://github.com/omnifront/omnifront#readme).
