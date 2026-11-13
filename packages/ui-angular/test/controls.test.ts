import { ChangeDetectionStrategy, Component, signal } from "@angular/core"
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms"
import { TestBed } from "@angular/core/testing"
import { fireEvent, screen, waitFor } from "@testing-library/dom"
import { afterEach, describe, expect, it } from "vitest"
import {
	OmniButton,
	OmniButtonGroup,
	OmniFab,
	OmniIconButton,
	OmniRating,
	OmniSelect,
	OmniSlider,
	OmniTextField,
	OmniThemeProvider,
	OmniToggleButton,
	OmniToggleButtonGroup,
	createTheme,
} from "../src"
import { render, settle } from "./helpers"

afterEach(() => {
	TestBed.resetTestingModule()
	document.body.innerHTML = ""
})

@Component({
	standalone: true,
	imports: [OmniIconButton, OmniFab, OmniButton, OmniButtonGroup, OmniThemeProvider],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<omni-theme-provider [theme]="theme">
			<button omni-icon-button aria-label="Delete" (click)="clicks.set(clicks() + 1)"><svg></svg></button>
		</omni-theme-provider>
		<button omni-icon-button aria-label="Edit" color="error" size="small" edge="start" disableRipple class="mine"><svg></svg></button>
		<button omni-icon-button aria-label="Off" disabled (click)="clicks.set(clicks() + 100)"><svg></svg></button>
		<a omni-icon-button aria-label="Docs" href="/docs" [disabled]="linkOff()"><svg></svg></a>
		<button omni-fab aria-label="Add"><svg></svg></button>
		<button omni-fab variant="extended" size="small" color="secondary">Create</button>
		<a omni-fab aria-label="Go" href="/go" disabled><svg></svg></a>
		<omni-button-group variant="outlined" color="secondary" size="small" label="Actions" orientation="vertical" fullWidth [disabled]="groupOff()">
			<button omni-button>One</button>
			<button omni-button variant="contained">Two</button>
		</omni-button-group>
		<button omni-button>Free</button>
	`,
})
class ButtonsHost {
	clicks = signal(0)
	linkOff = signal(false)
	groupOff = signal<boolean | undefined>(undefined)
	theme = createTheme({ components: { OmniIconButton: { defaultProps: { color: "secondary" } } } })
}

describe("IconButton, Fab and ButtonGroup", () => {
	it("an icon button is a round button; ripples centred; link, disabled, theme defaults", async () => {
		const fixture = await render(ButtonsHost)
		const del = screen.getByRole("button", { name: "Delete" })
		expect(del.className).toContain("omni-icon-button")
		expect(del.dataset).toMatchObject({ color: "secondary", size: "medium" })
		fireEvent.click(del)
		expect(fixture.componentInstance.clicks()).toBe(1)
		fireEvent.pointerDown(del, { button: 0, clientX: 3, clientY: 3 })
		expect(del.querySelector(".omni-ripple")).not.toBeNull()
		const edit = screen.getByRole("button", { name: "Edit" })
		expect(edit.dataset).toMatchObject({ color: "error", size: "small", edge: "start" })
		expect(edit.className).toContain("mine")
		fireEvent.pointerDown(edit, { button: 0, clientX: 3, clientY: 3 })
		expect(edit.querySelector(".omni-ripple")).toBeNull()
		const off = screen.getByRole("button", { name: "Off" }) as HTMLButtonElement
		expect(off.disabled).toBe(true)
		fireEvent.click(off)
		expect(fixture.componentInstance.clicks()).toBe(1)
		const docs = screen.getByRole("button", { name: "Docs" })
		expect(docs.tagName).toBe("A")
		fixture.componentInstance.linkOff.set(true)
		await settle(fixture)
		expect(docs.getAttribute("tabindex")).toBe("-1")
		expect(fireEvent.click(docs)).toBe(false)
	})

	it("a fab is large and primary; extended has text; a disabled link swallows the click", async () => {
		await render(ButtonsHost)
		expect(screen.getByRole("button", { name: "Add" }).dataset).toMatchObject({ variant: "circular", color: "primary", size: "large" })
		expect(screen.getByRole("button", { name: "Create" }).dataset).toMatchObject({ variant: "extended", color: "secondary", size: "small" })
		expect(fireEvent.click(screen.getByRole("button", { name: "Go" }))).toBe(false)
		fireEvent.pointerDown(screen.getByRole("button", { name: "Add" }), { button: 0, clientX: 3, clientY: 3 })
		expect(screen.getByRole("button", { name: "Add" }).querySelector(".omni-ripple")).not.toBeNull()
	})

	it("a button group hands its props to the buttons inside, their own props win; disabled follows the group", async () => {
		const fixture = await render(ButtonsHost)
		const group = screen.getByRole("group", { name: "Actions" })
		expect(group.className).toBe("omni-button-group")
		expect(group.dataset).toMatchObject({ orientation: "vertical", fullWidth: "" })
		expect(screen.getByText("One").dataset).toMatchObject({ variant: "outlined", color: "secondary", size: "small" })
		expect(screen.getByText("Two").dataset["variant"]).toBe("contained")
		expect((screen.getByText("One") as HTMLButtonElement).disabled).toBe(false)
		fixture.componentInstance.groupOff.set(true)
		await settle(fixture)
		expect((screen.getByText("One") as HTMLButtonElement).disabled).toBe(true)
		expect((screen.getByText("Free") as HTMLButtonElement).disabled).toBe(false)
		expect(screen.getByText("Free").dataset["variant"]).toBe("text")
	})
})

@Component({
	standalone: true,
	imports: [OmniToggleButtonGroup, OmniToggleButton],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<omni-toggle-button-group label="Format" size="small" color="secondary" [(value)]="formats" (valueChange)="changes.push($event)">
			<button omni-toggle-button value="bold">Bold</button>
			<button omni-toggle-button value="italic">Italic</button>
			<button omni-toggle-button value="under" disabled>Underline</button>
		</omni-toggle-button-group>
		<omni-toggle-button-group exclusive [(value)]="align" label="Align" orientation="vertical" fullWidth>
			<button omni-toggle-button value="left">Left</button>
			<button omni-toggle-button value="right">Right</button>
		</omni-toggle-button-group>
		<omni-toggle-button-group exclusive defaultValue="y" disabled label="Fixed"><button omni-toggle-button value="y">Y</button></omni-toggle-button-group>
		<button omni-toggle-button value="solo" selected color="success" size="large">Solo</button>
	`,
})
class ToggleHost {
	formats = signal<string[]>([])
	align = signal<string | null>("left")
	changes: unknown[] = []
}

describe("ToggleButtonGroup and ToggleButton", () => {
	it("several can be pressed and the group reports the list; disabled buttons stay put", async () => {
		const fixture = await render(ToggleHost)
		expect(screen.getByRole("group", { name: "Format" })).toBeTruthy()
		const bold = screen.getByRole("button", { name: "Bold" })
		expect(bold.getAttribute("aria-pressed")).toBe("false")
		fireEvent.click(bold)
		fireEvent.click(screen.getByRole("button", { name: "Italic" }))
		await settle(fixture)
		expect(bold.getAttribute("aria-pressed")).toBe("true")
		expect(fixture.componentInstance.changes).toEqual([["bold"], ["bold", "italic"]])
		expect(fixture.componentInstance.formats()).toEqual(["bold", "italic"])
		expect(bold.dataset).toMatchObject({ color: "secondary", size: "small", selected: "" })
		expect((screen.getByRole("button", { name: "Underline" }) as HTMLButtonElement).disabled).toBe(true)
	})

	it("exclusive: one at a time (a string or null); two-way follows the parent; defaultValue; disabled group", async () => {
		const fixture = await render(ToggleHost)
		expect(screen.getByText("Left").getAttribute("aria-pressed")).toBe("true")
		fireEvent.click(screen.getByText("Right"))
		await settle(fixture)
		expect(fixture.componentInstance.align()).toBe("right")
		expect([screen.getByText("Left").getAttribute("aria-pressed"), screen.getByText("Right").getAttribute("aria-pressed")]).toEqual(["false", "true"])
		fireEvent.click(screen.getByText("Right"))
		await settle(fixture)
		expect(fixture.componentInstance.align()).toBeNull()
		fixture.componentInstance.align.set("left")
		await settle(fixture)
		expect(screen.getByText("Left").getAttribute("aria-pressed")).toBe("true")
		expect(screen.getByText("Left").closest(".omni-toggle-group")?.getAttribute("data-orientation")).toBe("vertical")
		expect(screen.getByText("Y").getAttribute("aria-pressed")).toBe("true")
		expect((screen.getByText("Y") as HTMLButtonElement).disabled).toBe(true)
	})

	it("a toggle button outside a group is a plain pressed button", async () => {
		await render(ToggleHost)
		const solo = screen.getByRole("button", { name: "Solo" })
		expect(solo.getAttribute("aria-pressed")).toBe("true")
		expect(solo.dataset).toMatchObject({ color: "success", size: "large" })
	})
})

@Component({
	standalone: true,
	imports: [OmniSlider, FormsModule, ReactiveFormsModule],
	template: `
		<omni-slider aria-label="Volume" defaultValue="30" [min]="10" [max]="50" [step]="5" name="vol" />
		<omni-slider aria-label="Bound" [(value)]="bound" [step]="10" (valueChange)="changes.push($event)" />
		<omni-slider aria-labelledby="lbl" [defaultValue]="2" [min]="0" [max]="4" valueLabelDisplay="on" [valueLabelFormat]="degrees" [getAriaValueText]="words" [marks]="markList" size="small" color="secondary" disabled id="sl-x" />
		<omni-slider aria-label="Auto" [min]="0" [max]="10" [step]="5" [marks]="true" valueLabelDisplay="auto" [defaultValue]="5" />
		<omni-slider aria-label="Model" [ngModel]="model()" (ngModelChange)="model.set($event)" />
		<omni-slider aria-label="Reactive" [formControl]="control" />
	`,
})
class SliderHost {
	bound = signal(20)
	changes: number[] = []
	model = signal(40)
	control = new FormControl(60, { nonNullable: true })
	markList = [{ value: 0, label: "Cold" }, { value: 4, label: "Hot" }, { value: 2 }]
	degrees = (v: number): string => `${v}°`
	words = (v: number): string => `${v} degrees`
}

describe("Slider", () => {
	const range = (name: string): HTMLInputElement => screen.getByRole("slider", { name }) as HTMLInputElement

	it("is a native range input with min, max, step and a name from aria-label", async () => {
		await render(SliderHost)
		const v = range("Volume")
		expect([v.type, v.min, v.max, v.step, v.value, v.name]).toEqual(["range", "10", "50", "5", "30", "vol"])
		expect(document.querySelectorAll("#sl-x").length).toBe(1)
	})

	it("two-way binding reports and follows; steps apply; the thumb position is a CSS variable", async () => {
		const fixture = await render(SliderHost)
		fireEvent.input(range("Bound"), { target: { value: "47" } })
		await settle(fixture)
		expect(fixture.componentInstance.bound()).toBe(50)
		expect(fixture.componentInstance.changes).toEqual([50])
		expect(range("Bound").closest(".omni-slider")?.getAttribute("style")).toContain("--omni-slider-percent: 50")
		fixture.componentInstance.bound.set(80)
		await settle(fixture)
		expect(range("Bound").value).toBe("80")
	})

	it("value label, marks with labels, aria-valuetext, size, colour, disabled", async () => {
		await render(SliderHost)
		const root = document.querySelector("[data-marks-labels]") as HTMLElement
		expect(root.className).toBe("omni-slider")
		expect(root.dataset).toMatchObject({ size: "small", color: "secondary", label: "on", disabled: "", marksLabels: "" })
		expect(root.querySelector(".omni-slider__label")?.textContent).toBe("2°")
		const input = root.querySelector("input") as HTMLInputElement
		expect(input.getAttribute("aria-valuetext")).toBe("2 degrees")
		expect(input.getAttribute("aria-labelledby")).toBe("lbl")
		expect(input.disabled).toBe(true)
		expect(Array.from(root.querySelectorAll(".omni-slider__mark-label")).map((n) => n.textContent)).toEqual(["Cold", "Hot"])
		expect(root.querySelectorAll(".omni-slider__mark").length).toBe(3)
		const auto = range("Auto").closest(".omni-slider") as HTMLElement
		expect(auto.querySelectorAll(".omni-slider__mark").length).toBe(3)
		expect(auto.querySelector(".omni-slider__label")?.textContent).toBe("5")
		expect(range("Volume").closest(".omni-slider")?.querySelector(".omni-slider__label")).toBeNull()
	})

	it("ngModel and reactive forms: read, write, disable", async () => {
		const fixture = await render(SliderHost)
		await settle(fixture)
		expect(range("Model").value).toBe("40")
		fireEvent.input(range("Model"), { target: { value: "55" } })
		await settle(fixture)
		expect(fixture.componentInstance.model()).toBe(55)
		expect(range("Reactive").value).toBe("60")
		fireEvent.input(range("Reactive"), { target: { value: "70" } })
		expect(fixture.componentInstance.control.value).toBe(70)
		fixture.componentInstance.control.setValue(20)
		await settle(fixture)
		expect(range("Reactive").value).toBe("20")
		fixture.componentInstance.control.setValue(null as never)
		await settle(fixture)
		expect(range("Reactive").value).toBe("0")
		fixture.componentInstance.control.disable()
		await settle(fixture)
		expect(range("Reactive").disabled).toBe(true)
	})
})

@Component({
	standalone: true,
	imports: [OmniRating, FormsModule, ReactiveFormsModule],
	template: `
		<omni-rating aria-label="Rating" name="stars" [defaultValue]="3" (activeChange)="active.push($event)" />
		<omni-rating aria-label="Half" [precision]="0.5" [max]="3" [defaultValue]="2.5" size="large" color="primary" />
		<omni-rating aria-label="Bound" [(value)]="bound" />
		<omni-rating aria-label="Off" disabled [defaultValue]="1" />
		<omni-rating readOnly [defaultValue]="3.5" [precision]="0.5" />
		<omni-rating aria-label="Model" [ngModel]="model()" (ngModelChange)="model.set($event)" />
		<omni-rating aria-label="Reactive" [formControl]="control" />
	`,
})
class RatingHost {
	active: Array<number | undefined> = []
	bound = signal(2)
	model = signal(4)
	control = new FormControl(1, { nonNullable: true })
}

describe("Rating", () => {
	const group = (name: string): HTMLElement => screen.getByRole("radiogroup", { name })
	const radios = (name: string): HTMLInputElement[] => Array.from(group(name).querySelectorAll("input"))
	const fills = (name: string): string[] => Array.from(group(name).querySelectorAll(".omni-rating__star")).map((s) => (s as HTMLElement).dataset["fill"] as string)

	it("is a radiogroup of native radios: a hidden 'no rating' one and one per star", async () => {
		await render(RatingHost)
		expect(radios("Rating").map((r) => r.value)).toEqual(["0", "1", "2", "3", "4", "5"])
		expect(radios("Rating").find((r) => r.checked)?.value).toBe("3")
		expect(new Set(radios("Rating").map((r) => r.name))).toEqual(new Set(["stars"]))
		expect(radios("Rating")[3]?.getAttribute("aria-label")).toBe("3 out of 5")
	})

	it("choosing rates, choosing the same value clears; hovering previews and reports", async () => {
		const fixture = await render(RatingHost)
		fireEvent.click(radios("Bound")[4] as HTMLElement)
		await settle(fixture)
		expect(fixture.componentInstance.bound()).toBe(4)
		expect(fills("Bound")).toEqual(["100", "100", "100", "100", "0"])
		fireEvent.click(radios("Bound")[4] as HTMLElement)
		await settle(fixture)
		expect(fixture.componentInstance.bound()).toBe(0)
		fireEvent.pointerEnter(radios("Rating")[5] as HTMLElement)
		await settle(fixture)
		expect(fixture.componentInstance.active).toContain(5)
		expect(fills("Rating")[4]).toBe("100")
		fireEvent.pointerLeave(radios("Rating")[5] as HTMLElement)
		await settle(fixture)
		expect(fixture.componentInstance.active.at(-1)).toBeUndefined()
		expect(fills("Rating")[4]).toBe("0")
	})

	it("half precision, size and colour; disabled; read-only is an image with no inputs", async () => {
		await render(RatingHost)
		expect(radios("Half").map((r) => r.value)).toEqual(["0", "0.5", "1", "1.5", "2", "2.5", "3"])
		expect(fills("Half")).toEqual(["100", "100", "50"])
		expect(group("Half").dataset).toMatchObject({ size: "large", color: "primary" })
		expect(group("Off").hasAttribute("data-disabled")).toBe(true)
		expect(radios("Off").every((r) => r.disabled)).toBe(true)
		const image = screen.getByRole("img", { name: "3.5 out of 5" })
		expect(image.hasAttribute("data-readonly")).toBe(true)
		expect(image.querySelectorAll("input").length).toBe(0)
	})

	it("ngModel and reactive forms: read, write, disable", async () => {
		const fixture = await render(RatingHost)
		await settle(fixture)
		expect(radios("Model").find((r) => r.checked)?.value).toBe("4")
		fireEvent.click(radios("Model")[2] as HTMLElement)
		await settle(fixture)
		expect(fixture.componentInstance.model()).toBe(2)
		fireEvent.click(radios("Reactive")[3] as HTMLElement)
		expect(fixture.componentInstance.control.value).toBe(3)
		fixture.componentInstance.control.setValue(5)
		await settle(fixture)
		expect(radios("Reactive").find((r) => r.checked)?.value).toBe("5")
		fixture.componentInstance.control.setValue(null as never)
		await settle(fixture)
		expect(radios("Reactive").find((r) => r.checked)?.value).toBe("0")
		fixture.componentInstance.control.disable()
		await settle(fixture)
		expect(radios("Reactive").every((r) => r.disabled)).toBe(true)
	})
})

@Component({
	standalone: true,
	imports: [OmniTextField],
	template: `<omni-text-field label="Bio" multiline [minRows]="2" [maxRows]="3" [value]="text()" /><omni-text-field label="Plain" multiline [rows]="4" />`,
})
class AutosizeHost {
	text = signal("a")
}

describe("TextField autosize", () => {
	it("a multiline field with minRows or maxRows is sized from its text, and follows value changes", async () => {
		const original = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "scrollHeight")
		Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", { configurable: true, get: () => 100 })
		try {
			const fixture = await render(AutosizeHost)
			const area = screen.getByLabelText("Bio") as HTMLTextAreaElement
			expect(area.getAttribute("rows")).toBe("2")
			await waitFor(() => expect(area.style.height).not.toBe(""))
			const first = area.style.height
			fixture.componentInstance.text.set("changed")
			await settle(fixture)
			expect(area.value).toBe("changed")
			expect(area.style.height).toBe(first)
			const plain = screen.getByLabelText("Plain") as HTMLTextAreaElement
			expect(plain.getAttribute("rows")).toBe("4")
			expect(plain.style.height).toBe("")
		} finally {
			if (original) Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", original)
			else delete (HTMLTextAreaElement.prototype as unknown as Record<string, unknown>)["scrollHeight"]
		}
	})
})

const fruit = [
	{ value: "a", label: "Apple" },
	{ value: "b", label: "Banana", disabled: true },
	{ value: "c", label: "Cherry" },
	{ value: "d", label: "Date" },
]

@Component({
	standalone: true,
	imports: [OmniSelect],
	template: `
		<omni-select label="Fruit" multiple [options]="fruit" [(value)]="picked" (valueChange)="changes.push($event)" name="fruit" />
		<omni-select label="Default" multiple [options]="fruit" [defaultValue]="['c', 'd']" />
		<omni-select label="Single" [options]="fruit" defaultValue="" name="s" />
	`,
})
class MultiHost {
	fruit = fruit
	picked = signal<string[]>([])
	changes: string[][] = []
}

describe("Select multiple", () => {
	it("toggles options, shows the labels together, keeps the list open, reports the list", async () => {
		const fixture = await render(MultiHost)
		const combobox = screen.getByRole("combobox", { name: /Fruit/ })
		fireEvent.click(combobox)
		await settle(fixture)
		const list = screen.getByRole("listbox")
		expect(list.getAttribute("aria-multiselectable")).toBe("true")
		fireEvent.click(screen.getByRole("option", { name: "Cherry" }))
		await settle(fixture)
		fireEvent.click(screen.getByRole("option", { name: "Apple" }))
		await settle(fixture)
		expect(fixture.componentInstance.changes).toEqual([["c"], ["c", "a"]])
		expect(fixture.componentInstance.picked()).toEqual(["c", "a"])
		expect(combobox.textContent?.trim()).toBe("Apple, Cherry")
		expect(screen.getByRole("listbox")).toBeTruthy()
		expect(screen.getByRole("option", { name: "Apple" }).getAttribute("aria-selected")).toBe("true")
		fireEvent.click(screen.getByRole("option", { name: "Cherry" }))
		await settle(fixture)
		expect(combobox.textContent?.trim()).toBe("Apple")
		const hidden = Array.from(document.querySelectorAll('input[type="hidden"][name="fruit"]')) as HTMLInputElement[]
		expect(hidden.map((h) => h.value)).toEqual(["a"])
		fixture.componentInstance.picked.set(["d"])
		await settle(fixture)
		expect(combobox.textContent?.trim()).toBe("Date")
	})

	it("default values and a single select next to it", async () => {
		await render(MultiHost)
		expect(screen.getByRole("combobox", { name: /Default/ }).textContent?.trim()).toBe("Cherry, Date")
		expect(document.querySelector('input[type="hidden"][name="s"]')).not.toBeNull()
	})
})
