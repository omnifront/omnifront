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
	{ name: "select", query: "open=select" },
	{ name: "select-dark", query: "open=select&scheme=dark" },
	// Wave 2 (display and surface): a long page, so the whole page is compared, not the first screen.
	{ name: "display", query: "view=display", fullPage: true },
	{ name: "display-dark", query: "view=display&scheme=dark", fullPage: true },
	{ name: "display-brand", query: "view=display&theme=brand", fullPage: true },
	{ name: "display-rtl", query: "view=display", fullPage: true, rtl: true },
	{ name: "display-tooltip", query: "view=display&open=tooltip", fullPage: true },
	{ name: "display-accordion", query: "view=display&open=accordion", fullPage: true },
	// Wave 3 (feedback and navigation) and the wave 2 leftovers: one long page, and the pieces that open.
	{ name: "feedback", query: "view=feedback", fullPage: true },
	{ name: "feedback-dark", query: "view=feedback&scheme=dark", fullPage: true },
	{ name: "feedback-brand", query: "view=feedback&theme=brand", fullPage: true },
	{ name: "feedback-rtl", query: "view=feedback", fullPage: true, rtl: true },
	{ name: "feedback-snackbar", query: "view=feedback&open=snackbar" },
	{ name: "feedback-drawer", query: "view=feedback&open=drawer" },
	{ name: "feedback-drawer-rtl", query: "view=feedback&open=drawer", rtl: true },
	{ name: "feedback-popover", query: "view=feedback&open=popover" },
	{ name: "feedback-speeddial", query: "view=feedback&open=speeddial", fullPage: true },
	{ name: "feedback-tooltip-arrow", query: "view=feedback&open=tooltip-arrow", fullPage: true },
] as const satisfies ReadonlyArray<{ name: string; query: string; fullPage?: boolean; rtl?: boolean }>

export async function open(page: Page, framework: Framework, query: string, options: { rtl?: boolean } = {}): Promise<void> {
	await page.goto(`http://localhost:${frameworks[framework]}/?${query}`)
	await page.locator("h1").waitFor()
	if (options.rtl) await page.evaluate(() => (document.documentElement.dir = "rtl"))
	if (query.includes("open=tooltip")) await page.locator('[role="tooltip"][data-placement]').waitFor()
	if (query.includes("open=dialog")) await page.locator('[role="dialog"]').waitFor()
	if (query.includes("open=menu")) {
		await page.locator('[role="menu"]').waitFor()
		await page.locator('[role="menu"][data-placement]').waitFor() // positioned by floating-ui
	}
	if (query.includes("open=snackbar")) await page.locator(".omni-snackbar").waitFor()
	if (query.includes("open=drawer")) await page.locator(".omni-drawer__paper[role='dialog']").waitFor()
	if (query.includes("open=popover")) await page.locator(".omni-popover[data-placement]").waitFor()
	if (query.includes("open=speeddial")) await page.locator('[role="menu"][data-state="open"]').waitFor()
	if (query.includes("open=select")) await page.locator('[role="listbox"][data-placement]').waitFor()
	await page.evaluate(() => document.fonts.ready)
	await page.waitForTimeout(300)
}
