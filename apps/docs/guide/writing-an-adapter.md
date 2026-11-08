# Writing an adapter

Everything a UI can listen to in unicore (a `QueryObserver`, a `Mutation`, a `Store`, a `derive`d slice) implements one small contract, [ADR-0001](https://github.com/AMHB-DEV/unicore/blob/main/docs/adr/0001-subscribable-contract.md):

```ts
interface Subscribable<TSnapshot> {
	subscribe(listener: () => void): () => void   // returns an unsubscribe function
	getSnapshot(): TSnapshot                       // the SAME reference until something changes
	getServerSnapshot?(): TSnapshot                // optional: what to render during SSR / hydration
}
```

Rules that make adapters trivial:

1. Snapshots are immutable: a change produces a new object, no change returns the same reference.
2. Listeners take no arguments; read `getSnapshot()` instead.
3. Notifications are synchronous but batched by `notifyManager`.
4. The first subscriber starts work (the fetch); the last one leaving starts the gc timer. Lifecycle follows subscriber count, never the framework.
5. No `setTimeout` in logic; time comes from an injected `Scheduler`.

## An adapter in four lines per framework

```ts
// React: the hook binds the methods (getSnapshot is a method, React calls it detached)
useSyncExternalStore(o.subscribe, () => o.getSnapshot(), () => o.getServerSnapshot?.() ?? o.getSnapshot())

// Vue: a shallowRef, stopped with the scope
const state = shallowRef(o.getSnapshot())
const off = o.subscribe(() => (state.value = o.getSnapshot()))
onScopeDispose(off)

// Angular: a signal, stopped with DestroyRef
const state = signal(o.getSnapshot())
inject(DestroyRef).onDestroy(o.subscribe(() => state.set(o.getSnapshot())))
```

`subscribe` is a bound arrow function, so you can pass it detached; `getSnapshot` is a method, so call it through the object.

## Reactive options

Observers expose `setOptions(options)`: it switches to another cache entry if the key changed, and does nothing expensive if the options are the same, so it is safe to call from every render or from a watcher. Do not refetch just because data is stale inside it (with `staleTime: 0` that loops forever); `setOptions` already takes care of that.

## Prove it with the conformance suite

The repository's private `@unicore/conformance` package contains the behaviour every adapter must have. Implement its `Harness` (mount a query, mount a mutation, mount a store slice, and an `act` that lets your framework flush updates) and call `defineConformanceSuite("my-framework", harness)`. The React, Vue and Angular adapters pass the identical suite, which is how the contract was validated.
