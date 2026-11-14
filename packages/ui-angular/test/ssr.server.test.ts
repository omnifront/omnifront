// @vitest-environment node
import "@angular/compiler"
import { Component } from "@angular/core"
import { bootstrapApplication, type BootstrapContext } from "@angular/platform-browser"
import { provideServerRendering, renderApplication } from "@angular/platform-server"
import { describe, expect, it } from "vitest"
import {
	OmniButton,
	OmniDialog,
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

// Angular 17 cannot run without zone.js (its server renderer included); newer versions need nothing.
if (zonelessProviders().length === 0) await import(/* @vite-ignore */ "zone.js" as string)

class App {
	theme = createTheme()
}
// Applying the decorator by hand: esbuild does not run Angular's decorator transform.
Component({
	standalone: true,
	selector: "app-root",
	imports: [OmniThemeProvider, OmniButton, OmniTextField, OmniDialog, OmniMenu, OmniMenuItem, OmniTabContext, OmniTabList, OmniTab, OmniTabPanel],
	template: `
		<omni-theme-provider [theme]="theme">
			<button omni-button variant="contained">Save</button>
			<omni-text-field label="Name" defaultValue="Ada" helperText="Hi" />
			<omni-dialog [open]="true">never rendered in place on the server</omni-dialog>
			<omni-menu [anchorEl]="null" [open]="true"><li omniMenuItem>x</li></omni-menu>
			<omni-tab-context defaultValue="a">
				<omni-tab-list><button omni-tab value="a">A</button></omni-tab-list>
				<omni-tab-panel value="a">Body A</omni-tab-panel>
			</omni-tab-context>
		</omni-theme-provider>
	`,
})(App)

describe("Angular server rendering", () => {
	it("renders the components to HTML without a browser", async () => {
		const html = await renderApplication(
			(context: BootstrapContext) => bootstrapApplication(App, { providers: [...zonelessProviders(), provideServerRendering()] }, context),
			{ document: "<app-root></app-root>" },
		)
		expect(html).toContain("omni-button")
		expect(html).toContain('data-variant="contained"')
		expect(html).toContain("--omni-palette-primary-main:#1976d2")
		expect(html).toMatch(/data-shrink/) // defaultValue: label already floated, so hydration matches
		expect(html).toContain("Body A")
		// Overlays render into a browser-only portal, so (like React and Vue) they leave no server HTML.
		expect(html).not.toContain("never rendered in place")
		expect(html).not.toContain("omni-menu__item")

		expect(html).toContain('role="tab"')
	})
})
