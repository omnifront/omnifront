import {
	ChangeDetectionStrategy,
	Component,
	ContentChild,
	Directive,
	EventEmitter,
	InjectionToken,
	Input,
	OnChanges,
	OnInit,
	Output,
	booleanAttribute,
	computed,
	effect,
	forwardRef,
	inject,
	signal,
	untracked,
} from "@angular/core"
import { ICON_PATHS, bottomNavigationActionPart, createSpeedDial, displayPart, mergeParts, type CloseReason, type Part, type SpeedDial } from "@omnifront/ui"
import { OmniFab } from "./button-group"
import { PartHost } from "./display"
import { bindMachine } from "./machine"
import { OmniPart } from "./part"
import { OmniIds, injectDefaults } from "./theme"

// ---- BottomNavigation ----

/** The BottomNavigation an action sits in. */
export const OMNI_BOTTOM_NAVIGATION = new InjectionToken<OmniBottomNavigation>("OMNI_BOTTOM_NAVIGATION")

/**
 * A bar of 3 to 5 top-level destinations at the bottom of a phone screen:
 * `<nav omni-bottom-navigation aria-label="Main" [(value)]="tab"><button omni-bottom-navigation-action value="home" label="Home">…</button></nav>`.
 * Controlled: update `value` in `(valueChange)` (or use `[(value)]`).
 */
@Component({
	selector: "nav[omni-bottom-navigation]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [{ provide: OMNI_BOTTOM_NAVIGATION, useExisting: forwardRef(() => OmniBottomNavigation) }],
	template: "<ng-content />",
})
export class OmniBottomNavigation extends PartHost implements OnChanges {
	@Input() value: string | number | undefined
	/** Show every label, not only the current one's. */
	@Input({ transform: booleanAttribute }) showLabels = false
	@Output() valueChange = new EventEmitter<string | number>()
	/** Bumped on every input change, so the actions (which read it) update. */
	readonly version = signal(0)

	ngOnChanges(): void {
		this.version.update((v) => v + 1)
		this.apply()
	}

	select(value: string | number): void {
		this.valueChange.emit(value)
	}

	protected part(): Part {
		return displayPart("omni-bottom-navigation", { showLabels: this.showLabels || undefined })
	}
}

/** Marks the icon of an action: `<svg omniNavIcon …/>`. */
@Directive({ selector: "[omniNavIcon]", standalone: true })
export class OmniNavIcon {}

/** One destination of a BottomNavigation: `<button omni-bottom-navigation-action value="home" label="Home"><svg omniNavIcon …/></button>`. */
@Component({
	selector: "button[omni-bottom-navigation-action]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { "(click)": "onClick()" },
	template: `<ng-content select="[omniNavIcon]" /><span class="omni-bottom-navigation__label">{{ label }}<ng-content /></span>`,
})
export class OmniBottomNavigationAction extends PartHost implements OnChanges {
	@Input() value: string | number | undefined
	@Input() label: string | undefined
	@Input({ transform: booleanAttribute }) disabled = false
	private readonly nav = inject(OMNI_BOTTOM_NAVIGATION, { optional: true })

	constructor() {
		super()
		effect(() => {
			this.nav?.version()
			untracked(() => this.apply())
		})
	}

	ngOnChanges(): void {
		this.apply()
	}

	protected onClick(): void {
		if (this.value !== undefined && !this.disabled) this.nav?.select(this.value)
	}

	protected part(): Part {
		const selected = this.value !== undefined && this.value === this.nav?.value
		return bottomNavigationActionPart({ selected: selected || undefined, showLabel: this.nav?.showLabels || undefined, disabled: this.disabled || undefined })
	}
}

// ---- SpeedDial ----

export interface SpeedDialCloseEvent {
	reason: CloseReason
	event: Event | undefined
}

/** The SpeedDial an action sits in. */
export const OMNI_SPEED_DIAL = new InjectionToken<OmniSpeedDial>("OMNI_SPEED_DIAL")

/** Replaces the plus of a SpeedDial's button: `<svg omniSpeedDialIcon …/>`. */
@Directive({ selector: "[omniSpeedDialIcon]", standalone: true })
export class OmniSpeedDialIcon {}

/**
 * A floating button that fans out a few actions. Opens on click or hover; arrow keys move between
 * actions; Escape closes.
 *
 *     <omni-speed-dial ariaLabel="Actions">
 *       <omni-speed-dial-action tooltipTitle="Copy" (click)="copy()"><svg …/></omni-speed-dial-action>
 *     </omni-speed-dial>
 */
@Component({
	selector: "omni-speed-dial",
	standalone: true,
	imports: [OmniPart, OmniFab],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [{ provide: OMNI_SPEED_DIAL, useExisting: forwardRef(() => OmniSpeedDial) }],
	host: { style: "display: contents" },
	template: `
		<div class="omni-speed-dial" [omniPart]="root()">
			<button omni-fab class="omni-speed-dial__trigger" [omniPart]="parts().trigger" [attr.aria-label]="ariaLabel">
				<ng-content select="[omniSpeedDialIcon]" />
				@if (!customIcon) {<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path [attr.d]="addPath" /></svg>}
			</button>
			<div class="omni-speed-dial__actions" [omniPart]="parts().actions"><ng-content /></div>
		</div>
	`,
})
export class OmniSpeedDial implements OnInit, OnChanges {
	/** The main button's accessible name. Required: the button is only an icon. */
	@Input({ required: true }) ariaLabel = ""
	@Input() direction: "up" | "down" | "left" | "right" | undefined
	@Input() open: boolean | undefined
	@Input({ transform: booleanAttribute }) defaultOpen = false
	@Output() openChange = new EventEmitter<boolean>()
	@Output() closed = new EventEmitter<SpeedDialCloseEvent>()
	@ContentChild(OmniSpeedDialIcon) protected customIcon: OmniSpeedDialIcon | undefined

	protected readonly addPath = ICON_PATHS.add
	private readonly defaults = injectDefaults()
	private initializing = false
	readonly machine: SpeedDial = createSpeedDial({
		id: inject(OmniIds).create(),
		onOpenChange: (open, reason, event) => {
			if (this.initializing) return
			if (!open) this.closed.emit({ reason, event })
			this.openChange.emit(open)
		},
	})
	private readonly bound = bindMachine(this.machine, (m) => m.connect())
	readonly parts = this.bound.parts
	protected readonly root = computed(() => mergeParts(displayPart("omni-speed-dial"), this.bound.parts().root))

	ngOnInit(): void {
		this.sync()
		// An uncontrolled dial starts at `defaultOpen`: the machine reads it only at creation, so open it now (not announced).
		if (this.open === undefined && this.defaultOpen) {
			this.initializing = true
			this.machine.show()
			this.initializing = false
		}
	}

	ngOnChanges(): void {
		this.sync()
	}

	private sync(): void {
		const p = this.defaults("OmniSpeedDial", { direction: this.direction })
		this.machine.setProps({ open: this.open, direction: p.direction })
	}
}

/** One action of a SpeedDial: a small button named by `tooltipTitle` (its accessible name and the caption beside it). The content is its icon. */
@Component({
	selector: "omni-speed-dial-action",
	standalone: true,
	imports: [OmniPart, OmniFab],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: "display: contents" },
	template: `
		<div class="omni-speed-dial__action" role="none">
			<button omni-fab size="small" [omniPart]="dial.parts().action" [attr.aria-label]="tooltipTitle"><ng-content /></button>
			<span class="omni-speed-dial__label" aria-hidden="true">{{ tooltipTitle }}</span>
		</div>
	`,
})
export class OmniSpeedDialAction {
	@Input({ required: true }) tooltipTitle = ""
	protected readonly dial = inject(OMNI_SPEED_DIAL)
}
