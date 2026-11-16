import { NgTemplateOutlet } from "@angular/common"
import {
	ChangeDetectionStrategy,
	Component,
	ContentChild,
	ContentChildren,
	Directive,
	EventEmitter,
	InjectionToken,
	Input,
	OnChanges,
	Output,
	QueryList,
	AfterContentInit,
	booleanAttribute,
	computed,
	effect,
	forwardRef,
	inject,
	signal,
	untracked,
} from "@angular/core"
import { ICON_PATHS, stepPart, stepState, stepperPart, type Part } from "@omnifront/ui"
import { PartHost } from "./display"

/** The Stepper a step sits in. */
export const OMNI_STEPPER = new InjectionToken<OmniStepper>("OMNI_STEPPER")

/** Replaces the number or tick of a step: `<svg omniStepIcon …/>`. */
@Directive({ selector: "[omniStepIcon]", standalone: true })
export class OmniStepIcon {}

/**
 * A list of steps toward a goal: `<ol omni-stepper [activeStep]="1"><li omni-step label="Cart"></li>…</ol>`.
 * The order of the steps gives each its number. Angular lifecycle: the stepper keeps the list of its
 * steps from a content query (so `@for` and `@if` can add and remove steps) and each step reads its
 * position from it.
 */
@Component({
	selector: "ol[omni-stepper]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [{ provide: OMNI_STEPPER, useExisting: forwardRef(() => OmniStepper) }],
	template: "<ng-content />",
})
export class OmniStepper extends PartHost implements OnChanges, AfterContentInit {
	/** The current step, 0-based. Steps before it are completed. */
	@Input() activeStep = 0
	@Input() orientation: "horizontal" | "vertical" | undefined
	@Input({ transform: booleanAttribute }) alternativeLabel = false
	@Input({ transform: booleanAttribute }) nonLinear = false
	@ContentChildren(forwardRef(() => OmniStep), { descendants: true }) private readonly list!: QueryList<OmniStep>
	readonly steps = signal<OmniStep[]>([])
	/** Bumped when an input changes, so steps (which read it) update. */
	readonly version = signal(0)

	get currentOrientation(): "horizontal" | "vertical" {
		return this.defaults("OmniStepper", { orientation: this.orientation }).orientation ?? "horizontal"
	}

	ngAfterContentInit(): void {
		this.steps.set(this.list.toArray())
		this.list.changes.subscribe(() => this.steps.set(this.list.toArray()))
	}

	ngOnChanges(): void {
		this.version.update((v) => v + 1)
		this.apply()
	}

	protected part(): Part {
		return stepperPart({ orientation: this.currentOrientation, alternativeLabel: this.alternativeLabel || undefined, nonLinear: this.nonLinear || undefined })
	}
}

/**
 * One step: `<li omni-step label="Address" optional="Optional"></li>`. `(activate)` makes its header a button
 * (a click handler on the `li` itself would fire for the whole step, so the output has its own name). In a
 * vertical stepper the content of the step is shown under the label while the step is active.
 */
@Component({
	selector: "li[omni-step]",
	standalone: true,
	imports: [NgTemplateOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<ng-template #head>
			<span class="omni-step__icon">
				@if (customIcon) {<ng-content select="[omniStepIcon]" />}
				@else if (state().error) {<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path [attr.d]="warningPath" /></svg>}
				@else if (state().completed) {<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path [attr.d]="checkPath" /></svg>}
				@else {{{ index() + 1 }}}
			</span>
			<span>
				<span class="omni-step__label">{{ label }}</span>
				@if (optional) {<span class="omni-step__optional">{{ optional }}</span>}
			</span>
		</ng-template>
		@if (activate.observed) {
			<button type="button" class="omni-step__header" [disabled]="disabled" (click)="activate.emit($event)"><ng-container [ngTemplateOutlet]="head" /></button>
		} @else {
			<span class="omni-step__header"><ng-container [ngTemplateOutlet]="head" /></span>
		}
		@if (stepper.currentOrientation === 'vertical') {<div class="omni-step__content">@if (state().active) {<ng-content />}</div>}
	`,
})
export class OmniStep extends PartHost implements OnChanges {
	@Input() label: string | undefined
	/** A second line under the label ("Optional"). */
	@Input() optional: string | undefined
	/** Override the state the stepper's `activeStep` gives. */
	@Input() completed: boolean | undefined
	@Input() active: boolean | undefined
	@Input({ transform: booleanAttribute }) disabled = false
	@Input({ transform: booleanAttribute }) error = false
	@Output() readonly activate = new EventEmitter<MouseEvent>()
	@ContentChild(OmniStepIcon) protected customIcon: OmniStepIcon | undefined
	protected readonly stepper = inject(OMNI_STEPPER)
	protected readonly checkPath = ICON_PATHS.check
	protected readonly warningPath = ICON_PATHS.warning
	private readonly local = signal(0)
	protected readonly index = computed(() => Math.max(0, this.stepper.steps().indexOf(this)))
	protected readonly state = computed(() => {
		this.local()
		this.stepper.version()
		return stepState(this.options())
	})

	constructor() {
		super()
		effect(() => {
			this.state()
			this.stepper.steps()
			untracked(() => this.apply())
		})
	}

	private options() {
		return {
			index: this.index(),
			activeStep: this.stepper.activeStep,
			count: this.stepper.steps().length,
			completed: this.completed,
			active: this.active,
			disabled: this.disabled || undefined,
			error: this.error || undefined,
		}
	}

	ngOnChanges(): void {
		this.local.update((v) => v + 1)
		this.apply()
	}

	protected part(): Part {
		const base = stepPart(this.options())
		return { attrs: { ...base.attrs, "aria-current": this.state().active ? "step" : undefined }, on: base.on }
	}
}
