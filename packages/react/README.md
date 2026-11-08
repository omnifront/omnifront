# @omnifront/react

React adapter for omnifront: QueryProvider, useQuery, useMutation, useStore and HydrationBoundary.

> Pre-release: not published to npm yet, and the API can still change.

```tsx
import { QueryClient } from "@omnifront/query"
import { QueryProvider, useQuery } from "@omnifront/react"

const client = new QueryClient()
// <QueryProvider client={client}><App /></QueryProvider>
const todos = useQuery({ queryKey: ["todos"], queryFn: listTodos })
```

Documentation: [omnifront docs](https://github.com/omnifront/omnifront/tree/main/apps/docs) (guides and API reference) and the [repository README](https://github.com/omnifront/omnifront#readme).
