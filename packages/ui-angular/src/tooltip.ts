import { DOCUMENT, isPlatformBrowser } from "@angular/common"
import {
	ChangeDetectionStrategy,
	Component,
	ComponentRef,
	Directive,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	PLATFORM_ID,
	ViewContainerRef,
	booleanAttribute,
	inject,
} from "@angular/core"
import { createTooltip, type CloseReason, type Part } from "@omnifront/ui"
import { autoPosition, type Placement } from "@omnifront/ui/position"
import { OmniPart } from "./part"
import { ElementPortal, OmniIds, ThemeScope, injectDefaults } from "./theme"

/** The tooltip itself, created by the directive and moved to a portal in `<body>`. Not used directly. */
@Component({
	selector: "omni-tooltip-panel",
	standalone: true,
	imports: [OmniPart],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: "display: contents" },
	template: `<div class="omni-tooltip" [omniPart]="part">{{ text }}</div>`,
})
export class OmniTooltipPanel {
	@Input() part: Part | null = null
	@Input() text = ""
}

/**
 * A short description that appears on hover and keyboard focus and goes on Escape:
 * `<button omni-icon-button omniTooltip="Delete" aria-label="Delete">`. The tooltip is wired to the
 * element with `aria-describedby` while it is open. Text only here; for rich content use a Popover (wave 3).
 */
@Directive({ selector: "[omniTooltip]", standalone: true })
export class OmniTooltip implements OnInit, OnChanges, OnDestroy {
	/** What it says. Empty means no tooltip. It describes the element; it is not its name. */
	@Input("omniTooltip") title: string | null | undefined
	/** Default `bottom`; it flips when there is no room. */
	@Input() tooltipPlacement: Placement | undefined
	/** Controlled. Leave out for hover and focus to decide. */
	@Input() tooltipOpen: boolean | undefined
	/** Milliseconds the pointer rests before it opens. Default 100. Keyboard focus opens at once. */
	@Input() tooltipEnterDelay: number | undefined
	@Input() tooltipLeaveDelay: number | undefined
	/** Close as soon as the pointer leaves the trigger, even towards the tooltip. */
	@Input({ transform: booleanAttribute }) tooltipDisableInteractive = false
	@Output() tooltipOpened = new EventEmitter<Event | undefined>()
	@Output() tooltipClosed = new EventEmitter<Event | undefined>()

	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly vcr = inject(ViewContainerRef)
	private readonly defaults = injectDefaults()
	private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
	private readonly portal = new ElementPortal(inject(DOCUMENT), inject(ThemeScope, { optional: true }))
	private readonly machine = createTooltip({
		id: inject(OmniIds).create(),
		onOpenChange: (open: boolean, _reason: CloseReason, event?: Event) => (open ? this.tooltipOpened : this.tooltipClosed).emit(event),
	})
	private panel: ComponentRef<OmniTooltipPanel> | undefined
	private stopPosition: (() => void) | undefined
	private detachTrigger: (() => void) | undefined
	private stopListening: (() => void) | undefined

	ngOnInit(): void {
		this.sync()
		if (!this.browser) return
		this.detachTrigger = this.machine.attachTrigger(this.element)
		this.stopListening = this.machine.subscribe(() => this.render())
	}

	ngOnChanges(): void {
		this.sync()
		this.stopPosition?.() // the placement may have changed
		this.stopPosition = undefined
		this.render()
	}

	ngOnDestroy(): void {
		this.stopListening?.()
		this.detachTrigger?.()
		this.close()
		this.machine.dispose()
	}

	private get hasTitle(): boolean {
		return this.title !== undefined && this.title !== null && this.title !== ""
	}

	private sync(): void {
		const p = this.defaults("OmniTooltip", { tooltipPlacement: this.tooltipPlacement })
		this.tooltipPlacement = p.tooltipPlacement
		this.machine.setProps({
			open: this.hasTitle ? this.tooltipOpen : false,
			enterDelay: this.tooltipEnterDelay,
			leaveDelay: this.tooltipLeaveDelay,
			disableInteractive: this.tooltipDisableInteractive || undefined,
			disabled: !this.hasTitle,
		})
	}

	private render(): void {
		if (!this.browser) return
		const { mounted } = this.machine.getSnapshot()
		if (!mounted || !this.hasTitle) {
			this.close()
			return
		}
		if (!this.panel) {
			this.panel = this.vcr.createComponent(OmniTooltipPanel)
			this.portal.enter(this.panel.location.nativeElement as HTMLElement)
		}
		this.panel.setInput("part", this.machine.connect().tooltip)
		this.panel.setInput("text", this.title ?? "")
		this.panel.changeDetectorRef.detectChanges()
		if (!this.stopPosition) {
			const tooltip = (this.panel.location.nativeElement as HTMLElement).querySelector<HTMLElement>(".omni-tooltip")
			const placement = this.tooltipPlacement ?? "bottom"
			if (tooltip) this.stopPosition = this.machine.attach({ trigger: this.element, tooltip, position: (anchor, el) => autoPosition(anchor, el, { placement, offset: 8 }) })
		}
	}

	private close(): void {
		this.stopPosition?.()
		this.stopPosition = undefined
		this.portal.leave()
		this.panel?.destroy()
		this.panel = undefined
	}
}
