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
	 * Logs `open` and `close`. `title` can be changed (`""` turns the tooltip off).
	 */
	tooltip(props: { title?: string }, log: (event: string) => void): UiHandle
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
