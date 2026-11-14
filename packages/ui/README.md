# @omnifront/ui

The framework-free core of the omnifront UI kit: a Material-style theme, behaviour machines for interactive components, accessibility utilities and static CSS. The component packages ([`ui-react`](../ui-react), [`ui-vue`](../ui-vue), [`ui-angular`](../ui-angular)) only render what this package describes, so a Dialog behaves and looks the same in all three.

> Pre-release: not published to npm yet, and the API can still change. Wave 0 covers Button, TextField, Dialog, Menu and Tabs (ADR-0014).

```ts
import "@omnifront/ui/styles.css"
import { createTheme } from "@omnifront/ui"

// Pass only what you change, like MUI's createTheme.
const theme = createTheme({ palette: { primary: { main: "#7C3AED" } }, shape: { borderRadius: 8 } })
```

- **Theme**: `createTheme`, `themeToCss` (CSS variables, light and dark), `createColorSchemeStore` (a normal store: read it with `useStore` / `injectStore`).
- **Machines**: `createDialog`, `createMenu`, `createTabs`, `createField`. Each is a `Subscribable` with `connect()` (attributes and handlers per element) and `attach()` (focus, scroll lock, positioning).
- **Entries**: `@omnifront/ui/position` (floating-ui placement) and the CSS files (`styles.css`, or one per component).

Documentation: [UI guide](https://github.com/omnifront/omnifront/blob/main/apps/docs/guide/ui.md) and [ADR-0014](https://github.com/omnifront/omnifront/blob/main/docs/adr/0014-ui-components.md).
