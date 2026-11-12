import { DOCUMENT, isPlatformBrowser } from "@angular/common"
import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	Directive,
	ElementRef,
	EventEmitter,
	InjectionToken,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	PLATFORM_ID,
	ViewChild,
	afterNextRender,
	signal,
	booleanAttribute,
	forwardRef,
	inject,
} from "@angular/core"
import { createMenu, type CloseReason, type Menu } from "@omnifront/ui"
import { autoPosition, type Placement } from "@omnifront/ui/position"
import { bindMachine } from "./machine"
import { OmniPart, PartBinding, withAttrs } from "./part"
import { HostPortal, OmniIds, ThemeScope, injectDefaults } from "./theme"

export type MenuCloseReason = Extract<CloseReason, "escapeKeyDown" | "outsidePress" | "tab" | "select" | "programmatic">
export interface MenuCloseEvent {
	reason: MenuCloseReason
	event: Event | undefined
}

/** The Menu that a menu item sits in. */
export const OMNI_MENU = new InjectionToken<OmniMenu>("OMNI_MENU")

/**
 * Dropdown menu hanging from an element. Arrow keys, Home, End and typing move focus; Enter or
 * Space choose; Escape and a click outside close. Like the dialog, its host element is moved to a
 * portal in `<body>` while it is shown.
 *
 *     <button #b omni-button (click)="open = true">Menu</button>
 *     <omni-menu [anchorEl]="b" [(open)]="open">
 *       <li omniMenuItem (click)="profile()">Profile</li>
 *     </omni-menu>
 */
@Component({
	selector: "omni-menu",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [{ provide: OMNI_MENU, useExisting: forwardRef(() => OmniMenu) }],
	host: { style: "display: contents" },
	template: `
		@if (clientReady() && state().mounted) {
			<ul #list class="omni-menu" [omniPart]="content()" [attr.aria-label]="label ?? null"><ng-content /></ul>
		}
	`,
})
export class OmniMenu implements OnInit, OnChanges {
	/** The element the menu hangs from, usually the button that opened it. */
	@Input() anchorEl: Element | null | undefined
	@Input() open: boolean | undefined
	/** Where it goes relative to the anchor. Default `bottom-start`; it flips when there is no room. */
	@Input() placement: Placement | undefined
	/** Move focus to the first item on open. Default true. */
	@Input({ transform: booleanAttribute }) autoFocus = true
	/** `aria-label`; without it the menu is labelled by the anchor's `id`. */
	@Input() label: string | undefined
	@Output() openChange = new EventEmitter<boolean>()
	@Output() closed = new EventEmitter<MenuCloseEvent>()

	private list: HTMLElement | undefined
	@ViewChild("list") set listRef(ref: ElementRef<HTMLElement> | undefined) {
		this.list = ref?.nativeElement
		this.syncDom()
	}

	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly defaults = injectDefaults()
	private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
	private readonly portal = new HostPortal(this.host, inject(DOCUMENT), inject(ThemeScope, { optional: true }))
	readonly machine: Menu = createMenu({
		id: inject(OmniIds).create(),
		onOpenChange: (open, reason, event) => {
			this.closed.emit({ reason: reason as MenuCloseReason, event })
			this.openChange.emit(open)
		},
	})
	private readonly bound = bindMachine(this.machine, (m) => m.connect())
	readonly state = this.bound.state
	protected readonly content = () => {
		const part = this.bound.parts().content
		return withAttrs(part, { "aria-labelledby": this.label ? undefined : this.anchorEl?.id || undefined })
	}
	private detach: (() => void) | undefined
	/**
	 * Overlays live in a portal, which only exists in the browser. Like React and Vue, render nothing
	 * until after the first render in the browser: the server HTML and the hydrated DOM then agree.
	 */
	protected readonly clientReady = signal(false)

	constructor() {
		afterNextRender(() => {
			this.clientReady.set(true)
			this.syncDom()
		})
		const off = this.machine.subscribe(() => this.syncDom())
		inject(DestroyRef).onDestroy(() => {
			off()
			this.detach?.()
			this.portal.leave()
		})
	}

	ngOnInit(): void {
		this.sync()
		this.syncDom()
	}

	ngOnChanges(): void {
		this.sync()
		// The anchor or placement may have changed while open: restart the DOM side.
		this.detach?.()
		this.detach = undefined
		this.syncDom()
	}

	private sync(): void {
		const p = this.defaults("OmniMenu", { placement: this.placement })
		this.placement = p.placement
		this.machine.setProps({ open: this.open, autoFocus: this.autoFocus })
	}

	private syncDom(): void {
		const { mounted, open } = this.machine.getSnapshot()
		if (this.browser && this.clientReady()) {
			if (mounted) this.portal.enter()
			else this.portal.leave()
		}
		const want = open && this.list !== undefined
		if (want && !this.detach && this.list) {
			const placement = this.placement
			this.detach = this.machine.attach({
				content: this.list,
				anchor: this.anchorEl,
				position: (anchor, floating) => autoPosition(anchor, floating, placement ? { placement } : {}),
			})
		} else if (!want && this.detach) {
			this.detach()
			this.detach = undefined
		}
	}
}

/** `<li omniMenuItem>`: one choice. Listen to `(click)`; it fires for mouse, Enter and Space, and the menu closes after. */
@Directive({
	selector: "[omniMenuItem]",
	standalone: true,
	host: {
		class: "omni-menu__item",
		"[attr.data-selected]": "selected ? '' : null",
		"[attr.data-dense]": "dense ? '' : null",
	},
})
export class OmniMenuItem implements OnInit, OnChanges, OnDestroy {
	@Input({ transform: booleanAttribute }) disabled = false
	@Input({ transform: booleanAttribute }) selected = false
	@Input({ transform: booleanAttribute }) dense = false

	private readonly menu = inject(OMNI_MENU, { optional: true })
	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly binding = new PartBinding(this.element)

	constructor() {
		// Capture phase: a disabled item must not reach the user's (click) listener.
		this.element.addEventListener("click", this.guard, true)
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

	private sync(): void {
		this.binding.apply(this.menu ? this.menu.machine.item({ disabled: this.disabled }) : null)
	}

	ngOnDestroy(): void {
		this.element.removeEventListener("click", this.guard, true)
		this.binding.destroy()
	}
}

@Directive({ selector: "[omniMenuDivider]", standalone: true, host: { class: "omni-menu__divider", role: "separator" } })
export class OmniMenuDivider {}
