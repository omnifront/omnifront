import { useStore } from "@omnifront/react"
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
	Tab,
	TabContext,
	TabList,
	TabPanel,
	TextField,
	ThemeProvider,
	createColorSchemeStore,
	createTheme,
	type Theme,
} from "@omnifront/ui-react"
import { useEffect, useMemo, useState } from "react"

// The colour scheme is a normal omnifront store: any framework reads it with useStore / injectStore.
const colorScheme = createColorSchemeStore({ defaultMode: "system", storageKey: "omni-ui-demo-scheme", target: () => document.documentElement })

// A theme is plain data. These are omnifront's own brand colours, as a sample theme.
const brand: Theme = createTheme({
	palette: { primary: { main: "#7C3AED" }, secondary: { main: "#06B6D4" }, success: { main: "#10B981" } },
	shape: { borderRadius: 8 },
})

export function App() {
	const mode = useStore(colorScheme, (s) => s.mode)
	const setMode = useStore(colorScheme, (s) => s.setMode)
	const [custom, setCustom] = useState(false)
	useEffect(() => colorScheme.restore(), [])
	const theme = useMemo(() => (custom ? brand : createTheme()), [custom])

	const [dialog, setDialog] = useState(false)
	const [anchor, setAnchor] = useState<HTMLElement | null>(null)
	const [tab, setTab] = useState("overview")
	const [email, setEmail] = useState("")
	const [picked, setPicked] = useState("")

	return (
		<ThemeProvider theme={theme} colorScheme={mode}>
			<main style={{ maxWidth: 880, margin: "0 auto", padding: 24, display: "grid", gap: 32, background: "var(--omni-palette-background-default)", color: "var(--omni-palette-text-primary)", font: "var(--omni-typography-body1-font)", minHeight: "100vh" }}>
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
					<h2 style={{ font: "var(--omni-typography-h6-font)", margin: 0 }}>Button</h2>
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
					<h2 style={{ font: "var(--omni-typography-h6-font)", margin: 0 }}>TextField</h2>
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
					<h2 style={{ font: "var(--omni-typography-h6-font)", margin: 0 }}>Dialog and Menu</h2>
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
					<h2 style={{ font: "var(--omni-typography-h6-font)", margin: 0 }}>Tabs</h2>
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
