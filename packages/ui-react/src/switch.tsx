import { createCheckbox } from "@omnifront/ui"
import { forwardRef, useId, type ChangeEvent, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { cx, mergeProps, toReactProps, useMachine } from "./internal"
import { useDefaultProps } from "./theme"

export interface SwitchProps {
	/** Controlled value. Leave it out for an uncontrolled switch. */
	checked?: boolean | undefined
	defaultChecked?: boolean | undefined
	/** Called when the user flips it: `(event, checked)`. */
	onChange?: ((event: ChangeEvent<HTMLInputElement> | Event | undefined, checked: boolean) => void) | undefined
	label?: ReactNode | undefined
	labelPlacement?: "end" | "start" | "top" | "bottom" | undefined
	disabled?: boolean | undefined
	required?: boolean | undefined
	error?: boolean | undefined
	color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | undefined
	size?: "small" | "medium" | undefined
	name?: string | undefined
	value?: string | undefined
	id?: string | undefined
	className?: string | undefined
	/** Props for the native `<input>` (for example `aria-label` when there is no `label`). */
	slotProps?: { input?: ComponentPropsWithoutRef<"input"> } | undefined
}

/**
 * Material switch: an on/off setting. The control is a real `<input type="checkbox" role="switch">`
 * (Space, focus, forms and screen readers work natively) under a track and a thumb.
 */
export const Switch = forwardRef<HTMLLabelElement, SwitchProps>(function Switch(rawProps, ref) {
	const {
		checked,
		defaultChecked,
		onChange,
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
	} = useDefaultProps("OmniSwitch", rawProps)
	const generated = useId()
	const id = idProp ?? generated
	const [machine, state] = useMachine(() => createCheckbox({ id, defaultChecked, role: "switch" }), {
		id,
		checked,
		disabled,
		required,
		error,
		onCheckedChange: (next: boolean, event?: Event) => onChange?.(event, next),
	})
	return (
		<label
			ref={ref}
			className={cx("omni-switch", className)}
			data-size={size}
			data-color={color}
			data-label-placement={labelPlacement === "end" ? undefined : labelPlacement}
			data-disabled={state.disabled ? "" : undefined}
			data-error={error ? "" : undefined}
		>
			<span className="omni-switch__control">
				<input {...mergeProps(toReactProps(machine.connect().input), { ...slotProps?.input, name, value, className: "omni-switch__input" })} />
				<span className="omni-switch__track" aria-hidden="true" />
				<span className="omni-switch__thumb" aria-hidden="true" />
			</span>
			{label !== undefined && label !== null && label !== false ? <span className="omni-switch__label">{label}</span> : null}
		</label>
	)
})
