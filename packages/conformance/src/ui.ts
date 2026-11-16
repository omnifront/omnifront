import axe from "axe-core"
import { afterEach, describe, expect, it } from "vitest"

/**
 * UI conformance: every framework's components must produce the same DOM and behave the same for
 * the same scenario. The suite only touches the DOM (roles, aria attributes, real events), so it
 * has no framework in it; each adapter says how to mount a scenario.
 */

export interface UiHandle {
	/** Change the scenario's props (same names as the options it was mounted with). */
	set(props: Record<string, unknown>): Promise<void>
	unmount(): void
}

export interface UiHarness {
	/** `<Button>Save</Button>`. Logs `click` when clicked. */
	button(props: { variant?: string; color?: string; loading?: boolean; disabled?: boolean; href?: string }, log: (event: string) => void): UiHandle
	/** A TextField labelled "Email" with helper text "We never share it". Logs `change:<value>`. */
	textField(props: { error?: boolean; value?: string; disabled?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A "Open" button and a Dialog titled "Delete project?" with text "This cannot be undone." and
	 * buttons "Cancel" and "Delete". The "Open" button opens it; closing is controlled by the host:
	 * on a close request it logs `close:<reason>` and closes.
	 */
	dialog(props: Record<string, never>, log: (event: string) => void): UiHandle
	/**
	 * A "Menu" button (id `menu-button`) and a Menu anchored to it with items "Profile", "Billing"
	 * (disabled) and "Logout". The button opens it. Logs `select:<item>`; on a close request logs
	 * `close:<reason>` and closes.
	 */
	menu(props: Record<string, never>, log: (event: string) => void): UiHandle
	/**
	 * A Checkbox labelled "Accept terms", checked state held by the host (starts unchecked). Logs
	 * `change:<true|false>`.
	 */
	checkbox(props: { indeterminate?: boolean; disabled?: boolean; error?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * An IconButton (aria-label "Delete"), a Fab (aria-label "Add") and an extended Fab ("Create").
	 * Logs `click:delete`, `click:add` and `click:create`. `disabled` disables all three.
	 */
	iconButtons(props: { disabled?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A ButtonGroup (aria-label "Actions", variant outlined, colour secondary, size small) with
	 * Buttons "One" and "Two"; `disabled` is set on the group. Logs `click:one` and `click:two`.
	 */
	buttonGroup(props: { disabled?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A ToggleButtonGroup (aria-label "Format") with "Bold", "Italic" and "Underline" (disabled);
	 * the pressed values are held by the host (start empty). `exclusive` allows one at a time.
	 * Logs `change:<values joined with ",">`.
	 */
	toggleGroup(props: { exclusive?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A Slider (aria-label "Volume", 0 to 100, step 10, value label on hover and focus) whose value is
	 * held by the host (starts at 30). Logs `change:<number>`.
	 */
	slider(props: { disabled?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A range Slider (two thumbs, aria-label "Price", 0 to 100, step 10, value labels always on) whose
	 * `[lower, upper]` is held by the host (starts at 20 and 80). Logs `change:<lower>,<upper>`. With
	 * `vertical` (set at mount) it is vertical.
	 */
	rangeSlider(props: { vertical?: boolean; disabled?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A Rating (aria-label "Rating", 5 stars, whole steps) whose value is held by the host (starts at
	 * 0). `readOnly` makes it show 3. Logs `change:<number>`.
	 */
	rating(props: { readOnly?: boolean; disabled?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A Switch labelled "Wi-Fi", on/off state held by the host (starts off). Logs
	 * `change:<true|false>`.
	 */
	switch(props: { disabled?: boolean; error?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A RadioGroup labelled "Fruit" with helper text "Pick one" and radios "Apple" (value a),
	 * "Banana" (value b, disabled) and "Cherry" (value c); the chosen value is held by the host
	 * (starts empty). Logs `change:<value>`.
	 */
	radioGroup(props: { disabled?: boolean; error?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A Select labelled "Fruit" with options "Apple", "Banana" (disabled) and "Cherry", helper text
	 * "Pick one", chosen value held by the host (starts empty). Logs `change:<value>`, and
	 * `close:<reason>` when the list closes. With `multiple` (set at mount) the value is a list
	 * (starts empty) and `change:` logs the values joined with ",".
	 */
	select(props: { error?: boolean; disabled?: boolean; multiple?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A Select labelled "Food" with two groups: "Fruit" (options "Apple" value `a`, "Banana" value `b`,
	 * disabled) and "Vegetables" ("Carrot" value `c`, "Daikon" value `d`). Each option in the open list
	 * is drawn with custom content: `<span data-rich>{label}</span><small>{value}</small>`. Chosen value
	 * held by the host (starts empty). Logs `change:<value>` and `close:<reason>`.
	 */
	selectGroups(props: Record<string, never>, log: (event: string) => void): UiHandle
	/**
	 * Tabs labelled "Sections": "One", "Two" (disabled), "Three", with panels "First panel",
	 * "Second panel", "Third panel", controlled by the host. Logs `change:<value>`.
	 */
	tabs(props: { selectionFollowsFocus?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * Surfaces, in this order: an AppBar (position static, colour primary) holding a Toolbar with a
	 * `h1` Typography (variant h6) "Dashboard"; a `p` Typography "Plain text"; a Paper (elevation 3)
	 * with "Paper text"; a Card (`raised` from props) with a CardHeader (title "Card title", subheader
	 * "Card subheader", an Avatar "A"), CardContent "Card body" and CardActions with a "Share" button
	 * (logs `click:share`); an `hr` Divider; and a Divider with the text "Or".
	 */
	surfaces(props: { raised?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * In this order: an Avatar "AB" (initials); an Avatar (variant rounded) with `src` "/missing.png"
	 * and alt "Ada" (its picture will fail to load); an Avatar with nothing in it; a Badge with
	 * `badgeContent` from props (`count`, starts 4) around an SvgIcon (titleAccess "Mail"); a dot Badge
	 * around a decorative SvgIcon; and a Badge with `badgeContent` 7 and `max` 5.
	 */
	badges(props: { count?: number }, log: (event: string) => void): UiHandle
	/**
	 * A `nav` labelled "Mailboxes" holding a List (a `ul`) with: a ListSubheader "Folders"; a ListItem (no padding) holding a
	 * selected ListItemButton with an icon, primary "Inbox", secondary "3 new" (logs `click:inbox`);
	 * a disabled ListItemButton "Trash" (logs `click:trash`); a ListItem "Drafts" with a divider and
	 * a secondary action IconButton (aria-label "Delete drafts", logs `click:delete`); and a Divider
	 * as `li`. `dense` comes from props.
	 */
	list(props: { dense?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A TableContainer with a Table (aria-label "Desserts", `size` from props) whose head has a row
	 * with "Dessert" and a right-aligned "Calories"; whose body has two rows, the first `selected` and
	 * `hover`: "Frozen yoghurt" (a row header: `th` scope "row") with 159, and "Ice cream" with 237;
	 * and whose footer has "Total" and 396.
	 */
	table(props: { size?: "small" | "medium" }, log: (event: string) => void): UiHandle
	/**
	 * Four Chips: "Static" (nothing), "Clickable" (logs `click:clickable`), "Deletable" (logs
	 * `delete:deletable`; its parent also reacts to the keyboard), and "Outlined" (variant outlined,
	 * colour primary, size small). `disabled` disables the clickable and the deletable one.
	 */
	chips(props: { disabled?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * Two Accordions. "First" (summary "First question", details "First answer") is uncontrolled and
	 * starts closed; it logs `first:<true|false>`. "Second" (summary "Second question", details "Second
	 * answer") is controlled by the host (starts closed) and logs `second:<true|false>`. `disabled`
	 * disables the second.
	 */
	accordions(props: { disabled?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A "Save" button with a Tooltip saying "Saves your work" (placement top, enterDelay 0, leaveDelay 50).
	 * Logs `open` and `close`. `title` can be changed (`""` turns the tooltip off), and `arrow` adds
	 * the pointer. A finger needs 30ms to open it and it closes 30ms after (enterTouchDelay and leaveTouchDelay).
	 */
	tooltip(props: { title?: string; arrow?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * Five Alerts, in this order: severity error with an AlertTitle "Upload failed" and the text "The
	 * file is too big."; one with no severity and the text "Saved"; severity info, variant filled,
	 * "Heads up"; severity warning, variant outlined, no icon, `onClose` (logs `close:warning`),
	 * "Careful"; severity success with an `action` Button "Undo" (logs `click:undo`), "Done".
	 */
	alerts(props: Record<string, never>, log: (event: string) => void): UiHandle
	/**
	 * A "Show" button and a Snackbar (message "Saved", `action` Button "Undo" logging `click:undo`) that
	 * opens on it; `autoHideDuration` comes from props. On a close request it logs `close:<reason>` and closes.
	 */
	snackbar(props: { autoHideDuration?: number }, log: (event: string) => void): UiHandle
	/**
	 * In this order: a CircularProgress (aria-label "Loading"); a CircularProgress with `value` from
	 * props (starts 40, aria-label "Upload"); a LinearProgress determinate with `value` (aria-label
	 * "Progress"); a LinearProgress buffer (value 30, valueBuffer 60, aria-label "Buffering"); an
	 * indeterminate LinearProgress (aria-label "Working"); Skeletons: text, circular (width 40) and
	 * rectangular (width 200, height 60, animation false); and a Backdrop whose `open` comes from props
	 * (starts true) and that logs `click:backdrop`.
	 */
	progress(props: { value?: number; open?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * An "Open" button and a Drawer (aria-label "Navigation"; `variant` and `anchor` are set at mount)
	 * holding a nav-less List with ListItemButtons "Home" and "Settings". The button opens it. On a
	 * close request it logs `close:<reason>` and closes.
	 */
	drawer(props: { variant?: "temporary" | "persistent" | "permanent"; anchor?: "start" | "end" | "top" | "bottom" }, log: (event: string) => void): UiHandle
	/**
	 * A "Filters" button (id `popover-button`) and a Popover anchored to it (aria-label "Filter
	 * options") holding the text "Filter options" and a button "Apply" (logs `click:apply`). The button
	 * opens it. On a close request it logs `close:<reason>` and closes.
	 */
	popover(props: Record<string, never>, log: (event: string) => void): UiHandle
	/**
	 * A Breadcrumbs (`maxItems` from props, default 8) with Links "Home" (href /), "Library", "Data",
	 * "Reports", "2026" and then the plain text "Current"; and a Link "Docs" (href /docs, underline
	 * hover, colour secondary).
	 */
	breadcrumbs(props: { maxItems?: number }, log: (event: string) => void): UiHandle
	/**
	 * A Pagination (aria-label "Results", `count` from props, default 10, first and last buttons,
	 * `disabled` from props) whose page is held by the host (starts 1; logs `change:<page>`); and an
	 * uncontrolled outlined small one (aria-label "Uncontrolled", count 5, defaultPage 3; logs
	 * `uncontrolled:<page>`).
	 */
	pagination(props: { count?: number; disabled?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A Stepper (aria-label "Checkout", `activeStep` from props, starts 1) with Steps "Cart" (`onClick`
	 * logs `click:cart`), "Address" (optional "Optional"), "Payment" and "Done"; and a vertical Stepper
	 * (aria-label "Build steps", activeStep 0) with Steps "Plan" (content "Plan details") and "Build"
	 * (content "Build details").
	 */
	stepper(props: { activeStep?: number }, log: (event: string) => void): UiHandle
	/**
	 * A BottomNavigation (aria-label "Main", `showLabels` from props) with actions "Recents" (value
	 * recents), "Favorites" (favorites) and "Nearby" (nearby, disabled), each with an svg icon. The
	 * value is held by the host (starts recents). Logs `change:<value>`.
	 */
	bottomNavigation(props: { showLabels?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A SpeedDial (ariaLabel "Actions") with SpeedDialActions "Copy", "Save" and "Print" (each with an
	 * svg icon). Logs `click:copy`, `click:save` and `click:print`.
	 */
	speedDial(props: Record<string, never>, log: (event: string) => void): UiHandle
	/**
	 * A Table (aria-label "Desserts") whose head has TableSortLabels "Name" and "Calories" (sorted by
	 * Name ascending to begin with; a click on a label logs `sort:<name|calories>`, and the host sorts
	 * by it ascending, or flips the direction when it is the sorted one); whose body has two rows; and
	 * whose footer has a TablePagination (count 23, page 0 and 10 rows per page to begin with, options
	 * 5, 10 and 25) that logs `page:<n>` and `rows:<n>` (the host then goes back to page 0).
	 */
	sortableTable(props: Record<string, never>, log: (event: string) => void): UiHandle
	/**
	 * Two Cards. The first holds a CardActionArea (a button, logs `click:area`) with CardContent "Action
	 * card"; the second a CardActionArea with href /card and CardContent "Link card". Then an AvatarGroup
	 * (max 3) of Avatars A to E; an AvatarGroup (max 3, total 6) of Avatars A and B; and a List with a
	 * ListItem (alignItems flex-start) holding a ListItemAvatar with an Avatar "R" and a ListItemText
	 * (primary "Brunch", secondary "Ali Connors"), and a ListItem (no padding) holding a ListItemButton
	 * (alignItems flex-start) with a ListItemAvatar (Avatar "S") and a ListItemText (primary "Summer BBQ").
	 */
	cardsAndLists(props: Record<string, never>, log: (event: string) => void): UiHandle
	/**
	 * An AccordionGroup (`multiple` set at mount, starting with "a" open, uncontrolled) of three
	 * Accordions, values a, b, c, with summaries "Alpha", "Beta", "Gamma" and details "Alpha body", "Beta
	 * body", "Gamma body". Logs `change:<open values joined with ",">` (empty for none).
	 */
	accordionGroup(props: { multiple?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * A Chip "Custom delete" with `onDelete` (logs `delete:custom`) and a custom delete icon: an
	 * `<svg data-custom-delete>`.
	 */
	chipDeleteIcon(props: Record<string, never>, log: (event: string) => void): UiHandle
	/**
	 * A "Info" button with a Tooltip (enterDelay 0, leaveDelay 0) whose content is rich: a
	 * `<strong data-rich>Rich</strong>` followed by " content". Logs `open` and `close`.
	 */
	richTooltip(props: Record<string, never>, log: (event: string) => void): UiHandle
	/** Wait until the framework has applied pending updates and effects. */
	settle(): Promise<void>
}

const $ = <T extends Element = HTMLElement>(selector: string): T => document.querySelector(selector) as T
const $$ = <T extends Element = HTMLElement>(selector: string): T[] => Array.from(document.querySelectorAll<T>(selector))
const byText = (selector: string, text: string): HTMLElement =>
	$$(selector).find((el) => el.textContent?.trim() === text) as HTMLElement
const keydown = (el: Element, key: string): void => void el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }))
const pointerdown = (el: Element): void => void el.dispatchEvent(new Event("pointerdown", { bubbles: true }))
/** A pointer arriving: `pointerover` too, because React builds its enter and leave events from over and out. */
const pointerEnter = (el: Element): void => {
	el.dispatchEvent(new Event("pointerover", { bubbles: true }))
	el.dispatchEvent(new Event("pointerenter"))
}
const pointerLeave = (el: Element): void => {
	el.dispatchEvent(new Event("pointerout", { bubbles: true }))
	el.dispatchEvent(new Event("pointerleave"))
}
function type(input: HTMLInputElement, value: string): void {
	// The native setter, so frameworks that track the value (React) still see a change.
	Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value)
	input.dispatchEvent(new Event("input", { bubbles: true }))
}

/**
 * Run axe-core on the page and fail with a readable list of violations. Colour contrast is off:
 * it needs real layout and paint, which the DOM emulation used in these tests does not have. The
 * `region` rule is off too: it is about whole pages having landmarks, not about components.
 */
async function expectAccessible(label: string): Promise<void> {
	const result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } })
	const summary = result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`)
	expect(summary, `axe violations for ${label}`).toEqual([])
}

export function defineUiConformanceSuite(adapterName: string, h: UiHarness): void {
	describe(`${adapterName}: ui conformance`, () => {
		let events: string[] = []
		let handles: UiHandle[] = []
		const log = (event: string): void => void events.push(event)
		const mount = <T extends UiHandle>(handle: T): T => {
			handles.push(handle)
			return handle
		}
		afterEach(async () => {
			for (const handle of handles) handle.unmount()
			await h.settle()
			events = []
			handles = []
			document.body.innerHTML = ""
			document.body.removeAttribute("style")
		})

		describe("Button", () => {
			it("is a native button with the Material look as data attributes", async () => {
				mount(h.button({ variant: "contained", color: "error" }, log))
				await h.settle()
				const button = $("button")
				expect(button.className).toContain("omni-button")
				expect(button.dataset).toMatchObject({ variant: "contained", color: "error", size: "medium" })
				expect(button.getAttribute("type")).toBe("button")
				button.click()
				expect(events).toEqual(["click"])
			})

			it("a disabled button is disabled and ignores clicks", async () => {
				mount(h.button({ disabled: true }, log))
				await h.settle()
				const button = $<HTMLButtonElement>("button")
				expect(button.disabled).toBe(true)
				button.click()
				expect(events).toEqual([])
			})

			it("loading keeps the button focusable, marks it aria-disabled and swallows clicks, then recovers", async () => {
				const handle = mount(h.button({ loading: true }, log))
				await h.settle()
				const button = $<HTMLButtonElement>("button")
				expect(button.disabled).toBe(false)
				expect(button.getAttribute("aria-disabled")).toBe("true")
				expect(button.hasAttribute("data-loading")).toBe(true)
				button.click()
				expect(events).toEqual([])
				await handle.set({ loading: false })
				await h.settle()
				expect($("button").getAttribute("aria-disabled")).toBeNull()
				$("button").click()
				expect(events).toEqual(["click"])
			})

			it("with an href it is a link with role=button, and leaves the Tab order when disabled", async () => {
				const handle = mount(h.button({ href: "/docs" }, log))
				await h.settle()
				const link = $("a")
				expect(link.getAttribute("role")).toBe("button")
				expect(link.getAttribute("href")).toBe("/docs")
				await handle.set({ disabled: true })
				await h.settle()
				expect($("a").getAttribute("aria-disabled")).toBe("true")
				expect($("a").getAttribute("tabindex")).toBe("-1")
			})

			it("ripples under the pointer", async () => {
				mount(h.button({}, log))
				await h.settle()
				const button = $("button")
				button.dispatchEvent(Object.assign(new Event("pointerdown", { bubbles: true }), { button: 0, clientX: 4, clientY: 4 }))
				expect(button.querySelector(".omni-ripple")).not.toBeNull()
			})
		})

		describe("TextField", () => {
			it("ties the label, the input and the helper text together", async () => {
				mount(h.textField({}, log))
				await h.settle()
				const input = $<HTMLInputElement>("input")
				const label = $("label")
				expect(label.getAttribute("for")).toBe(input.id)
				expect(label.textContent).toContain("Email")
				const helper = $(".omni-text-field__helper")
				expect(input.getAttribute("aria-describedby")).toBe(helper.id)
				expect(helper.textContent).toBe("We never share it")
				expect(input.getAttribute("aria-invalid")).toBeNull()
			})

			it("floats the label while focused or filled, and reports typing", async () => {
				mount(h.textField({}, log))
				await h.settle()
				const input = $<HTMLInputElement>("input")
				const root = $(".omni-text-field")
				expect(root.hasAttribute("data-shrink")).toBe(false)
				input.focus()
				await h.settle()
				expect(root.hasAttribute("data-focused")).toBe(true)
				expect(root.hasAttribute("data-shrink")).toBe(true)
				input.blur()
				await h.settle()
				expect(root.hasAttribute("data-shrink")).toBe(false)
				type(input, "ada")
				await h.settle()
				expect(events).toContain("change:ada")
				expect(root.hasAttribute("data-filled")).toBe(true)
				expect(root.hasAttribute("data-shrink")).toBe(true)
			})

			it("error and disabled show up for assistive technology and in data attributes", async () => {
				const handle = mount(h.textField({}, log))
				await h.settle()
				await handle.set({ error: true, disabled: true })
				await h.settle()
				const input = $<HTMLInputElement>("input")
				expect(input.getAttribute("aria-invalid")).toBe("true")
				expect(input.disabled).toBe(true)
				const root = $(".omni-text-field")
				expect(root.hasAttribute("data-error")).toBe(true)
				expect(root.hasAttribute("data-disabled")).toBe(true)
			})

			it("an outlined field has a notch (legend) with the label's text", async () => {
				mount(h.textField({}, log))
				await h.settle()
				expect($(".omni-text-field").dataset["variant"]).toBe("outlined")
				expect($(".omni-text-field__legend span").textContent).toBe("Email")
			})
		})

		describe("Checkbox", () => {
			const checkbox = (): HTMLInputElement => $<HTMLInputElement>('input[type="checkbox"]')

			it("is a native checkbox, named by its label, whose label is clickable", async () => {
				mount(h.checkbox({}, log))
				await h.settle()
				expect(checkbox().checked).toBe(false)
				expect(checkbox().closest("label")?.textContent?.trim()).toBe("Accept terms")
				expect(checkbox().closest("label")?.dataset).toMatchObject({ size: "medium", color: "primary" })
				byText(".omni-checkbox__label", "Accept terms").click() // the text, not the input
				await h.settle()
				expect(events).toEqual(["change:true"])
				expect(checkbox().checked).toBe(true)
				checkbox().click()
				await h.settle()
				expect(events).toEqual(["change:true", "change:false"])
				expect(checkbox().checked).toBe(false)
			})

			it("indeterminate is set on the input, and a click makes it checked", async () => {
				const handle = mount(h.checkbox({ indeterminate: true }, log))
				await h.settle()
				expect(checkbox().indeterminate).toBe(true)
				checkbox().click()
				await h.settle()
				expect(events).toEqual(["change:true"])
				await handle.set({ indeterminate: false })
				await h.settle()
				expect(checkbox().indeterminate).toBe(false)
			})

			it("disabled is really disabled; error is exposed", async () => {
				const handle = mount(h.checkbox({ disabled: true }, log))
				await h.settle()
				expect(checkbox().disabled).toBe(true)
				expect(checkbox().closest("label")?.hasAttribute("data-disabled")).toBe(true)
				await handle.set({ disabled: false, error: true })
				await h.settle()
				expect(checkbox().getAttribute("aria-invalid")).toBe("true")
				expect(checkbox().closest("label")?.hasAttribute("data-error")).toBe(true)
			})
		})

		describe("IconButton, Fab and ButtonGroup", () => {
			it("an icon button and a fab are native buttons named by their aria-label, and click", async () => {
				mount(h.iconButtons({}, log))
				await h.settle()
				const del = $('button[aria-label="Delete"]')
				expect(del.className).toContain("omni-icon-button")
				expect($('button[aria-label="Add"]').dataset).toMatchObject({ variant: "circular", color: "primary", size: "large" })
				expect(byText("button", "Create").dataset).toMatchObject({ variant: "extended" })
				del.click()
				$('button[aria-label="Add"]').click()
				byText("button", "Create").click()
				expect(events).toEqual(["click:delete", "click:add", "click:create"])
			})

			it("disabled disables them; a ripple starts under a press", async () => {
				const handle = mount(h.iconButtons({}, log))
				await h.settle()
				$('button[aria-label="Delete"]').dispatchEvent(Object.assign(new Event("pointerdown", { bubbles: true }), { button: 0, clientX: 2, clientY: 2 }))
				expect($('button[aria-label="Delete"] .omni-ripple')).not.toBeNull()
				await handle.set({ disabled: true })
				await h.settle()
				expect($$<HTMLButtonElement>("button").every((b) => b.disabled)).toBe(true)
			})

			it("a button group is a labelled group whose buttons take its variant, colour and size, and follow its disabled", async () => {
				const handle = mount(h.buttonGroup({}, log))
				await h.settle()
				const group = $('[role="group"]')
				expect(group.getAttribute("aria-label")).toBe("Actions")
				expect(group.className).toContain("omni-button-group")
				expect(byText("button", "One").dataset).toMatchObject({ variant: "outlined", color: "secondary", size: "small" })
				byText("button", "Two").click()
				expect(events).toEqual(["click:two"])
				await handle.set({ disabled: true })
				await h.settle()
				expect($$<HTMLButtonElement>("button").every((b) => b.disabled)).toBe(true)
			})
		})

		describe("ToggleButtonGroup", () => {
			const pressed = (): string[] => $$("button").filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent?.trim() as string)

			it("is a labelled group of buttons with aria-pressed; several can be pressed", async () => {
				mount(h.toggleGroup({}, log))
				await h.settle()
				expect($('[role="group"]').getAttribute("aria-label")).toBe("Format")
				expect($$("button").map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "false", "false"])
				byText("button", "Bold").click()
				await h.settle()
				byText("button", "Italic").click()
				await h.settle()
				expect(pressed()).toEqual(["Bold", "Italic"])
				expect(events).toEqual(["change:bold", "change:bold,italic"])
				byText("button", "Bold").click()
				await h.settle()
				expect(pressed()).toEqual(["Italic"])
				expect(byText("button", "Underline").hasAttribute("disabled")).toBe(true)
			})

			it("exclusive: one at a time, and pressing it again unpresses it", async () => {
				mount(h.toggleGroup({ exclusive: true }, log))
				await h.settle()
				byText("button", "Bold").click()
				await h.settle()
				byText("button", "Italic").click()
				await h.settle()
				expect(pressed()).toEqual(["Italic"])
				byText("button", "Italic").click()
				await h.settle()
				expect(pressed()).toEqual([])
				expect(events).toEqual(["change:bold", "change:italic", "change:"])
			})
		})

		describe("Slider", () => {
			const range = (): HTMLInputElement => $<HTMLInputElement>('input[type="range"]')
			const move = (value: string): void => {
				Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(range(), value)
				range().dispatchEvent(new Event("input", { bubbles: true }))
			}

			it("is a native range input named by its aria-label, with its range, step and value", async () => {
				mount(h.slider({}, log))
				await h.settle()
				expect(range().getAttribute("aria-label")).toBe("Volume")
				expect([range().min, range().max, range().step, range().value]).toEqual(["0", "100", "10", "30"])
				expect($(".omni-slider").dataset).toMatchObject({ size: "medium", color: "primary", label: "auto" })
				expect($(".omni-slider__label").textContent).toBe("30")
			})

			it("moving it reports the value on a step, updates the label and the thumb position", async () => {
				mount(h.slider({}, log))
				await h.settle()
				move("47")
				await h.settle()
				expect(events).toEqual(["change:50"])
				expect(range().value).toBe("50")
				expect($(".omni-slider__label").textContent).toBe("50")
				expect($(".omni-slider").getAttribute("style")).toContain("--omni-slider-percent: 50")
			})

			it("disabled is really disabled", async () => {
				mount(h.slider({ disabled: true }, log))
				await h.settle()
				expect(range().disabled).toBe(true)
				expect($(".omni-slider").hasAttribute("data-disabled")).toBe(true)
			})

			describe("range (two thumbs)", () => {
				const thumbs = (): HTMLInputElement[] => $$<HTMLInputElement>('input[type="range"]')
				const moveThumb = (index: number, value: string): void => {
					const input = thumbs()[index] as HTMLInputElement
					Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value)
					input.dispatchEvent(new Event("input", { bubbles: true }))
				}

				it("two native range inputs, each named, with the lower and upper value, and a drawn rail", async () => {
					mount(h.rangeSlider({}, log))
					await h.settle()
					expect(thumbs().map((t) => t.getAttribute("aria-label"))).toEqual(["Price minimum", "Price maximum"])
					expect(thumbs().map((t) => t.value)).toEqual(["20", "80"])
					expect(thumbs().every((t) => t.min === "0" && t.max === "100" && t.step === "10")).toBe(true)
					expect(new Set(thumbs().map((t) => t.id)).size).toBe(2)
					expect($(".omni-slider").hasAttribute("data-range")).toBe(true)
					expect($(".omni-slider__rail .omni-slider__fill")).not.toBeNull()
					const style = $(".omni-slider").getAttribute("style") ?? ""
					expect(style).toContain("--omni-slider-start: 20")
					expect(style).toContain("--omni-slider-percent: 80")
					expect($$(".omni-slider__label").map((l) => l.textContent)).toEqual(["20", "80"])
				})

				it("each thumb reports both values; the lower cannot pass the upper and the control is put back", async () => {
					mount(h.rangeSlider({}, log))
					await h.settle()
					moveThumb(1, "50")
					await h.settle()
					moveThumb(0, "90") // past the upper thumb (now 50): stops there
					await h.settle()
					expect(events).toEqual(["change:20,50", "change:50,50"])
					expect(thumbs().map((t) => t.value)).toEqual(["50", "50"])
					moveThumb(1, "10") // below the lower thumb: stops there too
					await h.settle()
					expect(thumbs().map((t) => t.value)).toEqual(["50", "50"])
					expect(events).toEqual(["change:20,50", "change:50,50"])
				})

				it("vertical: both thumbs say so, and the root is vertical", async () => {
					mount(h.rangeSlider({ vertical: true }, log))
					await h.settle()
					expect(thumbs().map((t) => t.getAttribute("aria-orientation"))).toEqual(["vertical", "vertical"])
					expect($(".omni-slider").dataset["orientation"]).toBe("vertical")
				})

				it("disabled disables both thumbs", async () => {
					mount(h.rangeSlider({ disabled: true }, log))
					await h.settle()
					expect(thumbs().every((t) => t.disabled)).toBe(true)
				})
			})
		})

		describe("Rating", () => {
			const radios = (): HTMLInputElement[] => $$<HTMLInputElement>('input[type="radio"]')
			const fills = (): string[] => $$(".omni-rating__star").map((s) => s.dataset["fill"] as string)

			it("is a radiogroup of native radios: a hidden 'no rating' one, then one per star", async () => {
				mount(h.rating({}, log))
				await h.settle()
				expect($('[role="radiogroup"]').getAttribute("aria-label")).toBe("Rating")
				expect(radios().map((r) => r.value)).toEqual(["0", "1", "2", "3", "4", "5"])
				expect(radios().find((r) => r.checked)?.value).toBe("0")
				expect(new Set(radios().map((r) => r.name)).size).toBe(1)
				expect(radios()[4]?.getAttribute("aria-label")).toBe("4 out of 5")
			})

			it("choosing a star rates and fills the stars; choosing it again clears", async () => {
				mount(h.rating({}, log))
				await h.settle()
				radios()[4]?.click()
				await h.settle()
				expect(events).toEqual(["change:4"])
				expect(fills()).toEqual(["100", "100", "100", "100", "0"])
				radios()[4]?.click()
				await h.settle()
				expect(events).toEqual(["change:4", "change:0"])
				expect(fills()).toEqual(["0", "0", "0", "0", "0"])
			})

			it("hovering a star previews it, and leaving restores the rating", async () => {
				mount(h.rating({}, log))
				await h.settle()
				// frameworks listen differently: React to the bubbling pointerover, Vue and Angular to pointerenter
				radios()[3]?.dispatchEvent(new Event("pointerover", { bubbles: true }))
				radios()[3]?.dispatchEvent(new Event("pointerenter"))
				await h.settle()
				expect(fills()).toEqual(["100", "100", "100", "0", "0"])
				radios()[3]?.dispatchEvent(new Event("pointerout", { bubbles: true }))
				radios()[3]?.dispatchEvent(new Event("pointerleave"))
				await h.settle()
				expect(fills()).toEqual(["0", "0", "0", "0", "0"])
			})

			it("read-only is an image with a text alternative and no inputs; disabled disables every radio", async () => {
				const handle = mount(h.rating({ readOnly: true }, log))
				await h.settle()
				expect($('[role="img"]').getAttribute("aria-label")).toBe("Rating: 3 out of 5") // the name and the value, since an image has nothing else to read
				expect(radios().length).toBe(0)
				expect(fills()).toEqual(["100", "100", "100", "0", "0"])
				await handle.set({ readOnly: false, disabled: true })
				await h.settle()
				expect(radios().every((r) => r.disabled)).toBe(true)
			})
		})

		describe("Switch", () => {
			const toggle = (): HTMLInputElement => $<HTMLInputElement>('input[role="switch"]')

			it("is a native checkbox with role=switch, named by its label, whose label is clickable", async () => {
				mount(h.switch({}, log))
				await h.settle()
				expect(toggle().type).toBe("checkbox")
				expect(toggle().checked).toBe(false)
				expect(toggle().closest("label")?.textContent?.trim()).toBe("Wi-Fi")
				expect(toggle().closest("label")?.dataset).toMatchObject({ size: "medium", color: "primary" })
				byText(".omni-switch__label", "Wi-Fi").click()
				await h.settle()
				expect(events).toEqual(["change:true"])
				expect(toggle().checked).toBe(true)
				toggle().click()
				await h.settle()
				expect(events).toEqual(["change:true", "change:false"])
			})

			it("disabled is really disabled; error is exposed", async () => {
				const handle = mount(h.switch({ disabled: true }, log))
				await h.settle()
				expect(toggle().disabled).toBe(true)
				expect(toggle().closest("label")?.hasAttribute("data-disabled")).toBe(true)
				await handle.set({ disabled: false, error: true })
				await h.settle()
				expect(toggle().getAttribute("aria-invalid")).toBe("true")
				expect(toggle().closest("label")?.hasAttribute("data-error")).toBe(true)
			})
		})

		describe("RadioGroup", () => {
			const radios = (): HTMLInputElement[] => $$<HTMLInputElement>('input[type="radio"]')
			const radio = (value: string): HTMLInputElement => radios().find((r) => r.value === value) as HTMLInputElement

			it("is a radiogroup named by its legend, with native radios sharing one name, linked to the helper text", async () => {
				mount(h.radioGroup({}, log))
				await h.settle()
				const group = $('[role="radiogroup"]')
				expect(group.tagName).toBe("FIELDSET")
				expect(document.getElementById(group.getAttribute("aria-labelledby") as string)?.textContent).toBe("Fruit")
				expect(document.getElementById(group.getAttribute("aria-describedby") as string)?.textContent).toBe("Pick one")
				expect(radios().map((r) => r.value)).toEqual(["a", "b", "c"])
				expect(new Set(radios().map((r) => r.name)).size).toBe(1)
				expect(radios().map((r) => r.checked)).toEqual([false, false, false])
				expect(radio("b").disabled).toBe(true)
			})

			it("choosing checks exactly one and reports it; the choice can be moved; a disabled radio stays disabled", async () => {
				mount(h.radioGroup({}, log))
				await h.settle()
				byText(".omni-radio__label", "Apple").click()
				await h.settle()
				expect(radios().map((r) => r.checked)).toEqual([true, false, false])
				radio("c").click()
				await h.settle()
				expect(radios().map((r) => r.checked)).toEqual([false, false, true])
				expect(events).toEqual(["change:a", "change:c"])
			})

			it("a disabled group disables every radio; error is exposed", async () => {
				const handle = mount(h.radioGroup({ disabled: true }, log))
				await h.settle()
				expect(radios().every((r) => r.disabled)).toBe(true)
				expect($("fieldset").hasAttribute("data-disabled")).toBe(true)
				await handle.set({ disabled: false, error: true })
				await h.settle()
				expect(radio("a").getAttribute("aria-invalid")).toBe("true")
				expect($("fieldset").hasAttribute("data-error")).toBe(true)
			})
		})

		describe("Select", () => {
			const combobox = (): HTMLElement => $('[role="combobox"]')
			const closed = async (): Promise<void> => {
				await new Promise((r) => setTimeout(r, 250)) // the exit animation
				await h.settle()
			}

			it("is a combobox named by its label, with a listbox of options when open", async () => {
				mount(h.select({}, log))
				await h.settle()
				expect(combobox().getAttribute("aria-haspopup")).toBe("listbox")
				expect(combobox().getAttribute("aria-expanded")).toBe("false")
				expect(combobox().getAttribute("aria-labelledby")?.split(" ")).toEqual([$("label").id, combobox().id])
				expect(document.getElementById(combobox().getAttribute("aria-describedby") as string)?.textContent).toBe("Pick one")
				expect($('[role="listbox"]')).toBeNull()
				combobox().click()
				await h.settle()
				const list = $('[role="listbox"]')
				expect(combobox().getAttribute("aria-expanded")).toBe("true")
				expect(combobox().getAttribute("aria-controls")).toBe(list.id)
				expect(list.getAttribute("aria-labelledby")).toBe($("label").id)
				expect($$('[role="option"]').map((o) => o.textContent?.trim())).toEqual(["Apple", "Banana", "Cherry"])
				expect(byText('[role="option"]', "Banana").getAttribute("aria-disabled")).toBe("true")
				expect(list.closest("[data-omni-portal]")?.parentElement).toBe(document.body)
			})

			it("opens from the keyboard, focuses the first option, and the arrows skip the disabled one and wrap", async () => {
				mount(h.select({}, log))
				await h.settle()
				combobox().focus()
				keydown(combobox(), "ArrowDown")
				await h.settle()
				await new Promise((r) => setTimeout(r, 50))
				expect(document.activeElement).toBe(byText('[role="option"]', "Apple"))
				keydown(document.activeElement as Element, "ArrowDown")
				expect(document.activeElement).toBe(byText('[role="option"]', "Cherry"))
				keydown(document.activeElement as Element, "ArrowDown")
				expect(document.activeElement).toBe(byText('[role="option"]', "Apple"))
				keydown(document.activeElement as Element, "End")
				expect(document.activeElement).toBe(byText('[role="option"]', "Cherry"))
			})

			it("Enter chooses: the value is reported, the list closes, the text shows, the label floats, focus returns", async () => {
				mount(h.select({}, log))
				await h.settle()
				const root = $(".omni-select")
				expect(root.hasAttribute("data-shrink")).toBe(false)
				combobox().focus()
				keydown(combobox(), "Enter")
				await h.settle()
				await new Promise((r) => setTimeout(r, 50))
				keydown(document.activeElement as Element, "End")
				keydown(document.activeElement as Element, "Enter")
				await h.settle()
				expect(events).toEqual(["change:c", "close:select"])
				await closed()
				expect($('[role="listbox"]')).toBeNull()
				expect(combobox().textContent?.trim()).toBe("Cherry")
				expect(root.hasAttribute("data-filled")).toBe(true)
				expect(root.hasAttribute("data-shrink")).toBe(true)
				expect(document.activeElement).toBe(combobox())
			})

			it("a click chooses an option; a disabled option cannot be chosen", async () => {
				mount(h.select({}, log))
				await h.settle()
				combobox().click()
				await h.settle()
				byText('[role="option"]', "Banana").click()
				expect(events).toEqual([])
				byText('[role="option"]', "Apple").click()
				await h.settle()
				expect(events).toEqual(["change:a", "close:select"])
			})

			it("Escape and a press outside close it with the reason", async () => {
				mount(h.select({}, log))
				await h.settle()
				for (const [act, reason] of [
					[() => keydown($('[role="listbox"]'), "Escape"), "escapeKeyDown"],
					[() => pointerdown(document.body), "outsidePress"],
				] as const) {
					combobox().click()
					await h.settle()
					act()
					await h.settle()
					expect(events[events.length - 1]).toBe(`close:${reason}`)
					await closed()
				}
			})

			it("multiple: options toggle, the list stays open, the labels show together, and the list is reported", async () => {
				mount(h.select({ multiple: true }, log))
				await h.settle()
				combobox().click()
				await h.settle()
				expect($('[role="listbox"]').getAttribute("aria-multiselectable")).toBe("true")
				byText('[role="option"]', "Cherry").click()
				await h.settle()
				byText('[role="option"]', "Apple").click()
				await h.settle()
				byText('[role="option"]', "Banana").click() // disabled
				await h.settle()
				expect(events).toEqual(["change:c", "change:c,a"])
				expect($('[role="listbox"]')).not.toBeNull()
				expect(byText('[role="option"]', "Apple").getAttribute("aria-selected")).toBe("true")
				expect(combobox().textContent?.trim()).toBe("Apple, Cherry")
				byText('[role="option"]', "Cherry").click()
				await h.settle()
				expect(combobox().textContent?.trim()).toBe("Apple")
				expect(events).not.toContain("close:select")
			})

			it("groups: each is a labelled group of options, options can show custom content, typing still matches the label", async () => {
				mount(h.selectGroups({}, log))
				await h.settle()
				combobox().click()
				await h.settle()
				await new Promise((r) => setTimeout(r, 50))
				const groups = $$('[role="group"]')
				expect(groups.map((g) => document.getElementById(g.getAttribute("aria-labelledby") as string)?.textContent?.trim())).toEqual(["Fruit", "Vegetables"])
				expect(groups.map((g) => Array.from(g.querySelectorAll('[role="option"]')).map((o) => o.getAttribute("data-value")))).toEqual([["a", "b"], ["c", "d"]])
				expect($$("[data-rich]").map((el) => el.textContent)).toEqual(["Apple", "Banana", "Carrot", "Daikon"])
				expect($('[role="option"][data-value="b"]').getAttribute("aria-disabled")).toBe("true")
				expect(document.activeElement).toBe($$('[role="option"]')[0])
				keydown(document.activeElement as Element, "d") // the option shows more than its label; typing matches the label
				const target = document.activeElement as HTMLElement
				expect(target.getAttribute("data-value")).toBe("d")
				target.click()
				await h.settle()
				expect(events).toEqual(["change:d", "close:select"])
				await closed()
				expect(combobox().textContent?.trim()).toBe("Daikon") // the closed select shows the label, not the custom content
			})

			it("type-ahead moves to the option whose label starts with the typed letter", async () => {
				mount(h.select({}, log))
				await h.settle()
				combobox().click()
				await h.settle()
				await new Promise((r) => setTimeout(r, 50))
				keydown(document.activeElement as Element, "c")
				expect(document.activeElement).toBe(byText('[role="option"]', "Cherry"))
			})

			it("disabled cannot be opened; error is exposed; the label is not a form label for a div", async () => {
				const handle = mount(h.select({}, log))
				await h.settle()
				await handle.set({ error: true, disabled: true })
				await h.settle()
				expect(combobox().getAttribute("aria-disabled")).toBe("true")
				expect(combobox().getAttribute("aria-invalid")).toBe("true")
				combobox().click()
				await h.settle()
				expect($('[role="listbox"]')).toBeNull()
				expect($("label").hasAttribute("for")).toBe(false)
			})
		})

		describe("Dialog", () => {
			it("opens as a labelled modal in a portal at the end of the body", async () => {
				mount(h.dialog({}, log))
				await h.settle()
				expect($('[role="dialog"]')).toBeNull()
				byText("button", "Open").click()
				await h.settle()
				const dialog = $('[role="dialog"]')
				expect(dialog.getAttribute("aria-modal")).toBe("true")
				expect(document.getElementById(dialog.getAttribute("aria-labelledby") as string)?.textContent).toBe("Delete project?")
				expect(document.getElementById(dialog.getAttribute("aria-describedby") as string)?.textContent).toBe("This cannot be undone.")
				expect(dialog.closest("[data-omni-portal]")?.parentElement).toBe(document.body)
			})

			it("moves focus in, locks page scroll, hides the page from screen readers, and restores everything on close", async () => {
				mount(h.dialog({}, log))
				await h.settle()
				const opener = byText("button", "Open")
				opener.focus()
				opener.click()
				await h.settle()
				expect(document.activeElement).toBe(byText("button", "Cancel"))
				expect(document.body.style.overflow).toBe("hidden")
				expect(opener.closest('[aria-hidden="true"]')).not.toBeNull()
				keydown($('[role="dialog"]').parentElement as Element, "Escape")
				await new Promise((r) => setTimeout(r, 300)) // the exit animation
				await h.settle()
				expect($('[role="dialog"]')).toBeNull()
				expect(document.body.style.overflow).toBe("")
				expect(opener.closest('[aria-hidden="true"]')).toBeNull()
				expect(document.activeElement).toBe(opener)
			})

			it("asks to close on Escape and on a click outside the paper, with the reason", async () => {
				mount(h.dialog({}, log))
				await h.settle()
				byText("button", "Open").click()
				await h.settle()
				$('[role="dialog"]').click() // inside the paper: not a request
				expect(events).toEqual([])
				$('[role="dialog"]').parentElement?.click()
				await h.settle()
				expect(events).toEqual(["close:backdropClick"])
				await new Promise((r) => setTimeout(r, 300))
				await h.settle()
				byText("button", "Open").click()
				await h.settle()
				keydown($('[role="dialog"]').parentElement as Element, "Escape")
				expect(events).toEqual(["close:backdropClick", "close:escapeKeyDown"])
			})

			it("keeps Tab inside the dialog", async () => {
				mount(h.dialog({}, log))
				await h.settle()
				byText("button", "Open").click()
				await h.settle()
				const last = byText("button", "Delete")
				last.focus()
				const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })
				$('[role="dialog"]').parentElement?.dispatchEvent(event)
				expect(event.defaultPrevented).toBe(true)
				expect(document.activeElement).toBe(byText("button", "Cancel"))
			})
		})

		describe("Menu", () => {
			it("opens a menu labelled by its anchor and focuses the first item", async () => {
				mount(h.menu({}, log))
				await h.settle()
				byText("button", "Menu").click()
				await h.settle()
				const menu = $('[role="menu"]')
				expect(menu.getAttribute("aria-labelledby")).toBe("menu-button")
				expect($$('[role="menuitem"]').map((i) => i.textContent?.trim())).toEqual(["Profile", "Billing", "Logout"])
				expect(byText('[role="menuitem"]', "Billing").getAttribute("aria-disabled")).toBe("true")
				await new Promise((r) => setTimeout(r, 50))
				expect(document.activeElement).toBe(byText('[role="menuitem"]', "Profile"))
				expect(menu.closest("[data-omni-portal]")?.parentElement).toBe(document.body)
			})

			it("arrow keys move focus (skipping the disabled item, wrapping); Enter chooses and closes, focus returns", async () => {
				mount(h.menu({}, log))
				await h.settle()
				byText("button", "Menu").click()
				await h.settle()
				await new Promise((r) => setTimeout(r, 50))
				keydown(document.activeElement as Element, "ArrowDown")
				expect(document.activeElement).toBe(byText('[role="menuitem"]', "Logout"))
				keydown(document.activeElement as Element, "ArrowDown")
				expect(document.activeElement).toBe(byText('[role="menuitem"]', "Profile"))
				keydown(document.activeElement as Element, "End")
				keydown(document.activeElement as Element, "Enter")
				await h.settle()
				expect(events).toEqual(["select:logout", "close:select"])
				await new Promise((r) => setTimeout(r, 250))
				await h.settle()
				expect($('[role="menu"]')).toBeNull()
				expect(document.activeElement).toBe(byText("button", "Menu"))
			})

			it("a disabled item cannot be chosen", async () => {
				mount(h.menu({}, log))
				await h.settle()
				byText("button", "Menu").click()
				await h.settle()
				byText('[role="menuitem"]', "Billing").click()
				expect(events).toEqual([])
				byText('[role="menuitem"]', "Profile").click()
				expect(events).toEqual(["select:profile", "close:select"])
			})

			it("Escape, Tab and a press outside close it with the reason", async () => {
				mount(h.menu({}, log))
				await h.settle()
				const wait = async (): Promise<void> => {
					await new Promise((r) => setTimeout(r, 250))
					await h.settle()
				}
				for (const [act, reason] of [
					[() => keydown($('[role="menu"]'), "Escape"), "escapeKeyDown"],
					[() => keydown($('[role="menu"]'), "Tab"), "tab"],
					[() => pointerdown(document.body), "outsidePress"],
				] as const) {
					byText("button", "Menu").click()
					await h.settle()
					act()
					await h.settle()
					expect(events[events.length - 1]).toBe(`close:${reason}`)
					await wait()
				}
			})
		})

		describe("Surfaces", () => {
			it("draws the AppBar, Typography, Paper and Divider as the elements and data attributes the CSS reads", async () => {
				mount(h.surfaces({}, log))
				await h.settle()
				const bar = $("header")
				expect(bar.className).toContain("omni-app-bar")
				expect(bar.dataset).toMatchObject({ position: "static", color: "primary", elevation: "4" })
				expect(bar.querySelector(".omni-toolbar")).not.toBeNull()
				const heading = $("h1")
				expect(heading.className).toContain("omni-typography")
				expect(heading.dataset["variant"]).toBe("h6")
				expect(heading.textContent).toBe("Dashboard")
				const plain = byText("p", "Plain text")
				expect(plain.dataset["variant"]).toBe("body1")
				const paper = byText(".omni-paper", "Paper text")
				expect(paper.dataset).toMatchObject({ variant: "elevation", elevation: "3" })
			})

			it("a Card is a Paper with a header, content and actions", async () => {
				const handle = mount(h.surfaces({}, log))
				await h.settle()
				const card = $(".omni-card")
				expect(card.className).toContain("omni-paper")
				expect(card.dataset["elevation"]).toBe("1")
				expect(card.querySelector(".omni-card__title")?.textContent).toBe("Card title")
				expect(card.querySelector(".omni-card__subheader")?.textContent).toBe("Card subheader")
				expect(card.querySelector(".omni-card__header-avatar .omni-avatar")?.textContent).toContain("A")
				expect(card.querySelector(".omni-card__content")?.textContent).toBe("Card body")
				byText(".omni-card__actions button", "Share").click()
				expect(events).toEqual(["click:share"])
				await handle.set({ raised: true })
				await h.settle()
				expect($(".omni-card").dataset["elevation"]).toBe("8")
			})

			it("a Divider is an hr; with text it is a separator div with the text in it", async () => {
				mount(h.surfaces({}, log))
				await h.settle()
				const plain = $("hr")
				expect(plain.className).toContain("omni-divider")
				expect(plain.dataset).toMatchObject({ orientation: "horizontal", variant: "fullWidth" })
				const withText = $('div[role="separator"]')
				expect(withText.className).toContain("omni-divider")
				expect(withText.hasAttribute("data-with-text")).toBe(true)
				expect(withText.querySelector(".omni-divider__text")?.textContent).toBe("Or")
			})
		})

		describe("Avatar, Badge and SvgIcon", () => {
			it("an avatar shows initials, a picture, or a generic person", async () => {
				mount(h.badges({}, log))
				await h.settle()
				const [initials, picture, empty] = $$(".omni-avatar") as [HTMLElement, HTMLElement, HTMLElement]
				expect(initials.textContent).toContain("AB")
				expect(initials.dataset["variant"]).toBe("circular")
				expect(picture.dataset["variant"]).toBe("rounded")
				const img = picture.querySelector<HTMLImageElement>("img.omni-avatar__img")
				expect(img?.getAttribute("src")).toBe("/missing.png")
				expect(img?.getAttribute("alt")).toBe("Ada")
				expect(empty.querySelector("svg.omni-avatar__fallback")).not.toBeNull()
			})

			it("a picture that fails to load is replaced by the generic person", async () => {
				mount(h.badges({}, log))
				await h.settle()
				const picture = $$(".omni-avatar")[1] as HTMLElement
				picture.querySelector("img")?.dispatchEvent(new Event("error"))
				await h.settle()
				expect(picture.querySelector("img")).toBeNull()
				expect(picture.querySelector("svg.omni-avatar__fallback")).not.toBeNull()
			})

			it("a badge shows its number capped at max, and hides at zero", async () => {
				const handle = mount(h.badges({ count: 4 }, log))
				await h.settle()
				const marks = (): HTMLElement[] => $$(".omni-badge__mark")
				expect(marks()[0]?.textContent).toBe("4")
				expect(marks()[0]?.hasAttribute("data-invisible")).toBe(false)
				expect(marks()[0]?.dataset).toMatchObject({ variant: "standard", anchor: "top-right", color: "default" })
				expect(marks()[1]?.dataset["variant"]).toBe("dot")
				expect(marks()[1]?.textContent).toBe("")
				expect(marks()[2]?.textContent).toBe("5+")
				await handle.set({ count: 0 })
				await h.settle()
				expect(marks()[0]?.hasAttribute("data-invisible")).toBe(true)
				expect(marks()[0]?.getAttribute("aria-hidden")).toBe("true")
				await handle.set({ count: 12 })
				await h.settle()
				expect(marks()[0]?.textContent).toBe("12")
				expect(marks()[0]?.hasAttribute("data-invisible")).toBe(false)
			})

			it("an SvgIcon is decorative unless it has a title", async () => {
				mount(h.badges({}, log))
				await h.settle()
				const icons = $$("svg.omni-svg-icon")
				expect(icons[0]?.getAttribute("role")).toBe("img")
				expect(icons[0]?.getAttribute("aria-label")).toBe("Mail")
				expect(icons[0]?.getAttribute("aria-hidden")).toBeNull()
				expect(icons[1]?.getAttribute("aria-hidden")).toBe("true")
				expect(icons[1]?.getAttribute("focusable")).toBe("false")
				expect(icons[1]?.getAttribute("viewBox")).toBe("0 0 24 24")
				expect(icons[1]?.querySelector("path")).not.toBeNull()
			})
		})

		describe("List", () => {
			it("is a labelled nav of rows with a subheader, a selected button, a disabled button and a secondary action", async () => {
				mount(h.list({}, log))
				await h.settle()
				const nav = $("nav")
				expect(nav.getAttribute("aria-label")).toBe("Mailboxes")
				expect(nav.querySelector("ul.omni-list")).not.toBeNull()
				expect(byText(".omni-list__subheader", "Folders").tagName).toBe("LI")
				const inbox = byText("button.omni-list__button", "Inbox3 new")
				expect(inbox.getAttribute("aria-current")).toBe("true")
				expect(inbox.hasAttribute("data-selected")).toBe(true)
				expect(inbox.querySelector(".omni-list__icon")).not.toBeNull()
				expect(inbox.querySelector(".omni-list__primary")?.textContent).toBe("Inbox")
				expect(inbox.querySelector(".omni-list__secondary")?.textContent).toBe("3 new")
				const trash = byText("button.omni-list__button", "Trash") as HTMLButtonElement
				expect(trash.disabled).toBe(true)
				const drafts = $$("li.omni-list__item").find((li) => li.querySelector(".omni-list__primary")?.textContent === "Drafts") as HTMLElement
				expect(drafts.hasAttribute("data-divider")).toBe(true)
				expect(drafts.hasAttribute("data-secondary-action")).toBe(true)
				expect(drafts.querySelector(".omni-list__action button")?.getAttribute("aria-label")).toBe("Delete drafts")
				expect($("li.omni-divider").getAttribute("aria-hidden")).toBe("true")
			})

			it("rows react to clicks; a disabled row and the rest of the page do not", async () => {
				mount(h.list({}, log))
				await h.settle()
				byText("button.omni-list__button", "Inbox3 new").click()
				byText("button.omni-list__button", "Trash").click()
				$('button[aria-label="Delete drafts"]').click()
				expect(events).toEqual(["click:inbox", "click:delete"])
			})

			it("dense is set on the list", async () => {
				const handle = mount(h.list({}, log))
				await h.settle()
				expect($(".omni-list").hasAttribute("data-dense")).toBe(false)
				await handle.set({ dense: true })
				await h.settle()
				expect($(".omni-list").hasAttribute("data-dense")).toBe(true)
			})
		})

		describe("Table", () => {
			it("is a real table with a head, body and footer, header cells and a row header", async () => {
				mount(h.table({}, log))
				await h.settle()
				const table = $("table")
				expect(table.className).toContain("omni-table")
				expect(table.getAttribute("aria-label")).toBe("Desserts")
				expect(table.closest(".omni-table-container")).not.toBeNull()
				const heads = $$("thead th")
				expect(heads.map((c) => c.textContent)).toEqual(["Dessert", "Calories"])
				expect(heads.every((c) => c.getAttribute("scope") === "col" && c.className.includes("omni-table__cell"))).toBe(true)
				expect(heads[1]?.dataset["align"]).toBe("right")
				const first = $$("tbody tr")[0] as HTMLElement
				expect(first.className).toContain("omni-table__row")
				expect(first.hasAttribute("data-hover")).toBe(true)
				expect(first.hasAttribute("data-selected")).toBe(true)
				expect(first.getAttribute("aria-selected")).toBe("true")
				const rowHeader = first.querySelector("th")
				expect(rowHeader?.textContent).toBe("Frozen yoghurt")
				expect(rowHeader?.getAttribute("scope")).toBe("row")
				expect(first.querySelectorAll("td").length).toBe(1)
				expect($$("tbody tr")[1]?.hasAttribute("data-selected")).toBe(false)
				expect($$("tfoot td").map((c) => c.textContent)).toEqual(["Total", "396"])
			})

			it("small is set on the table", async () => {
				const handle = mount(h.table({}, log))
				await h.settle()
				expect($("table").hasAttribute("data-size")).toBe(false)
				await handle.set({ size: "small" })
				await h.settle()
				expect($("table").dataset["size"]).toBe("small")
			})
		})

		describe("Chip", () => {
			const chip = (label: string): HTMLElement => $$(".omni-chip").find((c) => c.textContent?.trim().startsWith(label)) as HTMLElement
			const keyup = (el: Element, key: string): void => void el.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true, cancelable: true }))

			it("a plain chip is not interactive; a clickable one is a button in the Tab order; a deletable one has a delete icon", async () => {
				mount(h.chips({}, log))
				await h.settle()
				const plain = chip("Static")
				expect(plain.getAttribute("role")).toBeNull()
				expect(plain.getAttribute("tabindex")).toBeNull()
				expect(plain.dataset).toMatchObject({ variant: "filled", color: "default", size: "medium" })
				expect(plain.querySelector(".omni-chip__label")?.textContent).toBe("Static")
				const clickable = chip("Clickable")
				expect(clickable.getAttribute("role")).toBe("button")
				expect(clickable.getAttribute("tabindex")).toBe("0")
				const deletable = chip("Deletable")
				expect(deletable.querySelector("svg.omni-chip__delete")).not.toBeNull()
				expect(deletable.getAttribute("tabindex")).toBe("0")
				expect(deletable.getAttribute("aria-keyshortcuts")).toBe("Backspace Delete")
				expect(chip("Outlined").dataset).toMatchObject({ variant: "outlined", color: "primary", size: "small" })
				expect(plain.querySelector(".omni-chip__delete")).toBeNull()
			})

			it("click, Enter and Space activate a clickable chip", async () => {
				mount(h.chips({}, log))
				await h.settle()
				const clickable = chip("Clickable")
				clickable.click()
				keydown(clickable, "Enter")
				keydown(clickable, " ")
				expect(events).toEqual(["click:clickable", "click:clickable"]) // Space acts on key up
				keyup(clickable, " ")
				expect(events).toEqual(["click:clickable", "click:clickable", "click:clickable"])
			})

			it("Backspace, Delete and the icon delete; the icon does not also press the chip", async () => {
				mount(h.chips({}, log))
				await h.settle()
				const deletable = chip("Deletable")
				keydown(deletable, "Backspace")
				keydown(deletable, "Delete")
				deletable.querySelector<SVGElement>(".omni-chip__delete")?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
				expect(events).toEqual(["delete:deletable", "delete:deletable", "delete:deletable"])
			})

			it("disabled chips are out of the Tab order and ignore everything", async () => {
				const handle = mount(h.chips({}, log))
				await h.settle()
				await handle.set({ disabled: true })
				await h.settle()
				const clickable = chip("Clickable")
				expect(clickable.getAttribute("aria-disabled")).toBe("true")
				expect(clickable.getAttribute("tabindex")).toBeNull()
				expect(clickable.hasAttribute("data-disabled")).toBe(true)
				keydown(clickable, "Enter")
				keydown(chip("Deletable"), "Backspace")
				expect(events).toEqual([])
			})
		})

		describe("Accordion", () => {
			const summary = (text: string): HTMLElement => byText("button.omni-accordion__summary", text)
			const region = (id: string | null): HTMLElement => document.getElementById(id ?? "") as HTMLElement

			it("a heading holds a button that controls a region named by it, closed to begin with", async () => {
				mount(h.accordions({}, log))
				await h.settle()
				const button = summary("First question")
				expect(button.parentElement?.tagName).toBe("H3")
				expect(button.getAttribute("aria-expanded")).toBe("false")
				const panel = region(button.getAttribute("aria-controls"))
				expect(panel.getAttribute("role")).toBe("region")
				expect(panel.getAttribute("aria-labelledby")).toBe(button.id)
				expect(panel.dataset["state"]).toBe("closed")
				expect(panel.textContent).toContain("First answer")
				expect(button.closest(".omni-accordion")?.hasAttribute("data-expanded")).toBe(false)
			})

			it("an uncontrolled accordion opens and closes on click and tells the parent", async () => {
				mount(h.accordions({}, log))
				await h.settle()
				const button = summary("First question")
				button.click()
				await h.settle()
				expect(events).toEqual(["first:true"])
				expect(button.getAttribute("aria-expanded")).toBe("true")
				expect(region(button.getAttribute("aria-controls")).dataset["state"]).toBe("open")
				expect(button.closest(".omni-accordion")?.hasAttribute("data-expanded")).toBe(true)
				button.click()
				await h.settle()
				expect(events).toEqual(["first:true", "first:false"])
				expect(button.getAttribute("aria-expanded")).toBe("false")
			})

			it("a controlled accordion follows the parent, which here opens it", async () => {
				mount(h.accordions({}, log))
				await h.settle()
				summary("Second question").click()
				await h.settle()
				expect(events).toEqual(["second:true"])
				expect(summary("Second question").getAttribute("aria-expanded")).toBe("true")
			})

			it("disabled is exposed and ignores clicks", async () => {
				const handle = mount(h.accordions({}, log))
				await h.settle()
				await handle.set({ disabled: true })
				await h.settle()
				const button = summary("Second question")
				expect(button.getAttribute("aria-disabled")).toBe("true")
				button.click()
				await h.settle()
				expect(events).toEqual([])
				expect(button.getAttribute("aria-expanded")).toBe("false")
			})
		})

		describe("Tooltip", () => {
			const tooltip = (): HTMLElement | null => document.querySelector<HTMLElement>('[role="tooltip"]')
			const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

			it("is not in the page until the pointer is on the trigger; then it describes it", async () => {
				mount(h.tooltip({}, log))
				await h.settle()
				const save = byText("button", "Save")
				expect(tooltip()).toBeNull()
				expect(save.getAttribute("aria-describedby")).toBeNull()
				save.dispatchEvent(new Event("pointerenter"))
				await h.settle()
				await wait(30)
				const tip = tooltip() as HTMLElement
				expect(tip.textContent).toBe("Saves your work")
				expect(tip.className).toContain("omni-tooltip")
				expect(tip.dataset["state"]).toBe("open")
				expect(save.getAttribute("aria-describedby")).toBe(tip.id)
				expect(events).toEqual(["open"])
			})

			it("closes when the pointer leaves, after the exit animation, and the description goes", async () => {
				mount(h.tooltip({}, log))
				await h.settle()
				const save = byText("button", "Save")
				save.dispatchEvent(new Event("pointerenter"))
				await h.settle()
				save.dispatchEvent(new Event("pointerleave"))
				await wait(100) // leaveDelay 50
				await h.settle()
				expect(events).toEqual(["open", "close"])
				await wait(250)
				await h.settle()
				expect(tooltip()).toBeNull()
				expect(save.getAttribute("aria-describedby")).toBeNull()
			})

			it("Escape closes it even when the focus is elsewhere", async () => {
				mount(h.tooltip({}, log))
				await h.settle()
				byText("button", "Save").dispatchEvent(new Event("pointerenter"))
				await h.settle()
				await wait(30)
				keydown(document.body, "Escape")
				await h.settle()
				expect(events).toEqual(["open", "close"])
				await wait(200)
			})

			it("the tooltip stays open while the pointer is on it, and closes when it leaves that too", async () => {
				mount(h.tooltip({}, log))
				await h.settle()
				const save = byText("button", "Save")
				save.dispatchEvent(new Event("pointerenter"))
				await h.settle()
				await wait(30)
				save.dispatchEvent(new Event("pointerleave")) // leaveDelay 50 ...
				pointerEnter(tooltip() as HTMLElement) // ... the pointer reaches the tooltip in time
				await wait(120)
				await h.settle()
				expect(events).toEqual(["open"])
				pointerLeave(tooltip() as HTMLElement)
				await wait(120)
				await h.settle()
				expect(events).toEqual(["open", "close"])
			})

			it("an empty title turns the tooltip off", async () => {
				const handle = mount(h.tooltip({}, log))
				await h.settle()
				await handle.set({ title: "" })
				await h.settle()
				byText("button", "Save").dispatchEvent(new Event("pointerenter"))
				await h.settle()
				await wait(30)
				expect(tooltip()).toBeNull()
				expect(events).toEqual([])
			})
		})


		const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
		const labelled = (label: string): HTMLElement => document.querySelector(`[aria-label="${label}"]`) as HTMLElement
		const touch = (el: Element, type: string): void => void el.dispatchEvent(Object.assign(new Event(type, { bubbles: true }), { pointerType: "touch" }))

		describe("Alert", () => {
			const alerts = (): HTMLElement[] => $$(".omni-alert")

			it("severity picks the role (alert interrupts, status waits), the icon and the variant", async () => {
				mount(h.alerts({}, log))
				await h.settle()
				const [error, plain, info, warning, success] = alerts() as [HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement]
				expect(alerts()).toHaveLength(5)
				expect(error.getAttribute("role")).toBe("alert")
				expect(error.dataset).toMatchObject({ severity: "error", variant: "standard" })
				expect(error.querySelector(".omni-alert__title")?.textContent).toBe("Upload failed")
				expect(error.querySelector(".omni-alert__message")?.textContent).toContain("The file is too big.")
				expect(error.querySelector(".omni-alert__icon svg")).not.toBeNull()
				expect(plain.getAttribute("role")).toBe("status")
				expect(plain.dataset["severity"]).toBe("success")
				expect(info.dataset).toMatchObject({ severity: "info", variant: "filled" })
				expect(info.getAttribute("role")).toBe("status")
				expect(warning.getAttribute("role")).toBe("alert")
				expect(warning.dataset["variant"]).toBe("outlined")
				expect(warning.querySelector(".omni-alert__icon")).toBeNull()
				expect(success.querySelector("button")?.textContent).toBe("Undo")
			})

			it("onClose adds a named close button; an action replaces it", async () => {
				mount(h.alerts({}, log))
				await h.settle()
				const [error, , , warning, success] = alerts() as [HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement]
				expect(error.querySelector("button")).toBeNull()
				const close = warning.querySelector<HTMLButtonElement>('button[aria-label="Close"]') as HTMLButtonElement
				close.click()
				expect(events).toEqual(["close:warning"])
				expect(success.querySelector('button[aria-label="Close"]')).toBeNull()
				byText("button", "Undo").click()
				expect(events).toEqual(["close:warning", "click:undo"])
			})

			it("has no accessibility violations", async () => {
				mount(h.alerts({}, log))
				await h.settle()
				await expectAccessible("alerts")
			})
		})

		describe("Snackbar", () => {
			const snack = (): HTMLElement | null => document.querySelector<HTMLElement>(".omni-snackbar")

			it("is not in the page until opened; then it is a polite message with its action", async () => {
				mount(h.snackbar({}, log))
				await h.settle()
				expect(snack()).toBeNull()
				byText("button", "Show").click()
				await h.settle()
				const bar = snack() as HTMLElement
				expect(bar.dataset).toMatchObject({ state: "open", vertical: "bottom", horizontal: "left" })
				expect(bar.querySelector(".omni-snackbar__content")?.getAttribute("role")).toBe("status")
				expect(bar.textContent).toContain("Saved")
				byText("button", "Undo").click()
				expect(events).toEqual(["click:undo"])
			})

			it("closes itself after autoHideDuration with the reason timeout", async () => {
				mount(h.snackbar({ autoHideDuration: 60 }, log))
				await h.settle()
				byText("button", "Show").click()
				await h.settle()
				await wait(30)
				expect(events).toEqual([])
				await wait(80)
				await h.settle()
				expect(events).toEqual(["close:timeout"])
				await wait(260)
				await h.settle()
				expect(snack()).toBeNull()
			})

			it("pauses while the pointer is on it and counts again once it leaves", async () => {
				mount(h.snackbar({ autoHideDuration: 60 }, log))
				await h.settle()
				byText("button", "Show").click()
				await h.settle()
				pointerEnter(snack() as HTMLElement)
				await wait(150)
				expect(events).toEqual([])
				pointerLeave(snack() as HTMLElement) // 30ms left
				await wait(100)
				await h.settle()
				expect(events).toEqual(["close:timeout"])
			})

			it("Escape and a press outside ask to close; a press inside does not", async () => {
				mount(h.snackbar({}, log))
				await h.settle()
				byText("button", "Show").click()
				await h.settle()
				pointerdown(byText("button", "Undo"))
				expect(events).toEqual([])
				pointerdown(document.body)
				await h.settle()
				expect(events).toEqual(["close:outsidePress"])
				await wait(260)
				byText("button", "Show").click()
				await h.settle()
				keydown(document.body, "Escape")
				await h.settle()
				expect(events).toEqual(["close:outsidePress", "close:escapeKeyDown"])
				await wait(260)
			})

			it("has no accessibility violations while open", async () => {
				mount(h.snackbar({}, log))
				await h.settle()
				byText("button", "Show").click()
				await h.settle()
				await expectAccessible("snackbar")
			})
		})

		describe("Progress, Skeleton and Backdrop", () => {
			it("a CircularProgress is a named progressbar: spinning without a value, filled with one", async () => {
				const handle = mount(h.progress({}, log))
				await h.settle()
				const spinner = labelled("Loading")
				expect(spinner.getAttribute("role")).toBe("progressbar")
				expect(spinner.dataset["variant"]).toBe("indeterminate")
				expect(spinner.hasAttribute("aria-valuenow")).toBe(false)
				const upload = labelled("Upload")
				expect(upload.dataset["variant"]).toBe("determinate")
				expect(upload.getAttribute("aria-valuenow")).toBe("40")
				const offset = (): string | null => upload.querySelector("circle")?.getAttribute("style") ?? null
				const before = offset()
				expect(before).toContain("stroke-dashoffset")
				await handle.set({ value: 80 })
				await h.settle()
				expect(upload.getAttribute("aria-valuenow")).toBe("80")
				expect(offset()).not.toBe(before)
			})

			it("a LinearProgress shows its value and buffer as variables on the bars", async () => {
				const handle = mount(h.progress({}, log))
				await h.settle()
				const bar = labelled("Progress")
				expect(bar.dataset["variant"]).toBe("determinate")
				expect(bar.getAttribute("aria-valuenow")).toBe("40")
				expect(bar.querySelector(".omni-linear-progress__bar1")?.getAttribute("style")).toContain("--_p: 40")
				await handle.set({ value: 55 })
				await h.settle()
				expect(bar.querySelector(".omni-linear-progress__bar1")?.getAttribute("style")).toContain("--_p: 55")
				const buffer = labelled("Buffering")
				expect(buffer.dataset["variant"]).toBe("buffer")
				expect(buffer.querySelector(".omni-linear-progress__bar2")?.getAttribute("style")).toContain("--_p: 60")
				const working = labelled("Working")
				expect(working.dataset["variant"]).toBe("indeterminate")
				expect(working.hasAttribute("aria-valuenow")).toBe(false)
			})

			it("Skeletons are decorative and carry their size", async () => {
				mount(h.progress({}, log))
				await h.settle()
				const skeletons = $$(".omni-skeleton")
				expect(skeletons.map((s) => s.dataset["variant"])).toEqual(["text", "circular", "rectangular"])
				expect(skeletons.every((s) => s.getAttribute("aria-hidden") === "true")).toBe(true)
				expect(skeletons[1]?.getAttribute("style")).toContain("--_w: 40px")
				expect(skeletons[2]?.getAttribute("style")).toContain("--_h: 60px")
				expect(skeletons[2]?.dataset["animation"]).toBe("none")
				expect(skeletons[0]?.dataset["animation"]).toBe("pulse")
			})

			it("a Backdrop is hidden from screen readers, follows `open` and takes clicks", async () => {
				const handle = mount(h.progress({}, log))
				await h.settle()
				const backdrop = $(".omni-backdrop")
				expect(backdrop.getAttribute("aria-hidden")).toBe("true")
				expect(backdrop.dataset["state"]).toBe("open")
				backdrop.click()
				expect(events).toEqual(["click:backdrop"])
				await handle.set({ open: false })
				await h.settle()
				expect($(".omni-backdrop").dataset["state"]).toBe("closed")
			})

			it("has no accessibility violations", async () => {
				mount(h.progress({}, log))
				await h.settle()
				await expectAccessible("progress")
			})
		})

		describe("Drawer", () => {
			it("temporary: a modal dialog on the chosen edge that closes on Escape and on a click outside", async () => {
				mount(h.drawer({}, log))
				await h.settle()
				expect($(".omni-drawer")).toBeNull()
				byText("button", "Open").click()
				await h.settle()
				const dialog = $('[role="dialog"]')
				expect(dialog.getAttribute("aria-label")).toBe("Navigation")
				expect(dialog.getAttribute("aria-modal")).toBe("true")
				expect(dialog.className).toContain("omni-drawer__paper")
				expect($(".omni-drawer").dataset).toMatchObject({ variant: "temporary", anchor: "start" })
				expect(dialog.contains(document.activeElement)).toBe(true)
				expect(dialog.textContent).toContain("Home")
				keydown(dialog, "Escape")
				await h.settle()
				expect(events).toEqual(["close:escapeKeyDown"])
				await wait(260)
				await h.settle()
				expect($(".omni-drawer")).toBeNull()
				byText("button", "Open").click()
				await h.settle()
				$(".omni-drawer__container").click()
				await h.settle()
				expect(events).toEqual(["close:escapeKeyDown", "close:backdropClick"])
				await wait(260)
			})

			it("the anchor is a logical edge", async () => {
				mount(h.drawer({ anchor: "end" }, log))
				await h.settle()
				byText("button", "Open").click()
				await h.settle()
				expect($(".omni-drawer").dataset["anchor"]).toBe("end")
			})

			it("persistent: an aside that opens and closes without taking focus; Escape does nothing", async () => {
				mount(h.drawer({ variant: "persistent" }, log))
				await h.settle()
				const aside = $("aside.omni-drawer")
				expect(aside.getAttribute("aria-label")).toBe("Navigation")
				expect(aside.dataset["state"]).toBe("closed")
				expect($('[role="dialog"]')).toBeNull()
				byText("button", "Open").click()
				await h.settle()
				expect($("aside.omni-drawer").dataset["state"]).toBe("open")
				expect($('[role="dialog"]')).toBeNull()
				keydown(document.body, "Escape")
				await h.settle()
				expect(events).toEqual([])
			})

			it("permanent: always an open aside", async () => {
				mount(h.drawer({ variant: "permanent" }, log))
				await h.settle()
				const aside = $("aside.omni-drawer")
				expect(aside.dataset).toMatchObject({ variant: "permanent", state: "open" })
				expect(aside.textContent).toContain("Settings")
			})

			it("has no accessibility violations (open temporary and persistent)", async () => {
				mount(h.drawer({}, log))
				mount(h.drawer({ variant: "persistent" }, log))
				await h.settle()
				$$("button").filter((b) => b.textContent === "Open").forEach((b) => b.click())
				await h.settle()
				await expectAccessible("drawer")
			})
		})

		describe("Popover", () => {
			it("opens next to its anchor as a named, non-modal dialog and moves focus in", async () => {
				mount(h.popover({}, log))
				await h.settle()
				expect($('[role="dialog"]')).toBeNull()
				$("#popover-button").click()
				await h.settle()
				const dialog = $('[role="dialog"]')
				expect(dialog.getAttribute("aria-label")).toBe("Filter options")
				expect(dialog.hasAttribute("aria-modal")).toBe(false)
				expect(dialog.className).toContain("omni-popover")
				expect(dialog.style.position).toBe("fixed")
				expect(dialog.contains(document.activeElement)).toBe(true)
				byText("button", "Apply").click()
				expect(events).toEqual(["click:apply"])
			})

			it("Escape and a press outside ask to close; focus goes back to the anchor; a press on the anchor is not outside", async () => {
				mount(h.popover({}, log))
				await h.settle()
				$("#popover-button").click()
				await h.settle()
				pointerdown($("#popover-button"))
				pointerdown(byText("button", "Apply"))
				expect(events).toEqual([])
				keydown($('[role="dialog"]'), "Escape")
				await h.settle()
				expect(events).toEqual(["close:escapeKeyDown"])
				await wait(200)
				await h.settle()
				expect($('[role="dialog"]')).toBeNull()
				expect(document.activeElement).toBe($("#popover-button"))
				$("#popover-button").click()
				await h.settle()
				pointerdown(document.body)
				await h.settle()
				expect(events).toEqual(["close:escapeKeyDown", "close:outsidePress"])
				await wait(200)
			})

			it("has no accessibility violations while open", async () => {
				mount(h.popover({}, log))
				await h.settle()
				$("#popover-button").click()
				await h.settle()
				await expectAccessible("popover")
			})
		})

		describe("Breadcrumbs and Link", () => {
			const items = (): HTMLElement[] => $$(".omni-breadcrumbs__item")

			it("is a nav with an ordered list; the last item is the current page; separators are hidden", async () => {
				mount(h.breadcrumbs({}, log))
				await h.settle()
				const nav = $("nav.omni-breadcrumbs")
				expect(nav.getAttribute("aria-label")).toBe("breadcrumb")
				expect(nav.querySelector("ol")).not.toBeNull()
				expect(items().map((i) => i.textContent?.trim())).toEqual(["Home", "Library", "Data", "Reports", "2026", "Current"])
				expect(items()[5]?.getAttribute("aria-current")).toBe("page")
				expect(items()[0]?.hasAttribute("aria-current")).toBe(false)
				const separators = $$(".omni-breadcrumbs__separator")
				expect(separators).toHaveLength(5)
				expect(separators.every((s) => s.getAttribute("aria-hidden") === "true")).toBe(true)
			})

			it("too many items fold their middle under a button that shows them", async () => {
				mount(h.breadcrumbs({ maxItems: 4 }, log))
				await h.settle()
				expect(items().map((i) => i.textContent?.trim())).toEqual(["Home", "", "Current"])
				const expand = $("button.omni-breadcrumbs__expand")
				expect(expand.getAttribute("aria-label")).toBe("Show path")
				expand.click()
				await h.settle()
				expect(items()).toHaveLength(6)
				expect($("button.omni-breadcrumbs__expand")).toBeNull()
			})

			it("a Link is a real anchor with its underline and colour", async () => {
				mount(h.breadcrumbs({}, log))
				await h.settle()
				const link = $$("a.omni-link").find((a) => a.textContent === "Docs") as HTMLElement
				expect(link.getAttribute("href")).toBe("/docs")
				expect(link.dataset).toMatchObject({ underline: "hover", color: "secondary" })
				expect($$("a.omni-link").find((a) => a.textContent === "Home")?.dataset["underline"]).toBe("always")
			})

			it("has no accessibility violations", async () => {
				mount(h.breadcrumbs({ maxItems: 4 }, log))
				await h.settle()
				await expectAccessible("breadcrumbs")
			})
		})

		describe("Pagination", () => {
			const nav = (label: string): HTMLElement => $(`nav[aria-label="${label}"]`)
			const buttons = (label: string): HTMLButtonElement[] => Array.from(nav(label).querySelectorAll("button"))
			const named = (label: string, name: string): HTMLButtonElement => buttons(label).find((b) => b.getAttribute("aria-label") === name) as HTMLButtonElement

			it("is a nav of buttons: ends, numbers, a fold, the current page", async () => {
				mount(h.pagination({}, log))
				await h.settle()
				expect(buttons("Results").map((b) => b.getAttribute("aria-label"))).toEqual([
					"Go to first page",
					"Go to previous page",
					"page 1",
					"Go to page 2",
					"Go to page 3",
					"Go to page 4",
					"Go to page 5",
					"Go to page 10",
					"Go to next page",
					"Go to last page",
				])
				expect(named("Results", "page 1").getAttribute("aria-current")).toBe("page")
				expect(named("Results", "page 1").hasAttribute("data-selected")).toBe(true)
				expect(named("Results", "Go to first page").disabled).toBe(true)
				expect(named("Results", "Go to previous page").disabled).toBe(true)
				expect(nav("Results").querySelectorAll(".omni-pagination__ellipsis")).toHaveLength(1)
			})

			it("a click on a page, next or last reports it and moves the current page (host-held)", async () => {
				mount(h.pagination({}, log))
				await h.settle()
				named("Results", "Go to page 3").click()
				await h.settle()
				expect(events).toEqual(["change:3"])
				expect(named("Results", "page 3").getAttribute("aria-current")).toBe("page")
				named("Results", "Go to next page").click()
				await h.settle()
				expect(events).toEqual(["change:3", "change:4"])
				named("Results", "Go to last page").click()
				await h.settle()
				expect(events[2]).toBe("change:10")
				expect(named("Results", "Go to next page").disabled).toBe(true)
			})

			it("count and disabled follow the props", async () => {
				const handle = mount(h.pagination({}, log))
				await h.settle()
				await handle.set({ count: 3 })
				await h.settle()
				expect(nav("Results").querySelectorAll(".omni-pagination__ellipsis")).toHaveLength(0)
				expect(buttons("Results")).toHaveLength(7)
				await handle.set({ disabled: true })
				await h.settle()
				expect(buttons("Results").every((b) => b.disabled)).toBe(true)
			})

			it("an uncontrolled one keeps its own page", async () => {
				mount(h.pagination({}, log))
				await h.settle()
				expect(named("Uncontrolled", "page 3").getAttribute("aria-current")).toBe("page")
				expect(nav("Uncontrolled").dataset).toMatchObject({ variant: "outlined", size: "small" })
				named("Uncontrolled", "Go to page 5").click()
				await h.settle()
				expect(events).toEqual(["uncontrolled:5"])
				expect(named("Uncontrolled", "page 5").getAttribute("aria-current")).toBe("page")
			})

			it("has no accessibility violations", async () => {
				mount(h.pagination({}, log))
				await h.settle()
				await expectAccessible("pagination")
			})
		})

		describe("Stepper", () => {
			const steps = (label: string): HTMLElement[] => Array.from($(`[aria-label="${label}"]`).querySelectorAll<HTMLElement>(":scope > .omni-step"))

			it("steps before the active one are completed, the active one is the current step, the rest wait", async () => {
				mount(h.stepper({}, log))
				await h.settle()
				const list = steps("Checkout")
				expect(list.map((s) => s.dataset["state"])).toEqual(["completed", "active", "pending", "pending"])
				expect(list.map((s) => s.getAttribute("aria-current"))).toEqual([null, "step", null, null])
				expect(list[0]?.querySelector(".omni-step__icon svg")).not.toBeNull()
				expect(list[1]?.querySelector(".omni-step__icon")?.textContent).toBe("2")
				expect(list[1]?.querySelector(".omni-step__optional")?.textContent).toBe("Optional")
				expect(list[3]?.hasAttribute("data-last")).toBe(true)
				expect(list[0]?.hasAttribute("data-last")).toBe(false)
				expect($('[aria-label="Checkout"]').tagName).toBe("OL")
			})

			it("changing activeStep moves the states; a step with onClick has a button header", async () => {
				const handle = mount(h.stepper({}, log))
				await h.settle()
				expect(steps("Checkout")[0]?.querySelector("button.omni-step__header")).not.toBeNull()
				expect(steps("Checkout")[1]?.querySelector("button")).toBeNull()
				steps("Checkout")[0]?.querySelector("button")?.click()
				expect(events).toEqual(["click:cart"])
				await handle.set({ activeStep: 3 })
				await h.settle()
				expect(steps("Checkout").map((s) => s.dataset["state"])).toEqual(["completed", "completed", "completed", "active"])
			})

			it("a vertical stepper shows the content of the active step only", async () => {
				mount(h.stepper({}, log))
				await h.settle()
				const vertical = $('[aria-label="Build steps"]')
				expect(vertical.dataset["orientation"]).toBe("vertical")
				const [plan, build] = steps("Build steps") as [HTMLElement, HTMLElement]
				expect(plan.querySelector(".omni-step__content")?.textContent).toBe("Plan details")
				expect(build.querySelector(".omni-step__content")?.textContent).toBe("")
			})

			it("has no accessibility violations", async () => {
				mount(h.stepper({}, log))
				await h.settle()
				await expectAccessible("stepper")
			})
		})

		describe("BottomNavigation", () => {
			const action = (name: string): HTMLButtonElement => byText("button.omni-bottom-navigation__action", name) as HTMLButtonElement

			it("is a nav of buttons; the current one is aria-current", async () => {
				mount(h.bottomNavigation({}, log))
				await h.settle()
				expect($("nav.omni-bottom-navigation").getAttribute("aria-label")).toBe("Main")
				expect(action("Recents").getAttribute("aria-current")).toBe("page")
				expect(action("Recents").hasAttribute("data-selected")).toBe(true)
				expect(action("Favorites").hasAttribute("aria-current")).toBe(false)
				expect(action("Nearby").disabled).toBe(true)
				expect(action("Favorites").querySelector("svg")).not.toBeNull()
			})

			it("a click reports the value and the host moves the current action; a disabled one does nothing", async () => {
				const handle = mount(h.bottomNavigation({}, log))
				await h.settle()
				action("Favorites").click()
				await h.settle()
				expect(events).toEqual(["change:favorites"])
				expect(action("Favorites").getAttribute("aria-current")).toBe("page")
				expect(action("Recents").hasAttribute("aria-current")).toBe(false)
				action("Nearby").click()
				expect(events).toEqual(["change:favorites"])
				expect($("nav.omni-bottom-navigation").hasAttribute("data-show-labels")).toBe(false)
				await handle.set({ showLabels: true })
				await h.settle()
				expect($("nav.omni-bottom-navigation").hasAttribute("data-show-labels")).toBe(true)
			})

			it("has no accessibility violations", async () => {
				mount(h.bottomNavigation({}, log))
				await h.settle()
				await expectAccessible("bottom navigation")
			})
		})

		describe("SpeedDial", () => {
			const trigger = (): HTMLElement => $('button[aria-label="Actions"]')
			const menu = (): HTMLElement => $('[role="menu"]')
			const item = (name: string): HTMLElement => $(`[role="menuitem"][aria-label="${name}"]`)

			it("a button opens a menu of named actions", async () => {
				mount(h.speedDial({}, log))
				await h.settle()
				expect(trigger().getAttribute("aria-haspopup")).toBe("menu")
				expect(trigger().getAttribute("aria-expanded")).toBe("false")
				expect(menu().dataset["state"]).toBe("closed")
				expect($$('[role="menuitem"]').map((i) => i.getAttribute("aria-label"))).toEqual(["Copy", "Save", "Print"])
				expect(trigger().getAttribute("aria-controls")).toBe(menu().id)
				trigger().click()
				await h.settle()
				expect(trigger().getAttribute("aria-expanded")).toBe("true")
				expect(menu().dataset["state"]).toBe("open")
				expect($(".omni-speed-dial").dataset["direction"]).toBe("up")
			})

			it("choosing an action runs it, closes the dial and focuses the button", async () => {
				mount(h.speedDial({}, log))
				await h.settle()
				trigger().click()
				await h.settle()
				item("Save").click()
				await h.settle()
				expect(events).toEqual(["click:save"])
				expect(trigger().getAttribute("aria-expanded")).toBe("false")
				expect(document.activeElement).toBe(trigger())
			})

			it("Escape closes it; hover opens and leaving closes", async () => {
				mount(h.speedDial({}, log))
				await h.settle()
				pointerEnter($(".omni-speed-dial"))
				await h.settle()
				expect(trigger().getAttribute("aria-expanded")).toBe("true")
				keydown(trigger(), "Escape")
				await h.settle()
				expect(trigger().getAttribute("aria-expanded")).toBe("false")
				pointerEnter($(".omni-speed-dial"))
				await h.settle()
				pointerLeave($(".omni-speed-dial"))
				await h.settle()
				expect(trigger().getAttribute("aria-expanded")).toBe("false")
			})

			it("arrow keys open it and move between the actions", async () => {
				mount(h.speedDial({}, log))
				await h.settle()
				trigger().focus()
				keydown(trigger(), "ArrowUp")
				await h.settle()
				expect(trigger().getAttribute("aria-expanded")).toBe("true")
				keydown(trigger(), "ArrowUp")
				expect(document.activeElement).toBe(item("Copy"))
				keydown(item("Copy"), "ArrowUp")
				expect(document.activeElement).toBe(item("Save"))
				keydown(item("Save"), "ArrowDown")
				expect(document.activeElement).toBe(item("Copy"))
			})

			it("has no accessibility violations while open", async () => {
				mount(h.speedDial({}, log))
				await h.settle()
				trigger().click()
				await h.settle()
				await expectAccessible("speed dial")
			})
		})

		describe("TableSortLabel and TablePagination", () => {
			const th = (name: string): HTMLElement => $$("th").find((c) => c.textContent?.trim().startsWith(name)) as HTMLElement
			const sort = (name: string): HTMLButtonElement => th(name).querySelector("button.omni-table__sort") as HTMLButtonElement
			const rows = (): HTMLSelectElement => $("select.omni-table-pagination__select")
			const range = (): string => $(".omni-table-pagination [aria-live]").textContent ?? ""

			it("the sorted column has aria-sort and an active, directional label", async () => {
				mount(h.sortableTable({}, log))
				await h.settle()
				expect(th("Name").getAttribute("aria-sort")).toBe("ascending")
				expect(th("Calories").hasAttribute("aria-sort")).toBe(false)
				expect(sort("Name").dataset).toMatchObject({ active: "", direction: "asc" })
				expect(sort("Calories").hasAttribute("data-active")).toBe(false)
				expect(sort("Name").querySelector("svg")).not.toBeNull()
			})

			it("clicking sorts by the column, and again flips the direction", async () => {
				mount(h.sortableTable({}, log))
				await h.settle()
				sort("Calories").click()
				await h.settle()
				expect(events).toEqual(["sort:calories"])
				expect(th("Calories").getAttribute("aria-sort")).toBe("ascending")
				expect(th("Name").hasAttribute("aria-sort")).toBe(false)
				sort("Calories").click()
				await h.settle()
				expect(th("Calories").getAttribute("aria-sort")).toBe("descending")
				expect(sort("Calories").dataset["direction"]).toBe("desc")
			})

			it("pagination shows the range, pages with the buttons and changes the page size", async () => {
				mount(h.sortableTable({}, log))
				await h.settle()
				expect(range()).toBe("1–10 of 23")
				expect(rows().value).toBe("10")
				expect($('.omni-table-pagination label').textContent).toBe("Rows per page:")
				expect(Array.from(rows().options).map((o) => o.value)).toEqual(["5", "10", "25"])
				const previous = $('button[aria-label="Go to previous page"]') as HTMLButtonElement
				const next = $('button[aria-label="Go to next page"]') as HTMLButtonElement
				expect(previous.disabled).toBe(true)
				next.click()
				await h.settle()
				expect(events).toEqual(["page:1"])
				expect(range()).toBe("11–20 of 23")
				;($('button[aria-label="Go to next page"]') as HTMLButtonElement).click()
				await h.settle()
				expect(range()).toBe("21–23 of 23")
				expect(($('button[aria-label="Go to next page"]') as HTMLButtonElement).disabled).toBe(true)
				rows().value = "5"
				rows().dispatchEvent(new Event("change", { bubbles: true }))
				await h.settle()
				expect(events).toEqual(["page:1", "page:2", "rows:5"])
				expect(range()).toBe("1–5 of 23")
			})

			it("has no accessibility violations", async () => {
				mount(h.sortableTable({}, log))
				await h.settle()
				await expectAccessible("sortable table")
			})
		})

		describe("CardActionArea, AvatarGroup and List avatars", () => {
			const visible = (group: HTMLElement): string[] => Array.from(group.querySelectorAll<HTMLElement>(".omni-avatar")).filter((a) => !a.hidden).map((a) => a.textContent?.trim() ?? "")

			it("a CardActionArea is one button (or a link) around the card content", async () => {
				mount(h.cardsAndLists({}, log))
				await h.settle()
				const areas = $$(".omni-card__action-area")
				expect(areas[0]?.tagName).toBe("BUTTON")
				expect(areas[0]?.getAttribute("type")).toBe("button")
				expect(areas[0]?.textContent).toContain("Action card")
				areas[0]?.click()
				expect(events).toEqual(["click:area"])
				expect(areas[1]?.tagName).toBe("A")
				expect(areas[1]?.getAttribute("href")).toBe("/card")
			})

			it("an AvatarGroup shows at most `max` avatars, the last slot being +N", async () => {
				mount(h.cardsAndLists({}, log))
				await h.settle()
				const [first, second] = $$(".omni-avatar-group") as [HTMLElement, HTMLElement]
				expect(first.getAttribute("role")).toBe("group")
				expect(visible(first)).toEqual(["A", "B", "+3"])
				expect(visible(second)).toEqual(["A", "B", "+4"])
			})

			it("ListItemAvatar and alignItems", async () => {
				mount(h.cardsAndLists({}, log))
				await h.settle()
				const item = $("li.omni-list__item[data-align-items]")
				expect(item.dataset["alignItems"]).toBe("flex-start")
				expect(item.querySelector(".omni-list__avatar .omni-avatar")?.textContent).toBe("R")
				expect(item.querySelector(".omni-list__primary")?.textContent).toBe("Brunch")
				const button = $(".omni-list__button")
				expect(button.dataset["alignItems"]).toBe("flex-start")
				expect(button.querySelector(".omni-list__avatar")?.textContent).toBe("S")
			})

			it("has no accessibility violations", async () => {
				mount(h.cardsAndLists({}, log))
				await h.settle()
				await expectAccessible("cards and lists")
			})
		})

		describe("AccordionGroup", () => {
			const summary = (text: string): HTMLElement => byText("button.omni-accordion__summary", text)
			const open = (text: string): boolean => summary(text).getAttribute("aria-expanded") === "true"

			it("one panel is open at a time: opening another closes the first", async () => {
				mount(h.accordionGroup({}, log))
				await h.settle()
				expect([open("Alpha"), open("Beta"), open("Gamma")]).toEqual([true, false, false])
				summary("Beta").click()
				await h.settle()
				expect([open("Alpha"), open("Beta"), open("Gamma")]).toEqual([false, true, false])
				expect(events).toEqual(["change:b"])
				summary("Beta").click()
				await h.settle()
				expect([open("Alpha"), open("Beta"), open("Gamma")]).toEqual([false, false, false])
				expect(events).toEqual(["change:b", "change:"])
			})

			it("with `multiple` several stay open", async () => {
				mount(h.accordionGroup({ multiple: true }, log))
				await h.settle()
				summary("Beta").click()
				await h.settle()
				expect([open("Alpha"), open("Beta")]).toEqual([true, true])
				summary("Alpha").click()
				await h.settle()
				expect([open("Alpha"), open("Beta")]).toEqual([false, true])
				expect(events).toEqual(["change:a,b", "change:b"])
			})

			it("has no accessibility violations", async () => {
				mount(h.accordionGroup({}, log))
				await h.settle()
				await expectAccessible("accordion group")
			})
		})

		describe("Chip deleteIcon", () => {
			it("a custom icon replaces the cross and keeps the delete behaviour", async () => {
				mount(h.chipDeleteIcon({}, log))
				await h.settle()
				const chip = $(".omni-chip")
				const icon = chip.querySelector(".omni-chip__delete") as HTMLElement
				expect(icon.getAttribute("aria-hidden")).toBe("true")
				expect(icon.querySelector("svg[data-custom-delete]")).not.toBeNull()
				expect(chip.querySelectorAll(".omni-chip__delete")).toHaveLength(1)
				icon.querySelector("svg")?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
				expect(events).toEqual(["delete:custom"])
				keydown(chip, "Backspace")
				expect(events).toEqual(["delete:custom", "delete:custom"])
				await expectAccessible("chip with a custom delete icon")
			})
		})

		describe("Tooltip arrow, touch and rich content", () => {
			const tooltip = (): HTMLElement | null => document.querySelector<HTMLElement>('[role="tooltip"]')

			it("`arrow` adds a pointer inside the tooltip", async () => {
				const handle = mount(h.tooltip({}, log))
				await h.settle()
				await handle.set({ arrow: true })
				await h.settle()
				byText("button", "Save").dispatchEvent(new Event("pointerenter"))
				await h.settle()
				await wait(30)
				const arrow = (tooltip() as HTMLElement).querySelector(".omni-tooltip__arrow")
				expect(arrow?.hasAttribute("data-arrow")).toBe(true)
				expect(arrow?.getAttribute("aria-hidden")).toBe("true")
				expect((tooltip() as HTMLElement).textContent).toBe("Saves your work")
			})

			it("a held touch opens it and it closes a moment after the finger lifts; a quick tap does nothing", async () => {
				mount(h.tooltip({}, log))
				await h.settle()
				const save = byText("button", "Save")
				touch(save, "pointerdown")
				await wait(10)
				touch(save, "pointerup")
				await wait(60)
				await h.settle()
				expect(tooltip()).toBeNull()
				expect(events).toEqual([])
				touch(save, "pointerdown")
				await wait(60)
				await h.settle()
				expect(tooltip()?.textContent).toBe("Saves your work")
				expect(events).toEqual(["open"])
				touch(save, "pointerup")
				touch(save, "pointerleave")
				await wait(10)
				expect(events).toEqual(["open"])
				await wait(80)
				await h.settle()
				expect(events).toEqual(["open", "close"])
				await wait(250)
			})

			it("rich content (markup) is allowed in the tooltip", async () => {
				mount(h.richTooltip({}, log))
				await h.settle()
				byText("button", "Info").dispatchEvent(new Event("pointerenter"))
				await h.settle()
				await wait(30)
				await h.settle()
				const tip = tooltip() as HTMLElement
				expect(tip.querySelector("strong[data-rich]")?.textContent).toBe("Rich")
				expect(tip.textContent).toBe("Rich content")
				expect(byText("button", "Info").getAttribute("aria-describedby")).toBe(tip.id)
			})
		})

		describe("Accessibility (axe)", () => {
			it("button, link button and loading button", async () => {
				mount(h.button({ variant: "contained" }, log))
				mount(h.button({ href: "/docs" }, log))
				mount(h.button({ loading: true }, log))
				await h.settle()
				await expectAccessible("buttons")
			})

			it("text field, in its error and disabled states", async () => {
				const handle = mount(h.textField({}, log))
				await h.settle()
				await expectAccessible("text field")
				await handle.set({ error: true })
				await h.settle()
				await expectAccessible("text field in error")
				await handle.set({ disabled: true })
				await h.settle()
				await expectAccessible("disabled text field")
			})

			it("an open dialog", async () => {
				mount(h.dialog({}, log))
				await h.settle()
				byText("button", "Open").click()
				await h.settle()
				await expectAccessible("open dialog")
			})

			it("icon buttons, a button group and a toggle group", async () => {
				mount(h.iconButtons({}, log))
				mount(h.buttonGroup({}, log))
				const toggles = mount(h.toggleGroup({}, log))
				await h.settle()
				await expectAccessible("icon buttons, button group and toggle group")
				byText("button", "Bold").click()
				await h.settle()
				await expectAccessible("a pressed toggle button")
				await toggles.set({ exclusive: true })
				await h.settle()
				await expectAccessible("an exclusive toggle group")
			})

			it("a slider and a rating in each state", async () => {
				const slider = mount(h.slider({}, log))
				const rating = mount(h.rating({}, log))
				await h.settle()
				await expectAccessible("slider and rating")
				$$<HTMLInputElement>('input[type="radio"]')[2]?.click()
				await h.settle()
				await expectAccessible("rating after choosing")
				await rating.set({ readOnly: true })
				await h.settle()
				await expectAccessible("read-only rating")
				await slider.set({ disabled: true })
				await h.settle()
				await expectAccessible("disabled slider")
			})

			it("a range slider, horizontal and vertical", async () => {
				mount(h.rangeSlider({}, log))
				await h.settle()
				await expectAccessible("range slider")
			})

			it("a vertical range slider", async () => {
				mount(h.rangeSlider({ vertical: true }, log))
				await h.settle()
				await expectAccessible("vertical range slider")
			})

			it("a switch in each state", async () => {
				const handle = mount(h.switch({}, log))
				await h.settle()
				await expectAccessible("switch")
				$<HTMLInputElement>('input[role="switch"]').click()
				await h.settle()
				await expectAccessible("switch on")
				await handle.set({ error: true })
				await h.settle()
				await expectAccessible("switch in error")
				await handle.set({ disabled: true })
				await h.settle()
				await expectAccessible("disabled switch")
			})

			it("a checkbox in each state, and a radio group in each state", async () => {
				const checkbox = mount(h.checkbox({}, log))
				const group = mount(h.radioGroup({}, log))
				await h.settle()
				await expectAccessible("checkbox and radio group")
				await checkbox.set({ indeterminate: true })
				await group.set({ error: true })
				await h.settle()
				await expectAccessible("indeterminate checkbox, radio group in error")
				await checkbox.set({ disabled: true })
				await group.set({ disabled: true })
				await h.settle()
				await expectAccessible("disabled checkbox and radio group")
			})

			it("an open select with groups and custom option content", async () => {
				mount(h.selectGroups({}, log))
				await h.settle()
				$('[role="combobox"]').click()
				await h.settle()
				await new Promise((r) => setTimeout(r, 50))
				await expectAccessible("open select with groups")
			})

			it("a closed select, an open select, and a select in error", async () => {
				const combobox = (): HTMLElement => $('[role="combobox"]')
				const handle = mount(h.select({}, log))
				await h.settle()
				await expectAccessible("closed select")
				combobox().click()
				await h.settle()
				await new Promise((r) => setTimeout(r, 50))
				await expectAccessible("open select")
				keydown($('[role="listbox"]'), "Escape")
				await new Promise((r) => setTimeout(r, 250))
				await h.settle()
				await handle.set({ error: true })
				await h.settle()
				await expectAccessible("select in error")
				await handle.set({ disabled: true })
				await h.settle()
				await expectAccessible("disabled select")
			})

			it("an open menu", async () => {
				mount(h.menu({}, log))
				await h.settle()
				byText("button", "Menu").click()
				await h.settle()
				await new Promise((r) => setTimeout(r, 50))
				await expectAccessible("open menu")
			})

			it("tabs, with the first and another tab selected", async () => {
				mount(h.tabs({}, log))
				await h.settle()
				await expectAccessible("tabs")
				byText('[role="tab"]', "Three").click()
				await h.settle()
				await expectAccessible("tabs after selecting")
			})
		})

		describe("Tabs", () => {
			it("is an accessible tab list: roles, selection, roving tabindex and tab-to-panel links", async () => {
				mount(h.tabs({}, log))
				await h.settle()
				const list = $('[role="tablist"]')
				expect(list.getAttribute("aria-label")).toBe("Sections")
				expect(list.getAttribute("aria-orientation")).toBe("horizontal")
				const [one, two, three] = $$('[role="tab"]') as [HTMLElement, HTMLElement, HTMLElement]
				expect([one, two, three].map((t) => t.textContent?.trim())).toEqual(["One", "Two", "Three"])
				expect(one.getAttribute("aria-selected")).toBe("true")
				expect(three.getAttribute("aria-selected")).toBe("false")
				expect(one.getAttribute("tabindex")).toBe("0")
				expect(three.getAttribute("tabindex")).toBe("-1")
				expect(two.getAttribute("aria-disabled")).toBe("true")
				const panel = $('[role="tabpanel"]')
				expect(panel.id).toBe(one.getAttribute("aria-controls"))
				expect(panel.getAttribute("aria-labelledby")).toBe(one.id)
				expect(panel.textContent).toContain("First panel")
				expect(document.body.textContent).not.toContain("Third panel")
			})

			it("selects on click (not a disabled tab) and shows that panel", async () => {
				mount(h.tabs({}, log))
				await h.settle()
				byText('[role="tab"]', "Two").click()
				expect(events).toEqual([])
				byText('[role="tab"]', "Three").click()
				await h.settle()
				expect(events).toEqual(["change:three"])
				expect(byText('[role="tab"]', "Three").getAttribute("aria-selected")).toBe("true")
				expect(document.body.textContent).toContain("Third panel")
				expect(document.body.textContent).not.toContain("First panel")
			})

			it("arrow keys move focus (skipping the disabled tab, wrapping) without selecting", async () => {
				mount(h.tabs({}, log))
				await h.settle()
				const [one, , three] = $$('[role="tab"]') as [HTMLElement, HTMLElement, HTMLElement]
				one.focus()
				keydown(one, "ArrowRight")
				expect(document.activeElement).toBe(three)
				keydown(three, "ArrowRight")
				expect(document.activeElement).toBe(one)
				keydown(one, "End")
				expect(document.activeElement).toBe(three)
				keydown(three, "Home")
				expect(document.activeElement).toBe(one)
				expect(events).toEqual([])
			})

			it("selectionFollowsFocus selects as focus moves", async () => {
				mount(h.tabs({ selectionFollowsFocus: true }, log))
				await h.settle()
				const [one] = $$('[role="tab"]') as [HTMLElement]
				one.focus()
				keydown(one, "ArrowRight")
				await h.settle()
				expect(events).toEqual(["change:three"])
			})
			it("surfaces, avatars, badges and icons", async () => {
				const surfaces = mount(h.surfaces({}, log))
				mount(h.badges({}, log))
				await h.settle()
				await expectAccessible("surfaces, avatars, badges and icons")
				await surfaces.set({ raised: true })
				await h.settle()
				await expectAccessible("raised card")
			})

			it("a list and a table", async () => {
				mount(h.list({ dense: true }, log))
				mount(h.table({ size: "small" }, log))
				await h.settle()
				await expectAccessible("list and table")
			})

			it("chips, in each state", async () => {
				const handle = mount(h.chips({}, log))
				await h.settle()
				await expectAccessible("chips")
				await handle.set({ disabled: true })
				await h.settle()
				await expectAccessible("disabled chips")
			})

			it("accordions, closed and open", async () => {
				const handle = mount(h.accordions({}, log))
				await h.settle()
				await expectAccessible("closed accordions")
				byText("button.omni-accordion__summary", "First question").click()
				byText("button.omni-accordion__summary", "Second question").click()
				await h.settle()
				await expectAccessible("open accordions")
				await handle.set({ disabled: true })
				await h.settle()
				await expectAccessible("disabled accordion")
			})

			it("an open tooltip", async () => {
				mount(h.tooltip({}, log))
				await h.settle()
				byText("button", "Save").dispatchEvent(new Event("pointerenter"))
				await h.settle()
				await new Promise((r) => setTimeout(r, 30))
				await expectAccessible("open tooltip")
			})
		})
	})
}
