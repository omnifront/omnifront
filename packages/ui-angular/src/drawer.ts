import { DOCUMENT, NgTemplateOutlet, isPlatformBrowser } from "@angular/common"
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
import { createDialog, type CloseReason, type Dialog } from "@omnifront/ui"
import { bindMachine } from "./machine"
import { OmniPart } from "./part"
import { HostPortal, OmniIds, ThemeScope, injectDefaults } from "./theme"

export type DrawerCloseReason = Extract<CloseReason, "escapeKeyDown" | "backdropClick" | "programmatic">
export interface DrawerCloseEvent {
	reason: DrawerCloseReason
	event: Event | undefined
}

/**
 * A panel at the edge of the screen. `temporary` is a modal dialog (focus trap, Escape, scroll lock);
 * `persistent` and `permanent` are an `<aside>` landmark that does not take focus.
 *
 *     <omni-drawer [(open)]="open" label="Navigation"><nav>…</nav></omni-drawer>
 *
 * Angular lifecycle: a temporary drawer's host is moved to a portal in `<body>` while it is shown (like the dialog).
 * The content is projected once through a template, so it is the same in every variant.
 */
@Component({
	selector: "omni-drawer",
	standalone: true,
	imports: [OmniPart, NgTemplateOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: "display: contents" },
	template: `
		<ng-template #body><ng-content /></ng-template>
		@if (variant === 'temporary') {
			@if (clientReady() && state().mounted) {
				<div class="omni-drawer" data-variant="temporary" [attr.data-anchor]="anchor" [style.--_w]="cssWidth()" [class]="className ? 'omni-drawer ' + className : 'omni-drawer'">
					<div class="omni-drawer__backdrop" [omniPart]="parts().backdrop"></div>
					<div class="omni-drawer__container" [omniPart]="parts().container">
						<div #paper class="omni-drawer__paper" [omniPart]="parts().content"><ng-container [ngTemplateOutlet]="body" /></div>
					</div>
				</div>
			}
		} @else {
			<aside class="omni-drawer" [class]="className ? 'omni-drawer ' + className : 'omni-drawer'" [attr.data-variant]="variant" [attr.data-anchor]="anchor" [attr.data-state]="isClosed() ? 'closed' : 'open'" [style.--_w]="cssWidth()" [attr.aria-label]="label">
				<div class="omni-drawer__paper" [attr.data-state]="isClosed() ? 'closed' : 'open'"><ng-container [ngTemplateOutlet]="body" /></div>
			</aside>
		}
	`,
})
export class OmniDrawer implements OnInit, OnChanges {
	/** `temporary` (a modal that closes on Escape and a click outside), `persistent` or `permanent`. Default `temporary`. */
	@Input() variant: "temporary" | "persistent" | "permanent" = "temporary"
	/** Which edge it sits on: `start` and `end` follow the writing direction. Default `start`. */
	@Input() anchor: "start" | "end" | "top" | "bottom" = "start"
	@Input() open: boolean | undefined
	/** Width of a side drawer, in px or any CSS length. Default 240px. */
	@Input() width: number | string | undefined
	/** The drawer's accessible name. Default "Navigation". */
	@Input() label = "Navigation"
	@Input() className: string | undefined
	@Output() openChange = new EventEmitter<boolean>()
	@Output() closed = new EventEmitter<DrawerCloseEvent>()

	private paper: HTMLElement | undefined
	@ViewChild("paper") set paperRef(ref: ElementRef<HTMLElement> | undefined) {
		this.paper = ref?.nativeElement
		this.syncDom()
	}

	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly defaults = injectDefaults()
	private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
	private readonly portal = new HostPortal(this.host, inject(DOCUMENT), inject(ThemeScope, { optional: true }))
	readonly machine: Dialog = createDialog({
		id: inject(OmniIds).create(),
		onOpenChange: (open, reason, event) => {
			this.closed.emit({ reason: reason as DrawerCloseReason, event })
			this.openChange.emit(open)
		},
	})
	private readonly bound = bindMachine(this.machine, (m) => m.connect())
	readonly state = this.bound.state
	protected readonly parts = this.bound.parts
	private readonly openInput = signal(false)
	protected isClosed = (): boolean => this.variant === "persistent" && !this.openInput()
	protected cssWidth = (): string | null => (this.width === undefined ? null : typeof this.width === "number" ? `${this.width}px` : this.width)
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
	}

	private sync(): void {
		const p = this.defaults("OmniDrawer", { variant: this.variant, anchor: this.anchor })
		this.variant = p.variant
		this.anchor = p.anchor
		this.openInput.set(this.open === true)
		this.machine.setProps({ open: this.variant === "temporary" ? this.open === true : false, label: this.label })
	}

	private syncDom(): void {
		const { mounted, open } = this.machine.getSnapshot()
		const temporary = this.variant === "temporary"
		if (this.browser && this.clientReady()) {
			if (temporary && mounted) this.portal.enter()
			else this.portal.leave()
		}
		const want = temporary && open && this.paper !== undefined
		if (want && !this.detach && this.paper) this.detach = this.machine.attach({ content: this.paper, container: this.paper.parentElement ?? undefined })
		else if (!want && this.detach) {
			this.detach()
			this.detach = undefined
		}
	}
}
