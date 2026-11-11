# @omnifront/persist

Persist the query cache. About 1.1 KB gzipped (IndexedDB adapter about 0.3 KB). See the [persistence guide](/guide/persistence).

### `persistQueryClient`

`persistQueryClient(client, options)` restores the stored cache into `client` and starts writing changes. Returns a `Persister`. Options type: `PersistOptions`.

### `Persister`

| Member | |
|---|---|
| `restored` | `Promise<boolean>`: resolves when loading is done; `true` if a cache was restored. |
| `persist()` | Write now (waits for `restored` first). |
| `stop()` | Stop persisting; leave what is stored. |
| `clear()` | Stop persisting and delete what is stored. |

### `PersistOptions`

`storage` (required), `key`, `maxAge`, `buster`, `throttle`, `shouldDehydrate`, `persistMutations`, `serialize`, `deserialize`, `onError`. Defaults are in the [guide](/guide/persistence#options).

### `PersistStorage`

`getItem(key)`, `setItem(key, value)`, `removeItem(key)`, each sync or returning a promise. `localStorage` already fits.

### `PersistedCache`

What is stored: `{ version: 1, timestamp, buster, state, mutations? }`, where `state` is a [`DehydratedState`](/api/query#dehydratedstate) and `mutations` (only when there are some) the calls that were still waiting, as [`DehydratedMutation`](/api/query#dehydratedmutation)s.

## IndexedDB (`@omnifront/persist/indexeddb`)

### `createIndexedDBStorage`

`createIndexedDBStorage({ dbName?, storeName? })` returns a `PersistStorage` backed by IndexedDB. Options type: `IndexedDBStorageOptions`.
