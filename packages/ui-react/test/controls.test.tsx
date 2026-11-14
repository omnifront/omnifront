import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { Button, ButtonGroup, Fab, IconButton, Rating, Select, Slider, TextField, ThemeProvider, ToggleButton, ToggleButtonGroup, createTheme } from "../src"

describe("IconButton and Fab", () => {
	it("an icon button is a round button that needs its aria-label; ripples centred; link, disabled, ref, theme", () => {
		const onClick = vi.fn()
		const ref = { current: null as HTMLButtonElement | HTMLAnchorElement | null }
		const theme = createTheme({ components: { OmniIconButton: { defaultProps: { color: "secondary" } } } })
		const { container } = render(
			<ThemeProvider theme={theme}>
				<IconButton aria-label="Delete" onClick={onClick} ref={ref}><svg /></IconButton>
				<IconButton aria-label="Edit" color="error" size="small" edge="start" disableRipple className="mine"><svg /></IconButton>
				<IconButton aria-label="Off" disabled><svg /></IconButton>
				<IconButton aria-label="Docs" href="/docs"><svg /></IconButton>
			</ThemeProvider>,
		)
		const del = screen.getByRole("button", { name: "Delete" })
		expect(del.className).toBe("omni-icon-button")
		expect(del.dataset).toMatchObject({ color: "secondary", size: "medium" })
		expect(ref.current).toBe(del)
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
		expect(screen.getByRole("button", { name: "Docs" }).tagName).toBe("A")
		expect(container.querySelectorAll(".omni-icon-button").length).toBe(4)
	})

	it("a disabled icon-button link swallows the click", () => {
		const onClick = vi.fn()
		render(<IconButton aria-label="L" href="/x" disabled onClick={onClick}><svg /></IconButton>)
		expect(fireEvent.click(screen.getByRole("button"))).toBe(false)
		expect(onClick).not.toHaveBeenCalled()
	})

	it("a fab is large and primary; extended has text; sizes, colour, link, ref", () => {
		const ref = (n: HTMLButtonElement | HTMLAnchorElement | null): void => void n
		render(
			<>
				<Fab aria-label="Add" ref={ref}><svg /></Fab>
				<Fab variant="extended" size="small" color="secondary">Create</Fab>
				<Fab aria-label="Go" href="/go" disabled><svg /></Fab>
			</>,
		)
		expect(screen.getByRole("button", { name: "Add" }).dataset).toMatchObject({ variant: "circular", color: "primary", size: "large" })
		expect(screen.getByRole("button", { name: "Create" }).dataset).toMatchObject({ variant: "extended", color: "secondary", size: "small" })
		expect(fireEvent.click(screen.getByRole("button", { name: "Go" }))).toBe(false)
		fireEvent.click(screen.getByRole("button", { name: "Add" }))
		const onClick = vi.fn()
		render(<Fab aria-label="Plain" onClick={onClick}><svg /></Fab>)
		fireEvent.click(screen.getByRole("button", { name: "Plain" }))
		expect(onClick).toHaveBeenCalled()
	})
})

describe("ButtonGroup", () => {
	it("hands variant, colour, size and disabled to its Buttons; their own props win; role=group", () => {
		render(
			<ButtonGroup variant="outlined" color="secondary" size="small" aria-label="Actions" className="mine" orientation="vertical" fullWidth>
				<Button>One</Button>
				<Button variant="contained">Two</Button>
			</ButtonGroup>,
		)
		const group = screen.getByRole("group", { name: "Actions" })
		expect(group.className).toBe("omni-button-group mine")
		expect(group.dataset).toMatchObject({ orientation: "vertical", fullWidth: "" })
		expect(screen.getByText("One").dataset).toMatchObject({ variant: "outlined", color: "secondary", size: "small" })
		expect(screen.getByText("Two").dataset["variant"]).toBe("contained")
	})

	it("disabled disables every Button, and a Button outside a group is unchanged", () => {
		render(
			<>
				<ButtonGroup disabled disableElevation><Button>A</Button><Button>B</Button></ButtonGroup>
				<Button>Free</Button>
			</>,
		)
		expect((screen.getByText("A") as HTMLButtonElement).disabled).toBe(true)
		expect(screen.getByText("A").hasAttribute("data-disable-elevation")).toBe(true)
		expect((screen.getByText("Free") as HTMLButtonElement).disabled).toBe(false)
	})
})

describe("ToggleButtonGroup and ToggleButton", () => {
	it("several can be pressed; the group reports (event, list)", () => {
		const onChange = vi.fn()
		render(
			<ToggleButtonGroup aria-label="Format" onChange={(_e, v) => onChange(v)} size="small" color="secondary">
				<ToggleButton value="bold">Bold</ToggleButton>
				<ToggleButton value="italic">Italic</ToggleButton>
				<ToggleButton value="under" disabled>Underline</ToggleButton>
			</ToggleButtonGroup>,
		)
		expect(screen.getByRole("group", { name: "Format" })).toBeTruthy()
		const bold = screen.getByRole("button", { name: "Bold" })
		expect(bold.getAttribute("aria-pressed")).toBe("false")
		fireEvent.click(bold)
		fireEvent.click(screen.getByRole("button", { name: "Italic" }))
		expect(bold.getAttribute("aria-pressed")).toBe("true")
		expect(onChange.mock.calls.map((c) => c[0])).toEqual([["bold"], ["bold", "italic"]])
		expect(bold.dataset).toMatchObject({ color: "secondary", size: "small", selected: "" })
		expect((screen.getByRole("button", { name: "Underline" }) as HTMLButtonElement).disabled).toBe(true)
	})

	it("exclusive: one at a time, a string or null; controlled follows the parent; defaultValue", () => {
		function Controlled() {
			const [v, setV] = useState<string | null>("a")
			return (
				<ToggleButtonGroup exclusive value={v} onChange={(_e, n) => setV(n as string | null)}>
					<ToggleButton value="a">A</ToggleButton>
					<ToggleButton value="b">B</ToggleButton>
				</ToggleButtonGroup>
			)
		}
		render(<Controlled />)
		expect(screen.getByText("A").getAttribute("aria-pressed")).toBe("true")
		fireEvent.click(screen.getByText("B"))
		expect([screen.getByText("A").getAttribute("aria-pressed"), screen.getByText("B").getAttribute("aria-pressed")]).toEqual(["false", "true"])
		fireEvent.click(screen.getByText("B")) // unpress: null
		expect(screen.getByText("B").getAttribute("aria-pressed")).toBe("false")
		const onChange = vi.fn()
		render(
			<ToggleButtonGroup defaultValue={["x"]} onChange={(_e, v) => onChange(v)} orientation="vertical" disabled={false} fullWidth>
				<ToggleButton value="x">X</ToggleButton>
			</ToggleButtonGroup>,
		)
		expect(screen.getByText("X").getAttribute("aria-pressed")).toBe("true")
		expect(screen.getByText("X").closest("div")?.dataset).toMatchObject({ orientation: "vertical", fullWidth: "" })
		render(<ToggleButtonGroup exclusive defaultValue="y" disabled><ToggleButton value="y">Y</ToggleButton></ToggleButtonGroup>)
		expect(screen.getByText("Y").getAttribute("aria-pressed")).toBe("true")
		expect((screen.getByText("Y") as HTMLButtonElement).disabled).toBe(true)
	})

	it("a ToggleButton outside a group is a plain pressed/unpressed button", () => {
		const onChange = vi.fn()
		const onClick = vi.fn()
		render(<ToggleButton value="solo" selected onChange={(_e, v) => onChange(v)} onClick={onClick} color="success" size="large" className="mine">Solo</ToggleButton>)
		const solo = screen.getByRole("button", { name: "Solo" })
		expect(solo.getAttribute("aria-pressed")).toBe("true")
		expect(solo.dataset).toMatchObject({ color: "success", size: "large" })
		fireEvent.click(solo)
		expect(onChange).toHaveBeenCalledWith("solo")
		expect(onClick).toHaveBeenCalled()
	})
})

describe("Slider", () => {
	const range = (): HTMLInputElement => screen.getByRole("slider") as HTMLInputElement

	it("is a native range input with min, max, step and a name from aria-label", () => {
		render(<Slider aria-label="Volume" defaultValue={30} min={10} max={50} step={5} name="vol" />)
		expect([range().type, range().min, range().max, range().step, range().value, range().name]).toEqual(["range", "10", "50", "5", "30", "vol"])
		expect(screen.getByRole("slider", { name: "Volume" })).toBeTruthy()
	})

	it("uncontrolled keeps the value and reports (event, value); steps and clamping apply", () => {
		const onChange = vi.fn()
		const { container } = render(<Slider aria-label="v" onChange={onChange} step={10} />)
		fireEvent.input(range(), { target: { value: "47" } })
		expect(onChange).toHaveBeenLastCalledWith(expect.anything(), 50)
		expect(range().value).toBe("50")
		expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--omni-slider-percent")).toBe("50")
	})

	it("controlled: follows the parent", () => {
		function Controlled() {
			const [v, setV] = useState(20)
			return (
				<>
					<Slider aria-label="c" value={v} onChange={(_e, n) => setV(n)} />
					<button onClick={() => setV(80)}>jump</button>
				</>
			)
		}
		render(<Controlled />)
		fireEvent.input(range(), { target: { value: "40" } })
		expect(range().value).toBe("40")
		fireEvent.click(screen.getByText("jump"))
		expect(range().value).toBe("80")
	})

	it("value label, marks with labels, aria-valuetext, size, colour, disabled, class, ref", () => {
		const ref = { current: null as HTMLSpanElement | null }
		const { container } = render(
			<Slider aria-labelledby="lbl" defaultValue={2} min={0} max={4} valueLabelDisplay="on" valueLabelFormat={(v) => `${v}°`} getAriaValueText={(v) => `${v} degrees`} marks={[{ value: 0, label: "Cold" }, { value: 4, label: "Hot" }, { value: 2 }]} size="small" color="secondary" disabled className="mine" ref={ref} />,
		)
		const root = container.firstElementChild as HTMLElement
		expect(root.className).toBe("omni-slider mine")
		expect(root.dataset).toMatchObject({ size: "small", color: "secondary", label: "on", disabled: "", marksLabels: "" })
		expect(root.querySelector(".omni-slider__label")?.textContent).toBe("2°")
		expect(range().getAttribute("aria-valuetext")).toBe("2 degrees")
		expect(range().getAttribute("aria-labelledby")).toBe("lbl")
		expect(range().disabled).toBe(true)
		expect(Array.from(root.querySelectorAll(".omni-slider__mark-label")).map((n) => n.textContent)).toEqual(["Cold", "Hot"])
		expect(root.querySelectorAll(".omni-slider__mark").length).toBe(3)
		expect(ref.current).toBe(root)
	})

	it("marks=true puts a mark on every step; no label unless asked; a plain value label", () => {
		const { container } = render(<Slider aria-label="m" min={0} max={10} step={5} marks valueLabelDisplay="auto" defaultValue={5} />)
		expect(container.querySelectorAll(".omni-slider__mark").length).toBe(3)
		expect(container.querySelector(".omni-slider__label")?.textContent).toBe("5")
		const none = render(<Slider aria-label="n" />)
		expect(none.container.querySelector(".omni-slider__label")).toBeNull()
		expect(none.container.querySelector(".omni-slider__marks")).toBeNull()
	})
})

describe("Rating", () => {
	const radios = (): HTMLInputElement[] => screen.getAllByRole("radio") as HTMLInputElement[]

	it("is a radiogroup of native radios: a hidden 'no rating' one and one per star", () => {
		render(<Rating aria-label="Rating" name="stars" defaultValue={3} />)
		expect(screen.getByRole("radiogroup", { name: "Rating" })).toBeTruthy()
		expect(radios().map((r) => r.value)).toEqual(["0", "1", "2", "3", "4", "5"])
		expect(radios().find((r) => r.checked)?.value).toBe("3")
		expect(new Set(radios().map((r) => r.name))).toEqual(new Set(["stars"]))
		expect(radios()[3]?.getAttribute("aria-label")).toBe("3 out of 5")
	})

	it("choosing rates, choosing the same value clears, and the stars fill", () => {
		const onChange = vi.fn()
		const { container } = render(<Rating aria-label="r" onChange={onChange} />)
		fireEvent.click(radios()[4] as HTMLElement)
		expect(onChange).toHaveBeenLastCalledWith(expect.anything(), 4)
		expect(Array.from(container.querySelectorAll(".omni-rating__star")).map((s) => (s as HTMLElement).dataset["fill"])).toEqual(["100", "100", "100", "100", "0"])
		fireEvent.click(radios()[4] as HTMLElement)
		expect(onChange).toHaveBeenLastCalledWith(expect.anything(), 0)
		expect(radios().find((r) => r.checked)?.value).toBe("0")
		fireEvent.click(radios()[2] as HTMLElement)
		fireEvent.click(radios()[0] as HTMLElement) // the hidden "no rating" radio
		expect(radios().find((r) => r.checked)?.value).toBe("0")
	})

	it("hovering previews the value and reports it; leaving restores it", () => {
		const onChangeActive = vi.fn()
		const { container } = render(<Rating aria-label="r" defaultValue={1} onChangeActive={onChangeActive} />)
		fireEvent.pointerEnter(radios()[4] as HTMLElement)
		expect(onChangeActive).toHaveBeenCalledWith(4)
		expect((container.querySelectorAll(".omni-rating__star")[3] as HTMLElement).dataset["fill"]).toBe("100")
		fireEvent.pointerLeave(radios()[4] as HTMLElement)
		expect(onChangeActive).toHaveBeenLastCalledWith(undefined)
		expect((container.querySelectorAll(".omni-rating__star")[3] as HTMLElement).dataset["fill"]).toBe("0")
	})

	it("half precision gives two radios per star and half-filled stars; max and size", () => {
		const { container } = render(<Rating aria-label="r" precision={0.5} max={3} defaultValue={2.5} size="large" color="primary" />)
		expect(radios().map((r) => r.value)).toEqual(["0", "0.5", "1", "1.5", "2", "2.5", "3"])
		expect(Array.from(container.querySelectorAll(".omni-rating__star")).map((s) => (s as HTMLElement).dataset["fill"])).toEqual(["100", "100", "50"])
		expect((container.firstElementChild as HTMLElement).dataset).toMatchObject({ size: "large", color: "primary" })
	})

	it("controlled follows the parent; disabled cannot be changed", () => {
		function Controlled() {
			const [v, setV] = useState(2)
			return (
				<>
					<Rating aria-label="c" value={v} onChange={(_e, n) => setV(n)} />
					<button onClick={() => setV(5)}>five</button>
				</>
			)
		}
		render(<Controlled />)
		fireEvent.click(screen.getByText("five"))
		expect(radios().find((r) => r.checked)?.value).toBe("5")
		const { container } = render(<Rating aria-label="d" disabled defaultValue={1} />)
		expect(container.querySelector(".omni-rating")?.hasAttribute("data-disabled")).toBe(true)
		expect(Array.from(container.querySelectorAll("input")).every((i) => i.disabled)).toBe(true)
	})

	it("read-only is an image with a text alternative and no inputs", () => {
		const { container } = render(<Rating readOnly defaultValue={3.5} precision={0.5} />)
		const image = screen.getByRole("img", { name: "3.5 out of 5" })
		expect(image.hasAttribute("data-readonly")).toBe(true)
		expect(container.querySelectorAll("input").length).toBe(0)
		expect(Array.from(container.querySelectorAll(".omni-rating__star")).map((s) => (s as HTMLElement).dataset["fill"])).toEqual(["100", "100", "100", "50", "0"])
	})

	it("renders on the server", () => {
		const html = renderToString(<Rating aria-label="r" defaultValue={2} />)
		expect(html).toContain('role="radiogroup"')
		expect(html).toContain('data-fill="100"')
	})
})

describe("TextField autosize", () => {
	it("a multiline field with minRows or maxRows is sized from its text, and follows value changes", async () => {
		const original = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "scrollHeight")
		Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", { configurable: true, get: () => 100 })
		try {
			function Field() {
				const [v, setV] = useState("a")
				return (
					<>
						<TextField label="Bio" multiline minRows={2} maxRows={3} value={v} onChange={(e) => setV(e.target.value)} />
						<button onClick={() => setV("changed")}>set</button>
					</>
				)
			}
			render(<Field />)
			const area = screen.getByLabelText("Bio") as HTMLTextAreaElement
			expect(area.getAttribute("rows")).toBe("2")
			await waitFor(() => expect(area.style.height).not.toBe(""))
			const first = area.style.height
			fireEvent.input(area, { target: { value: "more text" } })
			fireEvent.click(screen.getByText("set"))
			await waitFor(() => expect(area.value).toBe("changed"))
			expect(area.style.height).toBe(first)
		} finally {
			if (original) Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", original)
			else delete (HTMLTextAreaElement.prototype as unknown as Record<string, unknown>)["scrollHeight"]
		}
	})

	it("without minRows and maxRows the textarea keeps rows and is not touched", () => {
		render(<TextField label="Plain" multiline rows={4} />)
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
		render(<Select label="Fruit" multiple options={options} onChange={onChange} name="fruit" />)
		const combobox = screen.getByRole("combobox")
		fireEvent.click(combobox)
		const list = await screen.findByRole("listbox")
		expect(list.getAttribute("aria-multiselectable")).toBe("true")
		fireEvent.click(screen.getByRole("option", { name: "Cherry" }))
		fireEvent.click(screen.getByRole("option", { name: "Apple" }))
		expect(onChange.mock.calls.map((c) => c[1])).toEqual([["c"], ["c", "a"]])
		expect(combobox.textContent).toBe("Apple, Cherry")
		expect(screen.getByRole("listbox")).toBeTruthy() // still open
		expect(screen.getByRole("option", { name: "Apple" }).getAttribute("aria-selected")).toBe("true")
		fireEvent.click(screen.getByRole("option", { name: "Cherry" }))
		expect(combobox.textContent).toBe("Apple")
		const hidden = Array.from(document.querySelectorAll('input[type="hidden"]')) as HTMLInputElement[]
		expect(hidden.map((h) => [h.name, h.value])).toEqual([["fruit", "a"]])
		fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" })
		await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
	})

	it("controlled and default values", () => {
		function Controlled() {
			const [v, setV] = useState<string[]>(["d"])
			return (
				<>
					<Select label="F" multiple options={options} value={v} onChange={(_e, n) => setV(n)} />
					<button onClick={() => setV(["a", "c"])}>set</button>
				</>
			)
		}
		render(<Controlled />)
		expect(screen.getByRole("combobox").textContent).toBe("Date")
		fireEvent.click(screen.getByText("set"))
		expect(screen.getByRole("combobox").textContent).toBe("Apple, Cherry")
		render(<Select label="D" multiple options={options} defaultValue={["c", "d"]} />)
		expect(screen.getAllByRole("combobox")[1]?.textContent).toBe("Cherry, Date")
		const single = render(<Select label="S" options={options} defaultValue="" name="s" />)
		expect(single.container.querySelector('input[type="hidden"]')).not.toBeNull()
	})
})
