# @omnifront/ui-vue

Vue components (single-file components) for the UI kit. About 13.4 KB gzipped (excluding Vue and `@omnifront/ui`). See the [UI guide](/guide/ui). `createTheme`, `createColorSchemeStore`, `colorSchemeScript` and the types `Theme`, `ThemeOptions`, `ColorSchemeMode` and `SelectOption` are re-exported from [`@omnifront/ui`](/api/ui).

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

A real `<input type="range">`, so dragging, the keys, forms and screen readers are native. Props: `v-model` (a number, or with `range` a `[lower, upper]` pair; the lower thumb cannot pass the upper one, and the thumbs are named after `aria-label` with "minimum" and "maximum" added), `default-value`, `range`, `orientation` (`vertical` puts the smallest value at the bottom), `length` (the height of a vertical slider, default 200px), `min`, `max`, `step`, `marks` (`true` or a list of `{ value, label? }`), `value-label-display` (`auto`, `on`, `off`), `value-label-format`, `get-aria-value-text`, `size`, `color`, `disabled`, `name`, `aria-label`. Event `change(event, value)`.

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

Looks like a `TextField` and opens a list of options. Props: `label`, `options` (a list of `SelectItem`: options, `{ value, label, disabled? }`, and `SelectGroup`s of them, `{ label, options }`), `modelValue` (`v-model`; leave it out for an uncontrolled select) / `defaultValue`, `open` (`v-model:open`; stays uncontrolled when absent) / `defaultOpen`, `helperText`, `error`, `disabled`, `required`, `variant`, `size`, `color`, `fullWidth`, `name` (also writes the value to a hidden `<input>`), `id`. Events: `update:modelValue`, `change(event, value)`, `update:open`, `close(reason)`. The options are data, not children, so every framework shows the chosen label the same way, including on the server. The `option` slot (`{ option, selected }`) changes what an option looks like in the open list, such as an icon and a second line; the closed select and type-ahead still use the `label`.

### `Dialog`

Props: `open`, `maxWidth` (default `sm`), `fullWidth`, `fullScreen`, `disableEscapeKeyDown`, `hideBackdrop`, `keepMounted`, `role`; `aria-label` as an attribute. Events: `close(event, reason)` and `update:open(false)`. Compose with `DialogTitle`, `DialogContent`, `DialogContentText` and `DialogActions`.

### `Menu`

Props: `anchorEl`, `open`, `placement` (default `bottom-start`), `autoFocus` (default true), `keepMounted`. Events: `close(event, reason)` and `update:open`. Children: `MenuItem` (props `disabled`, `selected`, `dense`; event `click`) and `MenuDivider`.

### `TabContext`

Props: `modelValue` (`v-model`) / `defaultValue`, `orientation`, `selectionFollowsFocus`. Events: `update:modelValue`, `change(event, value)`. `TabList` (props `color`, `variant`, `centered`) holds the `Tab`s (props `value`, `label`, `disabled`); `TabPanel` (props `value`, `keepMounted`) shows its content while its tab is selected.

### `Typography`

Props: `variant` (default `body1`), `align`, `color`, `gutterBottom`, `noWrap`, `paragraph`, `component`. Same rules as React: the element follows the variant unless `component` is given.

### `Paper`

Props: `elevation` (0 to 24, default 1), `variant` (`elevation` or `outlined`), `square`, `component`.

### `Card`

Props: `variant`, `raised`, `component`. `CardHeader` takes `title` and `subheader` as props (or the `title` and `subheader` slots) and the `avatar` and `action` slots. `CardContent`, `CardActions` (prop `disableSpacing`) and `CardMedia` (props `image`, `alt`, `height`) are the other parts.

### `Divider`

Props: `orientation`, `variant`, `flexItem`, `textAlign`, `component` (`hr`, `li`, `div`). With slot content the text sits in the line and the root is a `div` with `role="separator"`.

### `Avatar`

Props: `variant`, `src`, `srcSet`, `alt`; the slot is the fallback content (initials, an icon), then a generic person.

### `Badge`

Props: `badgeContent`, `max`, `showZero`, `variant`, `invisible`, `color`, `anchorOrigin`, `overlap`; the slot is what it wraps.

### `SvgIcon`

Props: `fontSize`, `color`, `viewBox`, `titleAccess`; the slot is the SVG content (`<SvgIcon><path d="…" /></SvgIcon>`).

### `AppBar`

Props: `position` (default `fixed`), `color`, `elevation` (default 4), `component` (default `header`). `Toolbar` takes `variant` (`regular` or `dense`) and `disableGutters`.

### `List`

Props: `dense`, `disablePadding`, `component`. `ListItem` (props `divider`, `disablePadding`, `disableGutters`; slot `secondaryAction`), `ListItemButton` (props `selected`, `disabled`, `href`; event `click`), `ListItemIcon`, `ListItemText` (props `primary`, `secondary`; or the `primary` and `secondary` slots) and `ListSubheader` (prop `disableSticky`). Put a `nav` around a list of links.

### `Table`

Props: `size`, `stickyHeader`. `TableContainer`, `TableHead`, `TableBody`, `TableFooter`, `TableRow` (props `hover`, `selected`) and `TableCell` (props `align`, `padding`, `variant`, `component`; a cell in `TableHead` is a `th` with `scope="col"`).

### `Chip`

Props: `label`, `variant`, `color`, `size`, `clickable`, `disabled`; slots `avatar`, `icon` and the default (instead of `label`). Events: `click` and `delete`. Vue has no "is anyone listening" prop, but the chip reads its listeners from the vnode: a `@click` makes it a `role="button"`, a `@delete` shows the delete icon (and Backspace or Delete on the focused chip emits it). Same keyboard behaviour as React.

### `Accordion`

Props: `expanded` (`v-model:expanded`) / `defaultExpanded`, `disabled`. Events: `change(event, expanded)` and `update:expanded`. `AccordionSummary` (prop `headingLevel`; slot `expandIcon`) and `AccordionDetails`.

### `Tooltip`

```vue
<Tooltip title="Saves your work" placement="top"><Button>Save</Button></Tooltip>
```

Props: `title` (or the `title` slot for anything richer than text), `placement`, `open` (`v-model:open`) / `defaultOpen`, `enterDelay`, `leaveDelay`, `disableInteractive`. Events: `open`, `close`, `update:open`. The one element in the default slot is the trigger. Same behaviour as React.

## Wave 3: feedback and navigation

The same components and behaviour as React; props are the same names (kebab-case in templates), events are `@close`, `@change` and `v-model`.

### `Alert`, `AlertTitle`

```vue
<Alert severity="error" @close="open = false"><AlertTitle>Upload failed</AlertTitle>The file is too big.</Alert>
```

Props `severity`, `variant`, `icon` (`false` removes it; the `icon` slot replaces it), `closeText`; the `action` slot sits at the far end. A `@close` listener adds a close button (Vue lets the component read whether anyone listens).

### `Snackbar`

```vue
<Snackbar :open="open" :auto-hide-duration="4000" message="Saved" @close="(_e, reason) => (open = false)"><template #action><Button size="small">Undo</Button></template></Snackbar>
```

Props `open`, `autoHideDuration`, `anchorOrigin`, `message`, `disableClickAway`; `@close(event, reason)` with `timeout`, `outsidePress` or `escapeKeyDown`; the default slot replaces `message` (put an `Alert` there), the `action` slot sits at the end.

### `Backdrop`, `CircularProgress`, `LinearProgress`, `Skeleton`

Props as in React (`value`, `size`, `thickness`, `color`, `variant`, `valueBuffer`, `animation`, `width`, `height`, `open`, `invisible`). The two progress components are `role="progressbar"`: give them `aria-label`.

### `Drawer`, `Popover`

`Drawer`: props `variant`, `anchor`, `open`, `width`; `@close(event, reason)` or `v-model:open`. `Popover`: props `open`, `anchorEl`, `placement`; `@close(event, reason)`; it needs `aria-label`. Behaviour as in React.

### `Breadcrumbs`, `Link`

`Breadcrumbs` (props `maxItems`, `itemsBeforeCollapse`, `itemsAfterCollapse`, `expandText`; a `separator` slot) wraps each child of its default slot in a list item. `Link`: `underline`, `color`, `component`.

### `Pagination`

Props as in React; `@change(event, page)` and `v-model:page` (without `page` it keeps its own).

### `Stepper`, `Step`

`Stepper` gives each `Step` in its slot its position (you can use `v-for` and `v-if`). `Step`: `label`, `optional`, `completed`, `active`, `disabled`, `error`; slots `icon`, `label` and the default (content of the active step in a vertical stepper); a `@click` listener makes the header a button.

### `BottomNavigation`, `BottomNavigationAction`

`BottomNavigation`: `value`, `showLabels`; `@change(event, value)` or `v-model:value`. `BottomNavigationAction`: `value`, `label`, `disabled`, and an `icon` slot.

### `SpeedDial`, `SpeedDialAction`

`SpeedDial`: `ariaLabel` (required), `direction`, `open` / `defaultOpen`; `@open`, `@close`; an `icon` slot. `SpeedDialAction`: `tooltipTitle` and the icon in its default slot; `@click`.

### `CardActionArea`, `AvatarGroup`, `ListItemAvatar`

As in React. `ListItem` and `ListItemButton` take `align-items="flex-start"`.

### `TableSortLabel`, `TablePagination`

`TableSortLabel`: `active`, `direction`; `TableCell` takes `sort-direction` and writes `aria-sort`. `TablePagination`: `count`, `page`, `rowsPerPage`, `rowsPerPageOptions`, `colSpan`; `@page-change(event, page)` and `@rows-per-page-change(rows)`.

### `AccordionGroup`

Props `value` / `defaultValue`, `multiple`; `@change(event, value)` or `v-model:value`. Give each `Accordion` a `value`.

`Chip` has a `deleteIcon` slot; `Tooltip` has `arrow`, `enterTouchDelay` and `leaveTouchDelay`.
