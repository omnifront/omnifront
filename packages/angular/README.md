# @unicore/angular

Angular adapter for unicore: provideUnicore and signal-based injectQuery, injectMutation and injectStore.

> Pre-release: not published to npm yet, and the API can still change.

```ts
import { provideUnicore, injectQuery } from "@unicore/angular"

// bootstrapApplication(App, { providers: [provideUnicore(new QueryClient())] })
todos = injectQuery({ queryKey: ["todos"], queryFn: listTodos })
```

Documentation: [unicore docs](https://github.com/AMHB-DEV/unicore/tree/main/apps/docs) (guides and API reference) and the [repository README](https://github.com/AMHB-DEV/unicore#readme).
