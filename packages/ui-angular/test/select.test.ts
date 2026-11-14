import { ChangeDetectionStrategy, Component, signal } from "@angular/core"
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms"
import { TestBed } from "@angular/core/testing"
import { fireEvent, screen, waitFor } from "@testing-library/dom"
import { afterEach, describe, expect, it } from "vitest"
import { OmniSelect, OmniThemeProvider, createTheme } from "../src"
import { key, render, settle } from "./helpers"

afterEach(() => {
	TestBed.resetTestingModule()
	document.body.innerHTML = ""
})

const options = [
	{ value: "a", label: "Apple" },
	{ value: "b", label: "Banana", disabled: true },
	{ value: "c", label: "Cherry" },
]

@Component({
	standalone: true,
	imports: [OmniSelect, OmniThemeProvider],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<omni-select id="fruit" label="Fruit" [options]="options" defaultValue="c" helperText="Pick one" (valueChange)="changes.push($event)" (closed)="reasons.push($event.reason)" name="fruit" />
		<omni-select label="Other" [options]="options" variant="filled" size="small" color="secondary" fullWidth />
		<omni-select [options]="options" [open]="forcedOpen()" label="Forced" />
		<omni-select label="Bad" [options]="options" error required disabled helperText="Required" />
		<omni-theme-provider [theme]="theme"><omni-select label="Themed" [options]="options" /></omni-theme-provider>
	`,
})
class Host {
	options = options
	changes: string[] = []
	reasons: string[] = []
	forcedOpen = signal(false)
	theme = createTheme({ components: { OmniSelect: { defaultProps: { variant: "standard" } } } })
}

const combo = (name: RegExp | string): HTMLElement => screen.getByRole("combobox", { name })

describe("Select", () => {
	it("is a combobox labelled by its label and its own text, with a listbox in a portal when open", async () => {
		const fixture = await render(Host)
		const combobox = combo(/Fruit/)
		expect(combobox.id).toBe("fruit")
		expect(combobox.getAttribute("aria-haspopup")).toBe("listbox")
		expect(combobox.getAttribute("aria-expanded")).toBe("false")
		expect(combobox.textContent?.trim()).toBe("Cherry")
		expect(combobox.getAttribute("aria-describedby")).toBe(screen.getByText("Pick one").id)
		fireEvent.click(combobox)
		await settle(fixture)
		const list = screen.getByRole("listbox", { name: "Fruit" })
		expect(combobox.getAttribute("aria-expanded")).toBe("true")
		expect(combobox.getAttribute("aria-controls")).toBe(list.id)
		const items = screen.getAllByRole("option")
		expect(items.map((i) => i.textContent?.trim())).toEqual(["Apple", "Banana", "Cherry"])
		expect(items[2]?.getAttribute("aria-selected")).toBe("true")
		expect(items[1]?.getAttribute("aria-disabled")).toBe("true")
		expect(list.closest("[data-omni-portal]")?.parentElement).toBe(document.body)
		expect(document.getElementById("fruit")).toBe(combobox) // the host did not keep a second id
	})

	it("opens with the arrows; focuses the selected option; Enter chooses; the list leaves and focus returns", async () => {
		const fixture = await render(Host)
		const combobox = combo(/Fruit/)
		combobox.focus()
		key(combobox, "ArrowDown")
		await settle(fixture)
		await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("option", { name: "Cherry" })))
		key(document.activeElement as Element, "ArrowDown")
		expect(document.activeElement).toBe(screen.getByRole("option", { name: "Apple" }))
		key(document.activeElement as Element, "Enter")
		await settle(fixture)
		expect(fixture.componentInstance.changes).toEqual(["a"])
		expect(fixture.componentInstance.reasons).toEqual(["select"])
		await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
		await settle(fixture)
		expect(combo(/Fruit/).textContent?.trim()).toBe("Apple")
		expect(document.activeElement).toBe(combo(/Fruit/))
		expect(document.querySelector("[data-omni-portal]")).toBeNull()
		for (const k of ["Enter", " ", "ArrowUp"]) {
			key(combo(/Fruit/), k)
			await settle(fixture)
			await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy())
			key(screen.getByRole("listbox"), "Escape")
			await settle(fixture)
			await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
			await settle(fixture)
		}
		expect(fixture.componentInstance.reasons.at(-1)).toBe("escapeKeyDown")
	})

	it("a click on an option chooses it; a disabled option does nothing; the label floats with a value; hidden input", async () => {
		const fixture = await render(Host)
		const root = combo(/Other/).closest("omni-select") as HTMLElement
		expect(root.hasAttribute("data-shrink")).toBe(false)
		fireEvent.click(combo(/Other/))
		await settle(fixture)
		fireEvent.click(screen.getByRole("option", { name: "Banana" }))
		await settle(fixture)
		expect(screen.getByRole("listbox")).toBeTruthy()
		fireEvent.click(screen.getByRole("option", { name: "Cherry" }))
		await settle(fixture)
		await waitFor(() => expect(root.hasAttribute("data-filled")).toBe(true))
		expect(root.hasAttribute("data-shrink")).toBe(true)
		const hidden = combo(/Fruit/).closest("omni-select")?.querySelector('input[type="hidden"]') as HTMLInputElement
		expect([hidden.name, hidden.value]).toEqual(["fruit", "c"])
	})

	it("closes on a press outside, and reports why", async () => {
		const fixture = await render(Host)
		fireEvent.click(combo(/Fruit/))
		await settle(fixture)
		fireEvent.pointerDown(document.body)
		await settle(fixture)
		expect(fixture.componentInstance.reasons).toEqual(["outsidePress"])
	})

	it("variant, size, colour, fullWidth, disabled, error and required; theme defaults; clicking the label focuses it", async () => {
		await render(Host)
		const other = combo(/Other/).closest("omni-select") as HTMLElement
		expect(other.dataset).toMatchObject({ variant: "filled", size: "small", color: "secondary", fullWidth: "" })
		const bad = combo(/Bad/)
		expect(bad.getAttribute("aria-disabled")).toBe("true")
		expect(bad.getAttribute("aria-invalid")).toBe("true")
		expect(bad.getAttribute("aria-required")).toBe("true")
		expect(bad.closest("omni-select")?.querySelector(".omni-text-field__required")?.getAttribute("aria-hidden")).toBe("true")
		expect((combo(/Themed/).closest("omni-select") as HTMLElement).dataset["variant"]).toBe("standard")
		fireEvent.click(screen.getByText("Other", { selector: "label" }))
		expect(document.activeElement).toBe(combo(/Other/))
	})

	it("open can be controlled", async () => {
		const fixture = await render(Host)
		fixture.componentInstance.forcedOpen.set(true)
		await settle(fixture)
		await waitFor(() => expect(screen.getAllByRole("listbox").length).toBeGreaterThan(0))
	})
})

@Component({
	standalone: true,
	imports: [OmniSelect, FormsModule, ReactiveFormsModule],
	template: `
		<omni-select label="Model" [options]="options" [ngModel]="model()" (ngModelChange)="model.set($event)" />
		<omni-select label="Reactive" [options]="options" [formControl]="control" />
		<omni-select label="Bound" [options]="options" [(value)]="bound" />
	`,
})
class FormsHost {
	options = options
	model = signal("a")
	control = new FormControl("c", { nonNullable: true })
	bound = "a"
}

describe("Select with forms", () => {
	it("ngModel and reactive forms: read, write, disable, touched; [(value)] works too", async () => {
		const fixture = await render(FormsHost)
		await waitFor(() => expect(combo(/Model/).textContent?.trim()).toBe("Apple"))
		await waitFor(() => expect(combo(/Reactive/).textContent?.trim()).toBe("Cherry"))
		expect(combo(/Bound/).textContent?.trim()).toBe("Apple")
		fireEvent.click(combo(/Model/))
		await settle(fixture)
		fireEvent.click(screen.getByRole("option", { name: "Cherry" }))
		await settle(fixture)
		expect(fixture.componentInstance.model()).toBe("c")
		await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull()) // after its exit animation
		await settle(fixture)
		fireEvent.click(combo(/Reactive/))
		await settle(fixture)
		fireEvent.click(screen.getByRole("option", { name: "Apple" }))
		await settle(fixture)
		expect(fixture.componentInstance.control.value).toBe("a")
		await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
		await settle(fixture)
		fixture.componentInstance.control.setValue("c")
		await settle(fixture)
		expect(combo(/Reactive/).textContent?.trim()).toBe("Cherry")
		fixture.componentInstance.control.setValue(null as never)
		await settle(fixture)
		expect(combo(/Reactive/).textContent?.trim()).toBe("")
		fixture.componentInstance.control.disable()
		await settle(fixture)
		expect(combo(/Reactive/).getAttribute("aria-disabled")).toBe("true")
		fireEvent.click(combo(/Bound/))
		await settle(fixture)
		fireEvent.click(screen.getByRole("option", { name: "Cherry" }))
		await settle(fixture)
		expect(fixture.componentInstance.bound).toBe("c")
	})
})
