import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Dialog, Menu, MenuItem, ThemeProvider, createTheme } from "../src"

afterEach(() => document.documentElement.removeAttribute("data-omni-color-scheme"))

describe("ThemeProvider global", () => {
	it("puts the theme on :root and the scheme on <html>, with no wrapper, and restores <html> on unmount", () => {
		document.documentElement.setAttribute("data-omni-color-scheme", "light")
		const { container, unmount } = render(
			<ThemeProvider theme={createTheme({ palette: { primary: { main: "#ff5722" } } })} colorScheme="dark" global>
				<span>in</span>
			</ThemeProvider>,
		)
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("dark")
		expect(container.querySelector("[data-omni-theme]")).toBeNull()
		const css = container.querySelector("style")?.textContent ?? ""
		expect(css).toMatch(/^:root\{/)
		expect(css).toContain("--omni-palette-primary-main:#ff5722")
		unmount()
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("light")
	})

	it("removes the attribute again when it was not there before, and overlays are not scoped", () => {
		const { unmount } = render(
			<ThemeProvider theme={createTheme()} global>
				<Dialog open>x</Dialog>
			</ThemeProvider>,
		)
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("system")
		expect(screen.getByRole("dialog").closest("[data-omni-portal]")?.hasAttribute("data-omni-theme")).toBe(false)
		unmount()
		expect(document.documentElement.hasAttribute("data-omni-color-scheme")).toBe(false)
	})
})

describe("keepMounted", () => {
	it("a closed Dialog keeps its content in the page, hidden, and shows it when opened", () => {
		const { rerender } = render(<Dialog open={false} keepMounted>kept</Dialog>)
		expect(screen.getByText("kept").closest(".omni-dialog")?.hasAttribute("hidden")).toBe(true)
		rerender(<Dialog open keepMounted>kept</Dialog>)
		expect(screen.getByRole("dialog").closest(".omni-dialog")?.hasAttribute("hidden")).toBe(false)
	})

	it("a closed Menu keeps its items in the page, hidden", () => {
		const { rerender } = render(<Menu anchorEl={document.body} open={false} keepMounted><MenuItem>One</MenuItem></Menu>)
		expect(screen.getByText("One").closest("ul")?.hasAttribute("hidden")).toBe(true)
		rerender(<Menu anchorEl={document.body} open keepMounted><MenuItem>One</MenuItem></Menu>)
		expect(screen.getByRole("menu").hasAttribute("hidden")).toBe(false)
		fireEvent.click(screen.getByText("One"))
	})
})
