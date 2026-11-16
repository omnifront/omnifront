# @omnifront/ui-react

React components for the UI kit. About 10.3 KB gzipped (excluding React and `@omnifront/ui`). See the [UI guide](/guide/ui). `createTheme`, `createColorSchemeStore`, `colorSchemeScript` and the types `Theme`, `ThemeOptions`, `ColorSchemeMode` and `SelectOption` are re-exported from [`@omnifront/ui`](/api/ui), so one import covers the common case.

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

A real `<input type="range">` under a styled track and thumb, so dragging, the arrow keys, Home, End, Page Up and Down, forms and screen readers are native. `SliderProps` is `SingleSliderProps` or, with `range`, `RangeSliderProps` (two thumbs, `value` / `defaultValue` / `onChange` take and give `[lower, upper]`; the lower thumb cannot pass the upper one, and the thumbs are named after `aria-label` with "minimum" and "maximum" added). Props: `value` / `defaultValue` / `onChange(event, value)`, `orientation` (`vertical` puts the smallest value at the bottom), `length` (the height of a vertical slider, default 200px), `min`, `max`, `step`, `marks` (`true` for one at every step, or a list of `SliderMark`: `{ value, label? }`), `valueLabelDisplay` (`auto`, `on`, `off`), `valueLabelFormat`, `getAriaValueText`, `size`, `color`, `disabled`, `name`, `aria-label` / `aria-labelledby`.

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

Looks like a `TextField` and opens a list of options. Props (`SelectProps`): `label`, `options` (a list of `SelectItem`: options, `{ value, label, disabled? }`, and `SelectGroup`s of them, `{ label, options }`), `renderOption(option, { selected })` (what an option looks like in the open list, such as an icon and a second line; the closed select and type-ahead still use the `label`), `value` / `defaultValue` / `onChange(event, value)`, `open` / `defaultOpen` / `onOpenChange(open, reason)` (`SelectCloseReason`: `escapeKeyDown`, `outsidePress`, `tab`, `select`, `trigger`, `programmatic`), `helperText`, `error`, `disabled`, `required`, `variant`, `size`, `color`, `fullWidth`, `name` (also writes the value to a hidden `<input>`, for forms), `id`, `className`. `multiple` keeps the list open and makes `value` a list (`MultipleSelectProps`; the default is `SingleSelectProps`, with a single `value`), and the field shows the chosen labels separated by commas. The options are data, not children, so the closed select can show the chosen label on the server and in all three frameworks the same way. Differences from MUI: `onChange` gets `(event, value)`, not an event with `target.value`, and the list opens below the select.

### `Dialog`

Props (`DialogProps`): `open`, `onClose(event, reason)` (`DialogCloseReason`: `escapeKeyDown`, `backdropClick`, `closeButton`, `programmatic`), `maxWidth` (default `sm`), `fullWidth`, `fullScreen`, `disableEscapeKeyDown`, `hideBackdrop`, `keepMounted`, `role`, `aria-label`, `className`, `slotProps` (`backdrop`, `container`, `paper`). Compose with `DialogTitle` (an `<h2>` that names the dialog), `DialogContent`, `DialogContentText` (the dialog's description) and `DialogActions`.

### `Menu`

Props (`MenuProps`): `anchorEl`, `open`, `onClose(event, reason)` (`MenuCloseReason`: `escapeKeyDown`, `outsidePress`, `tab`, `select`, `programmatic`), `placement` (default `bottom-start`), `autoFocus`, `keepMounted`, `aria-label`, `className`. Children are `MenuItem` (`MenuItemProps`: `disabled`, `selected`, `dense`, `onClick`) and `MenuDivider`.

### `TabContext`

Props (`TabContextProps`): `value` / `defaultValue` / `onChange(event, value)`, `orientation`, `selectionFollowsFocus`. Holds the selection for its `TabList` and `TabPanel`s (the shape of MUI Lab). `TabList` (`TabListProps`: `color`, `variant`, `centered`, plus `aria-label`) holds the `Tab`s (`TabProps`: `value`, `label`, `disabled`); `TabPanel` (`TabPanelProps`: `value`, `keepMounted`) shows its content while its tab is selected.

### `Typography`

```tsx
<Typography variant="h5" component="h2" gutterBottom>Title</Typography>
```

Text in one of the theme's styles. `TypographyProps`: `variant` (`h1` to `h6`, `subtitle1`, `subtitle2`, `body1` (default), `body2`, `caption`, `overline`, `button`, `inherit`), `align`, `color` (the palette colours, `text.primary`, `text.secondary`, `text.disabled`), `gutterBottom`, `noWrap` (one line, ellipsis), `paragraph`, `component`. The element follows the variant (`h1` to `h6`; `h6` for subtitles; `p`; `span`) unless `component` says otherwise, so the look and the document outline are separate choices.

### `Paper`

`PaperProps`: `elevation` (0 to 24, default 1), `variant` (`elevation` or `outlined`), `square`, `component`. In the dark scheme a raised Paper is lighter (a white overlay), as in Material, rather than shadowed.

### `Card`

```tsx
<Card>
  <CardMedia image={url} alt="" height={140} />
  <CardHeader avatar={<Avatar>R</Avatar>} title="Title" subheader="Subtitle" action={<IconButton aria-label="More">…</IconButton>} />
  <CardContent>Text</CardContent>
  <CardActions><Button size="small">Share</Button></CardActions>
</Card>
```

A Paper for one subject (`CardProps`: `variant`, `raised`, `component`). `CardHeader` (`CardHeaderProps`): `avatar`, `title`, `subheader`, `action`. `CardContent` is padding, `CardActions` (`CardActionsProps`: `disableSpacing`) a row of buttons, `CardMedia` (`CardMediaProps`: `image`, `alt`, `height`) an `<img>`. Not built: `CardActionArea`.

### `Divider`

`DividerProps`: `orientation`, `variant` (`fullWidth`, `inset`, `middle`), `flexItem`, `textAlign`, `component` (`hr`, `li`, `div`), and children. Without children it is a real `<hr>` (an `li` inside a `List` is `aria-hidden`); with children the text sits in the line and the root is a `div` with `role="separator"`.

### `Avatar`

`AvatarProps`: `variant` (`circular`, `rounded`, `square`), `src`, `srcSet`, `alt`, children (initials, an icon). If the picture fails to load it shows the children, and then a generic person. Initials are black on grey 400 (11:1) instead of Material's white (1.9:1), so they pass WCAG AA in both colour schemes.

### `Badge`

```tsx
<Badge badgeContent={4} color="primary"><MailIcon /></Badge>
```

`BadgeProps`: `badgeContent` (text or number), `max` (default 99, then `99+`), `showZero` (a zero is hidden otherwise), `variant` (`standard` or `dot`), `invisible`, `color`, `anchorOrigin` (`{ vertical, horizontal }`), `overlap` (`circular` for a round child). The badge sits on the end side of its child and mirrors in RTL.

### `SvgIcon`

```tsx
<SvgIcon fontSize="large" color="primary"><path d="M12 2 2 22h20z" /></SvgIcon>
```

`SvgIconProps`: `fontSize` (`small`, `medium`, `large`, `inherit`), `color` (`inherit`, `action`, `disabled` and the palette colours), `viewBox` (default `0 0 24 24`), `titleAccess` (`role="img"` and that name; without it the icon is `aria-hidden`). The children are the SVG content. No icon set is shipped.

### `AppBar`

`AppBarProps`: `position` (default `fixed`; use `static` inside a page), `color` (`primary`, `secondary`, `default`, `transparent`, `inherit`), `elevation` (default 4), `component` (default `header`). `Toolbar` (`ToolbarProps`: `variant` `regular` or `dense`, `disableGutters`) is the row inside it, 56px high (64px from 600px wide).

### `List`

```tsx
<nav aria-label="Mailboxes">
  <List>
    <ListSubheader>Folders</ListSubheader>
    <ListItem disablePadding>
      <ListItemButton selected onClick={open}><ListItemIcon><InboxIcon /></ListItemIcon><ListItemText primary="Inbox" secondary="3 new" /></ListItemButton>
    </ListItem>
    <Divider component="li" />
  </List>
</nav>
```

A `ul` (`ListProps`: `dense`, `disablePadding`, `component`). `ListItem` (`ListItemProps`: `divider`, `disablePadding`, `disableGutters`, `secondaryAction`) is the `li`; `ListItemButton` (`ListItemButtonProps`: `selected`, `disabled`, `href`, `onClick`) is a real `<button>` (or `<a>`) that fills it and sets `aria-current` when selected; `ListItemIcon`; `ListItemText` (`ListItemTextProps`: `primary`, `secondary`); `ListSubheader` (`ListSubheaderProps`: `disableSticky`). Put a `nav` around a list of links: a `nav` may not hold `li` directly, so `List` does not take `component="nav"` the way MUI does.

### `Table`

```tsx
<TableContainer>
  <Table aria-label="Desserts" size="small">
    <TableHead><TableRow><TableCell>Dessert</TableCell><TableCell align="right">Calories</TableCell></TableRow></TableHead>
    <TableBody><TableRow hover><TableCell component="th" scope="row">Frozen yoghurt</TableCell><TableCell align="right">159</TableCell></TableRow></TableBody>
  </Table>
</TableContainer>
```

A real `<table>` (`TableProps`: `size`, `stickyHeader`). `TableContainer` scrolls sideways; `TableHead`, `TableBody` and `TableFooter` are the native sections; `TableRow` (`TableRowProps`: `hover`, `selected`); `TableCell` (`TableCellProps`: `align`, `padding` (`normal`, `checkbox`, `none`), `variant`, `component`). A cell in `TableHead` is a `th` with `scope="col"` without saying so; for a row header use `component="th" scope="row"`. `left` and `right` alignment are logical (start and end), so a table mirrors in RTL. Not built: `TableSortLabel`, `TablePagination` (wave 3 has Pagination).

### `Chip`

```tsx
<Chip label="React" onClick={filter} onDelete={remove} />
```

`ChipProps`: `label`, `variant` (`filled` or `outlined`), `color`, `size` (`small` or `medium`), `avatar`, `icon`, `onClick`, `clickable`, `onDelete`, `disabled`. With `onClick` it is a `role="button"` in the Tab order (Enter, and Space on key up). With `onDelete` it shows a delete icon, and Backspace or Delete on the focused chip calls it (`aria-keyshortcuts` says so). The icon itself is a mouse target only: it is `aria-hidden`, so the keyboard path is the chip.

### `Accordion`

```tsx
<Accordion expanded={open} onChange={(event, expanded) => setOpen(expanded)}>
  <AccordionSummary>Question</AccordionSummary>
  <AccordionDetails>Answer</AccordionDetails>
</Accordion>
```

One collapsible section (`AccordionProps`: `expanded` / `defaultExpanded` / `onChange(event, expanded)`, `disabled`). `AccordionSummary` (`AccordionSummaryProps`: `expandIcon`, `headingLevel` 2 to 6, default 3) is a `<button>` with `aria-expanded` and `aria-controls` inside a heading; `AccordionDetails` is a `role="region"` named by the button. The closed region is hidden with `visibility` after its height has shrunk, so it leaves the accessibility tree and the Tab order, and the animation is one CSS transition (none with reduced motion). Not built: an accordion group that keeps one open (control `expanded` yourself).

### `Tooltip`

```tsx
<Tooltip title="Saves your work" placement="top"><Button>Save</Button></Tooltip>
```

A description for the one element inside (`TooltipProps`: `title`, `placement` (default `bottom`, flips when there is no room), `open` / `defaultOpen` / `onOpen` / `onClose`, `enterDelay` (default 100 ms), `leaveDelay`, `disableInteractive`, `className`). It opens when the pointer rests on the trigger or when it gets keyboard focus, closes on leave, blur or Escape (wherever the focus is), and stays while the pointer is on it (WCAG 1.4.13). The tooltip is a description, not a name: `aria-describedby` is set while it is open, so an icon-only trigger still needs its own `aria-label`. Touch does not open it. The trigger is wrapped in a `display: contents` span.

