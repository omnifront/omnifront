import { BaseSubscribable, defaultScheduler, shallowEqual, type Scheduler, type TimerHandle } from "@omnifront/core"

/** Attribute values a part can set. Real boolean attributes (`hidden`, `disabled`) use booleans; `aria-*` and `data-*` use strings. */
export type Attrs = Record<string, string | number | boolean | undefined>
/** DOM event name (lowercase, `keydown`) to handler. Adapters spell it the way their framework wants (`onKeyDown`). */
export type Handlers = Record<string, (event: Event) => void>

/** What one element of a component needs: attributes and event handlers. Framework-free. */
export interface Part {
	attrs: Attrs
	on: Handlers
}

export const part = (attrs: Attrs = {}, on: Handlers = {}): Part => ({ attrs, on })

/**
 * Base for every behaviour machine. A machine is a Subscribable (ADR-0001): `subscribe` /
 * `getSnapshot` give the state, `setProps` feeds it the latest props on every render, and
 * `connect()` turns the current state into attributes and handlers for each element.
 */
export abstract class Machine<P extends object, S extends object> extends BaseSubscribable<S> {
	protected props: P
	private snapshot: S | undefined
	private first: S | undefined
	private notified: S | undefined

	protected constructor(props: P) {
		super()
		this.props = { ...props }
		// Frameworks hand these around unbound (useSyncExternalStore does), so bind them once.
		this.getSnapshot = this.getSnapshot.bind(this)
		this.getServerSnapshot = this.getServerSnapshot.bind(this)
	}

	/** Subclasses call this last in their constructor, once their own fields exist. */
	protected start(): void {
		this.snapshot = this.first = this.notified = this.compute()
	}

	protected abstract compute(): S

	getSnapshot(): S {
		return this.snapshot as S
	}

	/** What the server rendered. Stays the first snapshot, so hydration matches. */
	getServerSnapshot(): S {
		return this.first as S
	}

	/**
	 * Update props (call on every render with the current values). Same state keeps the same snapshot.
	 * `silent` recomputes without telling listeners: for frameworks that must not notify while
	 * rendering (React). Call `flush()` right after the render commits.
	 */
	setProps(next: Partial<P>, options: { silent?: boolean } = {}): void {
		this.props = { ...this.props, ...next }
		this.refresh(options.silent)
	}

	/** Tell listeners about a change that `setProps(..., { silent: true })` made. No-op when they already know. */
	flush(): void {
		if (this.snapshot !== this.notified) {
			this.notified = this.snapshot
			this.notify()
		}
	}

	/** Recompute and notify, only if something changed. */
	protected refresh(silent = false): void {
		const next = this.compute()
		if (!shallowEqual(next, this.snapshot)) {
			this.snapshot = next
			if (!silent) this.flush()
		}
	}

	/** Stop timers. Call when the component using the machine goes away. */
	dispose(): void {}
}

export type CloseReason = "escapeKeyDown" | "backdropClick" | "outsidePress" | "select" | "tab" | "closeButton" | "trigger" | "programmatic"

export interface OpenProps {
	/** Controlled value. Leave undefined to let the machine keep its own. */
	open?: boolean | undefined
	defaultOpen?: boolean | undefined
	/** `event` is the DOM event that caused it, when there was one. */
	onOpenChange?: ((open: boolean, reason: CloseReason, event?: Event) => void) | undefined
	/** Milliseconds the closed content stays mounted so an exit animation can play. 0 unmounts at once. */
	exitDuration?: number | undefined
	scheduler?: Scheduler | undefined
}

export interface OpenState {
	open: boolean
	/** True while open and during the exit animation: render the content while this is true. */
	mounted: boolean
	status: "open" | "closing" | "closed"
}

/** Shared open / closing / closed handling for Dialog and Menu, with a timer for the exit animation. */
export abstract class OpenMachine<P extends OpenProps, S extends OpenState> extends Machine<P, S> {
	private internalOpen: boolean
	private closing = false
	private timer: TimerHandle | undefined
	private lastOpen: boolean
	/** Exit delay when `exitDuration` is not given. Subclasses set their own. */
	protected defaultExitDuration = 0

	protected constructor(props: P) {
		super(props)
		this.internalOpen = props.defaultOpen ?? false
		this.lastOpen = this.isOpen()
	}

	protected isOpen(): boolean {
		return this.props.open ?? this.internalOpen
	}

	protected get scheduler(): Scheduler {
		return this.props.scheduler ?? defaultScheduler
	}

	protected openState(): OpenState {
		const open = this.isOpen()
		return { open, mounted: open || this.closing, status: open ? "open" : this.closing ? "closing" : "closed" }
	}

	protected override refresh(silent = false): void {
		const open = this.isOpen()
		if (open !== this.lastOpen) {
			this.lastOpen = open
			this.clearTimer()
			this.closing = false
			const ms = this.props.exitDuration ?? this.defaultExitDuration
			if (!open && ms > 0) {
				this.closing = true
				this.timer = this.scheduler.setTimeout(() => {
					this.timer = undefined
					this.closing = false
					this.refresh()
				}, ms)
			}
		}
		super.refresh(silent)
	}

	private clearTimer(): void {
		if (this.timer !== undefined) this.scheduler.clearTimeout(this.timer)
		this.timer = undefined
	}

	/** Ask to change `open`. Controlled: only calls `onOpenChange`. Uncontrolled: also changes it. */
	protected request(next: boolean, reason: CloseReason, event?: Event): void {
		if (next === this.isOpen()) return
		this.props.onOpenChange?.(next, reason, event)
		if (this.props.open === undefined) {
			this.internalOpen = next
			this.refresh()
		}
	}

	show = (): void => this.request(true, "programmatic")
	hide = (reason: CloseReason = "programmatic", event?: Event): void => this.request(false, reason, event)
	toggle = (event?: Event): void => this.request(!this.isOpen(), "trigger", event)

	override dispose(): void {
		this.clearTimer()
	}
}
