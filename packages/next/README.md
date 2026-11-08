# @unicore/next

Next.js helpers for unicore: per-request query clients, dehydrate/hydrate and a client entry for the App Router and Pages Router.

> Pre-release: not published to npm yet, and the API can still change.

```tsx
// Server Component
import { dehydrate, getQueryClient } from "@unicore/next"
import { HydrationBoundary } from "@unicore/next/client"

const client = getQueryClient()
await client.fetchQuery(["todos"], listTodos)
// <HydrationBoundary state={dehydrate(client)}><Todos /></HydrationBoundary>
```

Documentation: [unicore docs](https://github.com/AMHB-DEV/unicore/tree/main/apps/docs) (guides and API reference) and the [repository README](https://github.com/AMHB-DEV/unicore#readme).
