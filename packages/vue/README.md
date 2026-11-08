# @unicore/vue

Vue 3 adapter for unicore: a plugin plus useQuery, useMutation and useStore composables.

> Pre-release: not published to npm yet, and the API can still change.

```ts
import { QueryClient } from "@unicore/query"
import { QueryPlugin, useQuery } from "@unicore/vue"

createApp(App).use(QueryPlugin, new QueryClient()).mount("#app")
const { data, status } = useQuery({ queryKey: ["todos"], queryFn: listTodos })
```

Documentation: [unicore docs](https://github.com/AMHB-DEV/unicore/tree/main/apps/docs) (guides and API reference) and the [repository README](https://github.com/AMHB-DEV/unicore#readme).
