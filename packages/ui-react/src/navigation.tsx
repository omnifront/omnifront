import { ICON_PATHS, bottomNavigationActionPart, createSpeedDial, displayPart, type CloseReason, type SpeedDialParts } from "@omnifront/ui"
import { createContext, forwardRef, useContext, useId, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode } from "react"
import { Fab } from "./icon-buttons"
import { mergeProps, toReactProps, useMachine } from "./internal"
import { useDefaultProps } from "./theme"

// ---- BottomNavigation ----

const NavContext = createContext<{ value: unknown; showLabels: boolean; onChange: ((event: MouseEvent<HTMLElement>, value: unknown) => void) | undefined }>({ value: undefined, showLabels: false, onChange: undefined })

export interface BottomNavigationProps extends Omit<ComponentPropsWithoutRef<"nav">, "onChange"> {
	/** The `value` of the current action. Controlled: update it in `onChange`. */
	value?: string | number | undefined
	onChange?: ((event: MouseEvent<HTMLElement>, value: string | number) => void) | undefined
	/** Show every label, not only the current one's. */
	showLabels?: boolean | undefined
}

/** A bar of 3 to 5 top-level destinations at the bottom of a phone screen. Give the `nav` an `aria-label`. */
export const BottomNavigation = forwardRef<HTMLElement, BottomNavigationProps>(function BottomNavigation(rawProps, ref) {
	const { value, onChange, showLabels = false, className, ...rest } = useDefaultProps("OmniBottomNavigation", rawProps)
	return (
		<NavContext.Provider value={{ value, showLabels, onChange: onChange as never }}>
			<nav {...mergeProps(toReactProps(displayPart("omni-bottom-navigation", { showLabels })), { ...rest, className })} ref={ref} />
		</NavContext.Provider>
	)
})

export interface BottomNavigationActionProps extends Omit<ComponentPropsWithoutRef<"button">, "value"> {
	value?: string | number | undefined
	label?: ReactNode | undefined
	icon?: ReactNode | undefined
}

export const BottomNavigationAction = forwardRef<HTMLButtonElement, BottomNavigationActionProps>(function BottomNavigationAction({ value, label, icon, disabled, onClick, className, ...rest }, ref) {
	const nav = useContext(NavContext)
	const selected = value !== undefined && value === nav.value
	return (
		<button
			{...mergeProps(toReactProps(bottomNavigationActionPart({ selected, showLabel: nav.showLabels, disabled })), {
				...rest,
				className,
				onClick: (event: MouseEvent<HTMLButtonElement>) => {
					onClick?.(event)
					if (value !== undefined) nav.onChange?.(event, value)
				},
			})}
			ref={ref}
		>
			{icon}
			<span className="omni-bottom-navigation__label">{label}</span>
		</button>
	)
})

// ---- SpeedDial ----

const DialContext = createContext<SpeedDialParts | null>(null)

export interface SpeedDialProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
	/** The main button's accessible name. Required: the button is only an icon. */
	ariaLabel: string
	/** The main button's icon. Default a plus (it turns into a cross when open). */
	icon?: ReactNode | undefined
	direction?: "up" | "down" | "left" | "right" | undefined
	open?: boolean | undefined
	defaultOpen?: boolean | undefined
	onOpen?: ((event: Event | undefined) => void) | undefined
	onClose?: ((event: Event | undefined, reason: CloseReason) => void) | undefined
	children?: ReactNode | undefined
}

/** A floating button that fans out a few actions (SpeedDialAction). Opens on click or hover; arrow keys move between actions; Escape closes. */
export const SpeedDial = forwardRef<HTMLDivElement, SpeedDialProps>(function SpeedDial(rawProps, ref) {
	const { ariaLabel, icon, direction, open, defaultOpen, onOpen, onClose, className, children, ...rest } = useDefaultProps("OmniSpeedDial", rawProps)
	const id = useId()
	const [dial] = useMachine(() => createSpeedDial({ id, defaultOpen }), {
		id,
		open,
		direction,
		onOpenChange: (next: boolean, reason: CloseReason, event?: Event) => (next ? onOpen?.(event) : onClose?.(event, reason)),
	})
	const parts = dial.connect()
	return (
		<DialContext.Provider value={parts}>
			<div {...mergeProps(toReactProps(displayPart("omni-speed-dial")), mergeProps(toReactProps(parts.root), { ...rest, className }))} ref={ref}>
				<Fab {...toReactProps(parts.trigger)} className="omni-speed-dial__trigger" aria-label={ariaLabel}>
					{icon ?? (
						<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
							<path d={ICON_PATHS.add} />
						</svg>
					)}
				</Fab>
				<div {...toReactProps(parts.actions)} className="omni-speed-dial__actions">
					{children}
				</div>
			</div>
		</DialContext.Provider>
	)
})

export interface SpeedDialActionProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
	icon: ReactNode
	/** The action's name: its accessible name and the caption beside it. */
	tooltipTitle: string
}

export const SpeedDialAction = forwardRef<HTMLButtonElement, SpeedDialActionProps>(function SpeedDialAction({ icon, tooltipTitle, onClick, ...rest }, ref) {
	const parts = useContext(DialContext)
	return (
		<div className="omni-speed-dial__action" role="none">
			<Fab {...mergeProps(parts ? toReactProps(parts.action) : {}, { ...rest, onClick })} size="small" aria-label={tooltipTitle} ref={ref}>
				{icon}
			</Fab>
			<span className="omni-speed-dial__label" aria-hidden="true">
				{tooltipTitle}
			</span>
		</div>
	)
})
