# UI components

::: info Pre-release
Not on npm yet. Wave 0 of the UI kit (ADR-0014) has Button, TextField, Dialog, Menu and Tabs, Select, Checkbox, Radio and Switch from wave 1. More components arrive in later waves.
:::

A Material-style component library for React, Vue and Angular. Behaviour, accessibility and look are written once, in `@omnifront/ui`; each framework package only renders it. The result: the same DOM, the same keyboard behaviour and the same theme in all three, and a conformance suite that runs the same scenarios against each.

|  | Package | Peer |
|---|---|---|
| Core (theme, behaviour, CSS) | `@omnifront/ui` | none |
| React | `@omnifront/ui-react` | React 18+ |
| Vue | `@omnifront/ui-vue` | Vue 3.3+ |
| Angular | `@omnifront/ui-angular` | Angular 17+ (`@angular/forms`) |

## Set up

Import the CSS once, anywhere in your app. It holds the default Material theme (light and dark) and every component's styles, inside CSS layers so your own CSS always wins.

```ts
import "@omnifront/ui/styles.css"
```

::: code-group
```tsx [React]
import { Button, ThemeProvider, createTheme } from "@omnifront/ui-react"

const theme = createTheme({ palette: { primary: { main: "#7C3AED" } } })

export const App = () => (
	<ThemeProvider theme={theme} colorScheme="system">
		<Button variant="contained">Save</Button>
	</ThemeProvider>
)
```
```vue [Vue]
<script setup lang="ts">
import { Button, ThemeProvider, createTheme } from "@omnifront/ui-vue"
const theme = createTheme({ palette: { primary: { main: "#7C3AED" } } })
</script>

<template>
	<ThemeProvider :theme="theme" color-scheme="system">
		<Button variant="contained">Save</Button>
	</ThemeProvider>
</template>
```
```ts [Angular]
import { Component } from "@angular/core"
import { OmniButton, OmniThemeProvider, createTheme } from "@omnifront/ui-angular"

@Component({
	selector: "app-root",
	standalone: true,
	imports: [OmniThemeProvider, OmniButton],
	template: `
		<omni-theme-provider [theme]="theme" colorScheme="system">
			<button omni-button variant="contained">Save</button>
		</omni-theme-provider>
	`,
})
export class AppComponent {
	theme = createTheme({ palette: { primary: { main: "#7C3AED" } } })
}
```
:::

## Theme

`createTheme` takes the same shape as MUI's: pass only what you change. It covers `palette`, `typography`, `spacing`, `breakpoints`, `shape`, `shadows`, `transitions`, `zIndex`, `direction` and `components` (default props per component, keyed `OmniButton`, `OmniTextField`, `OmniDialog`, `OmniMenu`, `OmniTabs`).

```ts
const theme = createTheme({
	palette: { primary: { main: "#7C3AED" } }, // light, dark and contrast text are derived
	colorSchemes: { dark: { background: { default: "#0B1020" } } }, // tune one scheme only
	shape: { borderRadius: 8 },
	components: { OmniButton: { defaultProps: { variant: "contained" } } },
})
theme.spacing(2) // "16px"
theme.breakpoints.up("md") // "@media (min-width:900px)"
```

A theme is turned into **CSS variables** (`--omni-palette-primary-main`, `--omni-spacing`, ...), not into runtime styles. That is what makes it work in React Server Components, in Vue and in Angular with no extra setup, and it makes RTL free (everything is written with logical properties).

### Dark mode

Both schemes are always built. `colorScheme` on the provider is `light`, `dark` or `system` (follow the OS, in plain CSS, with no flash). The user's choice is a normal omnifront store, so every framework reads it the same way:

```ts
import { createColorSchemeStore } from "@omnifront/ui"

export const colorScheme = createColorSchemeStore({
	storageKey: "scheme",
	target: () => document.documentElement, // also sets data-omni-color-scheme on <html>
})
// React: const mode = useStore(colorScheme, (s) => s.mode)   Vue: useStore(...)   Angular: injectStore(...)
// call colorScheme.restore() after mount (it applies the saved choice, hydration-safe)
```

To avoid a flash before the first paint, put `colorSchemeScript({ storageKey: "scheme" })` in an inline `<script>` in `<head>`.

### A custom theme for the whole page

By default a `ThemeProvider` scopes its variables to its own wrapper, so you can nest themes. Add `global` once, near the root, to put the theme on `:root` and the colour scheme on `<html>` instead, so `<body>` is themed too:

```tsx
<ThemeProvider theme={theme} colorScheme="system" global>…</ThemeProvider>
```

On the server there is no `<html>` to write to; set `data-omni-color-scheme` on it yourself (or use `colorSchemeScript`) if the first paint must already be dark.

## Components

Names follow MUI. Where a framework has a native idiom, the API uses it: `onClose` in React, `@close` and `v-model` in Vue, `(closed)` and `[(open)]` in Angular.

::: code-group
```tsx [React]
<Dialog open={open} onClose={(event, reason) => setOpen(false)}>
	<DialogTitle>Delete project?</DialogTitle>
	<DialogContent>
		<DialogContentText>This cannot be undone.</DialogContentText>
	</DialogContent>
	<DialogActions>
		<Button onClick={() => setOpen(false)}>Cancel</Button>
	</DialogActions>
</Dialog>
```
```vue [Vue]
<Dialog v-model:open="open">
	<DialogTitle>Delete project?</DialogTitle>
	<DialogContent>
		<DialogContentText>This cannot be undone.</DialogContentText>
	</DialogContent>
	<DialogActions>
		<Button @click="open = false">Cancel</Button>
	</DialogActions>
</Dialog>
```
```html [Angular]
<omni-dialog [(open)]="open">
	<h2 omniDialogTitle>Delete project?</h2>
	<div omniDialogContent><p omniDialogContentText>This cannot be undone.</p></div>
	<div omniDialogActions><button omni-button (click)="open = false">Cancel</button></div>
</omni-dialog>
```
:::

| Component | Notes |
|---|---|
| **Button** | `variant` (`text` / `outlined` / `contained`), `color`, `size`, `fullWidth`, `disableElevation`, `loading` (spinner, ignores clicks), start and end icons, `href` makes it a link, touch ripple. |
| **IconButton**, **Fab** | A round button with only an icon, and the floating action button (`circular` or `extended`). `color`, `size`, `edge`; they need an `aria-label`. |
| **ButtonGroup** | Buttons joined into one `role="group"`; `variant`, `color`, `size`, `disabled` and `orientation` apply to every button inside (a button's own prop wins). |
| **ToggleButtonGroup**, **ToggleButton** | Buttons that stay pressed (`aria-pressed`): several at once, or `exclusive` (one, which can be unpressed). `v-model` in Vue. |
| **TextField** | `outlined` / `filled` / `standard`, floating label, `helperText`, `error`, `required`, adornments, `multiline` (with `minRows` / `maxRows` it grows with its text). Angular: works with `ngModel` and reactive forms. Vue: `v-model`. |
| **Checkbox** | A real `<input type="checkbox">` in a clickable label, so Space, focus, forms and screen readers are the browser's own. Controlled or not, `indeterminate`, colours, sizes, `labelPlacement`. Works with `v-model`, `ngModel` and reactive forms. |
| **Switch** | An on/off setting: the same native checkbox with `role="switch"` under a track and a thumb (so Space, focus, forms and screen readers are native). Controlled or not, colours, sizes, `labelPlacement`; `v-model`, `ngModel` and reactive forms. |
| **RadioGroup**, **Radio** | A `<fieldset role="radiogroup">` with a `<legend>`, helper text and error; the radios are native with one shared `name`, so the arrow keys move the choice (skipping disabled radios) and Tab leaves the group. `FormGroup` is the same labelled fieldset for other controls, such as several checkboxes. |
| **Select** | Looks like a TextField, opens a list of options (`options` is data: `{ value, label, disabled? }`). A real `combobox` and `listbox` for assistive technology: Enter, Space and the arrows open it; arrows, Home, End and typing move focus in the list; Enter or Space choose; Escape closes. Works with `v-model`, `ngModel` and reactive forms; `name` also writes a hidden input for plain forms. `multiple` keeps the list open and makes the value a list. For "select all" use a `Checkbox` with `indeterminate` next to it. |
| **Slider** | A real `<input type="range">` under a styled track and thumb: dragging, the arrow keys, Home, End, Page Up and Down, forms and screen readers are native. `min`, `max`, `step`, `marks`, `valueLabelDisplay`, `size`, `color`. One thumb for now (no range, not vertical). |
| **Rating** | Stars made of native radios (arrow keys, Tab, forms); `precision` 1, 0.5 or 0.25, `max`, `readOnly` (an image named "Rating: 3 out of 5"). |
| **Dialog** | Focus moves in and is trapped, Escape and a click outside ask to close (`reason`: `escapeKeyDown`, `backdropClick`), the page behind stops scrolling and is hidden from screen readers, focus returns to the opener. `maxWidth`, `fullWidth`, `fullScreen`, exit animation. |
| **Menu** | Hangs from `anchorEl`, flips when there is no room. Arrow keys, Home, End and typing move focus; Enter or Space choose; Escape, Tab and a click outside close. |
| **Tabs** | `TabContext` + `TabList` + `Tab` + `TabPanel` (MUI Lab's shape). Roving tabindex, arrow keys, optional `selectionFollowsFocus`, sliding indicator. |

## Differences from MUI

- **No `styled()` and no `sx`.** Style with CSS variables, a `class`, `slotProps` (React), or the `data-*` attributes each component sets (`data-variant`, `data-disabled`, `data-state`, ...). Everything is in `@layer omnifront`, so ordinary CSS overrides it.
- **`theme.components` supports `defaultProps`** only for now (no `styleOverrides`, no custom `variants`).
- **Menu opens below its anchor** (MUI's default overlaps it). Use `placement` to change it.
- **Label colours follow WCAG AA.** `contrastThreshold` defaults to 4.5 where MUI uses 3, so a few colours (light `warning` and `info`, dark `error`) get dark label text instead of white. Pass `contrastThreshold: 3` to get MUI's choice back.
- **TextField adornments** are `startAdornment` / `endAdornment` (React, Vue slots), not `InputProps`.
- Not built yet: scroll buttons on Tabs, layout components (`Box`, `Stack`, `Grid`) and the rest of the component list.

## Server-side rendering

Components render to HTML on the server in all three frameworks. Overlays (Dialog, Menu) render into a portal in the browser, so they produce no server HTML; everything else hydrates as it was rendered, including a floated label for a field that starts with a value.

## How it is tested

The same 44 scenarios (roles, keyboard, focus, `aria-*`, controlled and uncontrolled use, and axe) run against React, Vue and Angular. In a real browser, one example page per framework (`examples/ui-react`, `ui-vue`, `ui-angular`) is screenshotted in eight states (light, dark, brand theme, open dialog, open menu, ...) and compared pixel by pixel to the React one, and axe checks WCAG 2.1 AA, colour contrast included. Key presses (Space on a checkbox or switch, arrows in a radio group, the select's list) are driven in the real browser for every framework. Server rendering followed by hydration is tested for each framework: no mismatch, and the server's DOM is reused.

## Under the hood

Each interactive component is a *machine* from `@omnifront/ui`: a `Subscribable` (the same contract as the query observer and the store) with `connect()` for the attributes and handlers of each element and `attach()` for focus, scroll lock and positioning. You can use them without the component packages:

```ts
import { createDialog } from "@omnifront/ui"

const dialog = createDialog({ id: "d1", onOpenChange: (open, reason) => console.log(open, reason) })
dialog.subscribe(() => render(dialog.getSnapshot(), dialog.connect()))
```
