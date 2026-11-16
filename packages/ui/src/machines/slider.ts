import { Machine, part, stableList, type Part } from "./machine"

export interface SliderProps {
	/** Id of the native `<input type="range">` (the first thumb's, when `range`; the second's is `<id>-end`). */
	id: string
	/** Controlled value. Leave undefined to let the machine keep its own. */
	value?: number | undefined
	defaultValue?: number | undefined
	min?: number | undefined
	max?: number | undefined
	step?: number | undefined
	disabled?: boolean | undefined
	onValueChange?: ((value: number, event?: Event) => void) | undefined
	/** Two thumbs: a lower and an upper value. Use `values` instead of `value`. */
	range?: boolean | undefined
	/** Controlled values, when `range`: `[lower, upper]`. Leave undefined to let the machine keep its own. */
	values?: readonly [number, number] | undefined
	/** The values an uncontrolled range starts with. Default: the whole range, `[min, max]`. */
	defaultValues?: readonly [number, number] | undefined
	onValuesChange?: ((values: [number, number], event?: Event) => void) | undefined
	/** `vertical` puts the smallest value at the bottom. Default `horizontal`. */
	orientation?: "horizontal" | "vertical" | undefined
}

export interface SliderState {
	id: string
	/** The value (when `range`: the lower one). */
	value: number
	min: number
	max: number
	step: number
	/** Where the (last) thumb is, 0 to 100: for drawing the filled part of the track. */
	percent: number
	/** Where the filled part of the track starts, 0 to 100: `0` for one thumb, the lower thumb for a range. */
	start: number
	disabled: boolean
	range: boolean
	/** The lower and upper value when `range` (the same value twice otherwise). */
	values: [number, number]
	orientation: "horizontal" | "vertical"
}

/**
 * State of a slider: one value between `min` and `max` in `step`s, or with `range` a lower and an
 * upper value (each controlled or not). The control is a real `<input type="range">` (two for a
 * range), so dragging, the arrow keys, Home, End, Page Up and Page Down, forms and assistive
 * technology are the browser's own; the machine keeps the values in range and ordered (the lower
 * thumb cannot pass the upper one) and tells the component where the thumbs are (`start`, `percent`).
 */
export class Slider extends Machine<SliderProps, SliderState> {
	private internal: number
	private internalValues: [number, number]

	constructor(props: SliderProps) {
		super(props)
		this.internal = props.defaultValue ?? props.min ?? 0
		this.internalValues = [props.defaultValues?.[0] ?? props.min ?? 0, props.defaultValues?.[1] ?? props.max ?? 100]
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
		const range = this.props.range === true
		const percentOf = (v: number): number => (max === min ? 0 : ((v - min) / (max - min)) * 100)
		const single = this.fit(this.props.value ?? this.internal)
		const raw = this.props.values ?? this.internalValues
		const [a, b] = [this.fit(raw[0]), this.fit(raw[1])]
		const values = stableList(this.peek()?.values, range ? [Math.min(a, b), Math.max(a, b)] : [single, single]) as [number, number]
		return {
			id: this.props.id,
			value: range ? values[0] : single,
			min,
			max,
			step,
			percent: percentOf(range ? values[1] : single),
			start: range ? percentOf(values[0]) : 0,
			disabled: this.props.disabled === true,
			range,
			values,
			orientation: this.props.orientation === "vertical" ? "vertical" : "horizontal",
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

	/**
	 * The user moved thumb `index` (0 lower, 1 upper) of a range. The lower thumb stops at the upper
	 * one and the other way round. Returns the value the thumb ended up with.
	 */
	changeAt = (index: 0 | 1, raw: number, event?: Event): number => {
		const current = this.getSnapshot().values
		if (this.props.disabled) return current[index]
		const fitted = this.fit(raw)
		const value = index === 0 ? Math.min(fitted, current[1]) : Math.max(fitted, current[0])
		if (value === current[index]) return value
		const next: [number, number] = index === 0 ? [value, current[1]] : [current[0], value]
		this.props.onValuesChange?.(next, event)
		if (this.props.values === undefined) {
			this.internalValues = next
			this.refresh()
		}
		return value
	}

	/**
	 * `input` is the first (or only) thumb; `inputs` has both thumbs of a range. Give each thumb of a
	 * range its own accessible name.
	 */
	connect(): { input: Part; inputs: Part[] } {
		const s = this.getSnapshot()
		const common = {
			type: "range",
			min: s.min,
			max: s.max,
			step: s.step,
			disabled: s.disabled || undefined,
			"aria-orientation": s.orientation === "vertical" ? "vertical" : undefined,
		}
		if (!s.range) {
			const input = part(
				{ ...common, id: s.id, value: String(s.value) },
				{ input: (event) => this.change(Number((event.target as HTMLInputElement).value), event) },
			)
			return { input, inputs: [input] }
		}
		const thumb = (index: 0 | 1): Part =>
			part(
				{
					...common,
					id: index === 0 ? s.id : `${s.id}-end`,
					value: String(s.values[index]),
					"data-index": String(index),
					// when both thumbs sit on the same value, the one that can still move is on top
					"data-front": index === 0 && s.start > 50 ? "" : undefined,
				},
				{
					input: (event) => {
						const target = event.target as HTMLInputElement
						const kept = this.changeAt(index, Number(target.value), event)
						// a thumb that tried to pass the other one: put the native control back
						if (Number(target.value) !== kept) target.value = String(kept)
					},
				},
			)
		const inputs = [thumb(0), thumb(1)]
		return { input: inputs[0] as Part, inputs }
	}
}

export const createSlider = (props: SliderProps): Slider => new Slider(props)
