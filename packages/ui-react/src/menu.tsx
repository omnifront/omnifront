import { createMenu, type CloseReason, type Menu as MenuMachine } from "@omnifront/ui"
import { autoPosition, type Placement } from "@omnifront/ui/position"
import { createContext, useContext, useEffect, useId, useState, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode } from "react"
import { cx, mergeProps, toReactProps, useMachine } from "./internal"
import { Portal, useDefaultProps } from "./theme"

export type MenuCloseReason = Extract<CloseReason, "escapeKeyDown" | "outsidePress" | "tab" | "select" | "programmatic">

export interface MenuProps {
	/** The element the menu hangs from, usually the button that opened it. */
	anchorEl: Element | null
	open: boolean
	onClose?: (event: Event | undefined, reason: MenuCloseReason) => void
	children?: ReactNode | undefined
	/** Where it goes relative to the anchor. Default `bottom-start`; it flips when there is no room. */
	placement?: Placement | undefined
	/** Move focus to the first item on open. Default true. */
	autoFocus?: boolean | undefined
	/** Keep the menu in the page (hidden) while closed. */
	keepMounted?: boolean | undefined
	className?: string | undefined
	/** The anchor's `id`-less trigger can be labelled through this. */
	"aria-label"?: string | undefined
}

const MenuContext = createContext<MenuMachine | null>(null)

/** Dropdown menu. Arrow keys, Home, End and typing move focus; Enter or Space choose; Escape and a click outside close. */
export function Menu(rawProps: MenuProps): ReactNode {
	const { anchorEl, open, onClose, children, placement, autoFocus, keepMounted, className, "aria-label": label } = useDefaultProps("OmniMenu", rawProps)
	const id = useId()
	const [menu, state] = useMachine(() => createMenu({ id }), {
		id,
		open,
		autoFocus,
		onOpenChange: (_open: boolean, reason: CloseReason, event?: Event) => onClose?.(event, reason as MenuCloseReason),
	})
	const [list, setList] = useState<HTMLElement | null>(null)
	useEffect(() => {
		if (!state.open || !list) return undefined
		return menu.attach({ content: list, anchor: anchorEl, position: (anchor, floating) => autoPosition(anchor, floating, placement ? { placement } : {}) })
	}, [menu, state.open, list, anchorEl, placement])

	if (!state.mounted && !keepMounted) return null
	const parts = menu.connect()
	return (
		<Portal>
			<MenuContext.Provider value={menu}>
				<ul
					{...mergeProps(toReactProps(parts.content), { className: cx("omni-menu", className), "aria-label": label })}
					aria-labelledby={label ? undefined : (anchorEl?.id || undefined)}
					hidden={state.mounted ? undefined : true}
					ref={setList}
				>
					{children}
				</ul>
			</MenuContext.Provider>
		</Portal>
	)
}

export interface MenuItemProps extends Omit<ComponentPropsWithoutRef<"li">, "onClick"> {
	disabled?: boolean | undefined
	selected?: boolean | undefined
	dense?: boolean | undefined
	/** Called when the item is chosen by click, Enter or Space. The menu then closes. */
	onClick?: ((event: MouseEvent<HTMLLIElement>) => void) | undefined
}

export function MenuItem({ disabled, selected, dense, onClick, className, children, ...rest }: MenuItemProps): ReactNode {
	const menu = useContext(MenuContext)
	const part = menu?.item({ disabled, onSelect: onClick as ((e: Event) => void) | undefined })
	return (
		<li
			{...mergeProps(part ? toReactProps(part) : {}, rest)}
			className={cx("omni-menu__item", className)}
			data-selected={selected ? "" : undefined}
			data-dense={dense ? "" : undefined}
		>
			{children}
		</li>
	)
}

export function MenuDivider(): ReactNode {
	return <li role="separator" className="omni-menu__divider" />
}
