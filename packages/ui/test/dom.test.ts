import { afterEach, describe, expect, it, vi } from "vitest"
import {
	attachRipple,
	buttonPart,
	colorSchemeScript,
	createColorSchemeStore,
	createIdGenerator,
	createPortalRoot,
	createTheme,
	applyTheme,
	getTabbables,
	hideOthers,
	lockScroll,
	pushLayer,
} from "../src"
import { autoPosition } from "../src/position"

afterEach(() => {
	document.body.innerHTML = ""
	document.body.removeAttribute("style")
	document.documentElement.removeAttribute("data-omni-color-scheme")
	localStorage.clear()
	vi.restoreAllMocks()
	vi.useRealTimers()
})

describe("utilities", () => {
	it("createIdGenerator counts per generator", () => {
		const a = createIdGenerator()
		const b = createIdGenerator("x")
		expect([a(), a(), b()]).toEqual(["omni-1", "omni-2", "x-1"])
	})

	it("getTabbables skips disabled, hidden, inert and aria-hidden elements", () => {
		document.body.innerHTML = `
			<button id="ok">a</button><button disabled>b</button><a href="#">c</a><input type="hidden">
			<div tabindex="-1">d</div><div hidden><button>e</button></div><div aria-hidden="true" tabindex="0">f</div>`
		expect(getTabbables(document.body).map((e) => e.tagName)).toEqual(["BUTTON", "A"])
	})

	it("lockScroll is counted: the last release unlocks", () => {
		document.body.style.overflow = "auto"
		const a = lockScroll()
		const b = lockScroll()
		expect(document.body.style.overflow).toBe("hidden")
		a()
		a() // twice is harmless
		expect(document.body.style.overflow).toBe("hidden")
		b()
		expect(document.body.style.overflow).toBe("auto")
	})

	it("lockScroll keeps the scrollbar's width as padding", () => {
		Object.defineProperty(window, "innerWidth", { value: 1015, configurable: true })
		Object.defineProperty(document.documentElement, "clientWidth", { value: 1000, configurable: true })
		const release = lockScroll()
		expect(document.body.style.paddingInlineEnd).toBe("15px")
		release()
		expect(document.body.style.paddingInlineEnd).toBe("")
	})

	it("pushLayer: the latest layer is on top until it is removed", () => {
		const a = pushLayer()
		const b = pushLayer()
		expect([a.isTop(), b.isTop()]).toEqual([false, true])
		b.remove()
		b.remove()
		expect(a.isTop()).toBe(true)
		a.remove()
	})

	it("hideOthers hides every other top-level element and restores the old values", () => {
		document.body.innerHTML = `<main id="a"></main><aside id="b" aria-hidden="false"></aside><script></script><div id="keep"><div id="inner"></div></div>`
		const restore = hideOthers(document.getElementById("inner") as HTMLElement)
		expect(document.getElementById("a")?.getAttribute("aria-hidden")).toBe("true")
		expect(document.getElementById("b")?.getAttribute("aria-hidden")).toBe("true")
		expect(document.getElementById("keep")?.hasAttribute("aria-hidden")).toBe(false)
		restore()
		expect(document.getElementById("a")?.hasAttribute("aria-hidden")).toBe(false)
		expect(document.getElementById("b")?.getAttribute("aria-hidden")).toBe("false")
	})

	it("createPortalRoot appends a marked div with the given attributes", () => {
		const root = createPortalRoot({ "data-omni-theme": "t1", "data-omni-color-scheme": undefined })
		expect(root.element.parentElement).toBe(document.body)
		expect(root.element.hasAttribute("data-omni-portal")).toBe(true)
		expect(root.element.getAttribute("data-omni-theme")).toBe("t1")
		expect(root.element.hasAttribute("data-omni-color-scheme")).toBe(false)
		root.remove()
		expect(document.querySelector("[data-omni-portal]")).toBeNull()
	})

	it("applyTheme writes the variables on an element", () => {
		const el = document.createElement("div")
		applyTheme(createTheme(), el)
		expect(el.style.getPropertyValue("--omni-palette-primary-main")).toBe("#1976d2")
		expect(el.style.getPropertyValue("--omni-spacing")).toBe("8px")
	})
})

describe("ripple", () => {
	function target() {
		const el = document.createElement("button")
		el.getBoundingClientRect = () => ({ width: 100, height: 40, left: 10, top: 10, right: 110, bottom: 50, x: 10, y: 10, toJSON() {} })
		document.body.append(el)
		return el
	}
	const press = (el: Element, init: PointerEventInit = {}): void =>
		void el.dispatchEvent(Object.assign(new Event("pointerdown", { bubbles: true }), { button: 0, clientX: 30, clientY: 20, ...init }))

	it("adds a ripple under the pointer and removes it when the animation ends", () => {
		const el = target()
		attachRipple(el)
		press(el)
		const ripple = el.querySelector(".omni-ripple") as HTMLElement
		expect(ripple.style.width).toBe("200px")
		expect(ripple.style.left).toBe("-80px") // x = 20, minus half of 200
		ripple.dispatchEvent(new Event("animationend"))
		expect(el.querySelector(".omni-ripple")).toBeNull()
	})

	it("centres for keyboard clicks (no pointer position) and when asked", () => {
		const el = target()
		attachRipple(el, { centered: true })
		press(el)
		expect((el.querySelector(".omni-ripple") as HTMLElement).style.left).toBe("-50px")
		const key = target()
		attachRipple(key)
		press(key, { clientX: 0, clientY: 0 })
		expect((key.querySelector(".omni-ripple") as HTMLElement).style.top).toBe("-80px")
	})

	it("ignores non-primary buttons and disabled elements, and removes itself after a second when no animation runs", () => {
		vi.useFakeTimers()
		const el = target()
		const off = attachRipple(el)
		press(el, { button: 2 })
		el.setAttribute("aria-disabled", "true")
		press(el)
		el.removeAttribute("aria-disabled")
		el.setAttribute("disabled", "")
		press(el)
		expect(el.querySelector(".omni-ripple")).toBeNull()
		el.removeAttribute("disabled")
		press(el)
		expect(el.querySelector(".omni-ripple")).not.toBeNull()
		vi.advanceTimersByTime(1000)
		expect(el.querySelector(".omni-ripple")).toBeNull()
		off()
		press(el)
		expect(el.querySelector(".omni-ripple")).toBeNull()
	})
})

describe("colour scheme store", () => {
	it("keeps the mode, writes the attribute and persists it", () => {
		const store = createColorSchemeStore({ defaultMode: "light", storageKey: "k", target: () => document.documentElement })
		expect(store.getState().mode).toBe("light")
		store.getState().setMode("dark")
		expect(store.getState().mode).toBe("dark")
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("dark")
		expect(localStorage.getItem("k")).toBe("dark")
	})

	it("restore applies the saved choice, or the default when nothing valid is saved", () => {
		localStorage.setItem("k", "dark")
		const a = createColorSchemeStore({ storageKey: "k", target: () => document.documentElement })
		expect(a.getState().mode).toBe("system") // before restore: the server-safe default
		a.restore()
		expect(a.getState().mode).toBe("dark")
		localStorage.setItem("k", "banana")
		const b = createColorSchemeStore({ storageKey: "k", target: () => document.documentElement })
		b.restore()
		expect(b.getState().mode).toBe("system")
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("system")
		createColorSchemeStore().restore() // no key, no target: nothing to do
	})

	it("survives storage that throws", () => {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("blocked")
		})
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("blocked")
		})
		const store = createColorSchemeStore({ storageKey: "k" })
		store.restore()
		store.getState().setMode("dark")
		expect(store.getState().mode).toBe("dark")
	})

	it("colorSchemeScript sets the attribute from storage, with a fallback", () => {
		const script = colorSchemeScript({ storageKey: "s", defaultMode: "light" })
		localStorage.setItem("s", "dark")
		new Function(script)()
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("dark")
		localStorage.setItem("s", "nope")
		new Function(script)()
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("light")
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("blocked")
		})
		document.documentElement.removeAttribute("data-omni-color-scheme")
		new Function(script)()
		expect(document.documentElement.getAttribute("data-omni-color-scheme")).toBe("light")
	})
})

describe("buttonPart", () => {
	it("has Material defaults and reads like data attributes", () => {
		const { attrs } = buttonPart()
		expect(attrs).toMatchObject({ class: "omni-button", "data-variant": "text", "data-color": "primary", "data-size": "medium", type: "button", disabled: undefined })
	})

	it("a disabled button is really disabled; a loading one stays focusable but aria-disabled", () => {
		expect(buttonPart({ disabled: true, type: "submit" }).attrs).toMatchObject({ disabled: true, type: "submit", "data-disabled": "" })
		expect(buttonPart({ loading: true }).attrs).toMatchObject({ disabled: undefined, "aria-disabled": "true", "data-loading": "" })
	})

	it("a link gets role=button and leaves the Tab order when inactive", () => {
		expect(buttonPart({ as: "a" }).attrs).toMatchObject({ role: "button", "aria-disabled": undefined, tabindex: undefined })
		expect(buttonPart({ as: "a", disabled: true, variant: "contained", fullWidth: true, disableElevation: true }).attrs).toMatchObject({
			"aria-disabled": "true",
			tabindex: -1,
			"data-full-width": "",
			"data-disable-elevation": "",
		})
		expect(buttonPart({ as: "a" }).attrs.type).toBeUndefined()
	})
})

describe("autoPosition", () => {
	it("places the floating element with fixed positioning and cleans up", async () => {
		document.body.innerHTML = `<button id="a"></button><div id="f"></div>`
		const anchor = document.getElementById("a") as HTMLElement
		const floating = document.getElementById("f") as HTMLElement
		const stop = autoPosition(anchor, floating, { placement: "bottom-end", offset: 4, matchWidth: true })
		expect(floating.style.position).toBe("fixed")
		await vi.waitFor(() => expect(floating.getAttribute("data-placement")).toMatch(/^(bottom|top)/))
		expect(floating.style.left).toMatch(/px$/)
		expect(floating.style.getPropertyValue("--omni-anchor-width")).toMatch(/px$/)
		stop()
		autoPosition(anchor, floating)() // defaults
	})
})
