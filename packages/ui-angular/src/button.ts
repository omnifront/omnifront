import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, booleanAttribute, effect, inject, untracked } from "@angular/core"
import { attachRipple, buttonPart, type ButtonColor, type ButtonSize, type ButtonVariant } from "@omnifront/ui"
import { OMNI_BUTTON_GROUP, optionalBoolean } from "./button-group"
import { PartBinding } from "./part"
import { injectDefaults } from "./theme"

/**
 * Material button. Use it on a native element so it keeps its semantics:
 * `<button omni-button variant="contained">` or `<a omni-button href="/docs">`.
 * Icons go in with `omniStartIcon` and `omniEndIcon` attributes on a child.
 */
@Component({
	selector: "button[omni-button], a[omni-button]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<span class="omni-button__start"><ng-content select="[omniStartIcon]" /></span><ng-content /><span class="omni-button__end"><ng-content select="[omniEndIcon]" /></span>`,
})
export class OmniButton implements OnInit, OnChanges, AfterViewInit, OnDestroy {
	@Input() variant: ButtonVariant | undefined
	@Input() color: ButtonColor | undefined
	@Input() size: ButtonSize | undefined
	@Input({ transform: booleanAttribute }) fullWidth = false
	@Input({ transform: optionalBoolean }) disableElevation: boolean | undefined
	/** Shows a spinner and ignores clicks, e.g. `[loading]="mutation.isPending()"`. */
	@Input({ transform: booleanAttribute }) loading = false
	@Input({ transform: optionalBoolean }) disabled: boolean | undefined
	/** Turn off the touch ripple. */
	@Input({ transform: booleanAttribute }) disableRipple = false
	@Input() type: "button" | "submit" | "reset" | undefined

	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly binding = new PartBinding(this.element)
	private readonly defaults = injectDefaults()
	private readonly group = inject(OMNI_BUTTON_GROUP, { optional: true })
	private stopRipple: (() => void) | undefined

	constructor() {
		// Capture phase, so it runs before the user's (click) listener on the same element can see the click.
		this.element.addEventListener("click", this.guard, true)
		// Inside a ButtonGroup, re-read the group's defaults whenever one of its inputs changes.
		effect(() => {
			this.group?.version()
			untracked(() => this.sync())
		})
	}

	private readonly guard = (event: Event): void => {
		if (this.loading || this.isDisabled()) {
			event.preventDefault()
			event.stopImmediatePropagation()
		}
	}

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
		this.syncRipple()
	}

	ngAfterViewInit(): void {
		this.syncRipple()
	}

	private isDisabled(): boolean {
		return (this.disabled ?? this.group?.disabled) === true
	}

	private sync(): void {
		const g = this.group
		// An own input wins; the group fills in what the button did not set.
		const p = this.defaults("OmniButton", {
			variant: this.variant ?? g?.variant,
			color: this.color ?? g?.color,
			size: this.size ?? g?.size,
			fullWidth: this.fullWidth || undefined,
			disableElevation: (this.disableElevation ?? g?.disableElevation) || undefined,
			disabled: this.isDisabled() || undefined,
			loading: this.loading || undefined,
			type: this.type,
		})
		this.binding.apply(buttonPart({ ...p, as: this.element.tagName === "A" ? "a" : "button" }))
	}

	private syncRipple(): void {
		this.stopRipple?.()
		this.stopRipple = this.disableRipple ? undefined : attachRipple(this.element)
	}

	ngOnDestroy(): void {
		this.element.removeEventListener("click", this.guard, true)
		this.stopRipple?.()
		this.binding.destroy()
	}
}
