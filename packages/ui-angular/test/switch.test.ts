import { ChangeDetectionStrategy, Component, signal } from "@angular/core"
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms"
import { TestBed } from "@angular/core/testing"
import { fireEvent, screen } from "@testing-library/dom"
import { afterEach, describe, expect, it } from "vitest"
import { OmniSwitch, OmniThemeProvider, createTheme } from "../src"
import { render, settle } from "./helpers"

afterEach(() => {
	TestBed.resetTestingModule()
	document.body.innerHTML = ""
})

const sw = (name: string): HTMLInputElement => screen.getByRole("switch", { name }) as HTMLInputElement

@Component({
	standalone: true,
	imports: [OmniSwitch, OmniThemeProvider, FormsModule, ReactiveFormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<omni-switch [(checked)]="wifi">Wi-Fi</omni-switch>
		<omni-switch defaultChecked (checkedChange)="changes.push($event)">Default on</omni-switch>
		<omni-switch disabled required error name="n" value="v" id="sw-x">Flags</omni-switch>
		<omni-switch size="small" labelPlacement="start" aria-label="Hidden" />
		<omni-theme-provider [theme]="theme"><omni-switch>Themed</omni-switch></omni-theme-provider>
		<omni-switch [ngModel]="model()" (ngModelChange)="model.set($event)">Model</omni-switch>
		<omni-switch [formControl]="control">Reactive</omni-switch>
	`,
})
class Host {
	wifi = signal(false)
	changes: boolean[] = []
	model = signal(true)
	control = new FormControl(false, { nonNullable: true })
	theme = createTheme({ components: { OmniSwitch: { defaultProps: { color: "secondary" } } } })
}

describe("Switch", () => {
	it("is a native checkbox with role=switch, named by its label, in a clickable label; two-way binding", async () => {
		const fixture = await render(Host)
		const wifi = sw("Wi-Fi")
		expect([wifi.type, wifi.checked]).toEqual(["checkbox", false])
		expect(wifi.closest("label")?.className).toBe("omni-switch")
		fireEvent.click(screen.getByText("Wi-Fi"))
		await settle(fixture)
		expect(fixture.componentInstance.wifi()).toBe(true)
		fixture.componentInstance.wifi.set(false)
		await settle(fixture)
		expect(wifi.checked).toBe(false)
	})

	it("defaultChecked, flags, no label (aria-label), placement, theme defaults", async () => {
		const fixture = await render(Host)
		expect(sw("Default on").checked).toBe(true)
		fireEvent.click(sw("Default on"))
		await settle(fixture)
		expect(fixture.componentInstance.changes).toEqual([false])
		const flags = sw("Flags")
		expect([flags.disabled, flags.required, flags.name, flags.value, flags.id]).toEqual([true, true, "n", "v", "sw-x"])
		expect(flags.getAttribute("aria-invalid")).toBe("true")
		expect(document.querySelectorAll("#sw-x").length).toBe(1)
		expect((sw("Hidden").closest("label") as HTMLElement).dataset).toMatchObject({ size: "small", labelPlacement: "start" })
		expect(((sw("Themed").closest("label") as HTMLElement).dataset)["color"]).toBe("secondary")
	})

	it("ngModel and reactive forms: read, write, disable", async () => {
		const fixture = await render(Host)
		await settle(fixture)
		expect(sw("Model").checked).toBe(true)
		fireEvent.click(sw("Model"))
		await settle(fixture)
		expect(fixture.componentInstance.model()).toBe(false)
		fireEvent.click(sw("Reactive"))
		await settle(fixture)
		expect(fixture.componentInstance.control.value).toBe(true)
		fixture.componentInstance.control.setValue(false)
		await settle(fixture)
		expect(sw("Reactive").checked).toBe(false)
		fixture.componentInstance.control.setValue(null as never)
		await settle(fixture)
		expect(sw("Reactive").checked).toBe(false)
		fixture.componentInstance.control.disable()
		await settle(fixture)
		expect(sw("Reactive").disabled).toBe(true)
	})
})
