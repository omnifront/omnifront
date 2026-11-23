import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, Directive, OnChanges, booleanAttribute, inject } from "@angular/core"
import { ICON_PATHS, displayPart, sortLabelPart, tablePaginationState, type Part } from "@omnifront/ui"
import { OmniIconButton } from "./button-group"
import { PartHost } from "./display"
import { OmniIds } from "./theme"

/**
 * A real `<table>`: `<table omni-table>` with native `thead`, `tbody`, `tfoot` and `tr`. Cells are
 * `td[omni-table-cell]` and `th[omni-table-cell]`; a cell in `thead` or `tfoot` is styled by where
 * it is, so no extra input is needed.
 */
@Directive({ selector: "table[omni-table]", standalone: true })
export class OmniTable extends PartHost implements OnChanges {
	@Input() size: "small" | "medium" | undefined
	/** Keep the header row at the top while the container scrolls. */
	@Input({ transform: booleanAttribute }) stickyHeader = false

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		const p = this.defaults("OmniTable", { size: this.size })
		return displayPart("omni-table", { size: p.size === "small" ? "small" : undefined, stickyHeader: this.stickyHeader || undefined })
	}
}

/** A box around a table that scrolls sideways when the table is wider than the space. */
@Directive({ selector: "[omni-table-container]", standalone: true, host: { class: "omni-table-container" } })
export class OmniTableContainer {}

@Directive({ selector: "tr[omni-table-row]", standalone: true, host: { "[attr.aria-selected]": "selected ? 'true' : null" } })
export class OmniTableRow extends PartHost implements OnChanges {
	/** Tint on hover. */
	@Input({ transform: booleanAttribute }) hover = false
	@Input({ transform: booleanAttribute }) selected = false

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		return displayPart("omni-table__row", { hover: this.hover || undefined, selected: this.selected || undefined })
	}
}

@Directive({ selector: "td[omni-table-cell], th[omni-table-cell]", standalone: true, host: { "[attr.aria-sort]": "sortDirection ? (sortDirection === 'asc' ? 'ascending' : 'descending') : null" } })
export class OmniTableCell extends PartHost implements OnChanges {
	@Input() align: "left" | "center" | "right" | "justify" | undefined
	/** `checkbox` makes a narrow cell for a Checkbox; `none` takes the padding off. */
	@Input() padding: "normal" | "checkbox" | "none" | undefined
	/** Only needed to force a look: the position in `thead` or `tfoot` already decides. */
	@Input() variant: "head" | "body" | "footer" | undefined
	/** The column's sort order, for a header cell: written as `aria-sort`. Pair it with `omni-table-sort-label`. */
	@Input() sortDirection: "asc" | "desc" | false | undefined
	/** Whether the author wrote `scope` themselves (the binding must not treat our own attribute as theirs). */
	private readonly authorScope = this.element.hasAttribute("scope")

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		const p = this.defaults("OmniTableCell", { align: this.align, padding: this.padding })
		return displayPart(
			"omni-table__cell",
			{ variant: this.variant, align: p.align && p.align !== "left" ? p.align : undefined, padding: p.padding && p.padding !== "normal" ? p.padding : undefined },
			// A header cell names its column unless the author said otherwise (`scope="row"`).
			this.element.tagName === "TH" && !this.authorScope ? { scope: "col" } : {},
		)
	}
}

/** The text of a column header as a button, with a direction arrow: `<button omni-table-sort-label [active]="by === 'name'" [direction]="dir" (click)="sort('name')">Name</button>`. Sorting is yours. */
@Component({
	selector: "button[omni-table-sort-label]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<ng-content /><svg class="omni-table__sort-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path [attr.d]="arrowPath" /></svg>`,
})
export class OmniTableSortLabel extends PartHost implements OnChanges {
	/** This column is the one the table is sorted by. */
	@Input({ transform: booleanAttribute }) active = false
	@Input() direction: "asc" | "desc" | undefined
	protected readonly arrowPath = ICON_PATHS.arrowUpward

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		return sortLabelPart({ active: this.active || undefined, direction: this.direction })
	}
}

export interface TablePageChange {
	event: Event | undefined
	page: number
}

/**
 * The bottom row of a table: `<td omni-table-pagination [count]="23" [page]="page" [rowsPerPage]="rows" (pageChange)="…" (rowsPerPageChange)="…">`.
 * Put it in a `tfoot` row; it is always controlled.
 */
@Component({
	selector: "td[omni-table-pagination]",
	standalone: true,
	imports: [OmniIconButton],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { "[attr.colspan]": "colSpan" },
	template: `
		<div class="omni-table-pagination">
			<span class="omni-table-pagination__spacer"></span>
			@if (rowsPerPageOptions.length > 0) {
				<div class="omni-table-pagination__rows">
					<label [attr.for]="id + '-rows'">{{ labelRowsPerPage }}</label>
					<select [id]="id + '-rows'" class="omni-table-pagination__select" (change)="rowsChanged($event)">
						@for (n of rowsPerPageOptions; track n) {<option [value]="n" [selected]="n === rowsPerPage">{{ n }}</option>}
					</select>
				</div>
			}
			<span aria-live="polite">{{ info().label }}</span>
			<div class="omni-table-pagination__actions">
				<button omni-icon-button aria-label="Go to previous page" [disabled]="!info().canPrevious" (click)="go($event, page - 1)"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path [attr.d]="leftPath" /></svg></button>
				<button omni-icon-button aria-label="Go to next page" [disabled]="!info().canNext" (click)="go($event, page + 1)"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path [attr.d]="rightPath" /></svg></button>
			</div>
		</div>
	`,
})
export class OmniTablePagination extends PartHost implements OnChanges {
	/** Total rows; -1 when unknown. */
	@Input() count = 0
	/** 0-based. */
	@Input() page = 0
	@Input() rowsPerPage = 10
	/** The choices of the rows-per-page select. Default 10, 25, 50, 100. Empty hides it. */
	@Input() rowsPerPageOptions: number[] = [10, 25, 50, 100]
	@Input() labelRowsPerPage = "Rows per page:"
	@Input() colSpan = 1000
	@Output() pageChange = new EventEmitter<number>()
	@Output() changed = new EventEmitter<TablePageChange>()
	@Output() rowsPerPageChange = new EventEmitter<number>()
	protected readonly id = inject(OmniIds).create()
	protected readonly leftPath = ICON_PATHS.chevronLeft
	protected readonly rightPath = ICON_PATHS.chevronRight
	protected info = (): ReturnType<typeof tablePaginationState> => tablePaginationState({ count: this.count, page: this.page, rowsPerPage: this.rowsPerPage })

	ngOnChanges(): void {
		this.apply()
	}

	protected go(event: Event, page: number): void {
		this.changed.emit({ event, page })
		this.pageChange.emit(page)
	}

	protected rowsChanged(event: Event): void {
		this.rowsPerPageChange.emit(Number((event.target as HTMLSelectElement).value))
	}

	protected part(): Part {
		return displayPart("omni-table__cell", { variant: "footer", padding: "none" })
	}
}
