import { Machine, part, type Part } from "./machine"

export interface FieldProps {
	/** Id of the input; the label, helper text and fieldset ids are derived from it. */
	id: string
	disabled?: boolean | undefined
	error?: boolean | undefined
	required?: boolean | undefined
	readOnly?: boolean | undefined
	/** Whether the input has a value. Controlled inputs pass this on every render; otherwise it follows typing. */
	filled?: boolean | undefined
	/** Whether an uncontrolled input starts with a value (its `defaultValue`). */
	defaultFilled?: boolean | undefined
	/** Keep the label floated even when empty (a placeholder or an adornment needs this). */
	alwaysShrink?: boolean | undefined
	/** Whether helper text exists, so `aria-describedby` only points at something real. */
	hasHelper?: boolean | undefined
}

export interface FieldState {
	id: string
	focused: boolean
	filled: boolean
	/** The label floats above the input. */
	shrink: boolean
	disabled: boolean
	error: boolean
	required: boolean
}

/** State of a text field: focus, filled (to float the label), and the attributes that tie label, input and helper text together. */
export class Field extends Machine<FieldProps, FieldState> {
	private focused = false
	private typedFilled: boolean | undefined

	constructor(props: FieldProps) {
		super(props)
		this.typedFilled = props.defaultFilled
		this.start()
	}

	protected compute(): FieldState {
		const filled = this.props.filled ?? this.typedFilled ?? false
		return {
			id: this.props.id,
			focused: this.focused && !this.props.disabled,
			filled,
			shrink: this.focused || filled || this.props.alwaysShrink === true,
			disabled: this.props.disabled === true,
			error: this.props.error === true,
			required: this.props.required === true,
		}
	}

	connect(): { root: Part; label: Part; input: Part; trigger: Part; helper: Part; fieldset: Part } {
		const s = this.getSnapshot()
		const id = s.id
		const flags = {
			"data-focused": s.focused ? "" : undefined,
			"data-filled": s.filled ? "" : undefined,
			"data-error": s.error ? "" : undefined,
			"data-disabled": s.disabled ? "" : undefined,
			"data-shrink": s.shrink ? "" : undefined,
		}
		return {
			root: part(flags),
			label: part({ id: `${id}-label`, for: id, ...flags }),
			input: part(
				{
					id,
					"aria-invalid": s.error ? "true" : undefined,
					"aria-describedby": this.props.hasHelper ? `${id}-helper` : undefined,
					required: s.required || undefined,
					disabled: s.disabled || undefined,
					readonly: this.props.readOnly || undefined,
				},
				{
					focus: () => {
						this.focused = true
						this.refresh()
					},
					blur: () => {
						this.focused = false
						this.refresh()
					},
					input: (event) => {
						this.typedFilled = (event.target as HTMLInputElement).value !== ""
						this.refresh()
					},
				},
			),
			// For a control that is not an <input> (a select's combobox): the state that applies to any
			// control, without input-only attributes (`required`, `readonly`) and without an `id` of its own.
			trigger: part(
				{
					"aria-invalid": s.error ? "true" : undefined,
					"aria-describedby": this.props.hasHelper ? `${id}-helper` : undefined,
					"aria-required": s.required ? "true" : undefined,
				},
				{
					focus: () => {
						this.focused = true
						this.refresh()
					},
					blur: () => {
						this.focused = false
						this.refresh()
					},
				},
			),
			helper: part({ id: `${id}-helper`, ...flags }),
			fieldset: part({ "aria-hidden": "true", ...flags }),
		}
	}
}

export const createField = (props: FieldProps): Field => new Field(props)
