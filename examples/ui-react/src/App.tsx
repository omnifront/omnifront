import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Menu,
	MenuDivider,
	MenuItem,
	Select,
	Tab,
	TabContext,
	TabList,
	TabPanel,
	TextField,
	ThemeProvider,
	createTheme,
	type ColorSchemeMode,
} from "@omnifront/ui-react"
import { useEffect, useMemo, useState } from "react"

// The same page exists for Vue and Angular (examples/ui-vue, examples/ui-angular). The URL sets the
// starting state (?scheme=dark&theme=brand&open=dialog&tab=queries) so the three can be compared
// screenshot by screenshot (e2e/visual.spec.ts).
const params = new URLSearchParams(location.search)

// A theme is plain data. These are omnifront's own brand colours, as a sample theme.
const brand = createTheme({
	palette: { primary: { main: "#7C3AED" }, secondary: { main: "#06B6D4" }, success: { main: "#10B981" } },
	shape: { borderRadius: 8 },
})
const standard = createTheme()

const heading = { font: "var(--omni-typography-h6-font)", margin: 0 } as const
const fruit = [
	{ value: "a", label: "Apple" },
	{ value: "b", label: "Banana", disabled: true },
	{ value: "c", label: "Cherry" },
	{ value: "d", label: "Date" },
]

export function App() {
	const [mode, setMode] = useState<ColorSchemeMode>((params.get("scheme") as ColorSchemeMode | null) ?? "light")
	const [custom, setCustom] = useState(params.get("theme") === "brand")
	const theme = useMemo(() => (custom ? brand : standard), [custom])

	const [dialog, setDialog] = useState(params.get("open") === "dialog")
	const [anchor, setAnchor] = useState<HTMLElement | null>(null)
	const [tab, setTab] = useState(params.get("tab") ?? "overview")
	const [fruitValue, setFruitValue] = useState("")
	const [selectOpen, setSelectOpen] = useState(params.get("open") === "select")
	const [email, setEmail] = useState("")
	const [picked, setPicked] = useState("")
	useEffect(() => {
		if (params.get("open") === "menu") setAnchor(document.getElementById("menu-button"))
	}, [])

	return (
		<ThemeProvider theme={theme} colorScheme={mode} global>
			<main style={{ maxWidth: 880, margin: "0 auto", padding: 24, display: "grid", gap: 32, color: "var(--omni-palette-text-primary)", font: "var(--omni-typography-body1-font)" }}>
				<header style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
					<h1 style={{ font: "var(--omni-typography-h4-font)", margin: 0, flex: 1 }}>omnifront UI</h1>
					{(["light", "dark", "system"] as const).map((m) => (
						<Button key={m} size="small" variant={mode === m ? "contained" : "outlined"} onClick={() => setMode(m)}>
							{m}
						</Button>
					))}
					<Button size="small" color="secondary" variant={custom ? "contained" : "outlined"} onClick={() => setCustom((c) => !c)}>
						brand theme
					</Button>
				</header>

				<section style={{ display: "grid", gap: 16 }}>
					<h2 style={heading}>Button</h2>
					<div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
						<Button>Text</Button>
						<Button variant="outlined">Outlined</Button>
						<Button variant="contained">Contained</Button>
						<Button variant="contained" color="secondary">Secondary</Button>
						<Button variant="contained" color="success">Success</Button>
						<Button variant="contained" color="error">Error</Button>
						<Button variant="contained" disabled>Disabled</Button>
						<Button variant="contained" loading>Saving</Button>
						<Button variant="contained" size="small">Small</Button>
						<Button variant="contained" size="large">Large</Button>
						<Button variant="outlined" href="https://example.com">Link</Button>
					</div>
				</section>

				<section style={{ display: "grid", gap: 16 }}>
					<h2 style={heading}>TextField</h2>
					<div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
						<TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} helperText="We never share it" />
						<TextField label="Filled" variant="filled" defaultValue="Oslo" />
						<TextField label="Standard" variant="standard" />
						<TextField label="Error" error helperText="Must be a number" defaultValue="abc" />
						<TextField label="Disabled" disabled defaultValue="Nope" />
						<TextField label="Required" required size="small" />
						<TextField label="Amount" startAdornment="$" endAdornment="USD" />
						<TextField label="Bio" multiline rows={3} />
					</div>
				</section>

				<section style={{ display: "grid", gap: 16 }}>
					<h2 style={heading}>Select</h2>
					<div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
						<Select label="Fruit" options={fruit} value={fruitValue} onChange={(_e, v) => setFruitValue(v)} open={selectOpen} onOpenChange={setSelectOpen} helperText="Pick one" />
						<Select label="Filled" variant="filled" options={fruit} defaultValue="c" />
						<Select label="Standard" variant="standard" options={fruit} />
						<Select label="Error" error options={fruit} helperText="Required" />
						<Select label="Disabled" disabled options={fruit} defaultValue="a" />
					</div>
				</section>

				<section style={{ display: "grid", gap: 16 }}>
					<h2 style={heading}>Dialog and Menu</h2>
					<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
						<Button variant="contained" onClick={() => setDialog(true)}>Open dialog</Button>
						<Button variant="outlined" id="menu-button" onClick={(e) => setAnchor(e.currentTarget)}>Open menu</Button>
						<span>{picked && `Picked: ${picked}`}</span>
					</div>
					<Dialog open={dialog} onClose={() => setDialog(false)}>
						<DialogTitle>Delete project?</DialogTitle>
						<DialogContent>
							<DialogContentText>This permanently removes the project and its 12 queries. It cannot be undone.</DialogContentText>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setDialog(false)}>Cancel</Button>
							<Button color="error" onClick={() => setDialog(false)}>Delete</Button>
						</DialogActions>
					</Dialog>
					<Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
						<MenuItem onClick={() => setPicked("Profile")}>Profile</MenuItem>
						<MenuItem onClick={() => setPicked("Settings")}>Settings</MenuItem>
						<MenuItem disabled>Billing</MenuItem>
						<MenuDivider />
						<MenuItem onClick={() => setPicked("Logout")}>Logout</MenuItem>
					</Menu>
				</section>

				<section style={{ display: "grid", gap: 8 }}>
					<h2 style={heading}>Tabs</h2>
					<TabContext value={tab} onChange={(_e, v) => setTab(v)}>
						<TabList aria-label="Sections">
							<Tab value="overview" label="Overview" />
							<Tab value="queries" label="Queries" />
							<Tab value="settings" label="Settings" />
							<Tab value="archived" label="Archived" disabled />
						</TabList>
						<TabPanel value="overview">Overview panel</TabPanel>
						<TabPanel value="queries">Queries panel</TabPanel>
						<TabPanel value="settings">Settings panel</TabPanel>
					</TabContext>
				</section>
			</main>
		</ThemeProvider>
	)
}
