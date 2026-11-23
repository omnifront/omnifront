import { ChangeDetectionStrategy, Component, ContentChild, Directive, ElementRef, Input, OnChanges, OnDestroy, booleanAttribute, inject } from "@angular/core"
import { displayPart, type Part } from "@omnifront/ui"
import { PartHost } from "./display"
import { PartBinding } from "./part"

/** A list of rows: `<ul omni-list>` (or `ol`, `nav`) of `li[omni-list-item]`. */
@Directive({ selector: "[omni-list]", standalone: true })
export class OmniList extends PartHost implements OnChanges {
	/** Tighter rows. */
	@Input({ transform: booleanAttribute }) dense = false
	@Input({ transform: booleanAttribute }) disablePadding = false

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		return displayPart("omni-list", { dense: this.dense || undefined, disablePadding: this.disablePadding || undefined })
	}
}

/** Marks the element at the far end of a row (an IconButton): `<button omni-icon-button omniListItemAction>`. */
@Directive({ selector: "[omniListItemAction]", standalone: true })
export class OmniListItemAction {}

/** One row: `<li omni-list-item>`. Add an element with `omniListItemAction` for something at the far end. */
@Component({
	selector: "li[omni-list-item]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<ng-content />@if (action) {<div class="omni-list__action"><ng-content select="[omniListItemAction]" /></div>}`,
})
export class OmniListItem extends PartHost implements OnChanges {
	/** A line under the row. */
	@Input({ transform: booleanAttribute }) divider = false
	/** No padding: for a row whose `omni-list-item-button` does the padding. */
	@Input({ transform: booleanAttribute }) disablePadding = false
	@Input({ transform: booleanAttribute }) disableGutters = false
	/** `flex-start` aligns the icon, avatar and action with the first line of multi-line text. */
	@Input() alignItems: "center" | "flex-start" | undefined
	@ContentChild(OmniListItemAction) protected action: OmniListItemAction | undefined

	ngOnChanges(): void {
		this.apply()
	}

	ngAfterContentInit(): void {
		this.apply()
	}

	protected part(): Part {
		return displayPart("omni-list__item", {
			divider: this.divider || undefined,
			disablePadding: this.disablePadding || undefined,
			disableGutters: this.disableGutters || undefined,
			alignItems: this.alignItems === "flex-start" ? this.alignItems : undefined,
			secondaryAction: this.action !== undefined,
		})
	}
}

/** A row that can be pressed: `<button omni-list-item-button>` (or `<a omni-list-item-button href>`) inside a list item. */
@Directive({ selector: "button[omni-list-item-button], a[omni-list-item-button]", standalone: true })
export class OmniListItemButton implements OnChanges, OnDestroy {
	@Input({ transform: booleanAttribute }) selected = false
	@Input() alignItems: "center" | "flex-start" | undefined
	@Input({ transform: booleanAttribute }) disabled = false
	@Input() type: "button" | "submit" | "reset" | undefined

	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly binding = new PartBinding(this.element)

	constructor() {
		// Capture phase: a disabled row must not reach the user's (click) listener.
		this.element.addEventListener("click", this.guard, true)
		this.sync()
	}

	private readonly guard = (event: Event): void => {
		if (this.disabled) {
			event.preventDefault()
			event.stopImmediatePropagation()
		}
	}

	ngOnChanges(): void {
		this.sync()
	}

	ngOnDestroy(): void {
		this.element.removeEventListener("click", this.guard, true)
		this.binding.destroy()
	}

	private sync(): void {
		const button = this.element.tagName === "BUTTON"
		this.binding.apply(
			displayPart("omni-list__button", { selected: this.selected || undefined, disabled: this.disabled || undefined, alignItems: this.alignItems === "flex-start" ? this.alignItems : undefined }, {
				"aria-current": this.selected ? "true" : undefined,
				...(button ? { type: this.type ?? "button", disabled: this.disabled || undefined } : { "aria-disabled": this.disabled ? "true" : undefined, tabindex: this.disabled ? -1 : undefined }),
			}),
		)
	}
}

/** `<div omni-list-item-avatar>`: a picture (an `omni-avatar`) at the start of a row, with the same gap as the icon. */
@Directive({ selector: "[omni-list-item-avatar]", standalone: true, host: { class: "omni-list__avatar" } })
export class OmniListItemAvatar {}

/** `<div omni-list-item-icon>`: the icon at the start of a row. */
@Directive({ selector: "[omni-list-item-icon]", standalone: true, host: { class: "omni-list__icon" } })
export class OmniListItemIcon {}

/** The text of a row: `<div omni-list-item-text primary="Inbox" secondary="3 new">`. Without `primary`, the content is the primary text. */
@Component({
	selector: "div[omni-list-item-text]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: "omni-list__text" },
	template: `
		<span class="omni-list__primary">@if (primary !== undefined) {{{ primary }}} @else {<ng-content />}</span>
		@if (secondary !== undefined) {<span class="omni-list__secondary">{{ secondary }}</span>}
	`,
})
export class OmniListItemText {
	@Input() primary: string | undefined
	@Input() secondary: string | undefined
}

/** `<li omni-list-subheader>`: a heading row inside a list. */
@Directive({ selector: "li[omni-list-subheader]", standalone: true })
export class OmniListSubheader extends PartHost implements OnChanges {
	/** Do not stick to the top while the list scrolls. */
	@Input({ transform: booleanAttribute }) disableSticky = false

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		return displayPart("omni-list__subheader", { sticky: !this.disableSticky })
	}
}
