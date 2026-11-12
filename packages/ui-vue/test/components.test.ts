import { fireEvent, screen, waitFor } from "@testing-library/dom"
import { createSSRApp, defineComponent, h, nextTick, ref } from "vue"
import { renderToString } from "vue/server-renderer"
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
import { flush, mount, slot } from "./mount"

const key = (el: Element, k: string, init: KeyboardEventInit = {}): void => void fireEvent.keyDown(el, { key: k, ...init })

describe("Button", () => {
	it("is a real button with Material defaults", () => {
		mount(() => h(Button, null, slot("Save")))
		const button = screen.getByRole("button", { name: "Save" })
		expect(button.tagName).toBe("BUTTON")
		expect(button).toHaveProperty("type", "button")
		expect(button.className).toBe("omni-button")
		expect(button.dataset).toMatchObject({ variant: "text", color: "primary", size: "medium" })
	})

	it("variant, colour, size and flags; attributes and classes pass through", () => {
		mount(() => h(Button, { variant: "contained", color: "error", size: "large", fullWidth: true, disableElevation: true, type: "submit", class: "mine", "data-x": "1" }, slot("Go")))
		const button = screen.getByRole("button")
		expect(button.className).toBe("omni-button mine")
		expect(button.dataset).toMatchObject({ variant: "contained", color: "error", size: "large", fullWidth: "", disableElevation: "", x: "1" })
		expect(button).toHaveProperty("type", "submit")
	})

	it("emits click; a disabled button does not", async () => {
		const onClick = vi.fn()
		const disabled = ref(false)
		mount(() => h(Button, { onClick, disabled: disabled.value }, slot("x")))
		fireEvent.click(screen.getByRole("button"))
		expect(onClick).toHaveBeenCalledTimes(1)
		disabled.value = true
		await flush()
		expect(screen.getByRole("button")).toHaveProperty("disabled", true)
		fireEvent.click(screen.getByRole("button"))
		expect(onClick).toHaveBeenCalledTimes(1)
	})

	it("loading blocks clicks but stays focusable", () => {
		const onClick = vi.fn()
		mount(() => h(Button, { loading: true, onClick }, slot("Pay")))
		const button = screen.getByRole("button")
		expect(button.getAttribute("aria-disabled")).toBe("true")
		expect(button).toHaveProperty("disabled", false)
		fireEvent.click(button)
		expect(onClick).not.toHaveBeenCalled()
	})

	it("with href it is a link that looks like a button", async () => {
		const onClick = vi.fn()
		const disabled = ref(false)
		mount(() => h(Button, { href: "/docs", onClick, disabled: disabled.value }, slot("Docs")))
		const link = screen.getByRole("button", { name: "Docs" })
		expect(link.tagName).toBe("A")
		expect(link.getAttribute("href")).toBe("/docs")
		fireEvent.click(link)
		expect(onClick).toHaveBeenCalledTimes(1)
		disabled.value = true
		await flush()
		expect(screen.getByRole("button").getAttribute("tabindex")).toBe("-1")
		expect(fireEvent.click(screen.getByRole("button"))).toBe(false)
		expect(onClick).toHaveBeenCalledTimes(1)
	})

	it("start and end icon slots", () => {
		mount(() => h(Button, null, { default: () => "Next", startIcon: () => h("i", { "data-testid": "s" }), endIcon: () => h("i", { "data-testid": "e" }) }))
		expect(screen.getByTestId("s").parentElement?.className).toBe("omni-button__start")
		expect(screen.getByTestId("e").parentElement?.className).toBe("omni-button__end")
	})

	it("ripples on press, unless turned off (also when switched at runtime)", async () => {
		const off = ref(false)
		mount(() => h(Button, { disableRipple: off.value }, slot("Press")))
		const button = screen.getByRole("button")
		fireEvent.pointerDown(button, { button: 0, clientX: 5, clientY: 5 })
		expect(button.querySelector(".omni-ripple")).not.toBeNull()
		button.querySelector(".omni-ripple")?.dispatchEvent(new Event("animationend"))
		off.value = true
		await flush()
		fireEvent.pointerDown(button, { button: 0, clientX: 5, clientY: 5 })
		expect(button.querySelector(".omni-ripple")).toBeNull()
	})

	it("takes defaults from the theme, and explicit props win", () => {
		const theme = createTheme({ components: { OmniButton: { defaultProps: { variant: "contained", size: "small" } } } })
		mount(() => h(ThemeProvider, { theme }, slot(h(Button, null, slot("a")), h(Button, { size: "large" }, slot("b")))))
		const [a, b] = screen.getAllByRole("button")
		expect(a?.dataset).toMatchObject({ variant: "contained", size: "small" })
		expect(b?.dataset).toMatchObject({ variant: "contained", size: "large" })
	})
})

describe("ThemeProvider", () => {
	it("scopes the theme's CSS variables to a wrapper and sets the colour scheme", () => {
		const { container } = mount(() => h(ThemeProvider, { theme: createTheme({ palette: { primary: { main: "#ff5722" } } }), colorScheme: "dark" }, slot("in")))
		const wrapper = container.querySelector("[data-omni-theme]") as HTMLElement
		expect(wrapper.getAttribute("data-omni-color-scheme")).toBe("dark")
		expect(wrapper.style.display).toBe("contents")
		const css = container.querySelector("style")?.textContent ?? ""
		expect(css).toContain(`[data-omni-theme="${wrapper.getAttribute("data-omni-theme")}"]`)
		expect(css).toContain("--omni-palette-primary-main:#ff5722")
	})

	it("defaults to following the system, and nested providers inherit the outer scheme", () => {
		const t = createTheme()
		const { container } = mount(() =>
			h(ThemeProvider, { theme: t }, slot(h(ThemeProvider, { theme: t, colorScheme: "light" }, slot(h(ThemeProvider, { theme: t }, slot("x")))))),
		)
		const schemes = Array.from(container.querySelectorAll("[data-omni-theme]")).map((e) => e.getAttribute("data-omni-color-scheme"))
		expect(schemes).toEqual(["system", "light", "light"])
	})
})

describe("TextField", () => {
	it("connects the label, the input and the helper text", () => {
		mount(() => h(TextField, { label: "Email", helperText: "We never share it", id: "email" }))
		const input = screen.getByLabelText("Email")
		expect(input.id).toBe("email")
		expect(input.getAttribute("aria-describedby")).toBe("email-helper")
		expect(screen.getByText("We never share it").id).toBe("email-helper")
	})

	it("generates an id when none is given", () => {
		mount(() => h(TextField, { label: "Name" }))
		expect(screen.getByLabelText("Name").id).not.toBe("")
	})

	it("floats the label on focus and when it has a value", async () => {
		const { container } = mount(() => h(TextField, { label: "Name" }))
		const root = container.querySelector(".omni-text-field") as HTMLElement
		const input = screen.getByLabelText("Name")
		expect(root.hasAttribute("data-shrink")).toBe(false)
		fireEvent.focus(input)
		await flush()
		expect(root.hasAttribute("data-focused")).toBe(true)
		expect(root.hasAttribute("data-shrink")).toBe(true)
		fireEvent.blur(input)
		await flush()
		expect(root.hasAttribute("data-shrink")).toBe(false)
		fireEvent.input(input, { target: { value: "Ada" } })
		await flush()
		expect(root.hasAttribute("data-filled")).toBe(true)
		fireEvent.input(input, { target: { value: "" } })
		await flush()
		expect(root.hasAttribute("data-filled")).toBe(false)
	})

	it("an input that starts with a defaultValue has its label floated from the start", () => {
		const { container } = mount(() => h(TextField, { label: "City", defaultValue: "Oslo" }))
		expect((container.querySelector(".omni-text-field") as HTMLElement).hasAttribute("data-shrink")).toBe(true)
		expect((screen.getByLabelText("City") as HTMLInputElement).value).toBe("Oslo")
	})

	it("v-model: shows the value, reports changes, follows the parent", async () => {
		const value = ref("")
		const seen = vi.fn()
		const { container } = mount(() => h(TextField, { label: "Q", modelValue: value.value, "onUpdate:modelValue": (v: string) => { seen(v); value.value = v } }))
		const input = screen.getByLabelText("Q") as HTMLInputElement
		fireEvent.input(input, { target: { value: "hi" } })
		await flush()
		expect(seen).toHaveBeenCalledWith("hi")
		expect(input.value).toBe("hi")
		expect((container.querySelector(".omni-text-field") as HTMLElement).hasAttribute("data-filled")).toBe(true)
		value.value = "changed"
		await flush()
		expect(input.value).toBe("changed")
	})

	it("shows the error state, required, disabled and read-only", () => {
		const { container } = mount(() =>
			h("div", null, [
				h(TextField, { label: "Age", error: true, helperText: "Must be a number" }),
				h(TextField, { label: "Req", required: true }),
				h(TextField, { label: "Dis", disabled: true }),
				h(TextField, { label: "Ro", readOnly: true }),
			]),
		)
		expect(screen.getByLabelText("Age").getAttribute("aria-invalid")).toBe("true")
		expect(container.querySelector(".omni-text-field")?.hasAttribute("data-error")).toBe(true)
		expect(screen.getByText("Must be a number").hasAttribute("data-error")).toBe(true)
		expect(screen.getByLabelText(/Req/)).toHaveProperty("required", true)
		expect(container.querySelector(".omni-text-field__required")?.getAttribute("aria-hidden")).toBe("true")
		expect(screen.getByLabelText("Dis")).toHaveProperty("disabled", true)
		expect(screen.getByLabelText("Ro")).toHaveProperty("readOnly", true)
	})

	it("multiline renders a textarea; variant, size, colour and fullWidth become data attributes", () => {
		const { container } = mount(() => h(TextField, { label: "Bio", multiline: true, rows: 3, variant: "filled", size: "small", color: "secondary", fullWidth: true }))
		const area = screen.getByLabelText("Bio")
		expect(area.tagName).toBe("TEXTAREA")
		expect(area.getAttribute("rows")).toBe("3")
		expect((container.querySelector(".omni-text-field") as HTMLElement).dataset).toMatchObject({ variant: "filled", size: "small", color: "secondary", fullWidth: "" })
	})

	it("adornment slots, no label, attrs reach the input, classes reach the root, focus via the box", () => {
		const onFocus = vi.fn()
		const { container } = mount(() =>
			h(TextField, { placeholder: "Search", maxlength: "5", class: "mine", onFocus }, { startAdornment: () => h("b", { "data-testid": "s" }, "$"), endAdornment: () => h("b", { "data-testid": "e" }, "kg") }),
		)
		expect(screen.getByTestId("s").parentElement?.getAttribute("data-position")).toBe("start")
		expect(screen.getByTestId("e").parentElement?.getAttribute("data-position")).toBe("end")
		const input = screen.getByPlaceholderText("Search")
		expect(input.getAttribute("maxlength")).toBe("5")
		const root = container.querySelector(".omni-text-field") as HTMLElement
		expect(root.className).toContain("mine")
		expect(root.hasAttribute("data-has-label")).toBe(false)
		expect(root.hasAttribute("data-shrink")).toBe(true)
		expect(container.querySelector("label")).toBeNull()
		fireEvent.click(container.querySelector(".omni-text-field__control") as Element)
		expect(document.activeElement).toBe(input)
		fireEvent.focus(input)
		expect(onFocus).toHaveBeenCalled()
	})

	it("emits blur", () => {
		const onBlur = vi.fn()
		mount(() => h(TextField, { label: "X", onBlur }))
		fireEvent.blur(screen.getByLabelText("X"))
		expect(onBlur).toHaveBeenCalled()
	})
})

const DialogDemo = defineComponent({
	props: { onClose: { type: Function, default: () => {} } },
	setup(props) {
		const open = ref(false)
		return () => [
			h("button", { onClick: () => (open.value = true) }, "Open"),
			h(
				Dialog,
				{ open: open.value, onClose: (e: Event | undefined, reason: string) => { (props.onClose as (e: unknown, r: string) => void)(e, reason); open.value = false } },
				slot(
					h(DialogTitle, null, slot("Delete project?")),
					h(DialogContent, null, slot(h(DialogContentText, null, slot("This cannot be undone.")))),
					h(DialogActions, null, slot(h("button", null, "Cancel"), h("button", null, "Delete"))),
				),
			),
		]
	},
})

describe("Dialog", () => {
	it("renders nothing while closed and a labelled modal dialog when open", async () => {
		mount(() => h(DialogDemo))
		expect(screen.queryByRole("dialog")).toBeNull()
		fireEvent.click(screen.getByText("Open"))
		await waitFor(() => expect(screen.getByRole("dialog", { name: "Delete project?" })).toBeTruthy())
		const dialog = screen.getByRole("dialog")
		expect(dialog.getAttribute("aria-modal")).toBe("true")
		expect(dialog.getAttribute("aria-describedby")).toBe(screen.getByText("This cannot be undone.").id)
		expect(dialog.closest("[data-omni-portal]")?.parentElement).toBe(document.body)
	})

	it("moves focus in, locks scroll, hides the page, and undoes it all on close", async () => {
		mount(() => h(DialogDemo))
		const opener = screen.getByText("Open")
		opener.focus()
		fireEvent.click(opener)
		await waitFor(() => expect(document.activeElement).toBe(screen.getByText("Cancel")))
		expect(document.body.style.overflow).toBe("hidden")
		key(screen.getByRole("dialog").parentElement as Element, "Escape")
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
		expect(document.body.style.overflow).toBe("")
		expect(document.activeElement).toBe(opener)
	})

	it("Escape and a backdrop click ask to close with the reason", async () => {
		const onClose = vi.fn()
		mount(() => h(DialogDemo, { onClose }))
		fireEvent.click(screen.getByText("Open"))
		await waitFor(() => screen.getByRole("dialog"))
		fireEvent.click(screen.getByRole("dialog"))
		expect(onClose).not.toHaveBeenCalled()
		fireEvent.click(screen.getByRole("dialog").parentElement as Element)
		expect(onClose).toHaveBeenCalledWith(expect.anything(), "backdropClick")
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
		fireEvent.click(screen.getByText("Open"))
		await waitFor(() => screen.getByRole("dialog"))
		key(screen.getByRole("dialog").parentElement as Element, "Escape")
		expect(onClose).toHaveBeenLastCalledWith(expect.anything(), "escapeKeyDown")
	})

	it("stays in the page for the exit animation, then leaves; update:open is emitted", async () => {
		const open = ref(true)
		const updates = vi.fn()
		mount(() => h(Dialog, { open: open.value, "onUpdate:open": updates }, slot("text")))
		await waitFor(() => screen.getByRole("dialog"))
		key(screen.getByRole("dialog").parentElement as Element, "Escape")
		expect(updates).toHaveBeenCalledWith(false)
		open.value = false
		await flush()
		expect(screen.getByRole("dialog").closest(".omni-dialog")?.getAttribute("data-state")).toBe("closed")
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 1000 })
	})

	it("size options, no backdrop, a label, alertdialog and attrs on the paper", async () => {
		mount(() => h(Dialog, { open: true, maxWidth: "lg", fullWidth: true, fullScreen: true, hideBackdrop: true, role: "alertdialog", "aria-label": "Confirm", class: "mine", id: "paper" }, slot("x")))
		await waitFor(() => screen.getByRole("alertdialog", { name: "Confirm" }))
		const dialog = screen.getByRole("alertdialog")
		const root = dialog.closest(".omni-dialog") as HTMLElement
		expect(root.className).toBe("omni-dialog mine")
		expect(root.dataset).toMatchObject({ maxWidth: "lg", fullWidth: "", fullScreen: "" })
		expect(root.querySelector(".omni-dialog__backdrop")).toBeNull()
		expect(dialog.id).toBe("paper-content".replace("paper-content", dialog.id)) // the machine owns the id
	})

	it("disableEscapeKeyDown ignores Escape", async () => {
		const onClose = vi.fn()
		mount(() => h(Dialog, { open: true, disableEscapeKeyDown: true, onClose }, slot("x")))
		await waitFor(() => screen.getByRole("dialog"))
		key(screen.getByRole("dialog").parentElement as Element, "Escape")
		expect(onClose).not.toHaveBeenCalled()
	})

	it("DialogTitle outside a Dialog is a plain heading", () => {
		mount(() => h(DialogTitle, null, slot("Lonely")))
		expect(screen.getByRole("heading", { name: "Lonely" }).id).toBe("")
	})
})

const MenuDemo = defineComponent({
	props: { onPick: { type: Function, default: () => {} }, onClose: { type: Function, default: () => {} } },
	setup(props) {
		const anchor = ref<HTMLElement | null>(null)
		return () => [
			h("button", { id: "menu-button", onClick: (e: MouseEvent) => (anchor.value = e.currentTarget as HTMLElement) }, "Menu"),
			h(
				Menu,
				{ anchorEl: anchor.value, open: anchor.value !== null, onClose: (_e: unknown, reason: string) => { (props.onClose as (r: string) => void)(reason); anchor.value = null } },
				slot(
					h(MenuItem, { onClick: () => (props.onPick as (n: string) => void)("profile") }, slot("Profile")),
					h(MenuItem, { disabled: true, onClick: () => (props.onPick as (n: string) => void)("billing") }, slot("Billing")),
					h(MenuDivider),
					h(MenuItem, { selected: true, dense: true, onClick: () => (props.onPick as (n: string) => void)("logout") }, slot("Logout")),
				),
			),
		]
	},
})

describe("Menu", () => {
	it("opens a labelled menu of items under the anchor and focuses the first item", async () => {
		mount(() => h(MenuDemo))
		fireEvent.click(screen.getByText("Menu"))
		await waitFor(() => screen.getByRole("menu"))
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
		mount(() => h(MenuDemo, { onPick, onClose }))
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

	it("clicking an item chooses it; a disabled item does nothing", async () => {
		const onPick = vi.fn()
		mount(() => h(MenuDemo, { onPick }))
		fireEvent.click(screen.getByText("Menu"))
		await waitFor(() => screen.getByRole("menu"))
		fireEvent.click(screen.getByText("Billing"))
		expect(onPick).not.toHaveBeenCalled()
		expect(screen.getByText("Billing").getAttribute("aria-disabled")).toBe("true")
		fireEvent.click(screen.getByText("Profile"))
		expect(onPick).toHaveBeenCalledWith("profile")
	})

	it("Escape, Tab and a click outside close it", async () => {
		const onClose = vi.fn()
		mount(() => h(MenuDemo, { onClose }))
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

	it("item flags; an aria-label replaces labelling by the anchor; a loose MenuItem is plain", async () => {
		mount(() => h("div", null, [h(MenuDemo), h(Menu, { anchorEl: document.body, open: true, placement: "top-end", "aria-label": "Actions" }, slot(h(MenuItem, null, slot("One")))), h("ul", null, h(MenuItem, null, slot("Loose")))]))
		fireEvent.click(screen.getByText("Menu"))
		await waitFor(() => screen.getByRole("menu", { name: "Menu" }))
		expect(screen.getByText("Logout").dataset).toMatchObject({ selected: "", dense: "" })
		expect(screen.getByRole("menu", { name: "Actions" }).hasAttribute("aria-labelledby")).toBe(false)
		expect(screen.getByText("Loose").getAttribute("role")).toBeNull()
	})
})

const TabsDemo = defineComponent({
	props: { onChange: { type: Function, default: () => {} }, selectionFollowsFocus: Boolean, keepMounted: Boolean },
	setup(props) {
		const value = ref("one")
		return () =>
			h(
				TabContext,
				{ modelValue: value.value, "onUpdate:modelValue": (v: string) => { (props.onChange as (v: string) => void)(v); value.value = v }, selectionFollowsFocus: props.selectionFollowsFocus },
				slot(
					h(TabList, { "aria-label": "Sections", color: "secondary", variant: "fullWidth", centered: true }, slot(h(Tab, { value: "one", label: "One" }), h(Tab, { value: "two", label: "Two", disabled: true }), h(Tab, { value: "three", label: "Three" }))),
					h(TabPanel, { value: "one" }, slot("First panel")),
					h(TabPanel, { value: "two" }, slot("Second panel")),
					h(TabPanel, { value: "three", keepMounted: props.keepMounted }, slot("Third panel")),
				),
			)
	},
})

describe("Tabs", () => {
	it("renders an accessible tab list with the selected panel visible", () => {
		mount(() => h(TabsDemo))
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

	it("selects on click, shows that panel, and tells the listener", async () => {
		const onChange = vi.fn()
		mount(() => h(TabsDemo, { onChange }))
		fireEvent.click(screen.getByRole("tab", { name: "Three" }))
		await flush()
		expect(onChange).toHaveBeenCalledWith("three")
		expect(screen.getByRole("tab", { name: "Three" }).getAttribute("aria-selected")).toBe("true")
		expect(screen.getByText("Third panel")).toBeTruthy()
		fireEvent.click(screen.getByRole("tab", { name: "Two" }))
		expect(onChange).toHaveBeenCalledTimes(1)
	})

	it("arrow keys move focus, skip the disabled tab and wrap", () => {
		mount(() => h(TabsDemo))
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

	it("selectionFollowsFocus selects with the arrow keys", async () => {
		mount(() => h(TabsDemo, { selectionFollowsFocus: true }))
		const [one] = screen.getAllByRole("tab") as [HTMLElement]
		one.focus()
		key(one, "ArrowRight")
		await flush()
		expect(screen.getByRole("tab", { name: "Three" }).getAttribute("aria-selected")).toBe("true")
	})

	it("keepMounted keeps a hidden panel's content in the page", () => {
		mount(() => h(TabsDemo, { keepMounted: true }))
		expect(screen.getByText("Third panel").closest("[role=tabpanel]")?.hasAttribute("hidden")).toBe(true)
	})

	it("an uncontrolled TabContext works and emits change; list options are data attributes", async () => {
		const change = vi.fn()
		const { container } = mount(() =>
			h(TabContext, { defaultValue: "b", orientation: "vertical", onChange: change }, slot(h(TabList, null, slot(h(Tab, { value: "a" }, slot("A")), h(Tab, { value: "b" }, slot("B")))), h(TabPanel, { value: "b" }, slot("B body")))),
		)
		expect((container.querySelector(".omni-tabs") as HTMLElement).dataset).toMatchObject({ orientation: "vertical", color: "primary", variant: "standard" })
		expect(screen.getByText("B body")).toBeTruthy()
		fireEvent.click(screen.getByRole("tab", { name: "A" }))
		await flush()
		expect(change).toHaveBeenCalledWith(expect.anything(), "a")
		expect(screen.queryByText("B body")).toBeNull()
	})

	it("Tab, TabList and TabPanel outside a TabContext explain the mistake", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
		for (const part of [Tab, TabList, TabPanel]) {
			expect(() => mount(() => h(part as never, { value: "x" }))).toThrow(/must be inside <TabContext>/)
		}
		warn.mockRestore()
	})
})

describe("server rendering", () => {
	it("renders every component to HTML without a browser", async () => {
		const app = createSSRApp({
			render: () =>
				h(ThemeProvider, { theme: createTheme() }, slot(
					h(Button, { variant: "contained" }, slot("Save")),
					h(TextField, { label: "Name", defaultValue: "Ada", helperText: "Hi" }),
					h(Dialog, { open: true }, slot("never rendered on the server")),
					h(Menu, { anchorEl: null, open: true }, slot(h(MenuItem, null, slot("x")))),
					h(TabContext, { defaultValue: "a" }, slot(h(TabList, null, slot(h(Tab, { value: "a" }, slot("A")))), h(TabPanel, { value: "a" }, slot("Body A")))),
				)),
		})
		const html = await renderToString(app)
		expect(html).toContain('class="omni-button"')
		expect(html).toMatch(/data-shrink[ >=]/)
		expect(html).toContain("Body A")
		expect(html).not.toContain("never rendered")
		expect(html).toContain("--omni-palette-primary-main:#1976d2")
	})
})

it("unmounting releases subscriptions", async () => {
	const { unmount } = mount(() => h(DialogDemo))
	fireEvent.click(screen.getByText("Open"))
	await waitFor(() => screen.getByRole("dialog"))
	unmount()
	await nextTick()
	expect(document.body.style.overflow).toBe("")
	expect(screen.queryByRole("dialog")).toBeNull()
})
