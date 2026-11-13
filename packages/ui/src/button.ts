import { part, type Part } from "./machines/machine"

export type ButtonVariant = "text" | "outlined" | "contained"
export type ButtonColor = "inherit" | "primary" | "secondary" | "success" | "error" | "info" | "warning"
export type ButtonSize = "small" | "medium" | "large"

export interface ButtonOptions {
	variant?: ButtonVariant | undefined
	color?: ButtonColor | undefined
	size?: ButtonSize | undefined
	fullWidth?: boolean | undefined
	disableElevation?: boolean | undefined
	disabled?: boolean | undefined
	/** Shows a spinner and stops clicks (a mutation in flight, for example). */
	loading?: boolean | undefined
	/** `button` (default) or `a` when it has an `href`. */
	as?: "button" | "a" | undefined
	/** Only for `as: "button"`. Default "button". */
	type?: "button" | "submit" | "reset" | undefined
}

/**
 * Attributes for a Button. No machine: a button has no state of its own, so the look comes from
 * `data-*` attributes that `button.css` reads (`data-variant`, `data-color`, `data-size`, ...).
 */
export function buttonPart(options: ButtonOptions = {}): Part {
	const { variant = "text", color = "primary", size = "medium", as = "button" } = options
	const inactive = options.disabled === true || options.loading === true
	return part({
		class: "omni-button",
		"data-variant": variant,
		"data-color": color,
		"data-size": size,
		"data-full-width": options.fullWidth ? "" : undefined,
		"data-disable-elevation": options.disableElevation ? "" : undefined,
		"data-loading": options.loading ? "" : undefined,
		"data-disabled": options.disabled ? "" : undefined,
		// A real button gets `disabled`; a link cannot, so it gets aria-disabled and is taken out of the Tab order.
		...(as === "button"
			? { type: options.type ?? "button", disabled: options.disabled === true || undefined, "aria-disabled": options.loading ? "true" : undefined }
			: { role: "button", "aria-disabled": inactive ? "true" : undefined, tabindex: inactive ? -1 : undefined }),
	})
}

export type IconButtonColor = "default" | "inherit" | "primary" | "secondary" | "success" | "error" | "info" | "warning"

export interface IconButtonOptions {
	color?: IconButtonColor | undefined
	size?: ButtonSize | undefined
	/** Pull the button outwards so its icon lines up with the edge of its container. */
	edge?: "start" | "end" | false | undefined
	disabled?: boolean | undefined
	as?: "button" | "a" | undefined
	type?: "button" | "submit" | "reset" | undefined
}

/**
 * Attributes for an IconButton: a round, icon-only button. It has no text, so give it an
 * `aria-label` (the components pass attributes through to the element).
 */
export function iconButtonPart(options: IconButtonOptions = {}): Part {
	const { color = "default", size = "medium", as = "button" } = options
	return part({
		class: "omni-icon-button",
		"data-color": color,
		"data-size": size,
		"data-edge": options.edge || undefined,
		"data-disabled": options.disabled ? "" : undefined,
		...(as === "button"
			? { type: options.type ?? "button", disabled: options.disabled === true || undefined }
			: { role: "button", "aria-disabled": options.disabled ? "true" : undefined, tabindex: options.disabled ? -1 : undefined }),
	})
}

export interface FabOptions {
	color?: ButtonColor | undefined
	size?: ButtonSize | undefined
	/** `circular` (icon only; give it an `aria-label`) or `extended` (icon and text). */
	variant?: "circular" | "extended" | undefined
	disabled?: boolean | undefined
	as?: "button" | "a" | undefined
	type?: "button" | "submit" | "reset" | undefined
}

/** Attributes for a Fab, the floating action button. */
export function fabPart(options: FabOptions = {}): Part {
	const { color = "primary", size = "large", variant = "circular", as = "button" } = options
	return part({
		class: "omni-fab",
		"data-variant": variant,
		"data-color": color,
		"data-size": size,
		"data-disabled": options.disabled ? "" : undefined,
		...(as === "button"
			? { type: options.type ?? "button", disabled: options.disabled === true || undefined }
			: { role: "button", "aria-disabled": options.disabled ? "true" : undefined, tabindex: options.disabled ? -1 : undefined }),
	})
}

export interface ToggleButtonOptions {
	selected?: boolean | undefined
	disabled?: boolean | undefined
}

/** Attributes for a ToggleButton on its own: a button that is pressed or not (`aria-pressed`). */
export function toggleButtonPart(options: ToggleButtonOptions = {}): Part {
	return part({
		class: "omni-toggle-button",
		type: "button",
		"aria-pressed": options.selected ? "true" : "false",
		"data-selected": options.selected ? "" : undefined,
		disabled: options.disabled === true || undefined,
	})
}
