import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	InjectionToken,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	booleanAttribute,
	effect,
	forwardRef,
	inject,
	signal,
	untracked,
} from "@angular/core"
import { createToggleGroup, toggleButtonPart, type ToggleGroup } from "@omnifront/ui"
import { bindMachine } from "./machine"
import { OmniPart, PartBinding, withAttrs } from "./part"
import { OmniIds, injectDefaults } from "./theme"

/** The ToggleButtonGroup that a toggle button sits in. */
export const OMNI_TOGGLE_GROUP = new InjectionToken<OmniToggleButtonGroup>("OMNI_TOGGLE_GROUP")

type Color = "primary" | "secondary" | "success" | "info" | "warning" | "error"
const toList = (v: string | readonly string[] | null | undefined): string[] => (v === undefined || v === null ? [] : typeof v === "string" ? [v] : [...v])

/**
 * A row (or column) of toggle buttons: pick one (`exclusive`) or several. Real buttons with
 * `aria-pressed`.
 *
 *     <omni-toggle-button-group exclusive [(value)]="align" label="Alignment">
 *       <button omni-toggle-button value="left">Left</button>
 *     </omni-toggle-button-group>
 */
@Component({
	selector: "omni-toggle-button-group",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [{ provide: OMNI_TOGGLE_GROUP, useExisting: forwardRef(() => OmniToggleButtonGroup) }],
	host: { style: "display: contents", "[attr.id]": "null" },
	template: `
		<div class="omni-toggle-group" [omniPart]="groupPart()" [attr.aria-label]="label ?? null" [attr.data-full-width]="fullWidth ? '' : null"><ng-content /></div>
	`,
})
export class OmniToggleButtonGroup implements OnInit, OnChanges {
	/** Pressed value: a string (or null) when `exclusive`, a list otherwise. Use `[(value)]` for two-way binding. */
	@Input() set value(v: string | readonly string[] | null | undefined) {
		this.current.set(toList(v))
	}
	@Input() set defaultValue(v: string | readonly string[] | null | undefined) {
		if (!this.touchedValue) this.current.set(toList(v))
	}
	/** At most one pressed at a time; pressing it again unpresses it. */
	@Input({ transform: booleanAttribute }) exclusive = false
	@Input() orientation: "horizontal" | "vertical" | undefined
	@Input() size: "small" | "medium" | "large" | undefined
	@Input() color: Color | undefined
	@Input({ transform: booleanAttribute }) disabled = false
	@Input({ transform: booleanAttribute }) fullWidth = false
	/** `aria-label` of the group. */
	@Input() label: string | undefined
	@Output() valueChange = new EventEmitter<string | null | string[]>()

	private readonly current = signal<string[]>([])
	private touchedValue = false
	private readonly defaults = injectDefaults()
	private readonly fieldId = inject(OmniIds).create()
	readonly machine: ToggleGroup = createToggleGroup({
		id: this.fieldId,
		onValueChange: (next) => {
			this.touchedValue = true
			this.current.set(next)
			this.sync() // the machine is always controlled by this component: hand it the new value
			this.valueChange.emit(this.exclusive ? (next[0] ?? null) : next)
		},
	})
	private readonly bound = bindMachine(this.machine, (m) => m.connect())
	/** The state, as a signal: toggle buttons read it so they update when the pressed set changes. */
	readonly state = this.bound.state
	protected readonly groupPart = () => this.bound.parts().group

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	private sync(): void {
		const p = this.defaults("OmniToggleButtonGroup", { size: this.size, color: this.color, orientation: this.orientation })
		this.size = p.size
		this.color = p.color
		this.machine.setProps({
			id: this.fieldId,
			value: this.current(),
			exclusive: this.exclusive || undefined,
			disabled: this.disabled || undefined,
			orientation: p.orientation,
		})
	}
}

/** One toggle button: `<button omni-toggle-button value="bold">Bold</button>`. Inside a group its state comes from the group. */
@Component({
	selector: "button[omni-toggle-button]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: "<ng-content />",
})
export class OmniToggleButton implements OnInit, OnChanges, OnDestroy {
	/** What the group's value gets when this is pressed. */
	@Input() value: string | undefined
	/** Only outside a group: whether it is pressed. */
	@Input({ transform: booleanAttribute }) selected = false
	@Input({ transform: booleanAttribute }) disabled = false
	@Input() color: Color | undefined
	@Input() size: "small" | "medium" | "large" | undefined

	private readonly group = inject(OMNI_TOGGLE_GROUP, { optional: true })
	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly binding = new PartBinding(this.element)
	private readonly defaults = injectDefaults()

	constructor() {
		// Re-apply whenever the pressed set changes (the effect reads the group's state signal).
		effect(() => {
			this.group?.state()
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
		const p = this.defaults("OmniToggleButton", { color: this.color, size: this.size })
		const g = this.group
		const part = g && this.value !== undefined ? g.machine.item(this.value, { disabled: this.disabled || undefined }) : toggleButtonPart({ selected: this.selected, disabled: this.disabled || undefined })
		this.binding.apply(withAttrs(part, { "data-color": p.color ?? g?.color ?? "primary", "data-size": p.size ?? g?.size ?? "medium" }))
	}

	ngOnDestroy(): void {
		this.element.removeEventListener("click", this.guard, true)
		this.binding.destroy()
	}
}
