import { fireEvent, screen, waitFor } from "@testing-library/dom"
import { createSSRApp, h, ref } from "vue"
import { renderToString } from "vue/server-renderer"
import { describe, expect, it, vi } from "vitest"
import { Button, ButtonGroup, Fab, IconButton, Rating, Select, Slider, TextField, ThemeProvider, ToggleButton, ToggleButtonGroup, createTheme } from "../src"
import { flush, mount, slot } from "./mount"

describe("IconButton and Fab", () => {
	it("an icon button is a round button; ripples centred; link, disabled, theme defaults", () => {
		const onClick = vi.fn()
		const theme = createTheme({ components: { OmniIconButton: { defaultProps: { color: "secondary" } } } })
		mount(() =>
			h(ThemeProvider, { theme }, slot(
				h(IconButton, { "aria-label": "Delete", onClick }, slot(h("svg"))),
				h(IconButton, { "aria-label": "Edit", color: "error", size: "small", edge: "start", disableRipple: true, class: "mine" }, slot(h("svg"))),
				h(IconButton, { "aria-label": "Off", disabled: true }, slot(h("svg"))),
				h(IconButton, { "aria-label": "Docs", href: "/docs" }, slot(h("svg"))),
			)),
		)
		const del = screen.getByRole("button", { name: "Delete" })
		expect(del.className).toBe("omni-icon-button")
		expect(del.dataset).toMatchObject({ color: "secondary", size: "medium" })
		fireEvent.click(del)
		expect(onClick).toHaveBeenCalledTimes(1)
		fireEvent.pointerDown(del, { button: 0, clientX: 3, clientY: 3 })
		expect(del.querySelector(".omni-ripple")).not.toBeNull()
		const edit = screen.getByRole("button", { name: "Edit" })
		expect(edit.dataset).toMatchObject({ color: "error", size: "small", edge: "start" })
		expect(edit.className).toBe("omni-icon-button mine")
		fireEvent.pointerDown(edit, { button: 0, clientX: 3, clientY: 3 })
		expect(edit.querySelector(".omni-ripple")).toBeNull()
		expect((screen.getByRole("button", { name: "Off" }) as HTMLButtonElement).disabled).toBe(true)
		const link = screen.getByRole("button", { name: "Docs" })
		expect(link.tagName).toBe("A")
	})

	it("a disabled icon-button link swallows the click", () => {
		const onClick = vi.fn()
		mount(() => h(IconButton, { "aria-label": "L", href: "/x", disabled: true, onClick }, slot(h("svg"))))
		expect(fireEvent.click(screen.getByRole("button"))).toBe(false)
		expect(onClick).not.toHaveBeenCalled()
	})

	it("a fab is large and primary; extended has text; link and disabled", async () => {
		const onClick = vi.fn()
		const variant = ref<"circular" | "extended">("circular")
		mount(() =>
			h("div", null, [
				h(Fab, { "aria-label": "Add", onClick, variant: variant.value }, slot(h("svg"))),
				h(Fab, { variant: "extended", size: "small", color: "secondary" }, slot("Create")),
				h(Fab, { "aria-label": "Go", href: "/go", disabled: true }, slot(h("svg"))),
			]),
		)
		expect(screen.getByRole("button", { name: "Add" }).dataset).toMatchObject({ variant: "circular", color: "primary", size: "large" })
		expect(screen.getByRole("button", { name: "Create" }).dataset).toMatchObject({ variant: "extended", color: "secondary", size: "small" })
		expect(fireEvent.click(screen.getByRole("button", { name: "Go" }))).toBe(false)
		fireEvent.click(screen.getByRole("button", { name: "Add" }))
		expect(onClick).toHaveBeenCalled()
		variant.value = "extended"
		await flush()
		expect(screen.getByRole("button", { name: "Add" }).dataset["variant"]).toBe("extended")
	})
})

describe("ButtonGroup", () => {
	it("hands variant, colour, size and disabled to its Buttons; their own props win; role=group", () => {
		mount(() =>
			h(ButtonGroup, { variant: "outlined", color: "secondary", size: "small", "aria-label": "Actions", class: "mine", orientation: "vertical", fullWidth: true }, slot(h(Button, null, slot("One")), h(Button, { variant: "contained" }, slot("Two")))),
		)
		const group = screen.getByRole("group", { name: "Actions" })
		expect(group.className).toBe("omni-button-group mine")
		expect(group.dataset).toMatchObject({ orientation: "vertical", fullWidth: "" })
		expect(screen.getByText("One").dataset).toMatchObject({ variant: "outlined", color: "secondary", size: "small" })
		expect(screen.getByText("Two").dataset["variant"]).toBe("contained")
	})

	it("disabled disables every Button, and a Button outside a group is unchanged", () => {
		mount(() => h("div", null, [h(ButtonGroup, { disabled: true, disableElevation: true }, slot(h(Button, null, slot("A")), h(Button, null, slot("B")))), h(Button, null, slot("Free"))]))
		expect((screen.getByText("A") as HTMLButtonElement).disabled).toBe(true)
		expect(screen.getByText("A").hasAttribute("data-disable-elevation")).toBe(true)
		expect((screen.getByText("Free") as HTMLButtonElement).disabled).toBe(false)
	})
})

describe("ToggleButtonGroup and ToggleButton", () => {
	it("several can be pressed; the group reports (event, list)", async () => {
		const onChange = vi.fn()
		mount(() =>
			h(ToggleButtonGroup, { "aria-label": "Format", onChange: (_e: unknown, v: unknown) => onChange(v), size: "small", color: "secondary" }, slot(
				h(ToggleButton, { value: "bold" }, slot("Bold")),
				h(ToggleButton, { value: "italic" }, slot("Italic")),
				h(ToggleButton, { value: "under", disabled: true }, slot("Underline")),
			)),
		)
		expect(screen.getByRole("group", { name: "Format" })).toBeTruthy()
		const bold = screen.getByRole("button", { name: "Bold" })
		expect(bold.getAttribute("aria-pressed")).toBe("false")
		fireEvent.click(bold)
		fireEvent.click(screen.getByRole("button", { name: "Italic" }))
		await flush()
		expect(bold.getAttribute("aria-pressed")).toBe("true")
		expect(onChange.mock.calls.map((c) => c[0])).toEqual([["bold"], ["bold", "italic"]])
		expect(bold.dataset).toMatchObject({ color: "secondary", size: "small", selected: "" })
		expect((screen.getByRole("button", { name: "Underline" }) as HTMLButtonElement).disabled).toBe(true)
	})

	it("exclusive: one at a time (a string or null); v-model follows the parent; defaultValue", async () => {
		const v = ref<string | null>("a")
		mount(() =>
			h("div", null, [
				h(ToggleButtonGroup, { exclusive: true, modelValue: v.value, "onUpdate:modelValue": (n: unknown) => (v.value = n as string | null) }, slot(h(ToggleButton, { value: "a" }, slot("A")), h(ToggleButton, { value: "b" }, slot("B")))),
				h(ToggleButtonGroup, { defaultValue: ["x"], orientation: "vertical", fullWidth: true }, slot(h(ToggleButton, { value: "x" }, slot("X")))),
				h(ToggleButtonGroup, { exclusive: true, defaultValue: "y", disabled: true }, slot(h(ToggleButton, { value: "y" }, slot("Y")))),
			]),
		)
		expect(screen.getByText("A").getAttribute("aria-pressed")).toBe("true")
		fireEvent.click(screen.getByText("B"))
		await flush()
		expect([screen.getByText("A").getAttribute("aria-pressed"), screen.getByText("B").getAttribute("aria-pressed")]).toEqual(["false", "true"])
		fireEvent.click(screen.getByText("B"))
		await flush()
		expect(v.value).toBeNull()
		expect(screen.getByText("X").getAttribute("aria-pressed")).toBe("true")
		expect(screen.getByText("X").closest("div")?.dataset).toMatchObject({ orientation: "vertical", fullWidth: "" })
		expect(screen.getByText("Y").getAttribute("aria-pressed")).toBe("true")
		expect((screen.getByText("Y") as HTMLButtonElement).disabled).toBe(true)
	})

	it("a ToggleButton outside a group is a plain pressed/unpressed button", () => {
		const onChange = vi.fn()
		mount(() => h(ToggleButton, { value: "solo", selected: true, onChange: (_e: unknown, v: unknown) => onChange(v), color: "success", size: "large", class: "mine" }, slot("Solo")))
		const solo = screen.getByRole("button", { name: "Solo" })
		expect(solo.getAttribute("aria-pressed")).toBe("true")
		expect(solo.dataset).toMatchObject({ color: "success", size: "large" })
		fireEvent.click(solo)
		expect(onChange).toHaveBeenCalledWith("solo")
	})
})

describe("Slider", () => {
	const range = (): HTMLInputElement => screen.getByRole("slider") as HTMLInputElement

	it("is a native range input with min, max, step and a name from aria-label", () => {
		mount(() => h(Slider, { "aria-label": "Volume", defaultValue: 30, min: 10, max: 50, step: 5, name: "vol" }))
		expect([range().type, range().min, range().max, range().step, range().value, range().name]).toEqual(["range", "10", "50", "5", "30", "vol"])
		expect(screen.getByRole("slider", { name: "Volume" })).toBeTruthy()
	})

	it("uncontrolled keeps the value and reports (event, value); steps and clamping apply", async () => {
		const onChange = vi.fn()
		const { container } = mount(() => h(Slider, { "aria-label": "v", onChange, step: 10 }))
		fireEvent.input(range(), { target: { value: "47" } })
		await flush()
		expect(onChange).toHaveBeenLastCalledWith(expect.anything(), 50)
		expect(range().value).toBe("50")
		expect((container.querySelector(".omni-slider") as HTMLElement).style.getPropertyValue("--omni-slider-percent")).toBe("50")
	})

	it("v-model follows the parent", async () => {
		const v = ref(20)
		mount(() => h(Slider, { "aria-label": "c", modelValue: v.value, "onUpdate:modelValue": (n: number) => (v.value = n) }))
		fireEvent.input(range(), { target: { value: "40" } })
		await flush()
		expect(v.value).toBe(40)
		v.value = 80
		await flush()
		expect(range().value).toBe("80")
	})

	it("value label, marks with labels, aria-valuetext, size, colour, disabled, class", () => {
		const { container } = mount(() =>
			h(Slider, {
				"aria-labelledby": "lbl",
				defaultValue: 2,
				min: 0,
				max: 4,
				valueLabelDisplay: "on",
				valueLabelFormat: (v: number) => `${v}°`,
				getAriaValueText: (v: number) => `${v} degrees`,
				marks: [{ value: 0, label: "Cold" }, { value: 4, label: "Hot" }, { value: 2 }],
				size: "small",
				color: "secondary",
				disabled: true,
				class: "mine",
			}),
		)
		const root = container.querySelector(".omni-slider") as HTMLElement
		expect(root.className).toBe("omni-slider mine")
		expect(root.dataset).toMatchObject({ size: "small", color: "secondary", label: "on", disabled: "", marksLabels: "" })
		expect(root.querySelector(".omni-slider__label")?.textContent).toBe("2°")
		expect(range().getAttribute("aria-valuetext")).toBe("2 degrees")
		expect(range().getAttribute("aria-labelledby")).toBe("lbl")
		expect(range().disabled).toBe(true)
		expect(Array.from(root.querySelectorAll(".omni-slider__mark-label")).map((n) => n.textContent)).toEqual(["Cold", "Hot"])
		expect(root.querySelectorAll(".omni-slider__mark").length).toBe(3)
	})

	it("marks=true puts a mark on every step; a plain value label; no label or marks unless asked", () => {
		const { container } = mount(() => h("div", null, [h(Slider, { "aria-label": "m", min: 0, max: 10, step: 5, marks: true, valueLabelDisplay: "auto", defaultValue: 5 }), h(Slider, { "aria-label": "n" })]))
		const [first, second] = Array.from(container.querySelectorAll(".omni-slider")) as HTMLElement[]
		expect(first?.querySelectorAll(".omni-slider__mark").length).toBe(3)
		expect(first?.querySelector(".omni-slider__label")?.textContent).toBe("5")
		expect(second?.querySelector(".omni-slider__label")).toBeNull()
		expect(second?.querySelector(".omni-slider__marks")).toBeNull()
	})
})

describe("Rating", () => {
	const radios = (): HTMLInputElement[] => screen.getAllByRole("radio") as HTMLInputElement[]
	const fills = (c: Element): string[] => Array.from(c.querySelectorAll(".omni-rating__star")).map((s) => (s as HTMLElement).dataset["fill"] as string)

	it("is a radiogroup of native radios: a hidden 'no rating' one and one per star", () => {
		mount(() => h(Rating, { "aria-label": "Rating", name: "stars", defaultValue: 3 }))
		expect(screen.getByRole("radiogroup", { name: "Rating" })).toBeTruthy()
		expect(radios().map((r) => r.value)).toEqual(["0", "1", "2", "3", "4", "5"])
		expect(radios().find((r) => r.checked)?.value).toBe("3")
		expect(new Set(radios().map((r) => r.name))).toEqual(new Set(["stars"]))
		expect(radios()[3]?.getAttribute("aria-label")).toBe("3 out of 5")
	})

	it("choosing rates, choosing the same value clears, and the stars fill", async () => {
		const onChange = vi.fn()
		const { container } = mount(() => h(Rating, { "aria-label": "r", onChange }))
		fireEvent.click(radios()[4] as HTMLElement)
		await flush()
		expect(onChange).toHaveBeenLastCalledWith(expect.anything(), 4)
		expect(fills(container)).toEqual(["100", "100", "100", "100", "0"])
		fireEvent.click(radios()[4] as HTMLElement)
		await flush()
		expect(onChange).toHaveBeenLastCalledWith(expect.anything(), 0)
		expect(radios().find((r) => r.checked)?.value).toBe("0")
		fireEvent.click(radios()[2] as HTMLElement)
		await flush()
		fireEvent.click(radios()[0] as HTMLElement)
		await flush()
		expect(radios().find((r) => r.checked)?.value).toBe("0")
	})

	it("hovering previews the value and reports it; leaving restores it", async () => {
		const onChangeActive = vi.fn()
		const { container } = mount(() => h(Rating, { "aria-label": "r", defaultValue: 1, onChangeActive }))
		fireEvent.pointerEnter(radios()[4] as HTMLElement)
		await flush()
		expect(onChangeActive).toHaveBeenCalledWith(4)
		expect(fills(container)[3]).toBe("100")
		fireEvent.pointerLeave(radios()[4] as HTMLElement)
		await flush()
		expect(onChangeActive).toHaveBeenLastCalledWith(undefined)
		expect(fills(container)[3]).toBe("0")
	})

	it("half precision gives two radios per star and half-filled stars; max and size", () => {
		const { container } = mount(() => h(Rating, { "aria-label": "r", precision: 0.5, max: 3, defaultValue: 2.5, size: "large", color: "primary" }))
		expect(radios().map((r) => r.value)).toEqual(["0", "0.5", "1", "1.5", "2", "2.5", "3"])
		expect(fills(container)).toEqual(["100", "100", "50"])
		expect((container.querySelector(".omni-rating") as HTMLElement).dataset).toMatchObject({ size: "large", color: "primary" })
	})

	it("v-model follows the parent; disabled cannot be changed", async () => {
		const v = ref(2)
		const { container } = mount(() =>
			h("div", null, [h(Rating, { "aria-label": "c", modelValue: v.value, "onUpdate:modelValue": (n: number) => (v.value = n) }), h(Rating, { "aria-label": "d", disabled: true, defaultValue: 1 })]),
		)
		v.value = 5
		await flush()
		expect(radios().filter((r) => r.checked).map((r) => r.value)).toContain("5")
		const ratings = container.querySelectorAll(".omni-rating")
		expect(ratings[1]?.hasAttribute("data-disabled")).toBe(true)
		expect(Array.from(ratings[1]?.querySelectorAll("input") ?? []).every((i) => i.disabled)).toBe(true)
	})

	it("read-only is an image with a text alternative and no inputs", () => {
		const { container } = mount(() => h(Rating, { readOnly: true, defaultValue: 3.5, precision: 0.5 }))
		const image = screen.getByRole("img", { name: "3.5 out of 5" })
		expect(image.hasAttribute("data-readonly")).toBe(true)
		expect(container.querySelectorAll("input").length).toBe(0)
		expect(fills(container)).toEqual(["100", "100", "100", "50", "0"])
	})

	it("renders on the server", async () => {
		const html = await renderToString(createSSRApp({ render: () => h(Rating, { "aria-label": "r", defaultValue: 2 }) }))
		expect(html).toContain('role="radiogroup"')
		expect(html).toContain('data-fill="100"')
	})
})

describe("TextField autosize", () => {
	it("a multiline field with minRows or maxRows is sized from its text, and follows value changes", async () => {
		const original = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "scrollHeight")
		Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", { configurable: true, get: () => 100 })
		try {
			const v = ref("a")
			mount(() => h(TextField, { label: "Bio", multiline: true, minRows: 2, maxRows: 3, modelValue: v.value, "onUpdate:modelValue": (n: string) => (v.value = n) }))
			const area = screen.getByLabelText("Bio") as HTMLTextAreaElement
			expect(area.getAttribute("rows")).toBe("2")
			await waitFor(() => expect(area.style.height).not.toBe(""))
			const first = area.style.height
			fireEvent.input(area, { target: { value: "more text" } })
			v.value = "changed"
			await flush()
			await waitFor(() => expect(area.value).toBe("changed"))
			expect(area.style.height).toBe(first)
		} finally {
			if (original) Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", original)
			else delete (HTMLTextAreaElement.prototype as unknown as Record<string, unknown>)["scrollHeight"]
		}
	})

	it("without minRows and maxRows the textarea keeps rows and is not touched", () => {
		mount(() => h(TextField, { label: "Plain", multiline: true, rows: 4 }))
		const area = screen.getByLabelText("Plain") as HTMLTextAreaElement
		expect(area.getAttribute("rows")).toBe("4")
		expect(area.style.height).toBe("")
	})
})

describe("Select multiple", () => {
	const options = [
		{ value: "a", label: "Apple" },
		{ value: "b", label: "Banana", disabled: true },
		{ value: "c", label: "Cherry" },
		{ value: "d", label: "Date" },
	]

	it("toggles options, shows the labels together, keeps the list open, reports (event, list)", async () => {
		const onChange = vi.fn()
		mount(() => h(Select, { label: "Fruit", multiple: true, options, onChange, name: "fruit" }))
		const combobox = screen.getByRole("combobox")
		fireEvent.click(combobox)
		const list = await screen.findByRole("listbox")
		expect(list.getAttribute("aria-multiselectable")).toBe("true")
		fireEvent.click(screen.getByRole("option", { name: "Cherry" }))
		fireEvent.click(screen.getByRole("option", { name: "Apple" }))
		await flush()
		expect(onChange.mock.calls.map((c) => c[1])).toEqual([["c"], ["c", "a"]])
		expect(combobox.textContent).toBe("Apple, Cherry")
		expect(screen.getByRole("listbox")).toBeTruthy()
		expect(screen.getByRole("option", { name: "Apple" }).getAttribute("aria-selected")).toBe("true")
		fireEvent.click(screen.getByRole("option", { name: "Cherry" }))
		await flush()
		expect(combobox.textContent).toBe("Apple")
		const hidden = Array.from(document.querySelectorAll('input[type="hidden"]')) as HTMLInputElement[]
		expect(hidden.map((x) => [x.name, x.value])).toEqual([["fruit", "a"]])
		fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" })
		await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
	})

	it("v-model with a list, and default values", async () => {
		const v = ref<string[]>(["d"])
		mount(() =>
			h("div", null, [
				h(Select, { label: "F", multiple: true, options, modelValue: v.value, "onUpdate:modelValue": (n: unknown) => (v.value = n as string[]) }),
				h(Select, { label: "D", multiple: true, options, defaultValue: ["c", "d"] }),
				h(Select, { label: "S", options, defaultValue: "", name: "s" }),
			]),
		)
		expect(screen.getAllByRole("combobox")[0]?.textContent).toBe("Date")
		v.value = ["a", "c"]
		await flush()
		expect(screen.getAllByRole("combobox")[0]?.textContent).toBe("Apple, Cherry")
		expect(screen.getAllByRole("combobox")[1]?.textContent).toBe("Cherry, Date")
		expect(document.querySelector('input[type="hidden"][name="s"]')).not.toBeNull()
	})
})

describe("TextField (uncontrolled)", () => {
	it("keeps what was typed when the field re-renders, and starts from defaultValue", async () => {
		mount(() => h(TextField, { label: "Notes", multiline: true, minRows: 2, maxRows: 4, defaultValue: "start" }))
		const box = screen.getByRole("textbox", { name: "Notes" }) as HTMLTextAreaElement
		expect(box.value).toBe("start")
		box.value = "one\ntwo"
		await fireEvent.input(box)
		await flush()
		expect(box.value).toBe("one\ntwo")
	})
})
