import { screen, waitFor } from "@testing-library/dom"
import { createSSRApp, h, nextTick } from "vue"
import { renderToString } from "vue/server-renderer"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Button, Dialog, DialogTitle, Menu, MenuItem, Tab, TabContext, TabList, TabPanel, TextField, ThemeProvider, createTheme } from "../src"
import { slot } from "./mount"

afterEach(() => vi.restoreAllMocks())

const app = () =>
	createSSRApp({
		render: () =>
			h(ThemeProvider, { theme: createTheme(), colorScheme: "dark" }, slot(
				h(Button, { variant: "contained", loading: true }, slot("Save")),
				h(TextField, { label: "Name", defaultValue: "Ada", helperText: "Hi" }),
				h(TextField, { label: "Empty", required: true }),
				h(Dialog, { open: true }, slot(h(DialogTitle, null, slot("Delete project?")))),
				h(Menu, { anchorEl: document.body, open: true }, slot(h(MenuItem, null, slot("Profile")))),
				h(TabContext, { defaultValue: "b" }, slot(
					h(TabList, { "aria-label": "Sections" }, slot(h(Tab, { value: "a", label: "A" }), h(Tab, { value: "b", label: "B" }))),
					h(TabPanel, { value: "b" }, slot("Body B")),
				)),
			)),
	})

describe("hydration", () => {
	it("the client takes over the server HTML with no mismatch, then shows the overlays", async () => {
		const html = await renderToString(app())
		expect(html).not.toContain("Delete project?") // overlays are browser-only
		const container = document.createElement("div")
		container.innerHTML = html
		document.body.append(container)
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
		const error = vi.spyOn(console, "error").mockImplementation(() => {})

		app().mount(container)
		await nextTick()

		expect(warn).not.toHaveBeenCalled() // Vue reports hydration mismatches as warnings
		expect(error).not.toHaveBeenCalled()
		expect(container.innerHTML).toContain("Body B")
		expect(await screen.findByRole("dialog", { name: "Delete project?" })).toBeTruthy()
		// (the open modal dialog hides the menu from the accessibility tree, so look it up in the DOM)
		await waitFor(() => expect(document.querySelector('[role="menu"]')).not.toBeNull())
	})
})
