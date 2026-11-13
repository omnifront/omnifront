import { createRating } from "@omnifront/ui"
import { forwardRef, useId, type ChangeEvent } from "react"
import { cx, toReactProps, useMachine } from "./internal"
import { useDefaultProps } from "./theme"

export interface RatingProps {
	/** Controlled value. Leave it out for an uncontrolled rating. `0` means no rating. */
	value?: number | undefined
	defaultValue?: number | undefined
	/** Called when the user rates: `(event, value)`. Choosing the current value again clears it (`0`). */
	onChange?: ((event: ChangeEvent<HTMLInputElement> | Event | undefined, value: number) => void) | undefined
	/** Called as the pointer moves over the stars, with the value under it (`undefined` when it leaves). */
	onChangeActive?: ((value: number | undefined) => void) | undefined
	/** Number of stars. Default 5. */
	max?: number | undefined
	/** `1` (whole stars, default), `0.5` or `0.25`. */
	precision?: 1 | 0.5 | 0.25 | undefined
	/** Show the value without letting the user change it. It is an image with a text alternative. */
	readOnly?: boolean | undefined
	disabled?: boolean | undefined
	size?: "small" | "medium" | "large" | undefined
	color?: "primary" | "secondary" | "error" | undefined
	/** Name for a form. */
	name?: string | undefined
	id?: string | undefined
	className?: string | undefined
	/** The accessible name of the group, e.g. "Rating". */
	"aria-label"?: string | undefined
	"aria-labelledby"?: string | undefined
}

/**
 * Star rating. Each step is a real `<input type="radio">` in one group (arrow keys, Tab and screen
 * readers are the browser's own); a read-only rating is an image with a text alternative.
 */
export const Rating = forwardRef<HTMLSpanElement, RatingProps>(function Rating(rawProps, ref) {
	const { value, defaultValue, onChange, onChangeActive, max = 5, precision = 1, readOnly, disabled, size = "medium", color, name, id: idProp, className, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledby } = useDefaultProps("OmniRating", rawProps)
	const generated = useId()
	const id = idProp ?? generated
	const [rating, state] = useMachine(() => createRating({ id, defaultValue }), {
		id,
		name,
		label: ariaLabel,
		value,
		max,
		precision,
		readOnly,
		disabled,
		onValueChange: (next: number, event?: Event) => onChange?.(event, next),
		onHoverChange: onChangeActive,
	})
	const parts = rating.connect()
	return (
		<span ref={ref} {...toReactProps(parts.group)} aria-labelledby={ariaLabelledby} className={cx("omni-rating", className)} data-size={size} data-color={color}>
			{state.readOnly ? null : <input {...toReactProps(parts.clear)} className="omni-rating__clear" />}
			{rating.stars().map((star) => (
				<span key={star.index} className="omni-rating__star" data-fill={star.fill}>
					<span className="omni-rating__icon" aria-hidden="true" />
					<span className="omni-rating__fill-box" aria-hidden="true">
						<span className="omni-rating__fill" />
					</span>
					{state.readOnly
						? null
						: star.radios.map((radio) => <input key={radio.value} {...toReactProps(radio.part)} className="omni-rating__radio" />)}
				</span>
			))}
		</span>
	)
})
