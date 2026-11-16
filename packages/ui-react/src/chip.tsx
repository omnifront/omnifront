import { ICON_PATHS, createChip } from "@omnifront/ui"
import { forwardRef, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode } from "react"
import { cx, mergeProps, toReactProps, useMachine } from "./internal"
import { useDefaultProps } from "./theme"

export interface ChipProps extends Omit<ComponentPropsWithoutRef<"div">, "color" | "onClick"> {
	label?: ReactNode | undefined
	variant?: "filled" | "outlined" | undefined
	color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" | undefined
	size?: "small" | "medium" | undefined
	/** An Avatar at the start. */
	avatar?: ReactNode | undefined
	/** An icon at the start. */
	icon?: ReactNode | undefined
	/** Makes the chip a button. `onClick` alone also does. */
	onClick?: ((event: MouseEvent<HTMLElement>) => void) | undefined
	clickable?: boolean | undefined
	/** Shows a delete icon; Backspace or Delete on the focused chip calls it too. */
	onDelete?: ((event: Event) => void) | undefined
	disabled?: boolean | undefined
}

/**
 * A compact tag, filter or choice. With `onClick` it is a button (Enter and Space); with `onDelete`
 * it shows a delete icon and Backspace / Delete on the focused chip removes it.
 */
export const Chip = forwardRef<HTMLDivElement, ChipProps>(function Chip(rawProps, ref) {
	const { label, variant = "filled", color = "default", size = "medium", avatar, icon, onClick, clickable, onDelete, disabled, className, children, ...rest } = useDefaultProps("OmniChip", rawProps)
	const [machine, state] = useMachine(() => createChip(), {
		clickable: clickable ?? onClick !== undefined,
		deletable: onDelete !== undefined,
		disabled,
		onDelete,
	})
	const parts = machine.connect()
	void state
	return (
		<div
			{...mergeProps(toReactProps(parts.root), { ...rest, onClick, className: cx("omni-chip", className), "data-variant": variant, "data-color": color, "data-size": size })}
			ref={ref}
		>
			{avatar}
			{icon !== undefined && icon !== null && <span className="omni-chip__icon">{icon}</span>}
			<span className="omni-chip__label">{label ?? children}</span>
			{onDelete && (
				<svg {...toReactProps(parts.deleteIcon)} viewBox="0 0 24 24" focusable="false">
					<path d={ICON_PATHS.cancel} />
				</svg>
			)}
		</div>
	)
})
