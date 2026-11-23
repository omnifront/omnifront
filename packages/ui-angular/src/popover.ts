import { DOCUMENT, isPlatformBrowser } from "@angular/common"
import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	OnInit,
	Output,
	PLATFORM_ID,
	ViewChild,
	afterNextRender,
	inject,
	signal,
} from "@angular/core"
import { createPopover, type CloseReason, type Popover } from "@omnifront/ui"
import { autoPosition, type Placement } from "@omnifront/ui/position"
import { bindMachine } from "./machine"
import { OmniPart } from "./part"
import { HostPortal, OmniIds, ThemeScope, injectDefaults } from "./theme"

export type PopoverCloseReason = Extract<CloseReason, "escapeKeyDown" | "outsidePress" | "programmatic">
export interface PopoverCloseEvent {
	reason: PopoverCloseReason
	event: Event | undefined
}

/**
 * A panel next to an element, holding anything. Not modal: the page stays usable. Escape and a press
 * outside ask to close; focus moves in and goes back to the anchor. A popover is a dialog and needs a `label`.
 *
 *     <button #b (click)="open = true">Filters</button>
 *     <omni-popover [anchorEl]="b" [(open)]="open" label="Filters">…</omni-popover>
 *
 * Angular lifecycle: like the menu, the host element is moved to a portal in `<body>` while it is shown.
 */
@Component({
	selector: "omni-popover",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: "display: contents" },
	template: `
		@if (clientReady() && state().mounted) {
			<div #content class="omni-popover" [omniPart]="parts().content"><ng-content /></div>
		}
	`,
})
export class OmniPopover implements OnInit, OnChanges {
	/** The element it hangs from. A press on it is not "outside". */
	@Input() anchorEl: Element | null | undefined
	@Input() open: boolean | undefined
	/** Default `bottom-start`; it flips when there is no room. */
	@Input() placement: Placement | undefined
	/** `aria-label` of the dialog. */
	@Input() label: string | undefined
	@Input() labelledBy: string | undefined
	@Output() openChange = new EventEmitter<boolean>()
	@Output() closed = new EventEmitter<PopoverCloseEvent>()

	private content: HTMLElement | undefined
	@ViewChild("content") set contentRef(ref: ElementRef<HTMLElement> | undefined) {
		this.content = ref?.nativeElement
		this.syncDom()
	}

	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly defaults = injectDefaults()
	private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
	private readonly portal = new HostPortal(this.host, inject(DOCUMENT), inject(ThemeScope, { optional: true }))
	readonly machine: Popover = createPopover({
		id: inject(OmniIds).create(),
		onOpenChange: (open, reason, event) => {
			this.closed.emit({ reason: reason as PopoverCloseReason, event })
			this.openChange.emit(open)
		},
	})
	private readonly bound = bindMachine(this.machine, (m) => m.connect())
	readonly state = this.bound.state
	protected readonly parts = this.bound.parts
	private detach: (() => void) | undefined
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
		const p = this.defaults("OmniPopover", { placement: this.placement })
		this.placement = p.placement
		this.machine.setProps({ open: this.open, label: this.label, labelledBy: this.labelledBy })
	}

	private syncDom(): void {
		const { mounted, open } = this.machine.getSnapshot()
		if (this.browser && this.clientReady()) {
			if (mounted) this.portal.enter()
			else this.portal.leave()
		}
		const want = open && this.content !== undefined
		if (want && !this.detach && this.content) {
			const placement = this.placement ?? "bottom-start"
			this.detach = this.machine.attach({ content: this.content, anchor: this.anchorEl, position: (anchor, floating) => autoPosition(anchor, floating, { placement, offset: 8 }) })
		} else if (!want && this.detach) {
			this.detach()
			this.detach = undefined
		}
	}
}
