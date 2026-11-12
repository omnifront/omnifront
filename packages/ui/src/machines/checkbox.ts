import { Machine, part, type Part } from "./machine"

export interface CheckboxProps {
	/** Id of the native `<input type="checkbox">`. */
	id: string
	/** Controlled value. Leave undefined to let the machine keep its own. */
	checked?: boolean | undefined
	defaultChecked?: boolean | undefined
	/** The "some of them" state. Shown until the user clicks; a click then makes it checked. */
	indeterminate?: boolean | undefined
	disabled?: boolean | undefined
	required?: boolean | undefined
	error?: boolean | undefined
	onCheckedChange?: ((checked: boolean, event?: Event) => void) | undefined
}

export interface CheckboxState {
	id: string
	checked: boolean
	indeterminate: boolean
	disabled: boolean
}

/**
 * State of a checkbox: checked (controlled or not) and indeterminate. The control itself is a real
 * `<input type="checkbox">`, so the keyboard (Space), focus, forms and assistive technology are the
 * browser's own; the machine only decides what is checked and what to tell the listener.
 * `indeterminate` has no HTML attribute: set `input.indeterminate = state.indeterminate` after render.
 */
export class Checkbox extends Machine<CheckboxProps, CheckboxState> {
	private internal: boolean

	constructor(props: CheckboxProps) {
		super(props)
		this.internal = props.defaultChecked ?? false
		this.start()
	}

	protected compute(): CheckboxState {
		return {
			id: this.props.id,
			checked: this.props.checked ?? this.internal,
			indeterminate: this.props.indeterminate === true,
			disabled: this.props.disabled === true,
		}
	}

	/** The user changed it (from the input's `change` event). */
	change = (checked: boolean, event?: Event): void => {
		if (this.props.disabled) return
		this.props.onCheckedChange?.(checked, event)
		if (this.props.checked === undefined) {
			this.internal = checked
			this.refresh()
		}
	}

	connect(): { input: Part } {
		const s = this.getSnapshot()
		return {
			input: part(
				{
					id: s.id,
					type: "checkbox",
					checked: s.checked,
					disabled: s.disabled || undefined,
					required: this.props.required || undefined,
					"aria-invalid": this.props.error ? "true" : undefined,
				},
				{ change: (event) => this.change((event.target as HTMLInputElement).checked, event) },
			),
		}
	}
}

export const createCheckbox = (props: CheckboxProps): Checkbox => new Checkbox(props)
