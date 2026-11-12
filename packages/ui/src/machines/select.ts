import { focusInside } from "../dom/focus"
import { pushLayer, type Layer } from "../dom/layers"
import { OpenMachine, part, type OpenProps, type OpenState, type Part } from "./machine"

export interface SelectOption {
	value: string
	/** What is shown, in the list and in the closed select. */
	label: string
	disabled?: boolean | undefined
}

export interface SelectProps extends OpenProps {
	/** Base for the ids of the trigger and the list. Use the same `id` as the field machine so the label links up. */
	id: string
	options: readonly SelectOption[]
	/** Controlled value. Leave undefined to let the machine keep its own. `""` means nothing is selected. */
	value?: string | undefined
	defaultValue?: string | undefined
	onValueChange?: ((value: string, event?: Event) => void) | undefined
	disabled?: boolean | undefined
}

export interface SelectState extends OpenState {
	id: string
	value: string | undefined
	/** The selected option's label, or `""`. */
	label: string
	/** A value is selected. */
	filled: boolean
	disabled: boolean
}

export interface SelectElements {
	content: HTMLElement
	/** The closed select (the combobox). Clicks on it do not count as "outside". */
	trigger?: Element | null | undefined
	/** Place the list under the trigger: pass a function around `autoPosition` from `@omnifront/ui/position`. */
	position?: ((anchor: Element, floating: HTMLElement) => () => void) | undefined
}

const OPTION = '[role="option"]:not([aria-disabled="true"])'

/**
 * Behaviour of a select (a combobox that opens a listbox): value and open state (each controlled or
 * not), keyboard use on the closed select (Enter, Space and the arrows open it) and in the list
 * (arrows, Home, End and type-ahead move real focus; Enter and Space choose; Escape and Tab close),
 * outside press to close, focus on the selected option when it opens and back on the select after.
 */
export class Select extends OpenMachine<SelectProps, SelectState> {
	private internalValue: string | undefined
	private layer: Layer | undefined
	private typed = ""
	private typedAt = 0
	protected override defaultExitDuration = 120

	constructor(props: SelectProps) {
		super(props)
		this.internalValue = props.defaultValue
		this.start()
	}

	protected compute(): SelectState {
		const value = this.props.value ?? this.internalValue
		const selected = this.props.options.find((o) => o.value === value)
		return {
			...this.openState(),
			id: this.props.id,
			value,
			label: selected?.label ?? "",
			filled: value !== undefined && value !== "",
			disabled: this.props.disabled === true,
		}
	}

	/** Choose a value (from a click or Enter), then close. Choosing the current value just closes. */
	choose = (value: string, event?: Event): void => {
		if (this.props.disabled) return
		if (value !== this.getSnapshot().value) {
			this.props.onValueChange?.(value, event)
			if (this.props.value === undefined) {
				this.internalValue = value
				this.refresh()
			}
		}
		this.hide("select", event)
	}

	private onTriggerKeydown = (event: Event): void => {
		const key = (event as KeyboardEvent).key
		if (this.props.disabled || (key !== "Enter" && key !== " " && key !== "ArrowDown" && key !== "ArrowUp")) return
		event.preventDefault()
		this.request(true, "trigger", event)
	}

	private onListKeydown = (event: Event): void => {
		const e = event as KeyboardEvent
		const list = e.currentTarget as HTMLElement
		if (e.key === "Escape") {
			if (this.layer && !this.layer.isTop()) return
			e.stopPropagation()
			this.hide("escapeKeyDown", e)
			return
		}
		if (e.key === "Tab") {
			e.preventDefault()
			this.hide("tab", e)
			return
		}
		const items = Array.from(list.querySelectorAll<HTMLElement>(OPTION))
		if (items.length === 0) return
		const current = items.indexOf(list.ownerDocument.activeElement as HTMLElement)
		const go = (i: number): void => {
			e.preventDefault()
			items[(i + items.length) % items.length]?.focus()
		}
		if (e.key === "ArrowDown") go(current + 1)
		else if (e.key === "ArrowUp") go(current < 0 ? -1 : current - 1)
		else if (e.key === "Home") go(0)
		else if (e.key === "End") go(items.length - 1)
		else if ((e.key === "Enter" || e.key === " ") && current >= 0) {
			e.preventDefault()
			items[current]?.click()
		} else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
			// Type-ahead: letters typed in quick succession build a prefix to match against the labels.
			const now = this.scheduler.now()
			this.typed = now - this.typedAt > 500 ? e.key.toLowerCase() : this.typed + e.key.toLowerCase()
			this.typedAt = now
			const order = [...items.slice(current + 1), ...items.slice(0, current + 1)]
			const hit = order.find((el) => (el.textContent ?? "").trim().toLowerCase().startsWith(this.typed))
			if (hit) {
				e.preventDefault()
				hit.focus()
			}
		}
	}

	connect(): { trigger: Part; listbox: Part } {
		const { id, open, disabled } = this.getSnapshot()
		return {
			trigger: part(
				{
					id,
					role: "combobox",
					"aria-haspopup": "listbox",
					"aria-expanded": open ? "true" : "false",
					"aria-controls": open ? `${id}-listbox` : undefined,
					// Read aloud as "<label> <selected text>": the label, then the trigger's own content.
					"aria-labelledby": `${id}-label ${id}`,
					"aria-disabled": disabled ? "true" : undefined,
					tabindex: disabled ? -1 : 0,
					"data-state": open ? "open" : "closed",
					"data-disabled": disabled ? "" : undefined,
				},
				{ click: (event) => !disabled && this.toggle(event), keydown: this.onTriggerKeydown },
			),
			listbox: part(
				{ id: `${id}-listbox`, role: "listbox", "aria-labelledby": `${id}-label`, tabindex: -1, "data-state": open ? "open" : "closed" },
				{ keydown: this.onListKeydown },
			),
		}
	}

	/** Attributes and click handler for one option. A disabled option cannot be chosen or focused by the arrows. */
	option(option: SelectOption): Part {
		const selected = option.value === this.getSnapshot().value
		const disabled = option.disabled === true
		return part(
			{
				role: "option",
				tabindex: -1,
				"data-value": option.value,
				"aria-selected": selected ? "true" : "false",
				"aria-disabled": disabled ? "true" : undefined,
				"data-selected": selected ? "" : undefined,
				"data-disabled": disabled ? "" : undefined,
			},
			{ click: (event) => !disabled && this.choose(option.value, event) },
		)
	}

	/** DOM side: place the list, focus the selected option (else the first), close on a press outside. Returns the cleanup. */
	attach(elements: SelectElements): () => void {
		const { content, trigger } = elements
		const doc = content.ownerDocument
		const returnTo = trigger instanceof HTMLElement ? trigger : (doc.activeElement as HTMLElement | null)
		const layer = (this.layer = pushLayer())
		const cleanups: Array<() => void> = []
		if (trigger && elements.position) cleanups.push(elements.position(trigger, content))
		const onPointerdown = (event: Event): void => {
			const target = event.target as Node
			if (!layer.isTop() || content.contains(target) || trigger?.contains(target)) return
			this.hide("outsidePress", event)
		}
		doc.addEventListener("pointerdown", onPointerdown)
		cleanups.push(() => doc.removeEventListener("pointerdown", onPointerdown))
		const target = content.querySelector<HTMLElement>(`${OPTION}[aria-selected="true"]`) ?? content.querySelector<HTMLElement>(OPTION)
		if (target) target.focus({ preventScroll: true })
		else focusInside(content)
		target?.scrollIntoView?.({ block: "nearest" })
		return () => {
			for (const c of cleanups) c()
			layer.remove()
			if (this.layer === layer) this.layer = undefined
			if (returnTo?.isConnected) returnTo.focus({ preventScroll: true })
		}
	}
}

export const createSelect = (props: SelectProps): Select => new Select(props)
