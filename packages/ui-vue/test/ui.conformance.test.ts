import { defineUiConformanceSuite, type UiHarness } from "@omnifront/conformance"
import { defineComponent, h, nextTick, ref, type VNodeChild } from "vue"
import { ButtonGroup, Checkbox, Fab, IconButton, Radio, RadioGroup, Rating, Slider, Switch, ToggleButton, ToggleButtonGroup } from "../src"
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

const CheckboxView = defineComponent({
	props: { log: { type: Function, required: true }, indeterminate: Boolean, disabled: Boolean, error: Boolean },
	setup(props) {
		const checked = ref(false)
		const log = props.log as Log
		return () =>
			h(Checkbox, {
				label: "Accept terms",
				modelValue: checked.value,
				indeterminate: props.indeterminate,
				disabled: props.disabled,
				error: props.error,
				"onUpdate:modelValue": (c: boolean) => { log(`change:${c}`); checked.value = c },
			})
	},
})

const IconButtonsView = defineComponent({
	props: { log: { type: Function, required: true }, disabled: Boolean },
	setup(props) {
		const log = props.log as Log
		return () => [
			h(IconButton, { "aria-label": "Delete", disabled: props.disabled, onClick: () => log("click:delete") }, slot(h("svg"))),
			h(Fab, { "aria-label": "Add", disabled: props.disabled, onClick: () => log("click:add") }, slot(h("svg"))),
			h(Fab, { variant: "extended", disabled: props.disabled, onClick: () => log("click:create") }, slot("Create")),
		]
	},
})

const ButtonGroupView = defineComponent({
	props: { log: { type: Function, required: true }, disabled: Boolean },
	setup(props) {
		const log = props.log as Log
		return () =>
			h(ButtonGroup, { "aria-label": "Actions", variant: "outlined", color: "secondary", size: "small", disabled: props.disabled || undefined }, slot(h(Button, { onClick: () => log("click:one") }, slot("One")), h(Button, { onClick: () => log("click:two") }, slot("Two"))))
	},
})

const ToggleGroupView = defineComponent({
	props: { log: { type: Function, required: true }, exclusive: Boolean },
	setup(props) {
		const value = ref<string[]>([])
		const log = props.log as Log
		return () =>
			h(
				ToggleButtonGroup,
				{
					"aria-label": "Format",
					exclusive: props.exclusive,
					modelValue: props.exclusive ? (value.value[0] ?? null) : value.value,
					"onUpdate:modelValue": (v: unknown) => {
						const list = v === null ? [] : typeof v === "string" ? [v] : (v as string[])
						log(`change:${list.join(",")}`)
						value.value = list
					},
				},
				slot(h(ToggleButton, { value: "bold" }, slot("Bold")), h(ToggleButton, { value: "italic" }, slot("Italic")), h(ToggleButton, { value: "underline", disabled: true }, slot("Underline"))),
			)
	},
})

const RangeSliderView = defineComponent({
	props: { log: { type: Function, required: true }, disabled: Boolean, vertical: Boolean },
	setup(props) {
		const value = ref<[number, number]>([20, 80])
		const log = props.log as Log
		return () =>
			h(Slider as never, {
				"aria-label": "Price",
				range: true,
				min: 0,
				max: 100,
				step: 10,
				modelValue: value.value,
				valueLabelDisplay: "on",
				orientation: props.vertical ? "vertical" : "horizontal",
				disabled: props.disabled,
				"onUpdate:modelValue": (v: [number, number]) => { log(`change:${v.join(",")}`); value.value = v },
			})
	},
})

const SliderView = defineComponent({
	props: { log: { type: Function, required: true }, disabled: Boolean },
	setup(props) {
		const value = ref(30)
		const log = props.log as Log
		return () =>
			h(Slider, { "aria-label": "Volume", min: 0, max: 100, step: 10, modelValue: value.value, valueLabelDisplay: "auto", disabled: props.disabled, "onUpdate:modelValue": (v: number | readonly [number, number]) => { log(`change:${v as number}`); value.value = v as number } })
	},
})

const RatingView = defineComponent({
	props: { log: { type: Function, required: true }, readOnly: Boolean, disabled: Boolean },
	setup(props) {
		const value = ref(0)
		const log = props.log as Log
		return () =>
			h(Rating, { "aria-label": "Rating", modelValue: props.readOnly ? 3 : value.value, readOnly: props.readOnly, disabled: props.disabled, "onUpdate:modelValue": (v: number) => { log(`change:${v}`); value.value = v } })
	},
})

const SwitchView = defineComponent({
	props: { log: { type: Function, required: true }, disabled: Boolean, error: Boolean },
	setup(props) {
		const checked = ref(false)
		const log = props.log as Log
		return () =>
			h(Switch, { label: "Wi-Fi", modelValue: checked.value, disabled: props.disabled, error: props.error, "onUpdate:modelValue": (c: boolean) => { log(`change:${c}`); checked.value = c } })
	},
})

const RadioGroupView = defineComponent({
	props: { log: { type: Function, required: true }, disabled: Boolean, error: Boolean },
	setup(props) {
		const value = ref("")
		const log = props.log as Log
		return () =>
			h(
				RadioGroup,
				{ label: "Fruit", helperText: "Pick one", modelValue: value.value, disabled: props.disabled, error: props.error, "onUpdate:modelValue": (v: string) => { log(`change:${v}`); value.value = v } },
				slot(h(Radio, { value: "a", label: "Apple" }), h(Radio, { value: "b", label: "Banana", disabled: true }), h(Radio, { value: "c", label: "Cherry" })),
			)
	},
})

const fruit = [
	{ value: "a", label: "Apple" },
	{ value: "b", label: "Banana", disabled: true },
	{ value: "c", label: "Cherry" },
]

const SelectView = defineComponent({
	props: { log: { type: Function, required: true }, error: Boolean, disabled: Boolean, multiple: Boolean },
	setup(props) {
		const value = ref<string | string[]>(props.multiple ? [] : "")
		const log = props.log as Log
		return () =>
			h(Select, {
				label: "Fruit",
				options: fruit,
				multiple: props.multiple,
				modelValue: value.value as never,
				helperText: "Pick one",
				error: props.error,
				disabled: props.disabled,
				"onUpdate:modelValue": (v: string | readonly string[]) => { log(`change:${Array.isArray(v) ? v.join(",") : (v as string)}`); value.value = v as string | string[] },
				onClose: (reason: string) => log(`close:${reason}`),
			})
	},
})

const groupedFood = [
	{ label: "Fruit", options: [{ value: "a", label: "Apple" }, { value: "b", label: "Banana", disabled: true }] },
	{ label: "Vegetables", options: [{ value: "c", label: "Carrot" }, { value: "d", label: "Daikon" }] },
]

const SelectGroupsView = defineComponent({
	props: { log: { type: Function, required: true } },
	setup(props) {
		const value = ref("")
		const log = props.log as Log
		return () =>
			h(
				Select as never,
				{
					label: "Food",
					options: groupedFood,
					modelValue: value.value as never,
					"onUpdate:modelValue": (v: string | readonly string[]) => { log(`change:${v as string}`); value.value = v as string },
					onClose: (reason: string) => log(`close:${reason}`),
				},
				{ option: ({ option }: { option: { label: string; value: string } }) => [h("span", { "data-rich": "" }, option.label), h("small", option.value)] },
			)
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
	checkbox: (props, log) => mountWith(props, (p) => h(CheckboxView, { log, indeterminate: p.indeterminate ?? false, disabled: p.disabled ?? false, error: p.error ?? false })),
	switch: (props, log) => mountWith(props, (p) => h(SwitchView, { log, disabled: p.disabled ?? false, error: p.error ?? false })),
	radioGroup: (props, log) => mountWith(props, (p) => h(RadioGroupView, { log, disabled: p.disabled ?? false, error: p.error ?? false })),
	select: (props, log) => mountWith(props, (p) => h(SelectView, { log, error: p.error ?? false, disabled: p.disabled ?? false, multiple: props.multiple ?? false })),
	selectGroups: (_props, log) => mountWith({}, () => h(SelectGroupsView, { log })),
	iconButtons: (props, log) => mountWith(props, (p) => h(IconButtonsView, { log, disabled: p.disabled ?? false })),
	buttonGroup: (props, log) => mountWith(props, (p) => h(ButtonGroupView, { log, disabled: p.disabled ?? false })),
	toggleGroup: (props, log) => mountWith(props, (p) => h(ToggleGroupView, { log, exclusive: p.exclusive ?? false })),
	slider: (props, log) => mountWith(props, (p) => h(SliderView, { log, disabled: p.disabled ?? false })),
	rangeSlider: (props, log) => mountWith(props, (p) => h(RangeSliderView, { log, disabled: p.disabled ?? false, vertical: props.vertical ?? false })),
	rating: (props, log) => mountWith(props, (p) => h(RatingView, { log, readOnly: p.readOnly ?? false, disabled: p.disabled ?? false })),
	tabs: (props, log) => mountWith(props, (p) => h(TabsView, { log, selectionFollowsFocus: p.selectionFollowsFocus ?? false })),
	settle: async () => {
		await nextTick()
		await new Promise((r) => setTimeout(r, 0))
		await nextTick()
	},
}

defineUiConformanceSuite("vue", harness)
