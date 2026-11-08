# Store

A small store for state that is not server data: UI state, filters, a session. It is plain-object state with the actions inside it.

```ts
import { createStore } from "@unicore/store"

export const counter = createStore<{ count: number; inc(): void }>((set, get) => ({
	count: 0,
	inc: () => set((s) => ({ count: s.count + 1 })),
}))

counter.getState().inc()
counter.setState({ count: 10 })   // merge a partial state
counter.reset()                   // back to the initial state
```

`createStore` also accepts a plain object: `createStore({ text: "" })`.

- Every change creates a **new** state object (snapshots are immutable). Setting only values that are already equal (`Object.is`) is ignored and notifies nobody.
- Several `setState` calls inside one `notifyManager.batch(...)` produce a single notification.
- `getState` and `setState` are bound, so you can pass them around or destructure them.

## Selectors

Components should re-render only when what they use changes. `useStore` / `injectStore` take a selector:

```tsx
const selectCount = (s: { count: number }) => s.count
const count = useStore(counter, selectCount)            // React: number
const count = useStore(counter, (s) => s.count)         // Vue: ComputedRef<number>
const count = injectStore(counter, (s) => s.count)      // Angular: Signal<number>
```

When the selector builds a new object each time, give it a comparison so equal results keep their identity:

```ts
import { shallowEqual } from "@unicore/core"
const view = useStore(counter, (s) => ({ count: s.count }), shallowEqual)
```

::: tip
In React, define selectors and `equals` outside the component or memoize them. A new function every render only costs a re-subscribe, but it is avoidable.
:::

## It works on queries too

`useStore` accepts **any** [`Subscribable`](/guide/writing-an-adapter), including a `QueryObserver`:

```ts
const observer = new QueryObserver(client, todosQuery)
const count = useStore(observer, (r) => r.data?.length ?? 0)
```

This is the same `derive` function underneath: `derive(source, selector, equals)` returns a new `Subscribable` of a slice, which only notifies when the slice changes.

## Not yet

Middleware, persistence and devtools.
