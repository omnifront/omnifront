import type { QueryClient } from "@omnifront/query"
import { createDevtoolsModel, type DevtoolsQuery } from "./index"

export interface DevtoolsPanelOptions {
	/** Start expanded. Default false. */
	initiallyOpen?: boolean
	/** Where to attach the panel. Default `document.body`. */
	container?: HTMLElement
	/** How often (ms) to look for cache changes while the panel is open. Default 500. */
	interval?: number
}

export interface DevtoolsPanel {
	open(): void
	close(): void
	/** Remove the panel and stop watching. */
	destroy(): void
}

const STYLE = `
:host { all: initial; position: fixed; right: 12px; bottom: 12px; z-index: 2147483000; font: 12px/1.4 system-ui, sans-serif; color: #1c1c1e; }
* { box-sizing: border-box; }
button { font: inherit; cursor: pointer; }
.toggle { padding: 6px 10px; border-radius: 999px; border: 1px solid #8884; background: #fff; box-shadow: 0 2px 8px #0003; }
.panel { width: 380px; max-height: 70vh; display: flex; flex-direction: column; background: #fff; border: 1px solid #8886; border-radius: 8px; box-shadow: 0 6px 24px #0004; overflow: hidden; }
.head { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #f2f2f7; font-weight: 600; }
.list { overflow: auto; flex: 1; min-height: 60px; }
.row { display: flex; gap: 6px; align-items: center; width: 100%; text-align: left; padding: 5px 10px; border: 0; border-bottom: 1px solid #8882; background: none; }
.row[aria-pressed="true"] { background: #e8f0fe; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: #999; }
.dot.success { background: #34c759; } .dot.error { background: #ff3b30; } .dot.loading { background: #ff9f0a; }
.key { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, monospace; }
.tag { font-size: 10px; padding: 0 5px; border-radius: 8px; background: #8883; }
.detail { padding: 8px 10px; border-top: 1px solid #8884; overflow: auto; max-height: 40%; }
.detail pre { margin: 6px 0; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, monospace; }
.empty { padding: 12px 10px; color: #6e6e73; }
`

const show = (value: unknown): string => {
	if (value instanceof Error) return `${value.name}: ${value.message}` // JSON.stringify(error) is "{}"
	try {
		const text = JSON.stringify(value, null, 2) ?? String(value)
		return text.length > 20_000 ? `${text.slice(0, 20_000)}\n… (truncated)` : text
	} catch {
		return String(value) // circular or otherwise not JSON
	}
}

/**
 * A small cache inspector drawn with plain DOM inside a shadow root (no framework, no style
 * leaks). Meant for development: `if (import.meta.env.DEV) mountDevtools(client)`.
 * All text goes in through `textContent`; nothing from your data is ever parsed as HTML.
 */
export function mountDevtools(client: QueryClient, options: DevtoolsPanelOptions = {}): DevtoolsPanel {
	const model = createDevtoolsModel(client, options.interval)
	const host = document.createElement("div")
	host.setAttribute("data-omnifront-devtools", "")
	const root = host.attachShadow({ mode: "open" })
	const style = document.createElement("style")
	style.textContent = STYLE
	const view = document.createElement("div")
	root.append(style, view)
	;(options.container ?? document.body).append(host)

	let opened = options.initiallyOpen ?? false
	let selected: string | undefined
	let stopWatching: (() => void) | undefined

	const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] => {
		const node = document.createElement(tag)
		if (className) node.className = className
		if (text !== undefined) node.textContent = text
		return node
	}

	function row(query: DevtoolsQuery): HTMLElement {
		const button = el("button", "row")
		button.setAttribute("aria-pressed", String(query.hash === selected))
		button.append(el("span", `dot ${query.state.status}`), el("span", "key", query.hash))
		if (query.state.isFetching) button.append(el("span", "tag", "fetching"))
		if (query.state.isInvalidated) button.append(el("span", "tag", "invalidated"))
		button.append(el("span", "tag", query.observed ? "observed" : "idle"))
		button.addEventListener("click", () => {
			selected = query.hash
			render()
		})
		return button
	}

	function detail(query: DevtoolsQuery): HTMLElement {
		const box = el("div", "detail")
		const { state } = query
		box.append(
			el("div", undefined, `status: ${state.status} · failures: ${state.failureCount}${state.dataUpdatedAt === undefined ? "" : ` · updated: ${new Date(state.dataUpdatedAt).toLocaleTimeString()}`}`),
		)
		const invalidate = el("button", undefined, "Invalidate")
		invalidate.addEventListener("click", () => void model.invalidate(query.queryKey))
		const cancel = el("button", undefined, "Cancel")
		cancel.addEventListener("click", () => model.cancel(query.queryKey))
		box.append(invalidate, " ", cancel)
		if (state.error !== undefined) box.append(el("pre", undefined, `error: ${show(state.error)}`))
		box.append(el("pre", undefined, show(state.data)))
		return box
	}

	function render(): void {
		view.replaceChildren()
		const { queries } = model.getSnapshot()
		if (!opened) {
			const toggle = el("button", "toggle", `omnifront · ${queries.length}`)
			toggle.addEventListener("click", () => panel.open())
			view.append(toggle)
			return
		}
		const panelEl = el("div", "panel")
		const head = el("div", "head")
		head.append(el("span", undefined, `omnifront · ${queries.length} ${queries.length === 1 ? "query" : "queries"}`))
		const close = el("button", undefined, "×")
		close.setAttribute("aria-label", "Close")
		close.addEventListener("click", () => panel.close())
		head.append(close)
		const list = el("div", "list")
		if (queries.length === 0) list.append(el("div", "empty", "The cache is empty."))
		queries.forEach((query) => list.append(row(query)))
		panelEl.append(head, list)
		const current = queries.find((query) => query.hash === selected)
		if (current) panelEl.append(detail(current))
		view.append(panelEl)
	}

	const panel: DevtoolsPanel = {
		open() {
			opened = true
			watch()
			render()
		},
		close() {
			opened = false
			unwatch()
			render()
		},
		destroy() {
			unwatch()
			host.remove()
		},
	}
	// Watch the cache only while the panel is open: a collapsed toggle costs no timers.
	function watch(): void {
		stopWatching ??= model.subscribe(render)
	}
	function unwatch(): void {
		stopWatching?.()
		stopWatching = undefined
	}

	if (opened) watch()
	render()
	return panel
}
