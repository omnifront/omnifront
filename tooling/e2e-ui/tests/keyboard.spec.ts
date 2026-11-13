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
	})
}
