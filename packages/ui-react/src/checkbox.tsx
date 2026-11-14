import { createCheckbox } from "@omnifront/ui"
import { forwardRef, useEffect, useId, useRef, type ChangeEvent, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { cx, mergeProps, toReactProps, useMachine } from "./internal"
import { useDefaultProps } from "./theme"

type Color = "primary" | "secondary" | "success" | "info" | "warning" | "error"
type LabelPlacement = "end" | "start" | "top" | "bottom"

export interface CheckboxProps {
	/** Controlled value. Leave it out for an uncontrolled checkbox. */
	checked?: boolean | undefined
	defaultChecked?: boolean | undefined
	/** Called when the user changes it: `(event, checked)`. */
	onChange?: ((event: ChangeEvent<HTMLInputElement> | Event | undefined, checked: boolean) => void) | undefined
	/** The "some of them" state; a click then makes it checked. */
	indeterminate?: boolean | undefined
	label?: ReactNode | undefined
	labelPlacement?: LabelPlacement | undefined
	disabled?: boolean | undefined
	required?: boolean | undefined
	error?: boolean | undefined
	color?: Color | undefined
	size?: "small" | "medium" | undefined
	name?: string | undefined
	value?: string | undefined
	id?: string | undefined
	className?: string | undefined
	/** Props for the native `<input>` (for example `aria-label` when there is no `label`). */
	slotProps?: { input?: ComponentPropsWithoutRef<"input"> } | undefined
}

/**
 * Material checkbox. The control is a real `<input type="checkbox">` (Space, focus, forms and
 * screen readers all work natively); `label` makes the whole thing clickable.
 */
export const Checkbox = forwardRef<HTMLLabelElement, CheckboxProps>(function Checkbox(rawProps, ref) {
	const {
		checked,
		defaultChecked,
		onChange,
		indeterminate,
		label,
		labelPlacement = "end",
		disabled,
		required,
		error,
		color = "primary",
		size = "medium",
		name,
		value,
		id: idProp,
		className,
		slotProps,
	} = useDefaultProps("OmniCheckbox", rawProps)
	const generated = useId()
	const id = idProp ?? generated
	const [box, state] = useMachine(() => createCheckbox({ id, defaultChecked }), {
		id,
		checked,
		indeterminate,
		disabled,
		required,
		error,
		onCheckedChange: (next: boolean, event?: Event) => onChange?.(event, next),
	})
	const input = useRef<HTMLInputElement | null>(null)
	// `indeterminate` has no HTML attribute; the browser also clears it on click, so set it after every change.
	useEffect(() => {
		if (input.current) input.current.indeterminate = state.indeterminate
	}, [state.indeterminate, state.checked])

	return (
		<label
			ref={ref}
			className={cx("omni-checkbox", className)}
			data-size={size}
			data-color={color}
			data-label-placement={labelPlacement === "end" ? undefined : labelPlacement}
			data-disabled={state.disabled ? "" : undefined}
			data-error={error ? "" : undefined}
		>
			<span className="omni-checkbox__control">
				<input
					{...mergeProps(toReactProps(box.connect().input), { ...slotProps?.input, name, value, className: "omni-checkbox__input", ref: input })}
				/>
				<span className="omni-checkbox__box" aria-hidden="true" />
			</span>
			{label !== undefined && label !== null && label !== false ? <span className="omni-checkbox__label">{label}</span> : null}
		</label>
	)
})
