import { describe, expect, it } from "vitest"
import { alpha, createTheme, getContrastRatio, resolveProps, themeToCss } from "../src"

describe("createTheme", () => {
	it("has MUI's default look", () => {
		const t = createTheme()
		expect(t.palette.primary).toEqual({ main: "#1976d2", light: "#42a5f5", dark: "#1565c0", contrastText: "#fff" })
		expect(t.palette.mode).toBe("light")
		expect(t.shape.borderRadius).toBe(4)
		expect(t.spacing(1)).toBe("8px")
		expect(t.spacing(1, 2)).toBe("8px 16px")
		expect(t.shadows).toHaveLength(25)
		expect(t.shadows[0]).toBe("none")
		expect(t.shadows[2]).toBe(
			"0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)",
		)
		expect(t.typography.button).toMatchObject({ fontWeight: 500, fontSize: "0.875rem", textTransform: "uppercase" })
		expect(t.typography.h1.fontSize).toBe("6rem")
		expect(t.zIndex.modal).toBe(1300)
		expect(t.transitions.create("opacity", { duration: 200 })).toBe("opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms")
	})

	it("derives light, dark and contrast text from a single main colour", () => {
		const t = createTheme({ palette: { primary: { main: "#ff5722" } } })
		expect(t.palette.primary.main).toBe("#ff5722")
		expect(t.palette.primary.light).toMatch(/^rgb\(/)
		expect(t.palette.primary.dark).not.toBe(t.palette.primary.light)
		// white text needs 3:1 on the background, otherwise dark text
		expect(createTheme({ palette: { primary: { main: "#ffeb3b" } } }).palette.primary.contrastText).toBe("rgba(0, 0, 0, 0.87)")
		expect(createTheme({ palette: { primary: { main: "#1b5e20" } } }).palette.primary.contrastText).toBe("#fff")
	})

	it("builds both colour schemes and lets one scheme be tuned", () => {
		const t = createTheme({ colorSchemes: { dark: { background: { default: "#000" } } } })
		expect(t.colorSchemes.dark.background.default).toBe("#000")
		expect(t.colorSchemes.light.background.default).toBe("#fff")
		expect(t.colorSchemes.dark.text.primary).toBe("#fff")
		expect(createTheme({ palette: { mode: "dark" } }).palette.mode).toBe("dark")
	})

	it("breakpoints give media queries", () => {
		const { breakpoints } = createTheme()
		expect(breakpoints.up("md")).toBe("@media (min-width:900px)")
		expect(breakpoints.down("md")).toBe("@media (max-width:899.95px)")
		expect(breakpoints.between("sm", "lg")).toBe("@media (min-width:600px) and (max-width:1199.95px)")
		expect(breakpoints.only("sm")).toBe("@media (min-width:600px) and (max-width:899.95px)")
		expect(breakpoints.only("xl")).toBe("@media (min-width:1536px)")
	})

	it("resolveProps fills only the props that were not given", () => {
		const t = createTheme({ components: { OmniButton: { defaultProps: { variant: "contained", size: "large" } } } })
		expect(resolveProps(t, "OmniButton", { size: "small", variant: undefined })).toEqual({ variant: "contained", size: "small" })
		expect(resolveProps(t, "Other", { a: 1 })).toEqual({ a: 1 })
		expect(resolveProps(undefined, "OmniButton", { a: 1 })).toEqual({ a: 1 })
	})
})

describe("colours", () => {
	it("alpha and contrast ratio", () => {
		expect(alpha("#ff0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)")
		expect(getContrastRatio("#000", "#fff")).toBeCloseTo(21, 0)
		expect(() => alpha("hotpink", 0.5)).toThrow(/unsupported colour/)
	})
})

describe("themeToCss", () => {
	const css = themeToCss(createTheme({ palette: { primary: { main: "#ff5722" } } }), { selector: '[data-omni-theme="t1"]' })

	it("scopes the light palette, shared tokens and the dark scheme to the selector", () => {
		expect(css).toContain('[data-omni-theme="t1"]{')
		expect(css).toContain("--omni-palette-primary-main:#ff5722")
		expect(css).toContain("--omni-spacing:8px")
		expect(css).toContain("--omni-shadow-24:")
		expect(css).toContain("--omni-typography-button-font:500 0.875rem/1.75")
		expect(css).toContain("--omni-duration-leaving-screen:195ms")
		expect(css).toContain('[data-omni-theme="t1"][data-omni-color-scheme="dark"]{')
		expect(css).toContain('@media (prefers-color-scheme:dark){[data-omni-theme="t1"][data-omni-color-scheme="system"]{')
	})

	it("puts the dark palette only in the dark blocks", () => {
		const [light, dark] = css.split("\n") as [string, string]
		expect(light).toContain("--omni-palette-background-default:#fff")
		expect(light).toContain("--omni-overlay-24:none")
		expect(dark).toContain("--omni-palette-background-default:#121212")
		expect(dark).toContain("--omni-overlay-24:linear-gradient")
		expect(dark).not.toContain("--omni-spacing")
	})

	it("defaults to :root", () => {
		expect(themeToCss(createTheme())).toMatch(/^:root\{/)
	})
})

describe("contrast", () => {
	it("generated label colours reach WCAG AA (4.5:1) on their own colour", () => {
		for (const mode of ["light", "dark"] as const) {
			const palette = createTheme({ palette: { mode } }).palette
			for (const name of ["primary", "secondary", "error", "warning", "info", "success"] as const) {
				const color = palette[name]
				expect(getContrastRatio(color.main, color.contrastText), `${mode} ${name}`).toBeGreaterThanOrEqual(4.5)
			}
		}
	})

	it("white stays white where it already passes, dark text appears where it would not", () => {
		const light = createTheme().palette
		expect(light.primary.contrastText).toBe("#fff")
		expect(light.warning.contrastText).toBe("rgba(0, 0, 0, 0.87)")
		expect(createTheme({ palette: { mode: "dark" } }).palette.error.contrastText).toBe("rgba(0, 0, 0, 0.87)")
		// MUI's own threshold can still be asked for
		expect(createTheme({ palette: { contrastThreshold: 3 } }).palette.warning.contrastText).toBe("#fff")
	})
})
