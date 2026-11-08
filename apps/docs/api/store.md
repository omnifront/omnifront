# @omnifront/store

A small plain-object store. About 0.4 KB gzipped (excluding `@omnifront/core`). See the [store guide](/guide/store).

### `createStore`

```ts
createStore(initialState)
createStore((set, get) => state)      // StateCreator: actions can live in the state
```

Returns a `Store`.

### `Store`

A `Subscribable<TState>`.

| Member | |
|---|---|
| `getState()` / `getSnapshot()` | Current state. |
| `setState(update)` | Merge a partial state, or a function returning one. Ignored if nothing changes. |
| `reset()` | Back to the initial state. |
| `getServerSnapshot()` | Always the initial state (so hydration matches the server). |

### `StateUpdate`

`Partial<T> | ((state: T) => Partial<T>)`. `SetState` is the function type of `setState`, `StateCreator` the type of the creator argument.
