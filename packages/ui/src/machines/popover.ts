import { focusInside } from "../dom/focus"
import { pushLayer, type Layer } from "../dom/layers"
import { OpenMachine, part, type OpenProps, type OpenState, type Part } from "./machine"

export interface PopoverProps extends OpenProps {
	id: string
	/** `aria-label` of the dialog. A popover needs a name. */
	label?: string | undefined
	/** `aria-labelledby`, when an element in it names it. */
	labelledBy?: string | undefined
}

export interface PopoverState extends OpenState {
	id: string
}

export interface PopoverElements {
	content: HTMLElement
	/** The element it hangs from. A press on it is not "outside". */
	anchor?: Element | null | undefined
	position?: ((anchor: Element, floating: HTMLElement) => () => void) | undefined
}

/**
 * A panel next to an element that holds anything (MUI's Popover). Not modal: the page keeps scrolling and
 * stays readable. Focus moves in and goes back to the anchor; Escape and a press outside ask to close.
 */
export class Popover extends OpenMachine<PopoverProps, PopoverState> {
	private layer: Layer | undefined
	protected override defaultExitDuration = 120

	constructor(props: PopoverProps) {
		super(props)
		this.start()
	}

	protected compute(): PopoverState {
		return { ...this.openState(), id: this.props.id }
	}

	connect(): { content: Part } {
		const { id, label, labelledBy } = this.props
		return {
			content: part(
				{
					id: `${id}-content`,
					role: "dialog",
					"aria-label": label,
					"aria-labelledby": label ? undefined : labelledBy,
					tabindex: -1,
					"data-state": this.getSnapshot().open ? "open" : "closed",
				},
				{
					keydown: (event) => {
						if ((event as KeyboardEvent).key !== "Escape" || (this.layer && !this.layer.isTop())) return
						event.stopPropagation()
						this.hide("escapeKeyDown", event)
					},
				},
			),
		}
	}

	attach(elements: PopoverElements): () => void {
		const { content, anchor } = elements
		const doc = content.ownerDocument
		const previous = anchor instanceof HTMLElement ? anchor : (doc.activeElement as HTMLElement | null)
		const layer = (this.layer = pushLayer())
		const cleanups: Array<() => void> = []
		if (anchor && elements.position) cleanups.push(elements.position(anchor, content))
		const onPointerdown = (event: Event): void => {
			const target = event.target as Node
			if (!layer.isTop() || content.contains(target) || anchor?.contains(target)) return
			this.hide("outsidePress", event)
		}
		doc.addEventListener("pointerdown", onPointerdown)
		cleanups.push(() => doc.removeEventListener("pointerdown", onPointerdown))
		focusInside(content)
		return () => {
			for (const c of cleanups) c()
			layer.remove()
			if (this.layer === layer) this.layer = undefined
			if (previous?.isConnected) previous.focus({ preventScroll: true })
		}
	}
}

export const createPopover = (props: PopoverProps): Popover => new Popover(props)
