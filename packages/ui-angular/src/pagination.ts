import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	booleanAttribute,
	computed,
	effect,
	inject,
	untracked,
} from "@angular/core"
import { ICON_PATHS, createPagination, type PaginationItem } from "@omnifront/ui"
import { bindMachine } from "./machine"
import { OmniPart, PartBinding } from "./part"
import { injectDefaults } from "./theme"

export interface PaginationChangeEvent {
	page: number
	event: Event | undefined
}

const ICONS: Partial<Record<PaginationItem["type"], string>> = { first: ICON_PATHS.firstPage, previous: ICON_PATHS.chevronLeft, next: ICON_PATHS.chevronRight, last: ICON_PATHS.lastPage }

/**
 * A row of page buttons: first, previous, numbers with "…" where pages fold, next, last. The page is
 * 1-based; the current one is `aria-current="page"`.
 *
 *     <nav omni-pagination label="Results" [count]="10" [(page)]="page"></nav>
 *
 * Without `page` bound it keeps its own (`defaultPage`). `(pageChange)` gives the new page; `(changed)` also gives the event.
 */
@Component({
	selector: "nav[omni-pagination]",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<ul [omniPart]="view().list">
			@for (entry of view().items; track $index) {
				<li>
					@if (entry.item.page === null) {
						<span [omniPart]="entry.part">…</span>
					} @else {
						<button [omniPart]="entry.part">@if (entry.icon) {<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path [attr.d]="entry.icon" /></svg>} @else {{{ entry.item.page }}}</button>
					}
				</li>
			}
		</ul>
	`,
})
export class OmniPagination implements OnInit, OnChanges, OnDestroy {
	/** Number of pages. */
	@Input() count = 1
	/** The current page. Use `[(page)]` for two-way binding; without `pageChange` bound it is controlled. */
	@Input() page: number | undefined
	@Input() defaultPage: number | undefined
	@Input({ transform: booleanAttribute }) disabled = false
	@Input() siblingCount: number | undefined
	@Input() boundaryCount: number | undefined
	@Input({ transform: booleanAttribute }) showFirstButton = false
	@Input({ transform: booleanAttribute }) showLastButton = false
	@Input({ transform: booleanAttribute }) hidePrevButton = false
	@Input({ transform: booleanAttribute }) hideNextButton = false
	@Input() variant: "text" | "outlined" | undefined
	@Input() shape: "circular" | "rounded" | undefined
	@Input() size: "small" | "medium" | "large" | undefined
	@Input() color: "standard" | "primary" | "secondary" | undefined
	/** The nav's accessible name. Default "pagination navigation". */
	@Input() label: string | undefined
	@Output() pageChange = new EventEmitter<number>()
	@Output() changed = new EventEmitter<PaginationChangeEvent>()

	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly binding = new PartBinding(this.element)
	private readonly defaults = injectDefaults()
	private readonly machine = createPagination({
		count: 1,
		onPageChange: (page, event) => {
			this.changed.emit({ page, event })
			this.pageChange.emit(page)
		},
	})
	private readonly bound = bindMachine(this.machine, (m) => m.connect())
	protected readonly view = computed(() => {
		const state = this.bound.state()
		const parts = this.bound.parts()
		return { list: parts.list, items: state.items.map((item) => ({ item, icon: ICONS[item.type], part: parts.item(item) })) }
	})

	constructor() {
		effect(() => {
			this.bound.state()
			untracked(() => this.binding.apply(this.bound.parts().root))
		})
	}

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	ngOnDestroy(): void {
		this.binding.destroy()
	}

	private sync(): void {
		const p = this.defaults("OmniPagination", { variant: this.variant, shape: this.shape, size: this.size, color: this.color })
		this.machine.setProps({
			count: this.count,
			page: this.page,
			defaultPage: this.defaultPage,
			disabled: this.disabled || undefined,
			siblingCount: this.siblingCount,
			boundaryCount: this.boundaryCount,
			showFirstButton: this.showFirstButton || undefined,
			showLastButton: this.showLastButton || undefined,
			hidePrevButton: this.hidePrevButton || undefined,
			hideNextButton: this.hideNextButton || undefined,
			variant: p.variant,
			shape: p.shape,
			size: p.size,
			color: p.color,
			label: this.label,
		})
	}
}
