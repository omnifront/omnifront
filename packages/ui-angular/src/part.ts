import { Directive, ElementRef, Input, OnChanges, OnDestroy, inject } from "@angular/core"
import type { Part } from "@omnifront/ui"

/**
 * Applies a framework-free Part to a real element: attributes, classes and event handlers.
 * Angular templates cannot spread an object onto an element the way React and Vue can, so this
 * does it by hand, and removes what a later Part no longer has. Classes are only added (never
 * removed wholesale), so classes the user put on the element survive.
 */
export class PartBinding {
	private current: Part | null = null
	private attrs = new Set<string>()
	private classes = new Set<string>()
	private listeners = new Map<string, EventListener>()

	constructor(private readonly element: HTMLElement) {}

	apply(part: Part | null): void {
		this.current = part
		const next = new Set<string>()
		const nextClasses = new Set<string>()
		for (const [name, value] of Object.entries(part?.attrs ?? {})) {
			// `checked` is a property: the attribute only sets the default, and cannot uncheck.
			if (name === "checked") {
				;(this.element as HTMLInputElement).checked = value === true
				continue
			}
			// An input's `value` is a property too (the attribute is only its default): a slider must follow it.
			if (name === "value" && this.element instanceof HTMLInputElement && value !== undefined) {
				this.element.value = String(value)
				next.add(name)
				this.element.setAttribute(name, String(value))
				continue
			}
			if (value === undefined || value === false) continue
			if (name === "class") {
				for (const c of String(value).split(/\s+/).filter(Boolean)) {
					nextClasses.add(c)
					this.element.classList.add(c)
				}
				continue
			}
			next.add(name)
			this.element.setAttribute(name, value === true ? "" : String(value))
		}
		for (const name of this.attrs) if (!next.has(name)) this.element.removeAttribute(name)
		for (const c of this.classes) if (!nextClasses.has(c)) this.element.classList.remove(c)
		this.attrs = next
		this.classes = nextClasses
		// Listeners are added once per event name and always call the latest handler.
		for (const event of Object.keys(part?.on ?? {})) {
			if (this.listeners.has(event)) continue
			const listener: EventListener = (e) => this.current?.on[event]?.(e)
			this.listeners.set(event, listener)
			this.element.addEventListener(event, listener)
		}
	}

	destroy(): void {
		for (const [event, listener] of this.listeners) this.element.removeEventListener(event, listener)
		this.listeners.clear()
		this.current = null
	}
}

/** `<div [omniPart]="parts().content">`: apply a Part to the element. */
@Directive({ selector: "[omniPart]", standalone: true })
export class OmniPart implements OnChanges, OnDestroy {
	@Input() omniPart: Part | null = null
	private readonly binding = new PartBinding(inject<ElementRef<HTMLElement>>(ElementRef).nativeElement)

	ngOnChanges(): void {
		this.binding.apply(this.omniPart)
	}

	ngOnDestroy(): void {
		this.binding.destroy()
	}
}

/** Merge extra attributes into a Part (used for data attributes that are not part of a machine). */
export function withAttrs(part: Part, attrs: Part["attrs"]): Part {
	return { attrs: { ...part.attrs, ...attrs }, on: part.on }
}
