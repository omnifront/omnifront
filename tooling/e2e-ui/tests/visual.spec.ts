import { writeFileSync } from "node:fs"
import { expect, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { frameworks, open, scenarios, type Framework } from "./pages"

// The claim of the UI kit: behaviour and look are written once, so the same page must render the
// same in React, Vue and Angular. React is the reference; the others are compared to it.
const others: Framework[] = ["vue", "angular"]
const MAX_DIFFERENT = 0.001 // fraction of pixels: anti-aliasing noise, not a layout difference

for (const scenario of scenarios) {
	test(`React, Vue and Angular look the same: ${scenario.name}`, async ({ browser }, info) => {
		const shots = {} as Record<Framework, Buffer>
		for (const framework of Object.keys(frameworks) as Framework[]) {
			const context = await browser.newContext({ viewport: { width: 1000, height: 1500 }, reducedMotion: "reduce" })
			const page = await context.newPage()
			await open(page, framework, scenario.query)
			shots[framework] = await page.screenshot({ animations: "disabled", caret: "hide" })
			await context.close()
		}
		const reference = PNG.sync.read(shots.react)
		for (const framework of others) {
			const actual = PNG.sync.read(shots[framework])
			expect(`${framework} ${actual.width}x${actual.height}`).toBe(`${framework} ${reference.width}x${reference.height}`)
			const diff = new PNG({ width: reference.width, height: reference.height })
			const different = pixelmatch(reference.data, actual.data, diff.data, reference.width, reference.height, { threshold: 0.1 })
			const ratio = different / (reference.width * reference.height)
			if (ratio > MAX_DIFFERENT) {
				// Written next to the test results so a failure can be looked at, not just counted.
				writeFileSync(info.outputPath(`${scenario.name}-react.png`), shots.react)
				writeFileSync(info.outputPath(`${scenario.name}-${framework}.png`), shots[framework])
				writeFileSync(info.outputPath(`${scenario.name}-${framework}-diff.png`), PNG.sync.write(diff))
			}
			expect(ratio, `${framework} differs from React in ${different} pixels (${(ratio * 100).toFixed(3)}%)`).toBeLessThanOrEqual(MAX_DIFFERENT)
		}
	})
}
