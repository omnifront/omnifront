import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	OnInit,
	Output,
	booleanAttribute,
	forwardRef,
	inject,
	signal,
} from "@angular/core"
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from "@angular/forms"
import { createSlider } from "@omnifront/ui"
import { bindMachine } from "./machine"
import { OmniPart, withAttrs } from "./part"
import { OmniIds, injectDefaults } from "./theme"

export interface SliderMark {
	value: number
	label?: string | undefined
}

/**
 * Material slider. The control is a real `<input type="range">`: dragging, the arrow keys, Home,
 * End, Page Up and Page Down, forms and screen readers are the browser's own. Works with `ngModel`
 * and reactive forms, or `[(value)]`. Give it `aria-label` (or `aria-labelledby`).
 */
@Component({
	selector: "omni-slider",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OmniSlider), multi: true }],
	// Inputs for the inner control; the attribute the user wrote must not stay on the host too.
	host: { style: "display: contents", "[attr.id]": "null", "[attr.name]": "null", "[attr.aria-label]": "null", "[attr.aria-labelledby]": "null" },
	template: `
		<span
			class="omni-slider"
			[style.--omni-slider-percent]="state().percent"
			[attr.data-size]="size ?? 'medium'"
			[attr.data-color]="color ?? 'primary'"
			[attr.data-label]="valueLabelDisplay ?? 'off'"
			[attr.data-disabled]="state().disabled ? '' : null"
			[attr.data-marks-labels]="hasMarkLabels() ? '' : null"
		>
			<input class="omni-slider__input" [omniPart]="inputPart()" [attr.name]="name" (blur)="onTouched()" />
			@if (markList().length > 0) {
				<span class="omni-slider__marks" aria-hidden="true">
					@for (mark of markList(); track mark.value) {
						<span>
							<span class="omni-slider__mark" [style.--omni-mark]="percentOf(mark.value)"></span>
							@if (mark.label !== undefined) {
								<span class="omni-slider__mark-label" [style.--omni-mark]="percentOf(mark.value)">{{ mark.label }}</span>
							}
						</span>
					}
				</span>
			}
			@if ((valueLabelDisplay ?? 'off') !== 'off') {
				<span class="omni-slider__label" aria-hidden="true">{{ valueLabelFormat ? valueLabelFormat(state().value) : state().value }}</span>
			}
		</span>
	`,
})
export class OmniSlider implements ControlValueAccessor, OnInit, OnChanges {
	/** The value. Use `[(value)]` for two-way binding. */
	@Input() set value(v: number | null | undefined) {
		if (v !== null && v !== undefined) this.current.set(Number(v))
	}
	/** The value an uncontrolled slider starts with. */
	@Input() set defaultValue(v: number | undefined) {
		if (v !== undefined && !this.touchedValue) this.current.set(v)
	}
	@Input() min: number | undefined
	@Input() max: number | undefined
	@Input() step: number | undefined
	@Input({ transform: booleanAttribute }) disabled = false
	@Input() size: "small" | "medium" | undefined
	@Input() color: "primary" | "secondary" | "success" | "info" | "warning" | "error" | undefined
	/** `true` puts a mark on every step; a list gives marks (and labels) at chosen values. */
	@Input() marks: boolean | readonly SliderMark[] | undefined
	/** When the bubble with the value shows: on hover and focus (`auto`), always (`on`), or never (`off`). */
	@Input() valueLabelDisplay: "auto" | "on" | "off" | undefined
	@Input() valueLabelFormat: ((value: number) => string | number) | undefined
	/** The value as words for screen readers, for example `${value} degrees`. */
	@Input() getAriaValueText: ((value: number) => string) | undefined
	@Input() name: string | undefined
	@Input() id: string | undefined
	@Input("aria-label") ariaLabel: string | undefined
	@Input("aria-labelledby") ariaLabelledby: string | undefined
	@Output() valueChange = new EventEmitter<number>()

	private readonly current = signal<number | undefined>(undefined)
	private touchedValue = false
	private onChange: (value: number) => void = () => {}
	onTouched: () => void = () => {}

	private readonly defaults = injectDefaults()
	private readonly fieldId = inject(OmniIds).create()
	private readonly machine = createSlider({
		id: this.fieldId,
		onValueChange: (value) => {
			this.touchedValue = true
			this.current.set(value)
			this.sync() // the machine is always controlled by this component: hand it the new value
			this.onChange(value)
			this.valueChange.emit(value)
		},
	})
	private readonly bound = bindMachine(this.machine, (m) => m.connect())
	readonly state = this.bound.state
	protected readonly inputPart = () => {
		const part = this.bound.parts().input
		return withAttrs(part, {
			"aria-label": this.ariaLabel,
			"aria-labelledby": this.ariaLabelledby,
			"aria-valuetext": this.getAriaValueText?.(this.state().value),
		})
	}
	protected readonly markList = (): SliderMark[] => {
		const { min, max, step } = this.state()
		if (this.marks === true) return Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => ({ value: Number((min + i * step).toFixed(6)) }))
		return this.marks ? [...this.marks] : []
	}
	protected readonly hasMarkLabels = () => this.markList().some((m) => m.label !== undefined)
	protected percentOf(v: number): number {
		const { min, max } = this.state()
		return max === min ? 0 : ((v - min) / (max - min)) * 100
	}

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	private sync(): void {
		const p = this.defaults("OmniSlider", { size: this.size, color: this.color, valueLabelDisplay: this.valueLabelDisplay })
		this.size = p.size
		this.color = p.color
		this.valueLabelDisplay = p.valueLabelDisplay
		this.machine.setProps({
			id: this.id ?? this.fieldId,
			value: this.current() ?? this.min ?? 0,
			min: this.min,
			max: this.max,
			step: this.step,
			disabled: this.disabled || undefined,
		})
	}

	// ControlValueAccessor: how Angular forms read and write the value.
	writeValue(value: number | null | undefined): void {
		this.touchedValue = true
		this.current.set(value === null || value === undefined ? undefined : Number(value))
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
