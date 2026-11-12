import { darken, getContrastRatio, lighten } from "./colors"
import type { Palette, PaletteColor, PaletteColorOptions, PaletteMode, PaletteOptions } from "./types"

const grey = {
	50: "#fafafa",
	100: "#f5f5f5",
	200: "#eeeeee",
	300: "#e0e0e0",
	400: "#bdbdbd",
	500: "#9e9e9e",
	600: "#757575",
	700: "#616161",
	800: "#424242",
	900: "#212121",
	A100: "#f5f5f5",
	A200: "#eeeeee",
	A400: "#bdbdbd",
	A700: "#616161",
}

const common = { black: "#000", white: "#fff" }

const lightColors = {
	primary: { main: "#1976d2", light: "#42a5f5", dark: "#1565c0" },
	secondary: { main: "#9c27b0", light: "#ba68c8", dark: "#7b1fa2" },
	error: { main: "#d32f2f", light: "#ef5350", dark: "#c62828" },
	warning: { main: "#ed6c02", light: "#ff9800", dark: "#e65100" },
	info: { main: "#0288d1", light: "#03a9f4", dark: "#01579b" },
	success: { main: "#2e7d32", light: "#4caf50", dark: "#1b5e20" },
}

const darkColors = {
	primary: { main: "#90caf9", light: "#e3f2fd", dark: "#42a5f5" },
	secondary: { main: "#ce93d8", light: "#f3e5f5", dark: "#ab47bc" },
	error: { main: "#f44336", light: "#e57373", dark: "#d32f2f" },
	warning: { main: "#ffa726", light: "#ffb74d", dark: "#f57c00" },
	info: { main: "#29b6f6", light: "#4fc3f7", dark: "#0288d1" },
	success: { main: "#66bb6a", light: "#81c784", dark: "#388e3c" },
}

const lightScheme = {
	text: { primary: "rgba(0, 0, 0, 0.87)", secondary: "rgba(0, 0, 0, 0.6)", disabled: "rgba(0, 0, 0, 0.38)" },
	divider: "rgba(0, 0, 0, 0.12)",
	background: { default: "#fff", paper: "#fff" },
	action: {
		active: "rgba(0, 0, 0, 0.54)",
		hover: "rgba(0, 0, 0, 0.04)",
		hoverOpacity: 0.04,
		selected: "rgba(0, 0, 0, 0.08)",
		selectedOpacity: 0.08,
		disabled: "rgba(0, 0, 0, 0.26)",
		disabledBackground: "rgba(0, 0, 0, 0.12)",
		disabledOpacity: 0.38,
		focus: "rgba(0, 0, 0, 0.12)",
		focusOpacity: 0.12,
		activatedOpacity: 0.12,
	},
}

const darkScheme = {
	text: { primary: "#fff", secondary: "rgba(255, 255, 255, 0.7)", disabled: "rgba(255, 255, 255, 0.5)" },
	divider: "rgba(255, 255, 255, 0.12)",
	background: { default: "#121212", paper: "#121212" },
	action: {
		active: "#fff",
		hover: "rgba(255, 255, 255, 0.08)",
		hoverOpacity: 0.08,
		selected: "rgba(255, 255, 255, 0.16)",
		selectedOpacity: 0.16,
		disabled: "rgba(255, 255, 255, 0.3)",
		disabledBackground: "rgba(255, 255, 255, 0.12)",
		disabledOpacity: 0.38,
		focus: "rgba(255, 255, 255, 0.12)",
		focusOpacity: 0.12,
		activatedOpacity: 0.24,
	},
}

const colorNames = ["primary", "secondary", "error", "warning", "info", "success"] as const

export function createPalette(options: PaletteOptions = {}): Palette {
	const mode: PaletteMode = options.mode ?? "light"
	const contrastThreshold = options.contrastThreshold ?? 3
	const tonalOffset = options.tonalOffset ?? 0.2
	const scheme = mode === "dark" ? darkScheme : lightScheme

	const getContrastText = (background: string): string =>
		// White text when it reaches the threshold on this background, otherwise dark text.
		getContrastRatio(background, darkScheme.text.primary) >= contrastThreshold
			? darkScheme.text.primary
			: lightScheme.text.primary

	const augmentColor = (color: PaletteColorOptions): PaletteColor => {
		const main = color.main
		const light = color.light ?? lighten(main, tonalOffset)
		const dark = color.dark ?? darken(main, tonalOffset * 1.5)
		return { main, light, dark, contrastText: color.contrastText ?? getContrastText(main) }
	}

	const base = mode === "dark" ? darkColors : lightColors
	const colors = {} as Record<(typeof colorNames)[number], PaletteColor>
	for (const name of colorNames) {
		const given = options[name]
		// A colour given with only `main` derives light/dark from it; the built-in defaults are complete.
		colors[name] = augmentColor(given ? given : base[name])
	}

	return {
		mode,
		...colors,
		grey: { ...grey, ...options.grey },
		text: { ...scheme.text, ...options.text },
		divider: options.divider ?? scheme.divider,
		background: { ...scheme.background, ...options.background },
		action: { ...scheme.action, ...options.action },
		common,
		contrastThreshold,
		tonalOffset,
		getContrastText,
		augmentColor,
	}
}
