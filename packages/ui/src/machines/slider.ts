import { Machine, part, type Part } from "./machine"

export interface SliderProps {
	/** Id of the native `<input type="range">`. */
	id: string
	/** Controlled value. Leave undefined to let the machine keep its own. */
	value?: number | undefined
	defaultValue?: number | undefined
	min?: number | undefined
	max?: number | undefined
	step?: number | undefined
	disabled?: boolean | undefined
	onValueChange?: ((value: number, event?: Event) => void) | undefined
}

export interface SliderState {
	id: string
	value: number
	min: number
	max: number
	step: number
	/** Where the thumb is, 0 to 100: for drawing the filled part of the track. */
	percent: number
	disabled: boolean
}

/**
 * State of a slider: one value between `min` and `max` in `step`s (controlled or not). The control is
 * a real `<input type="range">`, so dragging, the arrow keys, Home, End, Page Up and Page Down, forms
 * and assistive technology are the browser's own; the machine keeps the value in range and tells
 * the component where the thumb is (`percent`).
 */
export class Slider extends Machine<SliderProps, SliderState> {
	private internal: number

	constructor(props: SliderProps) {
		super(props)
		this.internal = props.defaultValue ?? props.min ?? 0
		this.start()
	}

	/** Keep a value inside the range and on a step. */
	private fit(value: number): number {
		const { min, max, step } = this.limits()
		const snapped = Math.round((value - min) / step) * step + min
		const clamped = Math.min(max, Math.max(min, snapped))
		// no floating point noise such as 0.30000000000000004
		return Number(clamped.toFixed(Math.max(0, (String(step).split(".")[1] ?? "").length + 1)))
	}

	private limits(): { min: number; max: number; step: number } {
		return { min: this.props.min ?? 0, max: this.props.max ?? 100, step: this.props.step ?? 1 }
	}

	protected compute(): SliderState {
		const { min, max, step } = this.limits()
		const value = this.fit(this.props.value ?? this.internal)
		return {
			id: this.props.id,
			value,
			min,
			max,
			step,
			percent: max === min ? 0 : ((value - min) / (max - min)) * 100,
			disabled: this.props.disabled === true,
		}
	}

	/** The user moved the thumb (from the input's `input` event). */
	change = (raw: number, event?: Event): void => {
		if (this.props.disabled) return
		const value = this.fit(raw)
		if (value === this.getSnapshot().value) return
		this.props.onValueChange?.(value, event)
		if (this.props.value === undefined) {
			this.internal = value
			this.refresh()
		}
	}

	connect(): { input: Part } {
		const s = this.getSnapshot()
		return {
			input: part(
				{
					id: s.id,
					type: "range",
					min: s.min,
					max: s.max,
					step: s.step,
					value: String(s.value),
					disabled: s.disabled || undefined,
				},
				{ input: (event) => this.change(Number((event.target as HTMLInputElement).value), event) },
			),
		}
	}
}

export const createSlider = (props: SliderProps): Slider => new Slider(props)
