import type { Progress } from "./types"

export interface ProgressDetails extends Progress {
	/** Bytes since the previous event. */
	bytes: number
	/** 0 to 1; unknown when the total is. */
	progress: number | undefined
	/** Bytes per second, averaged since the first event; unknown until time has passed. */
	rate: number | undefined
	/** Seconds left at the current rate; unknown without a total or a rate. */
	estimated: number | undefined
}

/**
 * Wrap a progress callback to get what axios's progress event carries: the fraction done, the transfer
 * rate and the time left. Make one per request.
 *
 *   api.get("/file", { onDownloadProgress: trackProgress((p) => bar.set(p.progress ?? 0)) })
 */
export function trackProgress(
	listener: (details: ProgressDetails) => void,
	now: () => number = Date.now,
): (progress: Progress) => void {
	let start: { at: number; loaded: number } | undefined
	let previous = 0
	return ({ loaded, total }) => {
		start ??= { at: now(), loaded }
		const seconds = (now() - start.at) / 1000
		const rate = seconds > 0 ? (loaded - start.loaded) / seconds : undefined
		listener({
			loaded,
			total,
			bytes: loaded - previous,
			progress: total ? Math.min(loaded / total, 1) : undefined,
			rate,
			estimated: total && rate ? Math.max(total - loaded, 0) / rate : undefined,
		})
		previous = loaded
	}
}
