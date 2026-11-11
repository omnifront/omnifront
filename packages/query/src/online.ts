import { onlineManager } from "./environment"

/**
 * `"online"` (default): wait for the network before fetching, and before each retry.
 * `"always"`: never wait. `"offlineFirst"`: try once regardless, then wait before retrying.
 */
export type NetworkMode = "online" | "always" | "offlineFirst"

/**
 * Call `run` now if `mode` allows it or the network is up. Otherwise report `paused(true)`, and when
 * the network is back report `paused(false)` and run. Returns the way to stop waiting, if it waits.
 */
export function whenOnline(
	mode: NetworkMode | undefined,
	first: boolean,
	run: () => void,
	paused: (isPaused: boolean) => void,
): (() => void) | undefined {
	if (mode === "always" || (first && mode === "offlineFirst") || onlineManager.getSnapshot()) return void run()
	paused(true)
	const stop = onlineManager.subscribe(() => {
		if (!onlineManager.getSnapshot()) return
		stop()
		paused(false)
		run()
	})
	return stop
}
