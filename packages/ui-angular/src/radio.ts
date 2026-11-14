import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	InjectionToken,
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
import { createRadioGroup, formGroupParts, type RadioGroup } from "@omnifront/ui"
import { bindMachine } from "./machine"
import { OmniPart } from "./part"
import { OmniIds, injectDefaults } from "./theme"

/** The RadioGroup that a radio sits in. */
export const OMNI_RADIO_GROUP = new InjectionToken<OmniRadioGroup>("OMNI_RADIO_GROUP")

/**
 * A group of radio buttons: one value chosen at a time. The radios are real `<input type="radio">`
 * with a shared name, so the arrow keys move the choice and Tab leaves the group, natively.
 *
 *     <omni-radio-group label="Fruit" [(value)]="fruit">
 *       <omni-radio value="a">Apple</omni-radio>
 *       <omni-radio value="b">Banana</omni-radio>
 *     </omni-radio-group>
 *
 * Works with `ngModel` and reactive forms too.
 */
@Component({
	selector: "omni-radio-group",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{ provide: OMNI_RADIO_GROUP, useExisting: forwardRef(() => OmniRadioGroup) },
		{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OmniRadioGroup), multi: true },
	],
	host: { style: "display: contents", "[attr.id]": "null", "[attr.name]": "null" },
	template: `
		<fieldset class="omni-form-group" [omniPart]="parts().group">
			@if (label) {
				<legend class="omni-form-group__label" [omniPart]="parts().label">{{ label }}</legend>
			}
			<div class="omni-form-group__items" [omniPart]="parts().items"><ng-content /></div>
			@if (helperText) {
				<p class="omni-form-group__helper" [omniPart]="parts().helper">{{ helperText }}</p>
			}
		</fieldset>
	`,
})
export class OmniRadioGroup implements ControlValueAccessor, OnInit, OnChanges {
	@Input() label: string | undefined
	@Input() helperText: string | undefined
	/** The chosen value. Use `[(value)]` for two-way binding. */
	@Input() set value(v: string | null | undefined) {
		this.current.set(v === null || v === undefined ? undefined : v)
	}
	/** The value an uncontrolled group starts with. */
	@Input() set defaultValue(v: string | undefined) {
		if (!this.touchedValue) this.current.set(v)
	}
	/** The `name` the radios share. Defaults to a generated one. */
	@Input() name: string | undefined
	@Input({ transform: booleanAttribute }) error = false
	@Input({ transform: booleanAttribute }) disabled = false
	@Input({ transform: booleanAttribute }) required = false
	/** Lay the radios out in a row. */
	@Input({ transform: booleanAttribute }) row = false
	@Input() id: string | undefined
	@Output() valueChange = new EventEmitter<string>()

	private readonly current = signal<string | undefined>(undefined)
	private touchedValue = false
	private onChange: (value: string) => void = () => {}
	onTouched: () => void = () => {}

	private readonly defaults = injectDefaults()
	private readonly fieldId = inject(OmniIds).create()
	readonly machine: RadioGroup = createRadioGroup({
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
	/** The state, as a signal: radios read it so they update when the choice changes. */
	readonly state = this.bound.state
	readonly parts = this.bound.parts

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	private sync(): void {
		this.defaults("OmniRadioGroup", {})
		this.machine.setProps({
			id: this.id ?? this.fieldId,
			name: this.name,
			value: this.current() ?? "",
			disabled: this.disabled || undefined,
			required: this.required || undefined,
			error: this.error || undefined,
			row: this.row || undefined,
			hasLabel: !!this.label,
			hasHelper: !!this.helperText,
		})
	}

	writeValue(value: string | null | undefined): void {
		this.touchedValue = true
		this.current.set(value === null || value === undefined ? undefined : value)
		this.sync()
	}

	registerOnChange(fn: (value: string) => void): void {
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

/** One radio button, inside an `omni-radio-group`. Put the label inside it. */
@Component({
	selector: "omni-radio",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: "display: contents" },
	template: `
		<label
			class="omni-radio"
			[attr.data-size]="size ?? 'medium'"
			[attr.data-color]="color ?? 'primary'"
			[attr.data-label-placement]="labelPlacement && labelPlacement !== 'end' ? labelPlacement : null"
			[attr.data-disabled]="isDisabled() ? '' : null"
		>
			<span class="omni-radio__control">
				<input class="omni-radio__input" [omniPart]="inputPart()" [attr.id]="id" [attr.aria-label]="ariaLabel" (blur)="group?.onTouched()" />
				<span class="omni-radio__box" aria-hidden="true"></span>
			</span>
			<span class="omni-radio__label"><ng-content /></span>
		</label>
	`,
})
export class OmniRadio implements OnInit, OnChanges {
	/** What the group's value becomes when this radio is chosen. */
	@Input({ required: true }) value!: string
	@Input({ transform: booleanAttribute }) disabled = false
	@Input() labelPlacement: "end" | "start" | "top" | "bottom" | undefined
	@Input() color: "primary" | "secondary" | "success" | "info" | "warning" | "error" | undefined
	@Input() size: "small" | "medium" | undefined
	@Input() id: string | undefined
	@Input("aria-label") ariaLabel: string | undefined

	protected readonly group = inject(OMNI_RADIO_GROUP, { optional: true })
	private readonly defaults = injectDefaults()

	protected readonly isDisabled = () => this.disabled || this.group?.state().disabled === true
	// Reads the group's state signal, so the template re-evaluates when the choice changes.
	protected readonly inputPart = () => {
		void this.group?.state()
		return this.group ? this.group.machine.radio(this.value, { disabled: this.disabled }) : null
	}

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	private sync(): void {
		const p = this.defaults("OmniRadio", { color: this.color, size: this.size, labelPlacement: this.labelPlacement })
		this.color = p.color
		this.size = p.size
		this.labelPlacement = p.labelPlacement
	}
}

/** A labelled group of related controls (a `<fieldset>` with a `<legend>`), for example several checkboxes. */
@Component({
	selector: "omni-form-group",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: "display: contents", "[attr.id]": "null" },
	template: `
		<fieldset class="omni-form-group" [omniPart]="parts().group">
			@if (label) {
				<legend class="omni-form-group__label" [omniPart]="parts().label">{{ label }}</legend>
			}
			<div class="omni-form-group__items" [omniPart]="parts().items"><ng-content /></div>
			@if (helperText) {
				<p class="omni-form-group__helper" [omniPart]="parts().helper">{{ helperText }}</p>
			}
		</fieldset>
	`,
})
export class OmniFormGroup {
	@Input() label: string | undefined
	@Input() helperText: string | undefined
	@Input({ transform: booleanAttribute }) error = false
	@Input({ transform: booleanAttribute }) disabled = false
	/** Lay the items out in a row. */
	@Input({ transform: booleanAttribute }) row = false
	@Input() id: string | undefined

	private readonly fieldId = inject(OmniIds).create()
	protected readonly parts = () =>
		formGroupParts({ id: this.id ?? this.fieldId, hasLabel: !!this.label, hasHelper: !!this.helperText, error: this.error, disabled: this.disabled, row: this.row })
}
