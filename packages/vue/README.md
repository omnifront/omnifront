# @omnifront/vue

Vue 3 adapter for omnifront: a plugin plus useQuery, useMutation and useStore composables.

> Pre-release: not published to npm yet, and the API can still change.

```ts
import { QueryClient } from "@omnifront/query"
import { QueryPlugin, useQuery } from "@omnifront/vue"

createApp(App).use(QueryPlugin, new QueryClient()).mount("#app")
const { data, status } = useQuery({ queryKey: ["todos"], queryFn: listTodos })
```

Documentation: [omnifront docs](https://github.com/omnifront/omnifront/tree/main/apps/docs) (guides and API reference) and the [repository README](https://github.com/omnifront/omnifront#readme).
