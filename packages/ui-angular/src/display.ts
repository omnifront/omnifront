import {
	ChangeDetectionStrategy,
	Component,
	Directive,
	ElementRef,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	booleanAttribute,
	inject,
	signal,
} from "@angular/core"
import {
	ICON_PATHS,
	appBarPart,
	avatarPart,
	badgeMarkPart,
	badgeState,
	cardPart,
	displayPart,
	dividerPart,
	paperPart,
	svgIconPart,
	typographyPart,
	type AppBarOptions,
	type BadgeOptions,
	type Part,
	type SvgIconOptions,
	type TypographyColor,
	type TypographyVariantName,
} from "@omnifront/ui"
import { OmniPart, PartBinding } from "./part"
import { injectDefaults } from "./theme"

/**
 * Shared shape of the display directives. Angular applies these to a native element
 * (`<h1 omni-typography>`, `<table omni-table>`), so the DOM is the same one React and Vue draw.
 * Each subclass repeats `ngOnChanges` itself: Angular only wires the hook for the class that declares it.
 */
@Directive()
export abstract class PartHost implements OnInit, OnDestroy {
	protected readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	protected readonly defaults = injectDefaults()
	private readonly binding = new PartBinding(this.element)
	protected abstract part(): Part

	ngOnInit(): void {
		this.apply()
	}

	ngOnDestroy(): void {
		this.binding.destroy()
	}

	protected apply(): void {
		this.binding.apply(this.part())
	}
}

/** Text in one of the theme's styles: `<h1 omni-typography variant="h1">`. Pick the element yourself (it can differ from the variant). */
@Directive({ selector: "[omni-typography]", standalone: true })
export class OmniTypography extends PartHost implements OnChanges {
	@Input() variant: TypographyVariantName | undefined
	@Input() align: "inherit" | "left" | "center" | "right" | "justify" | undefined
	@Input() color: TypographyColor | undefined
	@Input({ transform: booleanAttribute }) gutterBottom = false
	@Input({ transform: booleanAttribute }) noWrap = false
	@Input({ transform: booleanAttribute }) paragraph = false

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		const p = this.defaults("OmniTypography", { variant: this.variant, align: this.align, color: this.color })
		return typographyPart({ ...p, gutterBottom: this.gutterBottom || undefined, noWrap: this.noWrap || undefined, paragraph: this.paragraph || undefined })
	}
}

/** A surface that lifts off the page: `<div omni-paper [elevation]="4">`. */
@Directive({ selector: "[omni-paper]", standalone: true })
export class OmniPaper extends PartHost implements OnChanges {
	@Input() elevation: number | undefined
	@Input() variant: "elevation" | "outlined" | undefined
	@Input({ transform: booleanAttribute }) square = false

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		return paperPart({ ...this.defaults("OmniPaper", { elevation: this.elevation, variant: this.variant }), square: this.square || undefined })
	}
}

/** A Paper for one subject: `<div omni-card>` with `omni-card-header`, `omni-card-content` and `omni-card-actions` inside. */
@Directive({ selector: "[omni-card]", standalone: true })
export class OmniCard extends PartHost implements OnChanges {
	@Input() variant: "elevation" | "outlined" | undefined
	@Input({ transform: booleanAttribute }) raised = false

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		return cardPart({ ...this.defaults("OmniCard", { variant: this.variant }), raised: this.raised || undefined })
	}
}

/** `<div omni-card-content>`. */
@Directive({ selector: "[omni-card-content]", standalone: true, host: { class: "omni-card__content" } })
export class OmniCardContent {}

/** `<div omni-card-actions>`. */
@Directive({ selector: "[omni-card-actions]", standalone: true, host: { class: "omni-card__actions" } })
export class OmniCardActions {}

/** `<img omni-card-media src="…" alt="…" height="140">`. Give it `alt` (empty when it is only decoration). */
@Directive({ selector: "img[omni-card-media]", standalone: true, host: { class: "omni-card__media" } })
export class OmniCardMedia {}

/** Marks the element in a card header that goes at the start (an avatar). */
@Directive({ selector: "[omniCardAvatar]", standalone: true })
export class OmniCardAvatar {}

/** Marks the element in a card header that goes at the end (an IconButton). */
@Directive({ selector: "[omniCardAction]", standalone: true })
export class OmniCardAction {}

/**
 * Avatar, title, subheader and an action: `<div omni-card-header title="…" subheader="…">`. Project
 * the avatar with `omniCardAvatar` and the action with `omniCardAction`.
 */
@Component({
	selector: "div[omni-card-header]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	// `title` is an input here: the attribute must not stay on the element as a native tooltip.
	host: { class: "omni-card__header", "[attr.title]": "null" },
	template: `
		<div class="omni-card__header-avatar"><ng-content select="[omniCardAvatar]" /></div>
		<div class="omni-card__header-content">
			@if (title !== undefined) {<span class="omni-card__title">{{ title }}</span>}
			@if (subheader !== undefined) {<span class="omni-card__subheader">{{ subheader }}</span>}
		</div>
		<div class="omni-card__header-action"><ng-content select="[omniCardAction]" /></div>
	`,
})
export class OmniCardHeader {
	@Input() title: string | undefined
	@Input() subheader: string | undefined
}

/**
 * A line that separates content: `<hr omni-divider>`, `<li omni-divider>` in a list, or
 * `<div omni-divider>Text</div>` for a line with text in it (the root then has `role="separator"`).
 */
@Component({
	selector: "hr[omni-divider], li[omni-divider], div[omni-divider]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `@if (withText) {<span class="omni-divider__text"><ng-content /></span>}`,
})
export class OmniDivider extends PartHost implements OnChanges {
	@Input() orientation: "horizontal" | "vertical" | undefined
	@Input() variant: "fullWidth" | "inset" | "middle" | undefined
	@Input({ transform: booleanAttribute }) flexItem = false
	@Input() textAlign: "center" | "left" | "right" | undefined
	protected readonly withText = this.element.tagName === "DIV"

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		const p = this.defaults("OmniDivider", { orientation: this.orientation, variant: this.variant, textAlign: this.textAlign })
		return dividerPart({ ...p, flexItem: this.flexItem || undefined, withText: this.withText, as: this.element.tagName.toLowerCase() as "hr" | "li" | "div" })
	}
}

/**
 * A person or thing as a picture, initials or an icon: `<div omni-avatar src="…" alt="Ada">`. If
 * the picture fails to load it falls back to the content, then to a generic person.
 */
@Component({
	selector: "div[omni-avatar]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	// `alt` and `src` are inputs of the avatar, not attributes of its `<div>`.
	host: { "[attr.src]": "null", "[attr.srcset]": "null", "[attr.alt]": "null" },
	template: `
		@if (showImage()) {<img class="omni-avatar__img" [attr.src]="src" [attr.srcset]="srcSet ?? null" [attr.alt]="alt ?? ''" (error)="failed.set(true)" />}
		<ng-content />
		<svg class="omni-avatar__fallback" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path [attr.d]="personPath" /></svg>
	`,
})
export class OmniAvatar extends PartHost implements OnChanges {
	@Input() variant: "circular" | "rounded" | "square" | undefined
	@Input() src: string | undefined
	@Input() srcSet: string | undefined
	@Input() alt: string | undefined
	protected readonly personPath = ICON_PATHS.person
	protected readonly failed = signal(false)
	private lastSource: string | undefined

	protected showImage = (): boolean => Boolean(this.src || this.srcSet) && !this.failed()

	ngOnChanges(): void {
		const source = `${this.src}|${this.srcSet}`
		if (source !== this.lastSource) {
			this.lastSource = source
			this.failed.set(false)
		}
		this.apply()
	}

	protected part(): Part {
		return avatarPart(this.defaults("OmniAvatar", { variant: this.variant }))
	}
}

/** A small number or dot on a corner of what it wraps: `<span omni-badge [badgeContent]="4"><svg …/></span>`. */
@Component({
	selector: "span[omni-badge]",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<ng-content /><span [omniPart]="mark">{{ text }}</span>`,
})
export class OmniBadge extends PartHost implements OnChanges {
	@Input() badgeContent: string | number | undefined
	/** Biggest number shown; above it the badge reads `99+`. Default 99. */
	@Input() max: number | undefined
	@Input({ transform: booleanAttribute }) showZero = false
	@Input() variant: "standard" | "dot" | undefined
	@Input({ transform: booleanAttribute }) invisible = false
	@Input() color: BadgeOptions["color"]
	@Input() anchorOrigin: BadgeOptions["anchorOrigin"]
	@Input() overlap: "rectangular" | "circular" | undefined
	protected mark: Part = badgeMarkPart({})
	protected text = ""

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		const p = this.defaults("OmniBadge", { variant: this.variant, color: this.color, anchorOrigin: this.anchorOrigin, overlap: this.overlap })
		const options: BadgeOptions = { ...p, badgeContent: this.badgeContent, max: this.max, showZero: this.showZero || undefined, invisible: this.invisible || undefined }
		this.mark = badgeMarkPart(options)
		this.text = badgeState(options).text
		return displayPart("omni-badge")
	}
}

/** A 24px glyph that takes the text colour: `<svg omni-svg-icon><path d="…" /></svg>`. Decorative unless `titleAccess` names it. */
@Directive({ selector: "svg[omni-svg-icon]", standalone: true })
export class OmniSvgIcon extends PartHost implements OnChanges {
	@Input() fontSize: SvgIconOptions["fontSize"]
	@Input() color: SvgIconOptions["color"]
	@Input() viewBox: string | undefined
	@Input() titleAccess: string | undefined

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		return svgIconPart(this.defaults("OmniSvgIcon", { fontSize: this.fontSize, color: this.color, viewBox: this.viewBox, titleAccess: this.titleAccess }))
	}
}

/** The bar at the top of a page: `<header omni-app-bar>`. Put a `<div omni-toolbar>` inside. */
@Directive({ selector: "[omni-app-bar]", standalone: true })
export class OmniAppBar extends PartHost implements OnChanges {
	@Input() position: AppBarOptions["position"]
	@Input() color: AppBarOptions["color"]
	@Input() elevation: number | undefined

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		return appBarPart(this.defaults("OmniAppBar", { position: this.position, color: this.color, elevation: this.elevation }))
	}
}

/** A row of items with Material's heights: `<div omni-toolbar>`. */
@Directive({ selector: "[omni-toolbar]", standalone: true })
export class OmniToolbar extends PartHost implements OnChanges {
	@Input() variant: "regular" | "dense" | undefined
	@Input({ transform: booleanAttribute }) disableGutters = false

	ngOnChanges(): void {
		this.apply()
	}

	protected part(): Part {
		const p = this.defaults("OmniToolbar", { variant: this.variant })
		return displayPart("omni-toolbar", { variant: p.variant === "dense" ? "dense" : undefined, disableGutters: this.disableGutters || undefined })
	}
}
