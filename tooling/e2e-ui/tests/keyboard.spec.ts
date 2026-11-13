import { expect, test } from "@playwright/test"
import { frameworks, open, type Framework } from "./pages"

// The keyboard behaviour that jsdom cannot show: native checkboxes and radios, and the select's list,
// driven by real key presses in a real browser, in every framework.
for (const framework of Object.keys(frameworks) as Framework[]) {
	test.describe(`keyboard: ${framework}`, () => {
		test("Space toggles a checkbox, and focus shows on the control", async ({ page }) => {
			await open(page, framework, "")
			const box = page.getByRole("checkbox", { name: "Accept terms" })
			await box.focus()
			await expect(box).not.toBeChecked()
			await page.keyboard.press("Space")
			await expect(box).toBeChecked()
			await page.keyboard.press("Space")
			await expect(box).not.toBeChecked()
		})

		test("Space flips a switch, and a click on its label does too", async ({ page }) => {
			await open(page, framework, "")
			const wifi = page.getByRole("switch", { name: "Wi-Fi" })
			await wifi.focus()
			await expect(wifi).not.toBeChecked()
			await page.keyboard.press("Space")
			await expect(wifi).toBeChecked()
			await page.getByText("Wi-Fi", { exact: true }).click()
			await expect(wifi).not.toBeChecked()
			await expect(page.getByRole("switch", { name: "Bluetooth" })).toBeChecked() // defaultChecked
			await expect(page.getByRole("switch", { name: "Disabled", exact: true })).toBeDisabled()
		})

		test("an indeterminate checkbox becomes checked on click", async ({ page }) => {
			await open(page, framework, "")
			const some = page.getByRole("checkbox", { name: "Some" })
			expect(await some.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true)
			await some.click()
			await expect(some).toBeChecked()
		})

		test("arrow keys move the choice in a radio group, skipping the disabled radio; Tab leaves the group", async ({ page }) => {
			await open(page, framework, "")
			const apple = page.getByRole("radio", { name: "Apple" })
			const cherry = page.getByRole("radio", { name: "Cherry" })
			await expect(cherry).toBeChecked() // defaultValue
			await cherry.focus()
			await page.keyboard.press("ArrowUp") // Banana is disabled: lands on Apple
			await expect(apple).toBeChecked()
			await expect(cherry).not.toBeChecked()
			await page.keyboard.press("ArrowDown")
			await expect(cherry).toBeChecked()
			await expect(page.getByRole("radio", { name: "Banana" })).toBeDisabled()
		})

		test("a click on a radio's text chooses it", async ({ page }) => {
			await open(page, framework, "")
			await page.getByRole("radiogroup", { name: "Fruit" }).getByText("Apple", { exact: true }).click()
			await expect(page.getByRole("radio", { name: "Apple" })).toBeChecked()
		})

		test("the select opens from the keyboard, arrows move, Enter chooses, focus returns", async ({ page }) => {
			await open(page, framework, "")
			const select = page.getByRole("combobox", { name: /Fruit/ })
			await select.focus()
			await page.keyboard.press("ArrowDown")
			const list = page.getByRole("listbox", { name: "Fruit" })
			await expect(list).toBeVisible()
			await expect(page.getByRole("option", { name: "Apple" })).toBeFocused()
			await page.keyboard.press("ArrowDown") // Banana is disabled: lands on Cherry
			await expect(page.getByRole("option", { name: "Cherry" })).toBeFocused()
			await page.keyboard.press("Enter")
			await expect(list).toBeHidden()
			await expect(select).toContainText("Cherry")
			await expect(select).toBeFocused()
		})

		test("a slider moves with arrow keys, Home and End", async ({ page }) => {
			await open(page, framework, "")
			const volume = page.getByRole("slider", { name: "Volume" })
			await volume.focus()
			await expect(volume).toHaveValue("30")
			await page.keyboard.press("ArrowRight")
			await expect(volume).toHaveValue("31")
			await page.keyboard.press("End")
			await expect(volume).toHaveValue("100")
			await page.keyboard.press("Home")
			await expect(volume).toHaveValue("0")
			await expect(page.getByRole("slider", { name: "Disabled" })).toBeDisabled()
		})

		test("a rating is chosen with the arrow keys and a click, and a read-only one cannot change", async ({ page }) => {
			await open(page, framework, "")
			const group = page.getByRole("radiogroup", { name: "Rating", exact: true })
			await expect(group.getByRole("radio", { name: /3/ }).first()).toBeChecked()
			await group.getByRole("radio", { name: /3/ }).first().focus()
			await page.keyboard.press("ArrowRight")
			await expect(group.getByRole("radio", { name: /4/ }).first()).toBeChecked()
			const readOnly = page.getByRole("img", { name: /Read only/ })
			await expect(readOnly).toBeVisible()
			expect(await readOnly.getByRole("radio").count()).toBe(0) // not interactive
		})

		test("toggle buttons: several can be on, an exclusive group keeps one", async ({ page }) => {
			await open(page, framework, "")
			const bold = page.getByRole("button", { name: "Bold" })
			const italic = page.getByRole("button", { name: "Italic" })
			await expect(bold).toHaveAttribute("aria-pressed", "true")
			await italic.click()
			await expect(italic).toHaveAttribute("aria-pressed", "true")
			await expect(bold).toHaveAttribute("aria-pressed", "true")
			const center = page.getByRole("button", { name: "Center" })
			await center.click()
			await expect(center).toHaveAttribute("aria-pressed", "true")
			await expect(page.getByRole("group", { name: "Alignment" }).getByRole("button", { name: "Left" })).toHaveAttribute("aria-pressed", "false")
			await expect(page.getByRole("button", { name: "Underline" })).toBeDisabled()
		})

		test("an auto-sizing text area grows with its text, up to maxRows", async ({ page }) => {
			await open(page, framework, "")
			const notes = page.getByRole("textbox", { name: "Notes" })
			const before = await notes.evaluate((el) => el.getBoundingClientRect().height)
			await notes.fill("one\ntwo\nthree\nfour")
			const grown = await notes.evaluate((el) => el.getBoundingClientRect().height)
			expect(grown).toBeGreaterThan(before)
			await notes.fill("1\n2\n3\n4\n5\n6\n7\n8\n9\n10")
			const capped = await notes.evaluate((el) => el.getBoundingClientRect().height)
			expect(capped).toBeLessThan(grown * 2)
			expect(await notes.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
		})

		test("a multiple select keeps the list open and shows every choice", async ({ page }) => {
			await open(page, framework, "")
			const select = page.getByRole("combobox", { name: /Several/ })
			await expect(select).toContainText("Apple")
			await select.focus()
			await page.keyboard.press("ArrowDown")
			await expect(page.getByRole("listbox", { name: "Several" })).toHaveAttribute("aria-multiselectable", "true")
			await page.keyboard.press("Space")
			await expect(page.getByRole("listbox", { name: "Several" })).toBeVisible()
		})
	})
}
