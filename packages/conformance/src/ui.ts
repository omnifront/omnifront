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
	 * A Select labelled "Fruit" with options "Apple", "Banana" (disabled) and "Cherry", helper text
	 * "Pick one", chosen value held by the host (starts empty). Logs `change:<value>`, and
	 * `close:<reason>` when the list closes.
	 */
	select(props: { error?: boolean; disabled?: boolean }, log: (event: string) => void): UiHandle
	/**
	 * Tabs labelled "Sections": "One", "Two" (disabled), "Three", with panels "First panel",
	 * "Second panel", "Third panel", controlled by the host. Logs `change:<value>`.
	 */
	tabs(props: { selectionFollowsFocus?: boolean }, log: (event: string) => void): UiHandle
	/** Wait until the framework has applied pending updates and effects. */
	settle(): Promise<void>
}

const $ = <T extends Element = HTMLElement>(selector: string): T => document.querySelector(selector) as T
const $$ = <T extends Element = HTMLElement>(selector: string): T[] => Array.from(document.querySelectorAll<T>(selector))
const byText = (selector: string, text: string): HTMLElement =>
	$$(selector).find((el) => el.textContent?.trim() === text) as HTMLElement
const keydown = (el: Element, key: string): void => void el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }))
const pointerdown = (el: Element): void => void el.dispatchEvent(new Event("pointerdown", { bubbles: true }))
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
		})
	})
}
