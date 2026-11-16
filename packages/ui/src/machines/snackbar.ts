import type { TimerHandle } from "@omnifront/core"
import { OpenMachine, part, type OpenProps, type OpenState, type Part } from "./machine"

export interface SnackbarProps extends OpenProps {
	/** Milliseconds it stays before it asks to close (reason `timeout`). Leave out to stay until closed. */
	autoHideDuration?: number | null | undefined
	/** Close on a press outside it (reason `outsidePress`). Default true; Snackbars that must stay put set it false. */
	closeOnOutsidePress?: boolean | undefined
	anchorOrigin?: { vertical: "top" | "bottom"; horizontal: "left" | "center" | "right" } | undefined
}

export interface SnackbarState extends OpenState {}

export interface SnackbarElements {
	content: HTMLElement
}

/**
 * A short message that appears at the edge of the screen and goes away by itself. The timer runs
 * on the injected Scheduler and is paused while the pointer is over the message or focus is inside
 * it (WCAG 2.2.1: time to read); when the pause ends it counts half the duration again.
 * Escape and a press outside ask to close. Queueing several messages is the app's job.
 */
export class Snackbar extends OpenMachine<SnackbarProps, SnackbarState> {
	private hideTimer: TimerHandle | undefined
	private paused = false
	protected override defaultExitDuration = 195

	constructor(props: SnackbarProps) {
		super(props)
		this.start()
		this.syncTimer()
	}

	protected compute(): SnackbarState {
		return this.openState()
	}

	protected override refresh(silent = false): void {
		super.refresh(silent)
		this.syncTimer()
	}

	private stop(): void {
		if (this.hideTimer !== undefined) this.scheduler.clearTimeout(this.hideTimer)
		this.hideTimer = undefined
	}

	private startTimer(ms: number): void {
		this.stop()
		this.hideTimer = this.scheduler.setTimeout(() => {
			this.hideTimer = undefined
			this.hide("timeout")
		}, ms)
	}

	private syncTimer(): void {
		const duration = this.props.autoHideDuration
		if (!this.isOpen() || duration == null || duration <= 0) {
			this.stop()
			this.paused = false
			return
		}
		if (this.hideTimer === undefined && !this.paused) this.startTimer(duration)
	}

	private pause = (): void => {
		this.paused = true
		this.stop()
	}

	private resume = (): void => {
		const duration = this.props.autoHideDuration
		if (!this.paused) return
		this.paused = false
		if (this.isOpen() && duration != null && duration > 0) this.startTimer(duration * 0.5)
	}

	connect(): { root: Part; content: Part } {
		const { vertical = "bottom", horizontal = "left" } = this.props.anchorOrigin ?? {}
		const state = this.getSnapshot().open ? "open" : "closed"
		return {
			root: part({ "data-state": state, "data-vertical": vertical, "data-horizontal": horizontal }, {
				pointerenter: this.pause,
				pointerleave: this.resume,
				focusin: this.pause,
				focusout: this.resume,
			}),
			content: part({ role: "status", "data-state": state }),
		}
	}

	/** Close on Escape and on a press outside, while it is open. Call the result when it closes. */
	attach(elements: SnackbarElements): () => void {
		const { content } = elements
		const doc = content.ownerDocument
		const onKey = (event: Event): void => {
			if ((event as KeyboardEvent).key === "Escape") this.hide("escapeKeyDown", event)
		}
		const onPointer = (event: Event): void => {
			if (this.props.closeOnOutsidePress === false || content.contains(event.target as Node)) return
			this.hide("outsidePress", event)
		}
		doc.addEventListener("keydown", onKey)
		doc.addEventListener("pointerdown", onPointer)
		return () => {
			doc.removeEventListener("keydown", onKey)
			doc.removeEventListener("pointerdown", onPointer)
		}
	}

	override dispose(): void {
		this.stop()
		super.dispose()
	}
}

export const createSnackbar = (props: SnackbarProps = {}): Snackbar => new Snackbar(props)
