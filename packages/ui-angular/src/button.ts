import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, booleanAttribute, inject } from "@angular/core"
import { attachRipple, buttonPart, type ButtonColor, type ButtonSize, type ButtonVariant } from "@omnifront/ui"
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
	@Input({ transform: booleanAttribute }) disableElevation = false
	/** Shows a spinner and ignores clicks, e.g. `[loading]="mutation.isPending()"`. */
	@Input({ transform: booleanAttribute }) loading = false
	@Input({ transform: booleanAttribute }) disabled = false
	/** Turn off the touch ripple. */
	@Input({ transform: booleanAttribute }) disableRipple = false
	@Input() type: "button" | "submit" | "reset" | undefined

	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly binding = new PartBinding(this.element)
	private readonly defaults = injectDefaults()
	private stopRipple: (() => void) | undefined

	constructor() {
		// Capture phase, so it runs before the user's (click) listener on the same element can see the click.
		this.element.addEventListener("click", this.guard, true)
	}

	private readonly guard = (event: Event): void => {
		if (this.loading || this.disabled) {
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

	private sync(): void {
		const p = this.defaults("OmniButton", {
			variant: this.variant,
			color: this.color,
			size: this.size,
			fullWidth: this.fullWidth || undefined,
			disableElevation: this.disableElevation || undefined,
			disabled: this.disabled || undefined,
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
