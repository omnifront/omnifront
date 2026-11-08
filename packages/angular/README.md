# @omnifront/angular

Angular adapter for omnifront: provideOmnifront and signal-based injectQuery, injectMutation and injectStore.

> Pre-release: not published to npm yet, and the API can still change.

```ts
import { provideOmnifront, injectQuery } from "@omnifront/angular"

// bootstrapApplication(App, { providers: [provideOmnifront(new QueryClient())] })
todos = injectQuery({ queryKey: ["todos"], queryFn: listTodos })
```

Documentation: [omnifront docs](https://github.com/omnifront/omnifront/tree/main/apps/docs) (guides and API reference) and the [repository README](https://github.com/omnifront/omnifront#readme).
