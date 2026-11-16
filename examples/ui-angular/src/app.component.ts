import { AfterViewInit, ChangeDetectionStrategy, Component, signal } from "@angular/core"
import {
	OmniButton,
	OmniButtonGroup,
	OmniFab,
	OmniIconButton,
	OmniRating,
	OmniSlider,
	OmniToggleButton,
	OmniToggleButtonGroup,
	OmniCheckbox,
	OmniFormGroup,
	OmniRadio,
	OmniRadioGroup,
	OmniDialog,
	OmniDialogActions,
	OmniDialogContent,
	OmniDialogContentText,
	OmniDialogTitle,
	OmniMenu,
	OmniMenuDivider,
	OmniMenuItem,
	OmniSelect,
	OmniSwitch,
	OmniTab,
	OmniTabContext,
	OmniTabList,
	OmniTabPanel,
	OmniTextField,
	OmniThemeProvider,
	createTheme,
	type ColorSchemeMode,
} from "@omnifront/ui-angular"

// The same page exists for React and Vue (examples/ui-react, examples/ui-vue). The URL sets the
// starting state (?scheme=dark&theme=brand&open=dialog&tab=queries) so the three can be compared
// screenshot by screenshot (e2e/visual.spec.ts).
const params = new URLSearchParams(location.search)

// A theme is plain data. These are omnifront's own brand colours, as a sample theme.
const brand = createTheme({
	palette: { primary: { main: "#7C3AED" }, secondary: { main: "#06B6D4" }, success: { main: "#10B981" } },
	shape: { borderRadius: 8 },
})
const standard = createTheme()

@Component({
	selector: "app-root",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		OmniThemeProvider,
		OmniButton,
		OmniTextField,
		OmniDialog,
		OmniDialogTitle,
		OmniDialogContent,
		OmniDialogContentText,
		OmniDialogActions,
		OmniMenu,
		OmniMenuItem,
		OmniMenuDivider,
		OmniSelect,
		OmniSwitch,
		OmniButtonGroup,
		OmniFab,
		OmniIconButton,
		OmniRating,
		OmniSlider,
		OmniToggleButton,
		OmniToggleButtonGroup,
		OmniCheckbox,
		OmniFormGroup,
		OmniRadio,
		OmniRadioGroup,
		OmniTabContext,
		OmniTabList,
		OmniTab,
		OmniTabPanel,
	],
	template: `
		<omni-theme-provider [theme]="custom() ? brand : standard" [colorScheme]="mode()" global>
			<main style="max-width: 880px; margin: 0 auto; padding: 24px; display: grid; gap: 32px; color: var(--omni-palette-text-primary); font: var(--omni-typography-body1-font)">
				<header style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap">
					<h1 style="font: var(--omni-typography-h4-font); margin: 0; flex: 1">omnifront UI</h1>
					@for (m of modes; track m) {
						<button omni-button size="small" [variant]="mode() === m ? 'contained' : 'outlined'" (click)="mode.set(m)">{{ m }}</button>
					}
					<button omni-button size="small" color="secondary" [variant]="custom() ? 'contained' : 'outlined'" (click)="custom.set(!custom())">brand theme</button>
				</header>

				<section style="display: grid; gap: 16px">
					<h2 style="font: var(--omni-typography-h6-font); margin: 0">Button</h2>
					<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
						<button omni-button>Text</button>
						<button omni-button variant="outlined">Outlined</button>
						<button omni-button variant="contained">Contained</button>
						<button omni-button variant="contained" color="secondary">Secondary</button>
						<button omni-button variant="contained" color="success">Success</button>
						<button omni-button variant="contained" color="error">Error</button>
						<button omni-button variant="contained" disabled>Disabled</button>
						<button omni-button variant="contained" loading>Saving</button>
						<button omni-button variant="contained" size="small">Small</button>
						<button omni-button variant="contained" size="large">Large</button>
						<a omni-button variant="outlined" href="https://example.com">Link</a>
					</div>
				</section>

				<section style="display: grid; gap: 16px">
					<h2 style="font: var(--omni-typography-h6-font); margin: 0">TextField</h2>
					<div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start">
						<omni-text-field label="Email" helperText="We never share it" [value]="email()" (valueChange)="email.set($event)" />
						<omni-text-field label="Filled" variant="filled" defaultValue="Oslo" />
						<omni-text-field label="Standard" variant="standard" />
						<omni-text-field label="Error" error helperText="Must be a number" defaultValue="abc" />
						<omni-text-field label="Disabled" disabled defaultValue="Nope" />
						<omni-text-field label="Required" required size="small" />
						<omni-text-field label="Amount"><span omniStartAdornment>$</span><span omniEndAdornment>USD</span></omni-text-field>
						<omni-text-field label="Bio" multiline [rows]="3" />
						<omni-text-field label="Notes" multiline [minRows]="2" [maxRows]="4" />
					</div>
				</section>

				<section style="display: grid; gap: 16px">
					<h2 style="font: var(--omni-typography-h6-font); margin: 0">Icon buttons and groups</h2>
					<div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center">
						<button omni-icon-button aria-label="Delete"><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="trashPath" /></svg></button>
						<button omni-icon-button aria-label="Delete primary" color="primary"><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="trashPath" /></svg></button>
						<button omni-icon-button aria-label="Delete small" size="small" color="error"><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="trashPath" /></svg></button>
						<button omni-icon-button aria-label="Delete disabled" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="trashPath" /></svg></button>
						<button omni-fab aria-label="Add"><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="plusPath" /></svg></button>
						<button omni-fab aria-label="Add small" size="small" color="secondary"><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="plusPath" /></svg></button>
						<button omni-fab variant="extended"><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="plusPath" /></svg> Create</button>
						<omni-button-group label="Actions" variant="outlined">
							<button omni-button>One</button>
							<button omni-button>Two</button>
							<button omni-button>Three</button>
						</omni-button-group>
						<omni-button-group label="Contained actions" variant="contained" color="secondary">
							<button omni-button>Left</button>
							<button omni-button>Right</button>
						</omni-button-group>
					</div>
					<div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center">
						<omni-toggle-button-group label="Format" [value]="format()" (valueChange)="format.set($any($event))">
							<button omni-toggle-button value="bold">Bold</button>
							<button omni-toggle-button value="italic">Italic</button>
							<button omni-toggle-button value="underline" disabled>Underline</button>
						</omni-toggle-button-group>
						<omni-toggle-button-group label="Alignment" exclusive color="secondary" [value]="align()" (valueChange)="align.set($any($event))">
							<button omni-toggle-button value="left">Left</button>
							<button omni-toggle-button value="center">Center</button>
							<button omni-toggle-button value="right">Right</button>
						</omni-toggle-button-group>
					</div>
				</section>

				<section style="display: grid; gap: 16px">
					<h2 style="font: var(--omni-typography-h6-font); margin: 0">Slider and Rating</h2>
					<div style="display: grid; gap: 8px; max-width: 420px">
						<omni-slider aria-label="Volume" [value]="volume()" (valueChange)="volume.set($event)" valueLabelDisplay="on" />
						<omni-slider aria-label="Temperature" [defaultValue]="20" [min]="0" [max]="40" [step]="10" [marks]="marks" color="secondary" />
						<omni-slider aria-label="Small" size="small" [defaultValue]="60" />
						<omni-slider aria-label="Disabled" disabled [defaultValue]="40" />
						<omni-slider aria-label="Price" range [defaultValue]="[20, 60]" valueLabelDisplay="on" />
					</div>
					<div style="display: flex; gap: 24px; align-items: center">
						<omni-slider aria-label="Level" orientation="vertical" [length]="160" [defaultValue]="40" valueLabelDisplay="auto" />
						<omni-slider aria-label="Band" orientation="vertical" [length]="160" range [defaultValue]="[20, 70]" [marks]="bandMarks" color="secondary" />
						<omni-slider aria-label="Vertical disabled" orientation="vertical" [length]="160" disabled [defaultValue]="60" />
					</div>
					<div style="display: flex; gap: 32px; flex-wrap: wrap; align-items: center">
						<omni-rating aria-label="Rating" [value]="stars()" (valueChange)="stars.set($event)" />
						<omni-rating aria-label="Half stars" [precision]="0.5" [defaultValue]="2.5" size="large" />
						<omni-rating aria-label="Read only" readOnly [defaultValue]="4" />
						<omni-rating aria-label="Disabled rating" disabled [defaultValue]="2" />
					</div>
				</section>

				<section style="display: grid; gap: 16px">
					<h2 style="font: var(--omni-typography-h6-font); margin: 0">Select</h2>
					<div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start">
						<omni-select label="Fruit" [options]="fruit" [value]="fruitValue()" (valueChange)="fruitValue.set($event)" [open]="selectOpen()" (openChange)="selectOpen.set($event)" helperText="Pick one" />
						<omni-select label="Filled" variant="filled" [options]="fruit" defaultValue="c" />
						<omni-select label="Standard" variant="standard" [options]="fruit" />
						<omni-select label="Several" multiple [options]="fruit" [defaultValue]="['a', 'c']" />
						<omni-select label="Grouped" [options]="grouped" defaultValue="c" [optionTemplate]="rich" />
						<ng-template #rich let-option><strong>{{ option.label }}</strong> <small style="color: var(--omni-palette-text-secondary)">{{ option.value }}</small></ng-template>
						<omni-select label="Error" error [options]="fruit" helperText="Required" />
						<omni-select label="Disabled" disabled [options]="fruit" defaultValue="a" />
					</div>
				</section>

				<section style="display: grid; gap: 16px">
					<h2 style="font: var(--omni-typography-h6-font); margin: 0">Checkbox and Radio</h2>
					<omni-form-group label="Notifications" helperText="Choose any" row>
						<omni-checkbox>Accept terms</omni-checkbox>
						<omni-checkbox defaultChecked>Subscribe</omni-checkbox>
						<omni-checkbox indeterminate>Some</omni-checkbox>
						<omni-checkbox color="secondary" defaultChecked>Secondary</omni-checkbox>
						<omni-checkbox size="small" defaultChecked>Small</omni-checkbox>
						<omni-checkbox disabled>Disabled</omni-checkbox>
						<omni-checkbox disabled defaultChecked>Disabled on</omni-checkbox>
					</omni-form-group>
					<div style="display: flex; gap: 32px; flex-wrap: wrap; align-items: flex-start">
						<omni-radio-group label="Fruit" helperText="Pick one" defaultValue="c">
							<omni-radio value="a">Apple</omni-radio>
							<omni-radio value="b" disabled>Banana</omni-radio>
							<omni-radio value="c">Cherry</omni-radio>
						</omni-radio-group>
						<omni-radio-group label="Plan" error helperText="Required" row>
							<omni-radio value="free">Free</omni-radio>
							<omni-radio value="pro" color="secondary">Pro</omni-radio>
						</omni-radio-group>
					</div>
					<div style="display: flex; flex-wrap: wrap; align-items: center">
						<omni-switch>Wi-Fi</omni-switch>
						<omni-switch defaultChecked>Bluetooth</omni-switch>
						<omni-switch color="secondary" defaultChecked>Secondary</omni-switch>
						<omni-switch size="small" defaultChecked>Small</omni-switch>
						<omni-switch disabled>Disabled</omni-switch>
						<omni-switch disabled defaultChecked>Disabled on</omni-switch>
					</div>
				</section>

				<section style="display: grid; gap: 16px">
					<h2 style="font: var(--omni-typography-h6-font); margin: 0">Dialog and Menu</h2>
					<div style="display: flex; gap: 12px; align-items: center">
						<button omni-button variant="contained" (click)="dialog.set(true)">Open dialog</button>
						<button omni-button id="menu-button" variant="outlined" (click)="anchor.set(menuButton())">Open menu</button>
						<span>{{ picked() && 'Picked: ' + picked() }}</span>
					</div>
					<omni-dialog [open]="dialog()" (openChange)="dialog.set($event)">
						<h2 omniDialogTitle>Delete project?</h2>
						<div omniDialogContent>
							<p omniDialogContentText>This permanently removes the project and its 12 queries. It cannot be undone.</p>
						</div>
						<div omniDialogActions>
							<button omni-button (click)="dialog.set(false)">Cancel</button>
							<button omni-button color="error" (click)="dialog.set(false)">Delete</button>
						</div>
					</omni-dialog>
					<omni-menu [anchorEl]="anchor()" [open]="anchor() !== null" (closed)="anchor.set(null)">
						<li omniMenuItem (click)="picked.set('Profile')">Profile</li>
						<li omniMenuItem (click)="picked.set('Settings')">Settings</li>
						<li omniMenuItem disabled>Billing</li>
						<li omniMenuDivider></li>
						<li omniMenuItem (click)="picked.set('Logout')">Logout</li>
					</omni-menu>
				</section>

				<section style="display: grid; gap: 8px">
					<h2 style="font: var(--omni-typography-h6-font); margin: 0">Tabs</h2>
					<omni-tab-context [value]="tab()" (valueChange)="tab.set($event)">
						<omni-tab-list label="Sections">
							<button omni-tab value="overview" label="Overview"></button>
							<button omni-tab value="queries" label="Queries"></button>
							<button omni-tab value="settings" label="Settings"></button>
							<button omni-tab value="archived" label="Archived" disabled></button>
						</omni-tab-list>
						<omni-tab-panel value="overview">Overview panel</omni-tab-panel>
						<omni-tab-panel value="queries">Queries panel</omni-tab-panel>
						<omni-tab-panel value="settings">Settings panel</omni-tab-panel>
					</omni-tab-context>
				</section>
			</main>
		</omni-theme-provider>
	`,
})
export class AppComponent implements AfterViewInit {
	readonly brand = brand
	readonly standard = standard
	readonly modes = ["light", "dark", "system"] as const

	readonly mode = signal<ColorSchemeMode>((params.get("scheme") as ColorSchemeMode | null) ?? "light")
	readonly custom = signal(params.get("theme") === "brand")
	readonly dialog = signal(params.get("open") === "dialog")
	readonly anchor = signal<HTMLElement | null>(null)
	readonly tab = signal(params.get("tab") ?? "overview")
	readonly grouped = [
		{ label: "Fruit", options: [{ value: "a", label: "Apple" }, { value: "b", label: "Banana" }] },
		{ label: "Vegetables", options: [{ value: "c", label: "Carrot" }, { value: "d", label: "Daikon", disabled: true }] },
	]
	readonly bandMarks = [{ value: 0, label: "0" }, { value: 50, label: "50" }, { value: 100, label: "100" }]
	readonly fruit = [
		{ value: "a", label: "Apple" },
		{ value: "b", label: "Banana", disabled: true },
		{ value: "c", label: "Cherry" },
		{ value: "d", label: "Date" },
	]
	readonly trashPath = "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
	readonly plusPath = "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
	readonly format = signal<string[]>(["bold"])
	readonly align = signal<string | null>("left")
	readonly volume = signal(30)
	readonly stars = signal(3)
	readonly marks = [{ value: 0, label: "0°C" }, { value: 10, label: "10°C" }, { value: 20, label: "20°C" }, { value: 30, label: "30°C" }, { value: 40, label: "40°C" }]
	readonly fruitValue = signal("")
	readonly selectOpen = signal(params.get("open") === "select")
	readonly email = signal("")
	readonly picked = signal("")

	menuButton(): HTMLElement | null {
		return document.getElementById("menu-button")
	}

	ngAfterViewInit(): void {
		if (params.get("open") === "menu") this.anchor.set(this.menuButton())
	}
}
