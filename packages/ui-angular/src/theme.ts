import { Component, ElementRef, Injectable, Input, OnChanges, OnInit, inject, signal } from "@angular/core"
import { DOCUMENT } from "@angular/common"
import {
	COLOR_SCHEME_ATTRIBUTE,
	THEME_ATTRIBUTE,
	createIdGenerator,
	createPortalRoot,
	createTheme,
	resolveProps,
	themeToCss,
	type ColorSchemeMode,
	type PortalRoot,
	type Theme,
} from "@omnifront/ui"

/** Hands out ids that are the same on the server and the client (one counter per application). */
@Injectable({ providedIn: "root" })
export class OmniIds {
	private readonly next = createIdGenerator("omni-ng")
	create(): string {
		return this.next()
	}
}

/** The nearest ThemeProvider's theme, scope id and colour scheme. Provided by <omni-theme-provider>. */
@Injectable()
export class ThemeScope {
	readonly theme = signal<Theme | undefined>(undefined)
	readonly id = signal<string | undefined>(undefined)
	readonly scheme = signal<ColorSchemeMode | undefined>(undefined)
}

let fallback: Theme | undefined
/** The nearest theme, or the default Material theme when there is no ThemeProvider. Call in an injection context. */
export function injectTheme(): Theme {
	return inject(ThemeScope, { optional: true })?.theme() ?? (fallback ??= createTheme())
}

/** `theme.components[name].defaultProps` under the props that were given. Call in an injection context. */
export function injectDefaults(): <P extends object>(name: string, props: P) => P {
	const scope = inject(ThemeScope, { optional: true })
	return (name, props) => resolveProps(scope?.theme(), name, props)
}

/**
 * Applies a theme to everything inside it: one `<style>` with the theme's CSS variables, scoped to
 * this provider, and a `display: contents` host that carries the scope and the colour scheme.
 * Overlays moved to the body copy both, so they are themed too.
 */
@Component({
	selector: "omni-theme-provider",
	standalone: true,
	providers: [ThemeScope],
	host: { style: "display: contents" },
	template: "<ng-content />",
})
export class OmniThemeProvider implements OnInit, OnChanges {
	@Input({ required: true }) theme!: Theme
	/** `light`, `dark`, or `system`. Inherited from an outer provider, else `system`. */
	@Input() colorScheme: ColorSchemeMode | undefined

	private readonly scope = inject(ThemeScope, { self: true })
	private readonly parent = inject(ThemeScope, { skipSelf: true, optional: true })
	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
	private readonly doc = inject(DOCUMENT)
	private readonly id = inject(OmniIds).create()
	private style: HTMLStyleElement | undefined

	ngOnInit(): void {
		this.sync()
	}

	ngOnChanges(): void {
		this.sync()
	}

	private sync(): void {
		const scheme = this.colorScheme ?? this.parent?.scheme() ?? "system"
		this.scope.theme.set(this.theme)
		this.scope.id.set(this.id)
		this.scope.scheme.set(scheme)
		this.host.setAttribute(THEME_ATTRIBUTE, this.id)
		this.host.setAttribute(COLOR_SCHEME_ATTRIBUTE, scheme)
		if (!this.style) {
			this.style = this.doc.createElement("style")
			this.host.insertBefore(this.style, this.host.firstChild)
		}
		this.style.textContent = themeToCss(this.theme, { selector: `[${THEME_ATTRIBUTE}="${this.id}"]` })
	}
}

/**
 * Moves a component's host element into a `<div data-omni-portal>` at the end of `<body>` while it
 * is shown, carrying the theme scope, and puts it back (where Angular expects it) when hidden or destroyed.
 */
export class HostPortal {
	private portal: PortalRoot | undefined
	private marker: Comment | undefined

	constructor(
		private readonly host: HTMLElement,
		private readonly doc: Document,
		private readonly scope: ThemeScope | null,
	) {}

	enter(): void {
		if (this.portal || !this.host.parentNode) return
		const id = this.scope?.id()
		this.portal = createPortalRoot({ [THEME_ATTRIBUTE]: id, [COLOR_SCHEME_ATTRIBUTE]: id ? this.scope?.scheme() : undefined }, this.doc)
		this.marker = this.doc.createComment("omni-portal")
		this.host.parentNode.insertBefore(this.marker, this.host)
		this.portal.element.appendChild(this.host)
	}

	leave(): void {
		if (!this.portal) return
		this.marker?.parentNode?.replaceChild(this.host, this.marker)
		this.marker = undefined
		this.portal.remove()
		this.portal = undefined
	}
}
