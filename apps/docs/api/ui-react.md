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

### `IconButton`, `Fab`

```tsx
<IconButton aria-label="Delete" color="primary"><DeleteIcon /></IconButton>
<Fab aria-label="Add"><AddIcon /></Fab>
<Fab variant="extended"><AddIcon /> Create</Fab>
```

`IconButton` (`IconButtonProps`) is a round button with only an icon: `color` (`default`, `inherit`, `primary`, `secondary`, `success`, `error`, `info`, `warning`), `size`, `edge` (`start` or `end`, pulls it into the padding of its parent), `disabled`, `disableRipple`, `href` / `target` / `rel` (makes it a link), `className`. `Fab` (`FabProps`) is a floating action button: `variant` (`circular` or `extended`), `color`, `size`, `disabled`, `disableRipple`, `href`. Both need an `aria-label` (nothing else names an icon-only button), and the ref goes to the element.

### `ButtonGroup`

```tsx
<ButtonGroup aria-label="Actions" variant="outlined"><Button>One</Button><Button>Two</Button></ButtonGroup>
```

Joins buttons into one control (`role="group"`). `ButtonGroupProps`: `variant`, `color`, `size`, `disabled`, `disableElevation`, `orientation`, `fullWidth`, `aria-label`, `className`. Each `Button` inside takes these as its defaults; a button's own prop wins.

### `ToggleButtonGroup`, `ToggleButton`

```tsx
<ToggleButtonGroup aria-label="Format" value={format} onChange={(event, value) => setFormat(value)}>
  <ToggleButton value="bold">Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
</ToggleButtonGroup>
```

Buttons that stay pressed (`aria-pressed`). `ToggleButtonGroupProps`: `value` / `defaultValue` / `onChange(event, value)` (a list of values; with `exclusive` one value or `null`), `exclusive`, `orientation`, `size`, `color`, `disabled`, `fullWidth`, `aria-label`. `ToggleButtonProps`: `value`, `selected` / `onChange` (when used alone, without a group), `color`, `size`, `disabled`.

### `Slider`

```tsx
<Slider aria-label="Volume" value={volume} onChange={(event, value) => setVolume(value)} valueLabelDisplay="auto" />
```

A real `<input type="range">` under a styled track and thumb, so dragging, the arrow keys, Home, End, Page Up and Down, forms and screen readers are native. `SliderProps`: `value` / `defaultValue` / `onChange(event, value)`, `min`, `max`, `step`, `marks` (`true` for one at every step, or a list of `SliderMark`: `{ value, label? }`), `valueLabelDisplay` (`auto`, `on`, `off`), `valueLabelFormat`, `getAriaValueText`, `size`, `color`, `disabled`, `name`, `aria-label` / `aria-labelledby`. Not yet: two thumbs and a vertical slider.

### `Rating`

```tsx
<Rating aria-label="Rating" value={stars} onChange={(event, value) => setStars(value)} />
```

Stars made of native radios (the arrow keys and Tab are the browser's). `RatingProps`: `value` / `defaultValue` / `onChange(event, value)` (`0` means no rating), `onChangeActive` (the value under the pointer), `max` (5), `precision` (`1`, `0.5`, `0.25`), `readOnly` (an image named "Rating: 3 out of 5"), `disabled`, `size`, `color`, `name`, `aria-label` / `aria-labelledby`.

### `TextField`

Props (`TextFieldProps`): `label`, `value` / `defaultValue` / `onChange`, `helperText`, `error`, `disabled`, `required`, `readOnly`, `variant` (`outlined` / `filled` / `standard`), `size`, `color`, `fullWidth`, `multiline`, `rows`, `startAdornment`, `endAdornment`, `slotProps.input`, `inputRef`, `id`, plus native input props.

### `Checkbox`

```tsx
<Checkbox label="Accept terms" checked={accepted} onChange={(event, checked) => setAccepted(checked)} />
```

A real `<input type="checkbox">` (Space, focus, forms and screen readers work natively) inside a clickable `<label>`. Props (`CheckboxProps`): `checked` / `defaultChecked` / `onChange(event, checked)`, `indeterminate` (a click then makes it checked), `label`, `labelPlacement` (`end`, `start`, `top`, `bottom`), `disabled`, `required`, `error`, `color` (including `error`), `size`, `name`, `value`, `id`, `className`, `slotProps.input` (for example `aria-label` when there is no `label`). The ref is forwarded to the `<label>`.

### `Switch`

```tsx
<Switch label="Wi-Fi" checked={on} onChange={(event, checked) => setOn(checked)} />
```

An on/off setting: a real `<input type="checkbox" role="switch">` (Space, focus, forms and screen readers work natively) under a track and a thumb. Props (`SwitchProps`): `checked` / `defaultChecked` / `onChange(event, checked)`, `label`, `labelPlacement` (`end`, `start`, `top`, `bottom`), `disabled`, `required`, `error`, `color`, `size` (`small` or `medium`), `name`, `value`, `id`, `className`, `slotProps.input`. The ref is forwarded to the `<label>`.

### `RadioGroup`

```tsx
<RadioGroup label="Fruit" value={fruit} onChange={(event, value) => setFruit(value)}>
	<Radio value="a" label="Apple" />
</RadioGroup>
```

A `<fieldset role="radiogroup">` with a `<legend>`: one value chosen at a time. The radios are native with a shared `name`, so the arrow keys move the choice and Tab leaves the group. Props (`RadioGroupProps`): `label`, `helperText`, `value` / `defaultValue` / `onChange(event, value)`, `name`, `error`, `disabled`, `required`, `row`, `id`, `className`.

### `Radio`

One radio. Props (`RadioProps`): `value`, `label`, `labelPlacement`, `disabled`, `color`, `size`, `id`, `className`, `slotProps.input`. Outside a `RadioGroup` it is a plain radio controlled with `checked`, `onChange` and `name`.

### `FormGroup`

A labelled group of related controls (a `<fieldset>` with a `<legend>`), for example several checkboxes. Props (`FormGroupProps`): `label`, `helperText`, `error`, `disabled`, `row`, `id`, `className`.

### `Select`

```tsx
<Select label="Fruit" options={[{ value: "a", label: "Apple" }]} value={value} onChange={(event, value) => setValue(value)} />
```

Looks like a `TextField` and opens a list of options. Props (`SelectProps`): `label`, `options` (`SelectOption[]`: `{ value, label, disabled? }`), `value` / `defaultValue` / `onChange(event, value)`, `open` / `defaultOpen` / `onOpenChange(open, reason)` (`SelectCloseReason`: `escapeKeyDown`, `outsidePress`, `tab`, `select`, `trigger`, `programmatic`), `helperText`, `error`, `disabled`, `required`, `variant`, `size`, `color`, `fullWidth`, `name` (also writes the value to a hidden `<input>`, for forms), `id`, `className`. `multiple` keeps the list open and makes `value` a list (`MultipleSelectProps`; the default is `SingleSelectProps`, with a single `value`), and the field shows the chosen labels separated by commas. The options are data, not children, so the closed select can show the chosen label on the server and in all three frameworks the same way. Differences from MUI: `onChange` gets `(event, value)`, not an event with `target.value`, and the list opens below the select.

### `Dialog`

Props (`DialogProps`): `open`, `onClose(event, reason)` (`DialogCloseReason`: `escapeKeyDown`, `backdropClick`, `closeButton`, `programmatic`), `maxWidth` (default `sm`), `fullWidth`, `fullScreen`, `disableEscapeKeyDown`, `hideBackdrop`, `keepMounted`, `role`, `aria-label`, `className`, `slotProps` (`backdrop`, `container`, `paper`). Compose with `DialogTitle` (an `<h2>` that names the dialog), `DialogContent`, `DialogContentText` (the dialog's description) and `DialogActions`.

### `Menu`

Props (`MenuProps`): `anchorEl`, `open`, `onClose(event, reason)` (`MenuCloseReason`: `escapeKeyDown`, `outsidePress`, `tab`, `select`, `programmatic`), `placement` (default `bottom-start`), `autoFocus`, `keepMounted`, `aria-label`, `className`. Children are `MenuItem` (`MenuItemProps`: `disabled`, `selected`, `dense`, `onClick`) and `MenuDivider`.

### `TabContext`

Props (`TabContextProps`): `value` / `defaultValue` / `onChange(event, value)`, `orientation`, `selectionFollowsFocus`. Holds the selection for its `TabList` and `TabPanel`s (the shape of MUI Lab). `TabList` (`TabListProps`: `color`, `variant`, `centered`, plus `aria-label`) holds the `Tab`s (`TabProps`: `value`, `label`, `disabled`); `TabPanel` (`TabPanelProps`: `value`, `keepMounted`) shows its content while its tab is selected.
