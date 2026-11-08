import { EnvironmentSignal } from "@unicore/core"
import { noop } from "./resolve"

export type { EnvironmentSignal }


/** An EnvironmentSignal that follows `read()` whenever one of `events` fires on `target`. */
const fromEvents = (
	target: () => EventTarget | undefined,
	events: string[],
	read: () => boolean,
): EnvironmentSignal =>
	new EnvironmentSignal((set) => {
		const source = target()
		if (!source) return noop // server, tests without a DOM
		const update = (): void => set(read())
		events.forEach((event) => source.addEventListener(event, update))
		update() // pick up the current state on attach
		return () => events.forEach((event) => source.removeEventListener(event, update))
	})

/** Whether the page is visible. Observers refetch stale data when it becomes visible again. */
export const focusManager = fromEvents(
	() => (typeof document === "undefined" ? undefined : document),
	["visibilitychange"],
	() => document.visibilityState !== "hidden",
)

/** Whether the network is up. Observers refetch stale data when it comes back. */
export const onlineManager = fromEvents(
	() => (typeof window === "undefined" ? undefined : window),
	["online", "offline"],
	() => navigator.onLine !== false,
)
