import { act, screen } from "@testing-library/react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Button, Dialog, DialogTitle, Menu, MenuItem, Tab, TabContext, TabList, TabPanel, TextField, ThemeProvider, createTheme } from "../src"

afterEach(() => vi.restoreAllMocks())

const App = () => (
	<ThemeProvider theme={createTheme()} colorScheme="dark">
		<Button variant="contained" loading>Save</Button>
		<TextField label="Name" defaultValue="Ada" helperText="Hi" />
		<TextField label="Empty" required />
		<Dialog open><DialogTitle>Delete project?</DialogTitle></Dialog>
		<Menu anchorEl={document.body} open><MenuItem>Profile</MenuItem></Menu>
		<TabContext defaultValue="b">
			<TabList aria-label="Sections"><Tab value="a" label="A" /><Tab value="b" label="B" /></TabList>
			<TabPanel value="b">Body B</TabPanel>
		</TabContext>
	</ThemeProvider>
)

describe("hydration", () => {
	it("the client takes over the server HTML with no mismatch, then shows the overlays", async () => {
		const html = renderToString(<App />)
		expect(html).not.toContain("Delete project?") // overlays are browser-only
		const container = document.createElement("div")
		container.innerHTML = html
		document.body.append(container)
		const recoverable: unknown[] = []
		const error = vi.spyOn(console, "error").mockImplementation(() => {})
		const before = container.innerHTML

		await act(async () => {
			hydrateRoot(container, <App />, { onRecoverableError: (e) => recoverable.push(e) })
		})

		expect(recoverable).toEqual([])
		expect(error).not.toHaveBeenCalled()
		// the server DOM was reused, not rebuilt: the first button is the same element before and after
		expect(container.querySelector("button")?.className).toBe("omni-button")
		expect(container.innerHTML).toContain("Body B")
		expect(before).toContain('data-shrink=""') // label already floated for defaultValue, on the server
		// after mount the overlays appear in portals
		expect(await screen.findByRole("dialog", { name: "Delete project?" })).toBeTruthy()
		// (the open modal dialog hides the menu from the accessibility tree, so look it up in the DOM)
		expect(document.querySelector('[role="menu"]')).not.toBeNull()
	})
})
