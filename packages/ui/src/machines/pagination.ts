import { Machine, part, type Part } from "./machine"

export type PaginationItemType = "page" | "first" | "previous" | "next" | "last" | "start-ellipsis" | "end-ellipsis"

export interface PaginationItem {
	type: PaginationItemType
	/** The page it goes to (`page`, `first`, `previous`, `next`, `last`); `null` for an ellipsis. */
	page: number | null
	selected: boolean
	disabled: boolean
}

export interface PaginationItemsOptions {
	count: number
	page: number
	disabled?: boolean | undefined
	siblingCount?: number | undefined
	boundaryCount?: number | undefined
	showFirstButton?: boolean | undefined
	showLastButton?: boolean | undefined
	hidePrevButton?: boolean | undefined
	hideNextButton?: boolean | undefined
}

const range = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i)

/**
 * The buttons of a pagination bar, in order: first, previous, the first `boundaryCount` pages, an
 * ellipsis (or the one page it would hide), `siblingCount` pages around the current one, another
 * ellipsis, the last `boundaryCount` pages, next, last. The ellipsis never hides just one page.
 */
export function paginationItems(o: PaginationItemsOptions): PaginationItem[] {
	const { count, page, disabled = false, siblingCount = 1, boundaryCount = 1, showFirstButton, showLastButton, hidePrevButton, hideNextButton } = o
	const start = range(1, Math.min(boundaryCount, count))
	const end = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count)
	const siblingsStart = Math.max(Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1), boundaryCount + 2)
	const siblingsEnd = Math.min(Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2), end.length > 0 ? (end[0] as number) - 2 : count - 1)
	const slots: Array<number | "first" | "previous" | "next" | "last" | "start-ellipsis" | "end-ellipsis"> = [
		...(showFirstButton ? (["first"] as const) : []),
		...(hidePrevButton ? [] : (["previous"] as const)),
		...start,
		...(siblingsStart > boundaryCount + 2 ? (["start-ellipsis"] as const) : boundaryCount + 1 < count - boundaryCount ? [boundaryCount + 1] : []),
		...range(siblingsStart, siblingsEnd),
		...(siblingsEnd < count - boundaryCount - 1 ? (["end-ellipsis"] as const) : count - boundaryCount > boundaryCount ? [count - boundaryCount] : []),
		...end,
		...(hideNextButton ? [] : (["next"] as const)),
		...(showLastButton ? (["last"] as const) : []),
	]
	return slots.map((slot): PaginationItem => {
		if (typeof slot === "number") return { type: "page", page: slot, selected: slot === page, disabled }
		switch (slot) {
			case "first":
				return { type: slot, page: 1, selected: false, disabled: disabled || page <= 1 }
			case "previous":
				return { type: slot, page: page - 1, selected: false, disabled: disabled || page <= 1 }
			case "next":
				return { type: slot, page: page + 1, selected: false, disabled: disabled || page >= count }
			case "last":
				return { type: slot, page: count, selected: false, disabled: disabled || page >= count }
			default:
				return { type: slot, page: null, selected: false, disabled }
		}
	})
}

export interface PaginationProps {
	/** Number of pages. */
	count: number
	/** 1-based. Controlled; leave undefined to let the machine keep it. */
	page?: number | undefined
	defaultPage?: number | undefined
	disabled?: boolean | undefined
	siblingCount?: number | undefined
	boundaryCount?: number | undefined
	showFirstButton?: boolean | undefined
	showLastButton?: boolean | undefined
	hidePrevButton?: boolean | undefined
	hideNextButton?: boolean | undefined
	variant?: "text" | "outlined" | undefined
	shape?: "circular" | "rounded" | undefined
	size?: "small" | "medium" | "large" | undefined
	color?: "standard" | "primary" | "secondary" | undefined
	/** `aria-label` of the `<nav>`. Default "pagination navigation". */
	label?: string | undefined
	onPageChange?: ((page: number, event?: Event) => void) | undefined
}

export interface PaginationState {
	page: number
	count: number
	disabled: boolean
	items: PaginationItem[]
}

const ITEM_LABEL: Record<"first" | "previous" | "next" | "last", string> = {
	first: "Go to first page",
	previous: "Go to previous page",
	next: "Go to next page",
	last: "Go to last page",
}

/** Page state and the list of buttons for a Pagination bar. The page is 1-based. */
export class Pagination extends Machine<PaginationProps, PaginationState> {
	private internal: number

	constructor(props: PaginationProps) {
		super(props)
		this.internal = props.defaultPage ?? 1
		this.start()
	}

	protected compute(): PaginationState {
		const p = this.props
		const page = p.page ?? this.internal
		const items = paginationItems({ ...p, page })
		return { page, count: p.count, disabled: p.disabled === true, items: this.same(items) }
	}

	/** Reuse the previous list when no button changed (snapshots are compared by reference). */
	private same(next: PaginationItem[]): PaginationItem[] {
		const prev = this.peek()?.items
		const eq = prev && prev.length === next.length && prev.every((a, i) => {
			const b = next[i] as PaginationItem
			return a.type === b.type && a.page === b.page && a.selected === b.selected && a.disabled === b.disabled
		})
		return eq ? (prev as PaginationItem[]) : next
	}

	goTo = (page: number, event?: Event): void => {
		const target = Math.min(Math.max(1, page), Math.max(1, this.props.count))
		if (target === this.getSnapshot().page || this.props.disabled) return
		this.props.onPageChange?.(target, event)
		if (this.props.page === undefined) {
			this.internal = target
			this.refresh()
		}
	}

	connect(): { root: Part; list: Part; item: (item: PaginationItem) => Part } {
		const { variant = "text", shape = "circular", size = "medium", color = "standard" } = this.props
		return {
			root: part({ class: "omni-pagination", "aria-label": this.props.label ?? "pagination navigation", "data-variant": variant, "data-shape": shape, "data-size": size, "data-color": color }),
			list: part({ class: "omni-pagination__list" }),
			item: (item) => {
				if (item.page === null) return part({ class: "omni-pagination__ellipsis" })
				const label = item.type === "page" ? (item.selected ? `page ${item.page}` : `Go to page ${item.page}`) : ITEM_LABEL[item.type as "first" | "previous" | "next" | "last"]
				return part(
					{
						class: "omni-pagination__item",
						type: "button",
						"aria-label": label,
						"aria-current": item.selected ? "page" : undefined,
						disabled: item.disabled ? true : undefined,
						"data-type": item.type,
						"data-selected": item.selected ? "" : undefined,
					},
					{ click: (event) => this.goTo(item.page as number, event) },
				)
			},
		}
	}
}

export const createPagination = (props: PaginationProps): Pagination => new Pagination(props)
