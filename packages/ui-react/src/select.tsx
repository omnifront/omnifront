import { createField, createSelect, mergeParts, type CloseReason, type SelectOption } from "@omnifront/ui"
import { autoPosition } from "@omnifront/ui/position"
import { forwardRef, useEffect, useId, useState, type ReactNode } from "react"
import { cx, toReactProps, useMachine } from "./internal"
import { Portal, useDefaultProps } from "./theme"

export type SelectCloseReason = Extract<CloseReason, "escapeKeyDown" | "outsidePress" | "tab" | "select" | "trigger" | "programmatic">

interface SelectBaseProps {
	label?: ReactNode | undefined
	/** What can be chosen. `value` is what `onChange` reports; `label` is what the user sees. */
	options: readonly SelectOption[]
	open?: boolean | undefined
	defaultOpen?: boolean | undefined
	onOpenChange?: ((open: boolean, reason: SelectCloseReason) => void) | undefined
	helperText?: ReactNode | undefined
	error?: boolean | undefined
	disabled?: boolean | undefined
	required?: boolean | undefined
	variant?: "outlined" | "filled" | "standard" | undefined
	size?: "small" | "medium" | undefined
	color?: "primary" | "secondary" | "success" | "info" | "warning" | undefined
	fullWidth?: boolean | undefined
	/** Name for a form: the value is also written to a hidden `<input>`. */
	name?: string | undefined
	id?: string | undefined
	className?: string | undefined
}

export interface SingleSelectProps extends SelectBaseProps {
	multiple?: false | undefined
	/** Controlled value. Leave it out for an uncontrolled select. `""` means nothing is selected. */
	value?: string | undefined
	defaultValue?: string | undefined
	/** Called when the user chooses an option: `(event, value)`. */
	onChange?: ((event: Event | undefined, value: string) => void) | undefined
}

export interface MultipleSelectProps extends SelectBaseProps {
	/** Several options at once: choosing one toggles it and the list stays open. */
	multiple: true
	value?: readonly string[] | undefined
	defaultValue?: readonly string[] | undefined
	/** Called when the user toggles an option: `(event, values)`. */
	onChange?: ((event: Event | undefined, value: string[]) => void) | undefined
}

export type SelectProps = SingleSelectProps | MultipleSelectProps

/**
 * Material select: looks like a TextField, opens a listbox of options. Keyboard: Enter, Space and
 * the arrows open it; in the list the arrows, Home, End and typing move focus, Enter or Space
 * choose, Escape closes. It is a `combobox` with a `listbox` for assistive technology.
 */
export const Select = forwardRef<HTMLDivElement, SelectProps>(function Select(rawProps, ref) {
	const {
		label,
		options,
		value,
		defaultValue,
		onChange,
		multiple,
		open,
		defaultOpen,
		onOpenChange,
		helperText,
		error,
		disabled,
		required,
		variant = "outlined",
		size = "medium",
		color = "primary",
		fullWidth,
		name,
		id: idProp,
		className,
	} = useDefaultProps("OmniSelect", rawProps) as SelectBaseProps & {
		multiple?: boolean | undefined
		value?: string | readonly string[] | undefined
		defaultValue?: string | readonly string[] | undefined
		onChange?: ((event: Event | undefined, value: string | string[]) => void) | undefined
	}
	const generated = useId()
	const id = idProp ?? generated
	const hasLabel = label !== undefined && label !== null && label !== false
	const hasHelper = helperText !== undefined && helperText !== null && helperText !== false

	const asList = (v: string | readonly string[] | undefined): string[] | undefined => (v === undefined ? undefined : typeof v === "string" ? (v === "" ? [] : [v]) : [...v])
	const [select, state] = useMachine(
		() => createSelect({ id, options, defaultValue: typeof defaultValue === "string" ? defaultValue : undefined, defaultValues: asList(defaultValue), multiple, defaultOpen }),
		{
		id,
		options,
		multiple,
		value: typeof value === "string" ? value : undefined,
		values: multiple ? asList(value) : undefined,
		disabled,
		open,
		onValueChange: (next: string, event?: Event) => onChange?.(event, next),
		onValuesChange: (next: string[], event?: Event) => onChange?.(event, next),
		onOpenChange: (next: boolean, reason: CloseReason) => onOpenChange?.(next, reason as SelectCloseReason),
		},
	)
	const [field, fieldState] = useMachine(() => createField({ id }), { id, disabled, error, required, hasHelper, filled: state.filled })
	const parts = select.connect()
	const fieldParts = field.connect()

	const [trigger, setTrigger] = useState<HTMLElement | null>(null)
	const [list, setList] = useState<HTMLElement | null>(null)
	useEffect(() => {
		if (!state.open || !list || !trigger) return undefined
		return select.attach({ content: list, trigger, position: (anchor, floating) => autoPosition(anchor, floating, { matchWidth: true }) })
	}, [select, state.open, list, trigger])

	return (
		<div
			ref={ref}
			{...toReactProps(fieldParts.root)}
			className={cx("omni-text-field", "omni-select", className)}
			data-variant={variant}
			data-size={size}
			data-color={color}
			data-full-width={fullWidth ? "" : undefined}
			data-has-label={hasLabel ? "" : undefined}
		>
			{hasLabel ? (
				<label {...toReactProps(fieldParts.label)} htmlFor={undefined} className="omni-text-field__label" onClick={() => trigger?.focus()}>
					{label}
					{fieldState.required ? <span className="omni-text-field__required" aria-hidden="true">{" *"}</span> : null}
				</label>
			) : null}
			<div className="omni-text-field__control">
				<div
					{...toReactProps(mergeParts(parts.trigger, fieldParts.trigger))}
					ref={setTrigger}
					className="omni-text-field__input omni-select__trigger"
				>
					{state.label}
				</div>
				<span className="omni-select__icon" aria-hidden="true" data-state={state.open ? "open" : "closed"} />
				{name
					? state.multiple
						? state.values.map((v) => <input key={v} type="hidden" name={name} value={v} />)
						: <input type="hidden" name={name} value={state.value ?? ""} />
					: null}
				<fieldset {...toReactProps(fieldParts.fieldset)} className="omni-text-field__fieldset">
					<legend className="omni-text-field__legend">{hasLabel ? <span>{label}</span> : null}</legend>
				</fieldset>
			</div>
			{hasHelper ? (
				<p {...toReactProps(fieldParts.helper)} className="omni-text-field__helper">
					{helperText}
				</p>
			) : null}
			{state.mounted ? (
				<Portal>
					<ul {...toReactProps(parts.listbox)} ref={setList} className="omni-menu omni-select__listbox">
						{options.map((option) => (
							<li key={option.value} {...toReactProps(select.option(option))} className="omni-menu__item">
								{option.label}
							</li>
						))}
					</ul>
				</Portal>
			) : null}
		</div>
	)
})
