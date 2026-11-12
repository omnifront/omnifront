import { act, render } from "@testing-library/react"
import { useState, type ReactNode } from "react"
import { defineUiConformanceSuite, type UiHarness } from "@omnifront/conformance"
import { Checkbox, Radio, RadioGroup } from "../src"
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

function SelectView({ error, disabled, log }: { error: boolean | undefined; disabled: boolean | undefined; log: Log }) {
	const [value, setValue] = useState("")
	return (
		<Select
			label="Fruit"
			options={fruit}
			value={value}
			helperText="Pick one"
			error={error}
			disabled={disabled}
			onChange={(_e, v) => { log(`change:${v}`); setValue(v) }}
			onOpenChange={(open, reason) => { if (!open) log(`close:${reason}`) }}
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
	radioGroup: (props, log) => mountWith(props, (p) => <RadioGroupView disabled={p.disabled} error={p.error} log={log} />),
	select: (props, log) => mountWith(props, (p) => <SelectView error={p.error} disabled={p.disabled} log={log} />),
	tabs: (props, log) => mountWith(props, (p) => <TabsView selectionFollowsFocus={p.selectionFollowsFocus} log={log} />),
	settle: async () => void (await act(async () => { await new Promise((r) => setTimeout(r, 0)) })),
}

defineUiConformanceSuite("react", harness)
