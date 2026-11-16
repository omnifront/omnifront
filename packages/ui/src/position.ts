import { arrow, autoUpdate, computePosition, flip, offset, shift, size, type Placement } from "@floating-ui/dom"

export type { Placement }

export interface PositionOptions {
	placement?: Placement
	/** Gap between anchor and floating element, in px. */
	offset?: number
	/** Copy the anchor's width to `--omni-anchor-width` (menus and selects use it). */
	matchWidth?: boolean
	/** Point the `[data-arrow]` element inside the floating one at the anchor (it stays on the anchor even after the box shifted). */
	arrow?: boolean
}

/**
 * Place `floating` next to `anchor` and keep it there while the page scrolls or resizes, flipping
 * to the other side and shifting to stay inside the viewport. Uses `position: fixed`, so the
 * floating element can live in a portal at the end of `<body>`. Returns the cleanup.
 * Lives in its own entry so floating-ui stays out of bundles that never position anything.
 */
export function autoPosition(anchor: Element, floating: HTMLElement, options: PositionOptions = {}): () => void {
	floating.style.position = "fixed"
	const arrowEl = options.arrow ? floating.querySelector<HTMLElement>("[data-arrow]") : null
	const update = (): void => {
		void computePosition(anchor, floating, {
			strategy: "fixed",
			placement: options.placement ?? "bottom-start",
			middleware: [
				offset(options.offset ?? 0),
				flip({ padding: 8 }),
				shift({ padding: 8 }),
				...(arrowEl ? [arrow({ element: arrowEl, padding: 6 })] : []),
				size({
					padding: 8,
					apply({ availableHeight, rects }) {
						floating.style.setProperty("--omni-available-height", `${Math.max(0, availableHeight)}px`)
						if (options.matchWidth) floating.style.setProperty("--omni-anchor-width", `${rects.reference.width}px`)
					},
				}),
			],
		}).then(({ x, y, placement, middlewareData }) => {
			if (arrowEl) {
				const a = middlewareData.arrow
				arrowEl.style.left = a?.x != null ? `${a.x}px` : ""
				arrowEl.style.top = a?.y != null ? `${a.y}px` : ""
			}
			floating.style.left = `${x}px`
			floating.style.top = `${y}px`
			floating.setAttribute("data-placement", placement)
		})
	}
	return autoUpdate(anchor, floating, update)
}
