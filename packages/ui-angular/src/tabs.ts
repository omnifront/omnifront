import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	EventEmitter,
	InjectionToken,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	ViewChild,
	booleanAttribute,
	effect,
	forwardRef,
	inject,
	untracked,
} from "@angular/core"
import { createTabs, type Tabs } from "@omnifront/ui"
import { bindMachine } from "./machine"
import { OmniPart, PartBinding } from "./part"
import { OmniIds, injectDefaults } from "./theme"

/** The TabContext that a tab list, tab or panel sits in. */
export const OMNI_TABS = new InjectionToken<OmniTabContext>("OMNI_TABS")

function requireTabs(name: string): OmniTabContext {
	const ctx = inject(OMNI_TABS, { optional: true })
	if (!ctx) throw new Error(`omnifront/ui-angular: <${name}> must be inside <omni-tab-context>`)
	return ctx
}

/**
 * Holds the selected tab for a tab list and its panels (the shape of MUI Lab's TabContext).
 *
 *     <omni-tab-context [(value)]="tab">
 *       <omni-tab-list><button omni-tab value="a">A</button></omni-tab-list>
 *       <omni-tab-panel value="a">…</omni-tab-panel>
 *     </omni-tab-context>
 */
@Component({
	selector: "omni-tab-context",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [{ provide: OMNI_TABS, useExisting: forwardRef(() => OmniTabContext) }],
	host: { style: "display: contents" },
	template: "<ng-content />",
})
export class OmniTabContext implements OnInit, OnChanges {
	/** Selected tab. Without `valueChange` (or `[(value)]`) the selection is fixed: it is controlled. */
	@Input() value: string | undefined
	@Input() defaultValue: string | undefined
	@Input() orientation: "horizontal" | "vertical" | undefined
	/** Arrow keys select as well as focus. Default false (Enter or Space selects). */
	@Input({ transform: booleanAttribute }) selectionFollowsFocus = false
	@Output() valueChange = new EventEmitter<string>()

	private readonly defaults = injectDefaults()
	readonly machine: Tabs = createTabs({
		id: inject(OmniIds).create(),
		onValueChange: (value) => {
			if (!this.initializing) this.valueChange.emit(value)
		},
	})
	private readonly bound = bindMachine(this.machine, (m) => m)
	readonly state = this.bound.state
	private started = false
	private initializing = false

	ngOnInit(): void {
		// An uncontrolled set starts at `defaultValue`; the machine only reads it at creation, so select it now.
		if (this.value === undefined && this.defaultValue !== undefined && !this.started) {
			// Starting at defaultValue is not a change the user made, so it is not announced.
			this.initializing = true
			this.machine.select(this.defaultValue)
			this.initializing = false
		}
		this.started = true
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	private sync(): void {
		const p = this.defaults("OmniTabs", { orientation: this.orientation })
		this.machine.setProps({ value: this.value, orientation: p.orientation, selectionFollowsFocus: this.selectionFollowsFocus })
	}
}

/** The row (or column) of tabs, with the sliding indicator. Children are `button[omni-tab]`. */
@Component({
	selector: "omni-tab-list",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: "display: contents" },
	template: `
		<div
			class="omni-tabs"
			[attr.data-color]="color"
			[attr.data-variant]="variant"
			[attr.data-centered]="centered ? '' : null"
			[attr.data-orientation]="ctx.state().orientation"
		>
			<div #list class="omni-tabs__list" [omniPart]="parts().list" [attr.aria-label]="label ?? null">
				<ng-content />
				<span class="omni-tabs__indicator" aria-hidden="true"></span>
			</div>
		</div>
	`,
})
export class OmniTabList implements AfterViewInit {
	@Input() color: "primary" | "secondary" = "primary"
	@Input() variant: "standard" | "fullWidth" = "standard"
	@Input({ transform: booleanAttribute }) centered = false
	/** `aria-label` for the tab list. */
	@Input() label: string | undefined

	@ViewChild("list", { static: true }) private list!: ElementRef<HTMLElement>
	protected readonly ctx = requireTabs("omni-tab-list")
	protected readonly parts = bindMachine(this.ctx.machine, (m) => m.connect()).parts
	private stop: (() => void) | undefined

	constructor() {
		inject(DestroyRef).onDestroy(() => this.stop?.())
	}

	ngAfterViewInit(): void {
		this.stop = this.ctx.machine.attach(this.list.nativeElement)
	}
}

/** One tab: `<button omni-tab value="a">A</button>`. */
@Component({
	selector: "button[omni-tab]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: "omni-tab" },
	template: "{{ label }}<ng-content />",
})
export class OmniTab implements OnInit, OnChanges, OnDestroy {
	@Input({ required: true }) value!: string
	@Input() label: string | undefined
	@Input({ transform: booleanAttribute }) disabled = false

	private readonly ctx = requireTabs("button[omni-tab]")
	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly binding = new PartBinding(this.element)

	constructor() {
		// Re-apply whenever the selection changes (the effect reads the context's state signal).
		effect(() => {
			this.ctx.state()
			untracked(() => this.sync())
		})
		this.element.addEventListener("click", this.guard, true)
	}

	private readonly guard = (event: Event): void => {
		if (this.disabled) {
			event.preventDefault()
			event.stopImmediatePropagation()
		}
	}

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	private sync(): void {
		this.binding.apply(this.ctx.machine.tab(this.value, { disabled: this.disabled }))
	}

	ngOnDestroy(): void {
		this.element.removeEventListener("click", this.guard, true)
		this.binding.destroy()
	}
}

/** A panel shown while its tab is selected. */
@Component({
	selector: "omni-tab-panel",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: "omni-tab-panel" },
	template: "@if (ctx.state().value === value || keepMounted) {<ng-content />}",
})
export class OmniTabPanel implements OnInit, OnChanges, OnDestroy {
	@Input({ required: true }) value!: string
	/** Keep the content in the page (hidden) while the tab is not selected. */
	@Input({ transform: booleanAttribute }) keepMounted = false

	protected readonly ctx = requireTabs("omni-tab-panel")
	private readonly binding = new PartBinding(inject<ElementRef<HTMLElement>>(ElementRef).nativeElement)

	constructor() {
		effect(() => {
			this.ctx.state()
			untracked(() => this.sync())
		})
	}

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	private sync(): void {
		this.binding.apply(this.ctx.machine.panel(this.value))
	}

	ngOnDestroy(): void {
		this.binding.destroy()
	}
}
