# Persistence

`@omnifront/persist` keeps the query cache across page loads: it restores the stored cache on start and writes it back when it changes. It works with `localStorage`, IndexedDB or any storage with `getItem`/`setItem`/`removeItem`, and it needs no framework.

::: info Pre-release
Not on npm yet. Once published: `npm install @omnifront/persist @omnifront/query`.
:::

```ts
import { QueryClient } from "@omnifront/query"
import { persistQueryClient } from "@omnifront/persist"

const client = new QueryClient()
persistQueryClient(client, {
	storage: localStorage,
	buster: "app-1.4.0",      // change it to throw away what older code stored
	maxAge: 24 * 60 * 60_000, // default: a day
})
```

## What restoring does

Restored data keeps the time it was **originally fetched**, so `staleTime` keeps counting from then. On the next visit a component that mounts gets the old data immediately and, if it is stale, refetches in the background: stale-while-revalidate across sessions. Data that is still fresh is not refetched at all.

Restoring is asynchronous (IndexedDB), and `hydrate` never overwrites newer data, so components that mount before it finishes are safe. If you want to hold the first render until the cache is back:

```ts
const persister = persistQueryClient(client, { storage })
await persister.restored          // true if something was restored
root.render(<App />)
```

## Mutations that are waiting

A mutation called without a network waits and goes out when it is back (see [mutations](/guide/mutations#retries-and-the-network)). `persistQueryClient` also saves those calls, so they survive a reload and are sent after it, with the data they had:

```ts
import { setMutationDefaults } from "@omnifront/query/offline"

// The function a restored call needs, by key. Register it before the cache is restored.
setMutationDefaults(client, ["addTodo"], addTodoOptions)
persistQueryClient(client, { storage: localStorage })

// the same options object in the component:
useMutation(addTodoOptions)   // addTodoOptions = { mutationKey: ["addTodo"], mutationFn, onSuccess, ... }
```

- **Only calls that were not sent yet.** One that was already running when the page closed may have reached the server; sending it twice is worse than losing it, so it is not saved. Calls that wait for their turn in a [scope](/guide/mutations#sending-in-order-scopes) are saved too, in order. Every call counts, also several from one `useMutation`.
- **A `mutationKey` is required**, and `variables` (and what `onMutate` returned) must be JSON-safe. A call with variables that cannot be written does not stop the queries from being saved: the error goes to `onError` and the cache is written without it.
- **`onMutate` does not run again.** The context it returned before is given back, so a rollback in `onError` still has its snapshot. `onSuccess`, `onError` and `onSettled` run as usual.
- **No function, no restore.** A saved call whose key has no `setMutationDefaults` is reported to `onError` and dropped at the next write.
- **To wait for them**, `await resumePausedMutations(client)` from `@omnifront/query/offline`; they go out by themselves when the network is back.
- Turn it off with `persistMutations: false`. Otherwise `persistQueryClient` calls `enableOffline(client)` for you.

## What gets written

The same data `dehydrate` produces: queries with successful data (narrow it with `shouldDehydrate`), and the [mutations that are waiting](#mutations-that-are-waiting). In-flight requests are not stored. The data has to be JSON-safe, or you provide `serialize`/`deserialize`.

The cache has no change events of its own, so the persister checks for changes every `throttle` ms (default 1000) and writes only when something actually changed. It also writes right away when the page is hidden, so the last changes survive a closing tab.

Storage errors (quota exceeded, private mode, data that cannot be serialized) never throw; they go to `onError` and the write is retried on the next tick.

## IndexedDB

`localStorage` holds about 5 MB and is synchronous. For bigger caches:

```ts
import { createIndexedDBStorage } from "@omnifront/persist/indexeddb"

persistQueryClient(client, { storage: createIndexedDBStorage({ dbName: "my-app" }) })
```

## Logging out

A persisted cache lives on the user's disk. Clear it when the user signs out, and think twice about persisting private data at all (`shouldDehydrate` can exclude keys).

```ts
await persister.clear()   // stops persisting and deletes the stored cache
client.clear()
```

## Options

| Option | Default | |
|---|---|---|
| `storage` | required | `localStorage`, IndexedDB wrapper, async-storage, ... |
| `key` | `"omnifront-cache"` | storage key |
| `maxAge` | 24 h | older stored caches are discarded |
| `buster` | `""` | a different value discards the stored cache |
| `throttle` | `1000` | ms between looks for changes |
| `shouldDehydrate` | successful queries | choose what to persist |
| `persistMutations` | `true` | also save calls that are waiting for the network or their scope |
| `serialize` / `deserialize` | `JSON` | custom format |
| `onError` | ignore | storage and parsing errors |

Do not use it on the server: SSR has its own [hydration path](/guide/ssr).
