export type TimerHandle = unknown

/** Injectable time source. Logic code must never call setTimeout/Date.now directly. */
export interface Scheduler {
	setTimeout(fn: () => void, ms: number): TimerHandle
	clearTimeout(handle: TimerHandle): void
	now(): number
}

export const defaultScheduler: Scheduler = {
	setTimeout: (fn, ms) => setTimeout(fn, ms),
	clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
	now: () => Date.now(),
}
