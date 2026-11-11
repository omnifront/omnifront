import { describe, expect, it, vi } from "vitest"
import { trackProgress, type ProgressDetails } from "../src/progress"

describe("trackProgress", () => {
	it("adds the fraction, bytes since last event, rate and time left", () => {
		let time = 0
		const seen: ProgressDetails[] = []
		const report = trackProgress((p) => seen.push(p), () => time)
		report({ loaded: 100, total: 1000 })
		time = 1000
		report({ loaded: 300, total: 1000 })
		time = 2000
		report({ loaded: 1200, total: 1000 })
		expect(seen[0]).toEqual({ loaded: 100, total: 1000, bytes: 100, progress: 0.1, rate: undefined, estimated: undefined })
		expect(seen[1]).toEqual({ loaded: 300, total: 1000, bytes: 200, progress: 0.3, rate: 200, estimated: 3.5 })
		expect(seen[2]).toMatchObject({ bytes: 900, progress: 1, rate: 550, estimated: 0 })
	})

	it("leaves progress and the estimate unknown without a total; uses the real clock by default", () => {
		const listener = vi.fn()
		const report = trackProgress(listener)
		report({ loaded: 5, total: undefined })
		expect(listener).toHaveBeenCalledWith(expect.objectContaining({ loaded: 5, progress: undefined, estimated: undefined }))
	})
})
