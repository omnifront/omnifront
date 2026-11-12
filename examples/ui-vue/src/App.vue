<script setup lang="ts">
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
	createTheme,
	type ColorSchemeMode,
} from "@omnifront/ui-vue"
import { computed, onMounted, ref } from "vue"

// The same page exists for React and Angular (examples/ui-react, examples/ui-angular). The URL sets the
// starting state (?scheme=dark&theme=brand&open=dialog&tab=queries) so the three can be compared
// screenshot by screenshot (e2e/visual.spec.ts).
const params = new URLSearchParams(location.search)

// A theme is plain data. These are omnifront's own brand colours, as a sample theme.
const brand = createTheme({
	palette: { primary: { main: "#7C3AED" }, secondary: { main: "#06B6D4" }, success: { main: "#10B981" } },
	shape: { borderRadius: 8 },
})
const standard = createTheme()

const mode = ref<ColorSchemeMode>((params.get("scheme") as ColorSchemeMode | null) ?? "light")
const custom = ref(params.get("theme") === "brand")
const theme = computed(() => (custom.value ? brand : standard))

const dialog = ref(params.get("open") === "dialog")
const anchor = ref<HTMLElement | null>(null)
const tab = ref(params.get("tab") ?? "overview")
const email = ref("")
const picked = ref("")
onMounted(() => {
	if (params.get("open") === "menu") anchor.value = document.getElementById("menu-button")
})
</script>

<template>
	<ThemeProvider :theme="theme" :color-scheme="mode" global>
		<main :style="{ maxWidth: '880px', margin: '0 auto', padding: '24px', display: 'grid', gap: '32px', color: 'var(--omni-palette-text-primary)', font: 'var(--omni-typography-body1-font)' }">
			<header style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap">
				<h1 style="font: var(--omni-typography-h4-font); margin: 0; flex: 1">omnifront UI</h1>
				<Button v-for="m in (['light', 'dark', 'system'] as const)" :key="m" size="small" :variant="mode === m ? 'contained' : 'outlined'" @click="mode = m">{{ m }}</Button>
				<Button size="small" color="secondary" :variant="custom ? 'contained' : 'outlined'" @click="custom = !custom">brand theme</Button>
			</header>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Button</h2>
				<div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
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

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">TextField</h2>
				<div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start">
					<TextField v-model="email" label="Email" helper-text="We never share it" />
					<TextField label="Filled" variant="filled" default-value="Oslo" />
					<TextField label="Standard" variant="standard" />
					<TextField label="Error" error helper-text="Must be a number" default-value="abc" />
					<TextField label="Disabled" disabled default-value="Nope" />
					<TextField label="Required" required size="small" />
					<TextField label="Amount">
						<template #startAdornment>$</template>
						<template #endAdornment>USD</template>
					</TextField>
					<TextField label="Bio" multiline :rows="3" />
				</div>
			</section>

			<section style="display: grid; gap: 16px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Dialog and Menu</h2>
				<div style="display: flex; gap: 12px; align-items: center">
					<Button variant="contained" @click="dialog = true">Open dialog</Button>
					<Button id="menu-button" variant="outlined" @click="anchor = $event.currentTarget as HTMLElement">Open menu</Button>
					<span>{{ picked && `Picked: ${picked}` }}</span>
				</div>
				<Dialog v-model:open="dialog">
					<DialogTitle>Delete project?</DialogTitle>
					<DialogContent>
						<DialogContentText>This permanently removes the project and its 12 queries. It cannot be undone.</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button @click="dialog = false">Cancel</Button>
						<Button color="error" @click="dialog = false">Delete</Button>
					</DialogActions>
				</Dialog>
				<Menu :anchor-el="anchor" :open="anchor !== null" @close="anchor = null">
					<MenuItem @click="picked = 'Profile'">Profile</MenuItem>
					<MenuItem @click="picked = 'Settings'">Settings</MenuItem>
					<MenuItem disabled>Billing</MenuItem>
					<MenuDivider />
					<MenuItem @click="picked = 'Logout'">Logout</MenuItem>
				</Menu>
			</section>

			<section style="display: grid; gap: 8px">
				<h2 style="font: var(--omni-typography-h6-font); margin: 0">Tabs</h2>
				<TabContext v-model="tab">
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
</template>
