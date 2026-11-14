import { fireEvent, screen } from "@testing-library/dom"
import { afterEach, describe, expect, it } from "vitest"
import { h, ref } from "vue"
import { Dialog, Menu, MenuItem, ThemeProvider, createTheme } from "../src"
import { flush, mount, slot } from "./mount"

afterEach(() => document.documentElement.removeAttribute("data-omni-color-scheme"))

describe("ThemeProvider global", () => {
	it("puts the theme on :root and the scheme on <html>, with no wrapper, and restores <html> on unmount", async () => {
		document.documentElement.setAttribute("data-omni-color-scheme", "light")
		const scheme = ref<"dark" | "light">("dark")
		const { container, unmount } = mount(() =>
			h(ThemeProvider, { theme: createTheme({ palette: { primary: { main: "#ff5722" } } }), colorScheme: scheme.value, global: true }, slot("in")),
		)
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("dark")
		expect(container.querySelector("[data-omni-theme]")).toBeNull()
		const css = container.querySelector("style")?.textContent ?? ""
		expect(css).toMatch(/^:root\{/)
		expect(css).toContain("--omni-palette-primary-main:#ff5722")
		scheme.value = "light"
		await flush()
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("light")
		scheme.value = "dark"
		await flush()
		unmount()
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("light")
	})

	it("removes the attribute again when it was not there before, and overlays are not scoped", async () => {
		const { unmount } = mount(() => h(ThemeProvider, { theme: createTheme(), global: true }, slot(h(Dialog, { open: true }, slot("x")))))
		await flush()
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("system")
		await screen.findByRole("dialog")
		expect(screen.getByRole("dialog").closest("[data-omni-portal]")?.hasAttribute("data-omni-theme")).toBe(false)
		unmount()
		expect(document.documentElement.hasAttribute("data-omni-color-scheme")).toBe(false)
	})
})

describe("keepMounted", () => {
	it("a closed Dialog keeps its content in the page, hidden, and shows it when opened", async () => {
		const open = ref(false)
		mount(() => h(Dialog, { open: open.value, keepMounted: true }, slot("kept")))
		await screen.findByText("kept")
		expect(screen.getByText("kept").closest(".omni-dialog")?.hasAttribute("hidden")).toBe(true)
		open.value = true
		await flush()
		expect(screen.getByRole("dialog").closest(".omni-dialog")?.hasAttribute("hidden")).toBe(false)
	})

	it("a closed Menu keeps its items in the page, hidden", async () => {
		const open = ref(false)
		mount(() => h(Menu, { anchorEl: document.body, open: open.value, keepMounted: true }, slot(h(MenuItem, null, slot("One")))))
		await screen.findByText("One")
		expect(screen.getByText("One").closest("ul")?.hasAttribute("hidden")).toBe(true)
		open.value = true
		await flush()
		expect(screen.getByRole("menu").hasAttribute("hidden")).toBe(false)
		fireEvent.click(screen.getByText("One"))
	})
})
