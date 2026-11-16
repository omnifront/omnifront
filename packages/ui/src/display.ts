import { part, type Attrs, type Part } from "./machines/machine"

/**
 * Wave 2 ("display and surface"): pieces with no state of their own. Each one is a class name plus
 * `data-*` attributes that the matching CSS file reads, so React, Vue and Angular produce the same DOM.
 */

const kebab = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()

/**
 * A part made of a class and `data-*` attributes. `true` becomes an empty attribute (`data-dense`),
 * `false` and `undefined` leave it out, text and numbers are kept (`data-variant="outlined"`).
 */
export function displayPart(className: string, data: Record<string, string | number | boolean | undefined> = {}, extra: Attrs = {}): Part {
	const attrs: Attrs = { class: className }
	for (const [name, value] of Object.entries(data)) {
		if (value === undefined || value === false) continue
		attrs[`data-${kebab(name)}`] = value === true ? "" : String(value)
	}
	return part({ ...attrs, ...extra })
}

export type TypographyVariantName =
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "subtitle1"
	| "subtitle2"
	| "body1"
	| "body2"
	| "caption"
	| "overline"
	| "button"
	| "inherit"

export type TypographyColor =
	| "inherit"
	| "primary"
	| "secondary"
	| "success"
	| "error"
	| "info"
	| "warning"
	| "text.primary"
	| "text.secondary"
	| "text.disabled"

export interface TypographyOptions {
	variant?: TypographyVariantName | undefined
	align?: "inherit" | "left" | "center" | "right" | "justify" | undefined
	color?: TypographyColor | undefined
	/** Margin below, so stacked paragraphs breathe. */
	gutterBottom?: boolean | undefined
	/** One line, cut with an ellipsis. */
	noWrap?: boolean | undefined
	/** A paragraph's bottom margin (16px) whatever the variant. */
	paragraph?: boolean | undefined
}

/** The element a variant is drawn with unless the caller picks one: `h1` to `h6`, subtitles as `h6`, body text as `p`. */
export function typographyTag(variant: TypographyVariantName = "body1", paragraph = false): "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" {
	if (paragraph) return "p"
	switch (variant) {
		case "h1":
		case "h2":
		case "h3":
		case "h4":
		case "h5":
		case "h6":
			return variant
		case "subtitle1":
		case "subtitle2":
			return "h6"
		case "body1":
		case "body2":
		case "inherit":
			return "p"
		default:
			return "span"
	}
}

/** Attributes for Typography (no machine): the variant picks the theme's font, `typography.css` does the rest. */
export function typographyPart(options: TypographyOptions = {}): Part {
	const { variant = "body1", align, color, gutterBottom, noWrap, paragraph } = options
	return displayPart("omni-typography", {
		variant,
		align: align && align !== "inherit" ? align : undefined,
		color: color && color !== "inherit" ? color.replace(".", "-") : undefined,
		gutterBottom,
		noWrap,
		paragraph,
	})
}

export interface PaperOptions {
	/** Depth, 0 to 24 (the theme's `shadows`). Default 1. Ignored for `outlined`. */
	elevation?: number | undefined
	variant?: "elevation" | "outlined" | undefined
	/** Square corners. */
	square?: boolean | undefined
}

/** Attributes for Paper: a surface that lifts off the page. */
export function paperPart(options: PaperOptions = {}): Part {
	const { elevation = 1, variant = "elevation", square } = options
	return displayPart("omni-paper", {
		variant,
		elevation: variant === "elevation" ? Math.min(24, Math.max(0, Math.round(elevation))) : undefined,
		square,
	})
}

export interface CardOptions {
	variant?: "elevation" | "outlined" | undefined
	/** A higher lift (elevation 8 instead of 1). */
	raised?: boolean | undefined
}

/** Attributes for a Card: a Paper that clips its media and has a header, content and actions inside. */
export function cardPart(options: CardOptions = {}): Part {
	const paper = paperPart({ variant: options.variant, elevation: options.raised ? 8 : 1 })
	return part({ ...paper.attrs, class: "omni-paper omni-card" })
}

export interface DividerOptions {
	orientation?: "horizontal" | "vertical" | undefined
	/** `fullWidth` (default), `inset` (indented like a list item's text) or `middle` (indented on both sides). */
	variant?: "fullWidth" | "inset" | "middle" | undefined
	/** Stretch to the height of a flex row (a vertical divider in a toolbar). */
	flexItem?: boolean | undefined
	/** Where the text sits when the divider has children. */
	textAlign?: "center" | "left" | "right" | undefined
	/** Draw it with text in the middle: the root becomes a `div` with `role="separator"`. */
	withText?: boolean | undefined
	/** `hr` (default) or `li` inside a List. */
	as?: "hr" | "li" | "div" | undefined
}

/** Attributes for a Divider: a real `<hr>` (or `li` / `div` with `role="separator"`). */
export function dividerPart(options: DividerOptions = {}): Part {
	const { orientation = "horizontal", variant = "fullWidth", flexItem, textAlign = "center", withText, as = "hr" } = options
	return displayPart(
		"omni-divider",
		{ orientation, variant, flexItem, withText: withText || undefined, textAlign: withText ? textAlign : undefined },
		{
			...(as === "hr" ? {} : { role: "separator" }),
			// An `hr` is horizontal by default; only a vertical one needs saying.
			"aria-orientation": orientation === "vertical" ? "vertical" : undefined,
		},
	)
}

export interface AvatarOptions {
	variant?: "circular" | "rounded" | "square" | undefined
}

/** Attributes for an Avatar: a round (or rounded) badge holding a picture, initials or an icon. */
export function avatarPart(options: AvatarOptions = {}): Part {
	return displayPart("omni-avatar", { variant: options.variant ?? "circular" })
}

export interface BadgeOptions {
	badgeContent?: string | number | undefined
	/** Biggest number shown; above it the badge reads `99+`. Default 99. */
	max?: number | undefined
	/** Show a badge whose content is 0. */
	showZero?: boolean | undefined
	variant?: "standard" | "dot" | undefined
	/** Hide it (it still animates out). */
	invisible?: boolean | undefined
	color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" | undefined
	anchorOrigin?: { vertical: "top" | "bottom"; horizontal: "left" | "right" } | undefined
	/** `rectangular` (default) or `circular`: where the badge sits for a round child. */
	overlap?: "rectangular" | "circular" | undefined
}

export interface BadgeState {
	/** The text in the badge (`""` for a dot). */
	text: string
	invisible: boolean
}

/** What a badge shows: the number capped at `max`, nothing for a dot, and whether it is hidden. */
export function badgeState(options: BadgeOptions): BadgeState {
	const { badgeContent, max = 99, showZero = false, variant = "standard" } = options
	const empty = badgeContent === undefined || badgeContent === ""
	const zero = badgeContent === 0 && !showZero
	const invisible = options.invisible === true || (variant === "standard" && (empty || zero))
	const text = variant === "dot" || empty ? "" : typeof badgeContent === "number" && badgeContent > max ? `${max}+` : String(badgeContent)
	return { text, invisible }
}

/** Attributes for the small mark of a Badge (the number or dot) next to its child. */
export function badgeMarkPart(options: BadgeOptions): Part {
	const { variant = "standard", color = "default", overlap = "rectangular", anchorOrigin = { vertical: "top", horizontal: "right" } } = options
	const { invisible } = badgeState(options)
	return displayPart("omni-badge__mark", {
		variant,
		color,
		overlap,
		anchor: `${anchorOrigin.vertical}-${anchorOrigin.horizontal}`,
		invisible,
	}, invisible ? { "aria-hidden": "true" } : {})
}

export interface SvgIconOptions {
	fontSize?: "inherit" | "small" | "medium" | "large" | undefined
	color?: "inherit" | "action" | "disabled" | "primary" | "secondary" | "error" | "info" | "success" | "warning" | undefined
	viewBox?: string | undefined
	/** Makes it meaningful to a screen reader (`role="img"`, this as its name). Without it the icon is decorative (`aria-hidden`). */
	titleAccess?: string | undefined
}

/** Attributes for an SvgIcon: a 24px glyph that follows the text colour. Decorative unless `titleAccess` is given. */
export function svgIconPart(options: SvgIconOptions = {}): Part {
	const { fontSize = "medium", color, viewBox = "0 0 24 24", titleAccess } = options
	return displayPart("omni-svg-icon", { fontSize, color: color && color !== "inherit" ? color : undefined }, {
		viewBox,
		focusable: "false",
		xmlns: "http://www.w3.org/2000/svg",
		...(titleAccess ? { role: "img", "aria-label": titleAccess } : { "aria-hidden": "true" }),
	})
}

/** Material icon paths (24px grid) the components draw themselves. */
export const ICON_PATHS = {
	cancel: "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z",
	expandMore: "M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z",
	person: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
} as const

export interface AppBarOptions {
	position?: "fixed" | "absolute" | "sticky" | "static" | "relative" | undefined
	color?: "primary" | "secondary" | "default" | "transparent" | "inherit" | undefined
	/** Depth, 0 to 24. Default 4. */
	elevation?: number | undefined
}

/** Attributes for an AppBar: the bar at the top of a page, a `<header>`. */
export function appBarPart(options: AppBarOptions = {}): Part {
	return displayPart("omni-app-bar", {
		position: options.position ?? "fixed",
		color: options.color ?? "primary",
		elevation: Math.min(24, Math.max(0, Math.round(options.elevation ?? 4))),
	})
}
