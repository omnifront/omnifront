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
import { createDialog, type CloseReason, type Dialog } from "@omnifront/ui"
import { bindMachine } from "./machine"
import { OmniPart, PartBinding } from "./part"
import { HostPortal, OmniIds, ThemeScope, injectDefaults } from "./theme"

export type DialogCloseReason = Extract<CloseReason, "escapeKeyDown" | "backdropClick" | "closeButton" | "programmatic">
export interface DialogCloseEvent {
	reason: DialogCloseReason
	event: Event | undefined
}

/** The Dialog that a title, content or actions element sits in. */
export const OMNI_DIALOG = new InjectionToken<OmniDialog>("OMNI_DIALOG")

/**
 * Modal dialog. Focus moves in and is trapped, Escape and a click outside ask to close, the page
 * behind stops scrolling and is hidden from screen readers, and focus returns to the opener.
 *
 *     <omni-dialog [(open)]="open">
 *       <h2 omniDialogTitle>Delete project?</h2>
 *       <div omniDialogContent><p omniDialogContentText>This cannot be undone.</p></div>
 *       <div omniDialogActions><button omni-button (click)="open = false">Cancel</button></div>
 *     </omni-dialog>
 *
 * Angular lifecycle: while it is shown the host element is moved to a portal at the end of
 * `<body>` (so it is above everything and themed), and put back when it closes or is destroyed.
 */
@Component({
	selector: "omni-dialog",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [{ provide: OMNI_DIALOG, useExisting: forwardRef(() => OmniDialog) }],
	host: { style: "display: contents" },
	template: `
		@if (clientReady() && (state().mounted || keepMounted)) {
			<div
				class="omni-dialog"
				[class]="className ? 'omni-dialog ' + className : 'omni-dialog'"
				[attr.data-max-width]="maxWidth === false ? null : (maxWidth ?? 'sm')"
				[attr.data-full-width]="fullWidth ? '' : null"
				[attr.data-full-screen]="fullScreen ? '' : null"
				[attr.data-state]="state().open ? 'open' : 'closed'"
				[attr.hidden]="state().mounted ? null : ''"
			>
				@if (!hideBackdrop) {
					<div class="omni-dialog__backdrop" [omniPart]="parts().backdrop"></div>
				}
				<div class="omni-dialog__container" [omniPart]="parts().container">
					<div #paper class="omni-dialog__paper" [omniPart]="parts().content"><ng-content /></div>
				</div>
			</div>
		}
	`,
})
export class OmniDialog implements OnInit, OnChanges {
	@Input() open: boolean | undefined
	@Input() maxWidth: "xs" | "sm" | "md" | "lg" | "xl" | false | undefined
	@Input({ transform: booleanAttribute }) fullWidth = false
	@Input({ transform: booleanAttribute }) fullScreen = false
	@Input({ transform: booleanAttribute }) disableEscapeKeyDown = false
	@Input({ transform: booleanAttribute }) hideBackdrop = false
	/** Keep the dialog in the page (hidden) while closed, so its content is not rebuilt each time. */
	@Input({ transform: booleanAttribute }) keepMounted = false
	@Input() role: "dialog" | "alertdialog" | undefined
	/** `aria-label`, for a dialog with no visible title. */
	@Input() label: string | undefined
	@Input() className: string | undefined
	/** `[(open)]` works: the dialog says `false` when the user asks to close. */
	@Output() openChange = new EventEmitter<boolean>()
	/** The user asked to close (Escape, click outside); `reason` tells which. */
	@Output() closed = new EventEmitter<DialogCloseEvent>()

	private paper: HTMLElement | undefined
	// The paper's parent is the full-screen container; reading it from the paper keeps both in step
	// (separate queries do not promise which setter runs first).
	@ViewChild("paper") set paperRef(ref: ElementRef<HTMLElement> | undefined) {
		this.paper = ref?.nativeElement
		this.syncDom()
	}

	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly scope = inject(ThemeScope, { optional: true })
	private readonly defaults = injectDefaults()
	private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
	private readonly portal = new HostPortal(this.host, inject(DOCUMENT), this.scope)
	private readonly id = inject(OmniIds).create()
	readonly machine: Dialog = createDialog({
		id: this.id,
		onOpenChange: (open, reason, event) => {
			this.closed.emit({ reason: reason as DialogCloseReason, event })
			this.openChange.emit(open)
		},
	})
	private readonly bound = bindMachine(this.machine, (m) => m.connect())
	readonly state = this.bound.state
	readonly parts = this.bound.parts
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
	}

	private sync(): void {
		const p = this.defaults("OmniDialog", { role: this.role, maxWidth: this.maxWidth })
		this.maxWidth = p.maxWidth
		this.machine.setProps({ open: this.open, role: p.role, label: this.label, closeOnEscape: !this.disableEscapeKeyDown })
	}

	/** Move to the portal while mounted, and run the machine's DOM side while open and rendered. */
	private syncDom(): void {
		const { mounted, open } = this.machine.getSnapshot()
		if (this.browser && this.clientReady()) {
			if (mounted || this.keepMounted) this.portal.enter()
			else this.portal.leave()
		}
		const want = open && this.paper !== undefined
		if (want && !this.detach && this.paper) this.detach = this.machine.attach({ content: this.paper, container: this.paper.parentElement ?? undefined })
		else if (!want && this.detach) {
			this.detach()
			this.detach = undefined
		}
	}
}

/** Shared by the dialog's title and text directives. A base class that injects needs its own (selector-less) decorator. */
@Directive()
abstract class DialogPart implements OnInit, OnDestroy {
	protected readonly dialog = inject(OMNI_DIALOG, { optional: true })
	protected readonly binding = new PartBinding(inject<ElementRef<HTMLElement>>(ElementRef).nativeElement)
	protected abstract pick(dialog: OmniDialog): import("@omnifront/ui").Part | undefined

	ngOnInit(): void {
		this.binding.apply((this.dialog && this.pick(this.dialog)) ?? null)
	}

	ngOnDestroy(): void {
		this.binding.destroy()
	}
}

/** `<h2 omniDialogTitle>`: names the dialog for screen readers. */
@Directive({ selector: "[omniDialogTitle]", standalone: true, host: { class: "omni-dialog__title" } })
export class OmniDialogTitle extends DialogPart {
	protected pick(dialog: OmniDialog) {
		return dialog.machine.connect().title
	}
}

/** `<p omniDialogContentText>`: what screen readers announce as the dialog's description. */
@Directive({ selector: "[omniDialogContentText]", standalone: true, host: { class: "omni-dialog__content-text" } })
export class OmniDialogContentText extends DialogPart {
	protected pick(dialog: OmniDialog) {
		return dialog.machine.connect().description
	}
}

@Directive({ selector: "[omniDialogContent]", standalone: true, host: { class: "omni-dialog__content" } })
export class OmniDialogContent {}

@Directive({ selector: "[omniDialogActions]", standalone: true, host: { class: "omni-dialog__actions" } })
export class OmniDialogActions {}
