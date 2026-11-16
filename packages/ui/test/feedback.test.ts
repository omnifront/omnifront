import { describe, expect, it, vi } from "vitest"
import type { Scheduler } from "@omnifront/core"
import {
	alertPart,
	avatarGroupState,
	bottomNavigationActionPart,
	breadcrumbItems,
	breadcrumbsPart,
	circularProgressParts,
	createAccordionGroup,
	createPagination,
	createPopover,
	createSnackbar,
	createSpeedDial,
	createTooltip,
	linearProgressParts,
	linkPart,
	paginationItems,
	skeletonPart,
	sortLabelPart,
	stepPart,
	stepState,
	stepperPart,
	tablePaginationState,
} from "../src"

function manualScheduler() {
	const timers = new Map<number, { fn: () => void; at: number }>()
	let now = 0
	let id = 0
	const scheduler = {
		setTimeout: (fn: () => void, ms: number) => {
			timers.set(++id, { fn, at: now + ms })
			return id
		},
		clearTimeout: (h: number) => void timers.delete(h),
	} as unknown as Scheduler
	return {
		scheduler,
		pending: () => timers.size,
		advance(ms: number) {
			now += ms
			for (const [h, t] of [...timers]) if (t.at <= now) { timers.delete(h); t.fn() }
		},
	}
}

describe("feedback parts", () => {
	it("Alert: error and warning interrupt, info and success wait", () => {
		expect(alertPart().attrs).toMatchObject({ role: "status", "data-severity": "success", "data-variant": "standard" })
		expect(alertPart({ severity: "error", variant: "filled" }).attrs).toMatchObject({ role: "alert", "data-variant": "filled" })
		expect(alertPart({ severity: "warning" }).attrs.role).toBe("alert")
		expect(alertPart({ severity: "info" }).attrs.role).toBe("status")
	})

	it("CircularProgress: determinate has a value and a dash offset, indeterminate has neither", () => {
		const det = circularProgressParts({ value: 25, size: 60 })
		expect(det.root.attrs).toMatchObject({ role: "progressbar", "aria-valuenow": 25, "data-variant": "determinate", style: "--_size: 60px" })
		expect(String(det.circle.attrs.style)).toContain("stroke-dashoffset")
		const ind = circularProgressParts({ size: "3rem" })
		expect(ind.root.attrs["aria-valuenow"]).toBeUndefined()
		expect(ind.root.attrs).toMatchObject({ "data-variant": "indeterminate", style: "--_size: 3rem" })
		expect(ind.circle.attrs.style).toBeUndefined()
		expect(circularProgressParts({ value: 250 }).root.attrs["aria-valuenow"]).toBe(100)
		expect(circularProgressParts({ value: -3 }).root.attrs["aria-valuenow"]).toBe(0)
	})

	it("LinearProgress: values only for determinate and buffer", () => {
		expect(linearProgressParts().root.attrs).toMatchObject({ "data-variant": "indeterminate" })
		expect(linearProgressParts().root.attrs["aria-valuenow"]).toBeUndefined()
		const d = linearProgressParts({ variant: "determinate", value: 40.4 })
		expect(d.root.attrs["aria-valuenow"]).toBe(40)
		expect(d.bar1.attrs.style).toBe("--_p: 40.4")
		const b = linearProgressParts({ variant: "buffer", value: 20, valueBuffer: 150 })
		expect(b.bar2.attrs.style).toBe("--_p: 100")
		expect(d.bar2.attrs.style).toBeUndefined()
	})

	it("Skeleton: decorative, sizes become variables, animation false is none", () => {
		expect(skeletonPart().attrs).toMatchObject({ "aria-hidden": "true", "data-variant": "text", "data-animation": "pulse" })
		expect(skeletonPart().attrs.style).toBeUndefined()
		const s = skeletonPart({ variant: "rounded", animation: false, width: 80, height: "2rem" })
		expect(s.attrs).toMatchObject({ "data-animation": "none", style: "--_w: 80px; --_h: 2rem" })
	})

	it("Link and Breadcrumbs nav", () => {
		expect(linkPart().attrs).toMatchObject({ class: "omni-link", "data-underline": "always", "data-color": "primary" })
		expect(linkPart({ color: "text.secondary", underline: "none" }).attrs).toMatchObject({ "data-color": "text-secondary", "data-underline": "none" })
		expect(breadcrumbsPart().attrs["aria-label"]).toBe("breadcrumb")
		expect(breadcrumbsPart("trail").attrs["aria-label"]).toBe("trail")
	})

	it("breadcrumbItems folds the middle only when it hides more than one", () => {
		expect(breadcrumbItems(5)).toEqual([0, 1, 2, 3, 4])
		expect(breadcrumbItems(10, { maxItems: 4 })).toEqual([0, "ellipsis", 9])
		expect(breadcrumbItems(10, { maxItems: 4, itemsBeforeCollapse: 2, itemsAfterCollapse: 2 })).toEqual([0, 1, "ellipsis", 8, 9])
		expect(breadcrumbItems(10, { maxItems: 4, expanded: true })).toHaveLength(10)
		expect(breadcrumbItems(4, { maxItems: 2, itemsBeforeCollapse: 1, itemsAfterCollapse: 2 })).toEqual([0, 1, 2, 3])
	})

	it("Step: completed before the active step, forced states win, last has no connector", () => {
		expect(stepState({ index: 0, activeStep: 1 })).toEqual({ active: false, completed: true, disabled: false, error: false })
		expect(stepState({ index: 1, activeStep: 1 }).active).toBe(true)
		expect(stepState({ index: 1, activeStep: 1, completed: true }).completed).toBe(false) // the active one is never "completed"
		expect(stepState({ index: 2, activeStep: 0, active: true }).active).toBe(true)
		expect(stepPart({ index: 0, activeStep: 1, count: 3 }).attrs).toMatchObject({ "data-state": "completed" })
		expect(stepPart({ index: 2, activeStep: 1, count: 3 }).attrs).toMatchObject({ "data-state": "pending", "data-last": "" })
		expect(stepPart({ index: 1, activeStep: 1, error: true, disabled: true }).attrs).toMatchObject({ "data-state": "error", "data-disabled": "" })
		expect(stepperPart().attrs["data-orientation"]).toBe("horizontal")
		expect(stepperPart({ orientation: "vertical", alternativeLabel: true, nonLinear: true }).attrs).toMatchObject({ "data-orientation": "vertical", "data-alternative-label": "", "data-non-linear": "" })
	})

	it("BottomNavigation action: current is aria-current", () => {
		expect(bottomNavigationActionPart({ selected: true, showLabel: true }).attrs).toMatchObject({ "aria-current": "page", "data-selected": "", "data-show-label": "", type: "button" })
		expect(bottomNavigationActionPart({ disabled: true }).attrs).toMatchObject({ disabled: true })
		expect(bottomNavigationActionPart().attrs["aria-current"]).toBeUndefined()
	})

	it("TablePagination numbers", () => {
		expect(tablePaginationState({ count: 95, page: 0, rowsPerPage: 10 })).toMatchObject({ from: 1, to: 10, label: "1–10 of 95", canPrevious: false, canNext: true, lastPage: 9 })
		expect(tablePaginationState({ count: 95, page: 9, rowsPerPage: 10 })).toMatchObject({ from: 91, to: 95, canNext: false, canPrevious: true })
		expect(tablePaginationState({ count: 0, page: 0, rowsPerPage: 10 })).toMatchObject({ from: 0, to: 0, label: "0–0 of 0", canNext: false })
		expect(tablePaginationState({ count: -1, page: 1, rowsPerPage: 5 })).toMatchObject({ from: 6, to: 10, label: "6–10", canNext: true })
	})

	it("SortLabel and AvatarGroup", () => {
		expect(sortLabelPart({ active: true, direction: "desc" }).attrs).toMatchObject({ "data-active": "", "data-direction": "desc", type: "button" })
		expect(sortLabelPart().attrs["data-direction"]).toBe("asc")
		expect(avatarGroupState(3, 5)).toEqual({ shown: 3, surplus: 0 })
		expect(avatarGroupState(6, 4)).toEqual({ shown: 3, surplus: 3 })
		expect(avatarGroupState(3, 5, 10)).toEqual({ shown: 3, surplus: 7 })
		expect(avatarGroupState(3, 2, 3)).toEqual({ shown: 1, surplus: 2 })
		expect(avatarGroupState(5, 1)).toEqual({ shown: 1, surplus: 4 })
	})
})

describe("paginationItems", () => {
	const view = (o: Parameters<typeof paginationItems>[0]): string[] => paginationItems(o).map((i) => (i.type === "page" ? String(i.page) : i.type))
	it("small counts show every page", () => {
		expect(view({ count: 3, page: 1 })).toEqual(["previous", "1", "2", "3", "next"])
	})
	it("folds both ends", () => {
		expect(view({ count: 20, page: 10 })).toEqual(["previous", "1", "start-ellipsis", "9", "10", "11", "end-ellipsis", "20", "next"])
		expect(view({ count: 20, page: 1 })).toEqual(["previous", "1", "2", "3", "4", "5", "end-ellipsis", "20", "next"])
		expect(view({ count: 20, page: 20 })).toEqual(["previous", "1", "start-ellipsis", "16", "17", "18", "19", "20", "next"])
	})
	it("never hides a single page behind an ellipsis", () => {
		expect(view({ count: 7, page: 4 })).toEqual(["previous", "1", "2", "3", "4", "5", "6", "7", "next"])
	})
	it("first, last, hide and boundary options", () => {
		expect(view({ count: 20, page: 10, showFirstButton: true, showLastButton: true, hidePrevButton: true, hideNextButton: true })).toEqual(["first", "1", "start-ellipsis", "9", "10", "11", "end-ellipsis", "20", "last"])
		expect(view({ count: 30, page: 15, siblingCount: 0, boundaryCount: 2 })).toEqual(["previous", "1", "2", "start-ellipsis", "15", "end-ellipsis", "29", "30", "next"])
	})
	it("disables the ends and everything when disabled", () => {
		const items = paginationItems({ count: 5, page: 1, showFirstButton: true, showLastButton: true })
		expect(items.filter((i) => i.disabled).map((i) => i.type)).toEqual(["first", "previous"])
		const end = paginationItems({ count: 5, page: 5, showFirstButton: true, showLastButton: true })
		expect(end.filter((i) => i.disabled).map((i) => i.type)).toEqual(["next", "last"])
		expect(paginationItems({ count: 5, page: 3, disabled: true }).every((i) => i.disabled)).toBe(true)
		expect(paginationItems({ count: 0, page: 1 }).map((i) => i.type)).toEqual(["previous", "next"])
	})
})

describe("Pagination machine", () => {
	it("keeps its own page and calls onPageChange", () => {
		const onPageChange = vi.fn()
		const m = createPagination({ count: 10, defaultPage: 2, onPageChange })
		expect(m.getSnapshot().page).toBe(2)
		const before = m.getSnapshot().items
		m.setProps({ count: 10 })
		expect(m.getSnapshot().items).toBe(before) // nothing changed: same list
		const next = m.getSnapshot().items.find((i) => i.type === "next")
		const parts = m.connect()
		parts.item(next!).on.click?.(new Event("click"))
		expect(onPageChange).toHaveBeenCalledWith(3, expect.any(Event))
		expect(m.getSnapshot().page).toBe(3)
		expect(m.getSnapshot().items).not.toBe(before)
	})
	it("controlled: only reports; clamps; ignores same page and disabled", () => {
		const onPageChange = vi.fn()
		const m = createPagination({ count: 5, page: 5, onPageChange })
		m.goTo(9)
		expect(onPageChange).not.toHaveBeenCalled() // clamped to 5 = current
		m.goTo(1)
		expect(onPageChange).toHaveBeenCalledWith(1, undefined)
		expect(m.getSnapshot().page).toBe(5)
		m.setProps({ disabled: true })
		m.goTo(2)
		expect(onPageChange).toHaveBeenCalledTimes(1)
	})
	it("item parts: labels, current page, ellipsis", () => {
		const m = createPagination({ count: 20, page: 10, label: "Results", variant: "outlined", shape: "rounded", size: "small", color: "primary", showFirstButton: true, showLastButton: true })
		const { root, item } = m.connect()
		expect(root.attrs).toMatchObject({ "aria-label": "Results", "data-variant": "outlined", "data-shape": "rounded", "data-size": "small", "data-color": "primary" })
		const byType = Object.fromEntries(m.getSnapshot().items.map((i) => [i.type + (i.page ?? ""), item(i)]))
		expect(byType["page10"]?.attrs).toMatchObject({ "aria-current": "page", "aria-label": "page 10", "data-selected": "" })
		expect(byType["page9"]?.attrs["aria-label"]).toBe("Go to page 9")
		expect(byType["first1"]?.attrs["aria-label"]).toBe("Go to first page")
		expect(byType["previous9"]?.attrs["aria-label"]).toBe("Go to previous page")
		expect(byType["next11"]?.attrs["aria-label"]).toBe("Go to next page")
		expect(byType["last20"]?.attrs["aria-label"]).toBe("Go to last page")
		expect(item({ type: "start-ellipsis", page: null, selected: false, disabled: false }).attrs.class).toBe("omni-pagination__ellipsis")
		expect(createPagination({ count: 3 }).connect().root.attrs["aria-label"]).toBe("pagination navigation")
	})
})

describe("AccordionGroup", () => {
	it("one at a time: opening one closes the other", () => {
		const onValueChange = vi.fn()
		const g = createAccordionGroup({ defaultValue: "a", onValueChange })
		expect(g.isExpanded("a")).toBe(true)
		g.set("b", true)
		expect(onValueChange).toHaveBeenLastCalledWith("b", undefined)
		expect(g.isExpanded("a")).toBe(false)
		g.set("b", false)
		expect(onValueChange).toHaveBeenLastCalledWith(null, undefined)
		expect(g.getSnapshot().open).toEqual([])
	})
	it("multiple keeps several; controlled only reports", () => {
		const onValueChange = vi.fn()
		const g = createAccordionGroup({ multiple: true, defaultValue: ["a"], onValueChange })
		g.set("b", true)
		expect(g.getSnapshot().open).toEqual(["a", "b"])
		g.set("a", false)
		expect(onValueChange).toHaveBeenLastCalledWith(["b"], undefined)
		const c = createAccordionGroup({ value: "x", onValueChange })
		c.set("y", true)
		expect(c.getSnapshot().open).toEqual(["x"])
		expect(createAccordionGroup({ value: ["p", "q"] }).getSnapshot().open).toEqual(["p"]) // not multiple: only the first can be open
		expect(createAccordionGroup().getSnapshot().open).toEqual([])
	})
})

describe("Snackbar", () => {
	it("hides itself after autoHideDuration with reason timeout", () => {
		const t = manualScheduler()
		const onOpenChange = vi.fn()
		const s = createSnackbar({ open: true, autoHideDuration: 1000, scheduler: t.scheduler, onOpenChange })
		t.advance(999)
		expect(onOpenChange).not.toHaveBeenCalled()
		t.advance(1)
		expect(onOpenChange).toHaveBeenCalledWith(false, "timeout", undefined)
		s.dispose()
	})
	it("pauses on pointer or focus and counts half the time again on resume", () => {
		const t = manualScheduler()
		const onOpenChange = vi.fn()
		const s = createSnackbar({ open: true, autoHideDuration: 1000, scheduler: t.scheduler, onOpenChange })
		const { root } = s.connect()
		t.advance(500)
		root.on.pointerenter?.(new Event("pointerenter"))
		expect(t.pending()).toBe(0)
		t.advance(5000)
		expect(onOpenChange).not.toHaveBeenCalled()
		root.on.pointerleave?.(new Event("pointerleave"))
		t.advance(499)
		expect(onOpenChange).not.toHaveBeenCalled()
		t.advance(1)
		expect(onOpenChange).toHaveBeenCalledWith(false, "timeout", undefined)
		root.on.focusout?.(new Event("focusout")) // resume without a pause: nothing starts
		expect(t.pending()).toBe(0)
	})
	it("starts when opened later, stops when closed, no timer without a duration", () => {
		const t = manualScheduler()
		const s = createSnackbar({ open: false, autoHideDuration: 1000, scheduler: t.scheduler })
		expect(t.pending()).toBe(0)
		s.setProps({ open: true })
		expect(t.pending()).toBe(1)
		s.setProps({ open: false })
		expect(t.pending()).toBe(1) // the exit-animation timer only
		const none = createSnackbar({ open: true, scheduler: t.scheduler })
		none.setProps({ autoHideDuration: null })
		expect(none.getSnapshot().open).toBe(true)
		const zero = createSnackbar({ open: true, autoHideDuration: 0, scheduler: t.scheduler })
		zero.connect().root.on.focusin?.(new Event("focusin"))
		zero.connect().root.on.focusout?.(new Event("focusout"))
		expect(zero.getSnapshot().open).toBe(true)
	})
	it("connect: anchor data, status role; attach closes on Escape and outside press", () => {
		const onOpenChange = vi.fn()
		const s = createSnackbar({ open: true, anchorOrigin: { vertical: "top", horizontal: "center" }, onOpenChange })
		expect(s.connect().root.attrs).toMatchObject({ "data-vertical": "top", "data-horizontal": "center", "data-state": "open" })
		expect(s.connect().content.attrs.role).toBe("status")
		const content = document.createElement("div")
		const inner = document.createElement("button")
		content.append(inner)
		document.body.append(content)
		const stop = s.attach({ content })
		inner.dispatchEvent(new Event("pointerdown", { bubbles: true }))
		expect(onOpenChange).not.toHaveBeenCalled()
		document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))
		expect(onOpenChange).toHaveBeenLastCalledWith(false, "outsidePress", expect.any(Event))
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }))
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
		expect(onOpenChange).toHaveBeenLastCalledWith(false, "escapeKeyDown", expect.any(Event))
		s.setProps({ closeOnOutsidePress: false })
		onOpenChange.mockClear()
		document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))
		expect(onOpenChange).not.toHaveBeenCalled()
		stop()
		content.remove()
	})
})

describe("Popover", () => {
	it("is a named, non-modal dialog; Escape and outside press ask to close; focus goes in and back", () => {
		const onOpenChange = vi.fn()
		const p = createPopover({ id: "p", label: "Filters", open: true, onOpenChange })
		const { content } = p.connect()
		expect(content.attrs).toMatchObject({ role: "dialog", "aria-label": "Filters", id: "p-content" })
		expect(content.attrs["aria-modal"]).toBeUndefined()
		expect(createPopover({ id: "q", labelledBy: "t" }).connect().content.attrs["aria-labelledby"]).toBe("t")
		const anchor = document.createElement("button")
		const el = document.createElement("div")
		el.tabIndex = -1
		const input = document.createElement("input")
		el.append(input)
		document.body.append(anchor, el)
		const position = vi.fn(() => vi.fn())
		const stop = p.attach({ content: el, anchor, position })
		expect(position).toHaveBeenCalledWith(anchor, el)
		expect(document.activeElement).toBe(input)
		el.dispatchEvent(new Event("pointerdown", { bubbles: true }))
		anchor.dispatchEvent(new Event("pointerdown", { bubbles: true }))
		expect(onOpenChange).not.toHaveBeenCalled()
		document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))
		expect(onOpenChange).toHaveBeenLastCalledWith(false, "outsidePress", expect.any(Event))
		const key = (k: string) => {
			const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })
			content.on.keydown?.(e)
		}
		key("a")
		expect(onOpenChange).toHaveBeenCalledTimes(1)
		key("Escape")
		expect(onOpenChange).toHaveBeenLastCalledWith(false, "escapeKeyDown", expect.any(Event))
		stop()
		expect(document.activeElement).toBe(anchor)
		anchor.remove()
		el.remove()
	})
	it("works without an anchor or positioner", () => {
		const p = createPopover({ id: "z", open: true })
		const el = document.createElement("div")
		document.body.append(el)
		p.attach({ content: el })()
		el.remove()
	})
})

describe("SpeedDial", () => {
	const build = (direction?: "up" | "down" | "left" | "right", extra = {}) => {
		const onOpenChange = vi.fn()
		const m = createSpeedDial({ id: "sd", defaultOpen: false, direction, onOpenChange, ...extra })
		const root = document.createElement("div")
		root.setAttribute("data-direction", direction ?? "up")
		const parts = m.connect()
		const trigger = document.createElement("button")
		trigger.setAttribute("aria-haspopup", "menu")
		const actions = [0, 1, 2].map(() => {
			const b = document.createElement("button")
			b.setAttribute("role", "menuitem")
			return b
		})
		const dis = document.createElement("button")
		dis.setAttribute("role", "menuitem")
		dis.setAttribute("aria-disabled", "true")
		root.append(trigger, ...actions, dis)
		document.body.append(root)
		const fire = (type: string, init: object = {}, target: HTMLElement = root) => {
			const fresh = m.connect()
			const e = Object.assign(new Event(type, { bubbles: true, cancelable: true }), init)
			Object.defineProperty(e, "currentTarget", { value: root })
			Object.defineProperty(e, "target", { value: target })
			fresh.root.on[type]?.(e)
			return e
		}
		return { m, root, trigger, actions, parts, fire, onOpenChange }
	}
	it("trigger toggles and exposes menu semantics", () => {
		const { m, parts, onOpenChange } = build()
		expect(parts.trigger.attrs).toMatchObject({ "aria-haspopup": "menu", "aria-expanded": "false", "aria-controls": "sd-actions" })
		expect(parts.actions.attrs).toMatchObject({ role: "menu", "aria-labelledby": "sd-trigger" })
		expect(parts.action.attrs).toMatchObject({ role: "menuitem", tabindex: -1 })
		parts.trigger.on.click?.(new Event("click"))
		expect(m.getSnapshot().open).toBe(true)
		expect(m.connect().trigger.attrs["aria-expanded"]).toBe("true")
		m.connect().trigger.on.click?.(new Event("click"))
		expect(onOpenChange).toHaveBeenLastCalledWith(false, "trigger", expect.any(Event))
	})
	it("pointer hover opens and leaves close (not for touch); focus leaving closes", () => {
		const { m, fire, root, trigger } = build()
		fire("pointerenter", { pointerType: "mouse" })
		expect(m.getSnapshot().open).toBe(true)
		fire("pointerleave", { pointerType: "mouse" })
		expect(m.getSnapshot().open).toBe(false)
		fire("pointerenter", { pointerType: "touch" })
		expect(m.getSnapshot().open).toBe(false)
		m.show()
		fire("pointerleave", { pointerType: "touch" })
		expect(m.getSnapshot().open).toBe(true)
		fire("focusout", { relatedTarget: trigger })
		expect(m.getSnapshot().open).toBe(true) // focus stayed inside
		fire("focusout", { relatedTarget: null })
		expect(m.getSnapshot().open).toBe(true)
		fire("focusout", { relatedTarget: document.body })
		expect(m.getSnapshot().open).toBe(false)
		root.remove()
	})
	it("Escape closes and focuses the trigger", () => {
		const { m, fire, trigger, root } = build()
		fire("keydown", { key: "Escape" }) // closed: nothing
		m.show()
		const e = fire("keydown", { key: "Escape" })
		expect(m.getSnapshot().open).toBe(false)
		expect(document.activeElement).toBe(trigger)
		expect(e.defaultPrevented).toBe(false)
		root.remove()
	})
	it("arrow keys: open from the trigger, move away and back, return to the trigger", () => {
		const { m, fire, trigger, actions, root } = build("up")
		fire("keydown", { key: "ArrowDown" }) // wrong way while closed: nothing
		expect(m.getSnapshot().open).toBe(false)
		fire("keydown", { key: "ArrowUp" })
		expect(m.getSnapshot().open).toBe(true)
		fire("keydown", { key: "x" })
		trigger.focus()
		fire("keydown", { key: "ArrowUp" })
		expect(document.activeElement).toBe(actions[0])
		fire("keydown", { key: "ArrowUp" })
		expect(document.activeElement).toBe(actions[1])
		fire("keydown", { key: "ArrowUp" })
		fire("keydown", { key: "ArrowUp" })
		expect(document.activeElement).toBe(actions[2]) // the disabled one is skipped, the end stays
		fire("keydown", { key: "ArrowDown" })
		expect(document.activeElement).toBe(actions[1])
		fire("keydown", { key: "ArrowDown" })
		fire("keydown", { key: "ArrowDown" })
		expect(document.activeElement).toBe(trigger)
		root.remove()
	})
	it("direction maps the keys, with RTL flipping the horizontal ones", () => {
		for (const [dir, away] of [["down", "ArrowDown"], ["left", "ArrowLeft"], ["right", "ArrowRight"]] as const) {
			const { m, fire, root } = build(dir)
			fire("keydown", { key: away })
			expect(m.getSnapshot().open).toBe(true)
			root.remove()
		}
		const rtl = build("left")
		rtl.root.setAttribute("dir", "rtl")
		rtl.fire("keydown", { key: "ArrowRight" })
		expect(rtl.m.getSnapshot().open).toBe(true)
		rtl.root.remove()
		const rtl2 = build("right")
		rtl2.root.setAttribute("dir", "rtl")
		rtl2.fire("keydown", { key: "ArrowLeft" })
		expect(rtl2.m.getSnapshot().open).toBe(true)
		rtl2.root.remove()
	})
	it("choosing an action closes and refocuses the trigger", () => {
		const { m, parts, trigger, actions, root } = build()
		m.show()
		const e = new Event("click")
		Object.defineProperty(e, "currentTarget", { value: actions[0] })
		parts.action.on.click?.(e)
		expect(m.getSnapshot().open).toBe(false)
		expect(document.activeElement).toBe(trigger)
		root.remove()
	})
})

describe("Tooltip touch", () => {
	const setup = (props = {}) => {
		const t = manualScheduler()
		const m = createTooltip({ id: "t", scheduler: t.scheduler, ...props })
		const trigger = document.createElement("button")
		document.body.append(trigger)
		const stop = m.attachTrigger(trigger)
		const fire = (type: string, pointerType: string) => trigger.dispatchEvent(Object.assign(new Event(type, { bubbles: true }), { pointerType }))
		return { t, m, trigger, stop, fire }
	}
	it("a hold opens after enterTouchDelay and it closes leaveTouchDelay after the finger lifts", () => {
		const { t, m, fire, stop, trigger } = setup()
		fire("pointerdown", "touch")
		t.advance(699)
		expect(m.getSnapshot().open).toBe(false)
		t.advance(1)
		expect(m.getSnapshot().open).toBe(true)
		fire("pointerup", "touch")
		fire("pointerleave", "touch")
		t.advance(1499)
		expect(m.getSnapshot().open).toBe(true)
		t.advance(1)
		expect(m.getSnapshot().open).toBe(false)
		stop()
		trigger.remove()
	})
	it("a short tap does nothing; custom delays; mouse presses and a disabled tooltip are ignored", () => {
		const { t, m, fire, stop, trigger } = setup({ enterTouchDelay: 100, leaveTouchDelay: 50 })
		fire("pointerdown", "touch")
		t.advance(50)
		fire("pointerup", "touch")
		t.advance(5000)
		expect(m.getSnapshot().open).toBe(false)
		fire("pointerdown", "mouse")
		fire("pointerup", "mouse")
		t.advance(5000)
		expect(m.getSnapshot().open).toBe(false)
		fire("pointerdown", "touch")
		fire("pointercancel", "touch")
		t.advance(1000)
		expect(m.getSnapshot().open).toBe(false)
		fire("pointerdown", "touch")
		t.advance(100)
		expect(m.getSnapshot().open).toBe(true)
		fire("pointerup", "touch")
		t.advance(50)
		expect(m.getSnapshot().open).toBe(false)
		m.setProps({ disabled: true })
		fire("pointerdown", "touch")
		t.advance(1000)
		expect(m.getSnapshot().open).toBe(false)
		fire("pointerdown", "touch")
		stop() // clears a pending hold
		m.dispose()
		trigger.remove()
	})
})
