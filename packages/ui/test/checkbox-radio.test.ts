import { describe, expect, it, vi } from "vitest"
import { createCheckbox, createRadioGroup, formGroupParts } from "../src"

const changeEvent = (checked: boolean): Event => Object.defineProperty(new Event("change"), "target", { value: { checked } })

describe("Checkbox", () => {
	it("starts unchecked, or from defaultChecked, with a native checkbox input", () => {
		const unchecked = createCheckbox({ id: "c" })
		expect(unchecked.getSnapshot()).toEqual({ id: "c", checked: false, indeterminate: false, disabled: false })
		expect(unchecked.connect().input.attrs).toMatchObject({ id: "c", type: "checkbox", checked: false, disabled: undefined, required: undefined, "aria-invalid": undefined })
		expect(createCheckbox({ id: "c", defaultChecked: true }).getSnapshot().checked).toBe(true)
	})

	it("uncontrolled: follows the input's change and tells the listener", () => {
		const onCheckedChange = vi.fn()
		const box = createCheckbox({ id: "c", onCheckedChange })
		const listener = vi.fn()
		box.subscribe(listener)
		const event = changeEvent(true)
		box.connect().input.on.change?.(event)
		expect(box.getSnapshot().checked).toBe(true)
		expect(onCheckedChange).toHaveBeenCalledWith(true, event)
		expect(listener).toHaveBeenCalledTimes(1)
	})

	it("controlled: only asks, the parent decides", () => {
		const onCheckedChange = vi.fn()
		const box = createCheckbox({ id: "c", checked: false, onCheckedChange })
		box.change(true)
		expect(onCheckedChange).toHaveBeenCalledWith(true, undefined)
		expect(box.getSnapshot().checked).toBe(false)
		box.setProps({ checked: true })
		expect(box.getSnapshot().checked).toBe(true)
	})

	it("indeterminate, disabled, required and error are exposed; disabled ignores changes", () => {
		const onCheckedChange = vi.fn()
		const box = createCheckbox({ id: "c", indeterminate: true, disabled: true, required: true, error: true, onCheckedChange })
		expect(box.getSnapshot()).toMatchObject({ indeterminate: true, disabled: true })
		expect(box.connect().input.attrs).toMatchObject({ disabled: true, required: true, "aria-invalid": "true" })
		box.change(true)
		expect(onCheckedChange).not.toHaveBeenCalled()
	})
})

describe("RadioGroup", () => {
	it("derives the name from the id, and the value from defaultValue", () => {
		const group = createRadioGroup({ id: "g", defaultValue: "b" })
		expect(group.getSnapshot()).toEqual({ id: "g", name: "g", value: "b", disabled: false })
		expect(createRadioGroup({ id: "g", name: "fruit" }).getSnapshot().name).toBe("fruit")
	})

	it("radio parts share the name, and exactly the chosen one is checked", () => {
		const group = createRadioGroup({ id: "g", defaultValue: "b" })
		expect(group.radio("a").attrs).toMatchObject({ type: "radio", name: "g", value: "a", checked: false })
		expect(group.radio("b").attrs).toMatchObject({ checked: true })
		expect(group.radio("c", { disabled: true }).attrs).toMatchObject({ disabled: true })
	})

	it("uncontrolled: choosing changes the value and tells the listener once; choosing it again does nothing", () => {
		const onValueChange = vi.fn()
		const group = createRadioGroup({ id: "g", onValueChange })
		const event = new Event("change")
		group.radio("a").on.change?.(event)
		expect(group.getSnapshot().value).toBe("a")
		expect(onValueChange).toHaveBeenCalledWith("a", event)
		group.radio("a").on.change?.(new Event("change"))
		expect(onValueChange).toHaveBeenCalledTimes(1)
	})

	it("controlled: only asks; a disabled group ignores choices", () => {
		const onValueChange = vi.fn()
		const group = createRadioGroup({ id: "g", value: "a", onValueChange })
		group.choose("b")
		expect(onValueChange).toHaveBeenCalledWith("b", undefined)
		expect(group.getSnapshot().value).toBe("a")
		group.setProps({ value: "b" })
		expect(group.getSnapshot().value).toBe("b")
		onValueChange.mockClear()
		group.setProps({ disabled: true })
		group.choose("a")
		expect(onValueChange).not.toHaveBeenCalled()
		expect(group.radio("a").attrs).toMatchObject({ disabled: true })
	})

	it("the group part is a radiogroup tied to its label and helper text", () => {
		const { group, label, items, helper } = createRadioGroup({ id: "g", hasLabel: true, hasHelper: true, error: true, row: true, required: true }).connect()
		expect(group.attrs).toMatchObject({ role: "radiogroup", "aria-labelledby": "g-label", "aria-describedby": "g-helper", "aria-invalid": "true", "data-error": "" })
		expect([label.attrs.id, helper.attrs.id]).toEqual(["g-label", "g-helper"])
		expect(items.attrs["data-row"]).toBe("")
		const bare = createRadioGroup({ id: "g" }).connect().group.attrs
		expect(bare).toMatchObject({ "aria-labelledby": undefined, "aria-describedby": undefined, "aria-invalid": undefined })
		expect(createRadioGroup({ id: "g", required: true }).radio("a").attrs.required).toBe(true)
		expect(createRadioGroup({ id: "g", error: true }).radio("a").attrs["aria-invalid"]).toBe("true")
	})
})

describe("formGroupParts", () => {
	it("a plain group has no role (a fieldset already is one) and no dangling references", () => {
		const { group } = formGroupParts({ id: "f" })
		expect(group.attrs).toMatchObject({ role: undefined, "aria-labelledby": undefined, "aria-describedby": undefined })
		expect(formGroupParts({ id: "f", disabled: true }).group.attrs).toMatchObject({ disabled: true, "data-disabled": "" })
	})
})

describe("Checkbox as a switch", () => {
	it("role: 'switch' goes on the native input, and nothing else changes", () => {
		const plain = createCheckbox({ id: "s" })
		expect(plain.connect().input.attrs.role).toBeUndefined()
		const sw = createCheckbox({ id: "s", role: "switch", defaultChecked: true })
		expect(sw.connect().input.attrs).toMatchObject({ role: "switch", type: "checkbox", checked: true })
	})
})
