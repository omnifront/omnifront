import { ChangeDetectionStrategy, Component, signal, type Type } from "@angular/core"
import { TestBed, type ComponentFixture } from "@angular/core/testing"
import { defineUiConformanceSuite, type UiHarness } from "@omnifront/conformance"
import {
	OmniAccordion,
	OmniAccordionDetails,
	OmniAccordionSummary,
	OmniAppBar,
	OmniAvatar,
	OmniBadge,
	OmniCard,
	OmniCardActions,
	OmniCardAvatar,
	OmniCardContent,
	OmniCardHeader,
	OmniChip,
	OmniDivider,
	OmniList,
	OmniListItem,
	OmniListItemAction,
	OmniListItemButton,
	OmniListItemIcon,
	OmniListItemText,
	OmniListSubheader,
	OmniPaper,
	OmniSvgIcon,
	OmniTable,
	OmniTableCell,
	OmniTableContainer,
	OmniTableRow,
	OmniToolbar,
	OmniTooltip,
	OmniTypography,
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
	imports: [OmniSlider],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<omni-slider aria-label="Price" range [min]="0" [max]="100" [step]="10" [value]="value()" valueLabelDisplay="on" [orientation]="p().vertical ? 'vertical' : 'horizontal'" [disabled]="!!p().disabled" (valueChange)="log('change:' + $event); value.set($any($event))" />`,
})
class RangeSliderView {
	value = signal<[number, number]>([20, 80])
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
	imports: [OmniSelect],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<omni-select label="Food" [options]="food" [value]="value()" [optionTemplate]="rich" (valueChange)="pick($event)" (closed)="log('close:' + $event.reason)" />
		<ng-template #rich let-option><span data-rich>{{ option.label }}</span><small>{{ option.value }}</small></ng-template>
	`,
})
class SelectGroupsView {
	food = [
		{ label: "Fruit", options: [{ value: "a", label: "Apple" }, { value: "b", label: "Banana", disabled: true }] },
		{ label: "Vegetables", options: [{ value: "c", label: "Carrot" }, { value: "d", label: "Daikon" }] },
	]
	value = signal("")
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
	pick(v: string | string[]): void {
		this.log("change:" + v)
		this.value.set(v as string)
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


@Component({
	standalone: true,
	imports: [OmniAppBar, OmniToolbar, OmniTypography, OmniPaper, OmniCard, OmniCardHeader, OmniCardAvatar, OmniCardContent, OmniCardActions, OmniAvatar, OmniDivider],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<header omni-app-bar position="static"><div omni-toolbar><h1 omni-typography variant="h6">Dashboard</h1></div></header>
		<p omni-typography variant="body1">Plain text</p>
		<div omni-paper [elevation]="3">Paper text</div>
		<div omni-card [raised]="!!p().raised">
			<div omni-card-header title="Card title" subheader="Card subheader"><div omni-avatar omniCardAvatar>A</div></div>
			<div omni-card-content>Card body</div>
			<div omni-card-actions><button (click)="log('click:share')">Share</button></div>
		</div>
		<hr omni-divider />
		<div omni-divider>Or</div>
	`,
})
class SurfacesView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniAvatar, OmniBadge, OmniSvgIcon],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div omni-avatar>AB</div>
		<div omni-avatar variant="rounded" src="/missing.png" alt="Ada"></div>
		<div omni-avatar></div>
		<span omni-badge [badgeContent]="count()"><svg omni-svg-icon titleAccess="Mail"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" /></svg></span>
		<span omni-badge variant="dot"><svg omni-svg-icon><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" /></svg></span>
		<span omni-badge [badgeContent]="7" [max]="5"><svg omni-svg-icon><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" /></svg></span>
	`,
})
class BadgesView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
	count = () => (this.p()["count"] as number | undefined) ?? 4
}

@Component({
	standalone: true,
	imports: [OmniList, OmniListSubheader, OmniListItem, OmniListItemButton, OmniListItemIcon, OmniListItemText, OmniListItemAction, OmniDivider, OmniSvgIcon],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<nav aria-label="Mailboxes">
			<ul omni-list [dense]="!!p().dense">
				<li omni-list-subheader>Folders</li>
				<li omni-list-item disablePadding>
					<button omni-list-item-button selected (click)="log('click:inbox')">
						<div omni-list-item-icon><svg omni-svg-icon><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" /></svg></div>
						<div omni-list-item-text primary="Inbox" secondary="3 new"></div>
					</button>
					<button omni-list-item-button disabled (click)="log('click:trash')">Trash</button>
				</li>
				<li omni-list-item divider>
					<div omni-list-item-text primary="Drafts"></div>
					<button aria-label="Delete drafts" omniListItemAction (click)="log('click:delete')">x</button>
				</li>
				<li omni-divider></li>
			</ul>
		</nav>
	`,
})
class ListView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniTable, OmniTableContainer, OmniTableRow, OmniTableCell],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div omni-table-container>
			<table omni-table aria-label="Desserts" [size]="$any(p().size)">
				<thead><tr omni-table-row><th omni-table-cell>Dessert</th><th omni-table-cell align="right">Calories</th></tr></thead>
				<tbody>
					<tr omni-table-row hover selected><th omni-table-cell scope="row">Frozen yoghurt</th><td omni-table-cell align="right">159</td></tr>
					<tr omni-table-row><td omni-table-cell>Ice cream</td><td omni-table-cell align="right">237</td></tr>
				</tbody>
				<tfoot><tr omni-table-row><td omni-table-cell>Total</td><td omni-table-cell align="right">396</td></tr></tfoot>
			</table>
		</div>
	`,
})
class TableView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniChip],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div omni-chip label="Static"></div>
		<div omni-chip label="Clickable" [clickable]="true" [disabled]="!!p().disabled" (click)="log('click:clickable')"></div>
		<div omni-chip label="Deletable" [disabled]="!!p().disabled" (delete)="log('delete:deletable')"></div>
		<div omni-chip label="Outlined" variant="outlined" color="primary" size="small"></div>
	`,
})
class ChipsView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniAccordion, OmniAccordionSummary, OmniAccordionDetails],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div>
			<div omni-accordion (expandedChange)="log('first:' + $event)">
				<omni-accordion-summary>First question</omni-accordion-summary>
				<omni-accordion-details>First answer</omni-accordion-details>
			</div>
			<div omni-accordion [expanded]="second()" [disabled]="!!p().disabled" (expandedChange)="log('second:' + $event); second.set($event)">
				<omni-accordion-summary>Second question</omni-accordion-summary>
				<omni-accordion-details>Second answer</omni-accordion-details>
			</div>
		</div>
	`,
})
class AccordionsView {
	second = signal(false)
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniTooltip],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<button [omniTooltip]="title()" tooltipPlacement="top" [tooltipEnterDelay]="0" [tooltipLeaveDelay]="50" (tooltipOpened)="log('open')" (tooltipClosed)="log('close')">Save</button>`,
})
class TooltipView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
	title = () => (this.p()["title"] as string | undefined) ?? "Saves your work"
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
	selectGroups: (_props, log) => mountView(SelectGroupsView, {}, log),
	iconButtons: (props, log) => mountView(IconButtonsView, props, log),
	buttonGroup: (props, log) => mountView(ButtonGroupView, props, log),
	toggleGroup: (props, log) => mountView(ToggleGroupView, props, log),
	slider: (props, log) => mountView(SliderView, props, log),
	rangeSlider: (props, log) => mountView(RangeSliderView, props, log),
	rating: (props, log) => mountView(RatingView, props, log),
	surfaces: (props, log) => mountView(SurfacesView, props, log),
	badges: (props, log) => mountView(BadgesView, props, log),
	list: (props, log) => mountView(ListView, props, log),
	table: (props, log) => mountView(TableView, props, log),
	chips: (props, log) => mountView(ChipsView, props, log),
	accordions: (props, log) => mountView(AccordionsView, props, log),
	tooltip: (props, log) => mountView(TooltipView, props, log),
	tabs: (props, log) => mountView(TabsView, props, log),
	settle: async () => {
		for (const fixture of live) await settle(fixture)
		await new Promise((r) => setTimeout(r, 0))
	},
}

defineUiConformanceSuite("angular", harness)
