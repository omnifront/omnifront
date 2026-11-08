# @unicore/persist

Persist the unicore query cache to localStorage, IndexedDB or any storage, and restore it on startup.

> Pre-release: not published to npm yet, and the API can still change.

```ts
import { QueryClient } from "@unicore/query"
import { persistQueryClient } from "@unicore/persist"

const client = new QueryClient()
persistQueryClient(client, { storage: localStorage, buster: "app-1.0.0" })
```

Documentation: [unicore docs](https://github.com/AMHB-DEV/unicore/tree/main/apps/docs) (guides and API reference) and the [repository README](https://github.com/AMHB-DEV/unicore#readme).
