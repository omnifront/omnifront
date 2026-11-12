# @omnifront/ui-angular

Standalone Angular components for the UI kit (Angular 17 or newer; `@angular/forms` is a peer, because `omni-text-field` is a `ControlValueAccessor`). About 7.1 KB gzipped (excluding Angular and `@omnifront/ui`). See the [UI guide](/guide/ui). `createTheme`, `createColorSchemeStore`, `colorSchemeScript` and the types `Theme`, `ThemeOptions`, `ColorSchemeMode` and `SelectOption` are re-exported from [`@omnifront/ui`](/api/ui).

Components that wrap a native element use an attribute selector (`button[omni-button]`, `li[omniMenuItem]`) so the element keeps its HTML meaning. Boolean inputs accept the bare attribute (`<button omni-button disabled>`). Add `@omnifront/ui/styles.css` to your global styles.

### `OmniThemeProvider`

```html
<omni-theme-provider [theme]="theme" colorScheme="system" global>…</omni-theme-provider>
```

Writes one `<style>` with the theme's CSS variables and carries the scope and colour scheme on its `display: contents` host. Overlays copy both when they move to `<body>`. With `global` the variables go on `:root` and the scheme on `<html>` (restored on destroy).

### `ThemeScope`

The injectable that `omni-theme-provider` provides: signals `theme`, `id` and `scheme` of the nearest provider. `injectTheme()` returns the nearest theme (or the default Material theme) in an injection context. `OmniIds` is the root service that hands out ids that are the same on the server and the client.

### `injectTheme`

`injectTheme(): Theme`.

### `OmniPart`

`<div [omniPart]="part">`: apply a framework-free `Part` from `@omnifront/ui` (attributes and handlers) to an element. Used inside the components; handy for building your own on top of a machine.

### `OmniButton`

`<button omni-button>` or `<a omni-button href>`. Inputs: `variant`, `color`, `size`, `fullWidth`, `disableElevation`, `loading`, `disabled`, `disableRipple`, `type`. Content projection: `[omniStartIcon]`, `[omniEndIcon]`.

### `OmniTextField`

`<omni-text-field>`. Inputs: `label`, `helperText`, `error`, `disabled`, `required`, `readOnly`, `variant`, `size`, `color`, `fullWidth`, `multiline`, `rows`, `type`, `placeholder`, `name`, `id`, `value`, `defaultValue`. Output: `valueChange`. Works with `ngModel` and reactive forms. Projection: `[omniStartAdornment]`, `[omniEndAdornment]`.

### `OmniSelect`

```html
<omni-select label="Fruit" [options]="fruits" [(value)]="fruit" />
```

Looks like a text field and opens a list of options. Inputs: `label`, `options` (`SelectOption[]`: `{ value, label, disabled? }`), `value`, `defaultValue`, `open`, `helperText`, `error`, `disabled`, `required`, `variant`, `size`, `color`, `fullWidth`, `name` (also writes the value to a hidden `<input>`), `id`. Outputs: `valueChange`, `openChange`, and `closed` with a `SelectCloseEvent` (`{ reason, event }`; `SelectCloseReason` is `escapeKeyDown`, `outsidePress`, `tab`, `select`, `trigger` or `programmatic`). Works with `ngModel` and reactive forms. The list moves to a portal in `<body>` while it is open. The options are data, not children, so every framework shows the chosen label the same way, including on the server.

### `OmniDialog`

`<omni-dialog [(open)]="open">`. Inputs: `open`, `maxWidth` (default `sm`), `fullWidth`, `fullScreen`, `disableEscapeKeyDown`, `hideBackdrop`, `keepMounted`, `role`, `label`, `className`. Outputs: `openChange`, and `closed` with a `DialogCloseEvent` (`{ reason, event }`; `DialogCloseReason` is `escapeKeyDown`, `backdropClick`, `closeButton` or `programmatic`). The host moves to a portal in `<body>` while it is shown. Compose with the attribute directives `OmniDialogTitle` (`[omniDialogTitle]`, on an `<h2>`), `OmniDialogContent`, `OmniDialogContentText` and `OmniDialogActions`. `OMNI_DIALOG` is the token a title or text directive injects.

### `OmniMenu`

`<omni-menu [anchorEl]="button" [(open)]="open">`. Inputs: `anchorEl`, `open`, `placement` (default `bottom-start`), `autoFocus`, `keepMounted`, `label`. Outputs: `openChange`, `closed` (a `MenuCloseEvent`; `MenuCloseReason` is `escapeKeyDown`, `outsidePress`, `tab`, `select` or `programmatic`). Children: `<li omniMenuItem>` (`OmniMenuItem`: inputs `disabled`, `selected`, `dense`; listen to `(click)`) and `<li omniMenuDivider>` (`OmniMenuDivider`). `OMNI_MENU` is the token an item injects.

### `OmniTabContext`

`<omni-tab-context [(value)]="tab">`. Inputs: `value`, `defaultValue`, `orientation`, `selectionFollowsFocus`. Output: `valueChange`. Holds the selection for `OmniTabList` (`<omni-tab-list label="…">`: inputs `color`, `variant`, `centered`, `label`), `OmniTab` (`<button omni-tab value="a" label="A">`: inputs `value`, `label`, `disabled`) and `OmniTabPanel` (`<omni-tab-panel value="a">`: inputs `value`, `keepMounted`). `OMNI_TABS` is the token they inject.
