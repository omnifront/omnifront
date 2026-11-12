import { createDialog, type CloseReason, type DialogParts } from "@omnifront/ui"
import { createContext, useContext, useEffect, useId, useState, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { cx, mergeProps, toReactProps, useMachine } from "./internal"
import { Portal, useDefaultProps } from "./theme"

export type DialogCloseReason = Extract<CloseReason, "escapeKeyDown" | "backdropClick" | "closeButton" | "programmatic">

export interface DialogProps {
	open: boolean
	/** Called when the user asks to close (Escape, click outside). You decide by setting `open`. */
	onClose?: (event: Event | undefined, reason: DialogCloseReason) => void
	children?: ReactNode | undefined
	maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false | undefined
	fullWidth?: boolean | undefined
	fullScreen?: boolean | undefined
	disableEscapeKeyDown?: boolean | undefined
	hideBackdrop?: boolean | undefined
	role?: "dialog" | "alertdialog" | undefined
	"aria-label"?: string | undefined
	className?: string | undefined
	/** Extra props for inner elements. */
	slotProps?: {
		backdrop?: ComponentPropsWithoutRef<"div"> | undefined
		container?: ComponentPropsWithoutRef<"div"> | undefined
		paper?: ComponentPropsWithoutRef<"div"> | undefined
	}
}

const DialogContext = createContext<DialogParts | null>(null)

/**
 * Modal dialog. Focus moves in and is trapped, Escape and a click outside ask to close, the page
 * behind stops scrolling and is hidden from screen readers, and focus returns to the opener.
 * Use with DialogTitle, DialogContent and DialogActions.
 */
export function Dialog(rawProps: DialogProps): ReactNode {
	const {
		open,
		onClose,
		children,
		maxWidth = "sm",
		fullWidth,
		fullScreen,
		disableEscapeKeyDown,
		hideBackdrop,
		role,
		className,
		slotProps,
		"aria-label": label,
	} = useDefaultProps("OmniDialog", rawProps)
	const id = useId()
	const [dialog, state] = useMachine(() => createDialog({ id }), {
		id,
		open,
		role,
		label,
		closeOnEscape: !disableEscapeKeyDown,
		onOpenChange: (_open: boolean, reason: CloseReason, event?: Event) => onClose?.(event, reason as DialogCloseReason),
	})
	const parts = dialog.connect()

	const [paper, setPaper] = useState<HTMLElement | null>(null)
	const [container, setContainer] = useState<HTMLElement | null>(null)
	useEffect(() => {
		if (!state.open || !paper) return undefined
		return dialog.attach({ content: paper, container: container ?? undefined })
	}, [dialog, state.open, paper, container])

	if (!state.mounted) return null
	const dataState = state.open ? "open" : "closed"
	return (
		<Portal>
			<DialogContext.Provider value={parts}>
				<div
					className={cx("omni-dialog", className)}
					data-max-width={maxWidth === false ? undefined : maxWidth}
					data-full-width={fullWidth ? "" : undefined}
					data-full-screen={fullScreen ? "" : undefined}
					data-state={dataState}
				>
					{hideBackdrop ? null : (
						<div {...mergeProps(toReactProps(parts.backdrop), { ...slotProps?.backdrop, className: cx("omni-dialog__backdrop", slotProps?.backdrop?.className) })} />
					)}
					<div
						{...mergeProps(toReactProps(parts.container), { ...slotProps?.container, className: cx("omni-dialog__container", slotProps?.container?.className) })}
						ref={setContainer}
					>
						<div {...mergeProps(toReactProps(parts.content), { ...slotProps?.paper, className: cx("omni-dialog__paper", slotProps?.paper?.className) })} ref={setPaper}>
							{children}
						</div>
					</div>
				</div>
			</DialogContext.Provider>
		</Portal>
	)
}

type Div = ComponentPropsWithoutRef<"div">

export function DialogTitle({ className, children, ...rest }: ComponentPropsWithoutRef<"h2">): ReactNode {
	const parts = useContext(DialogContext)
	return (
		<h2 {...mergeProps(parts ? toReactProps(parts.title) : {}, rest)} className={cx("omni-dialog__title", className)}>
			{children}
		</h2>
	)
}

export function DialogContent({ className, ...rest }: Div): ReactNode {
	return <div {...rest} className={cx("omni-dialog__content", className)} />
}

/** Secondary text inside DialogContent; it is what screen readers announce as the dialog's description. */
export function DialogContentText({ className, children, ...rest }: ComponentPropsWithoutRef<"p">): ReactNode {
	const parts = useContext(DialogContext)
	return (
		<p {...mergeProps(parts ? toReactProps(parts.description) : {}, rest)} className={cx("omni-dialog__content-text", className)}>
			{children}
		</p>
	)
}

export function DialogActions({ className, ...rest }: Div): ReactNode {
	return <div {...rest} className={cx("omni-dialog__actions", className)} />
}
