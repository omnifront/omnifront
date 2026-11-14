import { FakeScheduler } from "@omnifront/core/testing"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createField, createSelect, mergeParts, part } from "../src"

afterEach(() => {
	document.body.innerHTML = ""
})

const options = [
	{ value: "a", label: "Apple" },
	{ value: "b", label: "Banana", disabled: true },
	{ value: "bl", label: "Blueberry" },
	{ value: "c", label: "Cherry" },
]

const keydown = (el: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent => {
	const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init })
	el.dispatchEvent(event)
	return event
}

function mount(props: Partial<Parameters<typeof createSelect>[0]> = {}) {
	document.body.innerHTML = `<div id="trigger" tabindex="0"></div>`
	const trigger = document.getElementById("trigger") as HTMLElement
	trigger.focus()
	const select = createSelect({ id: "s", options, defaultOpen: true, exitDuration: 0, ...props })
	const list = document.createElement("ul")
	list.addEventListener("keydown", select.connect().listbox.on.keydown as EventListener)
	for (const option of options) {
		const li = document.createElement("li")
		const p = select.option(option)
		for (const [k, v] of Object.entries(p.attrs)) if (v !== undefined) li.setAttribute(k, String(v))
		li.textContent = option.label
		li.addEventListener("click", p.on.click as EventListener)
		list.append(li)
	}
	document.body.append(list)
	return { select, trigger, list, items: Array.from(list.children) as HTMLElement[] }
}

describe("Select state", () => {
	it("starts empty, shows the selected label, and counts '' as nothing selected", () => {
		expect(createSelect({ id: "s", options }).getSnapshot()).toMatchObject({ value: undefined, label: "", filled: false, open: false })
		expect(createSelect({ id: "s", options, defaultValue: "c" }).getSnapshot()).toMatchObject({ value: "c", label: "Cherry", filled: true })
		expect(createSelect({ id: "s", options, defaultValue: "" }).getSnapshot()).toMatchObject({ label: "", filled: false })
		expect(createSelect({ id: "s", options, defaultValue: "zzz" }).getSnapshot()).toMatchObject({ label: "", filled: true })
	})

	it("choose: uncontrolled keeps the value, tells the listener, and closes", () => {
		const onValueChange = vi.fn()
		const onOpenChange = vi.fn()
		const select = createSelect({ id: "s", options, defaultOpen: true, exitDuration: 0, onValueChange, onOpenChange })
		select.choose("c")
		expect(select.getSnapshot()).toMatchObject({ value: "c", label: "Cherry", open: false })
		expect(onValueChange).toHaveBeenCalledWith("c", undefined)
		expect(onOpenChange).toHaveBeenCalledWith(false, "select", undefined)
	})

	it("choose: controlled only asks; choosing the current value only closes; disabled does nothing", () => {
		const onValueChange = vi.fn()
		const select = createSelect({ id: "s", options, value: "a", defaultOpen: true, exitDuration: 0, onValueChange })
		select.choose("c")
		expect(onValueChange).toHaveBeenCalledWith("c", undefined)
		expect(select.getSnapshot().value).toBe("a")
		select.setProps({ value: "c" })
		expect(select.getSnapshot().label).toBe("Cherry")
		onValueChange.mockClear()
		select.choose("c")
		expect(onValueChange).not.toHaveBeenCalled()
		const disabled = createSelect({ id: "s", options, disabled: true, defaultOpen: true, onValueChange })
		disabled.choose("a")
		expect(onValueChange).not.toHaveBeenCalled()
		expect(disabled.getSnapshot()).toMatchObject({ disabled: true, open: true })
	})

	it("stays mounted for the exit animation", () => {
		const scheduler = new FakeScheduler()
		const select = createSelect({ id: "s", options, open: true, scheduler })
		select.setProps({ open: false })
		expect(select.getSnapshot()).toMatchObject({ mounted: true, status: "closing" })
		scheduler.advance(120)
		expect(select.getSnapshot().mounted).toBe(false)
	})
})

describe("Select parts", () => {
	it("trigger is a combobox labelled by the label and its own text", () => {
		const select = createSelect({ id: "s", options })
		expect(select.connect().trigger.attrs).toMatchObject({
			id: "s",
			role: "combobox",
			"aria-haspopup": "listbox",
			"aria-expanded": "false",
			"aria-controls": undefined,
			"aria-labelledby": "s-label s",
			tabindex: 0,
			"data-state": "closed",
		})
		select.show()
		expect(select.connect().trigger.attrs).toMatchObject({ "aria-expanded": "true", "aria-controls": "s-listbox", "data-state": "open" })
		expect(select.connect().listbox.attrs).toMatchObject({ id: "s-listbox", role: "listbox", "aria-labelledby": "s-label", tabindex: -1 })
		const disabled = createSelect({ id: "s", options, disabled: true })
		expect(disabled.connect().trigger.attrs).toMatchObject({ "aria-disabled": "true", tabindex: -1, "data-disabled": "" })
	})

	it("trigger toggles on click and opens on Enter, Space and the arrows; not when disabled", () => {
		const select = createSelect({ id: "s", options, exitDuration: 0 })
		const { trigger } = select.connect()
		trigger.on.click?.(new MouseEvent("click"))
		expect(select.getSnapshot().open).toBe(true)
		trigger.on.click?.(new MouseEvent("click"))
		expect(select.getSnapshot().open).toBe(false)
		for (const key of ["Enter", " ", "ArrowDown", "ArrowUp"]) {
			const event = new KeyboardEvent("keydown", { key, cancelable: true })
			trigger.on.keydown?.(event)
			expect(select.getSnapshot().open, key).toBe(true)
			expect(event.defaultPrevented).toBe(true)
			select.hide()
		}
		trigger.on.keydown?.(new KeyboardEvent("keydown", { key: "x" }))
		expect(select.getSnapshot().open).toBe(false)
		const disabled = createSelect({ id: "s", options, disabled: true })
		disabled.connect().trigger.on.click?.(new MouseEvent("click"))
		disabled.connect().trigger.on.keydown?.(new KeyboardEvent("keydown", { key: "Enter" }))
		expect(disabled.getSnapshot().open).toBe(false)
	})

	it("option parts: role, selection, disabled", () => {
		const select = createSelect({ id: "s", options, defaultValue: "c" })
		expect(select.option(options[3] as never).attrs).toMatchObject({ role: "option", "aria-selected": "true", "data-selected": "", "data-value": "c", tabindex: -1 })
		expect(select.option(options[0] as never).attrs).toMatchObject({ "aria-selected": "false", "data-selected": undefined })
		expect(select.option(options[1] as never).attrs).toMatchObject({ "aria-disabled": "true", "data-disabled": "" })
		const onValueChange = vi.fn()
		select.setProps({ onValueChange })
		select.option(options[1] as never).on.click?.(new MouseEvent("click"))
		expect(onValueChange).not.toHaveBeenCalled()
	})
})

describe("Select attach", () => {
	it("focuses the selected option (else the first enabled), and focus returns to the trigger", () => {
		const { select, trigger, list, items } = mount({ defaultValue: "c" })
		const detach = select.attach({ content: list, trigger })
		expect(document.activeElement).toBe(items[3])
		detach()
		expect(document.activeElement).toBe(trigger)
		const second = mount()
		second.select.attach({ content: second.list, trigger: second.trigger })
		expect(document.activeElement).toBe(second.items[0])
	})

	it("focuses the list itself when there are no options, and returns to the previous element when there is no trigger", () => {
		document.body.innerHTML = `<button id="b">b</button><ul id="empty" tabindex="-1"></ul>`
		const empty = document.getElementById("empty") as HTMLElement
		const b = document.getElementById("b") as HTMLElement
		b.focus()
		const detach = createSelect({ id: "s", options: [] }).attach({ content: empty })
		expect(document.activeElement).toBe(empty)
		detach()
		expect(document.activeElement).toBe(b)
	})

	it("arrow keys, Home and End move focus past the disabled option and wrap", () => {
		const { select, trigger, list, items } = mount()
		select.attach({ content: list, trigger })
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

	it("type-ahead matches labels, builds a prefix while typing fast, and ignores shortcuts", () => {
		const scheduler = new FakeScheduler()
		const { select, trigger, list, items } = mount({ scheduler })
		select.attach({ content: list, trigger })
		keydown(items[0] as HTMLElement, "c")
		expect(document.activeElement).toBe(items[3])
		scheduler.advance(600)
		keydown(items[3] as HTMLElement, "b")
		expect(document.activeElement).toBe(items[2])
		keydown(items[2] as HTMLElement, "l")
		expect(document.activeElement).toBe(items[2])
		scheduler.advance(800)
		keydown(items[2] as HTMLElement, "z")
		expect(document.activeElement).toBe(items[2])
		expect(keydown(items[2] as HTMLElement, "a", { ctrlKey: true }).defaultPrevented).toBe(false)
	})

	it("Enter and Space choose the focused option; Escape and Tab close", () => {
		const onValueChange = vi.fn()
		const onOpenChange = vi.fn()
		const { select, trigger, list, items } = mount({ onValueChange, onOpenChange, open: true })
		select.attach({ content: list, trigger })
		keydown(items[0] as HTMLElement, "ArrowDown")
		const enter = keydown(items[2] as HTMLElement, "Enter")
		expect(enter.defaultPrevented).toBe(true)
		expect(onValueChange).toHaveBeenCalledWith("bl", expect.anything())
		expect(onOpenChange).toHaveBeenLastCalledWith(false, "select", expect.anything())
		keydown(items[2] as HTMLElement, " ")
		expect(onValueChange).toHaveBeenCalledTimes(1) // same value again: only closes
		keydown(items[2] as HTMLElement, "Escape")
		expect(onOpenChange).toHaveBeenLastCalledWith(false, "escapeKeyDown", expect.anything())
		expect(keydown(items[2] as HTMLElement, "Tab").defaultPrevented).toBe(true)
		expect(onOpenChange).toHaveBeenLastCalledWith(false, "tab", expect.anything())
	})

	it("an empty list ignores keys; Escape in a lower layer is ignored", () => {
		document.body.innerHTML = `<ul id="e"></ul>`
		const empty = document.getElementById("e") as HTMLElement
		const select = createSelect({ id: "s", options: [], defaultOpen: true })
		empty.addEventListener("keydown", select.connect().listbox.on.keydown as EventListener)
		expect(keydown(empty, "ArrowDown").defaultPrevented).toBe(false)
		const onOpenChange = vi.fn()
		const { select: lower, trigger, list, items } = mount({ onOpenChange, open: true })
		lower.attach({ content: list, trigger })
		createSelect({ id: "u", options, defaultOpen: true }).attach({ content: document.createElement("ul") })
		keydown(items[0] as HTMLElement, "Escape")
		expect(onOpenChange).not.toHaveBeenCalled()
	})

	it("closes on a press outside, but not on the list or the trigger; positions and cleans up", () => {
		const onOpenChange = vi.fn()
		const cleanup = vi.fn()
		const position = vi.fn(() => cleanup)
		const { select, trigger, list } = mount({ onOpenChange, open: true })
		document.body.insertAdjacentHTML("beforeend", `<p id="outside">x</p>`)
		const detach = select.attach({ content: list, trigger, position })
		expect(position).toHaveBeenCalledWith(trigger, list)
		const press = (el: Element): void => void el.dispatchEvent(new Event("pointerdown", { bubbles: true }))
		press(list)
		press(trigger)
		expect(onOpenChange).not.toHaveBeenCalled()
		press(document.getElementById("outside") as Element)
		expect(onOpenChange).toHaveBeenCalledWith(false, "outsidePress", expect.anything())
		detach()
		expect(cleanup).toHaveBeenCalled()
	})
})

describe("mergeParts and Field.trigger", () => {
	it("later attributes win, undefined does not erase, and handlers for one event all run in order", () => {
		const calls: string[] = []
		const merged = mergeParts(
			part({ a: "1", b: "x" }, { click: () => calls.push("first") }),
			part({ a: "2", b: undefined }, { click: () => calls.push("second"), focus: () => calls.push("focus") }),
		)
		expect(merged.attrs).toEqual({ a: "2", b: "x" })
		merged.on.click?.(new Event("click"))
		merged.on.focus?.(new Event("focus"))
		expect(calls).toEqual(["first", "second", "focus"])
	})

	it("Field.trigger carries state for a non-input control and tracks focus", () => {
		const field = createField({ id: "f", error: true, required: true, hasHelper: true })
		const { trigger } = field.connect()
		expect(trigger.attrs).toEqual({ "aria-invalid": "true", "aria-describedby": "f-helper", "aria-required": "true" })
		trigger.on.focus?.(new Event("focus"))
		expect(field.getSnapshot().focused).toBe(true)
		trigger.on.blur?.(new Event("blur"))
		expect(field.getSnapshot().focused).toBe(false)
	})
})
