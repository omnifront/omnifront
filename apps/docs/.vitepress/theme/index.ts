import DefaultTheme from "vitepress/theme"
import { h } from "vue"
import type { Theme } from "vitepress"
import Landing from "./Landing.vue"
import "./landing.css"

// Extend the default theme: the home layout renders <Landing /> in its first slot.
export default {
	extends: DefaultTheme,
	Layout: () => h(DefaultTheme.Layout, null, { "home-hero-before": () => h(Landing) }),
} satisfies Theme
