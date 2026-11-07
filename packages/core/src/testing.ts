import type { Scheduler, TimerHandle } from "./scheduler"

interface Timer {
	id: number
	at: number
	fn: () => void
}

/** Deterministic Scheduler for tests: time only moves when you call `advance`. */
export class FakeScheduler implements Scheduler {
	private time = 0
	private nextId = 1
	private timers: Timer[] = []

	setTimeout(fn: () => void, ms: number): TimerHandle {
		const timer = { id: this.nextId++, at: this.time + Math.max(0, ms), fn }
		this.timers.push(timer)
		return timer.id
	}

	clearTimeout(handle: TimerHandle): void {
		this.timers = this.timers.filter((t) => t.id !== handle)
	}

	now(): number {
		return this.time
	}

	/** Move time forward, running due timers in order (including ones they schedule). */
	advance(ms: number): void {
		const target = this.time + ms
		for (;;) {
			const due = this.timers
				.filter((t) => t.at <= target)
				.sort((a, b) => a.at - b.at || a.id - b.id)[0]
			if (!due) break
			this.timers = this.timers.filter((t) => t !== due)
			this.time = due.at
			due.fn()
		}
		this.time = target
	}

	get pendingTimers(): number {
		return this.timers.length
	}
}
