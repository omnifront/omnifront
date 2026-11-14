# @omnifront/ui-vue

Vue components (single-file components) for the UI kit. About 4.7 KB gzipped (excluding Vue and `@omnifront/ui`). See the [UI guide](/guide/ui). `createTheme`, `createColorSchemeStore`, `colorSchemeScript` and the types `Theme`, `ThemeOptions`, `ColorSchemeMode` and `SelectOption` are re-exported from [`@omnifront/ui`](/api/ui).

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

### `IconButton`, `Fab`

```vue
<IconButton aria-label="Delete" color="primary"><DeleteIcon /></IconButton>
<Fab aria-label="Add"><AddIcon /></Fab>
```

`IconButton`: a round button with only an icon: `color`, `size`, `edge` (`start` or `end`), `disabled`, `disableRipple`, `href` / `target` / `rel`. `Fab`: a floating action button: `variant` (`circular` or `extended`), `color`, `size`, `disabled`, `disableRipple`, `href`. Both need an `aria-label`.

### `ButtonGroup`

```vue
<ButtonGroup aria-label="Actions" variant="outlined"><Button>One</Button><Button>Two</Button></ButtonGroup>
```

Joins buttons into one `role="group"`. Props: `variant`, `color`, `size`, `disabled`, `disableElevation`, `orientation`, `full-width`. Each `Button` inside takes these as its defaults; its own prop wins.

### `ToggleButtonGroup`, `ToggleButton`

```vue
<ToggleButtonGroup v-model="format" aria-label="Format">
  <ToggleButton value="bold">Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
</ToggleButtonGroup>
```

Buttons that stay pressed. `ToggleButtonGroup`: `v-model` (a list of values; with `exclusive`, one value or `null`), `default-value`, `exclusive`, `orientation`, `size`, `color`, `disabled`, `full-width`, and a `change` event `(event, value)`. `ToggleButton`: `value`, `selected` (alone, without a group), `color`, `size`, `disabled`, `change`.

### `Slider`

```vue
<Slider v-model="volume" aria-label="Volume" value-label-display="auto" />
```

A real `<input type="range">`, so dragging, the keys, forms and screen readers are native. Props: `v-model`, `default-value`, `min`, `max`, `step`, `marks` (`true` or a list of `{ value, label? }`), `value-label-display` (`auto`, `on`, `off`), `value-label-format`, `get-aria-value-text`, `size`, `color`, `disabled`, `name`, `aria-label`. Event `change(event, value)`. Not yet: two thumbs and a vertical slider.

### `Rating`

```vue
<Rating v-model="stars" aria-label="Rating" />
```

Stars made of native radios. Props: `v-model` (`0` means no rating), `default-value`, `max` (5), `precision` (`1`, `0.5`, `0.25`), `read-only` (an image named "Rating: 3 out of 5"), `disabled`, `size`, `color`, `name`, `aria-label`. Events `change(event, value)` and `change-active`.

### `TextField`

Props: `modelValue` (`v-model`; leave it out for an uncontrolled field) / `defaultValue`, `label`, `helperText`, `error`, `disabled`, `required`, `readOnly`, `variant`, `size`, `color`, `fullWidth`, `multiline`, `rows`, `id`, `type`, `placeholder`. Slots: `startAdornment`, `endAdornment`. Events: `update:modelValue`, `focus`, `blur`.

### `Checkbox`

```vue
<Checkbox v-model="accepted" label="Accept terms" />
```

A real `<input type="checkbox">` inside a clickable `<label>`. Props: `modelValue` (`v-model`; leave it out for an uncontrolled checkbox) / `defaultChecked`, `indeterminate`, `label` (or the default slot), `labelPlacement`, `disabled`, `required`, `error`, `color`, `size`, `name`, `value`, `id`. Events: `update:modelValue`, `change(event, checked)`. `aria-*` attributes go to the input; the rest go to the label.

### `Switch`

```vue
<Switch v-model="wifi" label="Wi-Fi" />
```

An on/off setting: a real `<input type="checkbox" role="switch">` under a track and a thumb. Props: `modelValue` (`v-model`; leave it out for an uncontrolled switch) / `defaultChecked`, `label` (or the default slot), `labelPlacement`, `disabled`, `required`, `error`, `color`, `size`, `name`, `value`, `id`. Events: `update:modelValue`, `change(event, checked)`. `aria-*` attributes go to the input; the rest go to the label.

### `RadioGroup`

```vue
<RadioGroup v-model="fruit" label="Fruit"><Radio value="a" label="Apple" /></RadioGroup>
```

A `<fieldset role="radiogroup">` with a `<legend>`. Props: `label`, `helperText`, `modelValue` (`v-model`) / `defaultValue`, `name`, `error`, `disabled`, `required`, `row`, `id`. Events: `update:modelValue`, `change(event, value)`. A parent that does not accept a change gets every radio put back.

### `Radio`

One radio. Props: `value`, `label` (or the default slot), `labelPlacement`, `disabled`, `color`, `size`, `id`; outside a `RadioGroup` also `checked` and `name`. Event: `change`.

### `FormGroup`

A labelled group of related controls (a `<fieldset>` with a `<legend>`), for example several checkboxes. Props: `label`, `helperText`, `error`, `disabled`, `row`, `id`.

### `Select`

```vue
<Select v-model="fruit" label="Fruit" :options="[{ value: 'a', label: 'Apple' }]" />
```

Looks like a `TextField` and opens a list of options. Props: `label`, `options` (`SelectOption[]`: `{ value, label, disabled? }`), `modelValue` (`v-model`; leave it out for an uncontrolled select) / `defaultValue`, `open` (`v-model:open`; stays uncontrolled when absent) / `defaultOpen`, `helperText`, `error`, `disabled`, `required`, `variant`, `size`, `color`, `fullWidth`, `name` (also writes the value to a hidden `<input>`), `id`. Events: `update:modelValue`, `change(event, value)`, `update:open`, `close(reason)`. The options are data, not children, so every framework shows the chosen label the same way, including on the server.

### `Dialog`

Props: `open`, `maxWidth` (default `sm`), `fullWidth`, `fullScreen`, `disableEscapeKeyDown`, `hideBackdrop`, `keepMounted`, `role`; `aria-label` as an attribute. Events: `close(event, reason)` and `update:open(false)`. Compose with `DialogTitle`, `DialogContent`, `DialogContentText` and `DialogActions`.

### `Menu`

Props: `anchorEl`, `open`, `placement` (default `bottom-start`), `autoFocus` (default true), `keepMounted`. Events: `close(event, reason)` and `update:open`. Children: `MenuItem` (props `disabled`, `selected`, `dense`; event `click`) and `MenuDivider`.

### `TabContext`

Props: `modelValue` (`v-model`) / `defaultValue`, `orientation`, `selectionFollowsFocus`. Events: `update:modelValue`, `change(event, value)`. `TabList` (props `color`, `variant`, `centered`) holds the `Tab`s (props `value`, `label`, `disabled`); `TabPanel` (props `value`, `keepMounted`) shows its content while its tab is selected.
