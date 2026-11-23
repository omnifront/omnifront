import { ChangeDetectionStrategy, Component, signal, type Type } from "@angular/core"
import { TestBed, type ComponentFixture } from "@angular/core/testing"
import { defineUiConformanceSuite, type UiHarness } from "@omnifront/conformance"
import {
	OmniAccordionGroup,
	OmniAlert,
	OmniAlertAction,
	OmniAlertTitle,
	OmniAvatarGroup,
	OmniBackdrop,
	OmniBottomNavigation,
	OmniBottomNavigationAction,
	OmniBreadcrumbs,
	OmniCardActionArea,
	OmniChipDeleteIcon,
	OmniCircularProgress,
	OmniCrumb,
	OmniDrawer,
	OmniLinearProgress,
	OmniLink,
	OmniListItemAvatar,
	OmniNavIcon,
	OmniPagination,
	OmniPopover,
	OmniSkeleton,
	OmniSnackbar,
	OmniSnackbarAction,
	OmniSpeedDial,
	OmniSpeedDialAction,
	OmniStep,
	OmniStepper,
	OmniTablePagination,
	OmniTableSortLabel,
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
	template: `<button [omniTooltip]="title()" [tooltipArrow]="!!p().arrow" tooltipPlacement="top" [tooltipEnterDelay]="0" [tooltipLeaveDelay]="50" [tooltipEnterTouchDelay]="30" [tooltipLeaveTouchDelay]="30" (tooltipOpened)="log('open')" (tooltipClosed)="log('close')">Save</button>`,
})
class TooltipView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
	title = () => (this.p()["title"] as string | undefined) ?? "Saves your work"
}

@Component({
	standalone: true,
	imports: [OmniAlert, OmniAlertTitle, OmniAlertAction, OmniButton],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div omni-alert severity="error"><div omni-alert-title>Upload failed</div>The file is too big.</div>
		<div omni-alert>Saved</div>
		<div omni-alert severity="info" variant="filled">Heads up</div>
		<div omni-alert severity="warning" variant="outlined" [icon]="false" (close)="log('close:warning')">Careful</div>
		<div omni-alert severity="success">Done<button omniAlertAction omni-button color="inherit" size="small" (click)="log('click:undo')">Undo</button></div>
	`,
})
class AlertsView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniSnackbar, OmniSnackbarAction, OmniButton],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<button (click)="open.set(true)">Show</button>
		<omni-snackbar [open]="open()" [autoHideDuration]="$any(p().autoHideDuration)" message="Saved" (closed)="log('close:' + $event.reason); open.set(false)">
			<button omniSnackbarAction omni-button size="small" (click)="log('click:undo')">Undo</button>
		</omni-snackbar>
	`,
})
class SnackbarView {
	open = signal(false)
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniCircularProgress, OmniLinearProgress, OmniSkeleton, OmniBackdrop],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<span omni-circular-progress aria-label="Loading"></span>
		<span omni-circular-progress aria-label="Upload" [value]="value()"></span>
		<div omni-linear-progress aria-label="Progress" variant="determinate" [value]="value()"></div>
		<div omni-linear-progress aria-label="Buffering" variant="buffer" [value]="30" [valueBuffer]="60"></div>
		<div omni-linear-progress aria-label="Working"></div>
		<span omni-skeleton></span>
		<span omni-skeleton variant="circular" [width]="40"></span>
		<span omni-skeleton variant="rectangular" [width]="200" [height]="60" [animation]="false"></span>
		<div omni-backdrop [open]="open()" (click)="log('click:backdrop')"></div>
	`,
})
class ProgressView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
	value = () => (this.p()["value"] as number | undefined) ?? 40
	open = () => (this.p()["open"] as boolean | undefined) ?? true
}

@Component({
	standalone: true,
	imports: [OmniDrawer, OmniList, OmniListItem, OmniListItemButton],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<button (click)="open.set(true)">Open</button>
		<omni-drawer [variant]="$any(p().variant ?? 'temporary')" [anchor]="$any(p().anchor ?? 'start')" [open]="open()" label="Navigation" (closed)="log('close:' + $event.reason); open.set(false)">
			<ul omni-list>
				<li omni-list-item disablePadding><button omni-list-item-button>Home</button></li>
				<li omni-list-item disablePadding><button omni-list-item-button>Settings</button></li>
			</ul>
		</omni-drawer>
	`,
})
class DrawerView {
	open = signal(false)
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniPopover],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<button id="popover-button" #b (click)="anchor.set(b)">Filters</button>
		<omni-popover [anchorEl]="anchor()" [open]="anchor() !== null" label="Filter options" (closed)="log('close:' + $event.reason); anchor.set(null)">
			<p>Filter options</p>
			<button (click)="log('click:apply')">Apply</button>
		</omni-popover>
	`,
})
class PopoverView {
	anchor = signal<HTMLElement | null>(null)
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniBreadcrumbs, OmniCrumb, OmniLink],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<nav omni-breadcrumbs [maxItems]="$any(p().maxItems)">
			<a *omniCrumb omni-link href="/">Home</a>
			<a *omniCrumb omni-link href="/library">Library</a>
			<a *omniCrumb omni-link href="/data">Data</a>
			<a *omniCrumb omni-link href="/reports">Reports</a>
			<a *omniCrumb omni-link href="/2026">2026</a>
			<span *omniCrumb>Current</span>
		</nav>
		<a omni-link href="/docs" underline="hover" color="secondary">Docs</a>
	`,
})
class BreadcrumbsView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniPagination],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<nav omni-pagination label="Results" [count]="$any(p().count ?? 10)" [page]="page()" [disabled]="!!p().disabled" showFirstButton showLastButton (pageChange)="log('change:' + $event); page.set($event)"></nav>
		<nav omni-pagination label="Uncontrolled" [count]="5" [defaultPage]="3" variant="outlined" size="small" (pageChange)="log('uncontrolled:' + $event)"></nav>
	`,
})
class PaginationView {
	page = signal(1)
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniStepper, OmniStep],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<ol omni-stepper aria-label="Checkout" [activeStep]="$any(p().activeStep ?? 1)">
			<li omni-step label="Cart" (activate)="log('click:cart')"></li>
			<li omni-step label="Address" optional="Optional"></li>
			<li omni-step label="Payment"></li>
			<li omni-step label="Done"></li>
		</ol>
		<ol omni-stepper aria-label="Build steps" orientation="vertical" [activeStep]="0">
			<li omni-step label="Plan">Plan details</li>
			<li omni-step label="Build">Build details</li>
		</ol>
	`,
})
class StepperView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniBottomNavigation, OmniBottomNavigationAction, OmniNavIcon],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<nav omni-bottom-navigation aria-label="Main" [showLabels]="!!p().showLabels" [value]="value()" (valueChange)="log('change:' + $event); value.set($event)">
			<button omni-bottom-navigation-action value="recents" label="Recents"><svg omniNavIcon viewBox="0 0 24 24" aria-hidden="true"><path d="M0 0h24v24H0z" /></svg></button>
			<button omni-bottom-navigation-action value="favorites" label="Favorites"><svg omniNavIcon viewBox="0 0 24 24" aria-hidden="true"><path d="M0 0h24v24H0z" /></svg></button>
			<button omni-bottom-navigation-action value="nearby" label="Nearby" disabled><svg omniNavIcon viewBox="0 0 24 24" aria-hidden="true"><path d="M0 0h24v24H0z" /></svg></button>
		</nav>
	`,
})
class BottomNavigationView {
	value = signal<string | number>("recents")
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniSpeedDial, OmniSpeedDialAction],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<omni-speed-dial ariaLabel="Actions">
			<omni-speed-dial-action tooltipTitle="Copy" (click)="log('click:copy')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M0 0h24v24H0z" /></svg></omni-speed-dial-action>
			<omni-speed-dial-action tooltipTitle="Save" (click)="log('click:save')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M0 0h24v24H0z" /></svg></omni-speed-dial-action>
			<omni-speed-dial-action tooltipTitle="Print" (click)="log('click:print')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M0 0h24v24H0z" /></svg></omni-speed-dial-action>
		</omni-speed-dial>
	`,
})
class SpeedDialView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniTable, OmniTableRow, OmniTableCell, OmniTableSortLabel, OmniTablePagination],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<table omni-table aria-label="Desserts">
			<thead>
				<tr omni-table-row>
					<th omni-table-cell [sortDirection]="by() === 'name' ? dir() : false"><button omni-table-sort-label [active]="by() === 'name'" [direction]="by() === 'name' ? dir() : 'asc'" (click)="sortBy('name')">Name</button></th>
					<th omni-table-cell [sortDirection]="by() === 'calories' ? dir() : false"><button omni-table-sort-label [active]="by() === 'calories'" [direction]="by() === 'calories' ? dir() : 'asc'" (click)="sortBy('calories')">Calories</button></th>
				</tr>
			</thead>
			<tbody>
				<tr omni-table-row><td omni-table-cell>Cupcake</td><td omni-table-cell>305</td></tr>
				<tr omni-table-row><td omni-table-cell>Donut</td><td omni-table-cell>452</td></tr>
			</tbody>
			<tfoot>
				<tr omni-table-row>
					<td omni-table-pagination [count]="23" [page]="page()" [rowsPerPage]="rows()" [rowsPerPageOptions]="[5, 10, 25]" [colSpan]="2" (pageChange)="log('page:' + $event); page.set($event)" (rowsPerPageChange)="log('rows:' + $event); rows.set($event); page.set(0)"></td>
				</tr>
			</tfoot>
		</table>
	`,
})
class SortableTableView {
	by = signal<"name" | "calories">("name")
	dir = signal<"asc" | "desc">("asc")
	page = signal(0)
	rows = signal(10)
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
	sortBy(column: "name" | "calories"): void {
		this.log(`sort:${column}`)
		if (this.by() === column) this.dir.set(this.dir() === "asc" ? "desc" : "asc")
		else {
			this.by.set(column)
			this.dir.set("asc")
		}
	}
}

@Component({
	standalone: true,
	imports: [OmniCard, OmniCardContent, OmniCardActionArea, OmniAvatar, OmniAvatarGroup, OmniList, OmniListItem, OmniListItemButton, OmniListItemAvatar, OmniListItemText],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div omni-card><button omni-card-action-area (click)="log('click:area')"><div omni-card-content>Action card</div></button></div>
		<div omni-card><a omni-card-action-area href="/card"><div omni-card-content>Link card</div></a></div>
		<div omni-avatar-group [max]="3"><div omni-avatar>A</div><div omni-avatar>B</div><div omni-avatar>C</div><div omni-avatar>D</div><div omni-avatar>E</div></div>
		<div omni-avatar-group [max]="3" [total]="6"><div omni-avatar>A</div><div omni-avatar>B</div></div>
		<ul omni-list>
			<li omni-list-item alignItems="flex-start"><div omni-list-item-avatar><div omni-avatar>R</div></div><div omni-list-item-text primary="Brunch" secondary="Ali Connors"></div></li>
			<li omni-list-item disablePadding><button omni-list-item-button alignItems="flex-start"><div omni-list-item-avatar><div omni-avatar>S</div></div><div omni-list-item-text primary="Summer BBQ"></div></button></li>
		</ul>
	`,
})
class CardsAndListsView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniAccordionGroup, OmniAccordion, OmniAccordionSummary, OmniAccordionDetails],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div omni-accordion-group [multiple]="!!p().multiple" [defaultValue]="p().multiple ? ['a'] : 'a'" (changed)="log('change:' + fmt($event.value))">
			<div omni-accordion value="a"><omni-accordion-summary>Alpha</omni-accordion-summary><omni-accordion-details>Alpha body</omni-accordion-details></div>
			<div omni-accordion value="b"><omni-accordion-summary>Beta</omni-accordion-summary><omni-accordion-details>Beta body</omni-accordion-details></div>
			<div omni-accordion value="c"><omni-accordion-summary>Gamma</omni-accordion-summary><omni-accordion-details>Gamma body</omni-accordion-details></div>
		</div>
	`,
})
class AccordionGroupView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
	fmt = (v: string | string[] | null): string => (Array.isArray(v) ? v.join(",") : (v ?? ""))
}

@Component({
	standalone: true,
	imports: [OmniChip, OmniChipDeleteIcon],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<div omni-chip label="Custom delete" (delete)="log('delete:custom')"><svg omniChipDeleteIcon data-custom-delete viewBox="0 0 24 24"><path d="M0 0h24v24H0z" /></svg></div>`,
})
class ChipDeleteIconView {
	p = signal<Record<string, unknown>>({})
	log: Log = () => {}
}

@Component({
	standalone: true,
	imports: [OmniTooltip],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<ng-template #rich><strong data-rich>Rich</strong> content</ng-template>
		<button [omniTooltip]="rich" [tooltipEnterDelay]="0" [tooltipLeaveDelay]="0" (tooltipOpened)="log('open')" (tooltipClosed)="log('close')">Info</button>
	`,
})
class RichTooltipView {
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
	alerts: (_props, log) => mountView(AlertsView, {}, log),
	snackbar: (props, log) => mountView(SnackbarView, props, log),
	progress: (props, log) => mountView(ProgressView, props, log),
	drawer: (props, log) => mountView(DrawerView, props, log),
	popover: (_props, log) => mountView(PopoverView, {}, log),
	breadcrumbs: (props, log) => mountView(BreadcrumbsView, props, log),
	pagination: (props, log) => mountView(PaginationView, props, log),
	stepper: (props, log) => mountView(StepperView, props, log),
	bottomNavigation: (props, log) => mountView(BottomNavigationView, props, log),
	speedDial: (_props, log) => mountView(SpeedDialView, {}, log),
	sortableTable: (_props, log) => mountView(SortableTableView, {}, log),
	cardsAndLists: (_props, log) => mountView(CardsAndListsView, {}, log),
	accordionGroup: (props, log) => mountView(AccordionGroupView, props, log),
	chipDeleteIcon: (_props, log) => mountView(ChipDeleteIconView, {}, log),
	richTooltip: (_props, log) => mountView(RichTooltipView, {}, log),
	tabs: (props, log) => mountView(TabsView, props, log),
	settle: async () => {
		for (const fixture of live) await settle(fixture)
		await new Promise((r) => setTimeout(r, 0))
	},
}

defineUiConformanceSuite("angular", harness)
