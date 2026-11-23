import { NgTemplateOutlet } from "@angular/common"
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	Component,
	ContentChild,
	ContentChildren,
	Directive,
	EventEmitter,
	Input,
	OnChanges,
	Output,
	QueryList,
	TemplateRef,
	booleanAttribute,
	computed,
	inject,
	signal,
} from "@angular/core"
import {
	ICON_PATHS,
	alertPart,
	breadcrumbItems,
	breadcrumbsPart,
	circularProgressParts,
	displayPart,
	linearProgressParts,
	linkPart,
	skeletonPart,
	type AlertOptions,
	type CircularProgressParts,
	type LinearProgressParts,
	type LinkOptions,
	type Part,
	type ProgressColor,
	type SkeletonOptions,
} from "@omnifront/ui"
import { PartHost } from "./display"
import { OmniIconButton } from "./button-group"
import { OmniPart } from "./part"

/** Replaces the severity's icon of an Alert: `<svg omniAlertIcon …/>`. */
@Directive({ selector: "[omniAlertIcon]", standalone: true })
export class OmniAlertIcon {}

/** Something at the far end of an Alert (a button): `<button omniAlertAction>`. It replaces the close button. */
@Directive({ selector: "[omniAlertAction]", standalone: true })
export class OmniAlertAction {}

/**
 * A short message with a status icon: `<div omni-alert severity="error">…</div>`. `error` and
 * `warning` are announced at once (`role="alert"`); `info` and `success` politely (`role="status"`).
 * A `(close)` listener shows a close button (Angular tells us whether anyone listens, as with the chip's `(delete)`).
 */
@Component({
	selector: "div[omni-alert]",
	standalone: true,
	imports: [OmniIconButton],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (icon !== false) {
			<div class="omni-alert__icon">
				<ng-content select="[omniAlertIcon]" />
				@if (!customIcon) {<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path [attr.d]="iconPath()" /></svg>}
			</div>
		}
		<div class="omni-alert__message"><ng-content /></div>
		@if (action || close.observed) {
			<div class="omni-alert__action">
				<ng-content select="[omniAlertAction]" />
				@if (!action) {
					<button omni-icon-button size="small" color="inherit" [attr.aria-label]="closeText" (click)="close.emit($event)">
						<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path [attr.d]="closePath" /></svg>
					</button>
				}
			</div>
		}
	`,
})
export class OmniAlert extends PartHost implements OnChanges {
	@Input() severity: AlertOptions["severity"]
	@Input() variant: AlertOptions["variant"]
	/** `false` removes the icon. A custom one goes in an element with `omniAlertIcon`. */
	@Input() icon: false | undefined
	/** The close button's accessible name. Default "Close". */
	@Input() closeText = "Close"
	@Output() readonly close = new EventEmitter<MouseEvent>()
	@ContentChild(OmniAlertIcon) protected customIcon: OmniAlertIcon | undefined
	@ContentChild(OmniAlertAction) protected action: OmniAlertAction | undefined
	protected readonly closePath = ICON_PATHS.close
	protected iconPath = (): string => ICON_PATHS[this.severity ?? "success"]

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		return alertPart(this.defaults("OmniAlert", { severity: this.severity, variant: this.variant }))
	}
}

/** The bold first line of an Alert: `<div omni-alert-title>`. */
@Directive({ selector: "[omni-alert-title]", standalone: true, host: { class: "omni-alert__title" } })
export class OmniAlertTitle {}

/** A dimmed layer over the page behind a modal piece: `<div omni-backdrop [open]="busy">`. Decorative (`aria-hidden`). */
@Directive({ selector: "div[omni-backdrop]", standalone: true })
export class OmniBackdrop extends PartHost implements OnChanges {
	@Input({ transform: booleanAttribute }) open = false
	/** No dimming: it only catches clicks. */
	@Input({ transform: booleanAttribute }) invisible = false

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		return displayPart("omni-backdrop", { state: this.open ? "open" : "closed", invisible: this.invisible || undefined }, { "aria-hidden": "true" })
	}
}

/** A spinning ring, or a ring filled to `value`: `<span omni-circular-progress aria-label="Loading">`. It is a `role="progressbar"`: name it. */
@Component({
	selector: "span[omni-circular-progress]",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<svg [omniPart]="parts.svg"><circle [omniPart]="parts.circle" /></svg>`,
})
export class OmniCircularProgress extends PartHost implements OnChanges {
	/** 0 to 100. Leave out for an indeterminate spinner. */
	@Input() value: number | undefined
	/** Diameter in px (a number) or any CSS length. Default 40. */
	@Input() size: number | string | undefined
	@Input() thickness: number | undefined
	@Input() color: ProgressColor | undefined
	protected parts: CircularProgressParts = circularProgressParts({})

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		this.parts = circularProgressParts(this.defaults("OmniCircularProgress", { value: this.value, size: this.size, thickness: this.thickness, color: this.color }))
		return this.parts.root
	}
}

/** A bar: `<div omni-linear-progress variant="determinate" [value]="40" aria-label="Progress">`. Indeterminate, determinate or buffer. */
@Component({
	selector: "div[omni-linear-progress]",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<span [omniPart]="parts.bar1"></span><span [omniPart]="parts.bar2"></span>`,
})
export class OmniLinearProgress extends PartHost implements OnChanges {
	@Input() variant: "determinate" | "indeterminate" | "buffer" | undefined
	@Input() value: number | undefined
	@Input() valueBuffer: number | undefined
	@Input() color: ProgressColor | undefined
	protected parts: LinearProgressParts = linearProgressParts({})

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		this.parts = linearProgressParts(this.defaults("OmniLinearProgress", { variant: this.variant, value: this.value, valueBuffer: this.valueBuffer, color: this.color }))
		return this.parts.root
	}
}

/** A grey placeholder while content loads: `<span omni-skeleton variant="circular" [width]="40">`. Hidden from screen readers: put `aria-busy` on the loading region. */
@Directive({ selector: "span[omni-skeleton], div[omni-skeleton]", standalone: true })
export class OmniSkeleton extends PartHost implements OnChanges {
	@Input() variant: SkeletonOptions["variant"]
	@Input() animation: SkeletonOptions["animation"]
	@Input() width: number | string | undefined
	@Input() height: number | string | undefined

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		return skeletonPart(this.defaults("OmniSkeleton", { variant: this.variant, animation: this.animation, width: this.width, height: this.height }))
	}
}

/** A real `<a>` styled as a link: `<a omni-link href="/docs" underline="hover">`. */
@Directive({ selector: "a[omni-link]", standalone: true })
export class OmniLink extends PartHost implements OnChanges {
	@Input() underline: LinkOptions["underline"]
	@Input() color: LinkOptions["color"]

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		return linkPart(this.defaults("OmniLink", { underline: this.underline, color: this.color }))
	}
}

/**
 * One item of Breadcrumbs, written as a template: `<a *omniCrumb omni-link href="/">Home</a>`. (The
 * breadcrumbs wrap each item in an `li`, and content projection cannot wrap, so items are templates.)
 */
@Directive({ selector: "[omniCrumb]", standalone: true })
export class OmniCrumb {
	readonly template = inject<TemplateRef<unknown>>(TemplateRef)
}

/**
 * The path to the current page: `<nav omni-breadcrumbs><a *omniCrumb …>Home</a><span *omniCrumb>Current</span></nav>`.
 * The last item is `aria-current="page"`; too many items fold their middle under a "…" button.
 */
@Component({
	selector: "nav[omni-breadcrumbs]",
	standalone: true,
	imports: [NgTemplateOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<ol class="omni-breadcrumbs__list">
			@for (slot of shown(); track $index) {
				<li class="omni-breadcrumbs__item" [attr.aria-current]="slot !== 'ellipsis' && slot === crumbs().length - 1 ? 'page' : null">
					@if (slot === 'ellipsis') {
						<button type="button" class="omni-breadcrumbs__expand" [attr.aria-label]="expandText" (click)="expand()"><svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path [attr.d]="morePath" /></svg></button>
					} @else {
						<ng-container [ngTemplateOutlet]="crumbs()[slot]!.template" />
					}
				</li>
				@if ($index < shown().length - 1) {
					<li class="omni-breadcrumbs__separator" aria-hidden="true" role="presentation">
						@if (separator !== undefined) {{{ separator }}} @else {<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path [attr.d]="chevronPath" /></svg>}
					</li>
				}
			}
		</ol>
	`,
})
export class OmniBreadcrumbs extends PartHost implements OnChanges, AfterContentInit {
	/** More items than this fold their middle under a "…" button. Default 8. */
	@Input() maxItems: number | undefined
	@Input() itemsBeforeCollapse: number | undefined
	@Input() itemsAfterCollapse: number | undefined
	/** Between items (text). Default a chevron. */
	@Input() separator: string | undefined
	/** The nav's accessible name. Default "breadcrumb". */
	@Input() label: string | undefined
	/** The "…" button's accessible name. Default "Show path". */
	@Input() expandText = "Show path"
	@ContentChildren(OmniCrumb) private readonly list!: QueryList<OmniCrumb>
	protected readonly crumbs = signal<OmniCrumb[]>([])
	private readonly expanded = signal(false)
	private readonly options = signal<{ maxItems?: number; itemsBeforeCollapse?: number; itemsAfterCollapse?: number }>({})
	protected readonly shown = computed(() => breadcrumbItems(this.crumbs().length, { ...this.options(), expanded: this.expanded() }))
	protected readonly morePath = ICON_PATHS.moreHoriz
	protected readonly chevronPath = ICON_PATHS.chevronRight

	ngAfterContentInit(): void {
		this.crumbs.set(this.list.toArray())
		this.list.changes.subscribe(() => this.crumbs.set(this.list.toArray()))
	}

	ngOnChanges(): void {
		const o: { maxItems?: number; itemsBeforeCollapse?: number; itemsAfterCollapse?: number } = {}
		if (this.maxItems !== undefined) o.maxItems = this.maxItems
		if (this.itemsBeforeCollapse !== undefined) o.itemsBeforeCollapse = this.itemsBeforeCollapse
		if (this.itemsAfterCollapse !== undefined) o.itemsAfterCollapse = this.itemsAfterCollapse
		this.options.set(o)
		this.apply()
	}

	protected expand(): void {
		this.expanded.set(true)
	}

	protected part(): Part {
		return breadcrumbsPart(this.label)
	}
}
