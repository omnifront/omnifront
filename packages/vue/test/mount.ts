import type { QueryClient } from "@omnifront/query"
import { createApp, defineComponent, type App } from "vue"
import { QueryPlugin } from "../src"

/** Run `setup` inside a real component of a real app, like user code would. */
export function mountComposable<T>(setup: () => T, client?: QueryClient): { result: T; app: App; unmount: () => void } {
	let result!: T
	const app = createApp(
		defineComponent({
			setup() {
				result = setup()
				return () => null
			},
		}),
	)
	if (client) app.use(QueryPlugin, client)
	app.mount(document.createElement("div"))
	return { result, app, unmount: () => app.unmount() }
}
