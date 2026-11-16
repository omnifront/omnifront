import { describe, expect, it, vi } from "vitest"
import type { Scheduler } from "@omnifront/core"
import {
	appBarPart,
	avatarPart,
	badgeMarkPart,
	badgeState,
	cardPart,
	createAccordion,
	createChip,
	createTooltip,
	displayPart,
	dividerPart,
	paperPart,
	svgIconPart,
	typographyPart,
	typographyTag,
} from "../src"

/** A scheduler whose timers run when the test says so. */
function manualScheduler() {
	const timers = new Map<number, { fn: () => void; at: number }>()
	let now = 0
	let id = 0
	const scheduler: Scheduler = {
		setTimeout: (fn, ms) => {
			timers.set(++id, { fn, at: now + ms })
			return id
		},
		clearTimeout: (h) => void timers.delete(h as number),
	} as Scheduler
	return {
		scheduler,
		advance(ms: number) {
			now += ms
			for (const [h, t] of [...timers]) if (t.at <= now) { timers.delete(h); t.fn() }
		},
	}
}

describe("display parts", () => {
	it("displayPart turns options into data attributes", () => {
		expect(displayPart("omni-x", { a: true, b: false, c: undefined, fooBar: "y", n: 3 }).attrs).toEqual({ class: "omni-x", "data-a": "", "data-foo-bar": "y", "data-n": "3" })
	})

	it("Typography picks a tag per variant and maps colours", () => {
		expect(typographyTag("h3")).toBe("h3")
		expect(typographyTag("subtitle1")).toBe("h6")
		expect(typographyTag("body2")).toBe("p")
		expect(typographyTag("caption")).toBe("span")
		expect(typographyTag("h1", true)).toBe("p")
		expect(typographyPart({ variant: "h4", color: "text.secondary", gutterBottom: true, align: "center" }).attrs).toEqual({
			class: "omni-typography",
			"data-variant": "h4",
			"data-align": "center",
			"data-color": "text-secondary",
			"data-gutter-bottom": "",
		})
	})

	it("Paper clamps elevation; outlined has none; Card is a Paper", () => {
		expect(paperPart({ elevation: 99 }).attrs["data-elevation"]).toBe("24")
		expect(paperPart().attrs["data-elevation"]).toBe("1")
		expect(paperPart({ variant: "outlined" }).attrs["data-elevation"]).toBeUndefined()
		expect(cardPart({ raised: true }).attrs).toMatchObject({ class: "omni-paper omni-card", "data-elevation": "8" })
	})

	it("Divider: hr by default, role=separator for li, vertical orientation named", () => {
		expect(dividerPart().attrs).toMatchObject({ class: "omni-divider", "data-orientation": "horizontal" })
		expect(dividerPart().attrs.role).toBeUndefined()
		expect(dividerPart({ as: "li", orientation: "vertical" }).attrs).toMatchObject({ role: "separator", "aria-orientation": "vertical" })
		expect(dividerPart({ as: "div", withText: true, textAlign: "left" }).attrs).toMatchObject({ role: "separator", "data-with-text": "", "data-text-align": "left" })
	})

	it("Badge: caps the number, hides zero and empty, dot always shows", () => {
		expect(badgeState({ badgeContent: 4 })).toEqual({ text: "4", invisible: false })
		expect(badgeState({ badgeContent: 120 })).toEqual({ text: "99+", invisible: false })
		expect(badgeState({ badgeContent: 120, max: 999 }).text).toBe("120")
		expect(badgeState({ badgeContent: 0 }).invisible).toBe(true)
		expect(badgeState({ badgeContent: 0, showZero: true })).toEqual({ text: "0", invisible: false })
		expect(badgeState({}).invisible).toBe(true)
		expect(badgeState({ variant: "dot" })).toEqual({ text: "", invisible: false })
		expect(badgeState({ variant: "dot", invisible: true }).invisible).toBe(true)
		expect(badgeMarkPart({ badgeContent: 0, anchorOrigin: { vertical: "bottom", horizontal: "left" } }).attrs).toMatchObject({ "data-invisible": "", "data-anchor": "bottom-left", "aria-hidden": "true" })
	})

	it("SvgIcon is decorative unless it has a title", () => {
		expect(svgIconPart().attrs).toMatchObject({ "aria-hidden": "true", focusable: "false", viewBox: "0 0 24 24" })
		expect(svgIconPart({ titleAccess: "Home" }).attrs).toMatchObject({ role: "img", "aria-label": "Home" })
		expect(svgIconPart({ titleAccess: "Home" }).attrs["aria-hidden"]).toBeUndefined()
	})

	it("Avatar and AppBar carry their options", () => {
		expect(avatarPart({ variant: "rounded" }).attrs["data-variant"]).toBe("rounded")
		expect(appBarPart().attrs).toMatchObject({ "data-position": "fixed", "data-color": "primary", "data-elevation": "4" })
	})
})

describe("Chip", () => {
	const key = (type: string, k: string, target?: object): Event => {
		const el = document.createElement("div")
		document.body.append(el)
		const event = new KeyboardEvent(type, { key: k, bubbles: true, cancelable: true })
		Object.defineProperty(event, "currentTarget", { value: el })
		Object.defineProperty(event, "target", { value: target ?? el })
		return event
	}

	it("a plain chip has no role and is not focusable", () => {
		const root = createChip().connect().root.attrs
		expect(root.role).toBeUndefined()
		expect(root.tabindex).toBeUndefined()
	})

	it("clickable: a button in the Tab order; Enter clicks, Space clicks on key up", () => {
		const chip = createChip({ clickable: true })
		const { root } = chip.connect()
		expect(root.attrs).toMatchObject({ role: "button", tabindex: 0 })
		const enter = key("keydown", "Enter")
		const click = vi.fn()
		;(enter.currentTarget as HTMLElement).addEventListener("click", click)
		root.on.keydown?.(enter)
		expect(click).toHaveBeenCalledTimes(1)
		const space = key("keydown", " ")
		;(space.currentTarget as HTMLElement).addEventListener("click", click)
		root.on.keydown?.(space)
		expect(click).toHaveBeenCalledTimes(1) // not yet
		const up = key("keyup", " ")
		;(up.currentTarget as HTMLElement).addEventListener("click", click)
		root.on.keyup?.(up)
		expect(click).toHaveBeenCalledTimes(2)
	})

	it("deletable: Backspace and Delete call onDelete; so does the icon, without reaching the chip", () => {
		const onDelete = vi.fn()
		const chip = createChip({ deletable: true, onDelete })
		const { root, deleteIcon } = chip.connect()
		expect(root.attrs).toMatchObject({ tabindex: 0, "aria-keyshortcuts": "Backspace Delete" })
		root.on.keydown?.(key("keydown", "Backspace"))
		root.on.keydown?.(key("keydown", "Delete"))
		expect(onDelete).toHaveBeenCalledTimes(2)
		const click = new Event("click", { cancelable: true })
		const stop = vi.spyOn(click, "stopPropagation")
		deleteIcon.on.click?.(click)
		expect(onDelete).toHaveBeenCalledTimes(3)
		expect(stop).toHaveBeenCalled()
	})

	it("ignores keys from inside, and everything when disabled", () => {
		const onDelete = vi.fn()
		const chip = createChip({ deletable: true, onDelete })
		chip.connect().root.on.keydown?.(key("keydown", "Backspace", document.createElement("input")))
		expect(onDelete).not.toHaveBeenCalled()
		chip.setProps({ disabled: true })
		const { root, deleteIcon } = chip.connect()
		expect(root.attrs).toMatchObject({ "data-disabled": "" })
		expect(root.attrs.tabindex).toBeUndefined()
		root.on.keydown?.(key("keydown", "Backspace"))
		deleteIcon.on.click?.(new Event("click"))
		expect(onDelete).not.toHaveBeenCalled()
	})
})

describe("Accordion", () => {
	it("uncontrolled: toggles, announces through aria-expanded and aria-controls", () => {
		const onExpandedChange = vi.fn()
		const a = createAccordion({ id: "acc", onExpandedChange })
		expect(a.getSnapshot().expanded).toBe(false)
		expect(a.connect().trigger.attrs).toMatchObject({ id: "acc-trigger", "aria-expanded": "false", "aria-controls": "acc-region" })
		expect(a.connect().region.attrs).toMatchObject({ id: "acc-region", role: "region", "aria-labelledby": "acc-trigger", "data-state": "closed" })
		a.connect().trigger.on.click?.(new Event("click"))
		expect(a.getSnapshot().expanded).toBe(true)
		expect(onExpandedChange).toHaveBeenCalledWith(true, expect.any(Event))
		expect(a.connect().trigger.attrs["aria-expanded"]).toBe("true")
	})

	it("controlled: only asks; disabled ignores clicks", () => {
		const onExpandedChange = vi.fn()
		const a = createAccordion({ id: "acc", expanded: false, onExpandedChange })
		a.toggle()
		expect(onExpandedChange).toHaveBeenCalledWith(true, undefined)
		expect(a.getSnapshot().expanded).toBe(false)
		a.setProps({ expanded: true, disabled: true })
		a.toggle()
		expect(onExpandedChange).toHaveBeenCalledTimes(1)
		expect(a.connect().trigger.attrs["aria-disabled"]).toBe("true")
	})
})

describe("Tooltip", () => {
	it("opens after the enter delay on pointer, at once on keyboard focus, closes on leave, blur and Escape", () => {
		const clock = manualScheduler()
		const tip = createTooltip({ id: "t", scheduler: clock.scheduler })
		const trigger = document.createElement("button")
		document.body.append(trigger)
		const detach = tip.attachTrigger(trigger)
		trigger.dispatchEvent(new Event("pointerenter"))
		expect(tip.getSnapshot().open).toBe(false)
		clock.advance(100)
		expect(tip.getSnapshot().open).toBe(true)
		expect(trigger.getAttribute("aria-describedby")).toBe("t")
		trigger.dispatchEvent(new Event("pointerleave"))
		expect(tip.getSnapshot().open).toBe(false)
		expect(tip.getSnapshot().mounted).toBe(true) // exit animation
		clock.advance(200)
		expect(tip.getSnapshot().mounted).toBe(false)
		expect(trigger.hasAttribute("aria-describedby")).toBe(false)

		// jsdom does not say which focus is "visible": stand in for the browser's keyboard-focus answer
		vi.spyOn(trigger, "matches").mockImplementation((selector) => selector === ":focus-visible")
		trigger.dispatchEvent(new Event("focus"))
		expect(tip.getSnapshot().open).toBe(true)
		trigger.dispatchEvent(new Event("blur"))
		expect(tip.getSnapshot().open).toBe(false)

		tip.show()
		const tooltip = document.createElement("div")
		document.body.append(tooltip)
		const stop = tip.attach({ trigger, tooltip })
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
		expect(tip.getSnapshot().open).toBe(false)
		stop()
		detach()
	})

	it("stays open while the pointer is on the tooltip itself; disableInteractive closes at once", () => {
		const clock = manualScheduler()
		const tip = createTooltip({ id: "t", scheduler: clock.scheduler, leaveDelay: 50, defaultOpen: true })
		const trigger = document.createElement("button")
		tip.attachTrigger(trigger)
		trigger.dispatchEvent(new Event("pointerleave"))
		tip.connect().tooltip.on.pointerenter?.(new Event("pointerenter"))
		clock.advance(60)
		expect(tip.getSnapshot().open).toBe(true)
		tip.connect().tooltip.on.pointerleave?.(new Event("pointerleave"))
		clock.advance(60)
		expect(tip.getSnapshot().open).toBe(false)

		const flat = createTooltip({ id: "u", scheduler: clock.scheduler, disableInteractive: true, defaultOpen: true })
		flat.connect().tooltip.on.pointerleave?.(new Event("pointerleave"))
		expect(flat.getSnapshot().open).toBe(true)
	})

	it("ignores touch and does nothing when disabled; keeps other describedby ids", () => {
		const clock = manualScheduler()
		const tip = createTooltip({ id: "t", scheduler: clock.scheduler })
		const trigger = document.createElement("button")
		trigger.setAttribute("aria-describedby", "hint")
		tip.attachTrigger(trigger)
		const touch = Object.assign(new Event("pointerenter"), { pointerType: "touch" })
		trigger.dispatchEvent(touch)
		clock.advance(500)
		expect(tip.getSnapshot().open).toBe(false)
		tip.show()
		expect(trigger.getAttribute("aria-describedby")).toBe("hint t")
		tip.hide()
		clock.advance(200)
		expect(trigger.getAttribute("aria-describedby")).toBe("hint")
		tip.setProps({ disabled: true })
		trigger.dispatchEvent(new Event("pointerenter"))
		clock.advance(500)
		expect(tip.getSnapshot().open).toBe(false)
	})
})
