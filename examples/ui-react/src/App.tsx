import {
	Button,
	ButtonGroup,
	Checkbox,
	Fab,
	IconButton,
	Rating,
	Slider,
	ToggleButton,
	ToggleButtonGroup,
	FormGroup,
	Radio,
	RadioGroup,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Menu,
	MenuDivider,
	MenuItem,
	Select,
	Switch,
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
const plus = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
const trash = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
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
	const [format, setFormat] = useState<string[]>(["bold"])
	const [align, setAlign] = useState<string | null>("left")
	const [volume, setVolume] = useState(30)
	const [stars, setStars] = useState(3)
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
						<TextField label="Notes" multiline minRows={2} maxRows={4} />
					</div>
				</section>

				<section style={{ display: "grid", gap: 16 }}>
					<h2 style={heading}>Icon buttons and groups</h2>
					<div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
						<IconButton aria-label="Delete">{trash}</IconButton>
						<IconButton aria-label="Delete primary" color="primary">{trash}</IconButton>
						<IconButton aria-label="Delete small" size="small" color="error">{trash}</IconButton>
						<IconButton aria-label="Delete disabled" disabled>{trash}</IconButton>
						<Fab aria-label="Add">{plus}</Fab>
						<Fab aria-label="Add small" size="small" color="secondary">{plus}</Fab>
						<Fab variant="extended">{plus} Create</Fab>
						<ButtonGroup aria-label="Actions" variant="outlined">
							<Button>One</Button>
							<Button>Two</Button>
							<Button>Three</Button>
						</ButtonGroup>
						<ButtonGroup aria-label="Contained actions" variant="contained" color="secondary">
							<Button>Left</Button>
							<Button>Right</Button>
						</ButtonGroup>
					</div>
					<div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
						<ToggleButtonGroup aria-label="Format" value={format} onChange={(_e, v) => setFormat(v as string[])}>
							<ToggleButton value="bold">Bold</ToggleButton>
							<ToggleButton value="italic">Italic</ToggleButton>
							<ToggleButton value="underline" disabled>Underline</ToggleButton>
						</ToggleButtonGroup>
						<ToggleButtonGroup aria-label="Alignment" exclusive color="secondary" value={align} onChange={(_e, v) => setAlign(v as string | null)}>
							<ToggleButton value="left">Left</ToggleButton>
							<ToggleButton value="center">Center</ToggleButton>
							<ToggleButton value="right">Right</ToggleButton>
						</ToggleButtonGroup>
					</div>
				</section>

				<section style={{ display: "grid", gap: 16 }}>
					<h2 style={heading}>Slider and Rating</h2>
					<div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
						<Slider aria-label="Volume" value={volume} onChange={(_e, v) => setVolume(v)} valueLabelDisplay="on" />
						<Slider aria-label="Temperature" defaultValue={20} min={0} max={40} step={10} marks={[{ value: 0, label: "0°C" }, { value: 10, label: "10°C" }, { value: 20, label: "20°C" }, { value: 30, label: "30°C" }, { value: 40, label: "40°C" }]} color="secondary" />
						<Slider aria-label="Small" size="small" defaultValue={60} />
						<Slider aria-label="Disabled" disabled defaultValue={40} />
					</div>
					<div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
						<Rating aria-label="Rating" value={stars} onChange={(_e, v) => setStars(v)} />
						<Rating aria-label="Half stars" precision={0.5} defaultValue={2.5} size="large" />
						<Rating aria-label="Read only" readOnly defaultValue={4} />
						<Rating aria-label="Disabled rating" disabled defaultValue={2} />
					</div>
				</section>

				<section style={{ display: "grid", gap: 16 }}>
					<h2 style={heading}>Select</h2>
					<div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
						<Select label="Fruit" options={fruit} value={fruitValue} onChange={(_e, v) => setFruitValue(v)} open={selectOpen} onOpenChange={setSelectOpen} helperText="Pick one" />
						<Select label="Filled" variant="filled" options={fruit} defaultValue="c" />
						<Select label="Standard" variant="standard" options={fruit} />
						<Select label="Several" multiple options={fruit} defaultValue={["a", "c"]} />
						<Select label="Error" error options={fruit} helperText="Required" />
						<Select label="Disabled" disabled options={fruit} defaultValue="a" />
					</div>
				</section>

				<section style={{ display: "grid", gap: 16 }}>
					<h2 style={heading}>Checkbox and Radio</h2>
					<FormGroup label="Notifications" helperText="Choose any" row>
						<Checkbox label="Accept terms" />
						<Checkbox label="Subscribe" defaultChecked />
						<Checkbox label="Some" indeterminate />
						<Checkbox label="Secondary" color="secondary" defaultChecked />
						<Checkbox label="Small" size="small" defaultChecked />
						<Checkbox label="Disabled" disabled />
						<Checkbox label="Disabled on" disabled defaultChecked />
					</FormGroup>
					<div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
						<RadioGroup label="Fruit" helperText="Pick one" defaultValue="c">
							<Radio value="a" label="Apple" />
							<Radio value="b" label="Banana" disabled />
							<Radio value="c" label="Cherry" />
						</RadioGroup>
						<RadioGroup label="Plan" error helperText="Required" row>
							<Radio value="free" label="Free" />
							<Radio value="pro" label="Pro" color="secondary" />
						</RadioGroup>
					</div>
					<div style={{ display: "flex", flexWrap: "wrap", alignItems: "center" }}>
						<Switch label="Wi-Fi" />
						<Switch label="Bluetooth" defaultChecked />
						<Switch label="Secondary" color="secondary" defaultChecked />
						<Switch label="Small" size="small" defaultChecked />
						<Switch label="Disabled" disabled />
						<Switch label="Disabled on" disabled defaultChecked />
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
