import "@angular/compiler"
import { Component } from "@angular/core"
import { bootstrapApplication, provideClientHydration, type BootstrapContext } from "@angular/platform-browser"
import { provideServerRendering, renderApplication } from "@angular/platform-server"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
	OmniButton,
	OmniDialog,
	OmniDialogTitle,
	OmniMenu,
	OmniMenuItem,
	OmniTab,
	OmniTabContext,
	OmniTabList,
	OmniTabPanel,
	OmniTextField,
	OmniThemeProvider,
	createTheme,
} from "../src"
import { zonelessProviders } from "./compat"

// Angular 17 cannot run without zone.js; newer versions need nothing.
const zone = "zone.js"
if (zonelessProviders().length === 0) await import(/* @vite-ignore */ zone)

afterEach(() => {
	vi.restoreAllMocks()
	document.body.innerHTML = ""
})

class App {
	theme = createTheme()
	anchor = document.body
}
// Applying the decorator by hand: esbuild does not run Angular's decorator transform.
Component({
	standalone: true,
	selector: "app-root",
	imports: [OmniThemeProvider, OmniButton, OmniTextField, OmniDialog, OmniDialogTitle, OmniMenu, OmniMenuItem, OmniTabContext, OmniTabList, OmniTab, OmniTabPanel],
	template: `
		<omni-theme-provider [theme]="theme" colorScheme="dark">
			<button omni-button variant="contained" loading>Save</button>
			<omni-text-field label="Name" defaultValue="Ada" helperText="Hi" />
			<omni-text-field label="Empty" required />
			<omni-dialog [open]="true"><h2 omniDialogTitle>Delete project?</h2></omni-dialog>
			<omni-menu [anchorEl]="anchor" [open]="true"><li omniMenuItem>Profile</li></omni-menu>
			<omni-tab-context defaultValue="b">
				<omni-tab-list label="Sections"><button omni-tab value="a" label="A"></button><button omni-tab value="b" label="B"></button></omni-tab-list>
				<omni-tab-panel value="b">Body B</omni-tab-panel>
			</omni-tab-context>
		</omni-theme-provider>
	`,
})(App)

describe("hydration", () => {
	it("the client takes over the server HTML with no mismatch, reusing its DOM, then shows the overlays", async () => {
		const html = await renderApplication(
			(context: BootstrapContext) =>
				bootstrapApplication(App, { providers: [...zonelessProviders(), provideServerRendering(), provideClientHydration()] }, context),
			{ document: "<app-root></app-root>" },
		)
		expect(html).toContain("ngh=") // the server marked the DOM for hydration
		expect(html).not.toContain("Delete project?") // overlays are browser-only

		const parsed = new DOMParser().parseFromString(html, "text/html")
		document.body.innerHTML = parsed.body.innerHTML
		const serverButton = document.querySelector("button")
		expect(serverButton).not.toBeNull()
		const error = vi.spyOn(console, "error").mockImplementation(() => {})
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

		const ref = await bootstrapApplication(App, { providers: [...zonelessProviders(), provideClientHydration()] })
		await ref.whenStable()
		await new Promise((r) => setTimeout(r, 50))
		await ref.whenStable()

		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()
		// hydrated, not rebuilt: the very same element the server rendered is still there
		expect(document.querySelector("button")).toBe(serverButton)
		expect(document.body.textContent).toContain("Body B")
		expect(document.querySelector('[role="dialog"]')).not.toBeNull()
		expect(document.querySelector('[role="menu"]')).not.toBeNull()
		ref.destroy()
	})
})
