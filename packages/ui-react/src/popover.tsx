import { createPopover, type CloseReason } from "@omnifront/ui"
import { autoPosition, type Placement } from "@omnifront/ui/position"
import { forwardRef, useEffect, useId, useState, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { cx, mergeProps, toReactProps, useMachine } from "./internal"
import { Portal, useDefaultProps } from "./theme"

export type PopoverCloseReason = Extract<CloseReason, "escapeKeyDown" | "outsidePress" | "programmatic">

export interface PopoverProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
	open: boolean
	/** The element it hangs from. A press on it is not "outside". */
	anchorEl: Element | null | undefined
	onClose?: ((event: Event | undefined, reason: PopoverCloseReason) => void) | undefined
	/** Default `bottom-start`; it flips when there is no room. */
	placement?: Placement | undefined
	children?: ReactNode | undefined
	/** A popover is a dialog and needs a name: `aria-label` or `aria-labelledby`. */
	"aria-label"?: string | undefined
	"aria-labelledby"?: string | undefined
}

/** A panel next to an element, holding anything. Not modal: the page stays usable. Escape and a press outside ask to close; focus moves in and goes back. */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(function Popover(rawProps, ref) {
	const { open, anchorEl, onClose, placement = "bottom-start", children, className, "aria-label": label, "aria-labelledby": labelledBy, ...rest } = useDefaultProps("OmniPopover", rawProps)
	const id = useId()
	const [popover, state] = useMachine(() => createPopover({ id }), {
		id,
		open,
		label,
		labelledBy,
		onOpenChange: (_open: boolean, reason: CloseReason, event?: Event) => onClose?.(event, reason as PopoverCloseReason),
	})
	const [content, setContent] = useState<HTMLElement | null>(null)
	useEffect(
		() => (state.open && content ? popover.attach({ content, anchor: anchorEl, position: (anchor, el) => autoPosition(anchor, el, { placement, offset: 8 }) }) : undefined),
		[popover, state.open, content, anchorEl, placement],
	)
	if (!state.mounted) return null
	return (
		<Portal>
			<div {...mergeProps(toReactProps(popover.connect().content), { ...rest, className: cx("omni-popover", className) })} ref={(node) => {
				setContent(node)
				if (typeof ref === "function") ref(node)
				else if (ref) ref.current = node
			}}>
				{children}
			</div>
		</Portal>
	)
})
