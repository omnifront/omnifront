import { focusInside } from "../dom/focus"
import { pushLayer, type Layer } from "../dom/layers"
import { OpenMachine, part, type OpenProps, type OpenState, type Part } from "./machine"

export interface MenuProps extends OpenProps {
	/** Base for the ids of the trigger and the menu. */
	id: string
	/** Move focus to the first item when it opens. Default true. */
	autoFocus?: boolean | undefined
}

export interface MenuState extends OpenState {
	id: string
}

export interface MenuItemOptions {
	disabled?: boolean | undefined
	/** Close the menu after this item is chosen. Default true. */
	closeOnSelect?: boolean | undefined
	onSelect?: ((event: Event) => void) | undefined
}

export interface MenuElements {
	content: HTMLElement
	/** The element the menu hangs from (usually the button). Clicks on it do not count as "outside". */
	anchor?: Element | null | undefined
	/** Place the menu next to the anchor: pass `autoPosition` from `@omnifront/ui/position`. */
	position?: ((anchor: Element, floating: HTMLElement) => () => void) | undefined
}

const ITEM = '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"]), [role="menuitemradio"]:not([aria-disabled="true"])'

/**
 * Behaviour of a menu: open state with exit delay, arrow-key / Home / End / type-ahead navigation
 * over real focus (so screen readers follow it), Escape and outside click to close, Tab closes,
 * focus returns to where it came from.
 */
export class Menu extends OpenMachine<MenuProps, MenuState> {
	private layer: Layer | undefined
	private typed = ""
	private typedAt = 0
	protected override defaultExitDuration = 120

	constructor(props: MenuProps) {
		super(props)
		this.start()
	}

	protected compute(): MenuState {
		return { ...this.openState(), id: this.props.id }
	}

	private onContentKeydown = (event: Event): void => {
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
		const items = Array.from(list.querySelectorAll<HTMLElement>(ITEM))
		const current = items.indexOf(list.ownerDocument.activeElement as HTMLElement)
		const go = (i: number): void => {
			e.preventDefault()
			items[(i + items.length) % items.length]?.focus()
		}
		if (items.length === 0) return
		if (e.key === "ArrowDown") go(current + 1)
		else if (e.key === "ArrowUp") go(current < 0 ? -1 : current - 1)
		else if (e.key === "Home") go(0)
		else if (e.key === "End") go(items.length - 1)
		else if ((e.key === "Enter" || e.key === " ") && current >= 0) {
			e.preventDefault()
			items[current]?.click()
		} else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
			// Type-ahead: letters typed in quick succession build a prefix to match against item text.
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

	connect(): { trigger: Part; content: Part; separator: Part } {
		const { id } = this.props
		const { open } = this.getSnapshot()
		return {
			trigger: part(
				{
					id: `${id}-trigger`,
					"aria-haspopup": "menu",
					"aria-expanded": open ? "true" : "false",
					"aria-controls": open ? `${id}-menu` : undefined,
				},
				{
					click: (event) => this.toggle(event),
					keydown: (event) => {
						const key = (event as KeyboardEvent).key
						if (key === "ArrowDown" || key === "ArrowUp") {
							event.preventDefault()
							this.show()
						}
					},
				},
			),
			content: part(
				{ id: `${id}-menu`, role: "menu", "aria-labelledby": `${id}-trigger`, tabindex: -1, "data-state": open ? "open" : "closed" },
				{ keydown: this.onContentKeydown },
			),
			separator: part({ role: "separator" }),
		}
	}

	/** Attributes and click handler for one item. Disabled items are skipped by keyboard navigation. */
	item(options: MenuItemOptions = {}): Part {
		const disabled = options.disabled === true
		return part(
			{ role: "menuitem", tabindex: -1, "aria-disabled": disabled ? "true" : undefined, "data-disabled": disabled ? "" : undefined },
			{
				click: (event) => {
					if (disabled) return
					options.onSelect?.(event)
					if (options.closeOnSelect !== false) this.hide("select", event)
				},
			},
		)
	}

	/** DOM side: place the menu, focus the first item, close on outside press. Returns the cleanup. */
	attach(elements: MenuElements): () => void {
		const { content, anchor } = elements
		const doc = content.ownerDocument
		// Focus goes back to the anchor (some browsers do not focus a button on click), else to where it was.
		const previous = anchor instanceof HTMLElement ? anchor : (doc.activeElement as HTMLElement | null)
		const layer = (this.layer = pushLayer())
		const cleanups: Array<() => void> = []
		if (anchor && elements.position) cleanups.push(elements.position(anchor, content))
		const onPointerdown = (event: Event): void => {
			const target = event.target as Node
			if (!layer.isTop() || content.contains(target) || anchor?.contains(target)) return
			this.hide("outsidePress", event)
		}
		doc.addEventListener("pointerdown", onPointerdown)
		cleanups.push(() => doc.removeEventListener("pointerdown", onPointerdown))
		if (this.props.autoFocus !== false) {
			const first = content.querySelector<HTMLElement>(ITEM)
			if (first) first.focus({ preventScroll: true })
			else focusInside(content)
		}
		return () => {
			for (const c of cleanups) c()
			layer.remove()
			if (this.layer === layer) this.layer = undefined
			if (previous?.isConnected) previous.focus({ preventScroll: true })
		}
	}
}

export const createMenu = (props: MenuProps): Menu => new Menu(props)
