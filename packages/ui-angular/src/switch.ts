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
import { createCheckbox } from "@omnifront/ui"
import { bindMachine } from "./machine"
import { OmniPart } from "./part"
import { OmniIds, injectDefaults } from "./theme"

/**
 * Material switch: an on/off setting. The control is a real `<input type="checkbox" role="switch">`
 * (Space, focus, forms and screen readers work natively) under a track and a thumb. Put the label
 * inside: `<omni-switch [(checked)]="wifi">Wi-Fi</omni-switch>`. Works with `ngModel` and reactive
 * forms too. For no visible label, give it `aria-label`.
 */
@Component({
	selector: "omni-switch",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OmniSwitch), multi: true }],
	// Inputs for the inner control; the attribute the user wrote must not stay on the host too.
	host: { style: "display: contents", "[attr.id]": "null", "[attr.name]": "null", "[attr.value]": "null", "[attr.aria-label]": "null" },
	template: `
		<label
			class="omni-switch"
			[attr.data-size]="size ?? 'medium'"
			[attr.data-color]="color ?? 'primary'"
			[attr.data-label-placement]="labelPlacement && labelPlacement !== 'end' ? labelPlacement : null"
			[attr.data-disabled]="state().disabled ? '' : null"
			[attr.data-error]="error ? '' : null"
		>
			<span class="omni-switch__control">
				<input class="omni-switch__input" [omniPart]="parts().input" [attr.name]="name" [attr.value]="value" [attr.aria-label]="ariaLabel" (blur)="onTouched()" />
				<span class="omni-switch__track" aria-hidden="true"></span>
				<span class="omni-switch__thumb" aria-hidden="true"></span>
			</span>
			<span class="omni-switch__label"><ng-content /></span>
		</label>
	`,
})
export class OmniSwitch implements ControlValueAccessor, OnInit, OnChanges {
	/** On or off. Use `[(checked)]` for two-way binding. */
	@Input({ transform: booleanAttribute }) set checked(v: boolean) {
		this.current.set(v)
	}
	/** Whether an uncontrolled switch starts on. */
	@Input({ transform: booleanAttribute }) set defaultChecked(v: boolean) {
		if (!this.touchedValue) this.current.set(v)
	}
	@Input() labelPlacement: "end" | "start" | "top" | "bottom" | undefined
	@Input({ transform: booleanAttribute }) disabled = false
	@Input({ transform: booleanAttribute }) required = false
	@Input({ transform: booleanAttribute }) error = false
	@Input() color: "primary" | "secondary" | "success" | "info" | "warning" | "error" | undefined
	@Input() size: "small" | "medium" | undefined
	@Input() name: string | undefined
	@Input() value: string | undefined
	@Input() id: string | undefined
	@Input("aria-label") ariaLabel: string | undefined
	@Output() checkedChange = new EventEmitter<boolean>()

	private readonly current = signal(false)
	private touchedValue = false
	private onChange: (checked: boolean) => void = () => {}
	onTouched: () => void = () => {}

	private readonly defaults = injectDefaults()
	private readonly fieldId = inject(OmniIds).create()
	private readonly machine = createCheckbox({
		id: this.fieldId,
		role: "switch",
		onCheckedChange: (checked) => {
			this.touchedValue = true
			this.current.set(checked)
			this.sync() // the machine is always controlled by this component: hand it the new value
			this.onChange(checked)
			this.checkedChange.emit(checked)
		},
	})
	private readonly bound = bindMachine(this.machine, (m) => m.connect())
	readonly state = this.bound.state
	readonly parts = this.bound.parts

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	private sync(): void {
		const p = this.defaults("OmniSwitch", { color: this.color, size: this.size, labelPlacement: this.labelPlacement })
		this.color = p.color
		this.size = p.size
		this.labelPlacement = p.labelPlacement
		this.machine.setProps({
			id: this.id ?? this.fieldId,
			checked: this.current(),
			disabled: this.disabled || undefined,
			required: this.required || undefined,
			error: this.error || undefined,
		})
	}

	// ControlValueAccessor: how Angular forms read and write the value.
	writeValue(value: boolean | null | undefined): void {
		this.touchedValue = true
		this.current.set(value === true)
		this.sync()
	}

	registerOnChange(fn: (checked: boolean) => void): void {
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
