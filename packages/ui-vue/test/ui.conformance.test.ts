import { defineUiConformanceSuite, type UiHarness } from "@omnifront/conformance"
import { defineComponent, h, nextTick, ref, type VNodeChild } from "vue"
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Menu, MenuItem, Select, Tab, TabContext, TabList, TabPanel, TextField } from "../src"
import { mount, slot } from "./mount"

type Log = (event: string) => void

/** Mount a view whose props a test can change from outside (reactive refs). */
function mountWith<P extends Record<string, unknown>>(initial: P, view: (props: P) => VNodeChild | VNodeChild[]) {
	const props = ref({ ...initial }) as { value: P }
	const { unmount } = mount(() => view(props.value))
	return {
		set: async (p: Record<string, unknown>) => {
			props.value = { ...props.value, ...p }
			await nextTick()
		},
		unmount,
	}
}

const DialogView = defineComponent({
	props: { log: { type: Function, required: true } },
	setup(props) {
		const open = ref(false)
		const log = props.log as Log
		return () => [
			h("button", { onClick: () => (open.value = true) }, "Open"),
			h(Dialog, { open: open.value, onClose: (_e: unknown, reason: string) => { log(`close:${reason}`); open.value = false } }, slot(
				h(DialogTitle, null, slot("Delete project?")),
				h(DialogContent, null, slot(h(DialogContentText, null, slot("This cannot be undone.")))),
				h(DialogActions, null, slot(h("button", null, "Cancel"), h("button", null, "Delete"))),
			)),
		]
	},
})

const MenuView = defineComponent({
	props: { log: { type: Function, required: true } },
	setup(props) {
		const anchor = ref<HTMLElement | null>(null)
		const log = props.log as Log
		return () => [
			h("button", { id: "menu-button", onClick: (e: MouseEvent) => (anchor.value = e.currentTarget as HTMLElement) }, "Menu"),
			h(Menu, { anchorEl: anchor.value, open: anchor.value !== null, onClose: (_e: unknown, reason: string) => { log(`close:${reason}`); anchor.value = null } }, slot(
				h(MenuItem, { onClick: () => log("select:profile") }, slot("Profile")),
				h(MenuItem, { disabled: true, onClick: () => log("select:billing") }, slot("Billing")),
				h(MenuItem, { onClick: () => log("select:logout") }, slot("Logout")),
			)),
		]
	},
})

const fruit = [
	{ value: "a", label: "Apple" },
	{ value: "b", label: "Banana", disabled: true },
	{ value: "c", label: "Cherry" },
]

const SelectView = defineComponent({
	props: { log: { type: Function, required: true }, error: Boolean, disabled: Boolean },
	setup(props) {
		const value = ref("")
		const log = props.log as Log
		return () =>
			h(Select, {
				label: "Fruit",
				options: fruit,
				modelValue: value.value,
				helperText: "Pick one",
				error: props.error,
				disabled: props.disabled,
				"onUpdate:modelValue": (v: string) => { log(`change:${v}`); value.value = v },
				onClose: (reason: string) => log(`close:${reason}`),
			})
	},
})

const TabsView = defineComponent({
	props: { log: { type: Function, required: true }, selectionFollowsFocus: Boolean },
	setup(props) {
		const value = ref("one")
		const log = props.log as Log
		return () =>
			h(TabContext, { modelValue: value.value, selectionFollowsFocus: props.selectionFollowsFocus, "onUpdate:modelValue": (v: string) => { log(`change:${v}`); value.value = v } }, slot(
				h(TabList, { "aria-label": "Sections" }, slot(h(Tab, { value: "one", label: "One" }), h(Tab, { value: "two", label: "Two", disabled: true }), h(Tab, { value: "three", label: "Three" }))),
				h(TabPanel, { value: "one" }, slot("First panel")),
				h(TabPanel, { value: "two" }, slot("Second panel")),
				h(TabPanel, { value: "three" }, slot("Third panel")),
			))
	},
})

const harness: UiHarness = {
	button: (props, log) =>
		mountWith(props, (p) => h(Button, { variant: p.variant as never, color: p.color as never, loading: p.loading, disabled: p.disabled, href: p.href, onClick: () => log("click") }, slot("Save"))),
	textField: (props, log) =>
		mountWith(props, (p) => h(TextField, { label: "Email", helperText: "We never share it", error: p.error, disabled: p.disabled, "onUpdate:modelValue": (v: string) => log(`change:${v}`) })),
	dialog: (_props, log) => mountWith({}, () => h(DialogView, { log })),
	menu: (_props, log) => mountWith({}, () => h(MenuView, { log })),
	select: (props, log) => mountWith(props, (p) => h(SelectView, { log, error: p.error ?? false, disabled: p.disabled ?? false })),
	tabs: (props, log) => mountWith(props, (p) => h(TabsView, { log, selectionFollowsFocus: p.selectionFollowsFocus ?? false })),
	settle: async () => {
		await nextTick()
		await new Promise((r) => setTimeout(r, 0))
		await nextTick()
	},
}

defineUiConformanceSuite("vue", harness)
