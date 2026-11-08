# Devtools

`@omnifront/devtools` shows what is in the query cache: every entry's key, status, data, whether a component is observing it, and whether it is fetching or invalidated, with buttons to invalidate or cancel an entry.

::: info Pre-release
Not on npm yet. Once published: `npm install -D @omnifront/devtools`.
:::

```ts
import { mountDevtools } from "@omnifront/devtools/panel"

if (import.meta.env.DEV) mountDevtools(client)   // a small "omnifront · N" button, bottom right
```

It is plain DOM inside a shadow root, so it works the same in React, Vue, Angular and Next.js and leaks no styles. Everything from your data is inserted as text, never as HTML. Tree-shake it out of production builds with the `DEV` check.

Options: `initiallyOpen`, `container` (default `document.body`) and `interval` (ms between looks for changes while open, default 500). The panel returns `open()`, `close()` and `destroy()`.

## Building your own

The panel is built on a headless model, so a browser extension, a console logger or a custom UI can use the same data.

```ts
import { createDevtoolsModel } from "@omnifront/devtools"

const model = createDevtoolsModel(client)
model.subscribe(() => console.table(model.getSnapshot().queries.map((q) => [q.hash, q.state.status, q.observed])))
```

The model is a `Subscribable`. While nobody is subscribed it does nothing; while someone is, it checks the cache for changes every `interval` ms and notifies only when an entry's state, its observed flag or the set of entries changed.
