import type { Machine, Part } from "@omnifront/ui"
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react"

const ATTRS: Record<string, string> = { class: "className", for: "htmlFor", tabindex: "tabIndex", readonly: "readOnly" }
// DOM event name to React prop name, where React capitalises the second word.
const EVENTS: Record<string, string> = {
	keydown: "onKeyDown",
	keyup: "onKeyUp",
	pointerdown: "onPointerDown",
	pointerup: "onPointerUp",
	mousedown: "onMouseDown",
	mouseup: "onMouseUp",
	mouseenter: "onMouseEnter",
	mouseleave: "onMouseLeave",
	pointerenter: "onPointerEnter",
	pointerleave: "onPointerLeave",
}

/** A framework-free Part as React props: `class` becomes `className`, `keydown` becomes `onKeyDown`, and so on. */
export function toReactProps(part: Part): Record<string, unknown> {
	const props: Record<string, unknown> = {}
	for (const [name, value] of Object.entries(part.attrs)) {
		if (value !== undefined) props[ATTRS[name] ?? name] = value
	}
	for (const [event, handler] of Object.entries(part.on)) {
		props[EVENTS[event] ?? `on${event[0]?.toUpperCase()}${event.slice(1)}`] = handler
	}
	return props
}

/**
 * Props for an element: the machine's part first, then what the caller passed. For event handlers
 * the caller's runs first, then the machine's (unless the caller called `preventDefault`).
 */
export function mergeProps(machine: Record<string, unknown>, own: Record<string, unknown> = {}): Record<string, unknown> {
	const out: Record<string, unknown> = { ...machine }
	for (const [key, value] of Object.entries(own)) {
		if (value === undefined) continue
		const base = machine[key]
		if (/^on[A-Z]/.test(key) && typeof base === "function" && typeof value === "function") {
			out[key] = (event: { defaultPrevented?: boolean }) => {
				;(value as (e: unknown) => void)(event)
				if (!event.defaultPrevented) (base as (e: unknown) => void)(event)
			}
		} else if (key === "className") {
			out[key] = [machine[key], value].filter(Boolean).join(" ")
		} else if (key === "style" && typeof base === "object") {
			out[key] = { ...(base as object), ...(value as object) }
		} else out[key] = value
	}
	return out
}

export const cx = (...names: Array<string | false | null | undefined>): string => names.filter(Boolean).join(" ")

/**
 * One machine per component instance, fed the latest props on every render and read through
 * useSyncExternalStore (so it is safe with concurrent rendering and SSR). Props are applied
 * silently during render; listeners hear about it right after commit.
 */
type PropsOf<M> = M extends Machine<infer P, object> ? P : never
type StateOf<M> = M extends Machine<object, infer S> ? S : never

export function useMachine<M extends Machine<object, object>>(create: () => M, props: Partial<PropsOf<M>>): [M, StateOf<M>] {
	const ref = useRef<M | null>(null)
	if (ref.current === null) ref.current = create()
	const machine = ref.current
	machine.setProps(props as Partial<object>, { silent: true })
	const state = useSyncExternalStore(machine.subscribe, machine.getSnapshot, machine.getServerSnapshot) as StateOf<M>
	useIsomorphicLayoutEffect(() => machine.flush())
	useEffect(() => () => machine.dispose(), [machine])
	return [machine, state]
}

// useLayoutEffect warns during server rendering; on the server there is nothing to flush anyway.
export const useIsomorphicLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect
