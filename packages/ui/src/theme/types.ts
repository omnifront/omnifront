export interface PaletteColor {
	main: string
	light: string
	dark: string
	contrastText: string
}

/** What you may pass for a palette colour: only `main` is required; the rest is derived. */
export type PaletteColorOptions = { main: string } & Partial<PaletteColor>

export type PaletteMode = "light" | "dark"
/** What the user picked; `system` follows `prefers-color-scheme`. */
export type ColorSchemeMode = PaletteMode | "system"

export interface Palette {
	mode: PaletteMode
	primary: PaletteColor
	secondary: PaletteColor
	error: PaletteColor
	warning: PaletteColor
	info: PaletteColor
	success: PaletteColor
	grey: Record<string, string>
	text: { primary: string; secondary: string; disabled: string }
	divider: string
	background: { default: string; paper: string }
	action: {
		active: string
		hover: string
		hoverOpacity: number
		selected: string
		selectedOpacity: number
		disabled: string
		disabledBackground: string
		disabledOpacity: number
		focus: string
		focusOpacity: number
		activatedOpacity: number
	}
	common: { black: string; white: string }
	contrastThreshold: number
	tonalOffset: number
	getContrastText(background: string): string
	augmentColor(color: PaletteColorOptions): PaletteColor
}

export interface PaletteOptions {
	mode?: PaletteMode
	primary?: PaletteColorOptions
	secondary?: PaletteColorOptions
	error?: PaletteColorOptions
	warning?: PaletteColorOptions
	info?: PaletteColorOptions
	success?: PaletteColorOptions
	grey?: Record<string, string>
	text?: Partial<Palette["text"]>
	divider?: string
	background?: Partial<Palette["background"]>
	action?: Partial<Palette["action"]>
	contrastThreshold?: number
	tonalOffset?: number
}

export interface TypographyStyle {
	fontFamily: string
	fontWeight: number
	/** rem or px string, e.g. "0.875rem". */
	fontSize: string
	lineHeight: number
	letterSpacing: string
	textTransform?: "none" | "uppercase"
}

export const typographyVariants = [
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"subtitle1",
	"subtitle2",
	"body1",
	"body2",
	"button",
	"caption",
	"overline",
] as const
export type TypographyVariant = (typeof typographyVariants)[number]

export interface Typography extends Record<TypographyVariant, TypographyStyle> {
	fontFamily: string
	fontSize: number
	htmlFontSize: number
	fontWeightLight: number
	fontWeightRegular: number
	fontWeightMedium: number
	fontWeightBold: number
	pxToRem(px: number): string
}

export interface TypographyOptions {
	fontFamily?: string
	fontSize?: number
	htmlFontSize?: number
	fontWeightLight?: number
	fontWeightRegular?: number
	fontWeightMedium?: number
	fontWeightBold?: number
	h1?: Partial<TypographyStyle>
	h2?: Partial<TypographyStyle>
	h3?: Partial<TypographyStyle>
	h4?: Partial<TypographyStyle>
	h5?: Partial<TypographyStyle>
	h6?: Partial<TypographyStyle>
	subtitle1?: Partial<TypographyStyle>
	subtitle2?: Partial<TypographyStyle>
	body1?: Partial<TypographyStyle>
	body2?: Partial<TypographyStyle>
	button?: Partial<TypographyStyle>
	caption?: Partial<TypographyStyle>
	overline?: Partial<TypographyStyle>
}

export type BreakpointKey = "xs" | "sm" | "md" | "lg" | "xl"

export interface Breakpoints {
	values: Record<BreakpointKey, number>
	keys: BreakpointKey[]
	/** `@media (min-width:600px)` */
	up(key: BreakpointKey | number): string
	/** `@media (max-width:599.95px)` */
	down(key: BreakpointKey | number): string
	between(start: BreakpointKey | number, end: BreakpointKey | number): string
	only(key: BreakpointKey): string
}

export interface Transitions {
	easing: { easeInOut: string; easeOut: string; easeIn: string; sharp: string }
	duration: {
		shortest: number
		shorter: number
		short: number
		standard: number
		complex: number
		enteringScreen: number
		leavingScreen: number
	}
	create(props: string | string[], options?: { duration?: number; easing?: string; delay?: number }): string
}

export type ZIndex = Record<
	"mobileStepper" | "fab" | "speedDial" | "appBar" | "drawer" | "modal" | "snackbar" | "tooltip",
	number
>

/** Per-component defaults, keyed by component name (`OmniButton`, `OmniTextField`, ...). */
export type ComponentsOptions = Record<string, { defaultProps?: Record<string, unknown> }>

export interface ThemeOptions {
	palette?: PaletteOptions
	/** Palette overrides for one colour scheme only (applied on top of `palette`). */
	colorSchemes?: { light?: PaletteOptions; dark?: PaletteOptions }
	typography?: TypographyOptions
	/** Spacing unit in px (default 8). */
	spacing?: number
	breakpoints?: { values?: Partial<Record<BreakpointKey, number>> }
	shape?: { borderRadius?: number }
	shadows?: string[]
	transitions?: Partial<Pick<Transitions, "easing" | "duration">>
	zIndex?: Partial<ZIndex>
	direction?: "ltr" | "rtl"
	components?: ComponentsOptions
}

export interface Theme {
	/** Palette of `palette.mode` (light by default), kept at `palette` the way MUI does it. */
	palette: Palette
	colorSchemes: Record<PaletteMode, Palette>
	typography: Typography
	/** `spacing(1)` is "8px", `spacing(1, 2)` is "8px 16px". */
	spacing(...factors: number[]): string
	spacingUnit: number
	breakpoints: Breakpoints
	shape: { borderRadius: number }
	shadows: string[]
	transitions: Transitions
	zIndex: ZIndex
	direction: "ltr" | "rtl"
	components: ComponentsOptions
}
