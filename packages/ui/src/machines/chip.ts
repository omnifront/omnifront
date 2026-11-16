import { Machine, part, type Part } from "./machine"

export interface ChipProps {
	/** The chip does something when pressed: it becomes a button (`role="button"`, in the Tab order). */
	clickable?: boolean | undefined
	/** The chip can be removed: Backspace or Delete on the focused chip (and a click on its delete icon) call `onDelete`. */
	deletable?: boolean | undefined
	disabled?: boolean | undefined
	onDelete?: ((event: Event) => void) | undefined
}

export interface ChipState {
	clickable: boolean
	deletable: boolean
	disabled: boolean
}

export interface ChipParts {
	root: Part
	/** The delete icon. A mouse target only: the keyboard path is Backspace / Delete on the chip itself. */
	deleteIcon: Part
}

/**
 * Keyboard and role handling for a Chip. A clickable chip behaves like a button (Enter on key down,
 * Space on key up, like the native one); Backspace or Delete deletes; Escape hands focus back.
 * The chip's own click handler is the caller's `onClick`: Enter and Space just click the element.
 */
export class Chip extends Machine<ChipProps, ChipState> {
	constructor(props: ChipProps = {}) {
		super(props)
		this.start()
	}

	protected compute(): ChipState {
		const { clickable, deletable, disabled } = this.props
		return { clickable: clickable === true, deletable: deletable === true, disabled: disabled === true }
	}

	connect(): ChipParts {
		const { clickable, deletable, disabled } = this.getSnapshot()
		const focusable = (clickable || deletable) && !disabled
		return {
			root: part(
				{
					role: clickable ? "button" : undefined,
					tabindex: focusable ? 0 : undefined,
					"aria-disabled": disabled && clickable ? "true" : undefined,
					"aria-keyshortcuts": deletable && !disabled ? "Backspace Delete" : undefined,
					"data-clickable": clickable ? "" : undefined,
					"data-deletable": deletable ? "" : undefined,
					"data-disabled": disabled ? "" : undefined,
				},
				{
					keydown: (event) => {
						// Keys typed inside something nested in the chip are not the chip's.
						if (event.target !== event.currentTarget || disabled) return
						const key = (event as KeyboardEvent).key
						if (clickable && key === "Enter") {
							event.preventDefault()
							;(event.currentTarget as HTMLElement).click()
						} else if (clickable && key === " ") {
							event.preventDefault() // no page scroll; the click comes on key up
						} else if (deletable && (key === "Backspace" || key === "Delete")) {
							event.preventDefault()
							this.props.onDelete?.(event)
						} else if (key === "Escape") {
							;(event.currentTarget as HTMLElement).blur()
						}
					},
					keyup: (event) => {
						if (event.target !== event.currentTarget || disabled) return
						if (clickable && (event as KeyboardEvent).key === " ") (event.currentTarget as HTMLElement).click()
					},
				},
			),
			deleteIcon: part(
				{ "aria-hidden": "true", class: "omni-chip__delete" },
				{
					click: (event) => {
						// The icon sits inside the chip: deleting must not also count as a press on the chip.
						event.stopPropagation()
						if (!disabled) this.props.onDelete?.(event)
					},
				},
			),
		}
	}
}

export const createChip = (props: ChipProps = {}): Chip => new Chip(props)
