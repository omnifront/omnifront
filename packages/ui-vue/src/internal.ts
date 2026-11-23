import { createIdGenerator, type Machine, type Part } from "@omnifront/ui"
import * as vue from "vue"
import { Comment, Fragment, onScopeDispose, shallowRef, watch, type ShallowRef, type VNode } from "vue"

type PropsOf<M> = M extends Machine<infer P, object> ? P : never
type StateOf<M> = M extends Machine<object, infer S> ? S : never

/**
 * A Part as props for `v-bind` (and `mergeProps`). Vue wants the same attribute names the DOM
 * has, so only the handlers change: `click` becomes `onClick`, `keydown` becomes `onKeydown`.
 */
export function toVueProps(part: Part): Record<string, unknown> {
	const props: Record<string, unknown> = {}
	for (const [name, value] of Object.entries(part.attrs)) if (value !== undefined) props[name] = value
	for (const [event, handler] of Object.entries(part.on)) props[`on${event[0]?.toUpperCase()}${event.slice(1)}`] = handler
	return props
}

const fallbackId = createIdGenerator("omni-v")
/** An id that is the same on server and client: Vue 3.5's `useId`, or a counter on older Vue. */
export function useUid(): string {
	return (vue as { useId?: () => string }).useId?.() ?? fallbackId()
}

/**
 * One machine per component instance. `props()` is read inside a synchronous watcher, so the
 * machine has the latest props before anything renders; its state is a shallowRef that
 * the machine's subscription keeps current (Vue lifecycle: the scope's disposal unsubscribes).
 */
export function useMachine<M extends Machine<object, object>>(
	create: () => M,
	props: () => Partial<PropsOf<M>>,
): { machine: M; state: Readonly<ShallowRef<StateOf<M>>> } {
	const machine = create()
	const state = shallowRef(machine.getSnapshot()) as ShallowRef<StateOf<M>>
	watch(
		props,
		(next) => {
			machine.setProps(next as Partial<object>)
			state.value = machine.getSnapshot() as StateOf<M>
		},
		{ immediate: true, flush: "sync" },
	)
	// Never subscribe on the server: there is no unmount there, so it would never be released.
	if (typeof window !== "undefined") {
		const off = machine.subscribe(() => {
			state.value = machine.getSnapshot() as StateOf<M>
		})
		onScopeDispose(() => {
			off()
			machine.dispose()
		})
	}
	return { machine, state }
}

/** The element vnodes of a slot, with fragments (`v-for`, `<template>`) opened up and comments dropped: what the author listed, in order. */
export function slotItems(vnodes: VNode[] | undefined): VNode[] {
	const out: VNode[] = []
	for (const vnode of vnodes ?? []) {
		if (vnode.type === Fragment) out.push(...slotItems(vnode.children as VNode[]))
		else if (vnode.type !== Comment) out.push(vnode)
	}
	return out
}

/** Does this component instance's parent listen to `event`? Vue has no prop for it, but the listeners sit on the vnode. */
export function hasListener(vnodeProps: Record<string, unknown> | null | undefined, event: string): boolean {
	return vnodeProps?.[`on${event[0]?.toUpperCase()}${event.slice(1)}`] !== undefined
}
