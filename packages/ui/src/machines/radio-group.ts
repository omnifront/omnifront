import { formGroupParts } from "./form-group"
import { Machine, part, type Part } from "./machine"

export interface RadioGroupProps {
	/** Base for the ids of the label and helper text; also the default radio `name`. */
	id: string
	/** The `name` shared by the radios (they form one group for the browser). Defaults to `id`. */
	name?: string | undefined
	/** Controlled value. Leave undefined to let the machine keep its own. `""` means none. */
	value?: string | undefined
	defaultValue?: string | undefined
	onValueChange?: ((value: string, event?: Event) => void) | undefined
	disabled?: boolean | undefined
	required?: boolean | undefined
	error?: boolean | undefined
	hasLabel?: boolean | undefined
	hasHelper?: boolean | undefined
	row?: boolean | undefined
}

export interface RadioGroupState {
	id: string
	name: string
	value: string | undefined
	disabled: boolean
}

export interface RadioOptions {
	disabled?: boolean | undefined
}

/**
 * State of a group of radio buttons: which value is chosen (controlled or not). Each radio is a real
 * `<input type="radio">` with the group's `name`, so arrow keys moving the choice, Tab leaving the
 * group, forms and assistive technology are the browser's own.
 */
export class RadioGroup extends Machine<RadioGroupProps, RadioGroupState> {
	private internal: string | undefined

	constructor(props: RadioGroupProps) {
		super(props)
		this.internal = props.defaultValue
		this.start()
	}

	protected compute(): RadioGroupState {
		return {
			id: this.props.id,
			name: this.props.name ?? this.props.id,
			value: this.props.value ?? this.internal,
			disabled: this.props.disabled === true,
		}
	}

	choose = (value: string, event?: Event): void => {
		if (this.props.disabled || value === this.getSnapshot().value) return
		this.props.onValueChange?.(value, event)
		if (this.props.value === undefined) {
			this.internal = value
			this.refresh()
		}
	}

	connect(): ReturnType<typeof formGroupParts> {
		const { id, disabled } = this.getSnapshot()
		const p = this.props
		return formGroupParts({ id, role: "radiogroup", hasLabel: p.hasLabel, hasHelper: p.hasHelper, error: p.error, disabled, row: p.row })
	}

	/** Attributes and change handler for one radio's input. */
	radio(value: string, options: RadioOptions = {}): Part {
		const s = this.getSnapshot()
		const disabled = s.disabled || options.disabled === true
		return part(
			{
				type: "radio",
				name: s.name,
				value,
				checked: s.value === value,
				disabled: disabled || undefined,
				required: this.props.required || undefined,
				"aria-invalid": this.props.error ? "true" : undefined,
			},
			{ change: (event) => this.choose(value, event) },
		)
	}
}

export const createRadioGroup = (props: RadioGroupProps): RadioGroup => new RadioGroup(props)
