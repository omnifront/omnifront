import type { TimerHandle } from "@omnifront/core"
import { OpenMachine, part, type OpenProps, type OpenState, type Part } from "./machine"

export interface TooltipProps extends OpenProps {
	/** Base for the tooltip's id (the trigger points at it with `aria-describedby`). */
	id: string
	/** Milliseconds the pointer rests on the trigger before it opens. Default 100. Keyboard focus opens at once. */
	enterDelay?: number | undefined
	/** Milliseconds after the pointer leaves before it closes. Default 0. */
	leaveDelay?: number | undefined
	/** Do not open on hover or focus: only `open` (controlled) shows it. */
	disabled?: boolean | undefined
	/** The tooltip closes the moment the pointer leaves the trigger, even towards the tooltip (default: it stays while hovered, WCAG 1.4.13). */
	disableInteractive?: boolean | undefined
	/** Milliseconds a finger must rest on the trigger before it opens. Default 700. A short tap does nothing. */
	enterTouchDelay?: number | undefined
	/** Milliseconds after the finger lifts before it closes. Default 1500. */
	leaveTouchDelay?: number | undefined
}

export interface TooltipState extends OpenState {
	id: string
}

export interface TooltipElements {
	/** The element the tooltip describes. */
	trigger: HTMLElement
	tooltip: HTMLElement
	/** Place the tooltip next to the trigger (`autoPosition` from `@omnifront/ui/position`); returns the cleanup. */
	position?: ((anchor: Element, floating: HTMLElement) => () => void) | undefined
}

/**
 * Behaviour of a tooltip: opens when the pointer rests on the trigger (after `enterDelay`) or when it
 * gets keyboard focus; closes on leave, blur or Escape. The tooltip text is a description
 * (`aria-describedby`, set while it is open), not a name. Hoverable: moving onto the tooltip keeps
 * it open. Touch: a press held for `enterTouchDelay` opens it and it closes `leaveTouchDelay` after the
 * finger lifts; a short tap does nothing (a label that matters should still be visible text).
 */
export class Tooltip extends OpenMachine<TooltipProps, TooltipState> {
	private delay: TimerHandle | undefined
	private touchDelay: TimerHandle | undefined
	/** The pointer is on the tooltip. React tells the tooltip it was entered before the trigger's own `pointerleave`, so a close cannot only be cancelled: it must not start. */
	private overTooltip = false
	protected override defaultExitDuration = 120

	constructor(props: TooltipProps) {
		super(props)
		this.start()
	}

	protected compute(): TooltipState {
		return { ...this.openState(), id: this.props.id }
	}

	private clearDelay(): void {
		if (this.delay !== undefined) this.scheduler.clearTimeout(this.delay)
		this.delay = undefined
	}

	private clearTouch(): void {
		if (this.touchDelay !== undefined) this.scheduler.clearTimeout(this.touchDelay)
		this.touchDelay = undefined
	}

	/** Open after `ms` (0 opens now). A pending close is cancelled. */
	private openSoon(ms: number, event?: Event): void {
		this.clearDelay()
		if (this.props.disabled) return
		const run = (): void => {
			this.delay = undefined
			this.request(true, "trigger", event)
		}
		if (ms <= 0) run()
		else this.delay = this.scheduler.setTimeout(run, ms)
	}

	/**
	 * Close after `ms`. A pointer that leaves the trigger always waits one tick even at 0: moving onto
	 * the tooltip fires its `pointerenter` in the same move, and that must be able to cancel the close.
	 */
	private closeSoon(ms: number, event?: Event, pointer = false): void {
		this.clearDelay()
		const run = (): void => {
			this.delay = undefined
			this.hide("trigger", event)
		}
		if (ms <= 0 && !(pointer && !this.props.disableInteractive)) run()
		else this.delay = this.scheduler.setTimeout(run, Math.max(0, ms))
	}

	connect(): { tooltip: Part } {
		const state = this.getSnapshot().open ? "open" : "closed"
		return {
			tooltip: part(
				{ id: this.props.id, role: "tooltip", "data-state": state },
				{
					pointerenter: () => {
						this.overTooltip = true
						if (!this.props.disableInteractive) this.clearDelay() // still hovering: a pending close is off
					},
					pointerleave: (event) => {
						this.overTooltip = false
						if (!this.props.disableInteractive) this.closeSoon(this.props.leaveDelay ?? 0, event, true)
					},
				},
			),
		}
	}

	/**
	 * Wire the trigger's pointer and focus handling and keep its `aria-describedby` in step
	 * with the state. Call once the trigger is in the page; call the result on unmount.
	 */
	attachTrigger(trigger: HTMLElement): () => void {
		const id = this.props.id
		const without = (): string[] => (trigger.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((t) => t && t !== id)
		const write = (tokens: string[]): void => {
			if (tokens.length) trigger.setAttribute("aria-describedby", tokens.join(" "))
			else trigger.removeAttribute("aria-describedby")
		}
		const isTouch = (event: Event): boolean => (event as PointerEvent).pointerType === "touch"
		const onTouchStart = (event: Event): void => {
			if (!isTouch(event) || this.props.disabled) return
			this.clearTouch()
			this.touchDelay = this.scheduler.setTimeout(() => {
				this.touchDelay = undefined
				this.clearDelay()
				this.request(true, "trigger", event)
			}, this.props.enterTouchDelay ?? 700)
		}
		const onTouchEnd = (event: Event): void => {
			if (!isTouch(event)) return
			if (this.touchDelay !== undefined) return this.clearTouch() // released early: a tap, not a hold
			if (this.getSnapshot().open) this.closeSoon(this.props.leaveTouchDelay ?? 1500, event)
		}
		const onEnter = (event: Event): void => {
			if (isTouch(event)) return
			this.overTooltip = false // the pointer is on the trigger now (a tooltip that vanished under it never said it left)
			this.openSoon(this.props.enterDelay ?? 100, event)
		}
		const onLeave = (event: Event): void => {
			if (isTouch(event)) return // the finger lifting is handled by `onTouchEnd`
			if (this.overTooltip && !this.props.disableInteractive) return // it already moved onto the tooltip
			this.closeSoon(this.props.leaveDelay ?? 0, event, true)
		}
		const onFocus = (event: Event): void => {
			// Focus from a mouse click is not a reason to show a hint; keyboard focus is.
			let visible = true
			try {
				visible = trigger.matches(":focus-visible")
			} catch {
				// An engine without :focus-visible: treat every focus as keyboard.
			}
			if (visible) this.openSoon(0, event)
		}
		const onBlur = (event: Event): void => this.closeSoon(0, event)
		const sync = (): void => write(this.getSnapshot().mounted ? [...without(), id] : without())
		trigger.addEventListener("pointerdown", onTouchStart)
		trigger.addEventListener("pointerup", onTouchEnd)
		trigger.addEventListener("pointercancel", onTouchEnd)
		trigger.addEventListener("pointerenter", onEnter)
		trigger.addEventListener("pointerleave", onLeave)
		trigger.addEventListener("focus", onFocus)
		trigger.addEventListener("blur", onBlur)
		const off = this.subscribe(sync)
		sync()
		return () => {
			trigger.removeEventListener("pointerdown", onTouchStart)
			trigger.removeEventListener("pointerup", onTouchEnd)
			trigger.removeEventListener("pointercancel", onTouchEnd)
			trigger.removeEventListener("pointerenter", onEnter)
			trigger.removeEventListener("pointerleave", onLeave)
			trigger.removeEventListener("focus", onFocus)
			trigger.removeEventListener("blur", onBlur)
			off()
			this.clearDelay()
			this.clearTouch()
			write(without())
		}
	}

	/** Position the tooltip and close it on Escape even when focus is elsewhere (a hover-only tooltip). Call while it is mounted. */
	attach(elements: TooltipElements): () => void {
		const doc = elements.tooltip.ownerDocument
		const cleanups: Array<() => void> = []
		if (elements.position) cleanups.push(elements.position(elements.trigger, elements.tooltip))
		const onKey = (event: Event): void => {
			if ((event as KeyboardEvent).key === "Escape" && this.getSnapshot().open) this.hide("escapeKeyDown", event)
		}
		doc.addEventListener("keydown", onKey)
		cleanups.push(() => doc.removeEventListener("keydown", onKey))
		return () => cleanups.forEach((c) => c())
	}

	override dispose(): void {
		this.clearDelay()
		this.clearTouch()
		super.dispose()
	}
}

export const createTooltip = (props: TooltipProps): Tooltip => new Tooltip(props)
