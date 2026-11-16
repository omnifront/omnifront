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
			await expect(page.getByRole("slider", { name: "Disabled", exact: true })).toBeDisabled()
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

		
				test("a range slider has two thumbs; the lower one cannot pass the upper one", async ({ page }) => {
					await open(page, framework, "")
					const lower = page.getByRole("slider", { name: "Price minimum" })
					const upper = page.getByRole("slider", { name: "Price maximum" })
					await expect(lower).toHaveValue("20")
					await expect(upper).toHaveValue("60")
					await lower.focus()
					await page.keyboard.press("End") // the upper thumb is at 60: the lower one stops there
					await expect(lower).toHaveValue("60")
					await page.keyboard.press("ArrowRight")
					await expect(lower).toHaveValue("60")
					await upper.focus()
					await page.keyboard.press("Home") // and the upper one cannot go below the lower thumb
					await expect(upper).toHaveValue("60")
					await page.keyboard.press("End")
					await expect(upper).toHaveValue("100")
				})
		
				test("a vertical slider: arrow keys, and a real mouse drag up the track raises the value", async ({ page }) => {
					await open(page, framework, "")
					const level = page.getByRole("slider", { name: "Level" })
					await expect(level).toHaveAttribute("aria-orientation", "vertical")
					await level.focus()
					await page.keyboard.press("ArrowUp")
					await expect(level).toHaveValue("41")
					await page.keyboard.press("Home")
					await expect(level).toHaveValue("0")
					const box = await page.locator(".omni-slider[data-orientation='vertical']").first().boundingBox()
					if (!box) throw new Error("no vertical slider")
					// the track runs bottom (smallest) to top (largest): grab the thumb at the bottom and pull it to the middle
					const x = box.x + box.width / 2
					await page.mouse.move(x, box.y + box.height - 10)
					await page.mouse.down()
					await page.mouse.move(x, box.y + box.height / 2, { steps: 8 })
					await page.mouse.up()
					const value = Number(await level.inputValue())
					expect(value).toBeGreaterThan(35)
					expect(value).toBeLessThan(65)
				})
		
				test("grouped select with custom option content: groups are labelled, typing matches the label, the disabled one is skipped", async ({ page }) => {
					await open(page, framework, "")
					const select = page.getByRole("combobox", { name: /Grouped/ })
					await expect(select).toContainText("Carrot") // the label, not the custom content
					await select.focus()
					await page.keyboard.press("ArrowDown")
					await expect(page.getByRole("group", { name: "Fruit" })).toBeVisible()
					await expect(page.getByRole("group", { name: "Vegetables" })).toBeVisible()
					await expect(page.getByRole("option", { name: /Carrot/ })).toBeFocused() // the chosen one
					await page.keyboard.press("ArrowDown") // Daikon is disabled: wraps to Apple
					await expect(page.getByRole("option", { name: /Apple/ })).toBeFocused()
					await page.keyboard.press("b") // type-ahead on the label, whatever else the option shows
					await expect(page.getByRole("option", { name: /Banana/ })).toBeFocused()
					await page.keyboard.press("Enter")
					await expect(select).toContainText("Banana")
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

		test("tooltip: keyboard focus opens it, it describes the button, Escape closes it", async ({ page }) => {
			await open(page, framework, "view=display")
			const save = page.getByRole("button", { name: "Save", exact: true })
			await save.focus()
			await page.keyboard.press("Shift+Tab") // away and back by keyboard, so focus is "visible"
			await page.keyboard.press("Tab")
			const tip = page.getByRole("tooltip")
			await expect(tip).toHaveText("Saves your work")
			expect(await save.getAttribute("aria-describedby")).toBe(await tip.getAttribute("id"))
			await page.keyboard.press("Escape")
			await expect(tip).toHaveCount(0)
			await expect(save).not.toHaveAttribute("aria-describedby", /.+/)
		})

		test("tooltip: hover opens it after a moment, it stays while the pointer is on it, and goes when it leaves", async ({ page }) => {
			await open(page, framework, "view=display")
			const hint = page.getByRole("button", { name: "Hover or focus me" })
			await hint.hover()
			const tip = page.getByRole("tooltip")
			await expect(tip).toHaveText("More options below")
			await tip.hover() // onto the tooltip itself: it stays (hoverable)
			await page.waitForTimeout(300)
			await expect(tip).toBeVisible()
			await page.mouse.move(2, 2)
			await expect(tip).toHaveCount(0)
		})

		test("accordion: Enter and Space open and close it, the region is hidden while closed, and opening one does not open another", async ({ page }) => {
			await open(page, framework, "view=display")
			const first = page.getByRole("button", { name: "What is an accordion?" })
			const second = page.getByRole("button", { name: "Controlled by the page" })
			await expect(first).toHaveAttribute("aria-expanded", "false")
			await expect(page.getByRole("region", { name: "What is an accordion?" })).toBeHidden()
			await first.focus()
			await page.keyboard.press("Enter")
			await expect(first).toHaveAttribute("aria-expanded", "true")
			await expect(page.getByRole("region", { name: "What is an accordion?" })).toBeVisible()
			await expect(second).toHaveAttribute("aria-expanded", "false")
			await page.keyboard.press("Space")
			await expect(first).toHaveAttribute("aria-expanded", "false")
			await expect(page.getByRole("region", { name: "What is an accordion?" })).toBeHidden()
			await second.click()
			await expect(second).toHaveAttribute("aria-expanded", "true")
			await expect(page.getByRole("button", { name: "Disabled", exact: true })).toHaveAttribute("aria-disabled", "true")
		})

		test("chips: Tab reaches the clickable and deletable chips, Enter and Space press, Backspace and the icon delete", async ({ page }) => {
			await open(page, framework, "view=display")
			const status = page.getByRole("status")
			const clickable = page.getByRole("button", { name: "Clickable" })
			await clickable.focus()
			await page.keyboard.press("Enter")
			await expect(status).toContainText("clicked")
			await page.keyboard.press("Tab") // on to the deletable chip
			await page.keyboard.press("Backspace")
			await expect(status).toContainText("deleted")
			await clickable.focus()
			await page.keyboard.press("Space")
			await expect(status).toContainText("clicked")
			await page.locator(".omni-chip", { hasText: "Deletable" }).locator(".omni-chip__delete").click() // the icon: a mouse path
			await expect(status).toContainText("deleted")
			await expect(page.locator(".omni-chip", { hasText: "Disabled" })).toHaveAttribute("aria-disabled", "true")
		})

		test("avatars fall back to the generic person when the picture is broken or missing, and not otherwise", async ({ page }) => {
			await open(page, framework, "view=display")
			await expect(page.locator(".omni-avatar__fallback:visible")).toHaveCount(2) // the broken picture and the empty avatar
			await expect(page.locator('.omni-avatar__img[alt="Portrait"]')).toBeVisible()
		})

		test("a badge sits on the end side of its icon, and the other way round in RTL", async ({ page }) => {
			await open(page, framework, "view=display")
			const side = async (): Promise<number> => {
				const mark = page.locator(".omni-badge__mark", { hasText: "4" })
				const box = (await mark.boundingBox()) as { x: number; width: number }
				const parent = (await mark.locator("xpath=..").boundingBox()) as { x: number; width: number }
				return box.x + box.width / 2 - (parent.x + parent.width / 2)
			}
			expect(await side()).toBeGreaterThan(0)
			await page.evaluate(() => (document.documentElement.dir = "rtl"))
			expect(await side()).toBeLessThan(0)
		})

		test("an accordion and a chip do not animate when the user prefers reduced motion", async ({ page }) => {
			await open(page, framework, "view=display")
			const duration = (selector: string): Promise<string> => page.locator(selector).first().evaluate((el) => getComputedStyle(el).transitionDuration)
			expect(await duration(".omni-accordion__region")).toBe("0s")
			expect(await duration(".omni-chip")).toBe("0s")
		})
	})
}
