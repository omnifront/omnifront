# @omnifront/ui-vue

Vue components (single-file components) for the UI kit. About 4.7 KB gzipped (excluding Vue and `@omnifront/ui`). See the [UI guide](/guide/ui). `createTheme`, `createColorSchemeStore`, `colorSchemeScript` and the types `Theme`, `ThemeOptions` and `ColorSchemeMode` are re-exported from [`@omnifront/ui`](/api/ui).

Every component also reads `theme.components.Omni<Name>.defaultProps`. Attributes and classes you put on a component reach its main element. Events: `@click` on `Button` and `MenuItem`, `@close` and `v-model:open` on `Dialog` and `Menu`, `v-model` on `TextField` and `TabContext`.

### `ThemeProvider`

```vue
<ThemeProvider :theme="theme" color-scheme="system" global>…</ThemeProvider>
```

One `<style>` with the theme's CSS variables and a `display: contents` wrapper that carries the scope and colour scheme; overlays in `Portal` copy both. `colorScheme` is `light`, `dark` or `system` (inherited, else `system`). With `global` the variables go on `:root` and the scheme on `<html>` (restored on unmount).

### `useTheme`

`useTheme(): ComputedRef<Theme>`: the nearest theme, or the default Material theme.

### `Portal`

Teleports its content into a `div[data-omni-portal]` at the end of `<body>`, carrying the theme scope. Nothing on the server.

### `Button`

Props: `variant`, `color`, `size`, `fullWidth`, `disableElevation`, `loading`, `disabled`, `disableRipple`, `href` (renders an `<a>`), `type`. Slots: default, `startIcon`, `endIcon`.

### `TextField`

Props: `modelValue` (`v-model`; leave it out for an uncontrolled field) / `defaultValue`, `label`, `helperText`, `error`, `disabled`, `required`, `readOnly`, `variant`, `size`, `color`, `fullWidth`, `multiline`, `rows`, `id`, `type`, `placeholder`. Slots: `startAdornment`, `endAdornment`. Events: `update:modelValue`, `focus`, `blur`.

### `Dialog`

Props: `open`, `maxWidth` (default `sm`), `fullWidth`, `fullScreen`, `disableEscapeKeyDown`, `hideBackdrop`, `keepMounted`, `role`; `aria-label` as an attribute. Events: `close(event, reason)` and `update:open(false)`. Compose with `DialogTitle`, `DialogContent`, `DialogContentText` and `DialogActions`.

### `Menu`

Props: `anchorEl`, `open`, `placement` (default `bottom-start`), `autoFocus` (default true), `keepMounted`. Events: `close(event, reason)` and `update:open`. Children: `MenuItem` (props `disabled`, `selected`, `dense`; event `click`) and `MenuDivider`.

### `TabContext`

Props: `modelValue` (`v-model`) / `defaultValue`, `orientation`, `selectionFollowsFocus`. Events: `update:modelValue`, `change(event, value)`. `TabList` (props `color`, `variant`, `centered`) holds the `Tab`s (props `value`, `label`, `disabled`); `TabPanel` (props `value`, `keepMounted`) shows its content while its tab is selected.
