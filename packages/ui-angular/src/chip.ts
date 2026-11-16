import {
	ChangeDetectionStrategy,
	Component,
	ContentChild,
	Directive,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	booleanAttribute,
	effect,
	inject,
	untracked,
} from "@angular/core"
import { ICON_PATHS, createChip } from "@omnifront/ui"
import { bindMachine } from "./machine"
import { OmniPart, PartBinding } from "./part"
import { injectDefaults } from "./theme"

/** Marks the icon at the start of a chip: `<svg omni-svg-icon omniChipIcon>`. */
@Directive({ selector: "[omniChipIcon]", standalone: true })
export class OmniChipIcon {}

/**
 * A compact tag, filter or choice: `<div omni-chip label="Angular" [clickable]="true" (delete)="remove()">`.
 * A clickable chip is a button (Enter and Space); with a `(delete)` listener it shows a delete icon
 * and Backspace / Delete on the focused chip removes it. Angular cannot tell whether a plain
 * `(click)` is bound, so say `clickable`. Put an `omni-avatar` inside for a picture at the start.
 */
@Component({
	selector: "div[omni-chip]",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: "omni-chip", "[attr.data-variant]": "variant ?? 'filled'", "[attr.data-color]": "color ?? 'default'", "[attr.data-size]": "size ?? 'medium'" },
	template: `
		<ng-content select="[omni-avatar]" />
		@if (icon) {<span class="omni-chip__icon"><ng-content select="[omniChipIcon]" /></span>}
		<span class="omni-chip__label">{{ label }}<ng-content /></span>
		@if (deleteEvent.observed) {
			<svg [omniPart]="parts().deleteIcon" viewBox="0 0 24 24" focusable="false"><path [attr.d]="cancelPath" /></svg>
		}
	`,
})
export class OmniChip implements OnInit, OnChanges, OnDestroy {
	@Input() label: string | undefined
	@Input() variant: "filled" | "outlined" | undefined
	@Input() color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" | undefined
	@Input() size: "small" | "medium" | undefined
	@Input({ transform: booleanAttribute }) clickable = false
	@Input({ transform: booleanAttribute }) disabled = false
	/** Fires for the delete icon and for Backspace / Delete on the chip. Having a listener is what shows the icon. */
	@Output("delete") readonly deleteEvent = new EventEmitter<Event>()
	@ContentChild(OmniChipIcon) protected icon: OmniChipIcon | undefined

	protected readonly cancelPath = ICON_PATHS.cancel
	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly binding = new PartBinding(this.element)
	private readonly defaults = injectDefaults()
	private readonly machine = createChip({ onDelete: (event) => this.deleteEvent.emit(event) })
	private readonly bound = bindMachine(this.machine, (m) => m.connect())
	protected readonly parts = this.bound.parts

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
		const p = this.defaults("OmniChip", { variant: this.variant, color: this.color, size: this.size })
		this.variant = p.variant
		this.color = p.color
		this.size = p.size
		this.machine.setProps({ clickable: this.clickable || undefined, deletable: this.deleteEvent.observed, disabled: this.disabled || undefined })
	}
}
