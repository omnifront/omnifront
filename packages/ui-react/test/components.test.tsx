import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { StrictMode, useState } from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Menu,
	MenuDivider,
	MenuItem,
	Tab,
	TabContext,
	TabList,
	TabPanel,
	TextField,
	ThemeProvider,
	createTheme,
} from "../src"

const key = (el: Element, k: string, init: KeyboardEventInit = {}): void => void fireEvent.keyDown(el, { key: k, ...init })

describe("Button", () => {
	it("is a real button with Material defaults", () => {
		render(<Button>Save</Button>)
		const button = screen.getByRole("button", { name: "Save" })
		expect(button.tagName).toBe("BUTTON")
		expect(button).toHaveProperty("type", "button")
		expect(button.className).toBe("omni-button")
		expect(button.dataset).toMatchObject({ variant: "text", color: "primary", size: "medium" })
	})

	it("passes variant, colour, size and flags through as data attributes", () => {
		render(
			<Button variant="contained" color="error" size="large" fullWidth disableElevation className="mine" type="submit">
				Go
			</Button>,
		)
		const button = screen.getByRole("button")
		expect(button.className).toBe("omni-button mine")
		expect(button.dataset).toMatchObject({ variant: "contained", color: "error", size: "large", fullWidth: "", disableElevation: "" })
		expect(button).toHaveProperty("type", "submit")
	})

	it("calls onClick; a disabled button does not", () => {
		const onClick = vi.fn()
		const { rerender } = render(<Button onClick={onClick}>x</Button>)
		fireEvent.click(screen.getByRole("button"))
		expect(onClick).toHaveBeenCalledTimes(1)
		rerender(<Button onClick={onClick} disabled>x</Button>)
		expect(screen.getByRole("button")).toHaveProperty("disabled", true)
		fireEvent.click(screen.getByRole("button"))
		expect(onClick).toHaveBeenCalledTimes(1)
	})

	it("loading blocks clicks but keeps the button focusable", () => {
		const onClick = vi.fn()
		render(<Button loading onClick={onClick}>Pay</Button>)
		const button = screen.getByRole("button")
		expect(button.getAttribute("aria-disabled")).toBe("true")
		expect(button.hasAttribute("data-loading")).toBe(true)
		expect(button).toHaveProperty("disabled", false)
		fireEvent.click(button)
		expect(onClick).not.toHaveBeenCalled()
	})

	it("with href it is a link that still looks like a button", () => {
		const onClick = vi.fn()
		const { rerender } = render(<Button href="/docs" onClick={onClick}>Docs</Button>)
		const link = screen.getByRole("button", { name: "Docs" })
		expect(link.tagName).toBe("A")
		expect(link.getAttribute("href")).toBe("/docs")
		fireEvent.click(link)
		expect(onClick).toHaveBeenCalledTimes(1)
		rerender(<Button href="/docs" onClick={onClick} disabled>Docs</Button>)
		expect(screen.getByRole("button").getAttribute("aria-disabled")).toBe("true")
		expect(screen.getByRole("button").getAttribute("tabindex")).toBe("-1")
		expect(fireEvent.click(screen.getByRole("button"))).toBe(false) // default prevented: no navigation
		expect(onClick).toHaveBeenCalledTimes(1)
	})

	it("renders start and end icons and forwards the ref", () => {
		let node: HTMLButtonElement | HTMLAnchorElement | null = null
		render(
			<Button ref={(n) => { node = n }} startIcon={<i data-testid="s" />} endIcon={<i data-testid="e" />}>
				Next
			</Button>,
		)
		expect(screen.getByTestId("s").parentElement?.className).toBe("omni-button__start")
		expect(screen.getByTestId("e").parentElement?.className).toBe("omni-button__end")
		expect(node).toBe(screen.getByRole("button"))
		const object = { current: null as HTMLButtonElement | HTMLAnchorElement | null }
		render(<Button ref={object}>y</Button>)
		expect(object.current?.tagName).toBe("BUTTON")
	})

	it("ripples on press, unless turned off", () => {
		const { unmount } = render(<Button>Press</Button>)
		const button = screen.getByRole("button")
		fireEvent.pointerDown(button, { button: 0, clientX: 5, clientY: 5 })
		expect(button.querySelector(".omni-ripple")).not.toBeNull()
		unmount()
		render(<Button disableRipple>Press</Button>)
		fireEvent.pointerDown(screen.getByRole("button"), { button: 0, clientX: 5, clientY: 5 })
		expect(screen.getByRole("button").querySelector(".omni-ripple")).toBeNull()
	})

	it("takes defaults from the theme, and explicit props win", () => {
		const theme = createTheme({ components: { OmniButton: { defaultProps: { variant: "contained", size: "small" } } } })
		render(
			<ThemeProvider theme={theme}>
				<Button>a</Button>
				<Button size="large">b</Button>
			</ThemeProvider>,
		)
		const [a, b] = screen.getAllByRole("button")
		expect(a?.dataset).toMatchObject({ variant: "contained", size: "small" })
		expect(b?.dataset).toMatchObject({ variant: "contained", size: "large" })
	})
})

describe("ThemeProvider", () => {
	it("scopes the theme's CSS variables to a wrapper and sets the colour scheme", () => {
		const theme = createTheme({ palette: { primary: { main: "#ff5722" } } })
		const { container } = render(
			<ThemeProvider theme={theme} colorScheme="dark">
				<span>in</span>
			</ThemeProvider>,
		)
		const wrapper = container.querySelector("[data-omni-theme]") as HTMLElement
		expect(wrapper.getAttribute("data-omni-color-scheme")).toBe("dark")
		expect(wrapper.style.display).toBe("contents")
		const css = container.querySelector("style")?.textContent ?? ""
		expect(css).toContain(`[data-omni-theme="${wrapper.getAttribute("data-omni-theme")}"]`)
		expect(css).toContain("--omni-palette-primary-main:#ff5722")
	})

	it("defaults to following the system, and nested providers inherit the outer scheme", () => {
		const { container } = render(
			<ThemeProvider theme={createTheme()}>
				<ThemeProvider theme={createTheme()} colorScheme="light">
					<ThemeProvider theme={createTheme()}>x</ThemeProvider>
				</ThemeProvider>
			</ThemeProvider>,
		)
		const schemes = Array.from(container.querySelectorAll("[data-omni-theme]")).map((e) => e.getAttribute("data-omni-color-scheme"))
		expect(schemes).toEqual(["system", "light", "light"])
	})
})

describe("TextField", () => {
	it("connects the label, the input and the helper text", () => {
		render(<TextField label="Email" helperText="We never share it" id="email" />)
		const input = screen.getByLabelText("Email")
		expect(input.id).toBe("email")
		expect(input.getAttribute("aria-describedby")).toBe("email-helper")
		expect(screen.getByText("We never share it").id).toBe("email-helper")
	})

	it("generates an id when none is given", () => {
		render(<TextField label="Name" />)
		expect(screen.getByLabelText("Name").id).not.toBe("")
	})

	it("floats the label on focus and when it has a value", () => {
		const { container } = render(<TextField label="Name" />)
		const root = container.firstElementChild as HTMLElement
		const input = screen.getByLabelText("Name")
		expect(root.hasAttribute("data-shrink")).toBe(false)
		fireEvent.focus(input)
		expect(root.hasAttribute("data-focused")).toBe(true)
		expect(root.hasAttribute("data-shrink")).toBe(true)
		fireEvent.blur(input)
		expect(root.hasAttribute("data-shrink")).toBe(false)
		fireEvent.input(input, { target: { value: "Ada" } })
		expect(root.hasAttribute("data-filled")).toBe(true)
		expect(root.hasAttribute("data-shrink")).toBe(true)
		fireEvent.input(input, { target: { value: "" } })
		expect(root.hasAttribute("data-filled")).toBe(false)
	})

	it("an input that starts with a defaultValue has its label floated from the start", () => {
		const { container } = render(<TextField label="City" defaultValue="Oslo" />)
		expect((container.firstElementChild as HTMLElement).hasAttribute("data-shrink")).toBe(true)
	})

	it("controlled: shows the value, reports changes, follows the parent", () => {
		function Controlled({ onChange }: { onChange: (v: string) => void }) {
			const [value, setValue] = useState("")
			return <TextField label="Q" value={value} onChange={(e) => { setValue(e.target.value); onChange(e.target.value) }} />
		}
		const onChange = vi.fn()
		const { container } = render(<Controlled onChange={onChange} />)
		const input = screen.getByLabelText("Q") as HTMLInputElement
		fireEvent.input(input, { target: { value: "hi" } })
		expect(onChange).toHaveBeenCalledWith("hi")
		expect(input.value).toBe("hi")
		expect((container.firstElementChild as HTMLElement).hasAttribute("data-filled")).toBe(true)
	})

	it("shows the error state", () => {
		const { container } = render(<TextField label="Age" error helperText="Must be a number" />)
		expect(screen.getByLabelText("Age").getAttribute("aria-invalid")).toBe("true")
		expect((container.firstElementChild as HTMLElement).hasAttribute("data-error")).toBe(true)
		expect(screen.getByText("Must be a number").hasAttribute("data-error")).toBe(true)
	})

	it("required adds an asterisk (hidden from screen readers) and the required attribute", () => {
		render(<TextField label="Name" required />)
		expect(screen.getByLabelText(/Name/)).toHaveProperty("required", true)
		expect(document.querySelector(".omni-text-field__required")?.getAttribute("aria-hidden")).toBe("true")
	})

	it("disabled and read-only inputs", () => {
		render(<><TextField label="A" disabled /><TextField label="B" readOnly /></>)
		expect(screen.getByLabelText("A")).toHaveProperty("disabled", true)
		expect(screen.getByLabelText("B")).toHaveProperty("readOnly", true)
	})

	it("multiline renders a textarea; variant, size, colour and fullWidth become data attributes", () => {
		const { container } = render(<TextField label="Bio" multiline rows={3} variant="filled" size="small" color="secondary" fullWidth />)
		const area = screen.getByLabelText("Bio")
		expect(area.tagName).toBe("TEXTAREA")
		expect(area.getAttribute("rows")).toBe("3")
		expect((container.firstElementChild as HTMLElement).dataset).toMatchObject({ variant: "filled", size: "small", color: "secondary", fullWidth: "" })
	})

	it("adornments, a field with no label, inner input props and the input ref", () => {
		const inputRef = { current: null as HTMLInputElement | HTMLTextAreaElement | null }
		const { container } = render(
			<TextField placeholder="Search" startAdornment={<b data-testid="s">$</b>} endAdornment={<b data-testid="e">kg</b>} slotProps={{ input: { maxLength: 5 } }} inputRef={inputRef} />,
		)
		expect(screen.getByTestId("s").parentElement?.getAttribute("data-position")).toBe("start")
		expect(screen.getByTestId("e").parentElement?.getAttribute("data-position")).toBe("end")
		const input = screen.getByPlaceholderText("Search")
		expect(input.getAttribute("maxlength")).toBe("5")
		expect(inputRef.current).toBe(input)
		expect(container.querySelector("label")).toBeNull()
		expect((container.firstElementChild as HTMLElement).hasAttribute("data-has-label")).toBe(false)
		expect((container.firstElementChild as HTMLElement).hasAttribute("data-shrink")).toBe(true) // start adornment keeps the label floated
	})

	it("clicking the box focuses the input; callbacks for focus and blur still run", () => {
		const onFocus = vi.fn()
		const onBlur = vi.fn()
		const { container } = render(<TextField label="X" onFocus={onFocus} onBlur={onBlur} />)
		fireEvent.click(container.querySelector(".omni-text-field__control") as Element)
		expect(document.activeElement).toBe(screen.getByLabelText("X"))
		fireEvent.focus(screen.getByLabelText("X"))
		fireEvent.blur(screen.getByLabelText("X"))
		expect(onFocus).toHaveBeenCalled()
		expect(onBlur).toHaveBeenCalled()
	})
})

function DialogDemo({ onClose = () => {} }: { onClose?: (e: Event | undefined, reason: string) => void }) {
	const [open, setOpen] = useState(false)
	return (
		<>
			<button onClick={() => setOpen(true)}>Open</button>
			<Dialog open={open} onClose={(e, reason) => { onClose(e, reason); setOpen(false) }}>
				<DialogTitle>Delete project?</DialogTitle>
				<DialogContent>
					<DialogContentText>This cannot be undone.</DialogContentText>
				</DialogContent>
				<DialogActions>
					<button>Cancel</button>
					<button>Delete</button>
				</DialogActions>
			</Dialog>
		</>
	)
}

describe("Dialog", () => {
	it("renders nothing while closed and a labelled modal dialog when open", () => {
		render(<DialogDemo />)
		expect(screen.queryByRole("dialog")).toBeNull()
		fireEvent.click(screen.getByText("Open"))
		const dialog = screen.getByRole("dialog", { name: "Delete project?" })
		expect(dialog.getAttribute("aria-modal")).toBe("true")
		expect(dialog.getAttribute("aria-describedby")).toBe(screen.getByText("This cannot be undone.").id)
		expect(dialog.closest("[data-omni-portal]")?.parentElement).toBe(document.body)
	})

	it("moves focus into the dialog, locks scroll, hides the page, and undoes it all on close", async () => {
		render(<DialogDemo />)
		const opener = screen.getByText("Open")
		opener.focus()
		fireEvent.click(opener)
		await waitFor(() => expect(document.activeElement).toBe(screen.getByText("Cancel")))
		expect(document.body.style.overflow).toBe("hidden")
		expect(opener.closest("div[aria-hidden]")?.getAttribute("aria-hidden") ?? opener.parentElement?.getAttribute("aria-hidden")).toBe("true")
		key(screen.getByRole("dialog").parentElement as Element, "Escape")
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
		expect(document.body.style.overflow).toBe("")
		expect(document.activeElement).toBe(opener)
	})

	it("Escape and a backdrop click ask to close with the reason", async () => {
		const onClose = vi.fn()
		render(<DialogDemo onClose={onClose} />)
		fireEvent.click(screen.getByText("Open"))
		const container = screen.getByRole("dialog").parentElement as Element
		fireEvent.click(screen.getByRole("dialog")) // inside the paper: not a backdrop click
		expect(onClose).not.toHaveBeenCalled()
		fireEvent.click(container)
		expect(onClose).toHaveBeenCalledWith(expect.anything(), "backdropClick")
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
		fireEvent.click(screen.getByText("Open"))
		key(screen.getByRole("dialog").parentElement as Element, "Escape")
		expect(onClose).toHaveBeenLastCalledWith(expect.anything(), "escapeKeyDown")
	})

	it("stays in the page for the exit animation, then leaves", async () => {
		const { rerender } = render(<Dialog open>text</Dialog>)
		expect(screen.getByRole("dialog")).toBeTruthy()
		rerender(<Dialog open={false}>text</Dialog>)
		expect(screen.getByRole("dialog").parentElement?.parentElement?.getAttribute("data-state")).toBe("closed")
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 1000 })
	})

	it("size options, no backdrop, a label and alertdialog", () => {
		render(<Dialog open maxWidth="lg" fullWidth fullScreen hideBackdrop role="alertdialog" aria-label="Confirm" className="mine">x</Dialog>)
		const dialog = screen.getByRole("alertdialog", { name: "Confirm" })
		const root = dialog.closest(".omni-dialog") as HTMLElement
		expect(root.className).toBe("omni-dialog mine")
		expect(root.dataset).toMatchObject({ maxWidth: "lg", fullWidth: "", fullScreen: "" })
		expect(root.querySelector(".omni-dialog__backdrop")).toBeNull()
	})

	it("disableEscapeKeyDown ignores Escape", () => {
		const onClose = vi.fn()
		render(<Dialog open onClose={onClose} disableEscapeKeyDown>x</Dialog>)
		key(screen.getByRole("dialog").parentElement as Element, "Escape")
		expect(onClose).not.toHaveBeenCalled()
	})

	it("slotProps reach the inner elements", () => {
		render(<Dialog open slotProps={{ paper: { id: "paper", className: "extra" }, backdrop: { "data-x": "1" } as never }}>x</Dialog>)
		const paper = document.getElementById("paper") as HTMLElement
		expect(paper.className).toBe("omni-dialog__paper extra")
		expect(document.querySelector(".omni-dialog__backdrop")?.getAttribute("data-x")).toBe("1")
	})

	it("works in StrictMode", () => {
		render(<StrictMode><DialogDemo /></StrictMode>)
		fireEvent.click(screen.getByText("Open"))
		expect(screen.getByRole("dialog")).toBeTruthy()
	})
})

function MenuDemo({ onPick = () => {}, onClose = () => {} }: { onPick?: (n: string) => void; onClose?: (r: string) => void }) {
	const [anchor, setAnchor] = useState<HTMLElement | null>(null)
	return (
		<>
			<button id="menu-button" onClick={(e) => setAnchor(e.currentTarget)}>Menu</button>
			<Menu anchorEl={anchor} open={anchor !== null} onClose={(_e, reason) => { onClose(reason); setAnchor(null) }}>
				<MenuItem onClick={() => onPick("profile")}>Profile</MenuItem>
				<MenuItem disabled onClick={() => onPick("billing")}>Billing</MenuItem>
				<MenuDivider />
				<MenuItem onClick={() => onPick("logout")} selected dense>Logout</MenuItem>
			</Menu>
		</>
	)
}

describe("Menu", () => {
	it("opens a labelled menu of items under the anchor and focuses the first item", async () => {
		render(<MenuDemo />)
		fireEvent.click(screen.getByText("Menu"))
		const menu = screen.getByRole("menu", { name: "Menu" })
		expect(menu.getAttribute("aria-labelledby")).toBe("menu-button")
		expect(screen.getAllByRole("menuitem")).toHaveLength(3)
		expect(screen.getByRole("separator")).toBeTruthy()
		await waitFor(() => expect(document.activeElement).toBe(screen.getByText("Profile")))
		await waitFor(() => expect(menu.style.position).toBe("fixed"))
	})

	it("arrow keys move focus past disabled items; Enter chooses and closes", async () => {
		const onPick = vi.fn()
		const onClose = vi.fn()
		render(<MenuDemo onPick={onPick} onClose={onClose} />)
		fireEvent.click(screen.getByText("Menu"))
		await waitFor(() => expect(document.activeElement).toBe(screen.getByText("Profile")))
		key(document.activeElement as Element, "ArrowDown")
		expect(document.activeElement).toBe(screen.getByText("Logout"))
		key(document.activeElement as Element, "Enter")
		expect(onPick).toHaveBeenCalledWith("logout")
		expect(onClose).toHaveBeenCalledWith("select")
		await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
		expect(document.activeElement).toBe(screen.getByText("Menu"))
	})

	it("clicking an item chooses it; a disabled item does nothing", () => {
		const onPick = vi.fn()
		render(<MenuDemo onPick={onPick} />)
		fireEvent.click(screen.getByText("Menu"))
		fireEvent.click(screen.getByText("Billing"))
		expect(onPick).not.toHaveBeenCalled()
		expect(screen.getByText("Billing").getAttribute("aria-disabled")).toBe("true")
		fireEvent.click(screen.getByText("Profile"))
		expect(onPick).toHaveBeenCalledWith("profile")
	})

	it("Escape, Tab and a click outside close it", async () => {
		const onClose = vi.fn()
		render(<MenuDemo onClose={onClose} />)
		for (const [act, reason] of [
			[() => key(screen.getByRole("menu"), "Escape"), "escapeKeyDown"],
			[() => key(screen.getByRole("menu"), "Tab"), "tab"],
			[() => fireEvent.pointerDown(document.body), "outsidePress"],
		] as const) {
			fireEvent.click(screen.getByText("Menu"))
			await waitFor(() => expect(screen.getByRole("menu")).toBeTruthy())
			act()
			expect(onClose).toHaveBeenLastCalledWith(reason)
			await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
		}
	})

	it("item flags: selected and dense", () => {
		render(<MenuDemo />)
		fireEvent.click(screen.getByText("Menu"))
		expect(screen.getByText("Logout").dataset).toMatchObject({ selected: "", dense: "" })
	})

	it("a label replaces labelling by the anchor; MenuItem outside a Menu is plain", () => {
		render(<Menu anchorEl={document.body} open aria-label="Actions" placement="top-end"><MenuItem>One</MenuItem></Menu>)
		expect(screen.getByRole("menu", { name: "Actions" }).hasAttribute("aria-labelledby")).toBe(false)
		render(<ul><MenuItem>Loose</MenuItem></ul>)
		expect(screen.getByText("Loose").getAttribute("role")).toBeNull()
	})
})

function TabsDemo({ onChange = () => {}, ...rest }: { onChange?: (v: string) => void; selectionFollowsFocus?: boolean; keepMounted?: boolean }) {
	const [value, setValue] = useState("one")
	return (
		<TabContext value={value} onChange={(_e, v) => { onChange(v); setValue(v) }} selectionFollowsFocus={rest.selectionFollowsFocus}>
			<TabList aria-label="Sections" color="secondary" variant="fullWidth" centered>
				<Tab value="one" label="One" />
				<Tab value="two" label="Two" disabled />
				<Tab value="three" label="Three" />
			</TabList>
			<TabPanel value="one">First panel</TabPanel>
			<TabPanel value="two">Second panel</TabPanel>
			<TabPanel value="three" keepMounted={rest.keepMounted}>Third panel</TabPanel>
		</TabContext>
	)
}

describe("Tabs", () => {
	it("renders an accessible tab list with the selected panel visible", () => {
		render(<TabsDemo />)
		const list = screen.getByRole("tablist", { name: "Sections" })
		expect(list.getAttribute("aria-orientation")).toBe("horizontal")
		const [one, two, three] = screen.getAllByRole("tab")
		expect(one?.getAttribute("aria-selected")).toBe("true")
		expect(three?.getAttribute("aria-selected")).toBe("false")
		expect(two?.getAttribute("aria-disabled")).toBe("true")
		expect(one?.getAttribute("tabindex")).toBe("0")
		expect(three?.getAttribute("tabindex")).toBe("-1")
		const panel = screen.getByRole("tabpanel")
		expect(panel.id).toBe(one?.getAttribute("aria-controls"))
		expect(panel.getAttribute("aria-labelledby")).toBe(one?.id)
		expect(screen.getByText("First panel")).toBeTruthy()
		expect(screen.queryByText("Third panel")).toBeNull()
	})

	it("selects on click, shows that panel, and tells the listener", () => {
		const onChange = vi.fn()
		render(<TabsDemo onChange={onChange} />)
		fireEvent.click(screen.getByRole("tab", { name: "Three" }))
		expect(onChange).toHaveBeenCalledWith("three")
		expect(screen.getByRole("tab", { name: "Three" }).getAttribute("aria-selected")).toBe("true")
		expect(screen.getByText("Third panel")).toBeTruthy()
		fireEvent.click(screen.getByRole("tab", { name: "Two" }))
		expect(onChange).toHaveBeenCalledTimes(1)
	})

	it("arrow keys move focus, skip the disabled tab and wrap; Enter-free selection happens on click only", () => {
		render(<TabsDemo />)
		const [one, , three] = screen.getAllByRole("tab") as [HTMLElement, HTMLElement, HTMLElement]
		one.focus()
		key(one, "ArrowRight")
		expect(document.activeElement).toBe(three)
		expect(three.getAttribute("aria-selected")).toBe("false")
		key(three, "ArrowRight")
		expect(document.activeElement).toBe(one)
		key(one, "End")
		expect(document.activeElement).toBe(three)
		key(three, "Home")
		expect(document.activeElement).toBe(one)
	})

	it("selectionFollowsFocus selects with the arrow keys", () => {
		render(<TabsDemo selectionFollowsFocus />)
		const [one] = screen.getAllByRole("tab") as [HTMLElement]
		one.focus()
		key(one, "ArrowRight")
		expect(screen.getByRole("tab", { name: "Three" }).getAttribute("aria-selected")).toBe("true")
	})

	it("keepMounted keeps a hidden panel's content in the page", () => {
		render(<TabsDemo keepMounted />)
		expect(screen.getByText("Third panel").closest("[role=tabpanel]")?.hasAttribute("hidden")).toBe(true)
	})

	it("sets list options as data attributes, and an uncontrolled TabContext works", () => {
		const { container } = render(
			<TabContext defaultValue="b" orientation="vertical">
				<TabList><Tab value="a">A</Tab><Tab value="b">B</Tab></TabList>
				<TabPanel value="b">B body</TabPanel>
			</TabContext>,
		)
		expect((container.querySelector(".omni-tabs") as HTMLElement).dataset).toMatchObject({ orientation: "vertical", color: "primary", variant: "standard" })
		expect(screen.getByText("B body")).toBeTruthy()
		fireEvent.click(screen.getByRole("tab", { name: "A" }))
		expect(screen.queryByText("B body")).toBeNull()
	})

	it("Tab outside a TabContext explains the mistake", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {})
		expect(() => render(<Tab value="x" label="x" />)).toThrow(/must be inside <TabContext>/)
		spy.mockRestore()
	})
})

describe("server rendering", () => {
	it("renders every component to HTML without a browser", () => {
		const html = renderToString(
			<ThemeProvider theme={createTheme()}>
				<Button variant="contained">Save</Button>
				<TextField label="Name" defaultValue="Ada" helperText="Hi" />
				<Dialog open>never rendered on the server</Dialog>
				<Menu anchorEl={null} open>
					<MenuItem>x</MenuItem>
				</Menu>
				<TabContext defaultValue="a">
					<TabList><Tab value="a">A</Tab></TabList>
					<TabPanel value="a">Body A</TabPanel>
				</TabContext>
			</ThemeProvider>,
		)
		expect(html).toContain('class="omni-button"')
		expect(html).toContain('data-shrink=""') // defaultValue: label already floated, so hydration matches
		expect(html).toContain("Body A")
		expect(html).not.toContain("never rendered")
		expect(html).toContain("--omni-palette-primary-main:#1976d2")
	})
})

it("re-rendering does not warn (no updates during render)", async () => {
	const error = vi.spyOn(console, "error").mockImplementation(() => {})
	render(<StrictMode><DialogDemo /><TabsDemo /><MenuDemo /></StrictMode>)
	fireEvent.click(screen.getByText("Open"))
	await act(async () => {})
	expect(error).not.toHaveBeenCalled()
	error.mockRestore()
})
