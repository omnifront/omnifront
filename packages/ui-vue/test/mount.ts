import { afterEach } from "vitest"
import { createApp, defineComponent, h, nextTick, type Component, type VNodeChild } from "vue"

const mounted: Array<() => void> = []
// Unmount every app after each test: open dialogs and menus hold page-wide locks until they are unmounted.
afterEach(() => {
	for (const unmount of mounted.splice(0)) unmount()
})

/** Mount a component the way an app would, and give back helpers to tear it down. */
export function mount(render: () => VNodeChild | VNodeChild[]): { container: HTMLElement; unmount: () => void } {
	const container = document.createElement("div")
	document.body.append(container)
	const app = createApp(defineComponent({ render: () => h("div", { id: "root" }, render() as never) }))
	app.mount(container)
	let done = false
	const unmount = (): void => {
		if (!done) app.unmount()
		done = true
	}
	mounted.push(unmount)
	return { container, unmount }
}

export const flush = (): Promise<void> => nextTick()
export const slot = (...children: VNodeChild[]) => ({ default: () => children })
export const el = (selector: string): HTMLElement => document.querySelector(selector) as HTMLElement
export type { Component }
