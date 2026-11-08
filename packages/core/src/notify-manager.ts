export type Listener = () => void

let depth = 0
const queue = new Set<Listener>()

function flush(): void {
	// Stay "inside a batch" while listeners run: listeners that notify further listeners (a derived
	// store, a combined list) queue them instead of flushing mid-way, so each runs once per round.
	depth++
	let failed = false
	let firstError: unknown
	try {
		while (queue.size > 0) {
			const pending = [...queue]
			queue.clear()
			for (const listener of pending) {
				try {
					listener()
				} catch (error) {
					if (!failed) {
						failed = true
						firstError = error
					}
				}
			}
		}
	} finally {
		depth--
	}
	// One broken listener must not stop the others; the first error is rethrown at the end.
	if (failed) throw firstError
}

export const notifyManager = {
	/**
	 * Run `fn`; listeners scheduled inside it are collected and each runs
	 * once, synchronously, when the outermost batch ends.
	 */
	batch<T>(fn: () => T): T {
		depth++
		try {
			return fn()
		} finally {
			if (--depth === 0) flush()
		}
	},

	/** Inside a batch: queue (deduplicated). Outside: run immediately. */
	schedule(listener: Listener): void {
		if (depth > 0) queue.add(listener)
		else listener()
	},
}
