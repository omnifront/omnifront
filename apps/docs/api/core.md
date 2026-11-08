# @unicore/core

The framework-free plumbing everything else is built on. About 0.7 KB gzipped.

## Contract

### `Subscribable`

```ts
interface Subscribable<TSnapshot> {
	subscribe(listener: () => void): () => void
	getSnapshot(): TSnapshot
	getServerSnapshot?(): TSnapshot
}
```

See [Writing an adapter](/guide/writing-an-adapter). `Listener` is the type `() => void`.

### `BaseSubscribable`

Abstract class that implements `subscribe` for you. Extend it, implement `getSnapshot()`, call `this.notify()` after the snapshot changes, and optionally override `onSubscribe()` (first listener arrived) and `onUnsubscribe()` (last one left). `hasListeners` tells whether anyone is subscribed. The same function subscribed twice counts as two subscriptions.

## Batching

### `notifyManager`

- `batch(fn)`: runs `fn`; listeners scheduled inside it run once each, synchronously, when the outermost batch ends. One failing listener does not stop the others; the first error is rethrown at the end.
- `schedule(listener)`: inside a batch the listener is queued (deduplicated); outside, it runs immediately.

## Time

### `defaultScheduler`

The real `setTimeout` / `clearTimeout` / `Date.now`. `Scheduler` is the interface (`setTimeout(fn, ms)`, `clearTimeout(handle)`, `now()`) and `TimerHandle` its opaque handle type.

## Selection

### `derive`

```ts
derive(source, selector, equals = Object.is): Subscribable<TSelected>
```

A `Subscribable` of a slice of another one. It listens to the source only while it has listeners, and notifies only when the selection changes (by `equals`). It also implements `getServerSnapshot` (the selection of the source's server snapshot).

### `shallowEqual`

`shallowEqual(a, b)`: `Object.is` for primitives; for objects and arrays, equal if they have the same keys with `Object.is`-equal values. Use it as `equals` when a selector builds a new object.

## Testing

Import from `@unicore/core/testing`.

### `FakeScheduler`

A `Scheduler` where time moves only through `advance(ms)`. Also has `now()` and `pendingTimers`. See [Testing](/guide/testing).
