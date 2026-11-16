import { DOCUMENT, isPlatformBrowser } from "@angular/common"
import {
	ChangeDetectionStrategy,
	Component,
	ContentChild,
	DestroyRef,
	Directive,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	OnInit,
	Output,
	PLATFORM_ID,
	ViewChild,
	afterNextRender,
	booleanAttribute,
	inject,
	signal,
} from "@angular/core"
import { createSnackbar, type CloseReason, type Snackbar } from "@omnifront/ui"
import { bindMachine } from "./machine"
import { OmniPart } from "./part"
import { HostPortal, ThemeScope, injectDefaults } from "./theme"

export type SnackbarCloseReason = Extract<CloseReason, "timeout" | "outsidePress" | "escapeKeyDown" | "programmatic">
export interface SnackbarCloseEvent {
	reason: SnackbarCloseReason
	event: Event | undefined
}

/** Something at the far end of a Snackbar (a button): `<button omniSnackbarAction>`. */
@Directive({ selector: "[omniSnackbarAction]", standalone: true })
export class OmniSnackbarAction {}

/**
 * A short message at the edge of the screen. It is a polite live region (`role="status"`); put an
 * `omni-alert` inside for a severity, or use `message` and an element with `omniSnackbarAction`.
 *
 *     <omni-snackbar [(open)]="open" message="Saved" [autoHideDuration]="4000">
 *       <button omniSnackbarAction omni-button size="small" (click)="undo()">Undo</button>
 *     </omni-snackbar>
 *
 * Angular lifecycle: like the dialog, the host element is moved to a portal in `<body>` while it is shown.
 * The timer lives in the machine (on the injected Scheduler) and stops when the component is destroyed.
 */
@Component({
	selector: "omni-snackbar",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: "display: contents" },
	template: `
		@if (clientReady() && state().mounted) {
			<div class="omni-snackbar" [omniPart]="parts().root">
				<div #content class="omni-snackbar__content" [omniPart]="parts().content">
					@if (message !== undefined) {<div class="omni-snackbar__message">{{ message }}</div>}
					<ng-content />
					@if (action) {<div class="omni-snackbar__action"><ng-content select="[omniSnackbarAction]" /></div>}
				</div>
			</div>
		}
	`,
})
export class OmniSnackbar implements OnInit, OnChanges {
	@Input() open: boolean | undefined
	/** Milliseconds before it asks to close. Leave out to stay until closed. Hovering or focusing it pauses the timer. */
	@Input() autoHideDuration: number | null | undefined
	@Input() anchorOrigin: { vertical: "top" | "bottom"; horizontal: "left" | "center" | "right" } | undefined
	@Input() message: string | undefined
	/** A press outside does not close it. */
	@Input({ transform: booleanAttribute }) disableClickAway = false
	@Output() openChange = new EventEmitter<boolean>()
	/** It asks to close (after `autoHideDuration`, on Escape, on a press outside). You decide by setting `open`. */
	@Output() closed = new EventEmitter<SnackbarCloseEvent>()
	@ContentChild(OmniSnackbarAction) protected action: OmniSnackbarAction | undefined

	private content: HTMLElement | undefined
	@ViewChild("content") set contentRef(ref: ElementRef<HTMLElement> | undefined) {
		this.content = ref?.nativeElement
		this.syncDom()
	}

	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly defaults = injectDefaults()
	private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
	private readonly portal = new HostPortal(this.host, inject(DOCUMENT), inject(ThemeScope, { optional: true }))
	readonly machine: Snackbar = createSnackbar({
		onOpenChange: (open, reason, event) => {
			this.closed.emit({ reason: reason as SnackbarCloseReason, event })
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
	}

	private sync(): void {
		this.defaults("OmniSnackbar", {})
		this.machine.setProps({ open: this.open, autoHideDuration: this.autoHideDuration, anchorOrigin: this.anchorOrigin, closeOnOutsidePress: !this.disableClickAway })
	}

	private syncDom(): void {
		const { mounted, open } = this.machine.getSnapshot()
		if (this.browser && this.clientReady()) {
			if (mounted) this.portal.enter()
			else this.portal.leave()
		}
		const want = open && this.content !== undefined
		if (want && !this.detach && this.content) this.detach = this.machine.attach({ content: this.content })
		else if (!want && this.detach) {
			this.detach()
			this.detach = undefined
		}
	}
}
