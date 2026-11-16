import { createDialog, type CloseReason } from "@omnifront/ui"
import { forwardRef, useEffect, useId, useState, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { cx, mergeProps, toReactProps, useMachine } from "./internal"
import { Portal, useDefaultProps } from "./theme"

export type DrawerCloseReason = Extract<CloseReason, "escapeKeyDown" | "backdropClick" | "programmatic">

export interface DrawerProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
	/** `temporary` (a modal that closes on Escape and a click outside), `persistent` (slides in and out, page stays usable) or `permanent` (always there). Default `temporary`. */
	variant?: "temporary" | "persistent" | "permanent" | undefined
	/** Which edge it sits on: `start` and `end` follow the writing direction. Default `start`. */
	anchor?: "start" | "end" | "top" | "bottom" | undefined
	open?: boolean | undefined
	onClose?: ((event: Event | undefined, reason: DrawerCloseReason) => void) | undefined
	/** Width of a side drawer, in px or any CSS length. Default 240px. */
	width?: number | string | undefined
	children?: ReactNode | undefined
	/** Names a temporary drawer's dialog. Default "Navigation". */
	"aria-label"?: string | undefined
}

/**
 * A panel at the edge of the screen. `temporary` is a modal dialog (focus trap, Escape, scroll lock);
 * `persistent` and `permanent` are an `<aside>` landmark that does not take focus.
 */
export const Drawer = forwardRef<HTMLElement, DrawerProps>(function Drawer(rawProps, ref) {
	const { variant = "temporary", anchor = "start", open = false, onClose, width, children, className, style, "aria-label": label = "Navigation", ...rest } = useDefaultProps("OmniDrawer", rawProps)
	const id = useId()
	const temporary = variant === "temporary"
	const [dialog, state] = useMachine(() => createDialog({ id }), {
		id,
		open: temporary ? open : false,
		label,
		onOpenChange: (_open: boolean, reason: CloseReason, event?: Event) => onClose?.(event, reason as DrawerCloseReason),
	})
	const [paper, setPaper] = useState<HTMLElement | null>(null)
	const [container, setContainer] = useState<HTMLElement | null>(null)
	useEffect(() => (temporary && state.open && paper ? dialog.attach({ content: paper, container: container ?? undefined }) : undefined), [dialog, temporary, state.open, paper, container])
	const sized = width === undefined ? style : { ...style, "--_w": typeof width === "number" ? `${width}px` : width }
	const common = { "data-variant": variant, "data-anchor": anchor }
	if (!temporary) {
		const closed = variant === "persistent" && !open
		return (
			<aside {...rest} {...common} data-state={closed ? "closed" : "open"} className={cx("omni-drawer", className)} style={sized} aria-label={label} ref={ref}>
				<div className="omni-drawer__paper" data-state={closed ? "closed" : "open"}>
					{children}
				</div>
			</aside>
		)
	}
	if (!state.mounted) return null
	const parts = dialog.connect()
	return (
		<Portal>
			<div {...rest} {...common} className={cx("omni-drawer", className)} style={sized} ref={ref as never}>
				<div {...toReactProps(parts.backdrop)} className="omni-drawer__backdrop" />
				<div {...mergeProps(toReactProps(parts.container), { className: "omni-drawer__container" })} ref={setContainer}>
					<div {...mergeProps(toReactProps(parts.content), { className: "omni-drawer__paper" })} ref={setPaper}>
						{children}
					</div>
				</div>
			</div>
		</Portal>
	)
})
