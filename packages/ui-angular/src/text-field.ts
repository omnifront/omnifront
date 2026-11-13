import {
	AfterContentInit,
	AfterViewChecked,
	OnDestroy,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	OnInit,
	Output,
	ViewChild,
	booleanAttribute,
	forwardRef,
	inject,
	signal,
} from "@angular/core"
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from "@angular/forms"
import { attachAutosize, createField, type FieldProps } from "@omnifront/ui"
import { bindMachine } from "./machine"
import { OmniPart } from "./part"
import { OmniIds, injectDefaults } from "./theme"

/**
 * Material text field: floating label, three variants, helper text, error state, adornments, multiline.
 * Works with `ngModel`, reactive forms (`formControl`), or plain `[value]` and `(valueChange)`.
 * Adornments: put `omniStartAdornment` or `omniEndAdornment` on a child element.
 */
@Component({
	selector: "omni-text-field",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OmniTextField), multi: true }],
	host: {
		class: "omni-text-field",
		// These are inputs for the inner <input>; the attribute the user wrote must not stay on the host too
		// (a second `id` would make the label point at the wrong element).
		"[attr.id]": "null",
		"[attr.name]": "null",
		"[attr.placeholder]": "null",
		"[attr.type]": "null",
		"[attr.data-variant]": "variant ?? 'outlined'",
		"[attr.data-size]": "size ?? 'medium'",
		"[attr.data-color]": "color ?? 'primary'",
		"[attr.data-full-width]": "fullWidth ? '' : null",
		"[attr.data-has-label]": "label ? '' : null",
		"[attr.data-focused]": "state().focused ? '' : null",
		"[attr.data-filled]": "state().filled ? '' : null",
		"[attr.data-shrink]": "state().shrink ? '' : null",
		"[attr.data-error]": "state().error ? '' : null",
		"[attr.data-disabled]": "state().disabled ? '' : null",
	},
	template: `
		@if (label) {
			<label class="omni-text-field__label" [omniPart]="parts().label">{{ label }}@if (state().required) {<span class="omni-text-field__required" aria-hidden="true">&thinsp;*</span>}</label>
		}
		<div class="omni-text-field__control" (click)="focus()">
			<span class="omni-text-field__adornment" data-position="start"><ng-content select="[omniStartAdornment]" /></span>
			@if (multiline) {
				<textarea #field class="omni-text-field__input" [omniPart]="parts().input" [attr.rows]="autosizing() ? (minRows ?? 1) : (rows ?? 1)" [attr.placeholder]="placeholder" [attr.name]="name" [value]="text()" (input)="onInput($event)" (blur)="onTouched()"></textarea>
			} @else {
				<input #field class="omni-text-field__input" [omniPart]="parts().input" [attr.type]="type" [attr.placeholder]="placeholder" [attr.name]="name" [value]="text()" (input)="onInput($event)" (blur)="onTouched()" />
			}
			<span class="omni-text-field__adornment" data-position="end"><ng-content select="[omniEndAdornment]" /></span>
			<fieldset class="omni-text-field__fieldset" [omniPart]="parts().fieldset"><legend class="omni-text-field__legend">@if (label) {<span>{{ label }}</span>}</legend></fieldset>
		</div>
		@if (helperText) {
			<p class="omni-text-field__helper" [omniPart]="parts().helper">{{ helperText }}</p>
		}
	`,
})
export class OmniTextField implements ControlValueAccessor, OnInit, OnChanges, AfterContentInit, AfterViewChecked, OnDestroy {
	@Input() label: string | undefined
	@Input() helperText: string | undefined
	@Input({ transform: booleanAttribute }) error = false
	@Input({ transform: booleanAttribute }) disabled = false
	@Input({ transform: booleanAttribute }) required = false
	@Input({ transform: booleanAttribute }) readOnly = false
	@Input() variant: "outlined" | "filled" | "standard" | undefined
	@Input() size: "small" | "medium" | undefined
	@Input() color: "primary" | "secondary" | "success" | "info" | "warning" | undefined
	@Input({ transform: booleanAttribute }) fullWidth = false
	/** A `<textarea>` instead of an `<input>`. */
	@Input({ transform: booleanAttribute }) multiline = false
	@Input() rows: number | undefined
	/** With `multiline`: grow with the text, from this many rows... */
	@Input() minRows: number | undefined
	/** ...up to this many, then scroll. */
	@Input() maxRows: number | undefined
	@Input() type: string | undefined
	@Input() placeholder: string | undefined
	@Input() name: string | undefined
	@Input() id: string | undefined
	/** The value, for use without forms. */
	@Input() set value(v: string | number | null | undefined) {
		this.text.set(v === null || v === undefined ? "" : String(v))
	}
	/** The value an uncontrolled field starts with. */
	@Input() set defaultValue(v: string | number | undefined) {
		if (v !== undefined && !this.touchedValue) this.text.set(String(v))
	}
	@Output() valueChange = new EventEmitter<string>()

	private field: ElementRef<HTMLInputElement | HTMLTextAreaElement> | undefined
	@ViewChild("field") private set fieldRef(ref: ElementRef<HTMLInputElement | HTMLTextAreaElement> | undefined) {
		this.field = ref
		this.syncAutosize()
	}
	private sizer: { update(): void; destroy(): void } | undefined
	protected autosizing(): boolean {
		return this.multiline && (this.minRows !== undefined || this.maxRows !== undefined)
	}

	readonly text = signal("")
	private touchedValue = false
	private hasStart = false
	private onChange: (value: string) => void = () => {}
	onTouched: () => void = () => {}

	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly defaults = injectDefaults()
	private readonly fieldId = inject(OmniIds).create()
	private readonly machine = createField({ id: this.fieldId })
	protected readonly bound = bindMachine(this.machine, (m) => m.connect())
	readonly state = this.bound.state
	readonly parts = this.bound.parts

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
		this.syncAutosize()
	}

	/** Make a multiline field with `minRows` or `maxRows` grow and shrink with its text. */
	private syncAutosize(): void {
		this.sizer?.destroy()
		const el = this.field?.nativeElement
		this.sizer = this.autosizing() && el instanceof HTMLTextAreaElement ? attachAutosize(el, () => ({ minRows: this.minRows, maxRows: this.maxRows })) : undefined
	}

	// The value property is bound by the template, so measure after it was written.
	ngAfterViewChecked(): void {
		this.sizer?.update()
	}

	ngOnDestroy(): void {
		this.sizer?.destroy()
	}

	ngAfterContentInit(): void {
		this.hasStart = this.host.querySelector("[omniStartAdornment]") !== null
		this.sync()
	}

	private sync(): void {
		const p = this.defaults("OmniTextField", { disabled: this.disabled || undefined, error: this.error || undefined })
		const props: Partial<FieldProps> = {
			id: this.id ?? this.fieldId,
			disabled: p.disabled,
			error: p.error,
			required: this.required || undefined,
			readOnly: this.readOnly || undefined,
			hasHelper: !!this.helperText,
			// The component always knows the text (it renders it), so it is the source for "filled".
			filled: this.text() !== "",
			alwaysShrink: this.hasStart || undefined,
		}
		this.machine.setProps(props)
	}

	onInput(event: Event): void {
		const value = (event.target as HTMLInputElement).value
		this.touchedValue = true
		this.text.set(value)
		this.sync()
		this.onChange(value)
		this.valueChange.emit(value)
	}

	focus(): void {
		this.field?.nativeElement.focus()
	}

	// ControlValueAccessor: how Angular forms read and write the value.
	writeValue(value: string | number | null | undefined): void {
		this.touchedValue = true
		this.text.set(value === null || value === undefined ? "" : String(value))
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
