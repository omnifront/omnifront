import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { StrictMode, useState } from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { Select, ThemeProvider, createTheme } from "../src"

const options = [
	{ value: "a", label: "Apple" },
	{ value: "b", label: "Banana", disabled: true },
	{ value: "c", label: "Cherry" },
]
const key = (el: Element, k: string): void => void fireEvent.keyDown(el, { key: k })

describe("Select", () => {
	it("is a combobox labelled by its label and its own text, with a listbox when open", async () => {
		render(<Select label="Fruit" options={options} defaultValue="c" helperText="Pick one" />)
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

	it("opens with Enter, Space and the arrows; focuses the selected option; Enter chooses and focus returns", async () => {
		const onChange = vi.fn()
		render(<Select label="Fruit" options={options} defaultValue="c" onChange={onChange} />)
		const combobox = screen.getByRole("combobox")
		combobox.focus()
		key(combobox, "ArrowDown")
		await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("option", { name: "Cherry" })))
		key(document.activeElement as Element, "ArrowDown") // wraps to the first
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
		const { container } = render(<Select label="Fruit" options={options} onChange={onChange} />)
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

	it("controlled: shows the value the parent passes, and follows it", async () => {
		function Controlled() {
			const [value, setValue] = useState("a")
			return (
				<>
					<Select label="Fruit" options={options} value={value} onChange={(_e, v) => setValue(v)} />
					<button onClick={() => setValue("c")}>set cherry</button>
				</>
			)
		}
		render(<Controlled />)
		expect(screen.getByRole("combobox").textContent).toBe("Apple")
		fireEvent.click(screen.getByText("set cherry"))
		expect(screen.getByRole("combobox").textContent).toBe("Cherry")
		fireEvent.click(screen.getByRole("combobox"))
		fireEvent.click(await screen.findByRole("option", { name: "Apple" }))
		await waitFor(() => expect(screen.getByRole("combobox").textContent).toBe("Apple"))
	})

	it("closes on Escape and a press outside, and reports why", async () => {
		const onOpenChange = vi.fn()
		render(<Select label="Fruit" options={options} onOpenChange={onOpenChange} />)
		for (const [act, reason] of [
			[() => key(screen.getByRole("listbox"), "Escape"), "escapeKeyDown"],
			[() => fireEvent.pointerDown(document.body), "outsidePress"],
		] as const) {
			fireEvent.click(screen.getByRole("combobox"))
			await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy())
			act()
			expect(onOpenChange).toHaveBeenLastCalledWith(false, reason)
			await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
		}
	})

	it("disabled cannot be opened; error and required show; a hidden input carries the value for forms", () => {
		const { container, rerender } = render(<Select label="Fruit" options={options} disabled name="fruit" defaultValue="a" />)
		const combobox = screen.getByRole("combobox")
		expect(combobox.getAttribute("aria-disabled")).toBe("true")
		expect(combobox.getAttribute("tabindex")).toBe("-1")
		fireEvent.click(combobox)
		expect(screen.queryByRole("listbox")).toBeNull()
		expect((container.querySelector('input[type="hidden"]') as HTMLInputElement).name).toBe("fruit")
		expect((container.querySelector('input[type="hidden"]') as HTMLInputElement).value).toBe("a")
		rerender(<Select label="Fruit" options={options} error required helperText="Required" />)
		expect(screen.getByRole("combobox").getAttribute("aria-invalid")).toBe("true")
		expect(screen.getByRole("combobox").getAttribute("aria-required")).toBe("true")
		expect(container.querySelector(".omni-text-field__required")?.getAttribute("aria-hidden")).toBe("true")
	})

	it("variant, size, colour, fullWidth, a field with no label, clicking the label focuses it, forwarded ref", () => {
		const ref = { current: null as HTMLDivElement | null }
		const { container } = render(<Select options={options} variant="filled" size="small" color="secondary" fullWidth ref={ref} className="mine" />)
		const root = container.querySelector(".omni-select") as HTMLElement
		expect(root.dataset).toMatchObject({ variant: "filled", size: "small", color: "secondary", fullWidth: "" })
		expect(root.hasAttribute("data-has-label")).toBe(false)
		expect(root.className).toBe("omni-text-field omni-select mine")
		expect(ref.current).toBe(root)
		render(<Select label="Other" options={options} />)
		fireEvent.click(screen.getByText("Other", { selector: "label" }))
		expect(document.activeElement?.getAttribute("role")).toBe("combobox")
	})

	it("works in StrictMode and takes defaults from the theme", async () => {
		const theme = createTheme({ components: { OmniSelect: { defaultProps: { variant: "standard" } } } })
		const { container } = render(
			<StrictMode>
				<ThemeProvider theme={theme}>
					<Select label="Fruit" options={options} />
				</ThemeProvider>
			</StrictMode>,
		)
		expect((container.querySelector(".omni-select") as HTMLElement).dataset["variant"]).toBe("standard")
		fireEvent.click(screen.getByRole("combobox"))
		expect(await screen.findByRole("listbox")).toBeTruthy()
	})

	it("renders on the server with the selected label and no list", () => {
		const html = renderToString(<Select label="Fruit" options={options} defaultValue="c" name="fruit" />)
		expect(html).toContain("Cherry")
		expect(html).toContain('role="combobox"')
		expect(html).toContain("data-shrink")
		expect(html).not.toContain('role="listbox"')
	})
})
