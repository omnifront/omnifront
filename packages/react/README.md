# @unicore/react

React adapter for unicore: QueryProvider, useQuery, useMutation, useStore and HydrationBoundary.

> Pre-release: not published to npm yet, and the API can still change.

```tsx
import { QueryClient } from "@unicore/query"
import { QueryProvider, useQuery } from "@unicore/react"

const client = new QueryClient()
// <QueryProvider client={client}><App /></QueryProvider>
const todos = useQuery({ queryKey: ["todos"], queryFn: listTodos })
```

Documentation: [unicore docs](https://github.com/AMHB-DEV/unicore/tree/main/apps/docs) (guides and API reference) and the [repository README](https://github.com/AMHB-DEV/unicore#readme).
