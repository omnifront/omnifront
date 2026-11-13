import { fireEvent, screen } from "@testing-library/dom"
import { createSSRApp, h, ref } from "vue"
import { renderToString } from "vue/server-renderer"
import { describe, expect, it, vi } from "vitest"
import { Switch, ThemeProvider, createTheme } from "../src"
import { flush, mount, slot } from "./mount"

const sw = (name?: string): HTMLInputElement => screen.getByRole("switch", name ? { name } : {}) as HTMLInputElement

describe("Switch", () => {
	it("is a native checkbox with role=switch, named by its label (prop or slot), in a clickable label", () => {
		mount(() => h("div", null, [h(Switch, { label: "Wi-Fi" }), h(Switch, null, slot(h("b", null, "Rich")))]))
		const input = sw("Wi-Fi")
		expect([input.type, input.checked]).toEqual(["checkbox", false])
		expect(input.closest("label")?.className).toBe("omni-switch")
		fireEvent.click(screen.getByText("Wi-Fi"))
		expect(input.checked).toBe(true)
		expect(sw("Rich")).toBeTruthy()
	})

	it("uncontrolled reports (event, checked); defaultChecked; v-model follows the parent and puts back a refused change", async () => {
		const onChange = vi.fn()
		const on = ref(false)
		mount(() =>
			h("div", null, [
				h(Switch, { label: "A", onChange }),
				h(Switch, { label: "B", defaultChecked: true }),
				h(Switch, { label: "C", modelValue: on.value, "onUpdate:modelValue": (v: boolean) => (on.value = v) }),
				h(Switch, { label: "Stuck", modelValue: false }),
			]),
		)
		fireEvent.click(sw("A"))
		expect(onChange).toHaveBeenLastCalledWith(expect.anything(), true)
		expect(sw("B").checked).toBe(true)
		fireEvent.click(sw("C"))
		await flush()
		expect(on.value).toBe(true)
		on.value = false
		await flush()
		expect(sw("C").checked).toBe(false)
		fireEvent.click(sw("Stuck"))
		await flush()
		await flush()
		expect(sw("Stuck").checked).toBe(false)
	})

	it("disabled, required, error, name, value; aria attributes go to the input, the rest to the label; theme defaults", () => {
		const theme = createTheme({ components: { OmniSwitch: { defaultProps: { color: "secondary" } } } })
		const { container } = mount(() =>
			h(ThemeProvider, { theme }, slot(
				h(Switch, { label: "X", disabled: true, required: true, error: true, name: "n", value: "v", "aria-describedby": "d", class: "mine", "data-x": "1" }),
				h(Switch, { size: "small", labelPlacement: "start", "aria-label": "Hidden" }),
			)),
		)
		const x = sw("X")
		expect([x.disabled, x.required, x.name, x.value]).toEqual([true, true, "n", "v"])
		expect(x.getAttribute("aria-describedby")).toBe("d")
		const [first, second] = Array.from(container.querySelectorAll("label")) as unknown as [HTMLElement, HTMLElement]
		expect(first.dataset).toMatchObject({ disabled: "", error: "", x: "1", color: "secondary" })
		expect(first.className).toBe("omni-switch mine")
		expect(second.dataset).toMatchObject({ size: "small", labelPlacement: "start" })
		expect(sw("Hidden")).toBeTruthy()
	})

	it("renders on the server with its state", async () => {
		const html = await renderToString(createSSRApp({ render: () => h(Switch, { label: "S", defaultChecked: true }) }))
		expect(html).toContain('role="switch"')
		expect(html).toMatch(/checked/)
	})
})
