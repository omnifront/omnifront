import {
	ICON_PATHS,
	alertPart,
	breadcrumbItems,
	breadcrumbsPart,
	circularProgressParts,
	displayPart,
	linearProgressParts,
	linkPart,
	skeletonPart,
	type AlertOptions,
	type CircularProgressOptions,
	type LinearProgressOptions,
	type LinkOptions,
	type SkeletonOptions,
} from "@omnifront/ui"
import { Children, Fragment, forwardRef, useState, type ComponentPropsWithoutRef, type ElementType, type MouseEvent, type ReactNode } from "react"
import { IconButton } from "./icon-buttons"
import { mergeProps, toReactProps } from "./internal"
import { useDefaultProps } from "./theme"

const Icon = ({ path }: { path: string }): ReactNode => (
	<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
		<path d={path} />
	</svg>
)

// ---- Alert ----

export interface AlertProps extends Omit<ComponentPropsWithoutRef<"div">, "color">, AlertOptions {
	/** Replaces the severity's icon; `false` removes it. */
	icon?: ReactNode | false | undefined
	/** Something at the far end (a Button). */
	action?: ReactNode | undefined
	/** Shows a close button that calls this. */
	onClose?: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined
	/** The close button's accessible name. Default "Close". */
	closeText?: string | undefined
}

/** A short message with a status icon. `error` and `warning` are announced at once (`role="alert"`); `info` and `success` politely (`role="status"`). */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(rawProps, ref) {
	const { severity = "success", variant, icon, action, onClose, closeText = "Close", className, children, ...rest } = useDefaultProps("OmniAlert", rawProps)
	return (
		<div {...mergeProps(toReactProps(alertPart({ severity, variant })), { ...rest, className })} ref={ref}>
			{icon !== false && <div className="omni-alert__icon">{icon ?? <Icon path={ICON_PATHS[severity]} />}</div>}
			<div className="omni-alert__message">{children}</div>
			{(action || onClose) && (
				<div className="omni-alert__action">
					{action ?? (
						<IconButton size="small" color="inherit" aria-label={closeText} onClick={(e) => onClose?.(e)}>
							<Icon path={ICON_PATHS.close} />
						</IconButton>
					)}
				</div>
			)}
		</div>
	)
})

/** The bold first line of an Alert. */
export const AlertTitle = forwardRef<HTMLElement, ComponentPropsWithoutRef<"div">>(function AlertTitle({ className, ...rest }, ref) {
	return <div {...mergeProps(toReactProps(displayPart("omni-alert__title")), { ...rest, className })} ref={ref as never} />
})

// ---- Backdrop ----

export interface BackdropProps extends ComponentPropsWithoutRef<"div"> {
	open: boolean
	/** No dimming: it only catches clicks. */
	invisible?: boolean | undefined
}

/** A dimmed layer over the page behind a modal piece. Decorative (`aria-hidden`); keep it out of the tab order. */
export const Backdrop = forwardRef<HTMLDivElement, BackdropProps>(function Backdrop(rawProps, ref) {
	const { open, invisible, className, ...rest } = useDefaultProps("OmniBackdrop", rawProps)
	return <div {...mergeProps(toReactProps(displayPart("omni-backdrop", { state: open ? "open" : "closed", invisible }, { "aria-hidden": "true" })), { ...rest, className })} ref={ref} />
})

// ---- Progress ----

export interface CircularProgressProps extends Omit<ComponentPropsWithoutRef<"span">, "color">, CircularProgressOptions {}

/** A spinning ring, or a ring filled to `value`. Name it with `aria-label` (it is a `role="progressbar"`). */
export const CircularProgress = forwardRef<HTMLSpanElement, CircularProgressProps>(function CircularProgress(rawProps, ref) {
	const { value, size, thickness, color, className, ...rest } = useDefaultProps("OmniCircularProgress", rawProps)
	const parts = circularProgressParts({ value, size, thickness, color })
	return (
		<span {...mergeProps(toReactProps(parts.root), { ...rest, className })} ref={ref}>
			<svg {...toReactProps(parts.svg)}>
				<circle {...toReactProps(parts.circle)} />
			</svg>
		</span>
	)
})

export interface LinearProgressProps extends Omit<ComponentPropsWithoutRef<"div">, "color">, LinearProgressOptions {}

/** A bar: indeterminate, determinate (`value`) or buffer (`value` and `valueBuffer`). Name it with `aria-label`. */
export const LinearProgress = forwardRef<HTMLDivElement, LinearProgressProps>(function LinearProgress(rawProps, ref) {
	const { variant, value, valueBuffer, color, className, ...rest } = useDefaultProps("OmniLinearProgress", rawProps)
	const parts = linearProgressParts({ variant, value, valueBuffer, color })
	return (
		<div {...mergeProps(toReactProps(parts.root), { ...rest, className })} ref={ref}>
			<span {...toReactProps(parts.bar1)} />
			<span {...toReactProps(parts.bar2)} />
		</div>
	)
})

// ---- Skeleton ----

export interface SkeletonProps extends Omit<ComponentPropsWithoutRef<"span">, "children">, SkeletonOptions {}

/** A grey placeholder while content loads. It is hidden from screen readers: put `aria-busy` on the loading region. */
export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(rawProps, ref) {
	const { variant, animation, width, height, className, ...rest } = useDefaultProps("OmniSkeleton", rawProps)
	return <span {...mergeProps(toReactProps(skeletonPart({ variant, animation, width, height })), { ...rest, className })} ref={ref} />
})

// ---- Link ----

export interface LinkProps extends Omit<ComponentPropsWithoutRef<"a">, "color">, LinkOptions {
	/** Another element (a router link). Default `a`. */
	component?: ElementType | undefined
}

/** A real `<a>` styled as a link. */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(rawProps, ref) {
	const { underline, color, component: Tag = "a", className, ...rest } = useDefaultProps("OmniLink", rawProps)
	return <Tag {...mergeProps(toReactProps(linkPart({ underline, color })), { ...rest, className })} ref={ref} />
})

// ---- Breadcrumbs ----

export interface BreadcrumbsProps extends Omit<ComponentPropsWithoutRef<"nav">, "children"> {
	children?: ReactNode | undefined
	/** Between items. Default a chevron. */
	separator?: ReactNode | undefined
	/** More items than this fold their middle under a "…" button. Default 8. */
	maxItems?: number | undefined
	itemsBeforeCollapse?: number | undefined
	itemsAfterCollapse?: number | undefined
	/** The "…" button's accessible name. Default "Show path". */
	expandText?: string | undefined
}

/** The path to the current page: a `nav` with an ordered list. The last item is `aria-current="page"`. */
export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(rawProps, ref) {
	const { children, separator, maxItems, itemsBeforeCollapse, itemsAfterCollapse, expandText = "Show path", className, "aria-label": label, ...rest } = useDefaultProps("OmniBreadcrumbs", rawProps)
	const [expanded, setExpanded] = useState(false)
	const items = Children.toArray(children)
	const shown = breadcrumbItems(items.length, { maxItems, itemsBeforeCollapse, itemsAfterCollapse, expanded })
	return (
		<nav {...mergeProps(toReactProps(breadcrumbsPart(label)), { ...rest, className })} ref={ref}>
			<ol className="omni-breadcrumbs__list">
				{shown.map((slot, at) => (
					<Fragment key={slot === "ellipsis" ? "ellipsis" : slot}>
						<li className="omni-breadcrumbs__item" aria-current={slot !== "ellipsis" && slot === items.length - 1 ? "page" : undefined}>
							{slot === "ellipsis" ? (
								<button type="button" className="omni-breadcrumbs__expand" aria-label={expandText} onClick={() => setExpanded(true)}>
									<Icon path={ICON_PATHS.moreHoriz} />
								</button>
							) : (
								items[slot]
							)}
						</li>
						{at < shown.length - 1 && (
							<li className="omni-breadcrumbs__separator" aria-hidden="true" role="presentation">
								{separator ?? <Icon path={ICON_PATHS.chevronRight} />}
							</li>
						)}
					</Fragment>
				))}
			</ol>
		</nav>
	)
})
