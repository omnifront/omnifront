import { fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { Switch, ThemeProvider, createTheme } from "../src"

const sw = (name?: string): HTMLInputElement => screen.getByRole("switch", name ? { name } : {}) as HTMLInputElement

describe("Switch", () => {
	it("is a native checkbox with role=switch, named by its label, in a clickable label", () => {
		render(<Switch label="Wi-Fi" />)
		const input = sw("Wi-Fi")
		expect([input.type, input.checked]).toEqual(["checkbox", false])
		expect(input.closest("label")?.className).toBe("omni-switch")
		fireEvent.click(screen.getByText("Wi-Fi"))
		expect(input.checked).toBe(true)
	})

	it("uncontrolled reports (event, checked); defaultChecked; controlled follows the parent", () => {
		const onChange = vi.fn()
		render(<Switch label="A" onChange={onChange} />)
		fireEvent.click(sw())
		expect(onChange).toHaveBeenLastCalledWith(expect.anything(), true)
		render(<Switch label="B" defaultChecked />)
		expect(sw("B").checked).toBe(true)
		function Controlled() {
			const [on, setOn] = useState(false)
			return (
				<>
					<Switch label="C" checked={on} onChange={(_e, c) => setOn(c)} />
					<button onClick={() => setOn(true)}>force</button>
				</>
			)
		}
		render(<Controlled />)
		fireEvent.click(sw("C"))
		expect(sw("C").checked).toBe(true)
		render(<Switch label="Stuck" checked={false} onChange={() => {}} />)
		fireEvent.click(sw("Stuck"))
		expect(sw("Stuck").checked).toBe(false)
	})

	it("disabled, required, error, name, value; size, colour, placement, aria-label, class, ref, theme defaults", () => {
		const ref = { current: null as HTMLLabelElement | null }
		const theme = createTheme({ components: { OmniSwitch: { defaultProps: { color: "secondary" } } } })
		const { container } = render(
			<ThemeProvider theme={theme}>
				<Switch label="X" disabled required error name="n" value="v" />
				<Switch size="small" labelPlacement="start" slotProps={{ input: { "aria-label": "Hidden" } }} className="mine" ref={ref} />
			</ThemeProvider>,
		)
		const x = sw("X")
		expect([x.disabled, x.required, x.name, x.value]).toEqual([true, true, "n", "v"])
		expect(x.getAttribute("aria-invalid")).toBe("true")
		const [first, second] = Array.from(container.querySelectorAll("label")) as unknown as [HTMLElement, HTMLElement]
		expect(first.dataset).toMatchObject({ disabled: "", error: "", color: "secondary" })
		expect(second.dataset).toMatchObject({ size: "small", labelPlacement: "start" })
		expect(second.className).toBe("omni-switch mine")
		expect(second.querySelector(".omni-switch__label")).toBeNull()
		expect(ref.current).toBe(second)
		expect(sw("Hidden")).toBeTruthy()
	})

	it("renders on the server with its state", () => {
		const html = renderToString(<Switch label="S" defaultChecked />)
		expect(html).toContain('role="switch"')
		expect(html).toMatch(/checked/)
	})
})
