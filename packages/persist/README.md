# @omnifront/persist

Persist the omnifront query cache to localStorage, IndexedDB or any storage, and restore it on startup.

> Pre-release: not published to npm yet, and the API can still change.

```ts
import { QueryClient } from "@omnifront/query"
import { persistQueryClient } from "@omnifront/persist"

const client = new QueryClient()
persistQueryClient(client, { storage: localStorage, buster: "app-1.0.0" })
```

Documentation: [omnifront docs](https://github.com/omnifront/omnifront/tree/main/apps/docs) (guides and API reference) and the [repository README](https://github.com/omnifront/omnifront#readme).
