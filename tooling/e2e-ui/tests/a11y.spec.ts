import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { frameworks, open, scenarios, type Framework } from "./pages"

// axe in a real browser, so colour contrast is checked too (it needs real layout and paint, which
// the jsdom conformance tests cannot do).
for (const framework of Object.keys(frameworks) as Framework[]) {
	for (const scenario of scenarios.filter((s) => ["light", "dark", "brand", "dialog", "menu", "select", "select-dark", "display", "display-dark", "display-rtl", "display-tooltip", "display-accordion"].includes(s.name))) {
		test(`axe: ${framework} ${scenario.name}`, async ({ page }) => {
			await open(page, framework, scenario.query, { rtl: "rtl" in scenario })
			const result = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
				.disableRules(["region"]) // page landmarks: about whole pages, not components
				.analyze()
			const summary = result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")})`)
			expect(summary).toEqual([])
		})
	}
}
