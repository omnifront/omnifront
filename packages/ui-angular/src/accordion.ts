import {
	ChangeDetectionStrategy,
	Component,
	ContentChild,
	Directive,
	ElementRef,
	EventEmitter,
	InjectionToken,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	booleanAttribute,
	effect,
	forwardRef,
	inject,
	untracked,
} from "@angular/core"
import { NgTemplateOutlet } from "@angular/common"
import { ICON_PATHS, createAccordion } from "@omnifront/ui"
import { bindMachine } from "./machine"
import { OmniPart, PartBinding } from "./part"
import { OmniIds, injectDefaults } from "./theme"

/** The Accordion that a summary and its details sit in. */
export const OMNI_ACCORDION = new InjectionToken<OmniAccordion>("OMNI_ACCORDION")

function requireAccordion(name: string): OmniAccordion {
	const ctx = inject(OMNI_ACCORDION, { optional: true })
	if (!ctx) throw new Error(`omnifront/ui-angular: <${name}> must be inside <div omni-accordion>`)
	return ctx
}

/**
 * One collapsible section:
 *
 *     <div omni-accordion [(expanded)]="open">
 *       <omni-accordion-summary>Question</omni-accordion-summary>
 *       <omni-accordion-details>Answer</omni-accordion-details>
 *     </div>
 *
 * Stack several in a div; to open one at a time, control `expanded` yourself.
 */
@Component({
	selector: "div[omni-accordion]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [{ provide: OMNI_ACCORDION, useExisting: forwardRef(() => OmniAccordion) }],
	template: "<ng-content />",
})
export class OmniAccordion implements OnInit, OnChanges, OnDestroy {
	/** Open or closed. Use `[(expanded)]` for two-way binding. Without `expandedChange` it is controlled. */
	@Input() expanded: boolean | undefined
	@Input({ transform: booleanAttribute }) defaultExpanded = false
	@Input({ transform: booleanAttribute }) disabled = false
	@Output() expandedChange = new EventEmitter<boolean>()

	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly binding = new PartBinding(this.element)
	private readonly defaults = injectDefaults()
	private initializing = false
	readonly machine = createAccordion({
		id: inject(OmniIds).create(),
		onExpandedChange: (expanded) => {
			if (!this.initializing) this.expandedChange.emit(expanded)
		},
	})
	private readonly bound = bindMachine(this.machine, (m) => m.connect())
	readonly parts = this.bound.parts

	constructor() {
		effect(() => {
			this.bound.state()
			untracked(() => this.binding.apply(this.bound.parts().root))
		})
	}

	ngOnInit(): void {
		// An uncontrolled accordion starts at `defaultExpanded`; the machine reads it only at creation, so open it now (not announced).
		if (this.expanded === undefined && this.defaultExpanded) {
			this.initializing = true
			this.machine.toggle()
			this.initializing = false
		}
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	ngOnDestroy(): void {
		this.binding.destroy()
	}

	private sync(): void {
		this.defaults("OmniAccordion", {})
		this.machine.setProps({ expanded: this.expanded, disabled: this.disabled || undefined })
	}
}

/** Replaces the chevron of a summary: `<svg omniExpandIcon …/>`. */
@Directive({ selector: "[omniExpandIcon]", standalone: true })
export class OmniExpandIcon {}

/** The always-visible row: a `<button>` inside a heading (`headingLevel` 2 to 6, default 3). */
@Component({
	selector: "omni-accordion-summary",
	standalone: true,
	imports: [OmniPart, NgTemplateOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: "display: contents" },
	template: `
		<ng-template #button>
			<button class="omni-accordion__summary" [omniPart]="accordion.parts().trigger">
				<span class="omni-accordion__summary-content"><ng-content /></span>
				<span class="omni-accordion__icon" aria-hidden="true">
					@if (custom) {<ng-content select="[omniExpandIcon]" />} @else {<svg viewBox="0 0 24 24" focusable="false"><path [attr.d]="expandPath" /></svg>}
				</span>
			</button>
		</ng-template>
		@switch (headingLevel) {
			@case (2) {<h2 class="omni-accordion__heading"><ng-container [ngTemplateOutlet]="button" /></h2>}
			@case (4) {<h4 class="omni-accordion__heading"><ng-container [ngTemplateOutlet]="button" /></h4>}
			@case (5) {<h5 class="omni-accordion__heading"><ng-container [ngTemplateOutlet]="button" /></h5>}
			@case (6) {<h6 class="omni-accordion__heading"><ng-container [ngTemplateOutlet]="button" /></h6>}
			@default {<h3 class="omni-accordion__heading"><ng-container [ngTemplateOutlet]="button" /></h3>}
		}
	`,
})
export class OmniAccordionSummary {
	@Input() headingLevel: 2 | 3 | 4 | 5 | 6 = 3
	@ContentChild(OmniExpandIcon) protected custom: OmniExpandIcon | undefined
	protected readonly expandPath = ICON_PATHS.expandMore
	protected readonly accordion = requireAccordion("omni-accordion-summary")
}

/** The content that opens and closes. */
@Component({
	selector: "omni-accordion-details",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: "display: contents" },
	template: `
		<div class="omni-accordion__region" [omniPart]="accordion.parts().region">
			<div class="omni-accordion__region-inner"><div class="omni-accordion__details"><ng-content /></div></div>
		</div>
	`,
})
export class OmniAccordionDetails {
	protected readonly accordion = requireAccordion("omni-accordion-details")
}
