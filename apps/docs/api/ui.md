# @omnifront/ui

The framework-free core of the UI kit: a Material-style theme, behaviour machines, DOM utilities and static CSS. About 8.6 KB gzipped (`@omnifront/ui/position` adds floating-ui, about 6.9 KB, and is only loaded by Menu). See the [UI guide](/guide/ui).

CSS entries: `@omnifront/ui/styles.css` (tokens, baseline and every component), or `tokens.css`, `baseline.css`, `button.css`, `text-field.css`, `dialog.css`, `menu.css`, `tabs.css` separately.

## Theme

### `createTheme`

```ts
createTheme(options?: ThemeOptions): Theme
```

Pass only what you change. `palette` (colours are completed from `main`), `colorSchemes` (`{ light, dark }` overrides for one scheme), `typography`, `spacing` (px, default 8), `breakpoints`, `shape`, `shadows`, `transitions`, `zIndex`, `direction`, `components` (`{ OmniButton: { defaultProps } }`). Both colour schemes are always built; `palette.mode` only picks which one is `theme.palette`.

The result has `palette`, `colorSchemes`, `typography`, `spacing(...factors)`, `breakpoints` (`up`, `down`, `between`, `only`), `shape`, `shadows` (25 entries), `transitions` (`create`), `zIndex`, `direction`, `components`.

### `createPalette`

`createPalette(options?)` builds one scheme's palette. `contrastThreshold` defaults to **4.5** (WCAG AA), where MUI uses 3: it only changes which colours get dark instead of white label text (light `warning` and `info`, dark `error`).

### `createTypography`

`createTypography(options?)`: the Material 2 type scale. `typographyVariants` is the list of variant names (`h1` to `h6`, `subtitle1`, `subtitle2`, `body1`, `body2`, `button`, `caption`, `overline`).

### `resolveProps`

`resolveProps(theme, name, props)`: `theme.components[name].defaultProps` under the props that were given (`undefined` counts as not given). Adapters call it for you.

### `themeToCss`

```ts
themeToCss(theme: Theme, options?: { selector?: string }): string
```

The theme as CSS custom properties (`--omni-palette-primary-main`, `--omni-spacing`, ...). The light palette and the shared tokens go on `selector` (default `:root`); the dark palette applies where the same element has `data-omni-color-scheme="dark"`, or `="system"` while the OS prefers dark. No attribute means light.

### `applyTheme`

`applyTheme(theme, element)`: set the variables (light palette) on one element.

### `COLOR_SCHEME_ATTRIBUTE`

`"data-omni-color-scheme"`. `THEME_ATTRIBUTE` is `"data-omni-theme"`, the attribute that scopes a provider's variables (portals copy it).

### `createColorSchemeStore`

```ts
createColorSchemeStore({ defaultMode?, storageKey?, target? }): Store<ColorSchemeState> & { restore(): void }
```

The user's choice (`light`, `dark`, `system`) as a normal [store](/api/store): read it with `useStore` / `injectStore`. `setMode` also writes `data-omni-color-scheme` on `target()` and saves to `localStorage` under `storageKey`. Call `restore()` after mount to apply a saved choice (hydration-safe). `ColorSchemeState` is `{ mode, setMode }`; `ColorSchemeStoreOptions` is the options type.

### `colorSchemeScript`

`colorSchemeScript({ storageKey, defaultMode? })` returns a small script for an inline `<script>` in `<head>`: it sets the attribute on `<html>` before the first paint.

### Colour helpers

`alpha` (`alpha(color, opacity)`), `darken` and `lighten` (`(color, coefficient)`), `getLuminance` (`(color)`) and `getContrastRatio` (`(a, b)`, 1 to 21): for `#hex`, `rgb()` and `rgba()` strings.

## Machines

A machine is a `Subscribable` (ADR-0001) for one interactive component. `setProps(props)` feeds it the latest props (controlled or not); `connect()` returns a `Part` (`{ attrs, on }`) for each element; `attach(...)` runs the DOM side (focus, scroll lock, positioning) after mount and returns its cleanup; `dispose()` stops timers.

### `Machine`

The base class: `subscribe`, `getSnapshot`, `getServerSnapshot`, `setProps(props, { silent? })`, `flush()` (tell listeners about a silent update), `dispose()`. `OpenMachine` adds open, closing and closed handling (with an exit delay on the injectable scheduler) for Dialog and Menu: `show()`, `hide(reason, event)`, `toggle()`. `OpenProps` / `OpenState` are its props and state types, `CloseReason` the reason union (`escapeKeyDown`, `backdropClick`, `outsidePress`, `select`, `tab`, `closeButton`, `trigger`, `programmatic`).

### `part`

`part(attrs?, on?)` builds a `Part`. `Attrs` is its attribute map (DOM names; `aria-*` and `data-*` are strings, real boolean attributes are booleans) and `Handlers` maps lowercase DOM event names to handlers. Adapters turn a `Part` into props (`class` to `className`, `keydown` to `onKeyDown`, ...).

### `createDialog`

`createDialog(props): Dialog`. Props (`DialogProps`): `id`, `open` / `defaultOpen` / `onOpenChange(open, reason, event)`, `role`, `label`, `closeOnEscape`, `closeOnBackdropClick`, `modal`, `exitDuration` (default 195 ms), `scheduler`. State (`DialogState`): `open`, `mounted`, `status`, `id`. `connect()` gives `DialogParts` (`container`, `backdrop`, `content`, `title`, `description`, `closeTrigger`). `attach({ content, container })` (`DialogElements`) moves focus in, traps it, locks scroll, hides the rest of the page from screen readers and restores everything on cleanup. `Dialog` is the class it returns.

### `createMenu`

`createMenu(props): Menu` (`Menu` is the class). Props (`MenuProps`): the open props plus `id` and `autoFocus`; `exitDuration` defaults to 120 ms. State (`MenuState`): `open`, `mounted`, `status`, `id`. `connect()` returns `trigger`, `content` and `separator`; `item(options)` (`MenuItemOptions`: `disabled`, `closeOnSelect`, `onSelect`) returns one item's part. `attach({ content, anchor, position })` (`MenuElements`) focuses the first item and closes on a press outside; pass `autoPosition` as `position`. Arrow keys, Home, End and type-ahead move real focus; Enter and Space click the item; Escape and Tab close.

### `createTabs`

`createTabs(props): Tabs` (`Tabs` is the class). Props (`TabsProps`): `id`, `value` / `defaultValue` / `onValueChange(value, event)`, `orientation`, `selectionFollowsFocus`. State (`TabsState`): `id`, `value`, `orientation`. `connect()` returns `root` and `list`; `tab(value, options)` (`TabOptions`) and `panel(value)` return per-tab parts; `select(value)`; `attach(listElement)` keeps the indicator variables `--omni-tabs-indicator-start` and `--omni-tabs-indicator-size` up to date.

### `createSelect`

`createSelect(props): Select` (`Select` is the class): a select, that is a `combobox` that opens a `listbox`. Props (`SelectProps`): `id`, `options` (a list of `SelectOption`: `{ value, label, disabled? }`), `value` / `defaultValue` / `onValueChange(value, event)`, `open` / `defaultOpen` / `onOpenChange(open, reason, event)`, `disabled`, `exitDuration` (default 120 ms). Use the same `id` as the field machine so the label links up. `""` as a value means nothing is selected. State (`SelectState`): `open`, `mounted`, `status`, `id`, `value`, `label` (the selected option's label, or `""`), `filled`, `disabled`.

`connect()` returns `trigger` and `listbox`. The trigger carries `role="combobox"`, `aria-expanded`, `aria-controls` and `aria-labelledby` (the label, then its own text), and opens on click, Enter, Space and the arrows. `option(option)` returns one option's part (`role="option"`, `aria-selected`, click chooses). `choose(value)` chooses and closes. `attach({ content, trigger, position })` (`SelectElements`) focuses the selected option (else the first), closes on a press outside, and gives focus back to the trigger. In the list the arrows, Home, End and type-ahead move real focus, Enter and Space choose, Escape and Tab close.

### `mergeParts`

`mergeParts(...parts): Part`: combine parts for one element (a select's trigger is both a field control and a combobox). Later attributes win; handlers for the same event all run, in order.

### `createCheckbox`

`createCheckbox(props): Checkbox` (`Checkbox` is the class): the state of a checkbox. The control is a real `<input type="checkbox">`, so the keyboard, focus, forms and assistive technology are the browser's own; the machine decides what is checked and what to tell the listener. Props (`CheckboxProps`): `id`, `checked` / `defaultChecked` / `onCheckedChange(checked, event)`, `indeterminate`, `disabled`, `required`, `error`. State (`CheckboxState`): `id`, `checked`, `indeterminate`, `disabled`. `connect()` returns `input` (the input's attributes and `change` handler); `change(checked)` is what the handler calls. `indeterminate` has no HTML attribute: set `input.indeterminate = state.indeterminate` after every render. `role: "switch"` makes the same native checkbox a switch for assistive technology (the Switch component uses it).

### `createRadioGroup`

`createRadioGroup(props): RadioGroup` (`RadioGroup` is the class): a group of radios, one value chosen at a time. Each radio is a real `<input type="radio">` with the group's `name`, so arrow keys moving the choice and Tab leaving the group are the browser's own. Props (`RadioGroupProps`): `id`, `name` (defaults to `id`), `value` / `defaultValue` / `onValueChange(value, event)`, `disabled`, `required`, `error`, `hasLabel`, `hasHelper`, `row`. State (`RadioGroupState`): `id`, `name`, `value`, `disabled`. `connect()` returns the group's `group`, `label`, `items` and `helper` parts (see `formGroupParts`); `radio(value, options)` (`RadioOptions`: `disabled`) returns one radio's input part; `choose(value)` is what its `change` handler calls.

### `formGroupParts`

`formGroupParts(options: FormGroupOptions): { group, label, items, helper }`: attributes for a `<fieldset>` with a `<legend>` label and helper text (a group of related controls). `FormGroupOptions`: `id`, `role` (`group` or `radiogroup`), `hasLabel`, `hasHelper`, `error`, `disabled`, `row`. No state of its own, so it is a function, not a machine.

### `createField`

`createField(props): Field` (`Field` is the class): the state of a text field. Props (`FieldProps`): `id`, `disabled`, `error`, `required`, `readOnly`, `filled`, `defaultFilled`, `alwaysShrink`, `hasHelper`. State (`FieldState`): `focused`, `filled`, `shrink`, and the flags. `connect()` returns `root`, `label`, `input`, `helper` and `fieldset`, and `trigger`: the state for a control that is not an `<input>` (a select's combobox).

### `buttonPart`

`buttonPart(options?: ButtonOptions): Part`: attributes for a Button (a button has no state of its own, so there is no machine). `ButtonVariant` is `text`, `outlined` or `contained`; `ButtonColor` is `inherit`, `primary`, `secondary`, `success`, `error`, `info` or `warning`; `ButtonSize` is `small`, `medium` or `large`. `ButtonOptions` also takes `fullWidth`, `disableElevation`, `disabled`, `loading`, `as` and `type`.

## DOM utilities

Browser only; call them after mount.

| | |
|---|---|
| `createIdGenerator` | `(prefix?)`: a counter-based id source for frameworks with no `useId`. |
| `getTabbables` | `(root)`: the elements Tab can reach inside `root`, in order. |
| `focusInside` | `(root)`: focus `[autofocus]`, else the first tabbable, else `root`. |
| `trapFocus` | `(root, isActive?)`: keep Tab and focus inside `root`. Returns the cleanup. |
| `lockScroll` | `(document?)`: counted page scroll lock. Returns the release function. |
| `pushLayer` | `()`: register an open overlay; `isTop()` says whether it is the top-most. `Layer` is the result type. |
| `hideOthers` | `(keep)`: `aria-hidden` on every other top-level element. Returns the cleanup. |
| `createPortalRoot` | `(attributes?)`: a `div[data-omni-portal]` at the end of `<body>`. `PortalRoot` is the result type. |
| `attachRipple` | `(element, { centered? })`: the Material touch ripple. Returns the cleanup. |

## Positioning

`@omnifront/ui/position`:

### `autoPosition`

```ts
autoPosition(anchor: Element, floating: HTMLElement, options?: PositionOptions): () => void
```

Place `floating` next to `anchor` with floating-ui (flip, shift, `position: fixed`) and keep it there while the page scrolls or resizes. `PositionOptions`: `placement` (a floating-ui `Placement`, default `bottom-start`), `offset`, `matchWidth`. Returns the cleanup.

## Types

| | |
|---|---|
| `Theme`, `ThemeOptions` | The theme and what `createTheme` accepts. |
| `Palette`, `PaletteColor`, `PaletteColorOptions`, `PaletteOptions`, `PaletteMode` | Palette types; `PaletteMode` is `light` or `dark`. |
| `ColorSchemeMode` | `light`, `dark` or `system`. |
| `Typography`, `TypographyOptions`, `TypographyStyle`, `TypographyVariant` | Type scale types. |
| `Breakpoints`, `BreakpointKey` | Breakpoint helpers; keys are `xs`, `sm`, `md`, `lg`, `xl`. |
| `Transitions`, `ZIndex`, `ComponentsOptions` | The rest of the theme's parts. |
| `ThemeToCssOptions` | Options of `themeToCss`. |
