import { ChangeDetectionStrategy, Component, signal, type Type } from "@angular/core"
import { TestBed, type ComponentFixture } from "@angular/core/testing"
import { defineUiConformanceSuite, type UiHarness } from "@omnifront/conformance"
import {
	OmniButton,
	OmniDialog,
	OmniDialogActions,
	OmniDialogContent,
	OmniDialogContentText,
	OmniDialogTitle,
	OmniMenu,
	OmniButtonGroup,
	OmniCheckbox,
	OmniFab,
	OmniIconButton,
	OmniMenuItem,
	OmniRating,
	OmniSlider,
	OmniToggleButton,
	OmniToggleButtonGroup,
	OmniRadio,
	OmniRadioGroup,
	OmniSelect,
	OmniSwitch,
	OmniTab,
	OmniTabContext,
	OmniTabList,
	OmniTabPanel,
	OmniTextField,
} from "../src"
import { settle } from "./helpers"

type Log = (event: string) => void

/** Hosts read their props from this object and are told to re-render when it changes. */
@Component({
	standalone: true,
	imports: [OmniButton],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (p().href) {
			<a omni-button [href]="p().href" [disabled]="!!p().disabled" (click)="log('click')">Save</a>
		} @else {
			<button omni-button [variant]="p().variant" [color]="p().color" [loading]="!!p().loading" [disabled]="!!p().disabled" (click)="log('click')">Save</button>
		}
	`,
})
class ButtonView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniTextField],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<omni-text-field label="Email" helperText="We never share it" [error]="!!p().error" [disabled]="!!p().disabled" (valueChange)="log('change:' + $event)" />`,
})
class FieldView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniDialog, OmniDialogTitle, OmniDialogContent, OmniDialogContentText, OmniDialogActions],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<button (click)="open.set(true)">Open</button>
		<omni-dialog [open]="open()" (closed)="log('close:' + $event.reason); open.set(false)">
			<h2 omniDialogTitle>Delete project?</h2>
			<div omniDialogContent><p omniDialogContentText>This cannot be undone.</p></div>
			<div omniDialogActions><button>Cancel</button><button>Delete</button></div>
		</omni-dialog>
	`,
})
class DialogView {
	open = signal(false)
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniMenu, OmniMenuItem],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<button id="menu-button" (click)="anchor.set($any($event.currentTarget))">Menu</button>
		<omni-menu [anchorEl]="anchor()" [open]="anchor() !== null" (closed)="log('close:' + $event.reason); anchor.set(null)">
			<li omniMenuItem (click)="log('select:profile')">Profile</li>
			<li omniMenuItem disabled (click)="log('select:billing')">Billing</li>
			<li omniMenuItem (click)="log('select:logout')">Logout</li>
		</omni-menu>
	`,
})
class MenuView {
	anchor = signal<HTMLElement | null>(null)
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniCheckbox],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<omni-checkbox [checked]="checked()" [indeterminate]="!!p().indeterminate" [disabled]="!!p().disabled" [error]="!!p().error" (checkedChange)="log('change:' + $event); checked.set($event)">Accept terms</omni-checkbox>`,
})
class CheckboxView {
	checked = signal(false)
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniIconButton, OmniFab],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<button omni-icon-button aria-label="Delete" [disabled]="!!p().disabled" (click)="log('click:delete')"><svg></svg></button>
		<button omni-fab aria-label="Add" [disabled]="!!p().disabled" (click)="log('click:add')"><svg></svg></button>
		<button omni-fab variant="extended" [disabled]="!!p().disabled" (click)="log('click:create')">Create</button>
	`,
})
class IconButtonsView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniButtonGroup, OmniButton],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<omni-button-group label="Actions" variant="outlined" color="secondary" size="small" [disabled]="p().disabled ? true : undefined">
			<button omni-button (click)="log('click:one')">One</button>
			<button omni-button (click)="log('click:two')">Two</button>
		</omni-button-group>
	`,
})
class ButtonGroupView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniToggleButtonGroup, OmniToggleButton],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<omni-toggle-button-group label="Format" [exclusive]="!!p().exclusive" [value]="p().exclusive ? (value()[0] ?? null) : value()" (valueChange)="changed($event)">
			<button omni-toggle-button value="bold">Bold</button>
			<button omni-toggle-button value="italic">Italic</button>
			<button omni-toggle-button value="underline" disabled>Underline</button>
		</omni-toggle-button-group>
	`,
})
class ToggleGroupView {
	value = signal<string[]>([])
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
	changed(v: string | string[] | null): void {
		const list = v === null ? [] : typeof v === "string" ? [v] : v
		this.log('change:' + list.join(","))
		this.value.set(list)
	}
}

@Component({
	standalone: true,
	imports: [OmniSlider],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<omni-slider aria-label="Volume" [min]="0" [max]="100" [step]="10" [value]="value()" valueLabelDisplay="auto" [disabled]="!!p().disabled" (valueChange)="log('change:' + $event); value.set($event)" />`,
})
class SliderView {
	value = signal(30)
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniRating],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<omni-rating aria-label="Rating" [value]="p().readOnly ? 3 : value()" [readOnly]="!!p().readOnly" [disabled]="!!p().disabled" (valueChange)="log('change:' + $event); value.set($event)" />`,
})
class RatingView {
	value = signal(0)
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniSwitch],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<omni-switch [checked]="checked()" [disabled]="!!p().disabled" [error]="!!p().error" (checkedChange)="log('change:' + $event); checked.set($event)">Wi-Fi</omni-switch>`,
})
class SwitchView {
	checked = signal(false)
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniRadioGroup, OmniRadio],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<omni-radio-group label="Fruit" helperText="Pick one" [value]="value()" [disabled]="!!p().disabled" [error]="!!p().error" (valueChange)="log('change:' + $event); value.set($event)">
			<omni-radio value="a">Apple</omni-radio>
			<omni-radio value="b" disabled>Banana</omni-radio>
			<omni-radio value="c">Cherry</omni-radio>
		</omni-radio-group>
	`,
})
class RadioGroupView {
	value = signal("")
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniSelect],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<omni-select
			label="Fruit"
			[options]="fruit"
			[multiple]="!!p().multiple"
			[value]="value()"
			helperText="Pick one"
			[error]="!!p().error"
			[disabled]="!!p().disabled"
			(valueChange)="pick($event)"
			(closed)="log('close:' + $event.reason)"
		/>
	`,
})
class SelectView {
	fruit = [
		{ value: "a", label: "Apple" },
		{ value: "b", label: "Banana", disabled: true },
		{ value: "c", label: "Cherry" },
	]
	value = signal<string | string[]>("")
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
	pick(v: string | string[]): void {
		this.log('change:' + (Array.isArray(v) ? v.join(",") : v))
		this.value.set(v)
	}
}

@Component({
	standalone: true,
	imports: [OmniTabContext, OmniTabList, OmniTab, OmniTabPanel],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<omni-tab-context [value]="value()" [selectionFollowsFocus]="!!p().selectionFollowsFocus" (valueChange)="log('change:' + $event); value.set($event)">
			<omni-tab-list label="Sections">
				<button omni-tab value="one" label="One"></button>
				<button omni-tab value="two" label="Two" disabled></button>
				<button omni-tab value="three" label="Three"></button>
			</omni-tab-list>
			<omni-tab-panel value="one">First panel</omni-tab-panel>
			<omni-tab-panel value="two">Second panel</omni-tab-panel>
			<omni-tab-panel value="three">Third panel</omni-tab-panel>
		</omni-tab-context>
	`,
})
class TabsView {
	value = signal("one")
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

interface View {
	p: { set(v: Record<string, unknown>): void; (): Record<string, unknown> }
	log: Log
}

const live = new Set<ComponentFixture<unknown>>()

function mountView<T extends View>(component: Type<T>, props: Record<string, unknown>, log: Log) {
	const fixture = TestBed.createComponent(component)
	live.add(fixture)
	fixture.componentInstance.log = log
	fixture.componentInstance.p.set({ ...props })
	document.body.append(fixture.nativeElement as HTMLElement)
	fixture.detectChanges()
	return {
		set: async (next: Record<string, unknown>) => {
			fixture.componentInstance.p.set({ ...fixture.componentInstance.p(), ...next })
			await settle(fixture)
		},
		unmount: () => {
			live.delete(fixture)
			fixture.destroy()
		},
	}
}

const harness: UiHarness = {
	button: (props, log) => mountView(ButtonView, props, log),
	textField: (props, log) => mountView(FieldView, props, log),
	dialog: (_props, log) => mountView(DialogView, {}, log),
	menu: (_props, log) => mountView(MenuView, {}, log),
	checkbox: (props, log) => mountView(CheckboxView, props, log),
	switch: (props, log) => mountView(SwitchView, props, log),
	radioGroup: (props, log) => mountView(RadioGroupView, props, log),
	select: (props, log) => mountView(SelectView, props, log),
	iconButtons: (props, log) => mountView(IconButtonsView, props, log),
	buttonGroup: (props, log) => mountView(ButtonGroupView, props, log),
	toggleGroup: (props, log) => mountView(ToggleGroupView, props, log),
	slider: (props, log) => mountView(SliderView, props, log),
	rating: (props, log) => mountView(RatingView, props, log),
	tabs: (props, log) => mountView(TabsView, props, log),
	settle: async () => {
		for (const fixture of live) await settle(fixture)
		await new Promise((r) => setTimeout(r, 0))
	},
}

defineUiConformanceSuite("angular", harness)
