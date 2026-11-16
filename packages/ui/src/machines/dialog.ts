import { focusInside, trapFocus } from "../dom/focus"
import { hideOthers } from "../dom/aria-hidden"
import { pushLayer, type Layer } from "../dom/layers"
import { lockScroll } from "../dom/scroll-lock"
import { OpenMachine, part, type OpenProps, type OpenState, type Part } from "./machine"

/**
 * The control last pressed with a pointer. Safari does not focus a button on click, so at the moment a
 * dialog opens `document.activeElement` can be the body; this is where focus goes back to then.
 */
let lastPressed: HTMLElement | null = null
if (typeof document !== "undefined") {
	document.addEventListener(
		"pointerdown",
		(event) => {
			const target = event.target as Element | null
			lastPressed = (target?.closest?.("button, a[href], [tabindex]") as HTMLElement | null) ?? null
		},
		true,
	)
}

export interface DialogProps extends OpenProps {
	/** Base for the ids of the title, description and content. */
	id: string
	role?: "dialog" | "alertdialog" | undefined
	/** `aria-label`, for a dialog with no visible title. Replaces `aria-labelledby`. */
	label?: string | undefined
	closeOnEscape?: boolean | undefined
	closeOnBackdropClick?: boolean | undefined
	/** Lock page scroll, hide the rest of the page from screen readers and keep focus inside. Default true. */
	modal?: boolean | undefined
}

export interface DialogState extends OpenState {
	id: string
}

export interface DialogParts {
	container: Part
	backdrop: Part
	content: Part
	title: Part
	description: Part
	closeTrigger: Part
}

export interface DialogElements {
	content: HTMLElement
	/** The full-screen wrapper around the paper. Defaults to `content`. */
	container?: HTMLElement | undefined
}

/**
 * Behaviour of a modal dialog (MUI's Dialog without the look): open state with exit delay,
 * Escape and backdrop-click to close, focus moved in and restored, focus trapped, page scroll
 * locked and the rest of the page hidden from screen readers.
 */
export class Dialog extends OpenMachine<DialogProps, DialogState> {
	private layer: Layer | undefined
	protected override defaultExitDuration = 195

	constructor(props: DialogProps) {
		super(props)
		this.start()
	}

	protected compute(): DialogState {
		return { ...this.openState(), id: this.props.id }
	}

	connect(): DialogParts {
		const { id, role = "dialog", label } = this.props
		const state = this.getSnapshot().open ? "open" : "closed"
		const modal = this.props.modal ?? true
		return {
			container: part(
				{ role: "presentation", "data-state": state },
				{
					keydown: (event) => {
						if ((event as KeyboardEvent).key !== "Escape" || this.props.closeOnEscape === false) return
						if (this.layer && !this.layer.isTop()) return
						event.stopPropagation()
						this.hide("escapeKeyDown", event)
					},
					click: (event) => {
						// Only a click on the empty area counts, not one that bubbled up from the paper.
						if (event.target === event.currentTarget && this.props.closeOnBackdropClick !== false) this.hide("backdropClick", event)
					},
				},
			),
			backdrop: part({ "aria-hidden": "true", "data-state": state }),
			content: part({
				id: `${id}-content`,
				role,
				"aria-modal": modal ? "true" : undefined,
				"aria-label": label,
				"aria-labelledby": label ? undefined : `${id}-title`,
				"aria-describedby": `${id}-description`,
				tabindex: -1,
				"data-state": state,
			}),
			title: part({ id: `${id}-title` }),
			description: part({ id: `${id}-description` }),
			closeTrigger: part({ type: "button", "aria-label": "Close" }, { click: (event) => this.hide("closeButton", event) }),
		}
	}

	/**
	 * Start the DOM side once the content is in the page, while the dialog is open; call the returned
	 * function when it closes or unmounts. Runs focus handling, scroll lock and aria-hiding.
	 */
	attach(elements: DialogElements): () => void {
		const { content } = elements
		const doc = content.ownerDocument
		const active = doc.activeElement as HTMLElement | null
		const previous = active && active !== doc.body ? active : lastPressed
		const layer = (this.layer = pushLayer())
		const modal = this.props.modal ?? true
		const cleanups: Array<() => void> = []
		if (modal) {
			cleanups.push(lockScroll(doc), hideOthers(content), trapFocus(elements.container ?? content, () => layer.isTop()))
		}
		focusInside(content)
		return () => {
			for (const c of cleanups) c()
			layer.remove()
			if (this.layer === layer) this.layer = undefined
			if (previous?.isConnected) previous.focus({ preventScroll: true })
		}
	}
}

export const createDialog = (props: DialogProps): Dialog => new Dialog(props)
