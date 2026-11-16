import { act, render } from "@testing-library/react"
import { useState, type ReactNode } from "react"
import { defineUiConformanceSuite, type UiHarness } from "@omnifront/conformance"
import { Accordion, AccordionDetails, AccordionSummary, AppBar, Avatar, Badge, Card, CardActions, CardContent, CardHeader, Chip, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Paper, SvgIcon, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, Toolbar, Tooltip, Typography } from "../src"
import { ButtonGroup, Checkbox, Fab, IconButton, Radio, RadioGroup, Rating, Slider, Switch, ToggleButton, ToggleButtonGroup } from "../src"
import { Alert, AlertTitle, AccordionGroup, AvatarGroup, Backdrop, BottomNavigation, BottomNavigationAction, Breadcrumbs, CardActionArea, CircularProgress, Drawer, LinearProgress, Link, ListItemAvatar, Pagination, Popover, Skeleton, Snackbar, SpeedDial, SpeedDialAction, Step, Stepper, TablePagination, TableSortLabel } from "../src"
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Menu, MenuItem, Select, Tab, TabContext, TabList, TabPanel, TextField } from "../src"

type Log = (event: string) => void

/** Render a view whose props a test can change from outside, like a parent component re-rendering. */
function mountWith<P extends object>(initial: P, view: (props: P) => ReactNode) {
	let setProps!: (p: Partial<P>) => void
	function Host() {
		const [props, set] = useState(initial)
		setProps = (p) => set((old) => ({ ...old, ...p }))
		return <>{view(props)}</>
	}
	const result = render(<Host />)
	return {
		set: async (p: Record<string, unknown>) => void act(() => setProps(p as Partial<P>)),
		unmount: () => result.unmount(),
	}
}

function DialogView({ log }: { log: Log }) {
	const [open, setOpen] = useState(false)
	return (
		<>
			<button onClick={() => setOpen(true)}>Open</button>
			<Dialog open={open} onClose={(_e, reason) => { log(`close:${reason}`); setOpen(false) }}>
				<DialogTitle>Delete project?</DialogTitle>
				<DialogContent><DialogContentText>This cannot be undone.</DialogContentText></DialogContent>
				<DialogActions><button>Cancel</button><button>Delete</button></DialogActions>
			</Dialog>
		</>
	)
}

function MenuView({ log }: { log: Log }) {
	const [anchor, setAnchor] = useState<HTMLElement | null>(null)
	return (
		<>
			<button id="menu-button" onClick={(e) => setAnchor(e.currentTarget)}>Menu</button>
			<Menu anchorEl={anchor} open={anchor !== null} onClose={(_e, reason) => { log(`close:${reason}`); setAnchor(null) }}>
				<MenuItem onClick={() => log("select:profile")}>Profile</MenuItem>
				<MenuItem disabled onClick={() => log("select:billing")}>Billing</MenuItem>
				<MenuItem onClick={() => log("select:logout")}>Logout</MenuItem>
			</Menu>
		</>
	)
}

function CheckboxView({ indeterminate, disabled, error, log }: { indeterminate: boolean | undefined; disabled: boolean | undefined; error: boolean | undefined; log: Log }) {
	const [checked, setChecked] = useState(false)
	return <Checkbox label="Accept terms" checked={checked} indeterminate={indeterminate} disabled={disabled} error={error} onChange={(_e, c) => { log(`change:${c}`); setChecked(c) }} />
}

function IconButtonsView({ disabled, log }: { disabled: boolean | undefined; log: Log }) {
	return (
		<>
			<IconButton aria-label="Delete" disabled={disabled} onClick={() => log("click:delete")}><svg /></IconButton>
			<Fab aria-label="Add" disabled={disabled} onClick={() => log("click:add")}><svg /></Fab>
			<Fab variant="extended" disabled={disabled} onClick={() => log("click:create")}>Create</Fab>
		</>
	)
}

function ButtonGroupView({ disabled, log }: { disabled: boolean | undefined; log: Log }) {
	return (
		<ButtonGroup aria-label="Actions" variant="outlined" color="secondary" size="small" disabled={disabled}>
			<Button onClick={() => log("click:one")}>One</Button>
			<Button onClick={() => log("click:two")}>Two</Button>
		</ButtonGroup>
	)
}

function ToggleGroupView({ exclusive, log }: { exclusive: boolean | undefined; log: Log }) {
	const [value, setValue] = useState<string[]>([])
	return (
		<ToggleButtonGroup aria-label="Format" exclusive={exclusive} value={exclusive ? (value[0] ?? null) : value} onChange={(_e, v) => { const list = v === null ? [] : typeof v === "string" ? [v] : v; log(`change:${list.join(",")}`); setValue(list) }}>
			<ToggleButton value="bold">Bold</ToggleButton>
			<ToggleButton value="italic">Italic</ToggleButton>
			<ToggleButton value="underline" disabled>Underline</ToggleButton>
		</ToggleButtonGroup>
	)
}

function SliderView({ disabled, log }: { disabled: boolean | undefined; log: Log }) {
	const [value, setValue] = useState(30)
	return <Slider aria-label="Volume" min={0} max={100} step={10} value={value} valueLabelDisplay="auto" disabled={disabled} onChange={(_e, v) => { log(`change:${v}`); setValue(v) }} />
}

function RangeSliderView({ vertical, disabled, log }: { vertical: boolean | undefined; disabled: boolean | undefined; log: Log }) {
	const [value, setValue] = useState<[number, number]>([20, 80])
	return (
		<Slider
			aria-label="Price"
			range
			min={0}
			max={100}
			step={10}
			value={value}
			valueLabelDisplay="on"
			orientation={vertical ? "vertical" : "horizontal"}
			disabled={disabled}
			onChange={(_e, v) => { log(`change:${v.join(",")}`); setValue(v) }}
		/>
	)
}

function RatingView({ readOnly, disabled, log }: { readOnly: boolean | undefined; disabled: boolean | undefined; log: Log }) {
	const [value, setValue] = useState(0)
	return <Rating aria-label="Rating" value={readOnly ? 3 : value} readOnly={readOnly} disabled={disabled} onChange={(_e, v) => { log(`change:${v}`); setValue(v) }} />
}

function SwitchView({ disabled, error, log }: { disabled: boolean | undefined; error: boolean | undefined; log: Log }) {
	const [checked, setChecked] = useState(false)
	return <Switch label="Wi-Fi" checked={checked} disabled={disabled} error={error} onChange={(_e, c) => { log(`change:${c}`); setChecked(c) }} />
}

function RadioGroupView({ disabled, error, log }: { disabled: boolean | undefined; error: boolean | undefined; log: Log }) {
	const [value, setValue] = useState("")
	return (
		<RadioGroup label="Fruit" helperText="Pick one" value={value} disabled={disabled} error={error} onChange={(_e, v) => { log(`change:${v}`); setValue(v) }}>
			<Radio value="a" label="Apple" />
			<Radio value="b" label="Banana" disabled />
			<Radio value="c" label="Cherry" />
		</RadioGroup>
	)
}

const fruit = [
	{ value: "a", label: "Apple" },
	{ value: "b", label: "Banana", disabled: true },
	{ value: "c", label: "Cherry" },
]

function SelectView({ error, disabled, multiple, log }: { error: boolean | undefined; disabled: boolean | undefined; multiple: boolean | undefined; log: Log }) {
	const [value, setValue] = useState<string | string[]>(multiple ? [] : "")
	return (
		<Select
			label="Fruit"
			options={fruit}
			{...({ multiple, value } as object)}
			helperText="Pick one"
			error={error}
			disabled={disabled}
			onChange={(_e: Event | undefined, v: string | string[]) => { log(`change:${Array.isArray(v) ? v.join(",") : v}`); setValue(v) }}
			onOpenChange={(open, reason) => { if (!open) log(`close:${reason}`) }}
		/>
	)
}

const groupedFood = [
	{ label: "Fruit", options: [{ value: "a", label: "Apple" }, { value: "b", label: "Banana", disabled: true }] },
	{ label: "Vegetables", options: [{ value: "c", label: "Carrot" }, { value: "d", label: "Daikon" }] },
]

function SelectGroupsView({ log }: { log: Log }) {
	const [value, setValue] = useState("")
	return (
		<Select
			label="Food"
			options={groupedFood}
			value={value}
			onChange={(_e, v) => { log(`change:${v}`); setValue(v) }}
			onOpenChange={(open, reason) => { if (!open) log(`close:${reason}`) }}
			renderOption={(o) => (<><span data-rich>{o.label}</span><small>{o.value}</small></>)}
		/>
	)
}

function TabsView({ selectionFollowsFocus, log }: { selectionFollowsFocus: boolean | undefined; log: Log }) {
	const [value, setValue] = useState("one")
	return (
		<TabContext value={value} selectionFollowsFocus={selectionFollowsFocus} onChange={(_e, v) => { log(`change:${v}`); setValue(v) }}>
			<TabList aria-label="Sections">
				<Tab value="one" label="One" />
				<Tab value="two" label="Two" disabled />
				<Tab value="three" label="Three" />
			</TabList>
			<TabPanel value="one">First panel</TabPanel>
			<TabPanel value="two">Second panel</TabPanel>
			<TabPanel value="three">Third panel</TabPanel>
		</TabContext>
	)
}


function SurfacesView({ raised, log }: { raised: boolean | undefined; log: Log }) {
	return (
		<>
			<AppBar position="static">
				<Toolbar><Typography variant="h6" component="h1">Dashboard</Typography></Toolbar>
			</AppBar>
			<Typography variant="body1">Plain text</Typography>
			<Paper elevation={3}>Paper text</Paper>
			<Card raised={raised}>
				<CardHeader title="Card title" subheader="Card subheader" avatar={<Avatar>A</Avatar>} />
				<CardContent>Card body</CardContent>
				<CardActions><button onClick={() => log("click:share")}>Share</button></CardActions>
			</Card>
			<Divider />
			<Divider>Or</Divider>
		</>
	)
}

const mailPath = "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"

function BadgesView({ count }: { count: number | undefined }) {
	return (
		<>
			<Avatar>AB</Avatar>
			<Avatar variant="rounded" src="/missing.png" alt="Ada" />
			<Avatar />
			<Badge badgeContent={count ?? 4}><SvgIcon titleAccess="Mail"><path d={mailPath} /></SvgIcon></Badge>
			<Badge variant="dot"><SvgIcon><path d={mailPath} /></SvgIcon></Badge>
			<Badge badgeContent={7} max={5}><SvgIcon><path d={mailPath} /></SvgIcon></Badge>
		</>
	)
}

function ListView({ dense, log }: { dense: boolean | undefined; log: Log }) {
	return (
		<nav aria-label="Mailboxes"><List dense={dense}>
			<ListSubheader>Folders</ListSubheader>
			<ListItem disablePadding>
				<ListItemButton selected onClick={() => log("click:inbox")}>
					<ListItemIcon><SvgIcon><path d={mailPath} /></SvgIcon></ListItemIcon>
					<ListItemText primary="Inbox" secondary="3 new" />
				</ListItemButton>
				<ListItemButton disabled onClick={() => log("click:trash")}>Trash</ListItemButton>
			</ListItem>
			<ListItem divider secondaryAction={<button aria-label="Delete drafts" onClick={() => log("click:delete")}>x</button>}>
				<ListItemText primary="Drafts" />
			</ListItem>
			<Divider component="li" />
		</List></nav>
	)
}

function TableView({ size }: { size: "small" | "medium" | undefined }) {
	return (
		<TableContainer>
			<Table aria-label="Desserts" size={size}>
				<TableHead>
					<TableRow><TableCell>Dessert</TableCell><TableCell align="right">Calories</TableCell></TableRow>
				</TableHead>
				<TableBody>
					<TableRow hover selected><TableCell component="th" scope="row">Frozen yoghurt</TableCell><TableCell align="right">159</TableCell></TableRow>
					<TableRow><TableCell>Ice cream</TableCell><TableCell align="right">237</TableCell></TableRow>
				</TableBody>
				<TableFooter>
					<TableRow><TableCell>Total</TableCell><TableCell align="right">396</TableCell></TableRow>
				</TableFooter>
			</Table>
		</TableContainer>
	)
}

function ChipsView({ disabled, log }: { disabled: boolean | undefined; log: Log }) {
	return (
		<>
			<Chip label="Static" />
			<Chip label="Clickable" disabled={disabled} onClick={() => log("click:clickable")} />
			<Chip label="Deletable" disabled={disabled} onDelete={() => log("delete:deletable")} />
			<Chip label="Outlined" variant="outlined" color="primary" size="small" />
		</>
	)
}

function AccordionsView({ disabled, log }: { disabled: boolean | undefined; log: Log }) {
	const [second, setSecond] = useState(false)
	return (
		<div>
			<Accordion onChange={(_e, open) => log(`first:${open}`)}>
				<AccordionSummary>First question</AccordionSummary>
				<AccordionDetails>First answer</AccordionDetails>
			</Accordion>
			<Accordion expanded={second} disabled={disabled} onChange={(_e, open) => { log(`second:${open}`); setSecond(open) }}>
				<AccordionSummary>Second question</AccordionSummary>
				<AccordionDetails>Second answer</AccordionDetails>
			</Accordion>
		</div>
	)
}

function TooltipView({ title, arrow, log }: { title: string | undefined; arrow: boolean | undefined; log: Log }) {
	return (
		<Tooltip title={title ?? "Saves your work"} arrow={arrow} placement="top" enterDelay={0} leaveDelay={50} enterTouchDelay={30} leaveTouchDelay={30} onOpen={() => log("open")} onClose={() => log("close")}>
			<button>Save</button>
		</Tooltip>
	)
}

const Svg = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M0 0h24v24H0z" /></svg>

function AlertsView({ log }: { log: Log }) {
	return (
		<>
			<Alert severity="error"><AlertTitle>Upload failed</AlertTitle>The file is too big.</Alert>
			<Alert>Saved</Alert>
			<Alert severity="info" variant="filled">Heads up</Alert>
			<Alert severity="warning" variant="outlined" icon={false} onClose={() => log("close:warning")}>Careful</Alert>
			<Alert severity="success" action={<Button color="inherit" size="small" onClick={() => log("click:undo")}>Undo</Button>}>Done</Alert>
		</>
	)
}

function SnackbarView({ autoHideDuration, log }: { autoHideDuration: number | undefined; log: Log }) {
	const [open, setOpen] = useState(false)
	return (
		<>
			<button onClick={() => setOpen(true)}>Show</button>
			<Snackbar open={open} autoHideDuration={autoHideDuration} message="Saved" action={<Button size="small" onClick={() => log("click:undo")}>Undo</Button>} onClose={(_e, reason) => { log(`close:${reason}`); setOpen(false) }} />
		</>
	)
}

function ProgressView({ value, open, log }: { value: number | undefined; open: boolean | undefined; log: Log }) {
	return (
		<>
			<CircularProgress aria-label="Loading" />
			<CircularProgress aria-label="Upload" value={value ?? 40} />
			<LinearProgress aria-label="Progress" variant="determinate" value={value ?? 40} />
			<LinearProgress aria-label="Buffering" variant="buffer" value={30} valueBuffer={60} />
			<LinearProgress aria-label="Working" />
			<Skeleton />
			<Skeleton variant="circular" width={40} />
			<Skeleton variant="rectangular" width={200} height={60} animation={false} />
			<Backdrop open={open ?? true} onClick={() => log("click:backdrop")} />
		</>
	)
}

function DrawerView({ variant, anchor, log }: { variant: "temporary" | "persistent" | "permanent" | undefined; anchor: "start" | "end" | "top" | "bottom" | undefined; log: Log }) {
	const [open, setOpen] = useState(false)
	return (
		<>
			<button onClick={() => setOpen(true)}>Open</button>
			<Drawer variant={variant} anchor={anchor} open={open} aria-label="Navigation" onClose={(_e, reason) => { log(`close:${reason}`); setOpen(false) }}>
				<List>
					<ListItem disablePadding><ListItemButton>Home</ListItemButton></ListItem>
					<ListItem disablePadding><ListItemButton>Settings</ListItemButton></ListItem>
				</List>
			</Drawer>
		</>
	)
}

function PopoverView({ log }: { log: Log }) {
	const [anchor, setAnchor] = useState<HTMLElement | null>(null)
	return (
		<>
			<button id="popover-button" onClick={(e) => setAnchor(e.currentTarget)}>Filters</button>
			<Popover open={anchor !== null} anchorEl={anchor} aria-label="Filter options" onClose={(_e, reason) => { log(`close:${reason}`); setAnchor(null) }}>
				<p>Filter options</p>
				<button onClick={() => log("click:apply")}>Apply</button>
			</Popover>
		</>
	)
}

function BreadcrumbsView({ maxItems }: { maxItems: number | undefined }) {
	return (
		<>
			<Breadcrumbs maxItems={maxItems}>
				<Link href="/">Home</Link>
				<Link href="/library">Library</Link>
				<Link href="/data">Data</Link>
				<Link href="/reports">Reports</Link>
				<Link href="/2026">2026</Link>
				<span>Current</span>
			</Breadcrumbs>
			<Link href="/docs" underline="hover" color="secondary">Docs</Link>
		</>
	)
}

function PaginationView({ count, disabled, log }: { count: number | undefined; disabled: boolean | undefined; log: Log }) {
	const [page, setPage] = useState(1)
	return (
		<>
			<Pagination aria-label="Results" count={count ?? 10} page={page} disabled={disabled} showFirstButton showLastButton onChange={(_e, p) => { log(`change:${p}`); setPage(p) }} />
			<Pagination aria-label="Uncontrolled" count={5} defaultPage={3} variant="outlined" size="small" onChange={(_e, p) => log(`uncontrolled:${p}`)} />
		</>
	)
}

function StepperView({ activeStep, log }: { activeStep: number | undefined; log: Log }) {
	return (
		<>
			<Stepper aria-label="Checkout" activeStep={activeStep ?? 1}>
				<Step label="Cart" onClick={() => log("click:cart")} />
				<Step label="Address" optional="Optional" />
				<Step label="Payment" />
				<Step label="Done" />
			</Stepper>
			<Stepper aria-label="Build steps" orientation="vertical" activeStep={0}>
				<Step label="Plan">Plan details</Step>
				<Step label="Build">Build details</Step>
			</Stepper>
		</>
	)
}

function BottomNavigationView({ showLabels, log }: { showLabels: boolean | undefined; log: Log }) {
	const [value, setValue] = useState<string | number>("recents")
	return (
		<BottomNavigation aria-label="Main" showLabels={showLabels} value={value} onChange={(_e, v) => { log(`change:${v}`); setValue(v) }}>
			<BottomNavigationAction value="recents" label="Recents" icon={<Svg />} />
			<BottomNavigationAction value="favorites" label="Favorites" icon={<Svg />} />
			<BottomNavigationAction value="nearby" label="Nearby" icon={<Svg />} disabled />
		</BottomNavigation>
	)
}

function SpeedDialView({ log }: { log: Log }) {
	return (
		<SpeedDial ariaLabel="Actions">
			<SpeedDialAction tooltipTitle="Copy" icon={<Svg />} onClick={() => log("click:copy")} />
			<SpeedDialAction tooltipTitle="Save" icon={<Svg />} onClick={() => log("click:save")} />
			<SpeedDialAction tooltipTitle="Print" icon={<Svg />} onClick={() => log("click:print")} />
		</SpeedDial>
	)
}

function SortableTableView({ log }: { log: Log }) {
	const [by, setBy] = useState<"name" | "calories">("name")
	const [dir, setDir] = useState<"asc" | "desc">("asc")
	const [page, setPage] = useState(0)
	const [rows, setRows] = useState(10)
	const sortBy = (column: "name" | "calories") => {
		log(`sort:${column}`)
		if (by === column) setDir(dir === "asc" ? "desc" : "asc")
		else { setBy(column); setDir("asc") }
	}
	return (
		<Table aria-label="Desserts">
			<TableHead>
				<TableRow>
					<TableCell sortDirection={by === "name" ? dir : false}><TableSortLabel active={by === "name"} direction={by === "name" ? dir : "asc"} onClick={() => sortBy("name")}>Name</TableSortLabel></TableCell>
					<TableCell sortDirection={by === "calories" ? dir : false}><TableSortLabel active={by === "calories"} direction={by === "calories" ? dir : "asc"} onClick={() => sortBy("calories")}>Calories</TableSortLabel></TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				<TableRow><TableCell>Cupcake</TableCell><TableCell>305</TableCell></TableRow>
				<TableRow><TableCell>Donut</TableCell><TableCell>452</TableCell></TableRow>
			</TableBody>
			<TableFooter>
				<TableRow>
					<TablePagination count={23} page={page} rowsPerPage={rows} rowsPerPageOptions={[5, 10, 25]} colSpan={2}
						onPageChange={(_e, p) => { log(`page:${p}`); setPage(p) }}
						onRowsPerPageChange={(n) => { log(`rows:${n}`); setRows(n); setPage(0) }} />
				</TableRow>
			</TableFooter>
		</Table>
	)
}

function CardsAndListsView({ log }: { log: Log }) {
	return (
		<>
			<Card><CardActionArea onClick={() => log("click:area")}><CardContent>Action card</CardContent></CardActionArea></Card>
			<Card><CardActionArea href="/card"><CardContent>Link card</CardContent></CardActionArea></Card>
			<AvatarGroup max={3}><Avatar>A</Avatar><Avatar>B</Avatar><Avatar>C</Avatar><Avatar>D</Avatar><Avatar>E</Avatar></AvatarGroup>
			<AvatarGroup max={3} total={6}><Avatar>A</Avatar><Avatar>B</Avatar></AvatarGroup>
			<List>
				<ListItem alignItems="flex-start"><ListItemAvatar><Avatar>R</Avatar></ListItemAvatar><ListItemText primary="Brunch" secondary="Ali Connors" /></ListItem>
				<ListItem disablePadding><ListItemButton alignItems="flex-start"><ListItemAvatar><Avatar>S</Avatar></ListItemAvatar><ListItemText primary="Summer BBQ" /></ListItemButton></ListItem>
			</List>
		</>
	)
}

function AccordionGroupView({ multiple, log }: { multiple: boolean | undefined; log: Log }) {
	return (
		<AccordionGroup multiple={multiple} defaultValue={multiple ? ["a"] : "a"} onChange={(_e, v) => log(`change:${Array.isArray(v) ? v.join(",") : (v ?? "")}`)}>
			<Accordion value="a"><AccordionSummary>Alpha</AccordionSummary><AccordionDetails>Alpha body</AccordionDetails></Accordion>
			<Accordion value="b"><AccordionSummary>Beta</AccordionSummary><AccordionDetails>Beta body</AccordionDetails></Accordion>
			<Accordion value="c"><AccordionSummary>Gamma</AccordionSummary><AccordionDetails>Gamma body</AccordionDetails></Accordion>
		</AccordionGroup>
	)
}

const harness: UiHarness = {
	button: (props, log) =>
		mountWith(props, (p) => (
			<Button variant={p.variant as never} color={p.color as never} loading={p.loading} disabled={p.disabled} href={p.href} onClick={() => log("click")}>
				Save
			</Button>
		)),
	textField: (props, log) =>
		mountWith(props, (p) => (
			<TextField label="Email" helperText="We never share it" error={p.error} disabled={p.disabled} onChange={(e) => log(`change:${e.target.value}`)} />
		)),
	dialog: (_props, log) => mountWith({}, () => <DialogView log={log} />),
	menu: (_props, log) => mountWith({}, () => <MenuView log={log} />),
	checkbox: (props, log) => mountWith(props, (p) => <CheckboxView indeterminate={p.indeterminate} disabled={p.disabled} error={p.error} log={log} />),
	switch: (props, log) => mountWith(props, (p) => <SwitchView disabled={p.disabled} error={p.error} log={log} />),
	radioGroup: (props, log) => mountWith(props, (p) => <RadioGroupView disabled={p.disabled} error={p.error} log={log} />),
	select: (props, log) => mountWith(props, (p) => <SelectView error={p.error} disabled={p.disabled} multiple={props.multiple} log={log} />),
	selectGroups: (_props, log) => mountWith({}, () => <SelectGroupsView log={log} />),
	iconButtons: (props, log) => mountWith(props, (p) => <IconButtonsView disabled={p.disabled} log={log} />),
	buttonGroup: (props, log) => mountWith(props, (p) => <ButtonGroupView disabled={p.disabled} log={log} />),
	toggleGroup: (props, log) => mountWith(props, (p) => <ToggleGroupView exclusive={p.exclusive} log={log} />),
	slider: (props, log) => mountWith(props, (p) => <SliderView disabled={p.disabled} log={log} />),
	rangeSlider: (props, log) => mountWith(props, (p) => <RangeSliderView vertical={props.vertical} disabled={p.disabled} log={log} />),
	rating: (props, log) => mountWith(props, (p) => <RatingView readOnly={p.readOnly} disabled={p.disabled} log={log} />),
	surfaces: (props, log) => mountWith(props, (p) => <SurfacesView raised={p.raised} log={log} />),
	badges: (props) => mountWith(props, (p) => <BadgesView count={p.count} />),
	list: (props, log) => mountWith(props, (p) => <ListView dense={p.dense} log={log} />),
	table: (props) => mountWith(props, (p) => <TableView size={p.size} />),
	chips: (props, log) => mountWith(props, (p) => <ChipsView disabled={p.disabled} log={log} />),
	accordions: (props, log) => mountWith(props, (p) => <AccordionsView disabled={p.disabled} log={log} />),
	tooltip: (props, log) => mountWith(props, (p) => <TooltipView title={p.title} arrow={p.arrow} log={log} />),
	alerts: (_props, log) => mountWith({}, () => <AlertsView log={log} />),
	snackbar: (props, log) => mountWith(props, (p) => <SnackbarView autoHideDuration={p.autoHideDuration} log={log} />),
	progress: (props, log) => mountWith(props, (p) => <ProgressView value={p.value} open={p.open} log={log} />),
	drawer: (props, log) => mountWith(props, (p) => <DrawerView variant={p.variant} anchor={p.anchor} log={log} />),
	popover: (_props, log) => mountWith({}, () => <PopoverView log={log} />),
	breadcrumbs: (props) => mountWith(props, (p) => <BreadcrumbsView maxItems={p.maxItems} />),
	pagination: (props, log) => mountWith(props, (p) => <PaginationView count={p.count} disabled={p.disabled} log={log} />),
	stepper: (props, log) => mountWith(props, (p) => <StepperView activeStep={p.activeStep} log={log} />),
	bottomNavigation: (props, log) => mountWith(props, (p) => <BottomNavigationView showLabels={p.showLabels} log={log} />),
	speedDial: (_props, log) => mountWith({}, () => <SpeedDialView log={log} />),
	sortableTable: (_props, log) => mountWith({}, () => <SortableTableView log={log} />),
	cardsAndLists: (_props, log) => mountWith({}, () => <CardsAndListsView log={log} />),
	accordionGroup: (props, log) => mountWith(props, (p) => <AccordionGroupView multiple={props.multiple} log={log} />),
	chipDeleteIcon: (_props, log) => mountWith({}, () => <Chip label="Custom delete" onDelete={() => log("delete:custom")} deleteIcon={<svg data-custom-delete="" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" /></svg>} />),
	richTooltip: (_props, log) => mountWith({}, () => (
		<Tooltip title={<><strong data-rich="">Rich</strong> content</>} enterDelay={0} leaveDelay={0} onOpen={() => log("open")} onClose={() => log("close")}><button>Info</button></Tooltip>
	)),
	tabs: (props, log) => mountWith(props, (p) => <TabsView selectionFollowsFocus={p.selectionFollowsFocus} log={log} />),
	settle: async () => void (await act(async () => { await new Promise((r) => setTimeout(r, 0)) })),
}

defineUiConformanceSuite("react", harness)
