import { createTooltip } from "@omnifront/ui"
import { autoPosition, type Placement } from "@omnifront/ui/position"
import { useEffect, useId, useState, type ReactNode } from "react"
import { mergeProps, toReactProps, useMachine } from "./internal"
import { Portal, useDefaultProps } from "./theme"

export interface TooltipProps {
	/** What it says. Empty means no tooltip. It describes the element; it is not its name. */
	title: ReactNode
	/** The one element it describes (a button, an icon button). */
	children: ReactNode
	/** Default `bottom`; it flips when there is no room. */
	placement?: Placement | undefined
	/** Controlled. Leave out for hover and focus to decide. */
	open?: boolean | undefined
	defaultOpen?: boolean | undefined
	onOpen?: ((event: Event | undefined) => void) | undefined
	onClose?: ((event: Event | undefined) => void) | undefined
	/** Milliseconds the pointer rests before it opens. Default 100. Keyboard focus opens at once. */
	enterDelay?: number | undefined
	leaveDelay?: number | undefined
	/** Close as soon as the pointer leaves the trigger, even towards the tooltip. */
	disableInteractive?: boolean | undefined
	className?: string | undefined
}

/**
 * A short description that appears on hover and keyboard focus and goes on Escape. The trigger is
 * the single element inside; the tooltip is wired to it with `aria-describedby` while it is open.
 */
export function Tooltip(rawProps: TooltipProps): ReactNode {
	const { title, children, placement = "bottom", open, defaultOpen, onOpen, onClose, enterDelay, leaveDelay, disableInteractive, className } = useDefaultProps("OmniTooltip", rawProps)
	const id = useId()
	const hasTitle = title !== undefined && title !== null && title !== false && title !== ""
	const [tooltip, state] = useMachine(() => createTooltip({ id, defaultOpen }), {
		id,
		open: hasTitle ? open : false,
		enterDelay,
		leaveDelay,
		disableInteractive,
		disabled: !hasTitle,
		onOpenChange: (next: boolean, _reason: unknown, event?: Event) => (next ? onOpen?.(event) : onClose?.(event)),
	})
	const [wrapper, setWrapper] = useState<HTMLElement | null>(null)
	const [floating, setFloating] = useState<HTMLElement | null>(null)
	useEffect(() => {
		const trigger = wrapper?.firstElementChild
		return trigger instanceof HTMLElement ? tooltip.attachTrigger(trigger) : undefined
	}, [tooltip, wrapper, children])
	useEffect(() => {
		const trigger = wrapper?.firstElementChild
		if (!state.mounted || !floating || !(trigger instanceof HTMLElement)) return undefined
		return tooltip.attach({ trigger, tooltip: floating, position: (anchor, el) => autoPosition(anchor, el, { placement, offset: 8 }) })
	}, [tooltip, state.mounted, floating, wrapper, placement])
	return (
		<>
			<span className="omni-tooltip-trigger" ref={setWrapper}>
				{children}
			</span>
			{state.mounted && hasTitle && (
				<Portal>
					<div {...mergeProps(toReactProps(tooltip.connect().tooltip), { className: ["omni-tooltip", className].filter(Boolean).join(" ") })} ref={setFloating}>
						{title}
					</div>
				</Portal>
			)}
		</>
	)
}
