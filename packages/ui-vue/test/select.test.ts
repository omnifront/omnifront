import { fireEvent, screen, waitFor } from "@testing-library/dom"
import { createSSRApp, h, ref } from "vue"
import { renderToString } from "vue/server-renderer"
import { describe, expect, it, vi } from "vitest"
import { Select, ThemeProvider, createTheme } from "../src"
import { flush, mount, slot } from "./mount"

const options = [
	{ value: "a", label: "Apple" },
	{ value: "b", label: "Banana", disabled: true },
	{ value: "c", label: "Cherry" },
]
const key = (el: Element, k: string): void => void fireEvent.keyDown(el, { key: k })

describe("Select", () => {
	it("is a combobox labelled by its label and its own text, with a listbox when open", async () => {
		mount(() => h(Select, { label: "Fruit", options, defaultValue: "c", helperText: "Pick one" }))
		const combobox = screen.getByRole("combobox", { name: /Fruit/ })
		expect(combobox.getAttribute("aria-haspopup")).toBe("listbox")
		expect(combobox.getAttribute("aria-expanded")).toBe("false")
		expect(combobox.textContent).toBe("Cherry")
		expect(combobox.getAttribute("aria-describedby")).toBe(screen.getByText("Pick one").id)
		fireEvent.click(combobox)
		const list = await screen.findByRole("listbox", { name: "Fruit" })
		expect(combobox.getAttribute("aria-expanded")).toBe("true")
		expect(combobox.getAttribute("aria-controls")).toBe(list.id)
		const items = screen.getAllByRole("option")
		expect(items.map((i) => i.textContent)).toEqual(["Apple", "Banana", "Cherry"])
		expect(items[2]?.getAttribute("aria-selected")).toBe("true")
		expect(items[1]?.getAttribute("aria-disabled")).toBe("true")
		expect(list.closest("[data-omni-portal]")?.parentElement).toBe(document.body)
	})

	it("opens with the arrows; focuses the selected option; Enter chooses and focus returns", async () => {
		const onChange = vi.fn()
		mount(() => h(Select, { label: "Fruit", options, defaultValue: "c", onChange }))
		const combobox = screen.getByRole("combobox")
		combobox.focus()
		key(combobox, "ArrowDown")
		await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("option", { name: "Cherry" })))
		key(document.activeElement as Element, "ArrowDown")
		expect(document.activeElement).toBe(screen.getByRole("option", { name: "Apple" }))
		key(document.activeElement as Element, "Enter")
		expect(onChange).toHaveBeenCalledWith(expect.anything(), "a")
		await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
		expect(screen.getByRole("combobox").textContent).toBe("Apple")
		expect(document.activeElement).toBe(screen.getByRole("combobox"))
		for (const k of ["Enter", " ", "ArrowUp"]) {
			key(screen.getByRole("combobox"), k)
			await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy())
			key(screen.getByRole("listbox"), "Escape")
			await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
		}
	})

	it("a click on an option chooses it; a disabled option does nothing; the label floats with a value", async () => {
		const onChange = vi.fn()
		const { container } = mount(() => h(Select, { label: "Fruit", options, onChange }))
		const root = container.querySelector(".omni-select") as HTMLElement
		expect(root.hasAttribute("data-shrink")).toBe(false)
		fireEvent.click(screen.getByRole("combobox"))
		fireEvent.click(await screen.findByRole("option", { name: "Banana" }))
		expect(onChange).not.toHaveBeenCalled()
		fireEvent.click(screen.getByRole("option", { name: "Cherry" }))
		expect(onChange).toHaveBeenCalledWith(expect.anything(), "c")
		await waitFor(() => expect(root.hasAttribute("data-filled")).toBe(true))
		expect(root.hasAttribute("data-shrink")).toBe(true)
	})

	it("v-model: shows the value, follows the parent and reports changes", async () => {
		const value = ref("a")
		mount(() => h(Select, { label: "Fruit", options, modelValue: value.value, "onUpdate:modelValue": (v: string) => (value.value = v) }))
		expect(screen.getByRole("combobox").textContent).toBe("Apple")
		value.value = "c"
		await flush()
		expect(screen.getByRole("combobox").textContent).toBe("Cherry")
		fireEvent.click(screen.getByRole("combobox"))
		fireEvent.click(await screen.findByRole("option", { name: "Apple" }))
		await waitFor(() => expect(screen.getByRole("combobox").textContent).toBe("Apple"))
		expect(value.value).toBe("a")
	})

	it("closes on Escape and a press outside, and reports why; open can be controlled", async () => {
		const onClose = vi.fn()
		const updates = vi.fn()
		mount(() => h(Select, { label: "Fruit", options, onClose, "onUpdate:open": updates }))
		for (const [act, reason] of [
			[() => key(screen.getByRole("listbox"), "Escape"), "escapeKeyDown"],
			[() => fireEvent.pointerDown(document.body), "outsidePress"],
		] as const) {
			fireEvent.click(screen.getByRole("combobox"))
			await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy())
			act()
			expect(onClose).toHaveBeenLastCalledWith(reason)
			await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
		}
		expect(updates).toHaveBeenCalledWith(true)
		expect(updates).toHaveBeenCalledWith(false)
		const open = ref(true)
		mount(() => h(Select, { label: "Other", options, open: open.value }))
		await waitFor(() => expect(screen.getAllByRole("listbox").length).toBeGreaterThan(0))
	})

	it("disabled cannot be opened; error and required show; a hidden input carries the value for forms", () => {
		const { container } = mount(() =>
			h("div", null, [
				h(Select, { label: "Fruit", options, disabled: true, name: "fruit", defaultValue: "a" }),
				h(Select, { label: "Other", options, error: true, required: true, helperText: "Required" }),
			]),
		)
		const [disabled, other] = screen.getAllByRole("combobox") as [HTMLElement, HTMLElement]
		expect(disabled.getAttribute("aria-disabled")).toBe("true")
		expect(disabled.getAttribute("tabindex")).toBe("-1")
		fireEvent.click(disabled)
		expect(screen.queryByRole("listbox")).toBeNull()
		const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
		expect([hidden.name, hidden.value]).toEqual(["fruit", "a"])
		expect(other.getAttribute("aria-invalid")).toBe("true")
		expect(other.getAttribute("aria-required")).toBe("true")
		expect(container.querySelector(".omni-text-field__required")?.getAttribute("aria-hidden")).toBe("true")
	})

	it("variant, size, colour, fullWidth, no label, classes, clicking the label focuses the select", () => {
		const { container } = mount(() =>
			h("div", null, [
				h(Select, { options, variant: "filled", size: "small", color: "secondary", fullWidth: true, class: "mine" }),
				h(Select, { label: "Other", options }),
			]),
		)
		const root = container.querySelector(".omni-select") as HTMLElement
		expect(root.dataset).toMatchObject({ variant: "filled", size: "small", color: "secondary", fullWidth: "" })
		expect(root.hasAttribute("data-has-label")).toBe(false)
		expect(root.className).toContain("mine")
		fireEvent.click(screen.getByText("Other", { selector: "label" }))
		expect(document.activeElement?.getAttribute("role")).toBe("combobox")
	})

	it("takes defaults from the theme", () => {
		const theme = createTheme({ components: { OmniSelect: { defaultProps: { variant: "standard" } } } })
		const { container } = mount(() => h(ThemeProvider, { theme }, slot(h(Select, { label: "Fruit", options }))))
		expect((container.querySelector(".omni-select") as HTMLElement).dataset["variant"]).toBe("standard")
	})

	it("renders on the server with the selected label and no list", async () => {
		const html = await renderToString(createSSRApp({ render: () => h(Select, { label: "Fruit", options, defaultValue: "c", name: "fruit" }) }))
		expect(html).toContain("Cherry")
		expect(html).toContain('role="combobox"')
		expect(html).toMatch(/data-shrink/)
		expect(html).not.toContain('role="listbox"')
	})
})
