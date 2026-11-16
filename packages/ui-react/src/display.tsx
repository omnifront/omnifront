import {
	ICON_PATHS,
	appBarPart,
	avatarGroupState,
	avatarPart,
	badgeMarkPart,
	badgeState,
	cardPart,
	displayPart,
	dividerPart,
	paperPart,
	svgIconPart,
	typographyPart,
	typographyTag,
	type AppBarOptions,
	type AvatarOptions,
	type BadgeOptions,
	type CardOptions,
	type DividerOptions,
	type PaperOptions,
	type SvgIconOptions,
	type Part,
	type TypographyColor,
	type TypographyVariantName,
} from "@omnifront/ui"
import { Children, forwardRef, useEffect, useState, type ComponentPropsWithoutRef, type ElementType, type JSX as ReactJSX, type ReactNode, type Ref } from "react"
import { mergeProps, toReactProps } from "./internal"
import { useDefaultProps } from "./theme"

/** The element, with the part's attributes merged under the caller's own props. */
function draw(Tag: ElementType, part: Part, own: Record<string, unknown>, ref?: Ref<unknown>): ReactNode {
	return <Tag {...mergeProps(toReactProps(part), own)} ref={ref} />
}

type Own<T extends keyof ReactJSX.IntrinsicElements, Extra extends string = never> = Omit<ComponentPropsWithoutRef<T>, "color" | Extra>

// ---- Typography ----

export interface TypographyProps extends Own<"p"> {
	variant?: TypographyVariantName | undefined
	align?: "inherit" | "left" | "center" | "right" | "justify" | undefined
	color?: TypographyColor | undefined
	gutterBottom?: boolean | undefined
	noWrap?: boolean | undefined
	paragraph?: boolean | undefined
	/** The element to draw. Default follows the variant (`h1`…`h6`, `p`, `span`). */
	component?: ElementType | undefined
}

/** Text in one of the theme's styles. The look is the variant; the element is separate (`<Typography variant="h1" component="h2">`). */
export const Typography = forwardRef<HTMLElement, TypographyProps>(function Typography(rawProps, ref) {
	const { variant, align, color, gutterBottom, noWrap, paragraph, component, className, ...rest } = useDefaultProps("OmniTypography", rawProps)
	const part = typographyPart({ variant, align, color, gutterBottom, noWrap, paragraph })
	return draw(component ?? typographyTag(variant, paragraph), part, { ...rest, className }, ref)
})

// ---- Paper and Card ----

export interface PaperProps extends Own<"div">, PaperOptions {
	component?: ElementType | undefined
}

/** A surface that lifts off the page: `elevation` 0 to 24, or `variant="outlined"`. */
export const Paper = forwardRef<HTMLElement, PaperProps>(function Paper(rawProps, ref) {
	const { elevation, variant, square, component = "div", ...rest } = useDefaultProps("OmniPaper", rawProps)
	return draw(component, paperPart({ elevation, variant, square }), rest, ref)
})

export interface CardProps extends Own<"div">, CardOptions {
	component?: ElementType | undefined
}

/** A Paper for one subject: media, a header, content and actions. */
export const Card = forwardRef<HTMLElement, CardProps>(function Card(rawProps, ref) {
	const { variant, raised, component = "div", ...rest } = useDefaultProps("OmniCard", rawProps)
	return draw(component, cardPart({ variant, raised }), rest, ref)
})

export interface CardHeaderProps extends Own<"div", "title"> {
	avatar?: ReactNode | undefined
	title?: ReactNode | undefined
	subheader?: ReactNode | undefined
	/** Something at the far end, such as an IconButton. */
	action?: ReactNode | undefined
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader({ avatar, title, subheader, action, className, ...rest }, ref) {
	const part = displayPart("omni-card__header")
	return (
		<div {...mergeProps(toReactProps(part), { ...rest, className })} ref={ref}>
			{avatar !== undefined && avatar !== null && <div className="omni-card__header-avatar">{avatar}</div>}
			<div className="omni-card__header-content">
				{title !== undefined && title !== null && <span className="omni-card__title">{title}</span>}
				{subheader !== undefined && subheader !== null && <span className="omni-card__subheader">{subheader}</span>}
			</div>
			{action !== undefined && action !== null && <div className="omni-card__header-action">{action}</div>}
		</div>
	)
})

export const CardContent = forwardRef<HTMLDivElement, Own<"div">>(function CardContent({ className, ...rest }, ref) {
	return draw("div", displayPart("omni-card__content"), { ...rest, className }, ref)
})

export interface CardActionsProps extends Own<"div"> {
	/** Drop the 8px between actions. */
	disableSpacing?: boolean | undefined
}

export const CardActions = forwardRef<HTMLDivElement, CardActionsProps>(function CardActions({ disableSpacing, className, ...rest }, ref) {
	return draw("div", displayPart("omni-card__actions", { disableSpacing }), { ...rest, className }, ref)
})

export interface CardActionAreaProps extends Omit<ComponentPropsWithoutRef<"button">, "color"> {
	/** Renders an `<a>` instead of a `<button>`. */
	href?: string | undefined
	target?: string | undefined
	rel?: string | undefined
}

/**
 * The whole card as one press target: a real `<button>` (or `<a>` with `href`) around the card's content.
 * Do not put another button or link inside it (HTML forbids interactive content in a button); keep CardActions outside.
 */
export const CardActionArea = forwardRef<HTMLElement, CardActionAreaProps>(function CardActionArea({ href, className, type, ...rest }, ref) {
	const Tag = href === undefined ? "button" : "a"
	return draw(Tag, displayPart("omni-card__action-area", {}, Tag === "button" ? { type: type ?? "button" } : {}), { ...rest, href, className }, ref)
})

export interface CardMediaProps extends Own<"img"> {
	/** The picture's URL. Give it `alt` (empty when it is only decoration). */
	image: string
	height?: number | string | undefined
}

export const CardMedia = forwardRef<HTMLImageElement, CardMediaProps>(function CardMedia({ image, height, alt = "", className, style, ...rest }, ref) {
	return draw("img", displayPart("omni-card__media"), { ...rest, src: image, alt, className, style: height === undefined ? style : { ...style, blockSize: height } }, ref)
})

// ---- Divider ----

export interface DividerProps extends Own<"hr">, Omit<DividerOptions, "as" | "withText"> {
	/** Text (or anything) in the middle of the line. */
	children?: ReactNode | undefined
	/** `hr` (default) or `li` inside a List. */
	component?: "hr" | "li" | "div" | undefined
}

/** A line that separates content: a real `<hr>`, or `li` in a list. With children it becomes a `role="separator"` `div` with the text in the line. */
export const Divider = forwardRef<HTMLElement, DividerProps>(function Divider(rawProps, ref) {
	const { orientation, variant, flexItem, textAlign, component, children, className, ...rest } = useDefaultProps("OmniDivider", rawProps)
	const withText = children !== undefined && children !== null && children !== false
	const as = withText ? "div" : (component ?? "hr")
	const part = dividerPart({ orientation, variant, flexItem, textAlign, withText, as })
	return withText ? (
		draw(as, part, { ...rest, className, children: <span className="omni-divider__text">{children}</span> }, ref)
	) : (
		draw(as, part, { ...rest, className }, ref)
	)
})

// ---- Avatar ----

export interface AvatarProps extends Own<"div">, AvatarOptions {
	src?: string | undefined
	srcSet?: string | undefined
	/** Describes the picture. Without a `src`, the children (initials, an icon) are the content. */
	alt?: string | undefined
}

/** A person or thing as a picture, initials or an icon. If the picture fails to load it falls back to the children, then to a generic person. */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(rawProps, ref) {
	const { variant, src, srcSet, alt, children, className, ...rest } = useDefaultProps("OmniAvatar", rawProps)
	const [failed, setFailed] = useState(false)
	useEffect(() => setFailed(false), [src, srcSet])
	const showImage = (src || srcSet) && !failed
	return (
		<div {...mergeProps(toReactProps(avatarPart({ variant })), { ...rest, className })} ref={ref}>
			{showImage ? (
				<img className="omni-avatar__img" src={src} srcSet={srcSet} alt={alt ?? ""} onError={() => setFailed(true)} />
			) : children !== undefined && children !== null ? (
				children
			) : (
				<svg className="omni-avatar__fallback" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
					<path d={ICON_PATHS.person} />
				</svg>
			)}
		</div>
	)
})

export interface AvatarGroupProps extends Own<"div"> {
	/** Most avatars drawn, the last slot being "+N". Default 5. */
	max?: number | undefined
	/** How many avatars exist in all, when more than the children. Default: the number of children. */
	total?: number | undefined
	/** Overlap: `medium` (default, 8px), `small` (16px) or `large` (none). */
	spacing?: "small" | "medium" | "large" | undefined
	variant?: AvatarOptions["variant"]
}

/** Avatars side by side, overlapping. More than `max` fold into one "+N" avatar. Pass Avatar elements as children. */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(rawProps, ref) {
	const { max, total, spacing, variant, className, children, ...rest } = useDefaultProps("OmniAvatarGroup", rawProps)
	const items = Children.toArray(children)
	const { shown, surplus } = avatarGroupState(items.length, max, total)
	return (
		<div {...mergeProps(toReactProps(displayPart("omni-avatar-group", { spacing: spacing && spacing !== "medium" ? spacing : undefined })), { ...rest, role: "group", className })} ref={ref}>
			{items.slice(0, shown)}
			{surplus > 0 && <Avatar variant={variant}>+{surplus}</Avatar>}
		</div>
	)
})

// ---- Badge ----

export interface BadgeProps extends Own<"span", "content">, BadgeOptions {
	children?: ReactNode | undefined
}

/** A small number or dot on a corner of what it wraps (an icon, an avatar). */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(rawProps, ref) {
	const { badgeContent, max, showZero, variant, invisible, color, anchorOrigin, overlap, children, className, ...rest } = useDefaultProps("OmniBadge", rawProps)
	const options: BadgeOptions = { badgeContent, max, showZero, variant, invisible, color, anchorOrigin, overlap }
	const { text } = badgeState(options)
	return (
		<span {...mergeProps(toReactProps(displayPart("omni-badge")), { ...rest, className })} ref={ref}>
			{children}
			<span {...toReactProps(badgeMarkPart(options))}>{text}</span>
		</span>
	)
})

// ---- SvgIcon ----

export interface SvgIconProps extends Omit<ComponentPropsWithoutRef<"svg">, "color" | "fontSize">, SvgIconOptions {}

/** A 24px glyph that takes the text colour. Children are the SVG content (`<path d="…" />`). Decorative unless `titleAccess` names it. */
export const SvgIcon = forwardRef<SVGSVGElement, SvgIconProps>(function SvgIcon(rawProps, ref) {
	const { fontSize, color, viewBox, titleAccess, className, ...rest } = useDefaultProps("OmniSvgIcon", rawProps)
	return <svg {...mergeProps(toReactProps(svgIconPart({ fontSize, color, viewBox, titleAccess })), { ...rest, className })} ref={ref} />
})

// ---- AppBar and Toolbar ----

export interface AppBarProps extends Own<"header">, AppBarOptions {
	component?: ElementType | undefined
}

/** The bar at the top of a page: a `<header>`. Put a Toolbar inside. */
export const AppBar = forwardRef<HTMLElement, AppBarProps>(function AppBar(rawProps, ref) {
	const { position, color, elevation, component = "header", ...rest } = useDefaultProps("OmniAppBar", rawProps)
	return draw(component, appBarPart({ position, color, elevation }), rest, ref)
})

export interface ToolbarProps extends Own<"div"> {
	variant?: "regular" | "dense" | undefined
	disableGutters?: boolean | undefined
	component?: ElementType | undefined
}

/** A row of items with Material's heights (56px, 64px from 600px wide; `dense` 48px). */
export const Toolbar = forwardRef<HTMLElement, ToolbarProps>(function Toolbar(rawProps, ref) {
	const { variant, disableGutters, component = "div", ...rest } = useDefaultProps("OmniToolbar", rawProps)
	return draw(component, displayPart("omni-toolbar", { variant: variant === "dense" ? "dense" : undefined, disableGutters }), rest, ref)
})
