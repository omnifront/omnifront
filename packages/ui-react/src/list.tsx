import { displayPart } from "@omnifront/ui"
import { forwardRef, type ComponentPropsWithoutRef, type ElementType, type MouseEvent, type ReactNode } from "react"
import { mergeProps, toReactProps } from "./internal"
import { useDefaultProps } from "./theme"

export interface ListProps extends ComponentPropsWithoutRef<"ul"> {
	/** Tighter rows. */
	dense?: boolean | undefined
	disablePadding?: boolean | undefined
	/** `ul` (default), `ol` or `nav`. */
	component?: ElementType | undefined
}

/** A list of rows. Children are ListItem (or ListSubheader, Divider with `component="li"`). */
export const List = forwardRef<HTMLElement, ListProps>(function List(rawProps, ref) {
	const { dense, disablePadding, component: Tag = "ul", className, ...rest } = useDefaultProps("OmniList", rawProps)
	return <Tag {...mergeProps(toReactProps(displayPart("omni-list", { dense, disablePadding })), { ...rest, className })} ref={ref} />
})

export interface ListItemProps extends ComponentPropsWithoutRef<"li"> {
	/** A line under the row. */
	divider?: boolean | undefined
	/** No padding: for a row whose ListItemButton does the padding. */
	disablePadding?: boolean | undefined
	disableGutters?: boolean | undefined
	/** Something at the far end of the row, such as an IconButton. */
	secondaryAction?: ReactNode | undefined
}

export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(function ListItem(rawProps, ref) {
	const { divider, disablePadding, disableGutters, secondaryAction, className, children, ...rest } = useDefaultProps("OmniListItem", rawProps)
	const hasAction = secondaryAction !== undefined && secondaryAction !== null
	return (
		<li {...mergeProps(toReactProps(displayPart("omni-list__item", { divider, disablePadding, disableGutters, secondaryAction: hasAction })), { ...rest, className })} ref={ref}>
			{children}
			{hasAction && <div className="omni-list__action">{secondaryAction}</div>}
		</li>
	)
})

export interface ListItemButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "onClick"> {
	selected?: boolean | undefined
	/** Renders an `<a>` instead of a `<button>`. */
	href?: string | undefined
	target?: string | undefined
	rel?: string | undefined
	onClick?: ((event: MouseEvent<HTMLElement>) => void) | undefined
}

/** A row that can be pressed: a real `<button>` (or `<a>` with `href`) that fills the row. */
export const ListItemButton = forwardRef<HTMLElement, ListItemButtonProps>(function ListItemButton(rawProps, ref) {
	const { selected, href, disabled, onClick, className, type, ...rest } = useDefaultProps("OmniListItemButton", rawProps)
	const Tag = href === undefined ? "button" : "a"
	const part = displayPart("omni-list__button", { selected, disabled }, {
		"aria-current": selected ? "true" : undefined,
		...(Tag === "button" ? { type: type ?? "button", disabled: disabled || undefined } : { "aria-disabled": disabled ? "true" : undefined, tabindex: disabled ? -1 : undefined }),
	})
	return (
		<Tag
			{...(mergeProps(toReactProps(part), {
				...rest,
				href,
				className,
				onClick: (event: MouseEvent<HTMLElement>) => {
					if (disabled) event.preventDefault()
					else onClick?.(event)
				},
			}) as object)}
			ref={ref as never}
		/>
	)
})

export const ListItemIcon = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function ListItemIcon({ className, ...rest }, ref) {
	return <div {...mergeProps(toReactProps(displayPart("omni-list__icon")), { ...rest, className })} ref={ref} />
})

export interface ListItemTextProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
	primary?: ReactNode | undefined
	secondary?: ReactNode | undefined
	children?: ReactNode | undefined
}

export const ListItemText = forwardRef<HTMLDivElement, ListItemTextProps>(function ListItemText({ primary, secondary, children, className, ...rest }, ref) {
	const main = primary ?? children
	return (
		<div {...mergeProps(toReactProps(displayPart("omni-list__text")), { ...rest, className })} ref={ref}>
			{main !== undefined && main !== null && <span className="omni-list__primary">{main}</span>}
			{secondary !== undefined && secondary !== null && <span className="omni-list__secondary">{secondary}</span>}
		</div>
	)
})

export interface ListSubheaderProps extends ComponentPropsWithoutRef<"li"> {
	/** Do not stick to the top while the list scrolls. */
	disableSticky?: boolean | undefined
}

export const ListSubheader = forwardRef<HTMLLIElement, ListSubheaderProps>(function ListSubheader({ disableSticky, className, ...rest }, ref) {
	return <li {...mergeProps(toReactProps(displayPart("omni-list__subheader", { sticky: !disableSticky })), { ...rest, className })} ref={ref} />
})
