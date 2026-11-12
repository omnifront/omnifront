import { FakeScheduler } from "@omnifront/core/testing"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createDialog } from "../src"

afterEach(() => {
	document.body.innerHTML = ""
	document.body.removeAttribute("style")
})

const key = (key: string, init: KeyboardEventInit = {}): KeyboardEvent => new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init })

describe("Dialog state", () => {
	it("starts closed, opens and closes itself when uncontrolled", () => {
		const dialog = createDialog({ id: "d", exitDuration: 0 })
		const listener = vi.fn()
		dialog.subscribe(listener)
		expect(dialog.getSnapshot()).toEqual({ id: "d", open: false, mounted: false, status: "closed" })
		dialog.show()
		expect(dialog.getSnapshot()).toMatchObject({ open: true, mounted: true, status: "open" })
		dialog.toggle()
		expect(dialog.getSnapshot().open).toBe(false)
		expect(listener).toHaveBeenCalledTimes(2)
	})

	it("keeps the snapshot reference while nothing changes", () => {
		const dialog = createDialog({ id: "d", exitDuration: 0 })
		const first = dialog.getSnapshot()
		dialog.setProps({ label: "x" })
		expect(dialog.getSnapshot()).toBe(first)
	})

	it("controlled: only asks, the parent decides", () => {
		const onOpenChange = vi.fn()
		const dialog = createDialog({ id: "d", open: false, onOpenChange, exitDuration: 0 })
		dialog.show()
		expect(onOpenChange).toHaveBeenCalledWith(true, "programmatic", undefined)
		expect(dialog.getSnapshot().open).toBe(false)
		dialog.setProps({ open: true })
		expect(dialog.getSnapshot().open).toBe(true)
		dialog.hide("closeButton")
		expect(onOpenChange).toHaveBeenLastCalledWith(false, "closeButton", undefined)
		expect(dialog.getSnapshot().open).toBe(true)
	})

	it("defaultOpen starts open and a request to the same state is ignored", () => {
		const onOpenChange = vi.fn()
		const dialog = createDialog({ id: "d", defaultOpen: true, onOpenChange })
		expect(dialog.getSnapshot().open).toBe(true)
		dialog.show()
		expect(onOpenChange).not.toHaveBeenCalled()
	})

	it("stays mounted for the exit animation, then unmounts", () => {
		const scheduler = new FakeScheduler()
		const dialog = createDialog({ id: "d", open: true, scheduler })
		dialog.setProps({ open: false })
		expect(dialog.getSnapshot()).toMatchObject({ open: false, mounted: true, status: "closing" })
		scheduler.advance(194)
		expect(dialog.getSnapshot().mounted).toBe(true)
		scheduler.advance(1)
		expect(dialog.getSnapshot()).toMatchObject({ mounted: false, status: "closed" })
	})

	it("reopening during the exit animation cancels it", () => {
		const scheduler = new FakeScheduler()
		const dialog = createDialog({ id: "d", open: true, scheduler, exitDuration: 100 })
		dialog.setProps({ open: false })
		dialog.setProps({ open: true })
		scheduler.advance(500)
		expect(dialog.getSnapshot()).toMatchObject({ open: true, mounted: true, status: "open" })
	})

	it("dispose clears a pending exit timer", () => {
		const scheduler = new FakeScheduler()
		const dialog = createDialog({ id: "d", open: true, scheduler, exitDuration: 100 })
		const listener = vi.fn()
		dialog.subscribe(listener)
		dialog.setProps({ open: false })
		listener.mockClear()
		dialog.dispose()
		scheduler.advance(500)
		expect(listener).not.toHaveBeenCalled()
	})
})

describe("Dialog parts", () => {
	it("link the dialog, its title and its description with ids and roles", () => {
		const parts = createDialog({ id: "d", defaultOpen: true }).connect()
		expect(parts.content.attrs).toMatchObject({
			id: "d-content",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "d-title",
			"aria-describedby": "d-description",
			tabindex: -1,
			"data-state": "open",
		})
		expect(parts.title.attrs.id).toBe("d-title")
		expect(parts.description.attrs.id).toBe("d-description")
		expect(parts.backdrop.attrs["aria-hidden"]).toBe("true")
	})

	it("label replaces aria-labelledby; alertdialog and non-modal are respected", () => {
		const { content } = createDialog({ id: "d", label: "Delete?", role: "alertdialog", modal: false }).connect()
		expect(content.attrs).toMatchObject({ role: "alertdialog", "aria-label": "Delete?", "aria-labelledby": undefined, "aria-modal": undefined })
	})

	it("Escape closes, unless disabled", () => {
		const onOpenChange = vi.fn()
		const dialog = createDialog({ id: "d", open: true, onOpenChange })
		dialog.connect().container.on.keydown?.(key("Escape"))
		expect(onOpenChange).toHaveBeenCalledWith(false, "escapeKeyDown", expect.anything())
		onOpenChange.mockClear()
		dialog.connect().container.on.keydown?.(key("a"))
		dialog.setProps({ closeOnEscape: false })
		dialog.connect().container.on.keydown?.(key("Escape"))
		expect(onOpenChange).not.toHaveBeenCalled()
	})

	it("a click on the empty area closes; a click that bubbled from the paper does not", () => {
		const onOpenChange = vi.fn()
		const dialog = createDialog({ id: "d", open: true, onOpenChange })
		const container = document.createElement("div")
		const paper = document.createElement("div")
		container.append(paper)
		const click = (target: Element): void => {
			const event = new MouseEvent("click", { bubbles: true })
			Object.defineProperty(event, "currentTarget", { value: container })
			Object.defineProperty(event, "target", { value: target })
			dialog.connect().container.on.click?.(event)
		}
		click(paper)
		expect(onOpenChange).not.toHaveBeenCalled()
		click(container)
		expect(onOpenChange).toHaveBeenCalledWith(false, "backdropClick", expect.anything())
		onOpenChange.mockClear()
		dialog.setProps({ closeOnBackdropClick: false })
		click(container)
		expect(onOpenChange).not.toHaveBeenCalled()
	})

	it("the close trigger closes", () => {
		const onOpenChange = vi.fn()
		const dialog = createDialog({ id: "d", open: true, onOpenChange })
		const { closeTrigger } = dialog.connect()
		expect(closeTrigger.attrs).toMatchObject({ type: "button", "aria-label": "Close" })
		closeTrigger.on.click?.(new MouseEvent("click"))
		expect(onOpenChange).toHaveBeenCalledWith(false, "closeButton", expect.anything())
	})
})

describe("Dialog attach", () => {
	function setup(extra: Record<string, unknown> = {}) {
		document.body.innerHTML = `<main id="page"><button id="opener">open</button></main>`
		const opener = document.getElementById("opener") as HTMLButtonElement
		opener.focus()
		const container = document.createElement("div")
		container.innerHTML = `<div id="paper" tabindex="-1"><button id="first">a</button><button id="last">b</button></div>`
		const portal = document.createElement("div")
		portal.append(container)
		document.body.append(portal)
		const dialog = createDialog({ id: "d", defaultOpen: true, exitDuration: 0, ...extra })
		const paper = container.querySelector("#paper") as HTMLElement
		return { dialog, opener, container, paper, first: container.querySelector("#first") as HTMLElement, last: container.querySelector("#last") as HTMLElement }
	}

	it("moves focus in, locks scroll, hides the page from screen readers, then undoes all of it", () => {
		const { dialog, opener, container, paper, first } = setup()
		const detach = dialog.attach({ content: paper, container })
		expect(document.activeElement).toBe(first)
		expect(document.body.style.overflow).toBe("hidden")
		expect(document.getElementById("page")?.getAttribute("aria-hidden")).toBe("true")
		detach()
		expect(document.body.style.overflow).toBe("")
		expect(document.getElementById("page")?.hasAttribute("aria-hidden")).toBe(false)
		expect(document.activeElement).toBe(opener)
	})

	it("Tab wraps inside the dialog", () => {
		const { dialog, container, paper, first, last } = setup()
		dialog.attach({ content: paper, container })
		last.focus()
		const forward = key("Tab")
		container.dispatchEvent(forward)
		expect(forward.defaultPrevented).toBe(true)
		expect(document.activeElement).toBe(first)
		const backward = key("Tab", { shiftKey: true })
		container.dispatchEvent(backward)
		expect(document.activeElement).toBe(last)
	})

	it("pulls focus back when it leaves", () => {
		const { dialog, opener, container, paper, first } = setup()
		dialog.attach({ content: paper, container })
		opener.focus()
		expect(document.activeElement).toBe(first)
	})

	it("only the top dialog reacts to Escape", () => {
		const outer = setup()
		const onOuter = vi.fn()
		outer.dialog.setProps({ onOpenChange: onOuter })
		outer.dialog.attach({ content: outer.paper, container: outer.container })
		const inner = createDialog({ id: "inner", defaultOpen: true, exitDuration: 0 })
		const innerPaper = document.createElement("div")
		document.body.append(innerPaper)
		inner.attach({ content: innerPaper })
		outer.dialog.connect().container.on.keydown?.(key("Escape"))
		expect(onOuter).not.toHaveBeenCalled()
	})

	it("a non-modal dialog does not lock scroll or hide the page", () => {
		const { dialog, container, paper } = setup({ modal: false })
		const detach = dialog.attach({ content: paper, container })
		expect(document.body.style.overflow).toBe("")
		expect(document.getElementById("page")?.hasAttribute("aria-hidden")).toBe(false)
		detach()
	})

	it("does not steal focus back when the old element is gone", () => {
		const { dialog, opener, container, paper } = setup()
		const detach = dialog.attach({ content: paper, container })
		opener.remove()
		expect(() => detach()).not.toThrow()
	})
})
