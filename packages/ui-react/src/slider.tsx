import { createSlider } from "@omnifront/ui"
import { forwardRef, useId, type ChangeEvent, type CSSProperties, type ReactNode } from "react"
import { cx, toReactProps, useMachine } from "./internal"
import { useDefaultProps } from "./theme"

export interface SliderMark {
	value: number
	label?: ReactNode | undefined
}

export interface SliderProps {
	/** Controlled value. Leave it out for an uncontrolled slider. */
	value?: number | undefined
	defaultValue?: number | undefined
	/** Called while the user moves the thumb: `(event, value)`. */
	onChange?: ((event: ChangeEvent<HTMLInputElement> | Event | undefined, value: number) => void) | undefined
	min?: number | undefined
	max?: number | undefined
	step?: number | undefined
	disabled?: boolean | undefined
	size?: "small" | "medium" | undefined
	color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | undefined
	/** `true` puts a mark on every step; a list gives marks (and labels) at chosen values. */
	marks?: boolean | readonly SliderMark[] | undefined
	/** When the bubble with the value shows: on hover and focus (`auto`), always (`on`), or never (`off`). */
	valueLabelDisplay?: "auto" | "on" | "off" | undefined
	valueLabelFormat?: ((value: number) => ReactNode) | undefined
	/** The value as words for screen readers, for example `${value} degrees`. */
	getAriaValueText?: ((value: number) => string) | undefined
	name?: string | undefined
	id?: string | undefined
	className?: string | undefined
	"aria-label"?: string | undefined
	"aria-labelledby"?: string | undefined
}

/**
 * Material slider. The control is a real `<input type="range">`: dragging, the arrow keys, Home,
 * End, Page Up and Page Down, forms and screen readers are the browser's own.
 */
export const Slider = forwardRef<HTMLSpanElement, SliderProps>(function Slider(rawProps, ref) {
	const {
		value,
		defaultValue,
		onChange,
		min = 0,
		max = 100,
		step = 1,
		disabled,
		size = "medium",
		color = "primary",
		marks,
		valueLabelDisplay = "off",
		valueLabelFormat,
		getAriaValueText,
		name,
		id: idProp,
		className,
		"aria-label": ariaLabel,
		"aria-labelledby": ariaLabelledby,
	} = useDefaultProps("OmniSlider", rawProps)
	const generated = useId()
	const id = idProp ?? generated
	const [slider, state] = useMachine(() => createSlider({ id, defaultValue, min, max, step }), {
		id,
		value,
		min,
		max,
		step,
		disabled,
		onValueChange: (next: number, event?: Event) => onChange?.(event, next),
	})
	const part = toReactProps(slider.connect().input)
	// React's controlled input listens to `onChange` (the input event); the part names it `input`.
	const { onInput, ...inputProps } = part
	const list: SliderMark[] = marks === true ? Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => ({ value: Number((min + i * step).toFixed(6)) })) : marks ? [...marks] : []
	const percentOf = (v: number): number => (max === min ? 0 : ((v - min) / (max - min)) * 100)
	const hasMarkLabels = list.some((m) => m.label !== undefined)
	const rootStyle = { "--omni-slider-percent": state.percent } as CSSProperties
	return (
		<span
			ref={ref}
			className={cx("omni-slider", className)}
			style={rootStyle}
			data-size={size}
			data-color={color}
			data-label={valueLabelDisplay}
			data-disabled={state.disabled ? "" : undefined}
			data-marks-labels={hasMarkLabels ? "" : undefined}
		>
			<input
				{...inputProps}
				name={name}
				className="omni-slider__input"
				aria-label={ariaLabel}
				aria-labelledby={ariaLabelledby}
				aria-valuetext={getAriaValueText?.(state.value)}
				onChange={onInput as never}
			/>
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
			{valueLabelDisplay !== "off" ? (
				<span className="omni-slider__label" aria-hidden="true">
					{valueLabelFormat ? valueLabelFormat(state.value) : state.value}
				</span>
			) : null}
		</span>
	)
})
