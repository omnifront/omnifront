import type { Palette, PaletteMode, Theme } from "./types"
import { typographyVariants } from "./types"

/** Name of the attribute that selects a colour scheme: `light`, `dark` or `system`. */
export const COLOR_SCHEME_ATTRIBUTE = "data-omni-color-scheme"
/** Name of the attribute that scopes a theme's variables to an element (and portals that copy it). */
export const THEME_ATTRIBUTE = "data-omni-theme"

const kebab = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
type Vars = Array<[name: string, value: string | number]>

function paletteVars(p: Palette): Vars {
	const vars: Vars = []
	for (const name of ["primary", "secondary", "error", "warning", "info", "success"] as const) {
		const c = p[name]
		vars.push(
			[`--omni-palette-${name}-main`, c.main],
			[`--omni-palette-${name}-light`, c.light],
			[`--omni-palette-${name}-dark`, c.dark],
			[`--omni-palette-${name}-contrast-text`, c.contrastText],
		)
	}
	for (const [k, v] of Object.entries(p.grey)) vars.push([`--omni-palette-grey-${k}`, v])
	for (const [k, v] of Object.entries(p.text)) vars.push([`--omni-palette-text-${k}`, v])
	for (const [k, v] of Object.entries(p.background)) vars.push([`--omni-palette-background-${k}`, v])
	for (const [k, v] of Object.entries(p.action)) vars.push([`--omni-palette-action-${kebab(k)}`, v])
	// Material lightens elevated surfaces in dark mode with a white overlay instead of a darker shadow.
	const dark = p.mode === "dark"
	vars.push(
		["--omni-overlay-8", dark ? "linear-gradient(rgba(255,255,255,0.12),rgba(255,255,255,0.12))" : "none"],
		["--omni-overlay-24", dark ? "linear-gradient(rgba(255,255,255,0.16),rgba(255,255,255,0.16))" : "none"],
		["--omni-palette-divider", p.divider],
		["--omni-palette-common-black", p.common.black],
		["--omni-palette-common-white", p.common.white],
	)
	return vars
}

function sharedVars(t: Theme): Vars {
	const vars: Vars = [
		["--omni-font-family", t.typography.fontFamily],
		["--omni-spacing", `${t.spacingUnit}px`],
		["--omni-shape-border-radius", `${t.shape.borderRadius}px`],
	]
	for (const v of typographyVariants) {
		const s = t.typography[v]
		vars.push(
			[`--omni-typography-${v}-font`, `${s.fontWeight} ${s.fontSize}/${s.lineHeight} ${s.fontFamily}`],
			[`--omni-typography-${v}-letter-spacing`, s.letterSpacing],
			[`--omni-typography-${v}-text-transform`, s.textTransform ?? "none"],
		)
	}
	t.shadows.forEach((s, i) => vars.push([`--omni-shadow-${i}`, s]))
	for (const [k, v] of Object.entries(t.transitions.duration)) vars.push([`--omni-duration-${kebab(k)}`, `${v}ms`])
	for (const [k, v] of Object.entries(t.transitions.easing)) vars.push([`--omni-easing-${kebab(k)}`, v])
	for (const [k, v] of Object.entries(t.zIndex)) vars.push([`--omni-z-${kebab(k)}`, v])
	return vars
}

const block = (selector: string, vars: Vars, scheme?: PaletteMode): string =>
	`${selector}{${[...vars.map(([k, v]) => `${k}:${v}`), ...(scheme ? [`color-scheme:${scheme}`] : [])].join(";")}}`

export interface ThemeToCssOptions {
	/** Where the variables apply. `:root` by default; a provider uses `[data-omni-theme="id"]`. */
	selector?: string
}

/**
 * The theme as CSS custom properties (`--omni-palette-primary-main`, `--omni-spacing`, ...).
 *
 * The scheme-independent variables and the light palette go on `selector`. The dark palette applies
 * where the same element has `data-omni-color-scheme="dark"`, or `="system"` while the user's
 * system prefers dark. No attribute means light. Plain CSS, so it works on the server and in RSC.
 */
export function themeToCss(theme: Theme, options: ThemeToCssOptions = {}): string {
	const selector = options.selector ?? ":root"
	const dark = paletteVars(theme.colorSchemes.dark)
	return [
		block(selector, [...sharedVars(theme), ...paletteVars(theme.colorSchemes.light)], "light"),
		block(`${selector}[${COLOR_SCHEME_ATTRIBUTE}="dark"]`, dark, "dark"),
		`@media (prefers-color-scheme:dark){${block(`${selector}[${COLOR_SCHEME_ATTRIBUTE}="system"]`, dark, "dark")}}`,
	].join("\n")
}

/** Imperative version for the page root: set the variables (light palette) on one element. */
export function applyTheme(theme: Theme, element: HTMLElement): void {
	for (const [k, v] of [...sharedVars(theme), ...paletteVars(theme.colorSchemes.light)]) {
		element.style.setProperty(k, String(v))
	}
}
