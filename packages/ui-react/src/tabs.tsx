import { createTabs, type Tabs as TabsMachine } from "@omnifront/ui"
import { createContext, useContext, useEffect, useId, useState, type ComponentPropsWithoutRef, type ReactNode, type SyntheticEvent } from "react"
import { cx, mergeProps, toReactProps, useMachine } from "./internal"
import { useDefaultProps } from "./theme"

interface TabsContextValue {
	tabs: TabsMachine
	selected: string | undefined
	orientation: "horizontal" | "vertical"
}
const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs(name: string): TabsContextValue {
	const ctx = useContext(TabsContext)
	if (!ctx) throw new Error(`omnifront/ui-react: <${name}> must be inside <TabContext>`)
	return ctx
}

export interface TabContextProps {
	value?: string | undefined
	defaultValue?: string | undefined
	onChange?: (event: SyntheticEvent | Event | undefined, value: string) => void
	orientation?: "horizontal" | "vertical" | undefined
	/** Arrow keys select as well as focus. Default false (Enter or Space selects). */
	selectionFollowsFocus?: boolean | undefined
	children?: ReactNode | undefined
}

/** Holds the selected tab for a TabList and its TabPanels (the same shape as MUI Lab's TabContext). */
export function TabContext(rawProps: TabContextProps): ReactNode {
	const { value, defaultValue, onChange, orientation, selectionFollowsFocus, children } = useDefaultProps("OmniTabs", rawProps)
	const id = useId()
	const [tabs, state] = useMachine(() => createTabs({ id, defaultValue }), {
		id,
		value,
		orientation,
		selectionFollowsFocus,
		onValueChange: (next: string, event?: Event) => onChange?.(event, next),
	})
	return <TabsContext.Provider value={{ tabs, selected: state.value, orientation: state.orientation }}>{children}</TabsContext.Provider>
}

export interface TabListProps extends ComponentPropsWithoutRef<"div"> {
	color?: "primary" | "secondary" | undefined
	variant?: "standard" | "fullWidth" | undefined
	centered?: boolean | undefined
}

/** The row (or column) of tabs, with the sliding indicator. Children are Tab elements. */
export function TabList({ color = "primary", variant = "standard", centered, className, children, ...rest }: TabListProps): ReactNode {
	const { tabs, orientation } = useTabs("TabList")
	const parts = tabs.connect()
	const [list, setList] = useState<HTMLElement | null>(null)
	useEffect(() => (list ? tabs.attach(list) : undefined), [tabs, list])
	return (
		<div
			{...toReactProps(parts.root)}
			className={cx("omni-tabs", className)}
			data-color={color}
			data-variant={variant}
			data-centered={centered ? "" : undefined}
			data-orientation={orientation}
		>
			<div {...mergeProps(toReactProps(parts.list), rest)} className="omni-tabs__list" ref={setList}>
				{children}
				<span className="omni-tabs__indicator" aria-hidden="true" />
			</div>
		</div>
	)
}

export interface TabProps extends Omit<ComponentPropsWithoutRef<"button">, "value"> {
	value: string
	label?: ReactNode | undefined
	disabled?: boolean | undefined
}

export function Tab({ value, label, disabled, className, children, ...rest }: TabProps): ReactNode {
	const { tabs } = useTabs("Tab")
	return (
		<button {...mergeProps(toReactProps(tabs.tab(value, { disabled })), rest)} className={cx("omni-tab", className)}>
			{label}
			{children}
		</button>
	)
}

export interface TabPanelProps extends ComponentPropsWithoutRef<"div"> {
	value: string
	/** Keep the content in the page (hidden) while the tab is not selected. */
	keepMounted?: boolean | undefined
}

export function TabPanel({ value, keepMounted, className, children, ...rest }: TabPanelProps): ReactNode {
	const { tabs, selected } = useTabs("TabPanel")
	return (
		<div {...mergeProps(toReactProps(tabs.panel(value)), rest)} className={cx("omni-tab-panel", className)}>
			{value === selected || keepMounted ? children : null}
		</div>
	)
}
