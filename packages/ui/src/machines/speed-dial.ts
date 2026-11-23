import { OpenMachine, part, type OpenProps, type OpenState, type Part } from "./machine"

export interface SpeedDialProps extends OpenProps {
	id: string
	/** Which way the actions fan out from the button. Default `up`. */
	direction?: "up" | "down" | "left" | "right" | undefined
}

export interface SpeedDialState extends OpenState {
	id: string
	direction: "up" | "down" | "left" | "right"
}

export interface SpeedDialParts {
	root: Part
	/** The button that opens it (a Fab). */
	trigger: Part
	/** The list of actions: `role="menu"`, always in the DOM and hidden by CSS while closed. */
	actions: Part
	/** One action's button: `role="menuitem"`, reached with arrow keys. */
	action: Part
}

/**
 * A floating button that fans out a few actions. Opens on click and on pointer hover, closes on Escape,
 * on the pointer leaving, and when focus leaves it. Arrow keys (in the direction of the fan) move
 * between actions with real focus; choosing an action is the action's own click, which also closes it.
 */
export class SpeedDial extends OpenMachine<SpeedDialProps, SpeedDialState> {
	constructor(props: SpeedDialProps) {
		super(props)
		this.start()
	}

	protected compute(): SpeedDialState {
		return { ...this.openState(), id: this.props.id, direction: this.props.direction ?? "up" }
	}

	private items(root: HTMLElement): HTMLElement[] {
		return [...root.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')]
	}

	private trigger(root: HTMLElement): HTMLElement | null {
		return root.querySelector<HTMLElement>("[aria-haspopup]")
	}

	/** The keys that go further from the button (`away`) and back towards it. The DOM lists the nearest action first. */
	private keys(el: HTMLElement): { away: string; back: string } {
		const rtl = getComputedStyle(el).direction === "rtl"
		switch (this.getSnapshot().direction) {
			case "down":
				return { away: "ArrowDown", back: "ArrowUp" }
			case "left":
				return rtl ? { away: "ArrowRight", back: "ArrowLeft" } : { away: "ArrowLeft", back: "ArrowRight" }
			case "right":
				return rtl ? { away: "ArrowLeft", back: "ArrowRight" } : { away: "ArrowRight", back: "ArrowLeft" }
			default:
				return { away: "ArrowUp", back: "ArrowDown" }
		}
	}

	connect(): SpeedDialParts {
		const { id, direction, open } = this.getSnapshot()
		const state = open ? "open" : "closed"
		const root = (event: Event): HTMLElement => event.currentTarget as HTMLElement
		return {
			root: part(
				{ "data-state": state, "data-direction": direction },
				{
					pointerenter: (event) => {
						if ((event as PointerEvent).pointerType !== "touch") this.request(true, "trigger", event)
					},
					pointerleave: (event) => {
						if ((event as PointerEvent).pointerType !== "touch") this.request(false, "trigger", event)
					},
					focusout: (event) => {
						const next = (event as FocusEvent).relatedTarget as Node | null
						if (next && !root(event).contains(next)) this.request(false, "trigger", event)
					},
					keydown: (event) => {
						const e = event as KeyboardEvent
						const el = root(event)
						if (e.key === "Escape" && this.isOpen()) {
							e.stopPropagation()
							this.request(false, "escapeKeyDown", e)
							this.trigger(el)?.focus({ preventScroll: true })
							return
						}
						const { away, back } = this.keys(el)
						if (e.key !== away && e.key !== back) return
						e.preventDefault()
						if (!this.isOpen()) {
							if (e.key === away) this.request(true, "trigger", e)
							return
						}
						const items = this.items(el)
						const at = items.indexOf(document.activeElement as HTMLElement)
						if (e.key === away) items[Math.min(items.length - 1, at + 1)]?.focus()
						else if (at > 0) items[at - 1]?.focus()
						else this.trigger(el)?.focus()
					},
				},
			),
			trigger: part(
				{ id: `${id}-trigger`, type: "button", "aria-haspopup": "menu", "aria-expanded": open ? "true" : "false", "aria-controls": `${id}-actions`, "data-state": state },
				{ click: (event) => this.request(!this.isOpen(), "trigger", event) },
			),
			actions: part({ id: `${id}-actions`, role: "menu", "aria-labelledby": `${id}-trigger`, "data-state": state }),
			action: part(
				{ type: "button", role: "menuitem", tabindex: -1 },
				{
					click: (event) => {
						this.request(false, "select", event)
						this.trigger(root(event).closest("[data-direction]") as HTMLElement)?.focus({ preventScroll: true })
					},
				},
			),
		}
	}
}

export const createSpeedDial = (props: SpeedDialProps): SpeedDial => new SpeedDial(props)
