import { DOCUMENT, isPlatformBrowser } from "@angular/common"
import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	OnInit,
	Output,
	PLATFORM_ID,
	ViewChild,
	afterNextRender,
	booleanAttribute,
	forwardRef,
	inject,
	signal,
} from "@angular/core"
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from "@angular/forms"
import { createField, createSelect, mergeParts, type CloseReason, type SelectOption } from "@omnifront/ui"
import { autoPosition } from "@omnifront/ui/position"
import { bindMachine } from "./machine"
import { OmniPart } from "./part"
import { ElementPortal, OmniIds, ThemeScope, injectDefaults } from "./theme"

export type SelectCloseReason = Extract<CloseReason, "escapeKeyDown" | "outsidePress" | "tab" | "select" | "trigger" | "programmatic">
export interface SelectCloseEvent {
	reason: SelectCloseReason
	event: Event | undefined
}

/**
 * Material select: looks like a text field, opens a listbox of options. Works with `ngModel`,
 * reactive forms, or `[(value)]`. Keyboard: Enter, Space and the arrows open it; in the list the
 * arrows, Home, End and typing move focus, Enter or Space choose, Escape closes. For assistive
 * technology it is a `combobox` with a `listbox`.
 *
 *     <omni-select label="Fruit" [options]="fruits" [(value)]="fruit" />
 *
 * Angular lifecycle: the list is moved to a portal at the end of `<body>` while it is open, and
 * only exists after the first render in the browser (like the other overlays).
 */
@Component({
	selector: "omni-select",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OmniSelect), multi: true }],
	host: {
		class: "omni-text-field omni-select",
		// Inputs for the inner control; the attribute the user wrote must not stay on the host too.
		"[attr.id]": "null",
		"[attr.name]": "null",
		"[attr.data-variant]": "variant ?? 'outlined'",
		"[attr.data-size]": "size ?? 'medium'",
		"[attr.data-color]": "color ?? 'primary'",
		"[attr.data-full-width]": "fullWidth ? '' : null",
		"[attr.data-has-label]": "label ? '' : null",
		"[attr.data-focused]": "fieldState().focused ? '' : null",
		"[attr.data-filled]": "fieldState().filled ? '' : null",
		"[attr.data-shrink]": "fieldState().shrink ? '' : null",
		"[attr.data-error]": "fieldState().error ? '' : null",
		"[attr.data-disabled]": "fieldState().disabled ? '' : null",
	},
	template: `
		@if (label) {
			<label class="omni-text-field__label" [omniPart]="labelPart()" (click)="focus()">{{ label }}@if (fieldState().required) {<span class="omni-text-field__required" aria-hidden="true">&thinsp;*</span>}</label>
		}
		<div class="omni-text-field__control">
			<div #trigger class="omni-text-field__input omni-select__trigger" [omniPart]="triggerPart()">{{ state().label }}</div>
			<span class="omni-select__icon" aria-hidden="true" [attr.data-state]="state().open ? 'open' : 'closed'"></span>
			@if (name) {
				<input type="hidden" [attr.name]="name" [value]="state().value ?? ''" />
			}
			<fieldset class="omni-text-field__fieldset" [omniPart]="fieldParts().fieldset"><legend class="omni-text-field__legend">@if (label) {<span>{{ label }}</span>}</legend></fieldset>
		</div>
		@if (helperText) {
			<p class="omni-text-field__helper" [omniPart]="fieldParts().helper">{{ helperText }}</p>
		}
		@if (clientReady() && state().mounted) {
			<ul #list class="omni-menu omni-select__listbox" [omniPart]="parts().listbox">
				@for (option of options; track option.value) {
					<li class="omni-menu__item" [omniPart]="select.option(option)">{{ option.label }}</li>
				}
			</ul>
		}
	`,
})
export class OmniSelect implements ControlValueAccessor, OnInit, OnChanges {
	@Input() label: string | undefined
	/** What can be chosen. `value` is what is reported; `label` is what the user sees. */
	@Input() options: readonly SelectOption[] = []
	/** The chosen value. `""` means nothing is selected. */
	@Input() set value(v: string | null | undefined) {
		this.current.set(v === null || v === undefined ? undefined : v)
	}
	/** The value an uncontrolled select starts with. */
	@Input() set defaultValue(v: string | undefined) {
		if (!this.touchedValue) this.current.set(v)
	}
	@Input() open: boolean | undefined
	@Input() helperText: string | undefined
	@Input({ transform: booleanAttribute }) error = false
	@Input({ transform: booleanAttribute }) disabled = false
	@Input({ transform: booleanAttribute }) required = false
	@Input() variant: "outlined" | "filled" | "standard" | undefined
	@Input() size: "small" | "medium" | undefined
	@Input() color: "primary" | "secondary" | "success" | "info" | "warning" | undefined
	@Input({ transform: booleanAttribute }) fullWidth = false
	/** Name for a form: the value is also written to a hidden `<input>`. */
	@Input() name: string | undefined
	@Input() id: string | undefined
	@Output() valueChange = new EventEmitter<string>()
	@Output() openChange = new EventEmitter<boolean>()
	/** The list closed; `reason` tells why. */
	@Output() closed = new EventEmitter<SelectCloseEvent>()

	private readonly current = signal<string | undefined>(undefined)
	private touchedValue = false
	private onChange: (value: string) => void = () => {}
	onTouched: () => void = () => {}

	@ViewChild("trigger", { static: true }) private triggerRef!: ElementRef<HTMLElement>
	private list: HTMLElement | undefined
	@ViewChild("list") set listRef(ref: ElementRef<HTMLElement> | undefined) {
		this.list = ref?.nativeElement
		this.syncDom()
	}

	private readonly defaults = injectDefaults()
	private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
	private readonly portal = new ElementPortal(inject(DOCUMENT), inject(ThemeScope, { optional: true }))
	private readonly fieldId = inject(OmniIds).create()
	readonly select = createSelect({
		id: this.fieldId,
		options: [],
		onValueChange: (value) => {
			this.touchedValue = true
			this.current.set(value)
			this.sync() // the machine is always controlled by this component: hand it the new value
			this.onChange(value)
			this.valueChange.emit(value)
		},
		onOpenChange: (open, reason, event) => {
			this.openChange.emit(open)
			if (!open) this.closed.emit({ reason: reason as SelectCloseReason, event })
		},
	})
	private readonly field = createField({ id: this.fieldId })
	private readonly selectBound = bindMachine(this.select, (m) => m.connect())
	private readonly fieldBound = bindMachine(this.field, (m) => m.connect())
	readonly state = this.selectBound.state
	readonly parts = this.selectBound.parts
	readonly fieldState = this.fieldBound.state
	readonly fieldParts = this.fieldBound.parts
	protected readonly triggerPart = () => mergeParts(this.parts().trigger, this.fieldParts().trigger)
	protected readonly labelPart = () => ({ ...this.fieldParts().label, attrs: { ...this.fieldParts().label.attrs, for: undefined } })
	protected readonly clientReady = signal(false)
	private detach: (() => void) | undefined

	constructor() {
		afterNextRender(() => {
			this.clientReady.set(true)
			this.syncDom()
		})
		const off = this.select.subscribe(() => this.syncDom())
		inject(DestroyRef).onDestroy(() => {
			off()
			this.detach?.()
			this.portal.leave()
		})
	}

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	private sync(): void {
		const p = this.defaults("OmniSelect", { variant: this.variant })
		this.variant = p.variant
		const id = this.id ?? this.fieldId
		const value = this.current()
		this.select.setProps({ id, options: this.options, value: value ?? "", disabled: this.disabled || undefined, open: this.open })
		this.field.setProps({
			id,
			disabled: this.disabled || undefined,
			error: this.error || undefined,
			required: this.required || undefined,
			hasHelper: !!this.helperText,
			filled: value !== undefined && value !== "",
		})
	}

	/** Move the list to the portal and run the machine's DOM side while open and rendered. */
	private syncDom(): void {
		const { open } = this.select.getSnapshot()
		const want = open && this.list !== undefined && this.browser
		if (want && !this.detach && this.list) {
			this.portal.enter(this.list)
			this.detach = this.select.attach({
				content: this.list,
				trigger: this.triggerRef.nativeElement,
				position: (anchor, floating) => autoPosition(anchor, floating, { matchWidth: true }),
			})
		} else if (!want && this.detach) {
			this.detach()
			this.detach = undefined
		}
		if (!this.list && !this.detach) this.portal.leave()
	}

	focus(): void {
		this.triggerRef.nativeElement.focus()
	}

	// ControlValueAccessor: how Angular forms read and write the value.
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
