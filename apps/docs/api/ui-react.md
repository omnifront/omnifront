# @omnifront/ui-react

React components for the UI kit. About 3.8 KB gzipped (excluding React and `@omnifront/ui`). See the [UI guide](/guide/ui). `createTheme`, `createColorSchemeStore`, `colorSchemeScript` and the types `Theme`, `ThemeOptions`, `ColorSchemeMode` and `SelectOption` are re-exported from [`@omnifront/ui`](/api/ui), so one import covers the common case.

Every component also reads `theme.components.Omni<Name>.defaultProps` (`OmniButton`, `OmniTextField`, `OmniDialog`, `OmniMenu`, `OmniTabs`).

### `ThemeProvider`

```tsx
<ThemeProvider theme={theme} colorScheme="system" global>…</ThemeProvider>
```

Renders one `<style>` with the theme's CSS variables and a `display: contents` wrapper that carries the scope and colour scheme. Overlays in portals copy both. `colorScheme` is `light`, `dark` or `system` (inherited from an outer provider, else `system`). With `global` the variables go on `:root` and the scheme on `<html>` (restored on unmount), so the whole page is themed. `ThemeProviderProps` is the props type.

### `useTheme`

`useTheme(): Theme`: the nearest theme, or the default Material theme when there is no provider.

### `Portal`

`<Portal>`: renders its children in a `div[data-omni-portal]` at the end of `<body>`, carrying the theme scope. Renders nothing on the server.

### `Button`

Props (`ButtonProps` also takes every native `<button>` prop): `variant` (`text` / `outlined` / `contained`), `color`, `size`, `fullWidth`, `disableElevation`, `loading` (spinner, ignores clicks), `disableRipple`, `startIcon`, `endIcon`, `href` (renders an `<a>`), `target`, `rel`. The ref is forwarded.

### `TextField`

Props (`TextFieldProps`): `label`, `value` / `defaultValue` / `onChange`, `helperText`, `error`, `disabled`, `required`, `readOnly`, `variant` (`outlined` / `filled` / `standard`), `size`, `color`, `fullWidth`, `multiline`, `rows`, `startAdornment`, `endAdornment`, `slotProps.input`, `inputRef`, `id`, plus native input props.

### `Select`

```tsx
<Select label="Fruit" options={[{ value: "a", label: "Apple" }]} value={value} onChange={(event, value) => setValue(value)} />
```

Looks like a `TextField` and opens a list of options. Props (`SelectProps`): `label`, `options` (`SelectOption[]`: `{ value, label, disabled? }`), `value` / `defaultValue` / `onChange(event, value)`, `open` / `defaultOpen` / `onOpenChange(open, reason)` (`SelectCloseReason`: `escapeKeyDown`, `outsidePress`, `tab`, `select`, `trigger`, `programmatic`), `helperText`, `error`, `disabled`, `required`, `variant`, `size`, `color`, `fullWidth`, `name` (also writes the value to a hidden `<input>`, for forms), `id`, `className`. The options are data, not children, so the closed select can show the chosen label on the server and in all three frameworks the same way. Differences from MUI: `onChange` gets `(event, value)`, not an event with `target.value`, and the list opens below the select.

### `Dialog`

Props (`DialogProps`): `open`, `onClose(event, reason)` (`DialogCloseReason`: `escapeKeyDown`, `backdropClick`, `closeButton`, `programmatic`), `maxWidth` (default `sm`), `fullWidth`, `fullScreen`, `disableEscapeKeyDown`, `hideBackdrop`, `keepMounted`, `role`, `aria-label`, `className`, `slotProps` (`backdrop`, `container`, `paper`). Compose with `DialogTitle` (an `<h2>` that names the dialog), `DialogContent`, `DialogContentText` (the dialog's description) and `DialogActions`.

### `Menu`

Props (`MenuProps`): `anchorEl`, `open`, `onClose(event, reason)` (`MenuCloseReason`: `escapeKeyDown`, `outsidePress`, `tab`, `select`, `programmatic`), `placement` (default `bottom-start`), `autoFocus`, `keepMounted`, `aria-label`, `className`. Children are `MenuItem` (`MenuItemProps`: `disabled`, `selected`, `dense`, `onClick`) and `MenuDivider`.

### `TabContext`

Props (`TabContextProps`): `value` / `defaultValue` / `onChange(event, value)`, `orientation`, `selectionFollowsFocus`. Holds the selection for its `TabList` and `TabPanel`s (the shape of MUI Lab). `TabList` (`TabListProps`: `color`, `variant`, `centered`, plus `aria-label`) holds the `Tab`s (`TabProps`: `value`, `label`, `disabled`); `TabPanel` (`TabPanelProps`: `value`, `keepMounted`) shows its content while its tab is selected.
