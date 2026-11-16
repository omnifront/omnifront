// Theme
export { createTheme, resolveProps } from "./theme/create-theme"
export { createPalette } from "./theme/palette"
export { createTypography } from "./theme/typography"
export { alpha, darken, lighten, getContrastRatio, getLuminance } from "./theme/colors"
export { themeToCss, applyTheme, COLOR_SCHEME_ATTRIBUTE, THEME_ATTRIBUTE } from "./theme/css"
export type { ThemeToCssOptions } from "./theme/css"
export { createColorSchemeStore, colorSchemeScript } from "./theme/color-scheme"
export type { ColorSchemeState, ColorSchemeStoreOptions } from "./theme/color-scheme"
export { typographyVariants } from "./theme/types"
export type {
	BreakpointKey,
	Breakpoints,
	ColorSchemeMode,
	ComponentsOptions,
	Palette,
	PaletteColor,
	PaletteColorOptions,
	PaletteMode,
	PaletteOptions,
	Theme,
	ThemeOptions,
	Transitions,
	Typography,
	TypographyOptions,
	TypographyStyle,
	TypographyVariant,
	ZIndex,
} from "./theme/types"

// Behaviour machines
export * from "./machines"
export {
	appBarPart,
	avatarPart,
	cardPart,
	badgeMarkPart,
	badgeState,
	displayPart,
	dividerPart,
	ICON_PATHS,
	paperPart,
	svgIconPart,
	typographyPart,
	typographyTag,
} from "./display"
export type {
	AppBarOptions,
	AvatarOptions,
	BadgeOptions,
	BadgeState,
	CardOptions,
	DividerOptions,
	PaperOptions,
	SvgIconOptions,
	TypographyColor,
	TypographyOptions as TypographyPartOptions,
	TypographyVariantName,
} from "./display"
export {
	alertPart,
	avatarGroupState,
	bottomNavigationActionPart,
	breadcrumbItems,
	breadcrumbsPart,
	circularProgressParts,
	linearProgressParts,
	linkPart,
	skeletonPart,
	sortLabelPart,
	stepPart,
	stepState,
	stepperPart,
	tablePaginationState,
} from "./feedback"
export type {
	AlertOptions,
	AvatarGroupState,
	BottomNavigationActionOptions,
	BreadcrumbsOptions,
	CircularProgressOptions,
	CircularProgressParts,
	LinearProgressOptions,
	LinearProgressParts,
	LinkOptions,
	ProgressColor,
	Severity,
	SkeletonOptions,
	SortLabelOptions,
	StepOptions,
	StepState,
	StepperOptions,
	TablePaginationOptions,
	TablePaginationState,
} from "./feedback"
export { buttonPart, iconButtonPart, fabPart, toggleButtonPart } from "./button"
export type {
	ButtonColor,
	ButtonOptions,
	ButtonSize,
	ButtonVariant,
	FabOptions,
	IconButtonColor,
	IconButtonOptions,
	ToggleButtonOptions,
} from "./button"

// DOM utilities (browser only, call after mount)
export { createIdGenerator } from "./dom/ids"
export { focusInside, getTabbables, trapFocus } from "./dom/focus"
export { lockScroll } from "./dom/scroll-lock"
export { pushLayer } from "./dom/layers"
export type { Layer } from "./dom/layers"
export { hideOthers } from "./dom/aria-hidden"
export { createPortalRoot } from "./dom/portal"
export type { PortalRoot } from "./dom/portal"
export { attachRipple } from "./dom/ripple"
export { attachAutosize } from "./dom/autosize"
export type { AutosizeOptions } from "./dom/autosize"
