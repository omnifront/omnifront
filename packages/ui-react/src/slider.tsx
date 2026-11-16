import { createSlider } from "@omnifront/ui"
import { forwardRef, useId, type ChangeEvent, type CSSProperties, type ReactNode } from "react"
import { cx, toReactProps, useMachine } from "./internal"
import { useDefaultProps } from "./theme"

export interface SliderMark {
	value: number
	label?: ReactNode | undefined
}

interface SliderBaseProps {
	min?: number | undefined
	max?: number | undefined
	step?: number | undefined
	disabled?: boolean | undefined
	size?: "small" | "medium" | undefined
	color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | undefined
	/** `vertical` puts the smallest value at the bottom. */
	orientation?: "horizontal" | "vertical" | undefined
	/** The height of a vertical slider (a number is pixels, or any CSS length). Default 200px. */
	length?: number | string | undefined
	/** `true` puts a mark on every step; a list gives marks (and labels) at chosen values. */
	marks?: boolean | readonly SliderMark[] | undefined
	/** When the bubble with the value shows: on hover and focus (`auto`), always (`on`), or never (`off`). */
	valueLabelDisplay?: "auto" | "on" | "off" | undefined
	valueLabelFormat?: ((value: number) => ReactNode) | undefined
	/** The value as words for screen readers, for example `${value} degrees`. */
	getAriaValueText?: ((value: number) => string) | undefined
	/** Name for a form. A range submits both values under `name` (lower first). */
	name?: string | undefined
	id?: string | undefined
	className?: string | undefined
	/** The accessible name. A range names its thumbs "<name> minimum" and "<name> maximum". */
	"aria-label"?: string | undefined
	"aria-labelledby"?: string | undefined
}

export interface SingleSliderProps extends SliderBaseProps {
	range?: false | undefined
	/** Controlled value. Leave it out for an uncontrolled slider. */
	value?: number | undefined
	defaultValue?: number | undefined
	/** Called while the user moves the thumb: `(event, value)`. */
	onChange?: ((event: ChangeEvent<HTMLInputElement> | Event | undefined, value: number) => void) | undefined
}

export interface RangeSliderProps extends SliderBaseProps {
	/** Two thumbs: a lower and an upper value. The lower one cannot pass the upper one. */
	range: true
	value?: readonly [number, number] | undefined
	/** Default: the whole range, `[min, max]`. */
	defaultValue?: readonly [number, number] | undefined
	onChange?: ((event: ChangeEvent<HTMLInputElement> | Event | undefined, value: [number, number]) => void) | undefined
}

export type SliderProps = SingleSliderProps | RangeSliderProps

/**
 * Material slider. The control is a real `<input type="range">` (two for a range): dragging, the
 * arrow keys, Home, End, Page Up and Page Down, forms and screen readers are the browser's own.
 */
export const Slider = forwardRef<HTMLSpanElement, SliderProps>(function Slider(rawProps, ref) {
	const {
		value,
		defaultValue,
		onChange,
		range,
		min = 0,
		max = 100,
		step = 1,
		disabled,
		size = "medium",
		color = "primary",
		orientation = "horizontal",
		length,
		marks,
		valueLabelDisplay = "off",
		valueLabelFormat,
		getAriaValueText,
		name,
		id: idProp,
		className,
		"aria-label": ariaLabel,
		"aria-labelledby": ariaLabelledby,
	} = useDefaultProps("OmniSlider", rawProps) as SliderBaseProps & {
		range?: boolean | undefined
		value?: number | readonly [number, number] | undefined
		defaultValue?: number | readonly [number, number] | undefined
		onChange?: ((event: ChangeEvent<HTMLInputElement> | Event | undefined, value: number | [number, number]) => void) | undefined
	}
	const generated = useId()
	const id = idProp ?? generated
	const [slider, state] = useMachine(
		() =>
			createSlider({
				id,
				range,
				defaultValue: typeof defaultValue === "number" ? defaultValue : undefined,
				defaultValues: typeof defaultValue === "object" ? defaultValue : undefined,
				min,
				max,
				step,
			}),
		{
			id,
			range,
			value: typeof value === "number" ? value : undefined,
			values: typeof value === "object" ? value : undefined,
			min,
			max,
			step,
			disabled,
			orientation,
			onValueChange: (next: number, event?: Event) => onChange?.(event, next),
			onValuesChange: (next: [number, number], event?: Event) => onChange?.(event, next),
		},
	)
	const inputs = slider.connect().inputs.map((p) => {
		// React's controlled input listens to `onChange` (the input event); the part names it `input`.
		const { onInput, ...inputProps } = toReactProps(p)
		return { inputProps, onInput }
	})
	const list: SliderMark[] = marks === true ? Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => ({ value: Number((min + i * step).toFixed(6)) })) : marks ? [...marks] : []
	const percentOf = (v: number): number => (max === min ? 0 : ((v - min) / (max - min)) * 100)
	const hasMarkLabels = list.some((m) => m.label !== undefined)
	const rootStyle = {
		"--omni-slider-percent": state.percent,
		"--omni-slider-start": state.start,
		...(length !== undefined ? { "--omni-slider-length": typeof length === "number" ? `${length}px` : length } : {}),
	} as CSSProperties
	const thumbValues = state.range ? state.values : [state.value]
	const thumbName = (index: number): string | undefined => (state.range && ariaLabel ? `${ariaLabel} ${index === 0 ? "minimum" : "maximum"}` : ariaLabel)
	return (
		<span
			ref={ref}
			className={cx("omni-slider", className)}
			style={rootStyle}
			data-size={size}
			data-color={color}
			data-label={valueLabelDisplay}
			data-orientation={state.orientation}
			data-range={state.range ? "" : undefined}
			data-disabled={state.disabled ? "" : undefined}
			data-marks-labels={hasMarkLabels ? "" : undefined}
		>
			{state.range ? (
				<span className="omni-slider__rail" aria-hidden="true">
					<span className="omni-slider__fill" />
				</span>
			) : null}
			{inputs.map(({ inputProps, onInput }, index) => (
				<input
					key={index}
					{...inputProps}
					name={name}
					className="omni-slider__input"
					aria-label={thumbName(index)}
					aria-labelledby={ariaLabelledby}
					aria-valuetext={getAriaValueText?.(thumbValues[index] as number)}
					onChange={onInput as never}
				/>
			))}
			{list.length > 0 ? (
				<span className="omni-slider__marks" aria-hidden="true">
					{list.map((mark) => (
						<span key={mark.value}>
							<span className="omni-slider__mark" style={{ "--omni-mark": percentOf(mark.value) } as CSSProperties} />
							{mark.label !== undefined ? (
								<span className="omni-slider__mark-label" style={{ "--omni-mark": percentOf(mark.value) } as CSSProperties}>{mark.label}</span>
							) : null}
						</span>
					))}
				</span>
			) : null}
			{valueLabelDisplay !== "off"
				? thumbValues.map((v, index) => (
						<span key={index} className="omni-slider__label" aria-hidden="true" style={{ "--omni-slider-percent": percentOf(v) } as CSSProperties}>
							{valueLabelFormat ? valueLabelFormat(v) : v}
						</span>
					))
				: null}
		</span>
	)
})
