import { ChangeDetectionStrategy, Component, signal } from "@angular/core"
import {
	OmniAccordion,
	OmniAccordionDetails,
	OmniAccordionSummary,
	OmniAppBar,
	OmniAvatar,
	OmniBadge,
	OmniButton,
	OmniCard,
	OmniCardAction,
	OmniCardActions,
	OmniCardAvatar,
	OmniCardContent,
	OmniCardHeader,
	OmniCardMedia,
	OmniChip,
	OmniChipIcon,
	OmniDivider,
	OmniIconButton,
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
} from "@omnifront/ui-angular"

// Wave 2 ("display and surface"). The same page exists for React and Vue; ?view=display shows it.
const params = new URLSearchParams(location.search)

@Component({
	selector: "app-display",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		OmniAccordion,
		OmniAccordionDetails,
		OmniAccordionSummary,
		OmniAppBar,
		OmniAvatar,
		OmniBadge,
		OmniButton,
		OmniCard,
		OmniCardAction,
		OmniCardActions,
		OmniCardAvatar,
		OmniCardContent,
		OmniCardHeader,
		OmniCardMedia,
		OmniChip,
		OmniChipIcon,
		OmniDivider,
		OmniIconButton,
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
	],
	template: `
		<main style="max-width: 880px; margin: 0 auto; padding: 24px; display: grid; gap: 32px; color: var(--omni-palette-text-primary); font: var(--omni-typography-body1-font)">
			<h1 omni-typography variant="h4">omnifront UI: display</h1>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">AppBar and Toolbar</h2>
				<header omni-app-bar position="static">
					<div omni-toolbar>
						<button omni-icon-button color="inherit" edge="start" aria-label="Menu"><svg omni-svg-icon><path [attr.d]="menu" /></svg></button>
						<p omni-typography variant="h6" style="flex-grow: 1">Dashboard</p>
						<button omni-button color="inherit">Login</button>
					</div>
				</header>
				<div omni-app-bar position="static" color="default" [elevation]="1">
					<div omni-toolbar variant="dense">
						<p omni-typography variant="subtitle1" style="flex-grow: 1">Dense, default colour</p>
						<hr omni-divider orientation="vertical" flexItem />
						<button omni-button size="small" color="inherit">Help</button>
					</div>
				</div>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Typography</h2>
				<div>
					<p omni-typography variant="h4" gutterBottom>Heading four</p>
					<p omni-typography variant="h6">Heading six</p>
					<p omni-typography variant="subtitle1">Subtitle one</p>
					<p omni-typography variant="subtitle2">Subtitle two</p>
					<p omni-typography variant="body1">Body one: the quick brown fox jumps over the lazy dog.</p>
					<p omni-typography variant="body2">Body two: the quick brown fox jumps over the lazy dog.</p>
					<span omni-typography variant="caption">Caption text</span>
					<span omni-typography variant="overline">Overline text</span>
					<p omni-typography variant="button">Button text</p>
				</div>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
					<p omni-typography color="primary">Primary</p>
					<p omni-typography color="secondary">Secondary</p>
					<p omni-typography color="error">Error</p>
					<p omni-typography color="text.secondary">Text secondary</p>
					<p omni-typography align="center" style="width: 160px; border: 1px dashed var(--omni-palette-divider)">Centered</p>
					<p omni-typography noWrap style="width: 120px">This long text is cut with an ellipsis</p>
				</div>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Paper</h2>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
					@for (e of elevations; track e) {
						<div omni-paper [elevation]="e" style="width: 88px; height: 72px; display: grid; place-items: center">{{ e }}</div>
					}
					<div omni-paper variant="outlined" style="width: 88px; height: 72px; display: grid; place-items: center">outlined</div>
					<div omni-paper square style="width: 88px; height: 72px; display: grid; place-items: center">square</div>
				</div>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Card</h2>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
					<div omni-card style="width: 300px">
						<img omni-card-media [src]="cover" alt="" style="block-size: 110px" />
						<div omni-card-header title="Recipe review" subheader="September 14">
							<div omni-avatar omniCardAvatar>R</div>
							<button omni-icon-button omniCardAction aria-label="More"><svg omni-svg-icon><path [attr.d]="more" /></svg></button>
						</div>
						<div omni-card-content>
							<p omni-typography variant="body2" color="text.secondary">A card gathers media, a header, text and actions about one subject.</p>
						</div>
						<div omni-card-actions>
							<button omni-button size="small">Share</button>
							<button omni-button size="small">Learn more</button>
						</div>
					</div>
					<div omni-card variant="outlined" style="width: 240px">
						<div omni-card-content>
							<span omni-typography variant="overline">Outlined</span>
							<p omni-typography variant="h6">No shadow</p>
							<p omni-typography variant="body2">Borders instead of elevation.</p>
						</div>
					</div>
					<div omni-card raised style="width: 200px">
						<div omni-card-content><p omni-typography variant="body2">Raised card</p></div>
					</div>
				</div>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Divider</h2>
				<div>
					<p omni-typography>Above</p>
					<hr omni-divider />
					<p omni-typography>Between</p>
					<hr omni-divider variant="middle" />
					<p omni-typography>Middle, then text</p>
					<div omni-divider>OR</div>
					<div omni-divider textAlign="left">Left</div>
					<p omni-typography>Below</p>
				</div>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; height: 32px">
					<span>One</span><hr omni-divider orientation="vertical" flexItem /><span>Two</span><hr omni-divider orientation="vertical" flexItem /><span>Three</span>
				</div>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Avatar, Badge and SvgIcon</h2>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
					<div omni-avatar>AB</div>
					<div omni-avatar variant="rounded">R</div>
					<div omni-avatar variant="square">S</div>
					<div omni-avatar [src]="portrait" alt="Portrait"></div>
					<div omni-avatar [src]="broken" alt="Broken picture"></div>
					<div omni-avatar></div>
					<div omni-avatar style="width: 56px; height: 56px">XL</div>
				</div>
				<div style="display: flex; gap: 28px; flex-wrap: wrap; align-items: center">
					<span omni-badge [badgeContent]="4" color="primary"><svg omni-svg-icon><path [attr.d]="mail" /></svg></span>
					<span omni-badge [badgeContent]="120" color="error"><svg omni-svg-icon><path [attr.d]="mail" /></svg></span>
					<span omni-badge [badgeContent]="7" [max]="5" color="secondary"><svg omni-svg-icon><path [attr.d]="mail" /></svg></span>
					<span omni-badge variant="dot" color="error"><svg omni-svg-icon><path [attr.d]="mail" /></svg></span>
					<span omni-badge [badgeContent]="3" [anchorOrigin]="bottomLeft"><svg omni-svg-icon><path [attr.d]="mail" /></svg></span>
					<span omni-badge [badgeContent]="0"><svg omni-svg-icon><path [attr.d]="mail" /></svg></span>
					<span omni-badge [badgeContent]="0" showZero color="success"><svg omni-svg-icon><path [attr.d]="mail" /></svg></span>
					<span omni-badge [badgeContent]="2" color="primary" overlap="circular"><div omni-avatar>OK</div></span>
				</div>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
					<svg omni-svg-icon fontSize="small"><path [attr.d]="star" /></svg>
					<svg omni-svg-icon><path [attr.d]="star" /></svg>
					<svg omni-svg-icon fontSize="large"><path [attr.d]="star" /></svg>
					<svg omni-svg-icon color="primary"><path [attr.d]="star" /></svg>
					<svg omni-svg-icon color="secondary"><path [attr.d]="star" /></svg>
					<svg omni-svg-icon color="error"><path [attr.d]="star" /></svg>
					<svg omni-svg-icon color="action"><path [attr.d]="star" /></svg>
					<svg omni-svg-icon color="disabled"><path [attr.d]="star" /></svg>
				</div>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Chip</h2>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
					<div omni-chip label="Default"></div>
					<div omni-chip label="Primary" color="primary"></div>
					<div omni-chip label="Secondary" color="secondary"></div>
					<div omni-chip label="Success" color="success"></div>
					<div omni-chip label="Error" color="error"></div>
					<div omni-chip label="Outlined" variant="outlined"></div>
					<div omni-chip label="Outlined primary" variant="outlined" color="primary"></div>
				</div>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
					<div omni-chip label="Clickable" clickable (click)="last.set('clicked')"></div>
					<div omni-chip label="Deletable" color="primary" (delete)="last.set('deleted')"></div>
					<div omni-chip label="Both" variant="outlined" clickable (click)="noop()" (delete)="noop()"></div>
					<div omni-chip label="Avatar" (delete)="noop()"><div omni-avatar>A</div></div>
					<div omni-chip label="Icon" variant="outlined"><svg omni-svg-icon omniChipIcon fontSize="inherit"><path [attr.d]="star" /></svg></div>
					<div omni-chip label="Small" size="small" (delete)="noop()"></div>
					<div omni-chip label="Disabled" disabled (delete)="noop()"></div>
				</div>
				<span omni-typography variant="caption" role="status">Last chip action: {{ last() }}</span>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">List</h2>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
					<div omni-paper style="width: 300px">
						<nav aria-label="Mailboxes">
							<ul omni-list>
								<li omni-list-subheader>Folders</li>
								<li omni-list-item disablePadding>
									<button omni-list-item-button selected>
										<div omni-list-item-icon><svg omni-svg-icon><path [attr.d]="mail" /></svg></div>
										<div omni-list-item-text primary="Inbox" secondary="3 new"></div>
									</button>
								</li>
								<li omni-list-item disablePadding>
									<button omni-list-item-button>
										<div omni-list-item-icon><svg omni-svg-icon><path [attr.d]="star" /></svg></div>
										<div omni-list-item-text primary="Starred"></div>
									</button>
								</li>
								<li omni-list-item disablePadding>
									<button omni-list-item-button disabled>
										<div omni-list-item-icon><svg omni-svg-icon><path [attr.d]="trash" /></svg></div>
										<div omni-list-item-text primary="Trash (disabled)"></div>
									</button>
								</li>
								<li omni-divider></li>
								<li omni-list-item>
									<div omni-list-item-text primary="Drafts" secondary="Two unsent"></div>
									<button omni-icon-button omniListItemAction edge="end" aria-label="Delete drafts"><svg omni-svg-icon><path [attr.d]="trash" /></svg></button>
								</li>
							</ul>
						</nav>
					</div>
					<div omni-paper style="width: 240px">
						<ul omni-list dense aria-label="Dense list">
							<li omni-list-item divider><div omni-list-item-text primary="One"></div></li>
							<li omni-list-item divider><div omni-list-item-text primary="Two"></div></li>
							<li omni-list-item><div omni-list-item-text primary="Three"></div></li>
						</ul>
					</div>
				</div>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Table</h2>
				<div omni-paper>
					<div omni-table-container>
						<table omni-table aria-label="Desserts">
							<thead>
								<tr omni-table-row>
									<th omni-table-cell>Dessert</th>
									<th omni-table-cell align="right">Calories</th>
									<th omni-table-cell align="right">Fat (g)</th>
								</tr>
							</thead>
							<tbody>
								<tr omni-table-row hover selected><th omni-table-cell scope="row">Frozen yoghurt</th><td omni-table-cell align="right">159</td><td omni-table-cell align="right">6.0</td></tr>
								<tr omni-table-row hover><th omni-table-cell scope="row">Ice cream sandwich</th><td omni-table-cell align="right">237</td><td omni-table-cell align="right">9.0</td></tr>
								<tr omni-table-row hover><th omni-table-cell scope="row">Eclair</th><td omni-table-cell align="right">262</td><td omni-table-cell align="right">16.0</td></tr>
							</tbody>
							<tfoot>
								<tr omni-table-row><td omni-table-cell>Total</td><td omni-table-cell align="right">658</td><td omni-table-cell align="right">31.0</td></tr>
							</tfoot>
						</table>
					</div>
				</div>
				<table omni-table size="small" aria-label="Small table" style="width: 360px">
					<thead><tr omni-table-row><th omni-table-cell>Small</th><th omni-table-cell align="right">Value</th></tr></thead>
					<tbody><tr omni-table-row><td omni-table-cell>Row</td><td omni-table-cell align="right">1</td></tr></tbody>
				</table>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Tooltip</h2>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; padding: 48px 0">
					<button omni-button variant="contained" omniTooltip="Saves your work" tooltipPlacement="top" [tooltipOpen]="tooltipOpen">Save</button>
					<button omni-icon-button aria-label="Delete" omniTooltip="Delete this item" tooltipPlacement="right"><svg omni-svg-icon><path [attr.d]="trash" /></svg></button>
					<button omni-button variant="outlined" omniTooltip="More options below" tooltipPlacement="bottom">Hover or focus me</button>
				</div>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Accordion</h2>
				<div>
					<div omni-accordion [defaultExpanded]="accordionOpen">
						<omni-accordion-summary>What is an accordion?</omni-accordion-summary>
						<omni-accordion-details>A stack of sections you open one by one, each with a button that says whether it is open.</omni-accordion-details>
					</div>
					<div omni-accordion [expanded]="open2()" (expandedChange)="open2.set($event)">
						<omni-accordion-summary>Controlled by the page</omni-accordion-summary>
						<omni-accordion-details>The page owns this state.</omni-accordion-details>
					</div>
					<div omni-accordion disabled>
						<omni-accordion-summary>Disabled</omni-accordion-summary>
						<omni-accordion-details>Never shown.</omni-accordion-details>
					</div>
				</div>
			</section>
		</main>
	`,
})
export class DisplayComponent {
	readonly menu = "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
	readonly mail = "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
	readonly star = "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
	readonly more = "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
	readonly trash = "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
	readonly cover = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140"><defs><linearGradient id="g"><stop offset="0" stop-color="#7C3AED"/><stop offset="1" stop-color="#06B6D4"/></linearGradient></defs><rect width="400" height="140" fill="url(#g)"/></svg>')
	readonly portrait = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#F59E0B"/><circle cx="20" cy="16" r="8" fill="#fff"/></svg>')
	readonly broken = "data:image/png;base64,AAAA"
	readonly elevations = [0, 1, 3, 8, 16]
	readonly bottomLeft = { vertical: "bottom", horizontal: "left" } as const
	readonly open2 = signal(false)
	readonly last = signal("none")
	readonly tooltipOpen = params.get("open") === "tooltip" ? true : undefined
	readonly accordionOpen = params.get("open") === "accordion"
	noop(): void {}
}
