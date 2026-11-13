import { Machine, part, type Part } from "./machine"

export interface RatingProps {
	/** Base for the `name` shared by the radios. */
	id: string
	name?: string | undefined
	/** Controlled value. Leave undefined to let the machine keep its own. `0` means no rating. */
	value?: number | undefined
	defaultValue?: number | undefined
	/** Number of stars. Default 5. */
	max?: number | undefined
	/** `1` (whole stars, default), `0.5` or `0.25`. */
	precision?: number | undefined
	/** The accessible name of the rating (for example "Rating"). A read-only rating adds its value: "Rating: 3 out of 5". */
	label?: string | undefined
	readOnly?: boolean | undefined
	disabled?: boolean | undefined
	onValueChange?: ((value: number, event?: Event) => void) | undefined
	onHoverChange?: ((value: number | undefined) => void) | undefined
}

export interface RatingState {
	id: string
	name: string
	value: number
	/** The value under the pointer, or -1. */
	hover: number
	/** What the stars show: the hovered value, else the chosen one. */
	display: number
	max: number
	precision: number
	readOnly: boolean
	disabled: boolean
}

export interface RatingRadio {
	value: number
	part: Part
}

export interface RatingStar {
	/** 1 to `max`. */
	index: number
	/** How much of the star is filled, as a percentage rounded to the precision: 0, 25, 50, 75 or 100. */
	fill: number
	/** One radio per step of the precision (one for whole stars, two for halves, four for quarters), left to right. */
	radios: RatingRadio[]
}

/**
 * State of a star rating: the chosen value (controlled or not) and the value under the pointer.
 * Each step is a real `<input type="radio">` in one group, so the arrow keys, Tab and assistive
 * technology are the browser's own. Choosing the value that is already chosen clears it. A read-only
 * rating has no inputs: it is an image with a text alternative (`getLabel`).
 */
export class Rating extends Machine<RatingProps, RatingState> {
	private internal: number
	private hover = -1

	constructor(props: RatingProps) {
		super(props)
		this.internal = props.defaultValue ?? 0
		this.start()
	}

	protected compute(): RatingState {
		const value = this.props.value ?? this.internal
		return {
			id: this.props.id,
			name: this.props.name ?? this.props.id,
			value,
			hover: this.hover,
			display: this.hover >= 0 ? this.hover : value,
			max: this.props.max ?? 5,
			precision: this.props.precision ?? 1,
			readOnly: this.props.readOnly === true,
			disabled: this.props.disabled === true,
		}
	}

	/** Choose a value (from a click or the keyboard). The value that is already chosen clears it. */
	choose = (value: number, event?: Event): void => {
		const s = this.getSnapshot()
		if (s.disabled || s.readOnly) return
		const next = value === s.value ? 0 : value
		this.props.onValueChange?.(next, event)
		if (this.props.value === undefined) {
			this.internal = next
			this.refresh()
		}
	}

	private setHover(value: number): void {
		if (this.hover === value) return
		this.hover = value
		this.props.onHoverChange?.(value < 0 ? undefined : value)
		this.refresh()
	}

	/** "3 out of 5" style text for a value, for the read-only image and for labels. */
	getLabel = (value: number = this.getSnapshot().value): string => {
		const { max } = this.getSnapshot()
		return `${value} out of ${max}`
	}

	connect(): { group: Part; clear: Part } {
		const s = this.getSnapshot()
		return {
			group: s.readOnly
				? part({
						role: "img",
						// An image's name is all a screen reader gets, so the value is part of it.
						"aria-label": this.props.label ? `${this.props.label}: ${this.getLabel()}` : this.getLabel(),
						"data-readonly": "",
						"data-disabled": s.disabled ? "" : undefined,
					})
				: part({ role: "radiogroup", "aria-label": this.props.label, "data-disabled": s.disabled ? "" : undefined }),
			// The "no rating" radio: visually hidden, but reachable by keyboard so the rating can be cleared.
			clear: part(
				{ type: "radio", name: s.name, value: "0", checked: s.value === 0, disabled: s.disabled || undefined, "aria-label": "No rating" },
				{ click: (event) => s.value !== 0 && this.choose(s.value, event) },
			),
		}
	}

	/** The stars, each with its radios and how full it is. */
	stars(): RatingStar[] {
		const s = this.getSnapshot()
		const slots = Math.round(1 / s.precision)
		const stars: RatingStar[] = []
		for (let index = 1; index <= s.max; index++) {
			const raw = Math.min(1, Math.max(0, s.display - (index - 1)))
			const fill = Math.round((raw * slots)) / slots * 100
			const radios: RatingRadio[] = []
			for (let slot = 1; slot <= slots; slot++) {
				const value = Number((index - 1 + slot / slots).toFixed(2))
				radios.push({
					value,
					part: part(
						{
							type: "radio",
							name: s.name,
							value: String(value),
							checked: s.value === value,
							disabled: s.disabled || undefined,
							"aria-label": this.getLabel(value),
							"data-slot": slot,
							"data-slots": slots,
						},
						{
							click: (event) => this.choose(value, event),
							pointerenter: () => this.setHover(value),
							pointerleave: () => this.setHover(-1),
						},
					),
				})
			}
			stars.push({ index, fill, radios })
		}
		return stars
	}
}

export const createRating = (props: RatingProps): Rating => new Rating(props)
