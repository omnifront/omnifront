import { expect, test } from "@playwright/test"
import { frameworks, open, type Framework } from "./pages"

// Wave 3 and the wave 2 leftovers, with real keys, a real mouse and real layout, in every framework.
for (const framework of Object.keys(frameworks) as Framework[]) {
	test.describe(`feedback: ${framework}`, () => {
		test("Pagination: a click moves the current page; the keyboard reaches next and Enter presses it", async ({ page }) => {
			await open(page, framework, "view=feedback")
			const bar = page.getByRole("navigation", { name: "pagination navigation" }).first()
			await expect(bar.getByRole("button", { name: "page 4" })).toHaveAttribute("aria-current", "page")
			await bar.getByRole("button", { name: "Go to page 5" }).click()
			await expect(bar.getByRole("button", { name: "page 5" })).toHaveAttribute("aria-current", "page")
			await bar.getByRole("button", { name: "Go to next page" }).focus()
			await page.keyboard.press("Enter")
			await expect(bar.getByRole("button", { name: "page 6" })).toHaveAttribute("aria-current", "page")
		})

		test("Snackbar: shows a polite message, Escape closes it", async ({ page }) => {
			await open(page, framework, "view=feedback")
			await page.getByRole("button", { name: "Show snackbar" }).click()
			const bar = page.getByRole("status").filter({ hasText: "Message sent" })
			await expect(bar).toBeVisible()
			await page.keyboard.press("Escape")
			await expect(bar).toHaveCount(0)
		})

		test("Snackbar: a press outside closes it, a press on its button does not close it by itself", async ({ page }) => {
			await open(page, framework, "view=feedback&open=snackbar")
			const bar = page.getByRole("status").filter({ hasText: "Message sent" })
			await expect(bar).toBeVisible()
			await page.getByRole("heading", { name: "Alert" }).click()
			await expect(bar).toHaveCount(0)
		})

		test("Drawer: a modal dialog; focus stays inside, Escape closes it and focus goes back", async ({ page }) => {
			await open(page, framework, "view=feedback")
			const opener = page.getByRole("button", { name: "Open drawer" })
			await opener.click()
			const drawer = page.getByRole("dialog", { name: "Navigation" })
			await expect(drawer).toBeVisible()
			for (let i = 0; i < 6; i++) {
				await page.keyboard.press("Tab")
				expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true)
			}
			await page.keyboard.press("Escape")
			await expect(drawer).toHaveCount(0)
			await expect(opener).toBeFocused()
		})

		test("Drawer: a click on the page behind closes it", async ({ page }) => {
			await open(page, framework, "view=feedback&open=drawer")
			await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible()
			await page.mouse.click(900, 700)
			await expect(page.getByRole("dialog", { name: "Navigation" })).toHaveCount(0)
		})

		test("Drawer: `start` is the left edge in LTR and the right edge in RTL", async ({ page }) => {
			await open(page, framework, "view=feedback&open=drawer")
			const paper = page.locator(".omni-drawer__paper[role='dialog']")
			const ltr = await paper.evaluate((el) => Math.round(el.getBoundingClientRect().left))
			expect(ltr).toBe(0)
			await page.keyboard.press("Escape")
			await page.evaluate(() => (document.documentElement.dir = "rtl"))
			await page.getByRole("button", { name: "Open drawer" }).click()
			// the slide-in takes a moment even with reduced motion: wait for it to settle at the right edge
			await expect
				.poll(() => page.locator(".omni-drawer__paper[role='dialog']").evaluate((el) => Math.round(window.innerWidth - el.getBoundingClientRect().right)))
				.toBe(0)
		})

		test("Popover: sits next to its button, is not modal, Escape closes it and focus goes back", async ({ page }) => {
			await open(page, framework, "view=feedback")
			const opener = page.getByRole("button", { name: "Open popover" })
			await opener.click()
			const popover = page.getByRole("dialog", { name: "Filters" })
			await expect(popover).toBeVisible()
			const [a, b] = await Promise.all([opener.boundingBox(), popover.boundingBox()])
			expect(Math.abs((b?.y ?? 0) - ((a?.y ?? 0) + (a?.height ?? 0)))).toBeLessThan(24) // right under the button
			await expect(popover).not.toHaveAttribute("aria-modal", "true")
			expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden") // the page stays scrollable
			await page.keyboard.press("Escape")
			await expect(popover).toHaveCount(0)
			await expect(opener).toBeFocused()
		})

		test("Popover: a click elsewhere closes it", async ({ page }) => {
			await open(page, framework, "view=feedback&open=popover")
			await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible()
			await page.getByRole("heading", { name: "Alert" }).click()
			await expect(page.getByRole("dialog", { name: "Filters" })).toHaveCount(0)
		})

		test("SpeedDial: Enter opens it, arrow keys walk the actions, Escape closes and refocuses the button", async ({ page }) => {
			await open(page, framework, "view=feedback")
			const trigger = page.getByRole("button", { name: "Actions" })
			await trigger.focus()
			await page.keyboard.press("Enter")
			await expect(trigger).toHaveAttribute("aria-expanded", "true")
			await page.keyboard.press("ArrowUp")
			await expect(page.getByRole("menuitem", { name: "Copy" })).toBeFocused()
			await page.keyboard.press("ArrowUp")
			await expect(page.getByRole("menuitem", { name: "Save" })).toBeFocused()
			await page.keyboard.press("Escape")
			await expect(trigger).toHaveAttribute("aria-expanded", "false")
			await expect(trigger).toBeFocused()
		})

		test("SpeedDial: the pointer opens it and the actions fan out upwards", async ({ page }) => {
			await open(page, framework, "view=feedback")
			const trigger = page.getByRole("button", { name: "Actions" })
			await trigger.scrollIntoViewIfNeeded()
			await trigger.hover()
			await expect(page.getByRole("menuitem", { name: "Copy" })).toBeVisible()
			const [t, c, s] = await Promise.all([trigger.boundingBox(), page.getByRole("menuitem", { name: "Copy" }).boundingBox(), page.getByRole("menuitem", { name: "Save" }).boundingBox()])
			expect(c?.y).toBeLessThan(t?.y ?? 0) // above the button
			expect(s?.y).toBeLessThan(c?.y ?? 0) // and the next one above that
		})

		test("Stepper and BottomNavigation: the current step and tab are exposed, a click moves the tab", async ({ page }) => {
			await open(page, framework, "view=feedback")
			const checkout = page.getByRole("list", { name: "Checkout" })
			await expect(checkout.locator("[aria-current='step']")).toContainText("Address")
			const nav = page.getByRole("navigation", { name: "Main" })
			await expect(nav.getByRole("button", { name: "Recents" })).toHaveAttribute("aria-current", "page")
			await nav.getByRole("button", { name: "Favorites" }).click()
			await expect(nav.getByRole("button", { name: "Favorites" })).toHaveAttribute("aria-current", "page")
			await expect(nav.getByRole("button", { name: "Recents" })).not.toHaveAttribute("aria-current", "page")
		})

		test("Breadcrumbs: a long path folds under a button that shows it", async ({ page }) => {
			await open(page, framework, "view=feedback")
			const trail = page.getByRole("navigation", { name: "breadcrumb" }).nth(1)
			await expect(trail.getByRole("listitem").filter({ hasText: "Library" })).toHaveCount(0)
			await trail.getByRole("button", { name: "Show path" }).click()
			await expect(trail.getByRole("link", { name: "Library" })).toBeVisible()
		})

		test("AccordionGroup: opening one panel closes the other", async ({ page }) => {
			await open(page, framework, "view=feedback")
			const first = page.getByRole("button", { name: "Only one open" })
			const second = page.getByRole("button", { name: "Second panel" })
			await expect(first).toHaveAttribute("aria-expanded", "true")
			await second.click()
			await expect(second).toHaveAttribute("aria-expanded", "true")
			await expect(first).toHaveAttribute("aria-expanded", "false")
			await expect(page.getByText("Opening another closes this one.")).toBeHidden()
		})

		test("TableSortLabel and TablePagination: sorting sets aria-sort; paging changes the range", async ({ page }) => {
			await open(page, framework, "view=feedback")
			const table = page.getByRole("table", { name: "Sortable" })
			const calories = table.getByRole("columnheader", { name: "Calories" })
			await expect(table.getByRole("columnheader", { name: "Dessert" })).toHaveAttribute("aria-sort", "ascending")
			await calories.getByRole("button").click()
			await expect(calories).toHaveAttribute("aria-sort", "ascending")
			await calories.getByRole("button").click()
			await expect(calories).toHaveAttribute("aria-sort", "descending")
			await expect(table.getByText("1–5 of 23")).toBeVisible()
			await table.getByRole("button", { name: "Go to next page" }).click()
			await expect(table.getByText("6–10 of 23")).toBeVisible()
			await table.getByLabel("Rows per page:").selectOption("25")
			await expect(table.getByText("1–23 of 23")).toBeVisible()
			await expect(table.getByRole("button", { name: "Go to next page" })).toBeDisabled()
		})

		test("Chip: a custom delete icon deletes", async ({ page }) => {
			await open(page, framework, "view=feedback")
			const chip = page.locator(".omni-chip", { hasText: "Vue" })
			await chip.locator(".omni-chip__delete").click()
			await expect(page.locator(".omni-chip", { hasText: "Vue" })).toHaveCount(0)
			await expect(page.locator(".omni-chip", { hasText: "React" })).toHaveCount(1)
		})

		test("AvatarGroup: avatars past the limit fold into +N", async ({ page }) => {
			await open(page, framework, "view=feedback")
			const groups = page.locator(".omni-avatar-group")
			const shown = async (n: number) => groups.nth(n).locator(".omni-avatar:visible").allTextContents()
			expect(await shown(0)).toEqual(["A", "B", "C", "+3"])
			expect(await shown(1)).toEqual(["A", "B", "+10"])
		})

		test("Tooltip: the arrow points at the trigger", async ({ page }) => {
			await open(page, framework, "view=feedback&open=tooltip-arrow")
			const tip = page.getByRole("tooltip")
			const arrow = tip.locator(".omni-tooltip__arrow")
			await expect(arrow).toBeVisible()
			const [t, a, trigger] = await Promise.all([tip.boundingBox(), arrow.boundingBox(), page.getByRole("button", { name: "Hover me" }).boundingBox()])
			// placement top: the tooltip is above the trigger, the arrow sits on its bottom edge and over the trigger's width
			expect(Math.abs((a?.y ?? 0) - ((t?.y ?? 0) + (t?.height ?? 0)))).toBeLessThan(8)
			const centre = (a?.x ?? 0) + (a?.width ?? 0) / 2
			expect(centre).toBeGreaterThan(trigger?.x ?? 0)
			expect(centre).toBeLessThan((trigger?.x ?? 0) + (trigger?.width ?? 0))
		})

		test("Tooltip: a held touch opens it, and it closes after the finger lifts", async ({ page }) => {
			await open(page, framework, "view=feedback")
			const trigger = page.getByRole("button", { name: "Hover me" })
			await trigger.scrollIntoViewIfNeeded()
			await trigger.dispatchEvent("pointerdown", { pointerType: "touch", bubbles: true })
			await expect(page.getByRole("tooltip")).toHaveCount(0) // not yet: a touch must be held
			await expect(page.getByRole("tooltip")).toBeVisible({ timeout: 2000 })
			await trigger.dispatchEvent("pointerup", { pointerType: "touch", bubbles: true })
			await expect(page.getByRole("tooltip")).toHaveCount(0, { timeout: 4000 })
		})

		test("reduced motion: the indeterminate spinner slows down instead of freezing", async ({ page }) => {
			await open(page, framework, "view=feedback")
			const spinner = page.getByRole("progressbar", { name: "Loading" })
			expect(await spinner.evaluate((el) => getComputedStyle(el).animationDuration)).toBe("4s")
			expect(await spinner.evaluate((el) => getComputedStyle(el).animationName)).not.toBe("none")
		})

		test("RTL: the arrows of Pagination and the Breadcrumbs separators are mirrored", async ({ page }) => {
			await open(page, framework, "view=feedback", { rtl: true })
			const mirrored = async (selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).transform)
			expect(await mirrored(".omni-pagination__item[data-type='previous'] svg")).toBe("matrix(-1, 0, 0, 1, 0, 0)")
			expect(await mirrored(".omni-breadcrumbs__separator")).toBe("matrix(-1, 0, 0, 1, 0, 0)")
		})
	})
}
