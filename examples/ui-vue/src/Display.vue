<script setup lang="ts">
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
} from "@omnifront/ui-vue"
import { ref } from "vue"

// Wave 2 ("display and surface"). The same page exists for React and Angular; ?view=display shows it.
const params = new URLSearchParams(location.search)
const menu = "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
const mail = "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
const star = "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
const more = "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
const trash = "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
const cover = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140"><defs><linearGradient id="g"><stop offset="0" stop-color="#7C3AED"/><stop offset="1" stop-color="#06B6D4"/></linearGradient></defs><rect width="400" height="140" fill="url(#g)"/></svg>')
const portrait = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#F59E0B"/><circle cx="20" cy="16" r="8" fill="#fff"/></svg>')
const broken = "data:image/png;base64,AAAA"
const elevations = [0, 1, 3, 8, 16]
const open2 = ref(false)
const last = ref("none")
const tooltipOpen = params.get("open") === "tooltip" ? true : undefined
const accordionOpen = params.get("open") === "accordion"
const row = "display: flex; gap: 12px; flex-wrap: wrap; align-items: center"
const box = "width: 88px; height: 72px; display: grid; place-items: center"
</script>

<template>
	<main style="max-width: 880px; margin: 0 auto; padding: 24px; display: grid; gap: 32px; color: var(--omni-palette-text-primary); font: var(--omni-typography-body1-font)">
		<Typography variant="h4" component="h1">omnifront UI: display</Typography>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">AppBar and Toolbar</h2>
			<AppBar position="static">
				<Toolbar>
					<IconButton color="inherit" edge="start" aria-label="Menu"><SvgIcon><path :d="menu" /></SvgIcon></IconButton>
					<Typography variant="h6" component="p" style="flex-grow: 1">Dashboard</Typography>
					<Button color="inherit">Login</Button>
				</Toolbar>
			</AppBar>
			<AppBar position="static" color="default" :elevation="1">
				<Toolbar variant="dense">
					<Typography variant="subtitle1" component="p" style="flex-grow: 1">Dense, default colour</Typography>
					<Divider orientation="vertical" flex-item />
					<Button size="small" color="inherit">Help</Button>
				</Toolbar>
			</AppBar>
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Typography</h2>
			<div>
				<Typography variant="h4" component="p" gutter-bottom>Heading four</Typography>
				<Typography variant="h6" component="p">Heading six</Typography>
				<Typography variant="subtitle1" component="p">Subtitle one</Typography>
				<Typography variant="subtitle2" component="p">Subtitle two</Typography>
				<Typography variant="body1">Body one: the quick brown fox jumps over the lazy dog.</Typography>
				<Typography variant="body2">Body two: the quick brown fox jumps over the lazy dog.</Typography>
				<Typography variant="caption">Caption text</Typography>
				<Typography variant="overline">Overline text</Typography>
				<Typography variant="button" component="p">Button text</Typography>
			</div>
			<div :style="row">
				<Typography color="primary">Primary</Typography>
				<Typography color="secondary">Secondary</Typography>
				<Typography color="error">Error</Typography>
				<Typography color="text.secondary">Text secondary</Typography>
				<Typography align="center" style="width: 160px; border: 1px dashed var(--omni-palette-divider)">Centered</Typography>
				<Typography no-wrap style="width: 120px">This long text is cut with an ellipsis</Typography>
			</div>
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Paper</h2>
			<div :style="row">
				<Paper v-for="e in elevations" :key="e" :elevation="e" :style="box">{{ e }}</Paper>
				<Paper variant="outlined" :style="box">outlined</Paper>
				<Paper square :style="box">square</Paper>
			</div>
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Card</h2>
			<div :style="row">
				<Card style="width: 300px">
					<CardMedia :image="cover" alt="" :height="110" />
					<CardHeader title="Recipe review" subheader="September 14">
						<template #avatar><Avatar>R</Avatar></template>
						<template #action><IconButton aria-label="More"><SvgIcon><path :d="more" /></SvgIcon></IconButton></template>
					</CardHeader>
					<CardContent>
						<Typography variant="body2" color="text.secondary">A card gathers media, a header, text and actions about one subject.</Typography>
					</CardContent>
					<CardActions>
						<Button size="small">Share</Button>
						<Button size="small">Learn more</Button>
					</CardActions>
				</Card>
				<Card variant="outlined" style="width: 240px">
					<CardContent>
						<Typography variant="overline">Outlined</Typography>
						<Typography variant="h6" component="p">No shadow</Typography>
						<Typography variant="body2">Borders instead of elevation.</Typography>
					</CardContent>
				</Card>
				<Card raised style="width: 200px">
					<CardContent><Typography variant="body2">Raised card</Typography></CardContent>
				</Card>
			</div>
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Divider</h2>
			<div>
				<Typography>Above</Typography>
				<Divider />
				<Typography>Between</Typography>
				<Divider variant="middle" />
				<Typography>Middle, then text</Typography>
				<Divider>OR</Divider>
				<Divider text-align="left">Left</Divider>
				<Typography>Below</Typography>
			</div>
			<div :style="row + '; height: 32px'">
				<span>One</span><Divider orientation="vertical" flex-item /><span>Two</span><Divider orientation="vertical" flex-item /><span>Three</span>
			</div>
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Avatar, Badge and SvgIcon</h2>
			<div :style="row">
				<Avatar>AB</Avatar>
				<Avatar variant="rounded">R</Avatar>
				<Avatar variant="square">S</Avatar>
				<Avatar :src="portrait" alt="Portrait" />
				<Avatar :src="broken" alt="Broken picture" />
				<Avatar />
				<Avatar style="width: 56px; height: 56px">XL</Avatar>
			</div>
			<div :style="row + '; gap: 28px'">
				<Badge :badge-content="4" color="primary"><SvgIcon><path :d="mail" /></SvgIcon></Badge>
				<Badge :badge-content="120" color="error"><SvgIcon><path :d="mail" /></SvgIcon></Badge>
				<Badge :badge-content="7" :max="5" color="secondary"><SvgIcon><path :d="mail" /></SvgIcon></Badge>
				<Badge variant="dot" color="error"><SvgIcon><path :d="mail" /></SvgIcon></Badge>
				<Badge :badge-content="3" :anchor-origin="{ vertical: 'bottom', horizontal: 'left' }"><SvgIcon><path :d="mail" /></SvgIcon></Badge>
				<Badge :badge-content="0"><SvgIcon><path :d="mail" /></SvgIcon></Badge>
				<Badge :badge-content="0" show-zero color="success"><SvgIcon><path :d="mail" /></SvgIcon></Badge>
				<Badge :badge-content="2" color="primary" overlap="circular"><Avatar>OK</Avatar></Badge>
			</div>
			<div :style="row">
				<SvgIcon font-size="small"><path :d="star" /></SvgIcon>
				<SvgIcon><path :d="star" /></SvgIcon>
				<SvgIcon font-size="large"><path :d="star" /></SvgIcon>
				<SvgIcon color="primary"><path :d="star" /></SvgIcon>
				<SvgIcon color="secondary"><path :d="star" /></SvgIcon>
				<SvgIcon color="error"><path :d="star" /></SvgIcon>
				<SvgIcon color="action"><path :d="star" /></SvgIcon>
				<SvgIcon color="disabled"><path :d="star" /></SvgIcon>
			</div>
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Chip</h2>
			<div :style="row">
				<Chip label="Default" />
				<Chip label="Primary" color="primary" />
				<Chip label="Secondary" color="secondary" />
				<Chip label="Success" color="success" />
				<Chip label="Error" color="error" />
				<Chip label="Outlined" variant="outlined" />
				<Chip label="Outlined primary" variant="outlined" color="primary" />
			</div>
			<div :style="row">
				<Chip label="Clickable" @click="last = 'clicked'" />
				<Chip label="Deletable" color="primary" @delete="last = 'deleted'" />
				<Chip label="Both" variant="outlined" @click="() => {}" @delete="() => {}" />
				<Chip label="Avatar" @delete="() => {}"><template #avatar><Avatar>A</Avatar></template></Chip>
				<Chip label="Icon" variant="outlined"><template #icon><SvgIcon font-size="inherit"><path :d="star" /></SvgIcon></template></Chip>
				<Chip label="Small" size="small" @delete="() => {}" />
				<Chip label="Disabled" disabled @delete="() => {}" />
			</div>
			<Typography variant="caption" role="status">Last chip action: {{ last }}</Typography>
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">List</h2>
			<div :style="row">
				<Paper style="width: 300px">
					<nav aria-label="Mailboxes">
						<List>
							<ListSubheader>Folders</ListSubheader>
							<ListItem disable-padding>
								<ListItemButton selected>
									<ListItemIcon><SvgIcon><path :d="mail" /></SvgIcon></ListItemIcon>
									<ListItemText primary="Inbox" secondary="3 new" />
								</ListItemButton>
							</ListItem>
							<ListItem disable-padding>
								<ListItemButton>
									<ListItemIcon><SvgIcon><path :d="star" /></SvgIcon></ListItemIcon>
									<ListItemText primary="Starred" />
								</ListItemButton>
							</ListItem>
							<ListItem disable-padding>
								<ListItemButton disabled>
									<ListItemIcon><SvgIcon><path :d="trash" /></SvgIcon></ListItemIcon>
									<ListItemText primary="Trash (disabled)" />
								</ListItemButton>
							</ListItem>
							<Divider component="li" />
							<ListItem>
								<ListItemText primary="Drafts" secondary="Two unsent" />
								<template #secondaryAction><IconButton aria-label="Delete drafts" edge="end"><SvgIcon><path :d="trash" /></SvgIcon></IconButton></template>
							</ListItem>
						</List>
					</nav>
				</Paper>
				<Paper style="width: 240px">
					<List dense aria-label="Dense list">
						<ListItem divider><ListItemText primary="One" /></ListItem>
						<ListItem divider><ListItemText primary="Two" /></ListItem>
						<ListItem><ListItemText primary="Three" /></ListItem>
					</List>
				</Paper>
			</div>
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Table</h2>
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
			<Table size="small" aria-label="Small table" style="width: 360px">
				<TableHead><TableRow><TableCell>Small</TableCell><TableCell align="right">Value</TableCell></TableRow></TableHead>
				<TableBody><TableRow><TableCell>Row</TableCell><TableCell align="right">1</TableCell></TableRow></TableBody>
			</Table>
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Tooltip</h2>
			<div :style="row + '; padding: 48px 0'">
				<Tooltip title="Saves your work" placement="top" :open="tooltipOpen">
					<Button variant="contained">Save</Button>
				</Tooltip>
				<Tooltip title="Delete this item" placement="right">
					<IconButton aria-label="Delete"><SvgIcon><path :d="trash" /></SvgIcon></IconButton>
				</Tooltip>
				<Tooltip title="More options below" placement="bottom">
					<Button variant="outlined">Hover or focus me</Button>
				</Tooltip>
			</div>
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Accordion</h2>
			<div>
				<Accordion :default-expanded="accordionOpen">
					<AccordionSummary>What is an accordion?</AccordionSummary>
					<AccordionDetails>A stack of sections you open one by one, each with a button that says whether it is open.</AccordionDetails>
				</Accordion>
				<Accordion v-model:expanded="open2">
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
</template>
