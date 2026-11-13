import { attachRipple, fabPart, iconButtonPart, type ButtonColor, type ButtonSize, type IconButtonColor } from "@omnifront/ui"
import { forwardRef, useCallback, useEffect, useRef, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode, type Ref } from "react"
import { mergeProps, toReactProps } from "./internal"
import { useDefaultProps } from "./theme"

function useRippleRef(ref: Ref<HTMLButtonElement | HTMLAnchorElement>, disableRipple: boolean | undefined, centered: boolean, dep: string) {
	const element = useRef<HTMLElement | null>(null)
	const setRef = useCallback(
		(node: HTMLElement | null) => {
			element.current = node
			if (typeof ref === "function") ref(node as HTMLButtonElement)
			else if (ref) (ref as { current: unknown }).current = node
		},
		[ref],
	)
	useEffect(() => {
		if (disableRipple || !element.current) return undefined
		return attachRipple(element.current, { centered })
	}, [disableRipple, centered, dep])
	return setRef
}

export interface IconButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "color"> {
	color?: IconButtonColor | undefined
	size?: ButtonSize | undefined
	/** Pull the button outwards so its icon lines up with the edge of its container. */
	edge?: "start" | "end" | false | undefined
	disableRipple?: boolean | undefined
	/** Renders an `<a>` instead of a `<button>`. */
	href?: string | undefined
	target?: string | undefined
	rel?: string | undefined
	/** The icon. An icon-only button needs an `aria-label`. */
	children?: ReactNode
}

/** A round, icon-only button. Give it an `aria-label`: it has no text. */
export const IconButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, IconButtonProps>(function IconButton(rawProps, ref) {
	const { color, size, edge, disableRipple, href, disabled, type, className, onClick, children, ...rest } = useDefaultProps("OmniIconButton", rawProps)
	const as = href === undefined ? "button" : "a"
	const part = iconButtonPart({ color, size, edge, disabled, as, type })
	const setRef = useRippleRef(ref, disableRipple, true, as)
	const handleClick = (event: MouseEvent<HTMLElement>): void => {
		if (as === "a" && disabled) {
			event.preventDefault()
			return
		}
		;(onClick as ((e: MouseEvent<HTMLElement>) => void) | undefined)?.(event)
	}
	const Tag = as
	return (
		<Tag {...(mergeProps(toReactProps(part), { ...rest, className, href, onClick: handleClick, ref: setRef as Ref<HTMLElement> }) as object)}>
			{children}
		</Tag>
	)
})

export interface FabProps extends Omit<ComponentPropsWithoutRef<"button">, "color"> {
	color?: ButtonColor | undefined
	size?: ButtonSize | undefined
	/** `circular` (icon only: give it an `aria-label`) or `extended` (icon and text). */
	variant?: "circular" | "extended" | undefined
	disableRipple?: boolean | undefined
	href?: string | undefined
	target?: string | undefined
	rel?: string | undefined
	children?: ReactNode
}

/** The floating action button: the main action of a screen. */
export const Fab = forwardRef<HTMLButtonElement | HTMLAnchorElement, FabProps>(function Fab(rawProps, ref) {
	const { color, size, variant, disableRipple, href, disabled, type, className, onClick, children, ...rest } = useDefaultProps("OmniFab", rawProps)
	const as = href === undefined ? "button" : "a"
	const part = fabPart({ color, size, variant, disabled, as, type })
	const setRef = useRippleRef(ref, disableRipple, variant !== "extended", as)
	const handleClick = (event: MouseEvent<HTMLElement>): void => {
		if (as === "a" && disabled) {
			event.preventDefault()
			return
		}
		;(onClick as ((e: MouseEvent<HTMLElement>) => void) | undefined)?.(event)
	}
	const Tag = as
	return (
		<Tag {...(mergeProps(toReactProps(part), { ...rest, className, href, onClick: handleClick, ref: setRef as Ref<HTMLElement> }) as object)}>
			{children}
		</Tag>
	)
})
