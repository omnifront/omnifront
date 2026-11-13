import { afterEach, describe, expect, it, vi } from "vitest"
import { attachAutosize, createRating, createSelect, createSlider, createToggleGroup, fabPart, iconButtonPart, toggleButtonPart } from "../src"

afterEach(() => {
	document.body.innerHTML = ""
	vi.restoreAllMocks()
})

describe("iconButtonPart, fabPart and toggleButtonPart", () => {
	it("an icon button is round, default coloured and medium; a link gets role=button", () => {
		expect(iconButtonPart().attrs).toMatchObject({ class: "omni-icon-button", "data-color": "default", "data-size": "medium", type: "button", disabled: undefined, "data-edge": undefined })
		expect(iconButtonPart({ color: "primary", size: "small", edge: "start", disabled: true, type: "submit" }).attrs).toMatchObject({ "data-color": "primary", "data-size": "small", "data-edge": "start", "data-disabled": "", disabled: true, type: "submit" })
		expect(iconButtonPart({ as: "a", disabled: true }).attrs).toMatchObject({ role: "button", "aria-disabled": "true", tabindex: -1 })
		expect(iconButtonPart({ as: "a" }).attrs.type).toBeUndefined()
		expect(iconButtonPart({ edge: false }).attrs["data-edge"]).toBeUndefined()
	})

	it("a fab is large, primary and circular unless asked otherwise", () => {
		expect(fabPart().attrs).toMatchObject({ class: "omni-fab", "data-variant": "circular", "data-color": "primary", "data-size": "large", type: "button" })
		expect(fabPart({ variant: "extended", size: "small", color: "secondary", disabled: true }).attrs).toMatchObject({ "data-variant": "extended", "data-size": "small", "data-color": "secondary", disabled: true })
		expect(fabPart({ as: "a", disabled: true }).attrs).toMatchObject({ role: "button", "aria-disabled": "true", tabindex: -1 })
		expect(fabPart({ as: "a" }).attrs.tabindex).toBeUndefined()
	})

	it("a toggle button says whether it is pressed", () => {
		expect(toggleButtonPart().attrs).toMatchObject({ class: "omni-toggle-button", type: "button", "aria-pressed": "false", "data-selected": undefined, disabled: undefined })
		expect(toggleButtonPart({ selected: true, disabled: true }).attrs).toMatchObject({ "aria-pressed": "true", "data-selected": "", disabled: true })
	})
})

describe("ToggleGroup", () => {
	it("several can be pressed (uncontrolled), and pressing again unpresses", () => {
		const onValueChange = vi.fn()
		const group = createToggleGroup({ id: "g", onValueChange })
		group.toggle("a")
		group.toggle("b")
		expect(group.getSnapshot().value).toEqual(["a", "b"])
		group.toggle("a")
		expect(group.getSnapshot().value).toEqual(["b"])
		expect(onValueChange).toHaveBeenLastCalledWith(["b"], undefined)
	})

	it("exclusive: one at a time, and pressing the pressed one clears", () => {
		const group = createToggleGroup({ id: "g", exclusive: true, defaultValue: ["a"] })
		group.toggle("b")
		expect(group.getSnapshot().value).toEqual(["b"])
		group.toggle("b")
		expect(group.getSnapshot().value).toEqual([])
	})

	it("controlled only asks; disabled ignores presses", () => {
		const onValueChange = vi.fn()
		const group = createToggleGroup({ id: "g", value: ["a"], onValueChange })
		group.toggle("b")
		expect(onValueChange).toHaveBeenCalledWith(["a", "b"], undefined)
		expect(group.getSnapshot().value).toEqual(["a"])
		group.setProps({ value: ["a", "b"] })
		expect(group.getSnapshot().value).toEqual(["a", "b"])
		onValueChange.mockClear()
		group.setProps({ disabled: true })
		group.toggle("c")
		expect(onValueChange).not.toHaveBeenCalled()
	})

	it("parts: a group, and items that are buttons with aria-pressed", () => {
		const group = createToggleGroup({ id: "g", defaultValue: ["a"], orientation: "vertical" })
		expect(group.connect().group.attrs).toMatchObject({ role: "group", "data-orientation": "vertical", "data-disabled": undefined })
		expect(group.item("a").attrs).toMatchObject({ type: "button", "aria-pressed": "true", "data-selected": "", disabled: undefined })
		expect(group.item("b", { disabled: true }).attrs).toMatchObject({ "aria-pressed": "false", disabled: true })
		const event = new MouseEvent("click")
		group.item("b").on.click?.(event)
		expect(group.getSnapshot().value).toEqual(["a", "b"])
		group.setProps({ disabled: true })
		expect(group.connect().group.attrs["data-disabled"]).toBe("")
		expect(createToggleGroup({ id: "h" }).connect().group.attrs["data-orientation"]).toBe("horizontal")
	})
})

const inputEvent = (value: string): Event => Object.defineProperty(new Event("input"), "target", { value: { value } })

describe("Slider", () => {
	it("defaults to 0 to 100 in steps of 1, starting at min or defaultValue", () => {
		expect(createSlider({ id: "s" }).getSnapshot()).toEqual({ id: "s", value: 0, min: 0, max: 100, step: 1, percent: 0, disabled: false })
		expect(createSlider({ id: "s", defaultValue: 25, min: 0, max: 50 }).getSnapshot()).toMatchObject({ value: 25, percent: 50 })
		expect(createSlider({ id: "s", min: 5, max: 5 }).getSnapshot().percent).toBe(0)
	})

	it("keeps values in range and on a step, without floating point noise", () => {
		const slider = createSlider({ id: "s", min: 0, max: 1, step: 0.1 })
		slider.change(0.30000000000000004)
		expect(slider.getSnapshot().value).toBe(0.3)
		slider.change(7)
		expect(slider.getSnapshot().value).toBe(1)
		slider.change(-3)
		expect(slider.getSnapshot().value).toBe(0)
		const coarse = createSlider({ id: "s", step: 10, min: 0, max: 100 })
		coarse.change(14)
		expect(coarse.getSnapshot().value).toBe(10)
		coarse.change(16)
		expect(coarse.getSnapshot().value).toBe(20)
	})

	it("the input part is a native range input and reports changes", () => {
		const onValueChange = vi.fn()
		const slider = createSlider({ id: "s", min: 0, max: 10, step: 2, defaultValue: 4, onValueChange })
		const { input } = slider.connect()
		expect(input.attrs).toMatchObject({ id: "s", type: "range", min: 0, max: 10, step: 2, value: "4", disabled: undefined })
		const event = inputEvent("6")
		input.on.input?.(event)
		expect(slider.getSnapshot().value).toBe(6)
		expect(onValueChange).toHaveBeenCalledWith(6, event)
		input.on.input?.(inputEvent("6")) // no change: nothing to report
		expect(onValueChange).toHaveBeenCalledTimes(1)
	})

	it("controlled only asks; disabled ignores changes", () => {
		const onValueChange = vi.fn()
		const slider = createSlider({ id: "s", value: 10, onValueChange })
		slider.change(20)
		expect(onValueChange).toHaveBeenCalledWith(20, undefined)
		expect(slider.getSnapshot().value).toBe(10)
		slider.setProps({ value: 20 })
		expect(slider.getSnapshot().value).toBe(20)
		onValueChange.mockClear()
		slider.setProps({ disabled: true })
		slider.change(30)
		expect(onValueChange).not.toHaveBeenCalled()
		expect(slider.connect().input.attrs.disabled).toBe(true)
	})
})

describe("Rating", () => {
	it("has max stars with one radio each; whole-star precision is the default", () => {
		const rating = createRating({ id: "r", defaultValue: 3 })
		const stars = rating.stars()
		expect(stars).toHaveLength(5)
		expect(stars.map((s) => s.fill)).toEqual([100, 100, 100, 0, 0])
		expect(stars[0]?.radios).toHaveLength(1)
		expect(stars[2]?.radios[0]?.part.attrs).toMatchObject({ type: "radio", name: "r", value: "3", checked: true, "aria-label": "3 out of 5", "data-slot": 1, "data-slots": 1 })
		expect(rating.getSnapshot()).toMatchObject({ value: 3, display: 3, max: 5, precision: 1, name: "r" })
	})

	it("half and quarter precision give each star two or four radios and partly filled stars", () => {
		const half = createRating({ id: "r", precision: 0.5, defaultValue: 2.5, max: 3 })
		const stars = half.stars()
		expect(stars.map((s) => s.fill)).toEqual([100, 100, 50])
		expect(stars[2]?.radios.map((r) => r.value)).toEqual([2.5, 3])
		expect(stars[2]?.radios[0]?.part.attrs).toMatchObject({ checked: true, "data-slot": 1, "data-slots": 2 })
		const quarter = createRating({ id: "r", precision: 0.25, defaultValue: 0.75, max: 1 })
		expect(quarter.stars()[0]?.fill).toBe(75)
		expect(quarter.stars()[0]?.radios.map((r) => r.value)).toEqual([0.25, 0.5, 0.75, 1])
	})

	it("choosing sets the value, choosing it again clears it, controlled only asks", () => {
		const onValueChange = vi.fn()
		const rating = createRating({ id: "r", onValueChange })
		rating.choose(4)
		expect(rating.getSnapshot().value).toBe(4)
		rating.choose(4)
		expect(rating.getSnapshot().value).toBe(0)
		expect(onValueChange.mock.calls.map((c) => c[0])).toEqual([4, 0])
		const controlled = createRating({ id: "r", value: 2, onValueChange })
		controlled.choose(5)
		expect(controlled.getSnapshot().value).toBe(2)
		controlled.setProps({ value: 5 })
		expect(controlled.getSnapshot().value).toBe(5)
	})

	it("hovering previews a value and leaving restores it", () => {
		const onHoverChange = vi.fn()
		const rating = createRating({ id: "r", defaultValue: 1, onHoverChange })
		const third = rating.stars()[2]?.radios[0]
		third?.part.on.pointerenter?.(new Event("pointerenter"))
		expect(rating.getSnapshot()).toMatchObject({ hover: 3, display: 3, value: 1 })
		expect(rating.stars().map((s) => s.fill)).toEqual([100, 100, 100, 0, 0])
		rating.stars()[2]?.radios[0]?.part.on.pointerenter?.(new Event("pointerenter")) // same value: nothing new
		expect(onHoverChange).toHaveBeenCalledTimes(1)
		rating.stars()[2]?.radios[0]?.part.on.pointerleave?.(new Event("pointerleave"))
		expect(rating.getSnapshot()).toMatchObject({ hover: -1, display: 1 })
		expect(onHoverChange).toHaveBeenLastCalledWith(undefined)
	})

	it("the group is a radiogroup; read-only is an image with a text alternative; disabled and read-only ignore choices", () => {
		const rating = createRating({ id: "r", name: "stars", defaultValue: 2 })
		expect(rating.connect().group.attrs).toMatchObject({ role: "radiogroup" })
		expect(rating.stars()[0]?.radios[0]?.part.attrs.name).toBe("stars")
		const clear = rating.connect().clear
		expect(clear.attrs).toMatchObject({ type: "radio", value: "0", checked: false, "aria-label": "No rating" })
		clear.on.click?.(new MouseEvent("click"))
		expect(rating.getSnapshot().value).toBe(0)
		expect(rating.connect().clear.attrs.checked).toBe(true)
		rating.connect().clear.on.click?.(new MouseEvent("click")) // already empty: nothing
		const readOnly = createRating({ id: "r", defaultValue: 3, readOnly: true })
		expect(readOnly.connect().group.attrs).toMatchObject({ role: "img", "aria-label": "3 out of 5", "data-readonly": "" })
		readOnly.choose(5)
		expect(readOnly.getSnapshot().value).toBe(3)
		const disabled = createRating({ id: "r", defaultValue: 1, disabled: true })
		disabled.choose(4)
		expect(disabled.getSnapshot().value).toBe(1)
		expect(disabled.connect().group.attrs["data-disabled"]).toBe("")
		expect(disabled.stars()[0]?.radios[0]?.part.attrs.disabled).toBe(true)
		expect(rating.getLabel(4)).toBe("4 out of 5")
	})
})

describe("attachAutosize", () => {
	function area(scrollHeight: number, style = "line-height: 20px; padding: 10px 0; box-sizing: content-box;") {
		const el = document.createElement("textarea")
		el.setAttribute("style", style)
		Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => scrollHeight })
		document.body.append(el)
		return el
	}

	it("sizes to the text between minRows and maxRows, and scrolls past the maximum", () => {
		const el = area(100) // content = 100 - 20 padding = 80px = 4 rows
		const sizer = attachAutosize(el, () => ({ minRows: 2, maxRows: 6 }))
		expect(el.style.height).toBe("80px")
		expect(el.style.overflowY).toBe("hidden")
		Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => 20 + 20 * 10 })
		sizer.update()
		expect(el.style.height).toBe("120px") // capped at 6 rows
		expect(el.style.overflowY).toBe("auto")
		Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => 20 + 20 })
		sizer.update()
		expect(el.style.height).toBe("40px") // at least 2 rows
		sizer.destroy()
		expect(el.style.height).toBe("")
		expect(el.style.overflowY).toBe("")
	})

	it("with no limits and a border-box textarea; follows the element's size when it can", () => {
		const observe = vi.fn()
		const disconnect = vi.fn()
		class RO {
			constructor(public cb: () => void) {}
			observe = observe
			disconnect = disconnect
		}
		const el = area(60, "line-height: 20px; padding: 10px 0; border: 1px solid; box-sizing: border-box;")
		Object.defineProperty(el.ownerDocument.defaultView, "ResizeObserver", { value: RO, configurable: true })
		const sizer = attachAutosize(el)
		expect(el.style.height).toBe("62px") // content 40 + padding 20 + border 2
		expect(observe).toHaveBeenCalledWith(el)
		sizer.destroy()
		expect(disconnect).toHaveBeenCalled()
		delete (el.ownerDocument.defaultView as unknown as Record<string, unknown>)["ResizeObserver"]
	})

	it("does nothing without a window", () => {
		const el = document.createElement("textarea")
		Object.defineProperty(el, "ownerDocument", { value: { defaultView: null } })
		expect(() => attachAutosize(el).update()).not.toThrow()
	})
})

describe("Select multiple", () => {
	const options = [
		{ value: "a", label: "Apple" },
		{ value: "b", label: "Banana", disabled: true },
		{ value: "c", label: "Cherry" },
	]

	it("keeps several values, shows their labels in option order, and stays open", () => {
		const onValuesChange = vi.fn()
		const select = createSelect({ id: "s", options, multiple: true, defaultOpen: true, onValuesChange })
		expect(select.getSnapshot()).toMatchObject({ multiple: true, values: [], label: "", filled: false, value: undefined })
		select.choose("c")
		select.choose("a")
		expect(select.getSnapshot()).toMatchObject({ values: ["c", "a"], label: "Apple, Cherry", filled: true, open: true })
		expect(onValuesChange).toHaveBeenLastCalledWith(["c", "a"], undefined)
		select.choose("c")
		expect(select.getSnapshot().values).toEqual(["a"])
	})

	it("the options say which are selected and the list is multiselectable; defaultValues; controlled values", () => {
		const select = createSelect({ id: "s", options, multiple: true, defaultValues: ["a"] })
		expect(select.option(options[0] as never).attrs).toMatchObject({ "aria-selected": "true", "data-selected": "" })
		expect(select.option(options[2] as never).attrs).toMatchObject({ "aria-selected": "false" })
		expect(select.connect().listbox.attrs["aria-multiselectable"]).toBe("true")
		expect(createSelect({ id: "s", options }).connect().listbox.attrs["aria-multiselectable"]).toBeUndefined()
		const onValuesChange = vi.fn()
		const controlled = createSelect({ id: "s", options, multiple: true, values: ["c"], onValuesChange })
		controlled.choose("a")
		expect(onValuesChange).toHaveBeenCalledWith(["c", "a"], undefined)
		expect(controlled.getSnapshot().values).toEqual(["c"])
		controlled.setProps({ values: ["c", "a"] })
		expect(controlled.getSnapshot().label).toBe("Apple, Cherry")
		controlled.setProps({ disabled: true })
		controlled.choose("c")
		expect(onValuesChange).toHaveBeenCalledTimes(1)
	})
})

describe("snapshots that hold a list", () => {
	it("recomputing with the same items keeps the same snapshot (no endless re-render)", () => {
		const select = createSelect({ id: "s", options: [{ value: "a", label: "A" }], multiple: true, defaultValues: ["a"] })
		const first = select.getSnapshot()
		select.setProps({ options: [{ value: "a", label: "A" }] })
		expect(select.getSnapshot()).toBe(first)
		const group = createToggleGroup({ id: "g", defaultValue: ["x"] })
		const before = group.getSnapshot()
		group.setProps({ disabled: undefined })
		expect(group.getSnapshot()).toBe(before)
	})
})

describe("Rating accessible name", () => {
	it("the group carries the label; a read-only rating adds its value to it", () => {
		expect(createRating({ id: "r", label: "Rating" }).connect().group.attrs["aria-label"]).toBe("Rating")
		expect(createRating({ id: "r", label: "Rating", readOnly: true, defaultValue: 3 }).connect().group.attrs["aria-label"]).toBe("Rating: 3 out of 5")
		expect(createRating({ id: "r", readOnly: true, defaultValue: 2 }).connect().group.attrs["aria-label"]).toBe("2 out of 5")
		expect(createRating({ id: "r" }).connect().group.attrs["aria-label"]).toBeUndefined()
	})
})
