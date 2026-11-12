import { ChangeDetectionStrategy, Component, signal } from "@angular/core"
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms"
import { TestBed } from "@angular/core/testing"
import { fireEvent, screen, waitFor } from "@testing-library/dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
	OmniButton,
	OmniDialog,
	OmniDialogActions,
	OmniDialogContent,
	OmniDialogContentText,
	OmniDialogTitle,
	OmniMenu,
	OmniMenuDivider,
	OmniMenuItem,
	OmniTab,
	OmniTabContext,
	OmniTabList,
	OmniTabPanel,
	OmniTextField,
	OmniThemeProvider,
	createTheme,
} from "../src"
import { key, render, settle } from "./helpers"

afterEach(() => {
	TestBed.resetTestingModule()
	document.body.innerHTML = ""
	document.body.removeAttribute("style")
})

@Component({
	standalone: true,
	imports: [OmniButton],
	template: `
		<button omni-button [variant]="variant()" [color]="color()" size="large" fullWidth disableElevation [loading]="loading()" [disabled]="disabled()" class="mine" data-x="1" (click)="clicks.set(clicks() + 1)">
			<i omniStartIcon data-testid="s"></i>Save<i omniEndIcon data-testid="e"></i>
		</button>
		<a omni-button href="/docs" [disabled]="linkDisabled()" (click)="linkClicks.set(linkClicks() + 1)">Docs</a>
		<button omni-button disableRipple>Plain</button>
	`,
})
class ButtonHost {
	variant = signal<"text" | "outlined" | "contained">("contained")
	color = signal<"primary" | "error">("error")
	loading = signal(false)
	disabled = signal(false)
	linkDisabled = signal(false)
	clicks = signal(0)
	linkClicks = signal(0)
}

describe("Button", () => {
	it("is a real button with Material attributes, classes and icons", async () => {
		await render(ButtonHost)
		const button = screen.getByRole("button", { name: "Save" })
		expect(button.tagName).toBe("BUTTON")
		expect(button.className).toContain("omni-button")
		expect(button.className).toContain("mine")
		expect(button.dataset).toMatchObject({ variant: "contained", color: "error", size: "large", fullWidth: "", disableElevation: "", x: "1" })
		expect(button).toHaveProperty("type", "button")
		expect(screen.getByTestId("s").parentElement?.className).toBe("omni-button__start")
		expect(screen.getByTestId("e").parentElement?.className).toBe("omni-button__end")
	})

	it("updates when inputs change, and click works", async () => {
		const fixture = await render(ButtonHost)
		fixture.componentInstance.variant.set("outlined")
		await settle(fixture)
		expect(screen.getByRole("button", { name: "Save" }).dataset["variant"]).toBe("outlined")
		fireEvent.click(screen.getByRole("button", { name: "Save" }))
		expect(fixture.componentInstance.clicks()).toBe(1)
	})

	it("a disabled button is really disabled; a loading one is aria-disabled and swallows clicks", async () => {
		const fixture = await render(ButtonHost)
		fixture.componentInstance.loading.set(true)
		await settle(fixture)
		const button = screen.getByRole("button", { name: "Save" })
		expect(button.getAttribute("aria-disabled")).toBe("true")
		expect(button.hasAttribute("data-loading")).toBe(true)
		fireEvent.click(button)
		expect(fixture.componentInstance.clicks()).toBe(0)
		fixture.componentInstance.loading.set(false)
		fixture.componentInstance.disabled.set(true)
		await settle(fixture)
		expect(button).toHaveProperty("disabled", true)
		expect(button.hasAttribute("aria-disabled")).toBe(false)
		fireEvent.click(button)
		expect(fixture.componentInstance.clicks()).toBe(0)
	})

	it("an anchor keeps role=button and leaves the Tab order when disabled", async () => {
		const fixture = await render(ButtonHost)
		const link = screen.getByRole("button", { name: "Docs" })
		expect(link.tagName).toBe("A")
		expect(link.getAttribute("href")).toBe("/docs")
		fireEvent.click(link)
		expect(fixture.componentInstance.linkClicks()).toBe(1)
		fixture.componentInstance.linkDisabled.set(true)
		await settle(fixture)
		expect(link.getAttribute("tabindex")).toBe("-1")
		expect(fireEvent.click(link)).toBe(false)
		expect(fixture.componentInstance.linkClicks()).toBe(1)
	})

	it("ripples on press, unless disabled with disableRipple", async () => {
		await render(ButtonHost)
		const button = screen.getByRole("button", { name: "Save" })
		fireEvent.pointerDown(button, { button: 0, clientX: 5, clientY: 5 })
		expect(button.querySelector(".omni-ripple")).not.toBeNull()
		const plain = screen.getByRole("button", { name: "Plain" })
		fireEvent.pointerDown(plain, { button: 0, clientX: 5, clientY: 5 })
		expect(plain.querySelector(".omni-ripple")).toBeNull()
	})
})

@Component({
	standalone: true,
	imports: [OmniThemeProvider, OmniButton],
	template: `
		<omni-theme-provider [theme]="theme" [colorScheme]="scheme()">
			<button omni-button>a</button>
			<button omni-button size="large">b</button>
			<omni-theme-provider [theme]="theme" colorScheme="light">
				<omni-theme-provider [theme]="theme"><span id="inner">x</span></omni-theme-provider>
			</omni-theme-provider>
		</omni-theme-provider>
	`,
})
class ThemeHost {
	theme = createTheme({
		palette: { primary: { main: "#ff5722" } },
		components: { OmniButton: { defaultProps: { variant: "contained", size: "small" } } },
	})
	scheme = signal<"dark" | undefined>("dark")
}

describe("ThemeProvider", () => {
	it("scopes the CSS variables, sets the scheme, applies defaultProps, and nested providers inherit", async () => {
		await render(ThemeHost)
		const providers = Array.from(document.querySelectorAll("omni-theme-provider")) as HTMLElement[]
		expect(providers.map((p) => p.getAttribute("data-omni-color-scheme"))).toEqual(["dark", "light", "light"])
		const first = providers[0] as HTMLElement
		expect(first.style.display).toBe("contents")
		const css = first.querySelector("style")?.textContent ?? ""
		expect(css).toContain(`[data-omni-theme="${first.getAttribute("data-omni-theme")}"]`)
		expect(css).toContain("--omni-palette-primary-main:#ff5722")
		const [a, b] = screen.getAllByRole("button")
		expect(a?.dataset).toMatchObject({ variant: "contained", size: "small" })
		expect(b?.dataset).toMatchObject({ variant: "contained", size: "large" })
	})

	it("follows a changed colour scheme", async () => {
		const fixture = await render(ThemeHost)
		fixture.componentInstance.scheme.set(undefined)
		await settle(fixture)
		expect(document.querySelector("omni-theme-provider")?.getAttribute("data-omni-color-scheme")).toBe("system")
	})
})

@Component({
	standalone: true,
	imports: [OmniTextField, FormsModule],
	template: `
		<omni-text-field id="email" label="Email" helperText="We never share it" />
		<omni-text-field label="Name" />
		<omni-text-field label="City" defaultValue="Oslo" />
		<omni-text-field label="Age" error helperText="Must be a number" />
		<omni-text-field label="Req" required />
		<omni-text-field label="Dis" disabled />
		<omni-text-field label="Bio" multiline [rows]="3" variant="filled" size="small" color="secondary" fullWidth />
		<omni-text-field placeholder="Search"><b omniStartAdornment data-testid="s">$</b><b omniEndAdornment data-testid="e">kg</b></omni-text-field>
		<omni-text-field label="Model" [ngModel]="model()" (ngModelChange)="model.set($event)" />
		<omni-text-field label="Plain" [value]="plain()" (valueChange)="plain.set($event)" />
	`,
})
class FieldHost {
	model = signal("start")
	plain = signal("p")
}

const root = (label: string): HTMLElement => screen.getByLabelText(label).closest("omni-text-field") as HTMLElement

describe("TextField", () => {
	it("connects the label, the input and the helper text", async () => {
		await render(FieldHost)
		const input = screen.getByLabelText("Email")
		expect(input.id).toBe("email")
		expect(input.getAttribute("aria-describedby")).toBe("email-helper")
		expect(screen.getByText("We never share it").id).toBe("email-helper")
		expect(screen.getByLabelText("Name").id).not.toBe("")
	})

	it("floats the label on focus and when it has a value", async () => {
		const fixture = await render(FieldHost)
		const input = screen.getByLabelText("Name")
		expect(root("Name").hasAttribute("data-shrink")).toBe(false)
		fireEvent.focus(input)
		await settle(fixture)
		expect(root("Name").hasAttribute("data-focused")).toBe(true)
		expect(root("Name").hasAttribute("data-shrink")).toBe(true)
		fireEvent.blur(input)
		await settle(fixture)
		expect(root("Name").hasAttribute("data-shrink")).toBe(false)
		fireEvent.input(input, { target: { value: "Ada" } })
		await settle(fixture)
		expect(root("Name").hasAttribute("data-filled")).toBe(true)
		fireEvent.input(input, { target: { value: "" } })
		await settle(fixture)
		expect(root("Name").hasAttribute("data-filled")).toBe(false)
	})

	it("an input that starts with a defaultValue has its label floated from the start", async () => {
		await render(FieldHost)
		expect(root("City").hasAttribute("data-shrink")).toBe(true)
		expect((screen.getByLabelText("City") as HTMLInputElement).value).toBe("Oslo")
	})

	it("shows the error state, required, disabled", async () => {
		await render(FieldHost)
		expect(screen.getByLabelText("Age").getAttribute("aria-invalid")).toBe("true")
		expect(root("Age").hasAttribute("data-error")).toBe(true)
		expect(screen.getByText("Must be a number").hasAttribute("data-error")).toBe(true)
		expect(screen.getByLabelText(/Req/)).toHaveProperty("required", true)
		expect(document.querySelector(".omni-text-field__required")?.getAttribute("aria-hidden")).toBe("true")
		expect(screen.getByLabelText("Dis")).toHaveProperty("disabled", true)
	})

	it("multiline renders a textarea; variant, size, colour and fullWidth become data attributes", async () => {
		await render(FieldHost)
		const area = screen.getByLabelText("Bio")
		expect(area.tagName).toBe("TEXTAREA")
		expect(area.getAttribute("rows")).toBe("3")
		expect(root("Bio").dataset).toMatchObject({ variant: "filled", size: "small", color: "secondary", fullWidth: "" })
		expect(root("Name").dataset).toMatchObject({ variant: "outlined", size: "medium", color: "primary" })
	})

	it("adornments project into place and keep the label floated", async () => {
		await render(FieldHost)
		expect(screen.getByTestId("s").parentElement?.getAttribute("data-position")).toBe("start")
		expect(screen.getByTestId("e").parentElement?.getAttribute("data-position")).toBe("end")
		const field = screen.getByPlaceholderText("Search").closest("omni-text-field") as HTMLElement
		expect(field.hasAttribute("data-has-label")).toBe(false)
		expect(field.hasAttribute("data-shrink")).toBe(true)
	})

	it("works with ngModel, both ways", async () => {
		const fixture = await render(FieldHost)
		await waitFor(() => expect((screen.getByLabelText("Model") as HTMLInputElement).value).toBe("start"))
		fireEvent.input(screen.getByLabelText("Model"), { target: { value: "typed" } })
		await settle(fixture)
		expect(fixture.componentInstance.model()).toBe("typed")
		fixture.componentInstance.model.set("from parent")
		await settle(fixture)
		await waitFor(() => expect((screen.getByLabelText("Model") as HTMLInputElement).value).toBe("from parent"))
	})

	it("works with [value] and (valueChange)", async () => {
		const fixture = await render(FieldHost)
		expect((screen.getByLabelText("Plain") as HTMLInputElement).value).toBe("p")
		fireEvent.input(screen.getByLabelText("Plain"), { target: { value: "q" } })
		expect(fixture.componentInstance.plain()).toBe("q")
	})

	it("clicking the box focuses the input", async () => {
		await render(FieldHost)
		fireEvent.click(screen.getByLabelText("Name").closest(".omni-text-field__control") as Element)
		expect(document.activeElement).toBe(screen.getByLabelText("Name"))
	})
})

@Component({
	standalone: true,
	imports: [OmniTextField, ReactiveFormsModule],
	template: `<omni-text-field label="Reactive" [formControl]="control" />`,
})
class ReactiveHost {
	control = new FormControl("init", { nonNullable: true })
}

describe("TextField with reactive forms", () => {
	it("reads, writes, disables and reports touched", async () => {
		const fixture = await render(ReactiveHost)
		const input = screen.getByLabelText("Reactive") as HTMLInputElement
		await waitFor(() => expect(input.value).toBe("init"))
		fireEvent.input(input, { target: { value: "x" } })
		expect(fixture.componentInstance.control.value).toBe("x")
		fixture.componentInstance.control.setValue("y")
		await settle(fixture)
		expect(input.value).toBe("y")
		fixture.componentInstance.control.setValue(null as never)
		await settle(fixture)
		expect(input.value).toBe("")
		fireEvent.blur(input)
		expect(fixture.componentInstance.control.touched).toBe(true)
		fixture.componentInstance.control.disable()
		await settle(fixture)
		expect(input.disabled).toBe(true)
	})
})

@Component({
	standalone: true,
	imports: [OmniDialog, OmniDialogTitle, OmniDialogContent, OmniDialogContentText, OmniDialogActions],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<button id="opener" (click)="open.set(true)">Open</button>
		<omni-dialog [open]="open()" (openChange)="open.set($event)" (closed)="reasons.push($event.reason)">
			<h2 omniDialogTitle>Delete project?</h2>
			<div omniDialogContent><p omniDialogContentText>This cannot be undone.</p></div>
			<div omniDialogActions><button>Cancel</button><button>Delete</button></div>
		</omni-dialog>
	`,
})
class DialogHost {
	open = signal(false)
	reasons: string[] = []
}

describe("Dialog", () => {
	it("renders nothing while closed and a labelled modal dialog in a portal when open", async () => {
		const fixture = await render(DialogHost)
		expect(screen.queryByRole("dialog")).toBeNull()
		fireEvent.click(screen.getByText("Open"))
		await settle(fixture)
		const dialog = screen.getByRole("dialog", { name: "Delete project?" })
		expect(dialog.getAttribute("aria-modal")).toBe("true")
		expect(dialog.getAttribute("aria-describedby")).toBe(screen.getByText("This cannot be undone.").id)
		expect(dialog.closest("[data-omni-portal]")?.parentElement).toBe(document.body)
	})

	it("moves focus in, locks scroll, hides the page, and undoes it all on close", async () => {
		const fixture = await render(DialogHost)
		const opener = screen.getByText("Open")
		opener.focus()
		fireEvent.click(opener)
		await settle(fixture)
		await waitFor(() => expect(document.activeElement).toBe(screen.getByText("Cancel")))
		expect(document.body.style.overflow).toBe("hidden")
		key(screen.getByRole("dialog").parentElement as Element, "Escape")
		await settle(fixture)
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
		await settle(fixture)
		expect(document.body.style.overflow).toBe("")
		expect(document.activeElement).toBe(opener)
		expect(document.querySelector("[data-omni-portal]")).toBeNull()
		expect(fixture.nativeElement.querySelector("omni-dialog")).not.toBeNull() // back where it was
	})

	it("Escape and a backdrop click ask to close with the reason", async () => {
		const fixture = await render(DialogHost)
		fireEvent.click(screen.getByText("Open"))
		await settle(fixture)
		fireEvent.click(screen.getByRole("dialog"))
		expect(fixture.componentInstance.reasons).toEqual([])
		fireEvent.click(screen.getByRole("dialog").parentElement as Element)
		await settle(fixture)
		expect(fixture.componentInstance.reasons).toEqual(["backdropClick"])
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
		fireEvent.click(screen.getByText("Open"))
		await settle(fixture)
		key(screen.getByRole("dialog").parentElement as Element, "Escape")
		expect(fixture.componentInstance.reasons).toEqual(["backdropClick", "escapeKeyDown"])
	})
})

@Component({
	standalone: true,
	imports: [OmniDialog],
	template: `<omni-dialog [open]="true" maxWidth="lg" fullWidth fullScreen hideBackdrop role="alertdialog" label="Confirm" className="mine" disableEscapeKeyDown (closed)="n = n + 1">x</omni-dialog>`,
})
class DialogOptionsHost {
	n = 0
}

describe("Dialog options", () => {
	it("size options, no backdrop, a label, alertdialog; disableEscapeKeyDown ignores Escape", async () => {
		const fixture = await render(DialogOptionsHost)
		const dialog = screen.getByRole("alertdialog", { name: "Confirm" })
		const root = dialog.closest(".omni-dialog") as HTMLElement
		expect(root.className).toContain("mine")
		expect(root.dataset).toMatchObject({ maxWidth: "lg", fullWidth: "", fullScreen: "" })
		expect(root.querySelector(".omni-dialog__backdrop")).toBeNull()
		key(dialog.parentElement as Element, "Escape")
		expect(fixture.componentInstance.n).toBe(0)
	})
})

@Component({
	standalone: true,
	imports: [OmniMenu, OmniMenuItem, OmniMenuDivider],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<button id="menu-button" #anchor (click)="open.set(true)">Menu</button>
		<omni-menu [anchorEl]="anchor" [open]="open()" (openChange)="open.set($event)" (closed)="reasons.push($event.reason)">
			<li omniMenuItem (click)="picked.push('profile')">Profile</li>
			<li omniMenuItem disabled (click)="picked.push('billing')">Billing</li>
			<li omniMenuDivider></li>
			<li omniMenuItem selected dense (click)="picked.push('logout')">Logout</li>
		</omni-menu>
	`,
})
class MenuHost {
	open = signal(false)
	reasons: string[] = []
	picked: string[] = []
}

describe("Menu", () => {
	it("opens a labelled menu of items under the anchor and focuses the first item", async () => {
		const fixture = await render(MenuHost)
		fireEvent.click(screen.getByText("Menu"))
		await settle(fixture)
		const menu = screen.getByRole("menu", { name: "Menu" })
		expect(menu.getAttribute("aria-labelledby")).toBe("menu-button")
		expect(screen.getAllByRole("menuitem")).toHaveLength(3)
		expect(screen.getByRole("separator")).toBeTruthy()
		await waitFor(() => expect(document.activeElement).toBe(screen.getByText("Profile")))
		await waitFor(() => expect(menu.style.position).toBe("fixed"))
		expect(menu.closest("[data-omni-portal]")?.parentElement).toBe(document.body)
	})

	it("arrow keys move focus past disabled items; Enter chooses and closes", async () => {
		const fixture = await render(MenuHost)
		fireEvent.click(screen.getByText("Menu"))
		await settle(fixture)
		await waitFor(() => expect(document.activeElement).toBe(screen.getByText("Profile")))
		key(document.activeElement as Element, "ArrowDown")
		expect(document.activeElement).toBe(screen.getByText("Logout"))
		key(document.activeElement as Element, "Enter")
		await settle(fixture)
		expect(fixture.componentInstance.picked).toEqual(["logout"])
		expect(fixture.componentInstance.reasons).toEqual(["select"])
		await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
		await settle(fixture)
		expect(document.activeElement).toBe(screen.getByText("Menu"))
	})

	it("clicking an item chooses it; a disabled item does nothing; item flags", async () => {
		const fixture = await render(MenuHost)
		fireEvent.click(screen.getByText("Menu"))
		await settle(fixture)
		fireEvent.click(screen.getByText("Billing"))
		expect(fixture.componentInstance.picked).toEqual([])
		expect(screen.getByText("Billing").getAttribute("aria-disabled")).toBe("true")
		expect(screen.getByText("Logout").dataset).toMatchObject({ selected: "", dense: "" })
		fireEvent.click(screen.getByText("Profile"))
		expect(fixture.componentInstance.picked).toEqual(["profile"])
	})

	it("Escape, Tab and a click outside close it", async () => {
		const fixture = await render(MenuHost)
		for (const [act, reason] of [
			[() => key(screen.getByRole("menu"), "Escape"), "escapeKeyDown"],
			[() => key(screen.getByRole("menu"), "Tab"), "tab"],
			[() => fireEvent.pointerDown(document.body), "outsidePress"],
		] as const) {
			fireEvent.click(screen.getByText("Menu"))
			await settle(fixture)
			await waitFor(() => expect(screen.getByRole("menu")).toBeTruthy())
			act()
			await settle(fixture)
			expect(fixture.componentInstance.reasons.at(-1)).toBe(reason)
			await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
			await settle(fixture)
		}
	})
})

@Component({
	standalone: true,
	imports: [OmniMenu, OmniMenuItem],
	template: `<omni-menu [anchorEl]="null" [open]="true" label="Actions" placement="top-end" [autoFocus]="false"><li omniMenuItem>One</li></omni-menu><ul><li omniMenuItem>Loose</li></ul>`,
})
class MenuOptionsHost {}

describe("Menu options", () => {
	it("a label replaces labelling by the anchor; a loose item is plain", async () => {
		await render(MenuOptionsHost)
		expect(screen.getByRole("menu", { name: "Actions" }).hasAttribute("aria-labelledby")).toBe(false)
		expect(screen.getByText("Loose").getAttribute("role")).toBeNull()
	})
})

@Component({
	standalone: true,
	imports: [OmniTabContext, OmniTabList, OmniTab, OmniTabPanel],
	template: `
		<omni-tab-context [value]="value()" (valueChange)="value.set($event); changes.push($event)" [selectionFollowsFocus]="follows">
			<omni-tab-list label="Sections" color="secondary" variant="fullWidth" centered>
				<button omni-tab value="one" label="One"></button>
				<button omni-tab value="two" label="Two" disabled></button>
				<button omni-tab value="three" label="Three"></button>
			</omni-tab-list>
			<omni-tab-panel value="one">First panel</omni-tab-panel>
			<omni-tab-panel value="two">Second panel</omni-tab-panel>
			<omni-tab-panel value="three" [keepMounted]="keep">Third panel</omni-tab-panel>
		</omni-tab-context>
	`,
})
class TabsHost {
	value = signal("one")
	changes: string[] = []
	follows = false
	keep = false
}

describe("Tabs", () => {
	it("renders an accessible tab list with the selected panel visible", async () => {
		await render(TabsHost)
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
		expect((document.querySelector(".omni-tabs") as HTMLElement).dataset).toMatchObject({ color: "secondary", variant: "fullWidth", centered: "", orientation: "horizontal" })
	})

	it("selects on click, shows that panel, and tells the listener", async () => {
		const fixture = await render(TabsHost)
		fireEvent.click(screen.getByRole("tab", { name: "Three" }))
		await settle(fixture)
		expect(fixture.componentInstance.changes).toEqual(["three"])
		expect(screen.getByRole("tab", { name: "Three" }).getAttribute("aria-selected")).toBe("true")
		expect(screen.getByText("Third panel")).toBeTruthy()
		fireEvent.click(screen.getByRole("tab", { name: "Two" }))
		expect(fixture.componentInstance.changes).toEqual(["three"])
	})

	it("arrow keys move focus, skip the disabled tab and wrap", async () => {
		await render(TabsHost)
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

	it("selectionFollowsFocus selects with the arrow keys; keepMounted keeps hidden content", async () => {
		const fixture = TestBed.createComponent(TabsHost)
		fixture.componentInstance.follows = true
		fixture.componentInstance.keep = true
		document.body.append(fixture.nativeElement)
		await settle(fixture)
		expect(screen.getByText("Third panel").closest("[role=tabpanel]")?.hasAttribute("hidden")).toBe(true)
		const [one] = screen.getAllByRole("tab") as [HTMLElement]
		one.focus()
		key(one, "ArrowRight")
		await settle(fixture)
		expect(screen.getByRole("tab", { name: "Three" }).getAttribute("aria-selected")).toBe("true")
	})
})

@Component({
	standalone: true,
	imports: [OmniTabContext, OmniTabList, OmniTab, OmniTabPanel],
	template: `
		<omni-tab-context defaultValue="b" orientation="vertical" (valueChange)="changes.push($event)">
			<omni-tab-list><button omni-tab value="a">A</button><button omni-tab value="b">B</button></omni-tab-list>
			<omni-tab-panel value="b">B body</omni-tab-panel>
		</omni-tab-context>
	`,
})
class UncontrolledTabsHost {
	changes: string[] = []
}

@Component({ standalone: true, imports: [OmniTab], template: `<button omni-tab value="x">x</button>` })
class OrphanTab {}

describe("Tabs, uncontrolled and misuse", () => {
	it("an uncontrolled TabContext starts at defaultValue and follows clicks", async () => {
		const fixture = await render(UncontrolledTabsHost)
		expect((document.querySelector(".omni-tabs") as HTMLElement).dataset["orientation"]).toBe("vertical")
		expect(screen.getByText("B body")).toBeTruthy()
		fireEvent.click(screen.getByRole("tab", { name: "A" }))
		await settle(fixture)
		expect(fixture.componentInstance.changes).toEqual(["a"])
		expect(screen.queryByText("B body")).toBeNull()
	})

	it("a tab outside a TabContext explains the mistake", () => {
		expect(() => TestBed.createComponent(OrphanTab)).toThrow(/must be inside <omni-tab-context>/)
	})
})

describe("server-safe pieces", () => {
	it("dialogs and menus without a ThemeProvider still portal to the body unthemed", async () => {
		const fixture = await render(DialogHost)
		fireEvent.click(screen.getByText("Open"))
		await settle(fixture)
		const portal = screen.getByRole("dialog").closest("[data-omni-portal]") as HTMLElement
		expect(portal.hasAttribute("data-omni-theme")).toBe(false)
		vi.restoreAllMocks()
	})
})
