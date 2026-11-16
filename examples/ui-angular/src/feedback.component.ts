import { ChangeDetectionStrategy, Component, signal } from "@angular/core"
import {
	OmniAccordion,
	OmniAccordionDetails,
	OmniAccordionGroup,
	OmniAccordionSummary,
	OmniAlert,
	OmniAlertAction,
	OmniAlertTitle,
	OmniAvatar,
	OmniAvatarGroup,
	OmniBackdrop,
	OmniBottomNavigation,
	OmniBottomNavigationAction,
	OmniBreadcrumbs,
	OmniButton,
	OmniCard,
	OmniCardActionArea,
	OmniCardContent,
	OmniChip,
	OmniChipDeleteIcon,
	OmniCircularProgress,
	OmniCrumb,
	OmniDrawer,
	OmniLinearProgress,
	OmniLink,
	OmniList,
	OmniListItem,
	OmniListItemAvatar,
	OmniListItemButton,
	OmniListItemText,
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
	OmniSvgIcon,
	OmniTable,
	OmniTableCell,
	OmniTablePagination,
	OmniTableRow,
	OmniTableSortLabel,
	OmniTooltip,
	OmniTypography,
} from "@omnifront/ui-angular"

// Wave 3 ("feedback and navigation") and the wave 2 leftovers. The same page exists for React and Vue; ?view=feedback shows it.
const start = new URLSearchParams(location.search).get("open")

@Component({
	selector: "app-feedback",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		OmniAccordion,
		OmniAccordionDetails,
		OmniAccordionGroup,
		OmniAccordionSummary,
		OmniAlert,
		OmniAlertAction,
		OmniAlertTitle,
		OmniAvatar,
		OmniAvatarGroup,
		OmniBackdrop,
		OmniBottomNavigation,
		OmniBottomNavigationAction,
		OmniBreadcrumbs,
		OmniButton,
		OmniCard,
		OmniCardActionArea,
		OmniCardContent,
		OmniChip,
		OmniChipDeleteIcon,
		OmniCircularProgress,
		OmniCrumb,
		OmniDrawer,
		OmniLinearProgress,
		OmniLink,
		OmniList,
		OmniListItem,
		OmniListItemAvatar,
		OmniListItemButton,
		OmniListItemText,
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
		OmniSvgIcon,
		OmniTable,
		OmniTableCell,
		OmniTablePagination,
		OmniTableRow,
		OmniTableSortLabel,
		OmniTooltip,
		OmniTypography,
	],
	template: `
		<main style="max-width: 880px; margin: 0 auto; padding: 24px; display: grid; gap: 32px; color: var(--omni-palette-text-primary); font: var(--omni-typography-body1-font)">
			<h1 omni-typography variant="h4">omnifront UI: feedback and navigation</h1>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Alert</h2>
				<div style="display: grid; gap: 12px">
					<div omni-alert severity="error"><div omni-alert-title>Upload failed</div>The file is too big.</div>
					<div omni-alert severity="warning" (close)="noop()">Your session ends soon.</div>
					<div omni-alert severity="info" variant="outlined">A new version is available.</div>
					<div omni-alert variant="filled">Saved.<button omniAlertAction omni-button color="inherit" size="small">Undo</button></div>
					<div omni-alert severity="info" [icon]="false">No icon.</div>
				</div>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Progress and Skeleton</h2>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
					<span omni-circular-progress aria-label="Loading"></span>
					<span omni-circular-progress aria-label="Quarter" [value]="25"></span>
					<span omni-circular-progress aria-label="Three quarters" [value]="75" color="secondary" [size]="56"></span>
					<span omni-circular-progress aria-label="Large" [value]="60" color="success" [size]="72" [thickness]="5"></span>
				</div>
				<div style="display: grid; gap: 12px">
					<div omni-linear-progress aria-label="Working"></div>
					<div omni-linear-progress aria-label="Done" variant="determinate" [value]="60"></div>
					<div omni-linear-progress aria-label="Buffering" variant="buffer" [value]="35" [valueBuffer]="65" color="secondary"></div>
				</div>
				<div aria-busy="true" style="display: flex; gap: 16px; align-items: center">
					<span omni-skeleton variant="circular" [width]="48" [height]="48" [animation]="false"></span>
					<div style="flex: 1">
						<span omni-skeleton [animation]="false" width="60%"></span>
						<span omni-skeleton [animation]="false"></span>
					</div>
					<span omni-skeleton variant="rounded" [width]="120" [height]="48" [animation]="false"></span>
				</div>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Snackbar, Drawer and Popover</h2>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
					<button omni-button variant="outlined" (click)="snack.set(true)">Show snackbar</button>
					<button omni-button variant="outlined" (click)="drawer.set(true)">Open drawer</button>
					<button omni-button variant="outlined" id="popover-button" (click)="anchor.set($any($event.currentTarget))">Open popover</button>
				</div>
				<omni-snackbar [open]="snack()" message="Message sent" [anchorOrigin]="{ vertical: 'bottom', horizontal: 'left' }" (closed)="snack.set(false)">
					<button omniSnackbarAction omni-button size="small" (click)="snack.set(false)">Undo</button>
				</omni-snackbar>
				<omni-drawer [open]="drawer()" label="Navigation" (closed)="drawer.set(false)">
					<ul omni-list>
						<li omni-list-item disablePadding><button omni-list-item-button (click)="drawer.set(false)"><div omni-list-item-text primary="Inbox"></div></button></li>
						<li omni-list-item disablePadding><button omni-list-item-button (click)="drawer.set(false)"><div omni-list-item-text primary="Starred"></div></button></li>
						<li omni-list-item disablePadding><button omni-list-item-button (click)="drawer.set(false)"><div omni-list-item-text primary="Sent"></div></button></li>
					</ul>
				</omni-drawer>
				<omni-popover [open]="anchor() !== null" [anchorEl]="anchor()" label="Filters" (closed)="anchor.set(null)">
					<div style="padding: 16px; display: grid; gap: 8px; max-width: 240px">
						<p omni-typography variant="subtitle2">Filters</p>
						<p omni-typography variant="body2">Show only unread messages.</p>
						<button omni-button size="small" (click)="anchor.set(null)">Apply</button>
					</div>
				</omni-popover>
				<div style="position: relative; border: 1px solid var(--omni-palette-divider); border-radius: 8px; overflow: hidden; display: flex; height: 160px">
					<omni-drawer variant="permanent" [width]="160" label="Sections">
						<ul omni-list dense>
							<li omni-list-item disablePadding><button omni-list-item-button selected><div omni-list-item-text primary="Overview"></div></button></li>
							<li omni-list-item disablePadding><button omni-list-item-button><div omni-list-item-text primary="Reports"></div></button></li>
						</ul>
					</omni-drawer>
					<div style="padding: 16px">A permanent drawer beside the content.</div>
				</div>
				<div omni-backdrop [open]="false"></div>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Breadcrumbs, Link and Pagination</h2>
				<nav omni-breadcrumbs>
					<a *omniCrumb omni-link href="/">Home</a>
					<a *omniCrumb omni-link href="/library">Library</a>
					<a *omniCrumb omni-link href="/data">Data</a>
					<span *omniCrumb>Reports</span>
				</nav>
				<nav omni-breadcrumbs [maxItems]="3">
					<a *omniCrumb omni-link href="/">Home</a>
					<a *omniCrumb omni-link href="/a">Library</a>
					<a *omniCrumb omni-link href="/b">Data</a>
					<a *omniCrumb omni-link href="/c">Reports</a>
					<span *omniCrumb>2026</span>
				</nav>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
					<a omni-link href="/a">Always</a>
					<a omni-link href="/b" underline="hover" color="secondary">On hover</a>
					<a omni-link href="/c" underline="none" color="text.secondary">None</a>
				</div>
				<nav omni-pagination [count]="10" [page]="page()" showFirstButton showLastButton (pageChange)="page.set($event)"></nav>
				<nav omni-pagination [count]="8" [defaultPage]="2" variant="outlined" shape="rounded" color="primary"></nav>
				<nav omni-pagination [count]="5" size="small" color="secondary" [defaultPage]="3"></nav>
				<nav omni-pagination [count]="5" disabled></nav>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Stepper, BottomNavigation and SpeedDial</h2>
				<ol omni-stepper aria-label="Checkout" [activeStep]="1">
					<li omni-step label="Cart"></li>
					<li omni-step label="Address" optional="Optional"></li>
					<li omni-step label="Payment"></li>
					<li omni-step label="Done"></li>
				</ol>
				<ol omni-stepper aria-label="Shipping" [activeStep]="2" alternativeLabel>
					<li omni-step label="Packed"></li>
					<li omni-step label="Sent"></li>
					<li omni-step label="Delivery failed" error></li>
					<li omni-step label="Delivered"></li>
				</ol>
				<ol omni-stepper aria-label="Build steps" orientation="vertical" [activeStep]="1">
					<li omni-step label="Plan">Decide what to build.</li>
					<li omni-step label="Build">Write it in one place, ship it to three frameworks.</li>
					<li omni-step label="Ship">Release.</li>
				</ol>
				<div style="position: relative; border: 1px solid var(--omni-palette-divider); border-radius: 8px; overflow: hidden">
					<nav omni-bottom-navigation aria-label="Main" [value]="tab()" (valueChange)="tab.set($event)">
						<button omni-bottom-navigation-action value="recents" label="Recents"><svg omni-svg-icon omniNavIcon><path [attr.d]="path.bolt" /></svg></button>
						<button omni-bottom-navigation-action value="favorites" label="Favorites"><svg omni-svg-icon omniNavIcon><path [attr.d]="path.star" /></svg></button>
						<button omni-bottom-navigation-action value="nearby" label="Nearby"><svg omni-svg-icon omniNavIcon><path [attr.d]="path.pin" /></svg></button>
					</nav>
				</div>
				<div style="position: relative; border: 1px solid var(--omni-palette-divider); border-radius: 8px; height: 260px; display: flex; justify-content: flex-end; align-items: flex-end; padding: 16px; overflow: visible">
					<omni-speed-dial ariaLabel="Actions" [open]="speedDialOpen">
						<omni-speed-dial-action tooltipTitle="Copy"><svg omni-svg-icon><path [attr.d]="path.copy" /></svg></omni-speed-dial-action>
						<omni-speed-dial-action tooltipTitle="Save"><svg omni-svg-icon><path [attr.d]="path.save" /></svg></omni-speed-dial-action>
						<omni-speed-dial-action tooltipTitle="Print"><svg omni-svg-icon><path [attr.d]="path.print" /></svg></omni-speed-dial-action>
					</omni-speed-dial>
				</div>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Wave 2 additions</h2>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
					<div omni-card style="width: 220px">
						<button omni-card-action-area>
							<div omni-card-content>
								<p omni-typography variant="subtitle1">Action card</p>
								<p omni-typography variant="body2" color="text.secondary">The whole card is one button.</p>
							</div>
						</button>
					</div>
					<div omni-avatar-group [max]="4">
						<div omni-avatar>A</div><div omni-avatar>B</div><div omni-avatar>C</div><div omni-avatar>D</div><div omni-avatar>E</div><div omni-avatar>F</div>
					</div>
					<div omni-avatar-group [max]="3" [total]="12" spacing="small">
						<div omni-avatar>A</div><div omni-avatar>B</div>
					</div>
				</div>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
					@for (c of chips(); track c) {
						<div omni-chip [label]="c" variant="outlined" (delete)="removeChip(c)"><svg omni-svg-icon omniChipDeleteIcon><path [attr.d]="path.bolt" /></svg></div>
					}
					<button omni-button variant="outlined" omniTooltip="With an arrow" tooltipArrow tooltipPlacement="top" [tooltipOpen]="tooltipOpen">Hover me</button>
				</div>
				<ul omni-list>
					<li omni-list-item alignItems="flex-start" divider>
						<div omni-list-item-avatar><div omni-avatar>R</div></div>
						<div omni-list-item-text primary="Brunch this weekend?" secondary="Ali Connors: I will be in your neighborhood doing errands this weekend. Do you want to grab brunch?"></div>
					</li>
					<li omni-list-item disablePadding>
						<button omni-list-item-button alignItems="flex-start">
							<div omni-list-item-avatar><div omni-avatar>S</div></div>
							<div omni-list-item-text primary="Summer BBQ" secondary="To Scott, Alex, Jennifer: Wish I could come, but I am out of town this weekend."></div>
						</button>
					</li>
				</ul>
				<div omni-accordion-group defaultValue="a">
					<div omni-accordion value="a"><omni-accordion-summary>Only one open</omni-accordion-summary><omni-accordion-details>Opening another closes this one.</omni-accordion-details></div>
					<div omni-accordion value="b"><omni-accordion-summary>Second panel</omni-accordion-summary><omni-accordion-details>Second panel body.</omni-accordion-details></div>
					<div omni-accordion value="c"><omni-accordion-summary>Third panel</omni-accordion-summary><omni-accordion-details>Third panel body.</omni-accordion-details></div>
				</div>
				<table omni-table aria-label="Sortable">
					<thead>
						<tr omni-table-row>
							<th omni-table-cell [sortDirection]="by() === 'name' ? dir() : false"><button omni-table-sort-label [active]="by() === 'name'" [direction]="by() === 'name' ? dir() : 'asc'" (click)="sortBy('name')">Dessert</button></th>
							<th omni-table-cell align="right" [sortDirection]="by() === 'calories' ? dir() : false"><button omni-table-sort-label [active]="by() === 'calories'" [direction]="by() === 'calories' ? dir() : 'asc'" (click)="sortBy('calories')">Calories</button></th>
						</tr>
					</thead>
					<tbody>
						<tr omni-table-row><td omni-table-cell>Cupcake</td><td omni-table-cell align="right">305</td></tr>
						<tr omni-table-row><td omni-table-cell>Donut</td><td omni-table-cell align="right">452</td></tr>
					</tbody>
					<tfoot>
						<tr omni-table-row>
							<td omni-table-pagination [count]="23" [page]="tp()" [rowsPerPage]="rows()" [rowsPerPageOptions]="[5, 10, 25]" [colSpan]="2" (pageChange)="tp.set($event)" (rowsPerPageChange)="rows.set($event); tp.set(0)"></td>
						</tr>
					</tfoot>
				</table>
			</section>
		</main>
	`,
})
export class FeedbackComponent {
	readonly path = {
		star: "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
		pin: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z",
		copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
		save: "M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z",
		print: "M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z",
		bolt: "M7 2v11h3v9l7-12h-4l4-8z",
	}
	readonly snack = signal(start === "snackbar")
	readonly drawer = signal(start === "drawer")
	readonly anchor = signal<HTMLElement | null>(null)
	readonly page = signal(4)
	readonly tab = signal<string | number>("recents")
	readonly by = signal<"name" | "calories">("name")
	readonly dir = signal<"asc" | "desc">("asc")
	readonly tp = signal(0)
	readonly rows = signal(5)
	readonly chips = signal(["React", "Vue", "Angular"])
	readonly speedDialOpen = start === "speeddial" ? true : undefined
	readonly tooltipOpen = start === "tooltip-arrow" ? true : undefined

	constructor() {
		if (start === "popover") queueMicrotask(() => this.anchor.set(document.getElementById("popover-button")))
	}

	noop(): void {}

	removeChip(chip: string): void {
		this.chips.set(this.chips().filter((c) => c !== chip))
	}

	sortBy(column: "name" | "calories"): void {
		if (this.by() === column) this.dir.set(this.dir() === "asc" ? "desc" : "asc")
		else {
			this.by.set(column)
			this.dir.set("asc")
		}
	}
}
