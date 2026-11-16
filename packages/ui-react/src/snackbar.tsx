import { createSnackbar, type CloseReason } from "@omnifront/ui"
import { forwardRef, useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { mergeProps, toReactProps, useMachine } from "./internal"
import { Portal, useDefaultProps } from "./theme"

export type SnackbarCloseReason = Extract<CloseReason, "timeout" | "outsidePress" | "escapeKeyDown" | "programmatic">

export interface SnackbarProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
	open: boolean
	/** Called when it asks to close (after `autoHideDuration`, on Escape, on a press outside). You decide by setting `open`. */
	onClose?: ((event: Event | undefined, reason: SnackbarCloseReason) => void) | undefined
	/** Milliseconds before it asks to close. Leave out to stay until closed. Hovering or focusing it pauses the timer. */
	autoHideDuration?: number | null | undefined
	anchorOrigin?: { vertical: "top" | "bottom"; horizontal: "left" | "center" | "right" } | undefined
	message?: ReactNode | undefined
	/** At the far end of the message (a Button). */
	action?: ReactNode | undefined
	/** Your own content (an Alert) instead of `message` and `action`. */
	children?: ReactNode | undefined
	/** A press outside does not close it. */
	disableClickAway?: boolean | undefined
}

/**
 * A short message at the edge of the screen. It is a polite live region (`role="status"`); put an
 * `Alert` inside for a severity. Only one at a time is the app's job: show the next when `onClose` ran.
 */
export const Snackbar = forwardRef<HTMLDivElement, SnackbarProps>(function Snackbar(rawProps, ref) {
	const { open, onClose, autoHideDuration, anchorOrigin, message, action, children, disableClickAway, className, ...rest } = useDefaultProps("OmniSnackbar", rawProps)
	const [snackbar, state] = useMachine(() => createSnackbar(), {
		open,
		autoHideDuration,
		anchorOrigin,
		closeOnOutsidePress: !disableClickAway,
		onOpenChange: (_open: boolean, reason: CloseReason, event?: Event) => onClose?.(event, reason as SnackbarCloseReason),
	})
	const [content, setContent] = useState<HTMLElement | null>(null)
	useEffect(() => (state.open && content ? snackbar.attach({ content }) : undefined), [snackbar, state.open, content])
	if (!state.mounted) return null
	const parts = snackbar.connect()
	return (
		<Portal>
			<div {...mergeProps(toReactProps(parts.root), { ...rest, className: ["omni-snackbar", className].filter(Boolean).join(" ") })} ref={ref}>
				<div {...toReactProps(parts.content)} className="omni-snackbar__content" ref={setContent}>
					{children ?? (
						<>
							<div className="omni-snackbar__message">{message}</div>
							{action && <div className="omni-snackbar__action">{action}</div>}
						</>
					)}
				</div>
			</div>
		</Portal>
	)
})
