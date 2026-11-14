import { FakeScheduler } from "@omnifront/core/testing"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createMenu } from "../src"

afterEach(() => {
	document.body.innerHTML = ""
})

const keydown = (el: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent => {
	const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init })
	el.dispatchEvent(event)
	return event
}

function mount(props: Parameters<typeof createMenu>[0] = { id: "m" }) {
	document.body.innerHTML = `<button id="btn">menu</button>`
	const anchor = document.getElementById("btn") as HTMLElement
	anchor.focus()
	const menu = createMenu({ defaultOpen: true, exitDuration: 0, ...props })
	const list = document.createElement("ul")
	const parts = menu.connect()
	list.addEventListener("keydown", parts.content.on.keydown as EventListener)
	const entries = [
		{ label: "Apple" },
		{ label: "Banana", disabled: true },
		{ label: "Blueberry" },
		{ label: "Cherry" },
	]
	const onSelect = vi.fn()
	for (const entry of entries) {
		const li = document.createElement("li")
		const p = menu.item({ disabled: entry.disabled, onSelect })
		for (const [k, v] of Object.entries(p.attrs)) if (v !== undefined) li.setAttribute(k, String(v))
		li.textContent = entry.label
		li.addEventListener("click", p.on.click as EventListener)
		list.append(li)
	}
	document.body.append(list)
	const items = Array.from(list.children) as HTMLElement[]
	return { menu, anchor, list, items, onSelect }
}

describe("Menu", () => {
	it("trigger and content carry the aria wiring", () => {
		const menu = createMenu({ id: "m" })
		expect(menu.connect().trigger.attrs).toMatchObject({ id: "m-trigger", "aria-haspopup": "menu", "aria-expanded": "false", "aria-controls": undefined })
		menu.show()
		const { trigger, content, separator } = menu.connect()
		expect(trigger.attrs).toMatchObject({ "aria-expanded": "true", "aria-controls": "m-menu" })
		expect(content.attrs).toMatchObject({ id: "m-menu", role: "menu", "aria-labelledby": "m-trigger", "data-state": "open" })
		expect(separator.attrs.role).toBe("separator")
	})

	it("the trigger toggles on click and opens on ArrowDown / ArrowUp", () => {
		const menu = createMenu({ id: "m", exitDuration: 0 })
		const { trigger } = menu.connect()
		trigger.on.click?.(new MouseEvent("click"))
		expect(menu.getSnapshot().open).toBe(true)
		trigger.on.click?.(new MouseEvent("click"))
		expect(menu.getSnapshot().open).toBe(false)
		const down = new KeyboardEvent("keydown", { key: "ArrowDown", cancelable: true })
		trigger.on.keydown?.(down)
		expect(menu.getSnapshot().open).toBe(true)
		expect(down.defaultPrevented).toBe(true)
		menu.hide()
		trigger.on.keydown?.(new KeyboardEvent("keydown", { key: "ArrowUp" }))
		expect(menu.getSnapshot().open).toBe(true)
		menu.hide()
		trigger.on.keydown?.(new KeyboardEvent("keydown", { key: "x" }))
		expect(menu.getSnapshot().open).toBe(false)
	})

	it("focuses the first enabled item on open and gives focus back on close", () => {
		const { menu, anchor, list, items } = mount()
		const detach = menu.attach({ content: list, anchor })
		expect(document.activeElement).toBe(items[0])
		detach()
		expect(document.activeElement).toBe(anchor)
	})

	it("focuses the menu itself when it has no items, or when autoFocus is off", () => {
		document.body.innerHTML = `<ul id="empty" tabindex="-1"></ul>`
		const empty = document.getElementById("empty") as HTMLElement
		createMenu({ id: "m" }).attach({ content: empty })
		expect(document.activeElement).toBe(empty)
		const { menu, list, anchor } = mount({ id: "m", autoFocus: false })
		menu.attach({ content: list, anchor })
		expect(document.activeElement).toBe(anchor)
	})

	it("arrow keys, Home and End move real focus, skipping disabled items and wrapping", () => {
		const { menu, list, items } = mount()
		menu.attach({ content: list })
		const [apple, , blueberry, cherry] = items as [HTMLElement, HTMLElement, HTMLElement, HTMLElement]
		keydown(apple, "ArrowDown")
		expect(document.activeElement).toBe(blueberry)
		keydown(blueberry, "ArrowDown")
		expect(document.activeElement).toBe(cherry)
		keydown(cherry, "ArrowDown")
		expect(document.activeElement).toBe(apple)
		keydown(apple, "ArrowUp")
		expect(document.activeElement).toBe(cherry)
		keydown(cherry, "Home")
		expect(document.activeElement).toBe(apple)
		keydown(apple, "End")
		expect(document.activeElement).toBe(cherry)
	})

	it("ArrowUp with nothing focused goes to the last item", () => {
		const { menu, list, items, anchor } = mount({ id: "m", autoFocus: false })
		menu.attach({ content: list, anchor })
		keydown(list, "ArrowUp")
		expect(document.activeElement).toBe(items[3])
	})

	it("type-ahead jumps to a matching item and builds a prefix while typing fast", () => {
		const scheduler = new FakeScheduler()
		const { menu, list, items } = mount({ id: "m", scheduler })
		menu.attach({ content: list })
		keydown(items[0] as HTMLElement, "c")
		expect(document.activeElement).toBe(items[3])
		scheduler.advance(600) // a pause starts a new prefix
		keydown(items[3] as HTMLElement, "b")
		expect(document.activeElement).toBe(items[2]) // Banana is disabled, Blueberry matches
		scheduler.advance(100)
		keydown(items[2] as HTMLElement, "l")
		expect(document.activeElement).toBe(items[2]) // "bl"
		scheduler.advance(800)
		keydown(items[2] as HTMLElement, "z") // no match: focus stays
		expect(document.activeElement).toBe(items[2])
		const ctrl = keydown(items[2] as HTMLElement, "a", { ctrlKey: true })
		expect(ctrl.defaultPrevented).toBe(false)
	})

	it("Enter and Space activate the focused item, which selects and closes", () => {
		const onOpenChange = vi.fn()
		const { menu, list, items, onSelect } = mount({ id: "m", onOpenChange, open: true })
		menu.attach({ content: list })
		const enter = keydown(items[0] as HTMLElement, "Enter")
		expect(enter.defaultPrevented).toBe(true)
		expect(onSelect).toHaveBeenCalledTimes(1)
		expect(onOpenChange).toHaveBeenCalledWith(false, "select", expect.anything())
		keydown(items[0] as HTMLElement, " ")
		expect(onSelect).toHaveBeenCalledTimes(2)
	})

	it("a disabled item neither selects nor closes; closeOnSelect false keeps it open", () => {
		const onOpenChange = vi.fn()
		const menu = createMenu({ id: "m", open: true, onOpenChange })
		menu.item({ disabled: true }).on.click?.(new MouseEvent("click"))
		expect(onOpenChange).not.toHaveBeenCalled()
		const onSelect = vi.fn()
		menu.item({ closeOnSelect: false, onSelect }).on.click?.(new MouseEvent("click"))
		expect(onSelect).toHaveBeenCalled()
		expect(onOpenChange).not.toHaveBeenCalled()
		expect(menu.item({ disabled: true }).attrs).toMatchObject({ "aria-disabled": "true", "data-disabled": "" })
		expect(menu.item().attrs).toMatchObject({ role: "menuitem", tabindex: -1, "aria-disabled": undefined })
	})

	it("Escape and Tab close; Escape in a lower menu is ignored", () => {
		const onOpenChange = vi.fn()
		const { menu, list, items } = mount({ id: "m", onOpenChange, open: true })
		menu.attach({ content: list })
		keydown(items[0] as HTMLElement, "Escape")
		expect(onOpenChange).toHaveBeenLastCalledWith(false, "escapeKeyDown", expect.anything())
		const tab = keydown(items[0] as HTMLElement, "Tab")
		expect(tab.defaultPrevented).toBe(true)
		expect(onOpenChange).toHaveBeenLastCalledWith(false, "tab", expect.anything())
		onOpenChange.mockClear()
		const upper = createMenu({ id: "u", defaultOpen: true })
		upper.attach({ content: document.createElement("ul") })
		keydown(items[0] as HTMLElement, "Escape")
		expect(onOpenChange).not.toHaveBeenCalled()
	})

	it("a keydown with no items does nothing", () => {
		document.body.innerHTML = `<ul id="e"></ul>`
		const empty = document.getElementById("e") as HTMLElement
		const menu = createMenu({ id: "m", defaultOpen: true })
		empty.addEventListener("keydown", menu.connect().content.on.keydown as EventListener)
		expect(keydown(empty, "ArrowDown").defaultPrevented).toBe(false)
	})

	it("closes on a press outside, but not on the menu or its anchor", () => {
		const onOpenChange = vi.fn()
		const { menu, list, anchor } = mount({ id: "m", onOpenChange, open: true })
		document.body.insertAdjacentHTML("beforeend", `<p id="outside">x</p>`)
		menu.attach({ content: list, anchor })
		const press = (el: Element): void => void el.dispatchEvent(new Event("pointerdown", { bubbles: true }))
		press(list)
		press(anchor)
		expect(onOpenChange).not.toHaveBeenCalled()
		press(document.getElementById("outside") as Element)
		expect(onOpenChange).toHaveBeenCalledWith(false, "outsidePress", expect.anything())
	})

	it("positions next to the anchor and cleans up", () => {
		const cleanup = vi.fn()
		const position = vi.fn(() => cleanup)
		const { menu, list, anchor } = mount()
		const detach = menu.attach({ content: list, anchor, position })
		expect(position).toHaveBeenCalledWith(anchor, list)
		detach()
		expect(cleanup).toHaveBeenCalled()
	})

	it("detached menus no longer react to outside presses", () => {
		const onOpenChange = vi.fn()
		const { menu, list } = mount({ id: "m", onOpenChange, open: true })
		const detach = menu.attach({ content: list })
		detach()
		document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))
		expect(onOpenChange).not.toHaveBeenCalled()
	})
})
