import { ChangeDetectionStrategy, Component, ElementRef, Input, InjectionToken, OnChanges, OnDestroy, OnInit, booleanAttribute, forwardRef, inject, signal } from "@angular/core"
import { attachRipple, fabPart, iconButtonPart, type ButtonColor, type ButtonSize, type ButtonVariant, type IconButtonColor } from "@omnifront/ui"
import { PartBinding } from "./part"
import { injectDefaults } from "./theme"

/** Turns a bare attribute into `true` and keeps "not set" as `undefined` (so a group can tell them apart). */
export function optionalBoolean(v: unknown): boolean | undefined {
	return v === undefined || v === null ? undefined : booleanAttribute(v)
}

/** The ButtonGroup that a button sits in. */
export const OMNI_BUTTON_GROUP = new InjectionToken<OmniButtonGroup>("OMNI_BUTTON_GROUP")

/**
 * Buttons joined into one control. `variant`, `color`, `size` and `disabled` apply to every
 * `button[omni-button]` inside; a button's own input still wins.
 *
 *     <omni-button-group variant="outlined" label="Actions">
 *       <button omni-button>One</button><button omni-button>Two</button>
 *     </omni-button-group>
 */
@Component({
	selector: "omni-button-group",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [{ provide: OMNI_BUTTON_GROUP, useExisting: forwardRef(() => OmniButtonGroup) }],
	host: { style: "display: contents" },
	template: `
		<div class="omni-button-group" role="group" [attr.aria-label]="label ?? null" [attr.data-orientation]="orientation ?? 'horizontal'" [attr.data-full-width]="fullWidth ? '' : null">
			<ng-content />
		</div>
	`,
})
export class OmniButtonGroup implements OnChanges {
	@Input() variant: ButtonVariant | undefined
	@Input() color: ButtonColor | undefined
	@Input() size: ButtonSize | undefined
	@Input({ transform: optionalBoolean }) disabled: boolean | undefined
	@Input({ transform: optionalBoolean }) disableElevation: boolean | undefined
	@Input() orientation: "horizontal" | "vertical" | undefined
	@Input({ transform: booleanAttribute }) fullWidth = false
	/** `aria-label` of the group. */
	@Input() label: string | undefined

	/** Bumps when an input changes, so the buttons inside re-read the group's defaults. */
	readonly version = signal(0)
	private readonly defaultsFor = injectDefaults()

	ngOnChanges(): void {
		this.defaultsFor("OmniButtonGroup", {})
		this.version.update((v) => v + 1)
	}
}

/** A round, icon-only button: `<button omni-icon-button aria-label="Delete"><svg …/></button>`. */
@Component({
	selector: "button[omni-icon-button], a[omni-icon-button]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: "<ng-content />",
})
export class OmniIconButton implements OnInit, OnChanges, OnDestroy {
	@Input() color: IconButtonColor | undefined
	@Input() size: ButtonSize | undefined
	/** Pull the button outwards so its icon lines up with the edge of its container. */
	@Input() edge: "start" | "end" | false | undefined
	@Input({ transform: booleanAttribute }) disabled = false
	@Input({ transform: booleanAttribute }) disableRipple = false
	@Input() type: "button" | "submit" | "reset" | undefined

	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly binding = new PartBinding(this.element)
	private readonly defaults = injectDefaults()
	private stopRipple: (() => void) | undefined

	constructor() {
		// Capture phase, so it runs before the user's (click) listener on the same element can see the click.
		this.element.addEventListener("click", this.guard, true)
		this.sync()
	}

	private readonly guard = (event: Event): void => {
		if (this.disabled) {
			event.preventDefault()
			event.stopImmediatePropagation()
		}
	}

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	ngOnDestroy(): void {
		this.element.removeEventListener("click", this.guard, true)
		this.stopRipple?.()
		this.binding.destroy()
	}

	private sync(): void {
		const p = this.defaults("OmniIconButton", { color: this.color, size: this.size, edge: this.edge, type: this.type })
		this.binding.apply(iconButtonPart({ ...p, disabled: this.disabled || undefined, as: this.element.tagName === "A" ? "a" : "button" }))
		this.stopRipple?.()
		this.stopRipple = this.disableRipple ? undefined : attachRipple(this.element, { centered: true })
	}
}

/** The floating action button: `<button omni-fab aria-label="Add"><svg …/></button>` (give a circular one an `aria-label`). */
@Component({
	selector: "button[omni-fab], a[omni-fab]",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: "<ng-content />",
})
export class OmniFab implements OnInit, OnChanges, OnDestroy {
	@Input() color: ButtonColor | undefined
	@Input() size: ButtonSize | undefined
	/** `circular` (icon only) or `extended` (icon and text). */
	@Input() variant: "circular" | "extended" | undefined
	@Input({ transform: booleanAttribute }) disabled = false
	@Input({ transform: booleanAttribute }) disableRipple = false
	@Input() type: "button" | "submit" | "reset" | undefined

	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly binding = new PartBinding(this.element)
	private readonly defaults = injectDefaults()
	private stopRipple: (() => void) | undefined

	constructor() {
		this.element.addEventListener("click", this.guard, true)
		this.sync()
	}

	private readonly guard = (event: Event): void => {
		if (this.disabled) {
			event.preventDefault()
			event.stopImmediatePropagation()
		}
	}

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	ngOnDestroy(): void {
		this.element.removeEventListener("click", this.guard, true)
		this.stopRipple?.()
		this.binding.destroy()
	}

	private sync(): void {
		const p = this.defaults("OmniFab", { color: this.color, size: this.size, variant: this.variant, type: this.type })
		this.binding.apply(fabPart({ ...p, disabled: this.disabled || undefined, as: this.element.tagName === "A" ? "a" : "button" }))
		this.stopRipple?.()
		this.stopRipple = this.disableRipple ? undefined : attachRipple(this.element, { centered: this.variant !== "extended" })
	}
}

