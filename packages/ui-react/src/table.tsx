import { ICON_PATHS, displayPart, sortLabelPart, tablePaginationState } from "@omnifront/ui"
import { createContext, forwardRef, useContext, useId, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react"
import { IconButton } from "./icon-buttons"
import { mergeProps, toReactProps } from "./internal"
import { useDefaultProps } from "./theme"

type Section = "head" | "body" | "footer"
/** Which part of the table a cell is in, so it can be a `th` in the head without saying so. */
const SectionContext = createContext<Section>("body")

export interface TableProps extends ComponentPropsWithoutRef<"table"> {
	size?: "small" | "medium" | undefined
	/** Keep the header row at the top while the container scrolls. */
	stickyHeader?: boolean | undefined
}

/** A real `<table>`. Build it from TableHead, TableBody, TableFooter, TableRow and TableCell. */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(rawProps, ref) {
	const { size, stickyHeader, className, ...rest } = useDefaultProps("OmniTable", rawProps)
	return <table {...mergeProps(toReactProps(displayPart("omni-table", { size: size === "small" ? "small" : undefined, stickyHeader })), { ...rest, className })} ref={ref} />
})

/** A box around a Table that scrolls sideways when the table is wider than the space. */
export const TableContainer = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function TableContainer({ className, ...rest }, ref) {
	return <div {...mergeProps(toReactProps(displayPart("omni-table-container")), { ...rest, className })} ref={ref} />
})

export const TableHead = forwardRef<HTMLTableSectionElement, ComponentPropsWithoutRef<"thead">>(function TableHead(props, ref) {
	return (
		<SectionContext.Provider value="head">
			<thead {...props} ref={ref} />
		</SectionContext.Provider>
	)
})

export const TableBody = forwardRef<HTMLTableSectionElement, ComponentPropsWithoutRef<"tbody">>(function TableBody(props, ref) {
	return (
		<SectionContext.Provider value="body">
			<tbody {...props} ref={ref} />
		</SectionContext.Provider>
	)
})

export const TableFooter = forwardRef<HTMLTableSectionElement, ComponentPropsWithoutRef<"tfoot">>(function TableFooter(props, ref) {
	return (
		<SectionContext.Provider value="footer">
			<tfoot {...props} ref={ref} />
		</SectionContext.Provider>
	)
})

export interface TableRowProps extends ComponentPropsWithoutRef<"tr"> {
	/** Tint on hover. */
	hover?: boolean | undefined
	selected?: boolean | undefined
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow({ hover, selected, className, ...rest }, ref) {
	return <tr {...mergeProps(toReactProps(displayPart("omni-table__row", { hover, selected })), { ...rest, "aria-selected": selected ? true : undefined, className })} ref={ref} />
})

export interface TableCellProps extends Omit<ComponentPropsWithoutRef<"td">, "align"> {
	align?: "left" | "center" | "right" | "justify" | undefined
	/** `checkbox` makes a narrow cell for a Checkbox; `none` takes the padding off. */
	padding?: "normal" | "checkbox" | "none" | undefined
	/** Defaults to where the cell is: `head` in a TableHead (a `th` with `scope="col"`), `footer` in a TableFooter, else `body`. */
	variant?: Section | undefined
	/** The column's sort order, for a header cell: written as `aria-sort`. Pair it with TableSortLabel. */
	sortDirection?: "asc" | "desc" | false | undefined
	/** Make a row header: `<TableCell component="th" scope="row">`. */
	component?: ElementType | undefined
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(rawProps, ref) {
	const { align, padding, variant, component, className, scope, sortDirection, ...rest } = useDefaultProps("OmniTableCell", rawProps)
	const section = useContext(SectionContext)
	const kind = variant ?? section
	const Tag = component ?? (kind === "head" ? "th" : "td")
	const part = displayPart("omni-table__cell", { variant: kind, align: align && align !== "left" ? align : undefined, padding: padding && padding !== "normal" ? padding : undefined })
	return <Tag {...mergeProps(toReactProps(part), { ...rest, scope: scope ?? (Tag === "th" && kind === "head" ? "col" : undefined), "aria-sort": sortDirection ? (sortDirection === "asc" ? "ascending" : "descending") : undefined, className })} ref={ref} />
})

export interface TableSortLabelProps extends Omit<ComponentPropsWithoutRef<"button">, "color"> {
	/** This column is the one the table is sorted by. */
	active?: boolean | undefined
	direction?: "asc" | "desc" | undefined
}

/** The text of a column header as a button, with a direction arrow. Sorting is yours: set `active` and `direction` and put `sortDirection` on the TableCell. */
export const TableSortLabel = forwardRef<HTMLButtonElement, TableSortLabelProps>(function TableSortLabel({ active, direction, className, children, ...rest }, ref) {
	return (
		<button {...mergeProps(toReactProps(sortLabelPart({ active, direction })), { ...rest, className })} ref={ref}>
			{children}
			<svg className="omni-table__sort-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
				<path d={ICON_PATHS.arrowUpward} />
			</svg>
		</button>
	)
})

export interface TablePaginationProps extends Omit<ComponentPropsWithoutRef<"td">, "onChange"> {
	/** Total rows; -1 when unknown. */
	count: number
	/** 0-based. */
	page: number
	rowsPerPage: number
	onPageChange: (event: Event | undefined, page: number) => void
	/** The choices of the rows-per-page select. Default 10, 25, 50, 100. Empty hides it. */
	rowsPerPageOptions?: number[] | undefined
	onRowsPerPageChange?: ((rowsPerPage: number) => void) | undefined
	labelRowsPerPage?: ReactNode | undefined
}

/** The bottom row of a table: "Rows per page", "1–10 of 95", and previous and next buttons. Put it in a `TableFooter` row; it is always controlled. */
export const TablePagination = forwardRef<HTMLTableCellElement, TablePaginationProps>(function TablePagination(rawProps, ref) {
	const { count, page, rowsPerPage, onPageChange, rowsPerPageOptions = [10, 25, 50, 100], onRowsPerPageChange, labelRowsPerPage = "Rows per page:", colSpan = 1000, className, ...rest } = useDefaultProps("OmniTablePagination", rawProps)
	const id = useId()
	const s = tablePaginationState({ count, page, rowsPerPage })
	const go = (event: Event | undefined, next: number): void => onPageChange(event, next)
	return (
		<td {...mergeProps(toReactProps(displayPart("omni-table__cell", { variant: "footer", padding: "none" })), { ...rest, colSpan, className })} ref={ref}>
			<div className="omni-table-pagination">
				<span className="omni-table-pagination__spacer" />
				{rowsPerPageOptions.length > 0 && (
					<div className="omni-table-pagination__rows">
						<label htmlFor={`${id}-rows`}>{labelRowsPerPage}</label>
						<select id={`${id}-rows`} className="omni-table-pagination__select" value={rowsPerPage} onChange={(e) => onRowsPerPageChange?.(Number(e.target.value))}>
							{rowsPerPageOptions.map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</div>
				)}
				<span aria-live="polite">{s.label}</span>
				<div className="omni-table-pagination__actions">
					<IconButton aria-label="Go to previous page" disabled={!s.canPrevious} onClick={(e) => go(e.nativeEvent, page - 1)}>
						<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={ICON_PATHS.chevronLeft} /></svg>
					</IconButton>
					<IconButton aria-label="Go to next page" disabled={!s.canNext} onClick={(e) => go(e.nativeEvent, page + 1)}>
						<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={ICON_PATHS.chevronRight} /></svg>
					</IconButton>
				</div>
			</div>
		</td>
	)
})
