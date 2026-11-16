import { Directive, Input, OnChanges, booleanAttribute } from "@angular/core"
import { displayPart, type Part } from "@omnifront/ui"
import { PartHost } from "./display"

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

@Directive({ selector: "td[omni-table-cell], th[omni-table-cell]", standalone: true })
export class OmniTableCell extends PartHost implements OnChanges {
	@Input() align: "left" | "center" | "right" | "justify" | undefined
	/** `checkbox` makes a narrow cell for a Checkbox; `none` takes the padding off. */
	@Input() padding: "normal" | "checkbox" | "none" | undefined
	/** Only needed to force a look: the position in `thead` or `tfoot` already decides. */
	@Input() variant: "head" | "body" | "footer" | undefined
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
