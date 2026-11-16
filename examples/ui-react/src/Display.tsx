import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	AppBar,
	Avatar,
	Badge,
	Button,
	Card,
	CardActions,
	CardContent,
	CardHeader,
	CardMedia,
	Chip,
	Divider,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	ListSubheader,
	Paper,
	SvgIcon,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableFooter,
	TableHead,
	TableRow,
	Toolbar,
	Tooltip,
	Typography,
} from "@omnifront/ui-react"
import { useState } from "react"

// Wave 2 ("display and surface"). The same page exists for Vue and Angular; ?view=display shows it.
const params = new URLSearchParams(location.search)
const menu = "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
const mail = "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
const star = "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
const more = "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
const trash = "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
const cover = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140"><defs><linearGradient id="g"><stop offset="0" stop-color="#7C3AED"/><stop offset="1" stop-color="#06B6D4"/></linearGradient></defs><rect width="400" height="140" fill="url(#g)"/></svg>')
const portrait = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#F59E0B"/><circle cx="20" cy="16" r="8" fill="#fff"/></svg>')
const broken = "data:image/png;base64,AAAA"
const row = { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" } as const
const section = { display: "grid", gap: 16 } as const
const h2 = { font: "var(--omni-typography-h6-font)", margin: 0 } as const
const icon = (d: string, props: object = {}) => (
	<SvgIcon {...props}>
		<path d={d} />
	</SvgIcon>
)

export function Display() {
	const [open2, setOpen2] = useState(false)
	const [last, setLast] = useState("none")
	return (
		<main style={{ maxWidth: 880, margin: "0 auto", padding: 24, display: "grid", gap: 32, color: "var(--omni-palette-text-primary)", font: "var(--omni-typography-body1-font)" }}>
			<Typography variant="h4" component="h1">omnifront UI: display</Typography>

			<section style={section}>
				<h2 style={h2}>AppBar and Toolbar</h2>
				<AppBar position="static">
					<Toolbar>
						<IconButton color="inherit" edge="start" aria-label="Menu">{icon(menu)}</IconButton>
						<Typography variant="h6" component="p" style={{ flexGrow: 1 }}>Dashboard</Typography>
						<Button color="inherit">Login</Button>
					</Toolbar>
				</AppBar>
				<AppBar position="static" color="default" elevation={1}>
					<Toolbar variant="dense">
						<Typography variant="subtitle1" component="p" style={{ flexGrow: 1 }}>Dense, default colour</Typography>
						<Divider orientation="vertical" flexItem />
						<Button size="small" color="inherit">Help</Button>
					</Toolbar>
				</AppBar>
			</section>

			<section style={section}>
				<h2 style={h2}>Typography</h2>
				<div>
					<Typography variant="h4" component="p" gutterBottom>Heading four</Typography>
					<Typography variant="h6" component="p">Heading six</Typography>
					<Typography variant="subtitle1" component="p">Subtitle one</Typography>
					<Typography variant="subtitle2" component="p">Subtitle two</Typography>
					<Typography variant="body1">Body one: the quick brown fox jumps over the lazy dog.</Typography>
					<Typography variant="body2">Body two: the quick brown fox jumps over the lazy dog.</Typography>
					<Typography variant="caption">Caption text</Typography>
					<Typography variant="overline">Overline text</Typography>
					<Typography variant="button" component="p">Button text</Typography>
				</div>
				<div style={row}>
					<Typography color="primary">Primary</Typography>
					<Typography color="secondary">Secondary</Typography>
					<Typography color="error">Error</Typography>
					<Typography color="text.secondary">Text secondary</Typography>
					<Typography align="center" style={{ width: 160, border: "1px dashed var(--omni-palette-divider)" }}>Centered</Typography>
					<Typography noWrap style={{ width: 120 }}>This long text is cut with an ellipsis</Typography>
				</div>
			</section>

			<section style={section}>
				<h2 style={h2}>Paper</h2>
				<div style={row}>
					{[0, 1, 3, 8, 16].map((e) => (
						<Paper key={e} elevation={e} style={{ width: 88, height: 72, display: "grid", placeItems: "center" }}>{e}</Paper>
					))}
					<Paper variant="outlined" style={{ width: 88, height: 72, display: "grid", placeItems: "center" }}>outlined</Paper>
					<Paper square style={{ width: 88, height: 72, display: "grid", placeItems: "center" }}>square</Paper>
				</div>
			</section>

			<section style={section}>
				<h2 style={h2}>Card</h2>
				<div style={row}>
					<Card style={{ width: 300 }}>
						<CardMedia image={cover} alt="" height={110} />
						<CardHeader
							avatar={<Avatar>R</Avatar>}
							title="Recipe review"
							subheader="September 14"
							action={<IconButton aria-label="More">{icon(more)}</IconButton>}
						/>
						<CardContent>
							<Typography variant="body2" color="text.secondary">A card gathers media, a header, text and actions about one subject.</Typography>
						</CardContent>
						<CardActions>
							<Button size="small">Share</Button>
							<Button size="small">Learn more</Button>
						</CardActions>
					</Card>
					<Card variant="outlined" style={{ width: 240 }}>
						<CardContent>
							<Typography variant="overline">Outlined</Typography>
							<Typography variant="h6" component="p">No shadow</Typography>
							<Typography variant="body2">Borders instead of elevation.</Typography>
						</CardContent>
					</Card>
					<Card raised style={{ width: 200 }}>
						<CardContent><Typography variant="body2">Raised card</Typography></CardContent>
					</Card>
				</div>
			</section>

			<section style={section}>
				<h2 style={h2}>Divider</h2>
				<div>
					<Typography>Above</Typography>
					<Divider />
					<Typography>Between</Typography>
					<Divider variant="middle" />
					<Typography>Middle, then text</Typography>
					<Divider>OR</Divider>
					<Divider textAlign="left">Left</Divider>
					<Typography>Below</Typography>
				</div>
				<div style={{ ...row, height: 32 }}>
					<span>One</span><Divider orientation="vertical" flexItem /><span>Two</span><Divider orientation="vertical" flexItem /><span>Three</span>
				</div>
			</section>

			<section style={section}>
				<h2 style={h2}>Avatar, Badge and SvgIcon</h2>
				<div style={row}>
					<Avatar>AB</Avatar>
					<Avatar variant="rounded">R</Avatar>
					<Avatar variant="square">S</Avatar>
					<Avatar src={portrait} alt="Portrait" />
					<Avatar src={broken} alt="Broken picture" />
					<Avatar />
					<Avatar style={{ width: 56, height: 56 }}>XL</Avatar>
				</div>
				<div style={{ ...row, gap: 28 }}>
					<Badge badgeContent={4} color="primary">{icon(mail)}</Badge>
					<Badge badgeContent={120} color="error">{icon(mail)}</Badge>
					<Badge badgeContent={7} max={5} color="secondary">{icon(mail)}</Badge>
					<Badge variant="dot" color="error">{icon(mail)}</Badge>
					<Badge badgeContent={3} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>{icon(mail)}</Badge>
					<Badge badgeContent={0}>{icon(mail)}</Badge>
					<Badge badgeContent={0} showZero color="success">{icon(mail)}</Badge>
					<Badge badgeContent={2} color="primary" overlap="circular"><Avatar>OK</Avatar></Badge>
				</div>
				<div style={row}>
					{icon(star, { fontSize: "small" })}
					{icon(star)}
					{icon(star, { fontSize: "large" })}
					{icon(star, { color: "primary" })}
					{icon(star, { color: "secondary" })}
					{icon(star, { color: "error" })}
					{icon(star, { color: "action" })}
					{icon(star, { color: "disabled" })}
				</div>
			</section>

			<section style={section}>
				<h2 style={h2}>Chip</h2>
				<div style={row}>
					<Chip label="Default" />
					<Chip label="Primary" color="primary" />
					<Chip label="Secondary" color="secondary" />
					<Chip label="Success" color="success" />
					<Chip label="Error" color="error" />
					<Chip label="Outlined" variant="outlined" />
					<Chip label="Outlined primary" variant="outlined" color="primary" />
				</div>
				<div style={row}>
					<Chip label="Clickable" onClick={() => setLast("clicked")} />
					<Chip label="Deletable" color="primary" onDelete={() => setLast("deleted")} />
					<Chip label="Both" variant="outlined" onClick={() => {}} onDelete={() => {}} />
					<Chip label="Avatar" avatar={<Avatar>A</Avatar>} onDelete={() => {}} />
					<Chip label="Icon" icon={icon(star, { fontSize: "inherit" })} variant="outlined" />
					<Chip label="Small" size="small" onDelete={() => {}} />
					<Chip label="Disabled" disabled onDelete={() => {}} />
				</div>
				<Typography variant="caption" role="status">Last chip action: {last}</Typography>
			</section>

			<section style={section}>
				<h2 style={h2}>List</h2>
				<div style={row}>
					<Paper style={{ width: 300 }}>
						<nav aria-label="Mailboxes">
							<List>
								<ListSubheader>Folders</ListSubheader>
								<ListItem disablePadding>
									<ListItemButton selected>
										<ListItemIcon>{icon(mail)}</ListItemIcon>
										<ListItemText primary="Inbox" secondary="3 new" />
									</ListItemButton>
								</ListItem>
								<ListItem disablePadding>
									<ListItemButton>
										<ListItemIcon>{icon(star)}</ListItemIcon>
										<ListItemText primary="Starred" />
									</ListItemButton>
								</ListItem>
								<ListItem disablePadding>
									<ListItemButton disabled>
										<ListItemIcon>{icon(trash)}</ListItemIcon>
										<ListItemText primary="Trash (disabled)" />
									</ListItemButton>
								</ListItem>
								<Divider component="li" />
								<ListItem secondaryAction={<IconButton aria-label="Delete drafts" edge="end">{icon(trash)}</IconButton>}>
									<ListItemText primary="Drafts" secondary="Two unsent" />
								</ListItem>
							</List>
						</nav>
					</Paper>
					<Paper style={{ width: 240 }}>
						<List dense aria-label="Dense list">
							<ListItem divider><ListItemText primary="One" /></ListItem>
							<ListItem divider><ListItemText primary="Two" /></ListItem>
							<ListItem><ListItemText primary="Three" /></ListItem>
						</List>
					</Paper>
				</div>
			</section>

			<section style={section}>
				<h2 style={h2}>Table</h2>
				<Paper>
					<TableContainer>
						<Table aria-label="Desserts">
							<TableHead>
								<TableRow>
									<TableCell>Dessert</TableCell>
									<TableCell align="right">Calories</TableCell>
									<TableCell align="right">Fat (g)</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								<TableRow hover selected><TableCell component="th" scope="row">Frozen yoghurt</TableCell><TableCell align="right">159</TableCell><TableCell align="right">6.0</TableCell></TableRow>
								<TableRow hover><TableCell component="th" scope="row">Ice cream sandwich</TableCell><TableCell align="right">237</TableCell><TableCell align="right">9.0</TableCell></TableRow>
								<TableRow hover><TableCell component="th" scope="row">Eclair</TableCell><TableCell align="right">262</TableCell><TableCell align="right">16.0</TableCell></TableRow>
							</TableBody>
							<TableFooter>
								<TableRow><TableCell>Total</TableCell><TableCell align="right">658</TableCell><TableCell align="right">31.0</TableCell></TableRow>
							</TableFooter>
						</Table>
					</TableContainer>
				</Paper>
				<Table size="small" aria-label="Small table" style={{ width: 360 }}>
					<TableHead><TableRow><TableCell>Small</TableCell><TableCell align="right">Value</TableCell></TableRow></TableHead>
					<TableBody><TableRow><TableCell>Row</TableCell><TableCell align="right">1</TableCell></TableRow></TableBody>
				</Table>
			</section>

			<section style={section}>
				<h2 style={h2}>Tooltip</h2>
				<div style={{ ...row, padding: "48px 0" }}>
					<Tooltip title="Saves your work" placement="top" open={params.get("open") === "tooltip" ? true : undefined}>
						<Button variant="contained">Save</Button>
					</Tooltip>
					<Tooltip title="Delete this item" placement="right">
						<IconButton aria-label="Delete">{icon(trash)}</IconButton>
					</Tooltip>
					<Tooltip title="More options below" placement="bottom">
						<Button variant="outlined">Hover or focus me</Button>
					</Tooltip>
				</div>
			</section>

			<section style={section}>
				<h2 style={h2}>Accordion</h2>
				<div>
					<Accordion defaultExpanded={params.get("open") === "accordion"}>
						<AccordionSummary>What is an accordion?</AccordionSummary>
						<AccordionDetails>A stack of sections you open one by one, each with a button that says whether it is open.</AccordionDetails>
					</Accordion>
					<Accordion expanded={open2} onChange={(_e, v) => setOpen2(v)}>
						<AccordionSummary>Controlled by the page</AccordionSummary>
						<AccordionDetails>The page owns this state.</AccordionDetails>
					</Accordion>
					<Accordion disabled>
						<AccordionSummary>Disabled</AccordionSummary>
						<AccordionDetails>Never shown.</AccordionDetails>
					</Accordion>
				</div>
			</section>
		</main>
	)
}
