import type { Typography, TypographyOptions, TypographyStyle, TypographyVariant } from "./types"

const defaultFamily = '"Roboto", "Helvetica", "Arial", sans-serif'

type Spec = [weight: "light" | "regular" | "medium", sizePx: number, lineHeight: number, letterSpacingPx: number, upper?: boolean]

// Material Design 2 type scale (sizes in px at 16px root, letter spacing in px).
const scale: Record<TypographyVariant, Spec> = {
	h1: ["light", 96, 1.167, -1.5],
	h2: ["light", 60, 1.2, -0.5],
	h3: ["regular", 48, 1.167, 0],
	h4: ["regular", 34, 1.235, 0.25],
	h5: ["regular", 24, 1.334, 0],
	h6: ["medium", 20, 1.6, 0.15],
	subtitle1: ["regular", 16, 1.75, 0.15],
	subtitle2: ["medium", 14, 1.57, 0.1],
	body1: ["regular", 16, 1.5, 0.15],
	body2: ["regular", 14, 1.43, 0.15],
	button: ["medium", 14, 1.75, 0.4, true],
	caption: ["regular", 12, 1.66, 0.4],
	overline: ["regular", 12, 2.66, 1, true],
}

const round = (n: number): number => Math.round(n * 1e5) / 1e5

export function createTypography(options: TypographyOptions = {}): Typography {
	const fontFamily = options.fontFamily ?? defaultFamily
	const fontSize = options.fontSize ?? 14
	const htmlFontSize = options.htmlFontSize ?? 16
	const weights = {
		light: options.fontWeightLight ?? 300,
		regular: options.fontWeightRegular ?? 400,
		medium: options.fontWeightMedium ?? 500,
	}
	const coef = fontSize / 14
	const pxToRem = (px: number): string => `${round((px / htmlFontSize) * coef)}rem`

	const variants = {} as Record<TypographyVariant, TypographyStyle>
	for (const key of Object.keys(scale) as TypographyVariant[]) {
		const [weight, size, lineHeight, spacingPx, upper] = scale[key]
		variants[key] = {
			fontFamily,
			fontWeight: weights[weight],
			fontSize: pxToRem(size),
			lineHeight,
			letterSpacing: `${round(spacingPx / size)}em`,
			...(upper ? { textTransform: "uppercase" as const } : {}),
			...options[key],
		}
	}

	return {
		fontFamily,
		fontSize,
		htmlFontSize,
		fontWeightLight: weights.light,
		fontWeightRegular: weights.regular,
		fontWeightMedium: weights.medium,
		fontWeightBold: options.fontWeightBold ?? 700,
		pxToRem,
		...variants,
	}
}
