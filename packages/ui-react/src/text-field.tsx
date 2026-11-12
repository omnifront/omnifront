import { createField, type FieldProps } from "@omnifront/ui"
import { forwardRef, useCallback, useId, useRef, type ChangeEvent, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { cx, mergeProps, toReactProps, useMachine } from "./internal"
import { useDefaultProps } from "./theme"

export interface TextFieldProps
	extends Omit<ComponentPropsWithoutRef<"input">, "size" | "color" | "value" | "defaultValue" | "onChange" | "prefix"> {
	label?: ReactNode | undefined
	value?: string | number | undefined
	defaultValue?: string | number | undefined
	onChange?: ((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | undefined
	helperText?: ReactNode | undefined
	error?: boolean | undefined
	variant?: "outlined" | "filled" | "standard" | undefined
	size?: "small" | "medium" | undefined
	color?: "primary" | "secondary" | "success" | "info" | "warning" | undefined
	fullWidth?: boolean | undefined
	/** A `<textarea>` instead of an `<input>`. */
	multiline?: boolean | undefined
	rows?: number | undefined
	startAdornment?: ReactNode | undefined
	endAdornment?: ReactNode | undefined
	/** Props for the inner `<input>` / `<textarea>` (for example `maxLength`). */
	slotProps?: { input?: ComponentPropsWithoutRef<"input"> & ComponentPropsWithoutRef<"textarea"> } | undefined
	inputRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement> | undefined
}

/** Material text field: floating label, three variants, helper text, error state, adornments, multiline. */
export const TextField = forwardRef<HTMLDivElement, TextFieldProps>(function TextField(rawProps, ref) {
	const {
		label,
		value,
		defaultValue,
		onChange,
		onFocus,
		onBlur,
		helperText,
		error,
		variant = "outlined",
		size = "medium",
		color = "primary",
		fullWidth,
		multiline,
		rows,
		startAdornment,
		endAdornment,
		slotProps,
		inputRef,
		id: idProp,
		className,
		disabled,
		required,
		readOnly,
		placeholder,
		...inputRest
	} = useDefaultProps("OmniTextField", rawProps)
	const generated = useId()
	const id = idProp ?? generated
	const controlled = value !== undefined
	const hasLabel = label !== undefined && label !== null && label !== false
	const hasHelper = helperText !== undefined && helperText !== null && helperText !== false

	const props: Partial<FieldProps> = {
		id,
		disabled,
		error,
		required,
		readOnly,
		hasHelper,
		// Controlled: the value decides. Uncontrolled: the machine follows typing, starting from defaultValue.
		filled: controlled ? String(value) !== "" : undefined,
		defaultFilled: defaultValue !== undefined && String(defaultValue) !== "",
		alwaysShrink: Boolean(startAdornment) || undefined,
	}
	const [field, state] = useMachine(() => createField({ id, defaultFilled: props.defaultFilled }), props)
	const parts = field.connect()

	const localRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
	const setInput = useCallback(
		(node: HTMLInputElement | HTMLTextAreaElement | null) => {
			localRef.current = node
			if (typeof inputRef === "function") inputRef(node)
			else if (inputRef) (inputRef as { current: unknown }).current = node
		},
		[inputRef],
	)

	const inputProps = mergeProps(toReactProps(parts.input), {
		...inputRest,
		...slotProps?.input,
		className: cx("omni-text-field__input", slotProps?.input?.className),
		value,
		defaultValue,
		placeholder,
		rows: multiline ? (rows ?? 1) : undefined,
		onChange,
		onFocus,
		onBlur,
		ref: setInput,
	})
	const Input = multiline ? "textarea" : "input"
	const flags = toReactProps(parts.root)

	return (
		<div
			ref={ref}
			{...flags}
			className={cx("omni-text-field", className)}
			data-variant={variant}
			data-size={size}
			data-color={color}
			data-full-width={fullWidth ? "" : undefined}
			data-has-label={hasLabel ? "" : undefined}
		>
			{hasLabel ? (
				<label {...toReactProps(parts.label)} className="omni-text-field__label">
					{label}
					{state.required ? <span className="omni-text-field__required" aria-hidden="true">{" *"}</span> : null}
				</label>
			) : null}
			<div className="omni-text-field__control" onClick={() => localRef.current?.focus()}>
				{startAdornment ? <span className="omni-text-field__adornment" data-position="start">{startAdornment}</span> : null}
				<Input {...(inputProps as object)} />
				{endAdornment ? <span className="omni-text-field__adornment" data-position="end">{endAdornment}</span> : null}
				<fieldset {...toReactProps(parts.fieldset)} className="omni-text-field__fieldset">
					<legend className="omni-text-field__legend">{hasLabel ? <span>{label}</span> : null}</legend>
				</fieldset>
			</div>
			{hasHelper ? (
				<p {...toReactProps(parts.helper)} className="omni-text-field__helper">
					{helperText}
				</p>
			) : null}
		</div>
	)
})
