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
import { createSlider, type Part } from "@omnifront/ui"
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
			[style.--omni-slider-start]="state().start"
			[style.--omni-slider-length]="lengthCss()"
			[attr.data-size]="size ?? 'medium'"
			[attr.data-color]="color ?? 'primary'"
			[attr.data-label]="valueLabelDisplay ?? 'off'"
			[attr.data-orientation]="state().orientation"
			[attr.data-range]="state().range ? '' : null"
			[attr.data-disabled]="state().disabled ? '' : null"
			[attr.data-marks-labels]="hasMarkLabels() ? '' : null"
		>
			@if (state().range) {
				<span class="omni-slider__rail" aria-hidden="true"><span class="omni-slider__fill"></span></span>
			}
			@for (thumb of thumbs(); track $index) {
				<input class="omni-slider__input" [omniPart]="inputPart($index)" [attr.name]="name" (blur)="onTouched()" />
			}
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
				@for (v of thumbs(); track $index) {
					<span class="omni-slider__label" aria-hidden="true" [style.--omni-slider-percent]="percentOf(v)">{{ valueLabelFormat ? valueLabelFormat(v) : v }}</span>
				}
			}
		</span>
	`,
})
export class OmniSlider<T extends number | readonly [number, number] = number> implements ControlValueAccessor, OnInit, OnChanges {
	/** The value: a number, or with `range` a `[lower, upper]` pair. Use `[(value)]` for two-way binding. */
	@Input() set value(v: T | null | undefined) {
		this.store(v)
	}
	/** The value an uncontrolled slider starts with. */
	@Input() set defaultValue(v: T | undefined) {
		if (v !== undefined && !this.touchedValue) this.store(v)
	}
	/** Two thumbs: a lower and an upper value. The lower one cannot pass the upper one. */
	@Input({ transform: booleanAttribute }) range = false
	/** `vertical` puts the smallest value at the bottom. */
	@Input() orientation: "horizontal" | "vertical" | undefined
	/** The height of a vertical slider (a number is pixels, or any CSS length). Default 200px. */
	@Input() length: number | string | undefined
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
	@Output() valueChange = new EventEmitter<T>()

	private readonly current = signal<number | undefined>(undefined)
	private readonly currentPair = signal<[number, number] | undefined>(undefined)
	private touchedValue = false
	private onChange: (value: T) => void = () => {}
	onTouched: () => void = () => {}

	private readonly defaults = injectDefaults()
	private readonly fieldId = inject(OmniIds).create()
	private readonly machine = createSlider({
		id: this.fieldId,
		onValueChange: (value) => {
			this.touchedValue = true
			this.current.set(value)
			this.sync() // the machine is always controlled by this component: hand it the new value
			this.onChange(value as T)
			this.valueChange.emit(value as T)
		},
		onValuesChange: (values) => {
			this.touchedValue = true
			this.currentPair.set(values)
			this.sync()
			this.onChange(values as unknown as T)
			this.valueChange.emit(values as unknown as T)
		},
	})
	private readonly bound = bindMachine(this.machine, (m) => m.connect())
	readonly state = this.bound.state
	/** The value of each thumb: one, or two for a range. */
	protected readonly thumbs = (): number[] => (this.state().range ? this.state().values : [this.state().value])
	protected readonly lengthCss = (): string | null => (this.length === undefined ? null : typeof this.length === "number" ? `${this.length}px` : this.length)
	protected readonly inputPart = (index: number) => {
		const part = this.bound.parts().inputs[index] as Part
		const label = this.state().range && this.ariaLabel ? `${this.ariaLabel} ${index === 0 ? "minimum" : "maximum"}` : this.ariaLabel
		return withAttrs(part, {
			"aria-label": label,
			"aria-labelledby": this.ariaLabelledby,
			"aria-valuetext": this.getAriaValueText?.(this.thumbs()[index] as number),
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
			range: this.range || undefined,
			value: this.range ? undefined : (this.current() ?? this.min ?? 0),
			values: this.range ? (this.currentPair() ?? [this.min ?? 0, this.max ?? 100]) : undefined,
			orientation: this.orientation,
			min: this.min,
			max: this.max,
			step: this.step,
			disabled: this.disabled || undefined,
		})
	}

	/** Keep a value from `[value]`, `[defaultValue]` or a form: a number, or a pair for `range`. */
	private store(v: T | null | undefined): void {
		if (Array.isArray(v)) this.currentPair.set([Number(v[0]), Number(v[1])])
		else if (v !== null && v !== undefined) this.current.set(Number(v))
	}

	// ControlValueAccessor: how Angular forms read and write the value.
	writeValue(value: T | null | undefined): void {
		this.touchedValue = true
		this.current.set(undefined)
		this.currentPair.set(undefined)
		this.store(value)
		this.sync()
	}

	registerOnChange(fn: (value: T) => void): void {
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
