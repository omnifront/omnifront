import type { Page } from "@playwright/test"

export const frameworks = { react: 5181, vue: 5182, angular: 5183 } as const
export type Framework = keyof typeof frameworks

/** The page's starting states, set through the URL (see the examples' App files). */
export const scenarios = [
	{ name: "light", query: "" },
	{ name: "dark", query: "scheme=dark" },
	{ name: "brand", query: "theme=brand" },
	{ name: "brand-dark", query: "theme=brand&scheme=dark" },
	{ name: "tab-queries", query: "tab=queries" },
	{ name: "dialog", query: "open=dialog" },
	{ name: "dialog-dark", query: "open=dialog&scheme=dark" },
	{ name: "menu", query: "open=menu" },
] as const

export async function open(page: Page, framework: Framework, query: string): Promise<void> {
	await page.goto(`http://localhost:${frameworks[framework]}/?${query}`)
	await page.locator("h1").waitFor()
	if (query.includes("open=dialog")) await page.locator('[role="dialog"]').waitFor()
	if (query.includes("open=menu")) {
		await page.locator('[role="menu"]').waitFor()
		await page.locator('[role="menu"][data-placement]').waitFor() // positioned by floating-ui
	}
	await page.evaluate(() => document.fonts.ready)
	await page.waitForTimeout(300)
}
