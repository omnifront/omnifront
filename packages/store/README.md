# @unicore/store

A tiny framework-agnostic store with selectors, for use with unicore adapters.

> Pre-release: not published to npm yet, and the API can still change.

```ts
import { createStore } from "@unicore/store"

const counter = createStore<{ count: number; inc(): void }>((set) => ({
	count: 0,
	inc: () => set((s) => ({ count: s.count + 1 })),
}))
```

Documentation: [unicore docs](https://github.com/AMHB-DEV/unicore/tree/main/apps/docs) (guides and API reference) and the [repository README](https://github.com/AMHB-DEV/unicore#readme).
