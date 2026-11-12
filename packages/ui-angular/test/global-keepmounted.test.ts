import { Component, signal } from "@angular/core"
import { TestBed } from "@angular/core/testing"
import { fireEvent, screen } from "@testing-library/dom"
import { afterEach, describe, expect, it } from "vitest"
import { OmniDialog, OmniMenu, OmniMenuItem, OmniThemeProvider, createTheme } from "../src"
import { render, settle } from "./helpers"

afterEach(() => {
	TestBed.resetTestingModule()
	document.body.innerHTML = ""
	document.body.removeAttribute("style")
	document.documentElement.removeAttribute("data-omni-color-scheme")
})

@Component({
	standalone: true,
	imports: [OmniThemeProvider, OmniDialog],
	template: `<omni-theme-provider [theme]="theme" [colorScheme]="scheme()" global><omni-dialog [open]="true">x</omni-dialog></omni-theme-provider>`,
})
class GlobalHost {
	theme = createTheme({ palette: { primary: { main: "#ff5722" } } })
	scheme = signal<"dark" | "light">("dark")
}

describe("ThemeProvider global", () => {
	it("puts the theme on :root and the scheme on <html>, with no scope on the host, and restores <html> on destroy", async () => {
		document.documentElement.setAttribute("data-omni-color-scheme", "light")
		const fixture = await render(GlobalHost)
		const provider = document.querySelector("omni-theme-provider") as HTMLElement
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("dark")
		expect(provider.hasAttribute("data-omni-theme")).toBe(false)
		const css = provider.querySelector("style")?.textContent ?? ""
		expect(css).toMatch(/^:root\{/)
		expect(css).toContain("--omni-palette-primary-main:#ff5722")
		expect(screen.getByRole("dialog").closest("[data-omni-portal]")?.hasAttribute("data-omni-theme")).toBe(false)
		fixture.componentInstance.scheme.set("light")
		await settle(fixture)
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("light")
		fixture.destroy()
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("light")
	})

	it("removes the attribute again when it was not there before", async () => {
		const fixture = await render(GlobalHost)
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("dark")
		fixture.destroy()
		expect(document.documentElement.hasAttribute("data-omni-color-scheme")).toBe(false)
	})
})

@Component({
	standalone: true,
	imports: [OmniDialog, OmniMenu, OmniMenuItem],
	template: `
		<omni-dialog [open]="dialogOpen()" keepMounted>kept</omni-dialog>
		<omni-menu [anchorEl]="null" [open]="menuOpen()" keepMounted><li omniMenuItem>One</li></omni-menu>
	`,
})
class KeepHost {
	dialogOpen = signal(false)
	menuOpen = signal(false)
}

describe("keepMounted", () => {
	it("closed Dialog and Menu keep their content in the page, hidden, and show it when opened", async () => {
		const fixture = await render(KeepHost)
		expect(screen.getByText("kept").closest(".omni-dialog")?.hasAttribute("hidden")).toBe(true)
		expect(screen.getByText("One").closest("ul")?.hasAttribute("hidden")).toBe(true)
		fixture.componentInstance.dialogOpen.set(true)
		await settle(fixture)
		expect(screen.getByRole("dialog").closest(".omni-dialog")?.hasAttribute("hidden")).toBe(false)
		// (an open modal dialog hides everything else from assistive technology, so open them one at a time)
		fixture.componentInstance.dialogOpen.set(false)
		await new Promise((r) => setTimeout(r, 300))
		fixture.componentInstance.menuOpen.set(true)
		await settle(fixture)
		expect(screen.getByRole("menu").hasAttribute("hidden")).toBe(false)
		fireEvent.click(screen.getByText("One"))
	})
})
