import { Machine, part, type Part } from "./machine"

export interface AccordionProps {
	/** Base for the ids of the heading button and the region. */
	id: string
	/** Controlled. Leave undefined to let the machine keep its own. */
	expanded?: boolean | undefined
	defaultExpanded?: boolean | undefined
	disabled?: boolean | undefined
	onExpandedChange?: ((expanded: boolean, event?: Event) => void) | undefined
}

export interface AccordionState {
	id: string
	expanded: boolean
	disabled: boolean
}

export interface AccordionParts {
	root: Part
	/** The `<button>` inside the heading: `aria-expanded`, `aria-controls`, click to toggle. */
	trigger: Part
	/** The collapsible region: `role="region"`, named by the trigger. */
	region: Part
}

/**
 * One collapsible section (MUI's Accordion). The trigger is a real `<button>` inside a heading, so
 * Enter, Space and Tab are the browser's own. The region is always in the DOM and hidden by CSS
 * (`visibility`, after a height transition), so it works the same on the server and with animation.
 */
export class Accordion extends Machine<AccordionProps, AccordionState> {
	private internal: boolean

	constructor(props: AccordionProps) {
		super(props)
		this.internal = props.defaultExpanded ?? false
		this.start()
	}

	protected compute(): AccordionState {
		return { id: this.props.id, expanded: this.props.expanded ?? this.internal, disabled: this.props.disabled === true }
	}

	toggle = (event?: Event): void => {
		const s = this.getSnapshot()
		if (s.disabled) return
		const next = !s.expanded
		this.props.onExpandedChange?.(next, event)
		if (this.props.expanded === undefined) {
			this.internal = next
			this.refresh()
		}
	}

	connect(): AccordionParts {
		const { id, expanded, disabled } = this.getSnapshot()
		const state = expanded ? "open" : "closed"
		return {
			root: part({ "data-state": state, "data-expanded": expanded ? "" : undefined, "data-disabled": disabled ? "" : undefined }),
			trigger: part(
				{
					id: `${id}-trigger`,
					type: "button",
					"aria-expanded": expanded ? "true" : "false",
					"aria-controls": `${id}-region`,
					// Not `disabled`, so the button stays reachable for screen reader users.
					"aria-disabled": disabled ? "true" : undefined,
					"data-state": state,
				},
				{ click: (event) => this.toggle(event) },
			),
			region: part({ id: `${id}-region`, role: "region", "aria-labelledby": `${id}-trigger`, "data-state": state }),
		}
	}
}

export const createAccordion = (props: AccordionProps): Accordion => new Accordion(props)
