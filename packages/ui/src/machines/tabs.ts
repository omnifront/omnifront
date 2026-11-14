import { Machine, part, type Part } from "./machine"

export interface TabsProps {
	/** Base for the ids that link each tab to its panel. */
	id: string
	/** Controlled selected value. */
	value?: string | undefined
	defaultValue?: string | undefined
	onValueChange?: ((value: string, event?: Event) => void) | undefined
	orientation?: "horizontal" | "vertical" | undefined
	/** Arrow keys also select the focused tab (default false: they only move focus, Enter or Space selects). */
	selectionFollowsFocus?: boolean | undefined
}

export interface TabsState {
	id: string
	value: string | undefined
	orientation: "horizontal" | "vertical"
}

export interface TabOptions {
	disabled?: boolean | undefined
}

const TAB = '[role="tab"]:not([aria-disabled="true"])'

/** Behaviour of a tab set: selection (controlled or not), roving tabindex, arrow / Home / End keys, tab-to-panel ids. */
export class Tabs extends Machine<TabsProps, TabsState> {
	private internalValue: string | undefined

	constructor(props: TabsProps) {
		super(props)
		this.internalValue = props.defaultValue
		this.start()
	}

	protected compute(): TabsState {
		return {
			id: this.props.id,
			value: this.props.value ?? this.internalValue,
			orientation: this.props.orientation ?? "horizontal",
		}
	}

	select = (value: string, event?: Event): void => {
		if (value === this.getSnapshot().value) return
		this.props.onValueChange?.(value, event)
		if (this.props.value === undefined) {
			this.internalValue = value
			this.refresh()
		}
	}

	private onListKeydown = (event: Event): void => {
		const e = event as KeyboardEvent
		const list = e.currentTarget as HTMLElement
		const { orientation } = this.getSnapshot()
		const rtl = list.ownerDocument.defaultView?.getComputedStyle(list).direction === "rtl"
		const prev = orientation === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft"
		const next = orientation === "vertical" ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight"
		if (e.key !== prev && e.key !== next && e.key !== "Home" && e.key !== "End") return
		const tabs = Array.from(list.querySelectorAll<HTMLElement>(TAB))
		if (tabs.length === 0) return
		const current = tabs.indexOf(list.ownerDocument.activeElement as HTMLElement)
		const index =
			e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (current + (e.key === next ? 1 : -1) + tabs.length) % tabs.length
		e.preventDefault()
		const target = tabs[index] as HTMLElement
		target.focus()
		const value = target.getAttribute("data-value")
		if (this.props.selectionFollowsFocus && value !== null) this.select(value, e)
	}

	connect(): { root: Part; list: Part } {
		const { orientation } = this.getSnapshot()
		return {
			root: part({ "data-orientation": orientation }),
			list: part({ role: "tablist", "aria-orientation": orientation, "data-orientation": orientation }, { keydown: this.onListKeydown }),
		}
	}

	tab(value: string, options: TabOptions = {}): Part {
		const { id, value: selected } = this.getSnapshot()
		const isSelected = value === selected
		const disabled = options.disabled === true
		return part(
			{
				type: "button",
				role: "tab",
				id: `${id}-tab-${value}`,
				"data-value": value,
				"aria-selected": isSelected ? "true" : "false",
				"aria-controls": `${id}-panel-${value}`,
				// Roving tabindex: only the selected tab is in the Tab order (all of them if nothing is selected yet).
				tabindex: isSelected || selected === undefined ? 0 : -1,
				"aria-disabled": disabled ? "true" : undefined,
				"data-selected": isSelected ? "" : undefined,
				"data-disabled": disabled ? "" : undefined,
			},
			{ click: (event) => !disabled && this.select(value, event) },
		)
	}

	panel(value: string): Part {
		const { id, value: selected } = this.getSnapshot()
		const isSelected = value === selected
		return part({
			role: "tabpanel",
			id: `${id}-panel-${value}`,
			"aria-labelledby": `${id}-tab-${value}`,
			hidden: !isSelected,
			tabindex: 0,
			"data-selected": isSelected ? "" : undefined,
		})
	}

	/**
	 * Slide the indicator under the selected tab: sets `--omni-tabs-indicator-start` and
	 * `--omni-tabs-indicator-size` (px) on the list, and updates them when the selection or the size
	 * changes. Call once after mount; returns the cleanup.
	 */
	attach(list: HTMLElement): () => void {
		const update = (): void => {
			const selected = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
			const vertical = this.getSnapshot().orientation === "vertical"
			if (!selected) {
				list.style.setProperty("--omni-tabs-indicator-size", "0px")
				return
			}
			const rtl = list.ownerDocument.defaultView?.getComputedStyle(list).direction === "rtl"
			const start = vertical
				? selected.offsetTop
				: rtl
					? list.clientWidth - (selected.offsetLeft + selected.offsetWidth)
					: selected.offsetLeft
			list.style.setProperty("--omni-tabs-indicator-start", `${start}px`)
			list.style.setProperty("--omni-tabs-indicator-size", `${vertical ? selected.offsetHeight : selected.offsetWidth}px`)
		}
		update()
		const off = this.subscribe(update)
		const RO = list.ownerDocument.defaultView?.ResizeObserver
		const observer = RO ? new RO(update) : undefined
		observer?.observe(list)
		return () => {
			off()
			observer?.disconnect()
		}
	}
}

export const createTabs = (props: TabsProps): Tabs => new Tabs(props)
