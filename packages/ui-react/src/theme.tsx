import {
	COLOR_SCHEME_ATTRIBUTE,
	THEME_ATTRIBUTE,
	createPortalRoot,
	createTheme,
	resolveProps,
	themeToCss,
	type ColorSchemeMode,
	type Theme,
} from "@omnifront/ui"
import { createContext, useContext, useEffect, useId, useMemo, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

interface ThemeContextValue {
	theme: Theme | undefined
	/** Which `[data-omni-theme]` scope this subtree is in (portals copy it). */
	id: string | undefined
	scheme: ColorSchemeMode | undefined
}

const ThemeContext = createContext<ThemeContextValue>({ theme: undefined, id: undefined, scheme: undefined })

export interface ThemeProviderProps {
	theme: Theme
	/** `light`, `dark`, or `system` (follow the OS). Inherited from an outer provider, else `system`. */
	colorScheme?: ColorSchemeMode | undefined
	children?: ReactNode | undefined
}

/**
 * Applies a theme to everything inside it. It renders one `<style>` (the theme's CSS variables,
 * scoped to this provider) and one `display: contents` wrapper that carries the scope and the
 * colour scheme. Overlays rendered in portals copy both, so they are themed too.
 */
export function ThemeProvider({ theme, colorScheme, children }: ThemeProviderProps): ReactNode {
	const parent = useContext(ThemeContext)
	const id = useId()
	const scheme = colorScheme ?? parent.scheme ?? "system"
	const css = useMemo(() => themeToCss(theme, { selector: `[${THEME_ATTRIBUTE}="${id}"]` }), [theme, id])
	const value = useMemo(() => ({ theme, id, scheme }), [theme, id, scheme])
	return (
		<ThemeContext.Provider value={value}>
			<style dangerouslySetInnerHTML={{ __html: css }} />
			<div {...{ [THEME_ATTRIBUTE]: id, [COLOR_SCHEME_ATTRIBUTE]: scheme }} style={{ display: "contents" }}>
				{children}
			</div>
		</ThemeContext.Provider>
	)
}

let fallback: Theme | undefined
/** The nearest theme, or the default Material theme when there is no ThemeProvider. */
export function useTheme(): Theme {
	return useContext(ThemeContext).theme ?? (fallback ??= createTheme())
}

/** `theme.components[name].defaultProps` under the props that were given. */
export function useDefaultProps<P extends object>(name: string, props: P): P {
	return resolveProps(useContext(ThemeContext).theme, name, props)
}

/** Renders children in a `<div data-omni-portal>` at the end of `<body>`, carrying the theme scope. Nothing on the server. */
export function Portal({ children }: { children?: ReactNode }): ReactNode {
	const { id, scheme } = useContext(ThemeContext)
	const [root, setRoot] = useState<HTMLElement | null>(null)
	useEffect(() => {
		const portal = createPortalRoot({ [THEME_ATTRIBUTE]: id, [COLOR_SCHEME_ATTRIBUTE]: id ? scheme : undefined })
		setRoot(portal.element)
		return () => {
			portal.remove()
			setRoot(null)
		}
	}, [id, scheme])
	return root ? createPortal(children, root) : null
}
