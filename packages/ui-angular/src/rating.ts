import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	OnInit,
	Output,
	booleanAttribute,
	computed,
	forwardRef,
	inject,
	signal,
} from "@angular/core"
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from "@angular/forms"
import { createRating } from "@omnifront/ui"
import { bindMachine } from "./machine"
import { OmniPart, withAttrs } from "./part"
import { OmniIds, injectDefaults } from "./theme"

/**
 * Star rating. Each step is a real `<input type="radio">` in one group (arrow keys, Tab and screen
 * readers are the browser's own); a read-only rating is an image with a text alternative.
 * Choosing the value that is already chosen clears it (`0`). Works with `ngModel` and reactive forms.
 */
@Component({
	selector: "omni-rating",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OmniRating), multi: true }],
	host: { style: "display: contents", "[attr.id]": "null", "[attr.name]": "null", "[attr.aria-label]": "null", "[attr.aria-labelledby]": "null" },
	template: `
		<span class="omni-rating" [omniPart]="groupPart()" [attr.data-size]="size ?? 'medium'" [attr.data-color]="color ?? null">
			@if (!state().readOnly) {
				<input class="omni-rating__clear" [omniPart]="parts().clear" (blur)="onTouched()" />
			}
			@for (star of stars(); track star.index) {
				<span class="omni-rating__star" [attr.data-fill]="star.fill">
					<span class="omni-rating__icon" aria-hidden="true"></span>
					<span class="omni-rating__fill-box" aria-hidden="true"><span class="omni-rating__fill"></span></span>
					@if (!state().readOnly) {
						@for (radio of star.radios; track radio.value) {
							<input class="omni-rating__radio" [omniPart]="radio.part" (blur)="onTouched()" />
						}
					}
				</span>
			}
		</span>
	`,
})
export class OmniRating implements ControlValueAccessor, OnInit, OnChanges {
	/** The rating. `0` means none. Use `[(value)]` for two-way binding. */
	@Input() set value(v: number | null | undefined) {
		this.current.set(v === null || v === undefined ? 0 : Number(v))
	}
	/** The rating an uncontrolled rating starts with. */
	@Input() set defaultValue(v: number | undefined) {
		if (v !== undefined && !this.touchedValue) this.current.set(v)
	}
	/** Number of stars. Default 5. */
	@Input() max: number | undefined
	/** `1` (whole stars, default), `0.5` or `0.25`. */
	@Input() precision: 1 | 0.5 | 0.25 | undefined
	/** Show the value without letting the user change it. It is an image with a text alternative. */
	@Input({ transform: booleanAttribute }) readOnly = false
	@Input({ transform: booleanAttribute }) disabled = false
	@Input() size: "small" | "medium" | "large" | undefined
	@Input() color: "primary" | "secondary" | "error" | undefined
	@Input() name: string | undefined
	@Input() id: string | undefined
	@Input("aria-label") ariaLabel: string | undefined
	@Input("aria-labelledby") ariaLabelledby: string | undefined
	@Output() valueChange = new EventEmitter<number>()
	/** The value under the pointer, or `undefined` when it leaves. */
	@Output() activeChange = new EventEmitter<number | undefined>()

	private readonly current = signal(0)
	private touchedValue = false
	private onChange: (value: number) => void = () => {}
	onTouched: () => void = () => {}

	private readonly defaults = injectDefaults()
	private readonly fieldId = inject(OmniIds).create()
	private readonly machine = createRating({
		id: this.fieldId,
		onValueChange: (value) => {
			this.touchedValue = true
			this.current.set(value)
			this.sync() // the machine is always controlled by this component: hand it the new value
			this.onChange(value)
			this.valueChange.emit(value)
		},
		onHoverChange: (value) => this.activeChange.emit(value),
	})
	private readonly bound = bindMachine(this.machine, (m) => m.connect())
	readonly state = this.bound.state
	readonly parts = this.bound.parts
	protected readonly stars = computed(() => (this.state(), this.machine.stars()))
	protected readonly groupPart = () => {
		return withAttrs(this.parts().group, { "aria-labelledby": this.ariaLabelledby })
	}

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	private sync(): void {
		const p = this.defaults("OmniRating", { size: this.size, color: this.color })
		this.size = p.size
		this.color = p.color
		this.machine.setProps({
			id: this.id ?? this.fieldId,
			name: this.name,
			label: this.ariaLabel,
			value: this.current(),
			max: this.max,
			precision: this.precision,
			readOnly: this.readOnly || undefined,
			disabled: this.disabled || undefined,
		})
	}

	writeValue(value: number | null | undefined): void {
		this.touchedValue = true
		this.current.set(value === null || value === undefined ? 0 : Number(value))
		this.sync()
	}

	registerOnChange(fn: (value: number) => void): void {
		this.onChange = fn
	}

	registerOnTouched(fn: () => void): void {
		this.onTouched = fn
	}

	setDisabledState(isDisabled: boolean): void {
		this.disabled = isDisabled
		this.sync()
	}
}
