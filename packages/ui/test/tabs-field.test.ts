import { afterEach, describe, expect, it, vi } from "vitest"
import { createField, createTabs } from "../src"

afterEach(() => {
	document.body.innerHTML = ""
})

function mountTabs(props: Partial<Parameters<typeof createTabs>[0]> = {}) {
	const tabs = createTabs({ id: "t", defaultValue: "a", ...props })
	const list = document.createElement("div")
	const parts = tabs.connect()
	list.addEventListener("keydown", parts.list.on.keydown as EventListener)
	const buttons = ["a", "b", "c"].map((value) => {
		const el = document.createElement("button")
		const p = tabs.tab(value, { disabled: value === "b" })
		for (const [k, v] of Object.entries(p.attrs)) if (v !== undefined) el.setAttribute(k, String(v))
		el.addEventListener("click", p.on.click as EventListener)
		list.append(el)
		return el
	})
	document.body.append(list)
	return { tabs, list, buttons: buttons as unknown as [HTMLElement, HTMLElement, HTMLElement] }
}
const keydown = (el: Element, key: string): KeyboardEvent => {
	const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })
	el.dispatchEvent(event)
	return event
}

describe("Tabs", () => {
	it("selects by click (uncontrolled) and tells the listener", () => {
		const onValueChange = vi.fn()
		const { tabs, buttons } = mountTabs({ onValueChange })
		buttons[2].click()
		expect(tabs.getSnapshot().value).toBe("c")
		expect(onValueChange).toHaveBeenCalledWith("c", expect.anything())
		buttons[2].click() // same tab: nothing
		expect(onValueChange).toHaveBeenCalledTimes(1)
	})

	it("controlled: asks, the parent decides", () => {
		const onValueChange = vi.fn()
		const tabs = createTabs({ id: "t", value: "a", onValueChange })
		tabs.tab("c").on.click?.(new MouseEvent("click"))
		expect(onValueChange).toHaveBeenCalledWith("c", expect.anything())
		expect(tabs.getSnapshot().value).toBe("a")
		tabs.setProps({ value: "c" })
		expect(tabs.getSnapshot().value).toBe("c")
	})

	it("a disabled tab does not select", () => {
		const { tabs, buttons } = mountTabs()
		buttons[1].click()
		expect(tabs.getSnapshot().value).toBe("a")
		expect(buttons[1].getAttribute("aria-disabled")).toBe("true")
	})

	it("tab and panel attributes link to each other, with a roving tabindex", () => {
		const tabs = createTabs({ id: "t", defaultValue: "a" })
		expect(tabs.tab("a").attrs).toMatchObject({ role: "tab", id: "t-tab-a", "aria-selected": "true", "aria-controls": "t-panel-a", tabindex: 0, "data-selected": "" })
		expect(tabs.tab("b").attrs).toMatchObject({ "aria-selected": "false", tabindex: -1, "data-selected": undefined })
		expect(tabs.panel("a").attrs).toMatchObject({ role: "tabpanel", id: "t-panel-a", "aria-labelledby": "t-tab-a", hidden: false })
		expect(tabs.panel("b").attrs.hidden).toBe(true)
		const { list, root } = tabs.connect()
		expect(list.attrs).toMatchObject({ role: "tablist", "aria-orientation": "horizontal" })
		expect(root.attrs["data-orientation"]).toBe("horizontal")
		// nothing selected yet: every tab can take focus
		expect(createTabs({ id: "x" }).tab("a").attrs.tabindex).toBe(0)
	})

	it("arrow keys move focus (skipping disabled tabs, wrapping) without selecting", () => {
		const { tabs, buttons } = mountTabs()
		buttons[0].focus()
		keydown(buttons[0], "ArrowRight")
		expect(document.activeElement).toBe(buttons[2])
		keydown(buttons[2], "ArrowRight")
		expect(document.activeElement).toBe(buttons[0])
		keydown(buttons[0], "ArrowLeft")
		expect(document.activeElement).toBe(buttons[2])
		keydown(buttons[2], "Home")
		expect(document.activeElement).toBe(buttons[0])
		keydown(buttons[0], "End")
		expect(document.activeElement).toBe(buttons[2])
		expect(tabs.getSnapshot().value).toBe("a")
		expect(keydown(buttons[0], "x").defaultPrevented).toBe(false)
	})

	it("selectionFollowsFocus selects as focus moves", () => {
		const { tabs, buttons } = mountTabs({ selectionFollowsFocus: true })
		buttons[0].focus()
		keydown(buttons[0], "ArrowRight")
		expect(tabs.getSnapshot().value).toBe("c")
	})

	it("vertical tabs use Up and Down", () => {
		const { tabs, buttons } = mountTabs({ orientation: "vertical" })
		expect(tabs.getSnapshot().orientation).toBe("vertical")
		buttons[0].focus()
		keydown(buttons[0], "ArrowRight")
		expect(document.activeElement).toBe(buttons[0])
		keydown(buttons[0], "ArrowDown")
		expect(document.activeElement).toBe(buttons[2])
		keydown(buttons[2], "ArrowUp")
		expect(document.activeElement).toBe(buttons[0])
	})

	it("right-to-left swaps Left and Right", () => {
		const { list, buttons } = mountTabs()
		list.style.direction = "rtl"
		buttons[0].focus()
		keydown(buttons[0], "ArrowLeft")
		expect(document.activeElement).toBe(buttons[2])
	})

	it("an empty list ignores keys", () => {
		const tabs = createTabs({ id: "t" })
		const list = document.createElement("div")
		list.addEventListener("keydown", tabs.connect().list.on.keydown as EventListener)
		expect(keydown(list, "ArrowRight").defaultPrevented).toBe(false)
	})

	describe("attach (indicator)", () => {
		function sized(tabs: ReturnType<typeof createTabs>, list: HTMLElement, buttons: HTMLElement[]) {
			Object.defineProperty(list, "clientWidth", { value: 300 })
			buttons.forEach((b, i) => {
				Object.defineProperty(b, "offsetLeft", { value: i * 100 })
				Object.defineProperty(b, "offsetWidth", { value: 100 })
				Object.defineProperty(b, "offsetTop", { value: i * 40 })
				Object.defineProperty(b, "offsetHeight", { value: 40 })
			})
			return tabs.attach(list)
		}

		it("sets the indicator from the selected tab and follows the selection", () => {
			const { tabs, list, buttons } = mountTabs()
			const detach = sized(tabs, list, buttons)
			expect(list.style.getPropertyValue("--omni-tabs-indicator-start")).toBe("0px")
			expect(list.style.getPropertyValue("--omni-tabs-indicator-size")).toBe("100px")
			tabs.select("c")
			buttons.forEach((b, i) => b.setAttribute("aria-selected", i === 2 ? "true" : "false"))
			tabs.setProps({ id: "t2" }) // any change notifies; the indicator re-reads the DOM
			expect(list.style.getPropertyValue("--omni-tabs-indicator-start")).toBe("200px")
			detach()
		})

		it("mirrors in right-to-left, measures height when vertical, and hides when nothing is selected", () => {
			const rtl = mountTabs()
			rtl.list.style.direction = "rtl"
			sized(rtl.tabs, rtl.list, rtl.buttons)()
			expect(rtl.list.style.getPropertyValue("--omni-tabs-indicator-start")).toBe("200px")

			const vertical = mountTabs({ orientation: "vertical", defaultValue: "c" })
			sized(vertical.tabs, vertical.list, vertical.buttons)()
			expect(vertical.list.style.getPropertyValue("--omni-tabs-indicator-start")).toBe("80px")
			expect(vertical.list.style.getPropertyValue("--omni-tabs-indicator-size")).toBe("40px")

			const none = createTabs({ id: "n" })
			const list = document.createElement("div")
			none.attach(list)()
			expect(list.style.getPropertyValue("--omni-tabs-indicator-size")).toBe("0px")
		})

		it("watches the list size when the browser has ResizeObserver", () => {
			const observe = vi.fn()
			const disconnect = vi.fn()
			class RO {
				constructor(public cb: () => void) {}
				observe = observe
				disconnect = disconnect
			}
			const { tabs, list } = mountTabs()
			Object.defineProperty(list.ownerDocument.defaultView, "ResizeObserver", { value: RO, configurable: true })
			tabs.attach(list)()
			expect(observe).toHaveBeenCalledWith(list)
			expect(disconnect).toHaveBeenCalled()
			delete (list.ownerDocument.defaultView as unknown as Record<string, unknown>)["ResizeObserver"]
		})
	})
})

describe("Field", () => {
	const input = (value: string): Event => Object.defineProperty(new Event("input"), "target", { value: { value } })

	it("tracks focus and floats the label while focused or filled", () => {
		const field = createField({ id: "f" })
		expect(field.getSnapshot()).toMatchObject({ focused: false, filled: false, shrink: false })
		const { input: i } = field.connect()
		i.on.focus?.(new Event("focus"))
		expect(field.getSnapshot()).toMatchObject({ focused: true, shrink: true })
		i.on.blur?.(new Event("blur"))
		expect(field.getSnapshot().shrink).toBe(false)
		i.on.input?.(input("a"))
		expect(field.getSnapshot()).toMatchObject({ filled: true, shrink: true })
		i.on.input?.(input(""))
		expect(field.getSnapshot().filled).toBe(false)
	})

	it("a controlled `filled` beats what was typed; alwaysShrink floats an empty label", () => {
		const field = createField({ id: "f", filled: false })
		field.connect().input.on.input?.(input("typed"))
		expect(field.getSnapshot().filled).toBe(false)
		field.setProps({ filled: true })
		expect(field.getSnapshot().shrink).toBe(true)
		expect(createField({ id: "f", alwaysShrink: true }).getSnapshot().shrink).toBe(true)
	})

	it("a disabled field is never focused", () => {
		const field = createField({ id: "f", disabled: true })
		field.connect().input.on.focus?.(new Event("focus"))
		expect(field.getSnapshot()).toMatchObject({ focused: false, disabled: true })
	})

	it("ties the label, input and helper text together", () => {
		const field = createField({ id: "f", error: true, required: true, hasHelper: true, readOnly: true })
		const { root, label, input: i, helper, fieldset } = field.connect()
		expect(label.attrs).toMatchObject({ id: "f-label", for: "f", "data-error": "" })
		expect(i.attrs).toMatchObject({ id: "f", "aria-invalid": "true", "aria-describedby": "f-helper", required: true, readonly: true, disabled: undefined })
		expect(helper.attrs.id).toBe("f-helper")
		expect(root.attrs["data-error"]).toBe("")
		expect(fieldset.attrs["aria-hidden"]).toBe("true")
		const plain = createField({ id: "g" }).connect().input.attrs
		expect(plain).toMatchObject({ "aria-invalid": undefined, "aria-describedby": undefined, required: undefined })
	})
})

describe("silent updates", () => {
	it("setProps({ silent }) changes the snapshot without notifying until flush()", () => {
		const tabs = createTabs({ id: "t", value: "a" })
		const listener = vi.fn()
		tabs.subscribe(listener)
		tabs.setProps({ value: "b" }, { silent: true })
		expect(tabs.getSnapshot().value).toBe("b")
		expect(listener).not.toHaveBeenCalled()
		tabs.flush()
		expect(listener).toHaveBeenCalledTimes(1)
		tabs.flush() // already told
		expect(listener).toHaveBeenCalledTimes(1)
	})
})

describe("Field defaultFilled", () => {
	it("an uncontrolled input that starts with a value floats its label from the first render", () => {
		expect(createField({ id: "f", defaultFilled: true }).getSnapshot()).toMatchObject({ filled: true, shrink: true })
	})
})

describe("unbound use", () => {
	it("getSnapshot and getServerSnapshot work detached, like useSyncExternalStore calls them", () => {
		const { getSnapshot, getServerSnapshot, subscribe } = createTabs({ id: "t", defaultValue: "a" })
		expect(getSnapshot().value).toBe("a")
		expect(getServerSnapshot().value).toBe("a")
		expect(typeof subscribe(() => {})).toBe("function")
	})
})
