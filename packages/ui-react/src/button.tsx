import { attachRipple, buttonPart, type ButtonColor, type ButtonSize, type ButtonVariant } from "@omnifront/ui"
import { forwardRef, useCallback, useContext, useEffect, useRef, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode, type Ref } from "react"
import { ButtonGroupContext } from "./button-group-context"
import { mergeProps, toReactProps } from "./internal"
import { useDefaultProps } from "./theme"

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "color"> {
	variant?: ButtonVariant | undefined
	color?: ButtonColor | undefined
	size?: ButtonSize | undefined
	fullWidth?: boolean | undefined
	disableElevation?: boolean | undefined
	/** Shows a spinner and ignores clicks, e.g. `loading={mutation.isPending}`. */
	loading?: boolean | undefined
	/** Turn off the touch ripple. */
	disableRipple?: boolean | undefined
	startIcon?: ReactNode | undefined
	endIcon?: ReactNode | undefined
	/** Renders an `<a>` instead of a `<button>`. */
	href?: string | undefined
	target?: string | undefined
	rel?: string | undefined
}

/** Inside a ButtonGroup, the group's props fill in what the Button did not set itself. */
function useGroupDefaults<P extends { variant?: unknown; color?: unknown; size?: unknown; disabled?: unknown; disableElevation?: unknown }>(props: P): P {
	const group = useContext(ButtonGroupContext)
	if (!group) return props
	const out: Record<string, unknown> = { ...props }
	for (const [key, value] of Object.entries(group)) if (out[key] === undefined && value !== undefined) out[key] = value
	return out as P
}

/** Material button: `text`, `outlined` or `contained`, with colours, sizes, icons, loading state and ripple. */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(rawProps, ref) {
	const {
		variant,
		color,
		size,
		fullWidth,
		disableElevation,
		loading,
		disableRipple,
		startIcon,
		endIcon,
		href,
		disabled,
		type,
		className,
		onClick,
		children,
		...rest
	} = useGroupDefaults(useDefaultProps("OmniButton", rawProps))
	const as = href === undefined ? "button" : "a"
	const part = buttonPart({ variant, color, size, fullWidth, disableElevation, disabled, loading, as, type })

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
		return attachRipple(element.current)
	}, [disableRipple, as])

	const handleClick = (event: MouseEvent<HTMLElement>): void => {
		if (loading || (as === "a" && disabled)) {
			event.preventDefault()
			return
		}
		;(onClick as ((e: MouseEvent<HTMLElement>) => void) | undefined)?.(event)
	}

	const props = mergeProps(toReactProps(part), { ...rest, className, href, onClick: handleClick, ref: setRef as Ref<HTMLElement> })
	const Tag = as
	return (
		<Tag {...(props as object)}>
			{startIcon ? <span className="omni-button__start">{startIcon}</span> : null}
			{children}
			{endIcon ? <span className="omni-button__end">{endIcon}</span> : null}
		</Tag>
	)
})
