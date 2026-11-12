import { fireEvent, screen } from "@testing-library/dom"
import { createSSRApp, h, ref } from "vue"
import { renderToString } from "vue/server-renderer"
import { describe, expect, it, vi } from "vitest"
import { Checkbox, FormGroup, Radio, RadioGroup, ThemeProvider, createTheme } from "../src"
import { flush, mount, slot } from "./mount"

const checkbox = (name?: string): HTMLInputElement => screen.getByRole("checkbox", name ? { name } : {}) as HTMLInputElement

describe("Checkbox", () => {
	it("is a native checkbox named by its label, inside a clickable label", () => {
		mount(() => h(Checkbox, { label: "Accept terms" }))
		const box = checkbox("Accept terms")
		expect([box.type, box.checked]).toEqual(["checkbox", false])
		expect(box.closest("label")?.className).toBe("omni-checkbox")
		fireEvent.click(screen.getByText("Accept terms"))
		expect(box.checked).toBe(true)
	})

	it("the label can be a slot", () => {
		mount(() => h(Checkbox, null, slot(h("b", null, "Rich label"))))
		expect(checkbox("Rich label")).toBeTruthy()
	})

	it("uncontrolled keeps its own state and reports (event, checked); defaultChecked", async () => {
		const onChange = vi.fn()
		mount(() => h("div", null, [h(Checkbox, { label: "A", onChange }), h(Checkbox, { label: "B", defaultChecked: true })]))
		fireEvent.click(checkbox("A"))
		expect(onChange).toHaveBeenLastCalledWith(expect.anything(), true)
		fireEvent.click(checkbox("A"))
		expect(onChange).toHaveBeenLastCalledWith(expect.anything(), false)
		expect(checkbox("B").checked).toBe(true)
	})

	it("v-model: follows the parent; a parent that refuses the change puts it back", async () => {
		const on = ref(false)
		mount(() => h(Checkbox, { label: "C", modelValue: on.value, "onUpdate:modelValue": (v: boolean) => (on.value = v) }))
		fireEvent.click(checkbox())
		await flush()
		expect(on.value).toBe(true)
		expect(checkbox().checked).toBe(true)
		on.value = false
		await flush()
		expect(checkbox().checked).toBe(false)
		mount(() => h(Checkbox, { label: "Stuck", modelValue: false }))
		const stuck = checkbox("Stuck")
		fireEvent.click(stuck)
		await flush()
		await flush()
		expect(stuck.checked).toBe(false)
	})

	it("indeterminate is set on the input and follows the prop", async () => {
		const some = ref(true)
		mount(() => h(Checkbox, { label: "Some", indeterminate: some.value }))
		expect(checkbox().indeterminate).toBe(true)
		some.value = false
		await flush()
		expect(checkbox().indeterminate).toBe(false)
	})

	it("disabled, required, error, name and value; aria attributes go to the input, the rest to the label", () => {
		const { container } = mount(() =>
			h(Checkbox, { label: "X", disabled: true, required: true, error: true, name: "n", value: "v", "aria-describedby": "d", class: "mine", "data-x": "1" }),
		)
		const box = checkbox()
		expect([box.disabled, box.required, box.name, box.value]).toEqual([true, true, "n", "v"])
		expect(box.getAttribute("aria-invalid")).toBe("true")
		expect(box.getAttribute("aria-describedby")).toBe("d")
		const root = container.querySelector("label") as HTMLElement
		expect(root.dataset).toMatchObject({ disabled: "", error: "", x: "1" })
		expect(root.className).toBe("omni-checkbox mine")
		expect(root.hasAttribute("aria-describedby")).toBe(false)
	})

	it("size, colour, label placement, no label, aria-label, theme defaults", () => {
		const theme = createTheme({ components: { OmniCheckbox: { defaultProps: { color: "secondary" } } } })
		const { container } = mount(() =>
			h(ThemeProvider, { theme }, slot(h(Checkbox, { size: "small", labelPlacement: "start", "aria-label": "Hidden label" }), h(Checkbox, { label: "y", color: "error", labelPlacement: "end" }))),
		)
		const [first, second] = Array.from(container.querySelectorAll("label")) as unknown as [HTMLElement, HTMLElement]
		expect(first.dataset).toMatchObject({ size: "small", color: "secondary", labelPlacement: "start" })
		expect(first.querySelector(".omni-checkbox__label")).toBeNull()
		expect(checkbox("Hidden label")).toBeTruthy()
		expect(second.dataset["color"]).toBe("error")
		expect(second.hasAttribute("data-label-placement")).toBe(false)
	})
})

function group(props: Record<string, unknown> = {}) {
	return h(RadioGroup, { label: "Fruit", helperText: "Pick one", name: "fruit", ...props }, slot(h(Radio, { value: "a", label: "Apple" }), h(Radio, { value: "b", label: "Banana", disabled: true }), h(Radio, { value: "c", label: "Cherry" })))
}

describe("RadioGroup and Radio", () => {
	it("is a radiogroup named by its legend, with native radios sharing one name", () => {
		mount(() => group())
		const fieldset = screen.getByRole("radiogroup", { name: "Fruit" })
		expect(fieldset.tagName).toBe("FIELDSET")
		expect(fieldset.getAttribute("aria-describedby")).toBe(screen.getByText("Pick one").id)
		const radios = screen.getAllByRole("radio") as HTMLInputElement[]
		expect(radios.map((r) => r.value)).toEqual(["a", "b", "c"])
		expect(new Set(radios.map((r) => r.name))).toEqual(new Set(["fruit"]))
		expect(radios.map((r) => r.checked)).toEqual([false, false, false])
		expect(radios[1]?.disabled).toBe(true)
	})

	it("choosing checks exactly one and reports (event, value)", async () => {
		const onChange = vi.fn()
		mount(() => group({ onChange }))
		const [a, b, c] = screen.getAllByRole("radio") as HTMLInputElement[]
		fireEvent.click(screen.getByText("Apple"))
		await flush()
		expect([a?.checked, c?.checked]).toEqual([true, false])
		expect(b?.disabled).toBe(true)
		fireEvent.click(c as HTMLElement)
		await flush()
		expect([a?.checked, c?.checked]).toEqual([false, true])
		expect(onChange.mock.calls.map((x) => x[1])).toEqual(["a", "c"])
	})

	it("v-model follows the parent; defaultValue; a parent that refuses puts every radio back", async () => {
		const value = ref("b")
		mount(() => h(RadioGroup, { label: "G", modelValue: value.value, "onUpdate:modelValue": (v: string) => (value.value = v) }, slot(h(Radio, { value: "a", label: "A" }), h(Radio, { value: "b", label: "B" }))))
		const radio = (name: string): HTMLInputElement => screen.getByRole("radio", { name }) as HTMLInputElement
		expect(radio("B").checked).toBe(true)
		value.value = "a"
		await flush()
		expect(radio("A").checked).toBe(true)
		mount(() => h(RadioGroup, { label: "D", defaultValue: "y" }, slot(h(Radio, { value: "x", label: "X" }), h(Radio, { value: "y", label: "Y" }))))
		expect(radio("Y").checked).toBe(true)
		mount(() => h(RadioGroup, { label: "Stuck", modelValue: "m" }, slot(h(Radio, { value: "m", label: "M" }), h(Radio, { value: "n", label: "N" }))))
		fireEvent.click(radio("N"))
		await flush()
		await flush()
		expect([radio("M").checked, radio("N").checked]).toEqual([true, false])
	})

	it("a disabled group disables every radio; error, required and row show", () => {
		const { container } = mount(() => h(RadioGroup, { label: "G", disabled: true, error: true, required: true, row: true, helperText: "Required" }, slot(h(Radio, { value: "a", label: "A" }))))
		const radio = screen.getByRole("radio") as HTMLInputElement
		expect([radio.disabled, radio.required]).toEqual([true, true])
		expect(radio.getAttribute("aria-invalid")).toBe("true")
		expect(radio.closest("label")?.hasAttribute("data-disabled")).toBe(true)
		expect(container.querySelector(".omni-form-group__items")?.hasAttribute("data-row")).toBe(true)
		expect(container.querySelector("fieldset")?.dataset).toMatchObject({ error: "", disabled: "" })
	})

	it("a Radio outside a group is a plain radio; aria and classes route to the right elements", () => {
		mount(() => h(Radio, { value: "z", label: "Solo", checked: true, name: "solo", labelPlacement: "top", size: "small", color: "success", id: "r1", "aria-describedby": "x", class: "r" }))
		const radio = screen.getByRole("radio", { name: "Solo" }) as HTMLInputElement
		expect([radio.checked, radio.name, radio.id]).toEqual([true, "solo", "r1"])
		expect(radio.getAttribute("aria-describedby")).toBe("x")
		expect(radio.closest("label")?.dataset).toMatchObject({ labelPlacement: "top", size: "small", color: "success" })
		expect(radio.closest("label")?.className).toBe("omni-radio r")
	})

	it("a radio can have a slot label; a group without label or helper has no dangling references", () => {
		mount(() => h(RadioGroup, { id: "g" }, slot(h(Radio, { value: "a" }, slot("Slotted")))))
		expect(screen.getByRole("radio", { name: "Slotted" })).toBeTruthy()
		expect(screen.getByRole("radiogroup").hasAttribute("aria-labelledby")).toBe(false)
	})
})

describe("FormGroup", () => {
	it("groups checkboxes under a legend with helper text", () => {
		const { container } = mount(() => h(FormGroup, { label: "Pets", helperText: "Choose any", row: true, error: true }, slot(h(Checkbox, { label: "Cat" }), h(Checkbox, { label: "Dog" }))))
		const fieldset = screen.getByRole("group", { name: "Pets" })
		expect(fieldset.getAttribute("aria-describedby")).toBe(screen.getByText("Choose any").id)
		expect(container.querySelector(".omni-form-group__items")?.hasAttribute("data-row")).toBe(true)
		mount(() => h(FormGroup, null, slot(h(Checkbox, { label: "Alone" }))))
		expect(document.querySelectorAll("fieldset").length).toBe(2)
	})
})

describe("server rendering", () => {
	it("renders them to HTML with their checked state", async () => {
		const html = await renderToString(
			createSSRApp({ render: () => [h(Checkbox, { label: "A", defaultChecked: true }), h(RadioGroup, { label: "G", defaultValue: "b" }, slot(h(Radio, { value: "a", label: "A" }), h(Radio, { value: "b", label: "B" })))] }),
		)
		expect(html).toContain('type="checkbox"')
		expect(html).toMatch(/<input[^>]*checked[^>]*>/)
		expect(html).toContain('role="radiogroup"')
	})
})
