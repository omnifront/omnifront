/** Small colour helpers (hex, rgb() and rgba() strings only). Enough for palette maths, no dependency. */

type Rgb = [number, number, number]

export function parseColor(color: string): { rgb: Rgb; alpha: number } {
	const value = color.trim()
	if (value.startsWith("#")) {
		let hex = value.slice(1)
		if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join("")
		const n = (i: number): number => parseInt(hex.slice(i, i + 2), 16)
		return { rgb: [n(0), n(2), n(4)], alpha: hex.length === 8 ? n(6) / 255 : 1 }
	}
	const match = /^rgba?\(([^)]+)\)$/.exec(value)
	if (match) {
		const parts = (match[1] as string).split(/[\s,/]+/).filter(Boolean).map(Number)
		return { rgb: [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0], alpha: parts[3] ?? 1 }
	}
	throw new Error(`omnifront/ui: unsupported colour "${color}" (use #hex, rgb() or rgba())`)
}

const round = (n: number): number => Math.round(n)
const format = ([r, g, b]: Rgb, alpha: number): string =>
	alpha === 1 ? `rgb(${round(r)}, ${round(g)}, ${round(b)})` : `rgba(${round(r)}, ${round(g)}, ${round(b)}, ${alpha})`

/** The same colour with another opacity. */
export function alpha(color: string, value: number): string {
	return format(parseColor(color).rgb, value)
}

/** Mix towards black: `0` leaves the colour alone, `1` gives black. */
export function darken(color: string, coefficient: number): string {
	const { rgb, alpha: a } = parseColor(color)
	return format(rgb.map((c) => c * (1 - coefficient)) as Rgb, a)
}

/** Mix towards white: `0` leaves the colour alone, `1` gives white. */
export function lighten(color: string, coefficient: number): string {
	const { rgb, alpha: a } = parseColor(color)
	return format(rgb.map((c) => c + (255 - c) * coefficient) as Rgb, a)
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function getLuminance(color: string): number {
	const [r, g, b] = parseColor(color).rgb.map((c) => {
		const s = c / 255
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
	}) as Rgb
	return Number((0.2126 * r + 0.7152 * g + 0.0722 * b).toFixed(3))
}

/** WCAG contrast ratio between two colours, 1 to 21. */
export function getContrastRatio(a: string, b: string): number {
	const la = getLuminance(a)
	const lb = getLuminance(b)
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
