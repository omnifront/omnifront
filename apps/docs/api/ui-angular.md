# @omnifront/ui-angular

Standalone Angular components for the UI kit (Angular 17 or newer; `@angular/forms` is a peer, because `omni-text-field` is a `ControlValueAccessor`). About 17 KB gzipped (excluding Angular and `@omnifront/ui`). See the [UI guide](/guide/ui). `createTheme`, `createColorSchemeStore`, `colorSchemeScript` and the types `Theme`, `ThemeOptions`, `ColorSchemeMode` and `SelectOption` are re-exported from [`@omnifront/ui`](/api/ui).

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

### `OmniIconButton`, `OmniFab`

```html
<button omni-icon-button aria-label="Delete" color="primary"><svg>…</svg></button>
<button omni-fab aria-label="Add"><svg>…</svg></button>
```

Attribute components on `<button>` or `<a>`. `omni-icon-button`: `color`, `size`, `edge` (`start` or `end`), `disabled`, `disableRipple`, `type`. `omni-fab`: `variant` (`circular` or `extended`), `color`, `size`, `disabled`, `disableRipple`, `type`. Both need an `aria-label`.

### `OmniButtonGroup`, `OMNI_BUTTON_GROUP`

```html
<omni-button-group label="Actions" variant="outlined"><button omni-button>One</button><button omni-button>Two</button></omni-button-group>
```

Joins buttons into one `role="group"` (named by `label`). Inputs: `variant`, `color`, `size`, `disabled`, `disableElevation`, `orientation`, `fullWidth`. Each `omni-button` inside takes these as its defaults, through the `OMNI_BUTTON_GROUP` injection token; its own input wins.

### `OmniToggleButtonGroup`, `OmniToggleButton`, `OMNI_TOGGLE_GROUP`

```html
<omni-toggle-button-group label="Format" [value]="format()" (valueChange)="format.set($any($event))">
  <button omni-toggle-button value="bold">Bold</button>
</omni-toggle-button-group>
```

Buttons that stay pressed. Group inputs: `value` / `defaultValue` (a list; with `exclusive`, one value or `null`), `exclusive`, `orientation`, `size`, `color`, `disabled`, `fullWidth`, `label`; output `valueChange`. Button inputs: `value`, `selected` (alone), `color`, `size`, `disabled`. The group is shared with its buttons through `OMNI_TOGGLE_GROUP`.

### `OmniSlider`

```html
<omni-slider aria-label="Volume" [value]="volume()" (valueChange)="volume.set($event)" valueLabelDisplay="auto" />
```

A real `<input type="range">`, so dragging, the keys, forms and screen readers are native. Inputs: `value` / `defaultValue` (a number, or with `range` a `[lower, upper]` pair; the lower thumb cannot pass the upper one, and the thumbs are named after `aria-label` with "minimum" and "maximum" added), `range`, `orientation` (`vertical` puts the smallest value at the bottom), `length` (the height of a vertical slider, default 200px), `min`, `max`, `step`, `marks` (`true` or a list of `SliderMark`: `{ value, label? }`), `valueLabelDisplay` (`auto`, `on`, `off`), `valueLabelFormat`, `getAriaValueText`, `size`, `color`, `disabled`, `name`, `aria-label`; output `valueChange`.

### `OmniRating`

```html
<omni-rating aria-label="Rating" [value]="stars()" (valueChange)="stars.set($event)" />
```

Stars made of native radios. Inputs: `value` / `defaultValue` (`0` means no rating), `max` (5), `precision` (`1`, `0.5`, `0.25`), `readOnly` (an image named "Rating: 3 out of 5"), `disabled`, `size`, `color`, `name`, `aria-label`; outputs `valueChange` and `activeChange`.

### `OmniTextField`

`<omni-text-field>`. Inputs: `label`, `helperText`, `error`, `disabled`, `required`, `readOnly`, `variant`, `size`, `color`, `fullWidth`, `multiline`, `rows`, `type`, `placeholder`, `name`, `id`, `value`, `defaultValue`. Output: `valueChange`. Works with `ngModel` and reactive forms. Projection: `[omniStartAdornment]`, `[omniEndAdornment]`.

### `OmniCheckbox`

```html
<omni-checkbox [(checked)]="accepted">Accept terms</omni-checkbox>
```

A real `<input type="checkbox">` inside a clickable `<label>`; the label is the content. Inputs: `checked`, `defaultChecked`, `indeterminate`, `labelPlacement`, `disabled`, `required`, `error`, `color`, `size`, `name`, `value`, `id`, `aria-label` (for a checkbox with no visible label). Output: `checkedChange`. Works with `ngModel` and reactive forms.

### `OmniSwitch`

```html
<omni-switch [(checked)]="wifi">Wi-Fi</omni-switch>
```

An on/off setting: a real `<input type="checkbox" role="switch">` under a track and a thumb; the label is the content. Inputs: `checked`, `defaultChecked`, `labelPlacement`, `disabled`, `required`, `error`, `color`, `size`, `name`, `value`, `id`, `aria-label` (for a switch with no visible label). Output: `checkedChange`. Works with `ngModel` and reactive forms.

### `OmniRadioGroup`

```html
<omni-radio-group label="Fruit" [(value)]="fruit"><omni-radio value="a">Apple</omni-radio></omni-radio-group>
```

A `<fieldset role="radiogroup">` with a `<legend>`. Inputs: `label`, `helperText`, `value`, `defaultValue`, `name`, `error`, `disabled`, `required`, `row`, `id`. Output: `valueChange`. Works with `ngModel` and reactive forms. `OMNI_RADIO_GROUP` is the token a radio injects.

### `OmniRadio`

One radio inside an `omni-radio-group`; the label is the content. Inputs: `value`, `disabled`, `labelPlacement`, `color`, `size`, `id`, `aria-label`.

### `OmniFormGroup`

A labelled group of related controls (a `<fieldset>` with a `<legend>`), for example several checkboxes. Inputs: `label`, `helperText`, `error`, `disabled`, `row`, `id`.

### `OmniSelect`

```html
<omni-select label="Fruit" [options]="fruits" [(value)]="fruit" />
```

Looks like a text field and opens a list of options. Inputs: `label`, `options` (a list of `SelectItem`: options, `{ value, label, disabled? }`, and `SelectGroup`s of them, `{ label, options }`), `optionTemplate` (a `TemplateRef` of `SelectOptionContext`, which has the option and `selected`, for what an option looks like in the open list: `<ng-template let-option let-selected="selected">`; the closed select and type-ahead still use the `label`), `value`, `defaultValue`, `open`, `helperText`, `error`, `disabled`, `required`, `variant`, `size`, `color`, `fullWidth`, `name` (also writes the value to a hidden `<input>`), `id`. Outputs: `valueChange`, `openChange`, and `closed` with a `SelectCloseEvent` (`{ reason, event }`; `SelectCloseReason` is `escapeKeyDown`, `outsidePress`, `tab`, `select`, `trigger` or `programmatic`). Works with `ngModel` and reactive forms. The list moves to a portal in `<body>` while it is open. The options are data, not children, so every framework shows the chosen label the same way, including on the server.

### `OmniDialog`

`<omni-dialog [(open)]="open">`. Inputs: `open`, `maxWidth` (default `sm`), `fullWidth`, `fullScreen`, `disableEscapeKeyDown`, `hideBackdrop`, `keepMounted`, `role`, `label`, `className`. Outputs: `openChange`, and `closed` with a `DialogCloseEvent` (`{ reason, event }`; `DialogCloseReason` is `escapeKeyDown`, `backdropClick`, `closeButton` or `programmatic`). The host moves to a portal in `<body>` while it is shown. Compose with the attribute directives `OmniDialogTitle` (`[omniDialogTitle]`, on an `<h2>`), `OmniDialogContent`, `OmniDialogContentText` and `OmniDialogActions`. `OMNI_DIALOG` is the token a title or text directive injects.

### `OmniMenu`

`<omni-menu [anchorEl]="button" [(open)]="open">`. Inputs: `anchorEl`, `open`, `placement` (default `bottom-start`), `autoFocus`, `keepMounted`, `label`. Outputs: `openChange`, `closed` (a `MenuCloseEvent`; `MenuCloseReason` is `escapeKeyDown`, `outsidePress`, `tab`, `select` or `programmatic`). Children: `<li omniMenuItem>` (`OmniMenuItem`: inputs `disabled`, `selected`, `dense`; listen to `(click)`) and `<li omniMenuDivider>` (`OmniMenuDivider`). `OMNI_MENU` is the token an item injects.

### `OmniTabContext`

`<omni-tab-context [(value)]="tab">`. Inputs: `value`, `defaultValue`, `orientation`, `selectionFollowsFocus`. Output: `valueChange`. Holds the selection for `OmniTabList` (`<omni-tab-list label="…">`: inputs `color`, `variant`, `centered`, `label`), `OmniTab` (`<button omni-tab value="a" label="A">`: inputs `value`, `label`, `disabled`) and `OmniTabPanel` (`<omni-tab-panel value="a">`: inputs `value`, `keepMounted`). `OMNI_TABS` is the token they inject.

### `OmniTypography`

`<h2 omni-typography variant="h5" gutterBottom>`: an attribute directive for any element; the element is your choice (an Angular template cannot pick a tag from an input, so there is no default per variant). Inputs: `variant`, `align`, `color`, `gutterBottom`, `noWrap`, `paragraph`.

### `OmniPaper`

`<div omni-paper [elevation]="4">`. Inputs: `elevation` (0 to 24, default 1), `variant` (`elevation` or `outlined`), `square`.

### `OmniCard`

`<div omni-card>`: inputs `variant`, `raised`. Parts: `OmniCardHeader` (`<div omni-card-header title="…" subheader="…">`; put `omniCardAvatar` (`OmniCardAvatar`) on the avatar and `omniCardAction` (`OmniCardAction`) on the action), `OmniCardContent` (`[omni-card-content]`), `OmniCardActions` (`[omni-card-actions]`) and `OmniCardMedia` (`<img omni-card-media src="…" alt="">`).

### `OmniDivider`

`<hr omni-divider>`, `<li omni-divider>` in a list, or `<div omni-divider>Text</div>` for text in the line (a `role="separator"` `div`). Inputs: `orientation`, `variant`, `flexItem`, `textAlign`.

### `OmniAvatar`

`<div omni-avatar src="…" alt="Ada">AB</div>`. Inputs: `variant`, `src`, `srcSet`, `alt`; the content is the fallback (initials, an icon), then a generic person.

### `OmniBadge`

`<span omni-badge [badgeContent]="4" color="primary"><svg omni-svg-icon>…</svg></span>`. Inputs: `badgeContent`, `max`, `showZero`, `variant`, `invisible`, `color`, `anchorOrigin`, `overlap`.

### `OmniSvgIcon`

`<svg omni-svg-icon fontSize="large"><path d="…" /></svg>`. Inputs: `fontSize`, `color`, `viewBox`, `titleAccess` (`role="img"` and that name; without it the icon is `aria-hidden`).

### `OmniAppBar`

`<header omni-app-bar position="static">`: inputs `position` (default `fixed`), `color`, `elevation` (default 4). `OmniToolbar` (`<div omni-toolbar>`: inputs `variant`, `disableGutters`) is the row inside it.

### `OmniList`

```html
<nav aria-label="Mailboxes">
  <ul omni-list>
    <li omni-list-subheader>Folders</li>
    <li omni-list-item disablePadding>
      <button omni-list-item-button selected><div omni-list-item-icon>…</div><div omni-list-item-text primary="Inbox" secondary="3 new"></div></button>
    </li>
  </ul>
</nav>
```

Inputs: `dense`, `disablePadding`. Parts: `OmniListItem` (`li[omni-list-item]`: `divider`, `disablePadding`, `disableGutters`; an element with `omniListItemAction` (`OmniListItemAction`) goes at the far end), `OmniListItemButton` (`button[omni-list-item-button]` or `a[...]`: `selected`, `disabled`), `OmniListItemIcon`, `OmniListItemText` (`primary`, `secondary`) and `OmniListSubheader` (`li[omni-list-subheader]`: `disableSticky`).

### `OmniTable`

`<table omni-table size="small">` with native `thead`, `tbody`, `tfoot` and `tr[omni-table-row]` (`OmniTableRow`: `hover`, `selected`), `td[omni-table-cell]` / `th[omni-table-cell]` (`OmniTableCell`: `align`, `padding`, `variant`; a `th` without `scope` gets `scope="col"`, so write `scope="row"` for a row header) and `OmniTableContainer` (`[omni-table-container]`). Inputs of `omni-table`: `size`, `stickyHeader`. A cell in `thead` or `tfoot` is styled by where it is, so no extra input is needed.

### `OmniChip`

`<div omni-chip label="React" clickable (click)="filter()" (delete)="remove()">`. Inputs: `label`, `variant`, `color`, `size`, `clickable`, `disabled`. Output: `delete`. Angular cannot tell whether a plain `(click)` is bound, so say `clickable`; a `(delete)` listener shows the delete icon (Backspace or Delete on the focused chip fires it too). An `omni-avatar` inside is shown at the start; an element with `omniChipIcon` (`OmniChipIcon`) is the icon.

### `OmniAccordion`

```html
<div omni-accordion [(expanded)]="open">
  <omni-accordion-summary>Question</omni-accordion-summary>
  <omni-accordion-details>Answer</omni-accordion-details>
</div>
```

Inputs: `expanded`, `defaultExpanded`, `disabled`. Output: `expandedChange`. `OmniAccordionSummary` (input `headingLevel`; an element with `omniExpandIcon` (`OmniExpandIcon`) replaces the chevron) and `OmniAccordionDetails`. `OMNI_ACCORDION` is the token they inject.

### `OmniTooltip`

```html
<button omni-button omniTooltip="Saves your work" tooltipPlacement="top">Save</button>
```

A directive for the element it describes (text only). Inputs: `omniTooltip` (the text; empty means no tooltip), `tooltipPlacement`, `tooltipOpen`, `tooltipEnterDelay`, `tooltipLeaveDelay`, `tooltipDisableInteractive`. Outputs: `tooltipOpened`, `tooltipClosed`. Same behaviour as React. The tooltip itself is an `OmniTooltipPanel`, created for you and moved to a portal in `<body>`; you never write it.

