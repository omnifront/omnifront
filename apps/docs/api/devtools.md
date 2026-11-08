# @unicore/devtools

Cache inspector. See the [devtools guide](/guide/devtools). About 0.6 KB gzipped for the headless model, 2.2 KB for the panel.

### `createDevtoolsModel`

`createDevtoolsModel(client, interval?)` returns a `DevtoolsModel`.

### `DevtoolsModel`

A `Subscribable<DevtoolsSnapshot>`. `getSnapshot()` returns the same object until an entry's state, observed flag or membership changes. `invalidate(queryKey)` marks one entry outdated (observers refetch), `cancel(queryKey)` aborts its request. While subscribed it checks for changes every `interval` ms (default 500).

### `DevtoolsSnapshot`

`{ queries: readonly DevtoolsQuery[] }`.

### `DevtoolsQuery`

`{ hash, queryKey, state, observed }`: the JSON of the key, its parts, the entry's `QueryState`, and whether something is subscribed to it.

## Panel (`@unicore/devtools/panel`)

### `mountDevtools`

`mountDevtools(client, options?)` draws the panel and returns a `DevtoolsPanel`. Options type: `DevtoolsPanelOptions` (`initiallyOpen`, `container`, `interval`).

### `DevtoolsPanel`

`open()`, `close()`, `destroy()`.
