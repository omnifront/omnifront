<script setup lang="ts">
import {
	Accordion,
	AccordionDetails,
	AccordionGroup,
	AccordionSummary,
	Alert,
	AlertTitle,
	Avatar,
	AvatarGroup,
	Backdrop,
	BottomNavigation,
	BottomNavigationAction,
	Breadcrumbs,
	Button,
	Card,
	CardActionArea,
	CardContent,
	Chip,
	CircularProgress,
	Drawer,
	LinearProgress,
	Link,
	List,
	ListItem,
	ListItemAvatar,
	ListItemButton,
	ListItemText,
	Pagination,
	Popover,
	Skeleton,
	Snackbar,
	SpeedDial,
	SpeedDialAction,
	Step,
	Stepper,
	SvgIcon,
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TablePagination,
	TableRow,
	TableSortLabel,
	Tooltip,
	Typography,
} from "@omnifront/ui-vue"
import { onMounted, ref } from "vue"

// Wave 3 ("feedback and navigation") and the wave 2 leftovers. The same page exists for React and Angular; ?view=feedback shows it.
const start = new URLSearchParams(location.search).get("open")
const path = {
	star: "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
	pin: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z",
	copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
	save: "M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z",
	print: "M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z",
	bolt: "M7 2v11h3v9l7-12h-4l4-8z",
}
const row = "display: flex; gap: 12px; flex-wrap: wrap; align-items: center"
const col = "display: grid; gap: 12px"
const frame = "position: relative; border: 1px solid var(--omni-palette-divider); border-radius: 8px; overflow: hidden"
const snack = ref(start === "snackbar")
const drawer = ref(start === "drawer")
const anchor = ref<HTMLElement | null>(null)
const page = ref(4)
const tab = ref<string | number>("recents")
const by = ref<"name" | "calories">("name")
const dir = ref<"asc" | "desc">("asc")
const tp = ref(0)
const rows = ref(5)
const chips = ref(["React", "Vue", "Angular"])
onMounted(() => {
	if (start === "popover") anchor.value = document.getElementById("popover-button")
})
function sortBy(column: "name" | "calories"): void {
	if (by.value === column) dir.value = dir.value === "asc" ? "desc" : "asc"
	else {
		by.value = column
		dir.value = "asc"
	}
}
</script>

<template>
	<main style="max-width: 880px; margin: 0 auto; padding: 24px; display: grid; gap: 32px; color: var(--omni-palette-text-primary); font: var(--omni-typography-body1-font)">
		<Typography variant="h4" component="h1">omnifront UI: feedback and navigation</Typography>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Alert</h2>
			<div :style="col">
				<Alert severity="error"><AlertTitle>Upload failed</AlertTitle>The file is too big.</Alert>
				<Alert severity="warning" @close="() => {}">Your session ends soon.</Alert>
				<Alert severity="info" variant="outlined">A new version is available.</Alert>
				<Alert variant="filled">Saved.<template #action><Button color="inherit" size="small">Undo</Button></template></Alert>
				<Alert severity="info" :icon="false">No icon.</Alert>
			</div>
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Progress and Skeleton</h2>
			<div :style="row">
				<CircularProgress aria-label="Loading" />
				<CircularProgress aria-label="Quarter" :value="25" />
				<CircularProgress aria-label="Three quarters" :value="75" color="secondary" :size="56" />
				<CircularProgress aria-label="Large" :value="60" color="success" :size="72" :thickness="5" />
			</div>
			<div :style="col">
				<LinearProgress aria-label="Working" />
				<LinearProgress aria-label="Done" variant="determinate" :value="60" />
				<LinearProgress aria-label="Buffering" variant="buffer" :value="35" :value-buffer="65" color="secondary" />
			</div>
			<div aria-busy="true" style="display: flex; gap: 16px; align-items: center">
				<Skeleton variant="circular" :width="48" :height="48" :animation="false" />
				<div style="flex: 1">
					<Skeleton :animation="false" width="60%" />
					<Skeleton :animation="false" />
				</div>
				<Skeleton variant="rounded" :width="120" :height="48" :animation="false" />
			</div>
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Snackbar, Drawer and Popover</h2>
			<div :style="row">
				<Button variant="outlined" @click="snack = true">Show snackbar</Button>
				<Button variant="outlined" @click="drawer = true">Open drawer</Button>
				<Button id="popover-button" variant="outlined" @click="anchor = $event.currentTarget as HTMLElement">Open popover</Button>
			</div>
			<Snackbar :open="snack" message="Message sent" :anchor-origin="{ vertical: 'bottom', horizontal: 'left' }" @close="snack = false">
				<template #action><Button size="small" @click="snack = false">Undo</Button></template>
			</Snackbar>
			<Drawer :open="drawer" aria-label="Navigation" @close="drawer = false">
				<List>
					<ListItem disable-padding><ListItemButton @click="drawer = false"><ListItemText primary="Inbox" /></ListItemButton></ListItem>
					<ListItem disable-padding><ListItemButton @click="drawer = false"><ListItemText primary="Starred" /></ListItemButton></ListItem>
					<ListItem disable-padding><ListItemButton @click="drawer = false"><ListItemText primary="Sent" /></ListItemButton></ListItem>
				</List>
			</Drawer>
			<Popover :open="anchor !== null" :anchor-el="anchor" aria-label="Filters" @close="anchor = null">
				<div style="padding: 16px; display: grid; gap: 8px; max-width: 240px">
					<Typography variant="subtitle2" component="p">Filters</Typography>
					<Typography variant="body2" component="p">Show only unread messages.</Typography>
					<Button size="small" @click="anchor = null">Apply</Button>
				</div>
			</Popover>
			<div :style="frame + '; display: flex; height: 160px'">
				<Drawer variant="permanent" :width="160" aria-label="Sections">
					<List dense>
						<ListItem disable-padding><ListItemButton selected><ListItemText primary="Overview" /></ListItemButton></ListItem>
						<ListItem disable-padding><ListItemButton><ListItemText primary="Reports" /></ListItemButton></ListItem>
					</List>
				</Drawer>
				<div style="padding: 16px">A permanent drawer beside the content.</div>
			</div>
			<Backdrop :open="false" />
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Breadcrumbs, Link and Pagination</h2>
			<Breadcrumbs>
				<Link href="/">Home</Link>
				<Link href="/library">Library</Link>
				<Link href="/data">Data</Link>
				<span>Reports</span>
			</Breadcrumbs>
			<Breadcrumbs :max-items="3">
				<Link href="/">Home</Link>
				<Link href="/a">Library</Link>
				<Link href="/b">Data</Link>
				<Link href="/c">Reports</Link>
				<span>2026</span>
			</Breadcrumbs>
			<div :style="row">
				<Link href="/a">Always</Link>
				<Link href="/b" underline="hover" color="secondary">On hover</Link>
				<Link href="/c" underline="none" color="text.secondary">None</Link>
			</div>
			<Pagination :count="10" :page="page" show-first-button show-last-button @change="(_e: unknown, p: number) => (page = p)" />
			<Pagination :count="8" :default-page="2" variant="outlined" shape="rounded" color="primary" />
			<Pagination :count="5" size="small" color="secondary" :default-page="3" />
			<Pagination :count="5" disabled />
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Stepper, BottomNavigation and SpeedDial</h2>
			<Stepper aria-label="Checkout" :active-step="1">
				<Step label="Cart" />
				<Step label="Address" optional="Optional" />
				<Step label="Payment" />
				<Step label="Done" />
			</Stepper>
			<Stepper aria-label="Shipping" :active-step="2" alternative-label>
				<Step label="Packed" />
				<Step label="Sent" />
				<Step label="Delivery failed" error />
				<Step label="Delivered" />
			</Stepper>
			<Stepper aria-label="Build steps" orientation="vertical" :active-step="1">
				<Step label="Plan">Decide what to build.</Step>
				<Step label="Build">Write it in one place, ship it to three frameworks.</Step>
				<Step label="Ship">Release.</Step>
			</Stepper>
			<div :style="frame">
				<BottomNavigation aria-label="Main" :value="tab" @change="(_e: unknown, v: string | number) => (tab = v)">
					<BottomNavigationAction value="recents" label="Recents"><template #icon><SvgIcon><path :d="path.bolt" /></SvgIcon></template></BottomNavigationAction>
					<BottomNavigationAction value="favorites" label="Favorites"><template #icon><SvgIcon><path :d="path.star" /></SvgIcon></template></BottomNavigationAction>
					<BottomNavigationAction value="nearby" label="Nearby"><template #icon><SvgIcon><path :d="path.pin" /></SvgIcon></template></BottomNavigationAction>
				</BottomNavigation>
			</div>
			<div :style="frame + '; height: 260px; display: flex; justify-content: flex-end; align-items: flex-end; padding: 16px; overflow: visible'">
				<SpeedDial ariaLabel="Actions" :open="start === 'speeddial' ? true : undefined">
					<SpeedDialAction tooltip-title="Copy"><SvgIcon><path :d="path.copy" /></SvgIcon></SpeedDialAction>
					<SpeedDialAction tooltip-title="Save"><SvgIcon><path :d="path.save" /></SvgIcon></SpeedDialAction>
					<SpeedDialAction tooltip-title="Print"><SvgIcon><path :d="path.print" /></SvgIcon></SpeedDialAction>
				</SpeedDial>
			</div>
		</section>

		<section style="display: grid; gap: 16px">
			<h2 style="font: var(--omni-typography-h6-font); margin: 0">Wave 2 additions</h2>
			<div :style="row">
				<Card style="width: 220px">
					<CardActionArea>
						<CardContent>
							<Typography variant="subtitle1" component="p">Action card</Typography>
							<Typography variant="body2" color="text.secondary" component="p">The whole card is one button.</Typography>
						</CardContent>
					</CardActionArea>
				</Card>
				<AvatarGroup :max="4">
					<Avatar>A</Avatar><Avatar>B</Avatar><Avatar>C</Avatar><Avatar>D</Avatar><Avatar>E</Avatar><Avatar>F</Avatar>
				</AvatarGroup>
				<AvatarGroup :max="3" :total="12" spacing="small">
					<Avatar>A</Avatar><Avatar>B</Avatar>
				</AvatarGroup>
			</div>
			<div :style="row">
				<Chip v-for="c in chips" :key="c" :label="c" variant="outlined" @delete="chips = chips.filter((x) => x !== c)">
					<template #deleteIcon><SvgIcon><path :d="path.bolt" /></SvgIcon></template>
				</Chip>
				<Tooltip title="With an arrow" arrow placement="top" :open="start === 'tooltip-arrow' ? true : undefined">
					<Button variant="outlined">Hover me</Button>
				</Tooltip>
			</div>
			<List>
				<ListItem align-items="flex-start" divider>
					<ListItemAvatar><Avatar>R</Avatar></ListItemAvatar>
					<ListItemText primary="Brunch this weekend?" secondary="Ali Connors: I will be in your neighborhood doing errands this weekend. Do you want to grab brunch?" />
				</ListItem>
				<ListItem disable-padding>
					<ListItemButton align-items="flex-start">
						<ListItemAvatar><Avatar>S</Avatar></ListItemAvatar>
						<ListItemText primary="Summer BBQ" secondary="To Scott, Alex, Jennifer: Wish I could come, but I am out of town this weekend." />
					</ListItemButton>
				</ListItem>
			</List>
			<AccordionGroup default-value="a">
				<Accordion value="a"><AccordionSummary>Only one open</AccordionSummary><AccordionDetails>Opening another closes this one.</AccordionDetails></Accordion>
				<Accordion value="b"><AccordionSummary>Second panel</AccordionSummary><AccordionDetails>Second panel body.</AccordionDetails></Accordion>
				<Accordion value="c"><AccordionSummary>Third panel</AccordionSummary><AccordionDetails>Third panel body.</AccordionDetails></Accordion>
			</AccordionGroup>
			<Table aria-label="Sortable">
				<TableHead>
					<TableRow>
						<TableCell :sort-direction="by === 'name' ? dir : false"><TableSortLabel :active="by === 'name'" :direction="by === 'name' ? dir : 'asc'" @click="sortBy('name')">Dessert</TableSortLabel></TableCell>
						<TableCell align="right" :sort-direction="by === 'calories' ? dir : false"><TableSortLabel :active="by === 'calories'" :direction="by === 'calories' ? dir : 'asc'" @click="sortBy('calories')">Calories</TableSortLabel></TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					<TableRow><TableCell>Cupcake</TableCell><TableCell align="right">305</TableCell></TableRow>
					<TableRow><TableCell>Donut</TableCell><TableCell align="right">452</TableCell></TableRow>
				</TableBody>
				<TableFooter>
					<TableRow>
						<TablePagination :count="23" :page="tp" :rows-per-page="rows" :rows-per-page-options="[5, 10, 25]" :col-span="2" @page-change="(_e: unknown, p: number) => (tp = p)" @rows-per-page-change="(n: number) => { rows = n; tp = 0 }" />
					</TableRow>
				</TableFooter>
			</Table>
		</section>
	</main>
</template>
