import { createToggleGroup, toggleButtonPart, type ToggleGroup as ToggleGroupMachine, type ToggleGroupState } from "@omnifront/ui"
import { createContext, forwardRef, useContext, useId, useMemo, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode } from "react"
import { ButtonGroupContext, type ButtonGroupDefaults } from "./button-group-context"
import { cx, mergeProps, toReactProps, useMachine } from "./internal"
import { useDefaultProps } from "./theme"

type Color = "primary" | "secondary" | "success" | "info" | "warning" | "error"

// The state is part of the value so that items (children passed in from outside) re-render when the pressed set changes.
const ToggleGroupContext = createContext<{ group: ToggleGroupMachine; state: ToggleGroupState; size?: "small" | "medium" | "large" | undefined; color?: Color | undefined } | null>(null)

export interface ToggleButtonGroupProps extends Omit<ComponentPropsWithoutRef<"div">, "onChange" | "defaultValue"> {
	/** Pressed value: a string (or null) when `exclusive`, a list of strings otherwise. Leave it out for an uncontrolled group. */
	value?: string | null | readonly string[] | undefined
	defaultValue?: string | null | readonly string[] | undefined
	/** At most one pressed at a time; pressing it again unpresses it. */
	exclusive?: boolean | undefined
	/** Called when the user presses a button: `(event, value)`. */
	onChange?: ((event: Event | undefined, value: string | null | string[]) => void) | undefined
	orientation?: "horizontal" | "vertical" | undefined
	size?: "small" | "medium" | "large" | undefined
	color?: Color | undefined
	disabled?: boolean | undefined
	fullWidth?: boolean | undefined
}

const toList = (v: string | null | readonly string[] | undefined): string[] | undefined => (v === undefined ? undefined : v === null ? [] : typeof v === "string" ? [v] : [...v])

/** A row (or column) of ToggleButtons: pick one (`exclusive`) or several. Real buttons with `aria-pressed`. */
export const ToggleButtonGroup = forwardRef<HTMLDivElement, ToggleButtonGroupProps>(function ToggleButtonGroup(rawProps, ref) {
	const { value, defaultValue, exclusive, onChange, orientation, size, color, disabled, fullWidth, className, children, ...rest } = useDefaultProps("OmniToggleButtonGroup", rawProps)
	const id = useId()
	const [group, state] = useMachine(() => createToggleGroup({ id, defaultValue: toList(defaultValue) }), {
		id,
		value: toList(value),
		exclusive,
		disabled,
		orientation,
		onValueChange: (next: string[], event?: Event) => onChange?.(event, exclusive ? (next[0] ?? null) : next),
	})
	const context = useMemo(() => ({ group, state, size, color }), [group, state, size, color])
	return (
		<ToggleGroupContext.Provider value={context}>
			<div ref={ref} {...mergeProps(toReactProps(group.connect().group), rest)} className={cx("omni-toggle-group", className)} data-full-width={fullWidth ? "" : undefined}>
				{children}
			</div>
		</ToggleGroupContext.Provider>
	)
})

export interface ToggleButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "value" | "onChange" | "color"> {
	/** What the group's value gets when this is pressed. */
	value?: string | undefined
	/** Only outside a ToggleButtonGroup: whether it is pressed. */
	selected?: boolean | undefined
	/** Only outside a ToggleButtonGroup: called with `(event, value)` when it is pressed. */
	onChange?: ((event: MouseEvent<HTMLButtonElement>, value: string | undefined) => void) | undefined
	color?: Color | undefined
	size?: "small" | "medium" | "large" | undefined
}

/** A button that is pressed or not (`aria-pressed`). Inside a ToggleButtonGroup its state comes from the group. */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton(rawProps, ref) {
	const { value, selected, onChange, color, size, disabled, className, onClick, children, ...rest } = useDefaultProps("OmniToggleButton", rawProps)
	const context = useContext(ToggleGroupContext)
	const part = context && value !== undefined ? context.group.item(value, { disabled }) : toggleButtonPart({ selected, disabled })
	const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
		onClick?.(event)
		if (!context) onChange?.(event, value)
	}
	const props = mergeProps(toReactProps(part), { ...rest, className, onClick: context ? onClick : handleClick, ref })
	return (
		<button {...(props as object)} data-color={color ?? context?.color ?? "primary"} data-size={size ?? context?.size ?? "medium"}>
			{children}
		</button>
	)
})

export interface ButtonGroupProps extends ButtonGroupDefaults, Omit<ComponentPropsWithoutRef<"div">, "color"> {
	orientation?: "horizontal" | "vertical" | undefined
	fullWidth?: boolean | undefined
	children?: ReactNode
}

/** Buttons joined into one control. `variant`, `color`, `size` and `disabled` apply to every Button inside. */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(rawProps, ref) {
	const { variant, color, size, disabled, disableElevation, orientation = "horizontal", fullWidth, className, children, ...rest } = useDefaultProps("OmniButtonGroup", rawProps)
	const defaults = useMemo(() => ({ variant, color, size, disabled, disableElevation }), [variant, color, size, disabled, disableElevation])
	return (
		<ButtonGroupContext.Provider value={defaults}>
			<div ref={ref} role="group" {...rest} className={cx("omni-button-group", className)} data-orientation={orientation} data-full-width={fullWidth ? "" : undefined}>
				{children}
			</div>
		</ButtonGroupContext.Provider>
	)
})
