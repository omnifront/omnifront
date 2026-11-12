import { createPalette } from "./palette"
import { defaultShadows } from "./shadows"
import { createTypography } from "./typography"
import type {
	BreakpointKey,
	Breakpoints,
	PaletteMode,
	PaletteOptions,
	Theme,
	ThemeOptions,
	Transitions,
	ZIndex,
} from "./types"

function createBreakpoints(overrides: Partial<Record<BreakpointKey, number>> = {}): Breakpoints {
	const values: Record<BreakpointKey, number> = { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536, ...overrides }
	const keys = (Object.keys(values) as BreakpointKey[]).sort((a, b) => values[a] - values[b])
	const px = (key: BreakpointKey | number): number => (typeof key === "number" ? key : values[key])
	const step = 0.05
	const next = (key: BreakpointKey): number | undefined => {
		const i = keys.indexOf(key)
		const following = keys[i + 1]
		return following === undefined ? undefined : values[following]
	}
	return {
		values,
		keys,
		up: (key) => `@media (min-width:${px(key)}px)`,
		down: (key) => `@media (max-width:${px(key) - step}px)`,
		between: (start, end) => `@media (min-width:${px(start)}px) and (max-width:${px(end) - step}px)`,
		only(key) {
			const upper = next(key)
			return upper === undefined
				? `@media (min-width:${values[key]}px)`
				: `@media (min-width:${values[key]}px) and (max-width:${upper - step}px)`
		},
	}
}

const duration = {
	shortest: 150,
	shorter: 200,
	short: 250,
	standard: 300,
	complex: 375,
	enteringScreen: 225,
	leavingScreen: 195,
}
const easing = {
	easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
	easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
	easeIn: "cubic-bezier(0.4, 0, 1, 1)",
	sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
}

function createTransitions(overrides: ThemeOptions["transitions"] = {}): Transitions {
	const d = { ...duration, ...overrides.duration }
	const e = { ...easing, ...overrides.easing }
	return {
		easing: e,
		duration: d,
		create(props, options = {}) {
			const list = Array.isArray(props) ? props : [props]
			return list
				.map((p) => `${p} ${options.duration ?? d.standard}ms ${options.easing ?? e.easeInOut} ${options.delay ?? 0}ms`)
				.join(",")
		},
	}
}

const defaultZIndex: ZIndex = {
	mobileStepper: 1000,
	fab: 1050,
	speedDial: 1050,
	appBar: 1100,
	drawer: 1200,
	modal: 1300,
	snackbar: 1400,
	tooltip: 1500,
}

const merge = (...parts: Array<PaletteOptions | undefined>): PaletteOptions =>
	Object.assign({}, ...parts.map((p) => p ?? {})) as PaletteOptions

/**
 * Build a theme the way MUI's `createTheme` does: pass only what you change.
 * Both colour schemes are always built (`colorSchemes.light` and `.dark`); `palette.mode` only
 * picks which one is `theme.palette`.
 */
export function createTheme(options: ThemeOptions = {}): Theme {
	const mode: PaletteMode = options.palette?.mode ?? "light"
	const schemeOptions = (m: PaletteMode): PaletteOptions =>
		merge(options.palette, options.colorSchemes?.[m], { mode: m })
	const colorSchemes = { light: createPalette(schemeOptions("light")), dark: createPalette(schemeOptions("dark")) }
	const spacingUnit = options.spacing ?? 8
	return {
		palette: colorSchemes[mode],
		colorSchemes,
		typography: createTypography(options.typography),
		spacing: (...factors) => (factors.length === 0 ? [1] : factors).map((f) => `${f * spacingUnit}px`).join(" "),
		spacingUnit,
		breakpoints: createBreakpoints(options.breakpoints?.values),
		shape: { borderRadius: options.shape?.borderRadius ?? 4 },
		shadows: options.shadows ?? defaultShadows,
		transitions: createTransitions(options.transitions),
		zIndex: { ...defaultZIndex, ...options.zIndex },
		direction: options.direction ?? "ltr",
		components: options.components ?? {},
	}
}

/** Merge a component's `theme.components` defaults under the props it was given (undefined = not given). */
export function resolveProps<P extends object>(theme: Theme | undefined, name: string, props: P): P {
	const defaults = theme?.components[name]?.defaultProps
	if (!defaults) return props
	const out: Record<string, unknown> = { ...defaults }
	for (const [key, value] of Object.entries(props)) if (value !== undefined) out[key] = value
	return out as P
}
