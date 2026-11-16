import { displayPart } from "@omnifront/ui"
import { createContext, forwardRef, useContext, type ComponentPropsWithoutRef, type ElementType } from "react"
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
	/** Make a row header: `<TableCell component="th" scope="row">`. */
	component?: ElementType | undefined
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(rawProps, ref) {
	const { align, padding, variant, component, className, scope, ...rest } = useDefaultProps("OmniTableCell", rawProps)
	const section = useContext(SectionContext)
	const kind = variant ?? section
	const Tag = component ?? (kind === "head" ? "th" : "td")
	const part = displayPart("omni-table__cell", { variant: kind, align: align && align !== "left" ? align : undefined, padding: padding && padding !== "normal" ? padding : undefined })
	return <Tag {...mergeProps(toReactProps(part), { ...rest, scope: scope ?? (Tag === "th" && kind === "head" ? "col" : undefined), className })} ref={ref} />
})
