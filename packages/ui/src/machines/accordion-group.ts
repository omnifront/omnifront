import { Machine, stableList } from "./machine"

export interface AccordionGroupProps {
	/** Which panels are open, by the `value` each Accordion carries. A string (or null) when one at a time, a list with `multiple`. Controlled; leave undefined to let the machine keep it. */
	value?: string | string[] | null | undefined
	defaultValue?: string | string[] | null | undefined
	/** Let several stay open. Default false: opening one closes the others. */
	multiple?: boolean | undefined
	/** Gets the new value in the same shape as `value`. */
	onValueChange?: ((value: string | string[] | null, event?: Event) => void) | undefined
}

export interface AccordionGroupState {
	/** The open panels (at most one unless `multiple`). */
	open: string[]
}

const toList = (v: string | string[] | null | undefined): string[] => (v === null || v === undefined ? [] : Array.isArray(v) ? v : [v])

/** Which Accordion of a group is open: one at a time (like MUI's usual pattern) or any number. */
export class AccordionGroup extends Machine<AccordionGroupProps, AccordionGroupState> {
	private internal: string[]

	constructor(props: AccordionGroupProps = {}) {
		super(props)
		this.internal = toList(props.defaultValue)
		this.start()
	}

	protected compute(): AccordionGroupState {
		const open = toList(this.props.value === undefined ? this.internal : this.props.value)
		return { open: stableList(this.peek()?.open, this.props.multiple ? open : open.slice(0, 1)) }
	}

	isExpanded(key: string): boolean {
		return this.getSnapshot().open.includes(key)
	}

	/** An Accordion of the group asks to open or close. */
	set(key: string, expanded: boolean, event?: Event): void {
		const current = this.getSnapshot().open
		const next = this.props.multiple ? (expanded ? [...current.filter((k) => k !== key), key] : current.filter((k) => k !== key)) : expanded ? [key] : []
		const value = this.props.multiple ? next : (next[0] ?? null)
		this.props.onValueChange?.(value, event)
		if (this.props.value === undefined) {
			this.internal = next
			this.refresh()
		}
	}
}

export const createAccordionGroup = (props: AccordionGroupProps = {}): AccordionGroup => new AccordionGroup(props)
