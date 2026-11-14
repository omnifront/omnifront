import { createRadioGroup, formGroupParts, type RadioGroup as RadioGroupMachine, type RadioGroupState } from "@omnifront/ui"
import { createContext, forwardRef, useContext, useId, useMemo, type ChangeEvent, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { cx, mergeProps, toReactProps, useMachine } from "./internal"
import { useDefaultProps } from "./theme"

type Color = "primary" | "secondary" | "success" | "info" | "warning" | "error"
type LabelPlacement = "end" | "start" | "top" | "bottom"

// The state is part of the value so that radios (which are children passed in from outside) re-render when the choice changes.
const RadioGroupContext = createContext<{ group: RadioGroupMachine; state: RadioGroupState } | null>(null)

export interface RadioGroupProps {
	label?: ReactNode | undefined
	helperText?: ReactNode | undefined
	/** Controlled value. Leave it out for an uncontrolled group. */
	value?: string | undefined
	defaultValue?: string | undefined
	/** Called when the user chooses a radio: `(event, value)`. */
	onChange?: ((event: ChangeEvent<HTMLInputElement> | Event | undefined, value: string) => void) | undefined
	/** The `name` the radios share. Defaults to a generated one. */
	name?: string | undefined
	error?: boolean | undefined
	disabled?: boolean | undefined
	required?: boolean | undefined
	/** Lay the radios out in a row. */
	row?: boolean | undefined
	id?: string | undefined
	className?: string | undefined
	children?: ReactNode
}

/**
 * A group of radio buttons: one value chosen at a time. The radios are real `<input type="radio">`
 * with a shared name, so the arrow keys move the choice and Tab leaves the group, natively.
 */
export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(function RadioGroup(rawProps, ref) {
	const { label, helperText, value, defaultValue, onChange, name, error, disabled, required, row, id: idProp, className, children } =
		useDefaultProps("OmniRadioGroup", rawProps)
	const generated = useId()
	const id = idProp ?? generated
	const hasLabel = label !== undefined && label !== null && label !== false
	const hasHelper = helperText !== undefined && helperText !== null && helperText !== false
	const [group, state] = useMachine(() => createRadioGroup({ id, defaultValue }), {
		id,
		name,
		value,
		disabled,
		required,
		error,
		row,
		hasLabel,
		hasHelper,
		onValueChange: (next: string, event?: Event) => onChange?.(event, next),
	})
	const parts = group.connect()
	const context = useMemo(() => ({ group, state }), [group, state])
	return (
		<RadioGroupContext.Provider value={context}>
			<fieldset ref={ref} {...toReactProps(parts.group)} className={cx("omni-form-group", className)}>
				{hasLabel ? <legend {...toReactProps(parts.label)} className="omni-form-group__label">{label}</legend> : null}
				<div {...toReactProps(parts.items)} className="omni-form-group__items">{children}</div>
				{hasHelper ? <p {...toReactProps(parts.helper)} className="omni-form-group__helper">{helperText}</p> : null}
			</fieldset>
		</RadioGroupContext.Provider>
	)
})

export interface RadioProps {
	/** What the group's value becomes when this radio is chosen. */
	value: string
	label?: ReactNode | undefined
	labelPlacement?: LabelPlacement | undefined
	disabled?: boolean | undefined
	color?: Color | undefined
	size?: "small" | "medium" | undefined
	/** Only outside a RadioGroup: the controlled state, change handler and name. */
	checked?: boolean | undefined
	onChange?: ((event: ChangeEvent<HTMLInputElement>) => void) | undefined
	name?: string | undefined
	id?: string | undefined
	className?: string | undefined
	slotProps?: { input?: ComponentPropsWithoutRef<"input"> } | undefined
}

/** One radio button. Inside a RadioGroup its state comes from the group. */
export const Radio = forwardRef<HTMLLabelElement, RadioProps>(function Radio(rawProps, ref) {
	const { value, label, labelPlacement = "end", disabled, color = "primary", size = "medium", checked, onChange, name, id, className, slotProps } =
		useDefaultProps("OmniRadio", rawProps)
	const context = useContext(RadioGroupContext)
	const groupDisabled = context?.state.disabled === true
	const isDisabled = disabled === true || groupDisabled
	const input = context
		? toReactProps(context.group.radio(value, { disabled }))
		: { type: "radio", name, value, checked, disabled: disabled || undefined, onChange }
	return (
		<label
			ref={ref}
			className={cx("omni-radio", className)}
			data-size={size}
			data-color={color}
			data-label-placement={labelPlacement === "end" ? undefined : labelPlacement}
			data-disabled={isDisabled ? "" : undefined}
		>
			<span className="omni-radio__control">
				<input {...mergeProps(input, { ...slotProps?.input, id, className: "omni-radio__input" })} />
				<span className="omni-radio__box" aria-hidden="true" />
			</span>
			{label !== undefined && label !== null && label !== false ? <span className="omni-radio__label">{label}</span> : null}
		</label>
	)
})

export interface FormGroupProps {
	label?: ReactNode | undefined
	helperText?: ReactNode | undefined
	error?: boolean | undefined
	disabled?: boolean | undefined
	/** Lay the items out in a row. */
	row?: boolean | undefined
	id?: string | undefined
	className?: string | undefined
	children?: ReactNode
}

/** A labelled group of related controls (a `<fieldset>` with a `<legend>`), for example several Checkboxes. */
export const FormGroup = forwardRef<HTMLFieldSetElement, FormGroupProps>(function FormGroup(rawProps, ref) {
	const { label, helperText, error, disabled, row, id: idProp, className, children } = useDefaultProps("OmniFormGroup", rawProps)
	const generated = useId()
	const hasLabel = label !== undefined && label !== null && label !== false
	const hasHelper = helperText !== undefined && helperText !== null && helperText !== false
	const parts = formGroupParts({ id: idProp ?? generated, hasLabel, hasHelper, error, disabled, row })
	return (
		<fieldset ref={ref} {...toReactProps(parts.group)} className={cx("omni-form-group", className)}>
			{hasLabel ? <legend {...toReactProps(parts.label)} className="omni-form-group__label">{label}</legend> : null}
			<div {...toReactProps(parts.items)} className="omni-form-group__items">{children}</div>
			{hasHelper ? <p {...toReactProps(parts.helper)} className="omni-form-group__helper">{helperText}</p> : null}
		</fieldset>
	)
})
