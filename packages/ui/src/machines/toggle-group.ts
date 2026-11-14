import { Machine, part, stableList, type Part } from "./machine"

export interface ToggleGroupProps {
	id: string
	/** The pressed values. Controlled when given; leave undefined to let the machine keep its own. */
	value?: readonly string[] | undefined
	defaultValue?: readonly string[] | undefined
	/** At most one pressed at a time, and pressing it again unpresses it. */
	exclusive?: boolean | undefined
	onValueChange?: ((value: string[], event?: Event) => void) | undefined
	disabled?: boolean | undefined
	orientation?: "horizontal" | "vertical" | undefined
}

export interface ToggleGroupState {
	id: string
	value: string[]
	exclusive: boolean
	disabled: boolean
}

export interface ToggleItemOptions {
	disabled?: boolean | undefined
}

/**
 * State of a group of toggle buttons: which are pressed (controlled or not), one at a time or several.
 * Every item is a real `<button>` with `aria-pressed`, so Tab, Enter and Space are the browser's own.
 */
export class ToggleGroup extends Machine<ToggleGroupProps, ToggleGroupState> {
	private internal: string[]

	constructor(props: ToggleGroupProps) {
		super(props)
		this.internal = [...(props.defaultValue ?? [])]
		this.start()
	}

	protected compute(): ToggleGroupState {
		return {
			id: this.props.id,
			value: stableList(this.peek()?.value, [...(this.props.value ?? this.internal)]),
			exclusive: this.props.exclusive === true,
			disabled: this.props.disabled === true,
		}
	}

	/** Press or unpress one value. */
	toggle = (value: string, event?: Event): void => {
		const s = this.getSnapshot()
		if (s.disabled) return
		const pressed = s.value.includes(value)
		const next = s.exclusive ? (pressed ? [] : [value]) : pressed ? s.value.filter((v) => v !== value) : [...s.value, value]
		this.props.onValueChange?.(next, event)
		if (this.props.value === undefined) {
			this.internal = next
			this.refresh()
		}
	}

	connect(): { group: Part } {
		const orientation = this.props.orientation ?? "horizontal"
		return {
			group: part({
				role: "group",
				"aria-orientation": undefined,
				"data-orientation": orientation,
				"data-disabled": this.getSnapshot().disabled ? "" : undefined,
			}),
		}
	}

	/** Attributes and click handler for one toggle button. */
	item(value: string, options: ToggleItemOptions = {}): Part {
		const s = this.getSnapshot()
		const selected = s.value.includes(value)
		const disabled = s.disabled || options.disabled === true
		return part(
			{
				class: "omni-toggle-button",
				type: "button",
				"aria-pressed": selected ? "true" : "false",
				"data-selected": selected ? "" : undefined,
				disabled: disabled || undefined,
			},
			{ click: (event) => this.toggle(value, event) },
		)
	}
}

export const createToggleGroup = (props: ToggleGroupProps): ToggleGroup => new ToggleGroup(props)
