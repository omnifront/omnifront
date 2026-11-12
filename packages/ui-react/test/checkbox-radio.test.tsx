import { fireEvent, render, screen } from "@testing-library/react"
import { StrictMode, useState } from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { Checkbox, FormGroup, Radio, RadioGroup, ThemeProvider, createTheme } from "../src"

describe("Checkbox", () => {
	it("is a native checkbox named by its label, inside a clickable label", () => {
		render(<Checkbox label="Accept terms" />)
		const box = screen.getByRole("checkbox", { name: "Accept terms" }) as HTMLInputElement
		expect(box.type).toBe("checkbox")
		expect(box.checked).toBe(false)
		expect(box.closest("label")?.className).toBe("omni-checkbox")
		fireEvent.click(screen.getByText("Accept terms")) // the label text
		expect(box.checked).toBe(true)
	})

	it("uncontrolled keeps its own state and reports (event, checked)", () => {
		const onChange = vi.fn()
		render(<Checkbox label="A" onChange={onChange} />)
		fireEvent.click(screen.getByRole("checkbox"))
		expect(onChange).toHaveBeenLastCalledWith(expect.anything(), true)
		fireEvent.click(screen.getByRole("checkbox"))
		expect(onChange).toHaveBeenLastCalledWith(expect.anything(), false)
		render(<Checkbox label="B" defaultChecked />)
		expect((screen.getByRole("checkbox", { name: "B" }) as HTMLInputElement).checked).toBe(true)
	})

	it("controlled: shows what the parent says and follows it", () => {
		function Controlled() {
			const [on, setOn] = useState(false)
			return (
				<>
					<Checkbox label="C" checked={on} onChange={(_e, c) => setOn(c)} />
					<button onClick={() => setOn(true)}>force</button>
				</>
			)
		}
		render(<Controlled />)
		const box = screen.getByRole("checkbox") as HTMLInputElement
		fireEvent.click(box)
		expect(box.checked).toBe(true)
		fireEvent.click(box)
		expect(box.checked).toBe(false)
		fireEvent.click(screen.getByText("force"))
		expect(box.checked).toBe(true)
		// a controlled checkbox the parent does not update stays put
		render(<Checkbox label="Stuck" checked={false} onChange={() => {}} />)
		const stuck = screen.getByRole("checkbox", { name: "Stuck" }) as HTMLInputElement
		fireEvent.click(stuck)
		expect(stuck.checked).toBe(false)
	})

	it("indeterminate is set on the input, and survives a click until the parent clears it", () => {
		const { rerender } = render(<Checkbox label="Some" indeterminate />)
		const box = screen.getByRole("checkbox") as HTMLInputElement
		expect(box.indeterminate).toBe(true)
		fireEvent.click(box)
		expect(box.indeterminate).toBe(true) // still the parent's call
		rerender(<Checkbox label="Some" />)
		expect(box.indeterminate).toBe(false)
	})

	it("disabled, required and error", () => {
		const { container } = render(<Checkbox label="X" disabled required error name="n" value="v" />)
		const box = screen.getByRole("checkbox") as HTMLInputElement
		expect([box.disabled, box.required, box.name, box.value]).toEqual([true, true, "n", "v"])
		expect(box.getAttribute("aria-invalid")).toBe("true")
		const root = container.querySelector("label") as HTMLElement
		expect(root.dataset).toMatchObject({ disabled: "", error: "" })
		fireEvent.click(box)
		expect(box.checked).toBe(false)
	})

	it("size, colour, label placement, no label, an aria-label through slotProps, class, ref and theme defaults", () => {
		const ref = { current: null as HTMLLabelElement | null }
		const theme = createTheme({ components: { OmniCheckbox: { defaultProps: { color: "secondary" } } } })
		const { container } = render(
			<ThemeProvider theme={theme}>
				<Checkbox size="small" labelPlacement="start" slotProps={{ input: { "aria-label": "Hidden label" } }} className="mine" ref={ref} />
				<Checkbox label="y" color="error" />
			</ThemeProvider>,
		)
		const [first, second] = Array.from(container.querySelectorAll("label")) as unknown as [HTMLElement, HTMLElement]
		expect(first.dataset).toMatchObject({ size: "small", color: "secondary", labelPlacement: "start" })
		expect(first.className).toBe("omni-checkbox mine")
		expect(first.querySelector(".omni-checkbox__label")).toBeNull()
		expect(ref.current).toBe(first)
		expect(screen.getByRole("checkbox", { name: "Hidden label" })).toBeTruthy()
		expect(second.dataset["color"]).toBe("error")
	})
})

function Group({ onChange }: { onChange?: (v: string) => void }) {
	return (
		<RadioGroup label="Fruit" helperText="Pick one" name="fruit" onChange={(_e, v) => onChange?.(v)}>
			<Radio value="a" label="Apple" />
			<Radio value="b" label="Banana" disabled />
			<Radio value="c" label="Cherry" />
		</RadioGroup>
	)
}

describe("RadioGroup and Radio", () => {
	it("is a radiogroup named by its legend, with native radios sharing one name", () => {
		render(<Group />)
		const group = screen.getByRole("radiogroup", { name: "Fruit" })
		expect(group.tagName).toBe("FIELDSET")
		expect(group.getAttribute("aria-describedby")).toBe(screen.getByText("Pick one").id)
		const radios = screen.getAllByRole("radio") as HTMLInputElement[]
		expect(radios.map((r) => r.value)).toEqual(["a", "b", "c"])
		expect(new Set(radios.map((r) => r.name))).toEqual(new Set(["fruit"]))
		expect(radios.map((r) => r.checked)).toEqual([false, false, false])
		expect(radios[1]?.disabled).toBe(true)
	})

	it("choosing checks exactly one, reports (event, value), and a disabled radio cannot be chosen", () => {
		const onChange = vi.fn()
		render(<Group onChange={onChange} />)
		const [a, b, c] = screen.getAllByRole("radio") as HTMLInputElement[]
		fireEvent.click(screen.getByText("Apple"))
		expect([a?.checked, c?.checked]).toEqual([true, false])
		expect(b?.disabled).toBe(true) // (browsers never send a click to a disabled radio; jsdom would, so it is not simulated)
		fireEvent.click(c as HTMLElement)
		expect([a?.checked, c?.checked]).toEqual([false, true])
		expect(onChange.mock.calls.map((c) => c[0])).toEqual(["a", "c"])
	})

	it("controlled and defaultValue", () => {
		function Controlled() {
			const [v, setV] = useState("b")
			return (
				<>
					<RadioGroup label="G" value={v} onChange={(_e, n) => setV(n)}>
						<Radio value="a" label="A" />
						<Radio value="b" label="B" />
					</RadioGroup>
					<button onClick={() => setV("a")}>set a</button>
				</>
			)
		}
		render(<Controlled />)
		expect((screen.getByRole("radio", { name: "B" }) as HTMLInputElement).checked).toBe(true)
		fireEvent.click(screen.getByText("set a"))
		expect((screen.getByRole("radio", { name: "A" }) as HTMLInputElement).checked).toBe(true)
		render(
			<RadioGroup label="D" defaultValue="y">
				<Radio value="x" label="X" />
				<Radio value="y" label="Y" />
			</RadioGroup>,
		)
		expect((screen.getByRole("radio", { name: "Y" }) as HTMLInputElement).checked).toBe(true)
	})

	it("a disabled group disables every radio; error, required and row show", () => {
		const { container } = render(
			<RadioGroup label="G" disabled error required row helperText="Required">
				<Radio value="a" label="A" />
			</RadioGroup>,
		)
		const radio = screen.getByRole("radio") as HTMLInputElement
		expect([radio.disabled, radio.required]).toEqual([true, true])
		expect(radio.getAttribute("aria-invalid")).toBe("true")
		expect(radio.closest("label")?.hasAttribute("data-disabled")).toBe(true)
		expect(container.querySelector(".omni-form-group__items")?.hasAttribute("data-row")).toBe(true)
		expect(container.querySelector("fieldset")?.dataset).toMatchObject({ error: "", disabled: "" })
	})

	it("a Radio outside a group is a plain controlled radio", () => {
		const onChange = vi.fn()
		render(<Radio value="z" label="Solo" checked name="solo" onChange={onChange} labelPlacement="top" size="small" color="success" />)
		const radio = screen.getByRole("radio", { name: "Solo" }) as HTMLInputElement
		expect([radio.checked, radio.name]).toEqual([true, "solo"])
		fireEvent.click(radio) // already checked: no change event
		expect(radio.closest("label")?.dataset).toMatchObject({ labelPlacement: "top", size: "small", color: "success" })
	})

	it("works in StrictMode and in a group without label or helper", () => {
		render(
			<StrictMode>
				<RadioGroup id="g">
					<Radio value="a" label="A" slotProps={{ input: { "aria-describedby": "x" } }} className="r" />
				</RadioGroup>
			</StrictMode>,
		)
		expect(screen.getByRole("radiogroup").hasAttribute("aria-labelledby")).toBe(false)
		expect(screen.getByRole("radio").getAttribute("aria-describedby")).toBe("x")
	})
})

describe("FormGroup", () => {
	it("groups checkboxes under a legend with helper text", () => {
		const { container } = render(
			<FormGroup label="Pets" helperText="Choose any" row error>
				<Checkbox label="Cat" />
				<Checkbox label="Dog" />
			</FormGroup>,
		)
		const group = screen.getByRole("group", { name: "Pets" })
		expect(group.tagName).toBe("FIELDSET")
		expect(group.getAttribute("aria-describedby")).toBe(screen.getByText("Choose any").id)
		expect(container.querySelector(".omni-form-group__items")?.hasAttribute("data-row")).toBe(true)
		expect(screen.getAllByRole("checkbox")).toHaveLength(2)
		render(<FormGroup><Checkbox label="Alone" /></FormGroup>)
		expect(container.ownerDocument.querySelectorAll("fieldset").length).toBe(2)
	})
})

describe("server rendering", () => {
	it("renders them to HTML with their checked state", () => {
		const html = renderToString(
			<>
				<Checkbox label="A" defaultChecked />
				<RadioGroup label="G" defaultValue="b">
					<Radio value="a" label="A" />
					<Radio value="b" label="B" />
				</RadioGroup>
			</>,
		)
		expect(html).toContain('type="checkbox"')
		expect(html).toMatch(/<input[^>]*value="b"[^>]*checked=""|<input[^>]*checked=""[^>]*value="b"/)
		expect(html).toContain('role="radiogroup"')
	})
})
