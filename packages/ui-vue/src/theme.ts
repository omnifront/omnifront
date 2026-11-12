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
import {
	Teleport,
	computed,
	defineComponent,
	h,
	inject,
	onBeforeUnmount,
	onMounted,
	provide,
	shallowRef,
	watch,
	type ComputedRef,
	type InjectionKey,
	type PropType,
} from "vue"
import { useUid } from "./internal"

interface ThemeContext {
	theme: Theme | undefined
	id: string | undefined
	scheme: ColorSchemeMode | undefined
}
const THEME: InjectionKey<ComputedRef<ThemeContext>> = Symbol("omnifront-theme")
const empty = computed<ThemeContext>(() => ({ theme: undefined, id: undefined, scheme: undefined }))

/**
 * Applies a theme to everything inside it: one `<style>` with the theme's CSS variables, scoped to
 * this provider, and one `display: contents` wrapper that carries the scope and the colour scheme.
 * Overlays teleported by Portal copy both. Install it once near the root of your app.
 */
export const ThemeProvider = defineComponent({
	name: "OmniThemeProvider",
	props: {
		theme: { type: Object as PropType<Theme>, required: true },
		/** `light`, `dark`, or `system`. Inherited from an outer provider, else `system`. */
		colorScheme: { type: String as PropType<ColorSchemeMode>, default: undefined },
		/**
		 * Put the theme on `:root` and the colour scheme on `<html>`, so the whole page (`<body>` included)
		 * is themed, instead of only this provider's subtree. Use it once, near the root.
		 */
		global: { type: Boolean, default: false },
	},
	setup(props, { slots }) {
		const parent = inject(THEME, empty)
		const id = useUid()
		const context = computed<ThemeContext>(() => ({
			theme: props.theme,
			// A global theme has no scope id: overlays in portals just inherit from :root.
			id: props.global ? undefined : id,
			scheme: props.colorScheme ?? parent.value.scheme ?? "system",
		}))
		provide(THEME, context)
		const css = computed(() => themeToCss(props.theme, props.global ? {} : { selector: `[${THEME_ATTRIBUTE}="${id}"]` }))

		// Vue lifecycle: the colour scheme goes on <html> after mount (never on the server) and is put back on unmount.
		let before: string | null = null
		const applyGlobal = (): void => {
			const html = document.documentElement
			if (props.global) html.setAttribute(COLOR_SCHEME_ATTRIBUTE, context.value.scheme ?? "system")
		}
		onMounted(() => {
			before = document.documentElement.getAttribute(COLOR_SCHEME_ATTRIBUTE)
			applyGlobal()
		})
		watch(() => [props.global, context.value.scheme], applyGlobal)
		onBeforeUnmount(() => {
			if (!props.global) return
			const html = document.documentElement
			if (before === null) html.removeAttribute(COLOR_SCHEME_ATTRIBUTE)
			else html.setAttribute(COLOR_SCHEME_ATTRIBUTE, before)
		})

		return () => [
			h("style", { innerHTML: css.value }),
			...(props.global
				? (slots["default"]?.() ?? [])
				: [h("div", { [THEME_ATTRIBUTE]: id, [COLOR_SCHEME_ATTRIBUTE]: context.value.scheme, style: { display: "contents" } }, slots["default"]?.())]),
		]
	},
})

let fallback: Theme | undefined
/** The nearest theme, or the default Material theme when there is no ThemeProvider. */
export function useTheme(): ComputedRef<Theme> {
	const ctx = inject(THEME, empty)
	return computed(() => ctx.value.theme ?? (fallback ??= createTheme()))
}

/** `theme.components[name].defaultProps` under the props that were given. */
export function useDefaultProps<P extends object>(name: string, props: () => P): ComputedRef<P> {
	const ctx = inject(THEME, empty)
	return computed(() => resolveProps(ctx.value.theme, name, props()))
}

/** Teleports its content into a `<div data-omni-portal>` at the end of `<body>`, carrying the theme scope. Nothing on the server. */
export const Portal = defineComponent({
	name: "OmniPortal",
	setup(_props, { slots }) {
		const ctx = inject(THEME, empty)
		const root = shallowRef<HTMLElement | null>(null)
		let remove: (() => void) | undefined
		const create = (): void => {
			remove?.()
			const { id, scheme } = ctx.value
			const portal = createPortalRoot({ [THEME_ATTRIBUTE]: id, [COLOR_SCHEME_ATTRIBUTE]: id ? scheme : undefined })
			root.value = portal.element
			remove = portal.remove
		}
		onMounted(create)
		onBeforeUnmount(() => remove?.())
		return () => (root.value ? h(Teleport as never, { to: root.value }, slots["default"]?.()) : null)
	},
})
