import { ChangeDetectionStrategy, Component, signal } from "@angular/core"
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms"
import { TestBed } from "@angular/core/testing"
import { fireEvent, screen } from "@testing-library/dom"
import { afterEach, describe, expect, it } from "vitest"
import { OmniCheckbox, OmniFormGroup, OmniRadio, OmniRadioGroup, OmniThemeProvider, createTheme } from "../src"
import { render, settle } from "./helpers"

afterEach(() => {
	TestBed.resetTestingModule()
	document.body.innerHTML = ""
})

const box = (name?: string): HTMLInputElement => screen.getByRole("checkbox", name ? { name } : {}) as HTMLInputElement

@Component({
	standalone: true,
	imports: [OmniCheckbox, OmniThemeProvider],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<omni-checkbox [(checked)]="accepted">Accept terms</omni-checkbox>
		<omni-checkbox defaultChecked (checkedChange)="changes.push($event)">Default on</omni-checkbox>
		<omni-checkbox indeterminate>Some</omni-checkbox>
		<omni-checkbox disabled required error name="n" value="v" id="cb-x">Flags</omni-checkbox>
		<omni-checkbox size="small" labelPlacement="start" aria-label="Hidden label" color="success" />
		<omni-theme-provider [theme]="theme"><omni-checkbox>Themed</omni-checkbox></omni-theme-provider>
	`,
})
class CheckboxHost {
	accepted = signal(false)
	changes: boolean[] = []
	theme = createTheme({ components: { OmniCheckbox: { defaultProps: { color: "secondary" } } } })
}

describe("Checkbox", () => {
	it("is a native checkbox named by its label, inside a clickable label", async () => {
		const fixture = await render(CheckboxHost)
		const accept = box("Accept terms")
		expect([accept.type, accept.checked]).toEqual(["checkbox", false])
		expect(accept.closest("label")?.className).toBe("omni-checkbox")
		fireEvent.click(screen.getByText("Accept terms"))
		await settle(fixture)
		expect(accept.checked).toBe(true)
		expect(fixture.componentInstance.accepted()).toBe(true)
		fixture.componentInstance.accepted.set(false)
		await settle(fixture)
		expect(accept.checked).toBe(false)
	})

	it("defaultChecked starts checked and still reports changes", async () => {
		const fixture = await render(CheckboxHost)
		expect(box("Default on").checked).toBe(true)
		fireEvent.click(box("Default on"))
		await settle(fixture)
		expect(fixture.componentInstance.changes).toEqual([false])
		expect(box("Default on").checked).toBe(false)
	})

	it("indeterminate is set on the input", async () => {
		await render(CheckboxHost)
		expect(box("Some").indeterminate).toBe(true)
		expect(box("Accept terms").indeterminate).toBe(false)
	})

	it("disabled, required, error, name, value and id go to the input, not the host", async () => {
		await render(CheckboxHost)
		const flags = box("Flags")
		expect([flags.disabled, flags.required, flags.name, flags.value, flags.id]).toEqual([true, true, "n", "v", "cb-x"])
		expect(flags.getAttribute("aria-invalid")).toBe("true")
		const root = flags.closest("label") as HTMLElement
		expect(root.dataset).toMatchObject({ disabled: "", error: "" })
		expect(document.querySelectorAll("#cb-x").length).toBe(1) // the host did not keep a second id
	})

	it("size, colour, placement, no label (aria-label), theme defaults", async () => {
		await render(CheckboxHost)
		const hidden = box("Hidden label")
		const root = hidden.closest("label") as HTMLElement
		expect(root.dataset).toMatchObject({ size: "small", color: "success", labelPlacement: "start" })
		expect(((box("Themed").closest("label") as HTMLElement).dataset)["color"]).toBe("secondary")
		expect((box("Accept terms").closest("label") as HTMLElement).hasAttribute("data-label-placement")).toBe(false)
	})
})

@Component({
	standalone: true,
	imports: [OmniCheckbox, OmniRadioGroup, OmniRadio, FormsModule, ReactiveFormsModule],
	template: `
		<omni-checkbox [ngModel]="agreed()" (ngModelChange)="agreed.set($event)">Model</omni-checkbox>
		<omni-checkbox [formControl]="control">Reactive</omni-checkbox>
		<omni-radio-group label="Via model" [ngModel]="pick()" (ngModelChange)="pick.set($event)">
			<omni-radio value="a">M-A</omni-radio><omni-radio value="b">M-B</omni-radio>
		</omni-radio-group>
		<omni-radio-group label="Via control" [formControl]="radioControl">
			<omni-radio value="x">C-X</omni-radio><omni-radio value="y">C-Y</omni-radio>
		</omni-radio-group>
	`,
})
class FormsHost {
	agreed = signal(true)
	control = new FormControl(false, { nonNullable: true })
	pick = signal("b")
	radioControl = new FormControl("x", { nonNullable: true })
}

describe("forms", () => {
	it("checkbox with ngModel and reactive forms: read, write, disable", async () => {
		const fixture = await render(FormsHost)
		await settle(fixture)
		expect(box("Model").checked).toBe(true)
		fireEvent.click(box("Model"))
		await settle(fixture)
		expect(fixture.componentInstance.agreed()).toBe(false)
		fireEvent.click(box("Reactive"))
		await settle(fixture)
		expect(fixture.componentInstance.control.value).toBe(true)
		fixture.componentInstance.control.setValue(false)
		await settle(fixture)
		expect(box("Reactive").checked).toBe(false)
		fixture.componentInstance.control.setValue(null as never)
		await settle(fixture)
		expect(box("Reactive").checked).toBe(false)
		fixture.componentInstance.control.disable()
		await settle(fixture)
		expect(box("Reactive").disabled).toBe(true)
	})

	it("radio group with ngModel and reactive forms: read, write, disable", async () => {
		const fixture = await render(FormsHost)
		await settle(fixture)
		const radio = (n: string): HTMLInputElement => screen.getByRole("radio", { name: n }) as HTMLInputElement
		expect(radio("M-B").checked).toBe(true)
		fireEvent.click(radio("M-A"))
		await settle(fixture)
		expect(fixture.componentInstance.pick()).toBe("a")
		expect([radio("M-A").checked, radio("M-B").checked]).toEqual([true, false])
		expect(radio("C-X").checked).toBe(true)
		fireEvent.click(radio("C-Y"))
		await settle(fixture)
		expect(fixture.componentInstance.radioControl.value).toBe("y")
		fixture.componentInstance.radioControl.setValue("x")
		await settle(fixture)
		expect([radio("C-X").checked, radio("C-Y").checked]).toEqual([true, false])
		fixture.componentInstance.radioControl.setValue(null as never)
		await settle(fixture)
		expect([radio("C-X").checked, radio("C-Y").checked]).toEqual([false, false])
		fixture.componentInstance.radioControl.disable()
		await settle(fixture)
		expect(radio("C-X").disabled).toBe(true)
	})
})

@Component({
	standalone: true,
	imports: [OmniRadioGroup, OmniRadio, OmniFormGroup, OmniCheckbox, OmniThemeProvider],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<omni-radio-group label="Fruit" helperText="Pick one" name="fruit" [(value)]="fruit" (valueChange)="changes.push($event)">
			<omni-radio value="a">Apple</omni-radio>
			<omni-radio value="b" disabled>Banana</omni-radio>
			<omni-radio value="c" labelPlacement="top" size="small" color="success">Cherry</omni-radio>
		</omni-radio-group>
		<omni-radio-group label="Default" defaultValue="y"><omni-radio value="x">X</omni-radio><omni-radio value="y">Y</omni-radio></omni-radio-group>
		<omni-radio-group label="Off" disabled error required row helperText="Required" id="grp"><omni-radio value="p">P</omni-radio></omni-radio-group>
		<omni-radio-group id="bare"><omni-radio value="q" aria-label="Bare" id="rq" /></omni-radio-group>
		<omni-theme-provider [theme]="theme"><omni-radio-group label="T"><omni-radio value="t">Themed radio</omni-radio></omni-radio-group></omni-theme-provider>
		<omni-form-group label="Pets" helperText="Choose any" row error id="pets"><omni-checkbox>Cat</omni-checkbox><omni-checkbox>Dog</omni-checkbox></omni-form-group>
		<omni-form-group><omni-checkbox>Alone</omni-checkbox></omni-form-group>
	`,
})
class GroupHost {
	fruit = signal("")
	changes: string[] = []
	theme = createTheme({ components: { OmniRadio: { defaultProps: { color: "secondary" } } } })
}

describe("RadioGroup and Radio", () => {
	it("is a radiogroup named by its legend, with native radios sharing one name", async () => {
		await render(GroupHost)
		const fieldset = screen.getByRole("radiogroup", { name: "Fruit" })
		expect(fieldset.tagName).toBe("FIELDSET")
		expect(fieldset.getAttribute("aria-describedby")).toBe(screen.getByText("Pick one").id)
		const radios = ["Apple", "Banana", "Cherry"].map((n) => screen.getByRole("radio", { name: n }) as HTMLInputElement)
		expect(radios.map((r) => r.value)).toEqual(["a", "b", "c"])
		expect(new Set(radios.map((r) => r.name))).toEqual(new Set(["fruit"]))
		expect(radios.map((r) => r.checked)).toEqual([false, false, false])
		expect(radios[1]?.disabled).toBe(true)
	})

	it("choosing checks exactly one and reports the value", async () => {
		const fixture = await render(GroupHost)
		const radio = (n: string): HTMLInputElement => screen.getByRole("radio", { name: n }) as HTMLInputElement
		fireEvent.click(screen.getByText("Apple"))
		await settle(fixture)
		expect([radio("Apple").checked, radio("Cherry").checked]).toEqual([true, false])
		fireEvent.click(radio("Cherry"))
		await settle(fixture)
		expect([radio("Apple").checked, radio("Cherry").checked]).toEqual([false, true])
		expect(fixture.componentInstance.changes).toEqual(["a", "c"])
		expect(fixture.componentInstance.fruit()).toBe("c")
		fixture.componentInstance.fruit.set("a")
		await settle(fixture)
		expect(radio("Apple").checked).toBe(true)
	})

	it("defaultValue; a disabled group disables every radio; error, required, row; per-radio options", async () => {
		const { container } = await render(GroupHost).then((f) => ({ container: f.nativeElement as HTMLElement }))
		expect((screen.getByRole("radio", { name: "Y" }) as HTMLInputElement).checked).toBe(true)
		const p = screen.getByRole("radio", { name: "P" }) as HTMLInputElement
		expect([p.disabled, p.required]).toEqual([true, true])
		expect(p.getAttribute("aria-invalid")).toBe("true")
		expect(p.closest("label")?.hasAttribute("data-disabled")).toBe(true)
		const off = screen.getByRole("radiogroup", { name: "Off" })
		expect(off.dataset).toMatchObject({ error: "", disabled: "" })
		expect(off.querySelector(".omni-form-group__items")?.hasAttribute("data-row")).toBe(true)
		const cherry = (screen.getByRole("radio", { name: "Cherry" }) as HTMLInputElement).closest("label") as HTMLElement
		expect(cherry.dataset).toMatchObject({ labelPlacement: "top", size: "small", color: "success" })
		expect(((screen.getByRole("radio", { name: "Themed radio" }) as HTMLInputElement).closest("label") as HTMLElement).dataset["color"]).toBe("secondary")
		expect(container.querySelectorAll("#grp").length).toBe(0) // ids do not stay on the hosts
	})

	it("a group without label or helper has no dangling references; a radio can take aria-label and id", async () => {
		await render(GroupHost)
		const bare = screen.getAllByRole("radiogroup").find((g) => !g.hasAttribute("aria-labelledby")) as HTMLElement
		expect(bare).toBeTruthy()
		const q = screen.getByRole("radio", { name: "Bare" }) as HTMLInputElement
		expect(q.id).toBe("rq")
	})
})

describe("FormGroup", () => {
	it("groups checkboxes under a legend with helper text", async () => {
		await render(GroupHost)
		const group = screen.getByRole("group", { name: "Pets" })
		expect(group.tagName).toBe("FIELDSET")
		expect(group.getAttribute("aria-describedby")).toBe(screen.getByText("Choose any").id)
		expect(group.querySelector(".omni-form-group__items")?.hasAttribute("data-row")).toBe(true)
		expect(group.dataset["error"]).toBe("")
		expect(screen.getAllByRole("checkbox").length).toBeGreaterThanOrEqual(3)
	})
})
