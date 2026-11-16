<script setup lang="ts">
import { badgeMarkPart, badgeState, displayPart, type BadgeOptions } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A small number or dot on a corner of what it wraps (an icon, an avatar). */
defineOptions({ name: "OmniBadge" })
const raw = defineProps<{
	badgeContent?: string | number | undefined
	/** Biggest number shown; above it the badge reads `99+`. Default 99. */
	max?: number | undefined
	showZero?: boolean | undefined
	variant?: "standard" | "dot" | undefined
	invisible?: boolean | undefined
	color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" | undefined
	anchorOrigin?: { vertical: "top" | "bottom"; horizontal: "left" | "right" } | undefined
	overlap?: "rectangular" | "circular" | undefined
}>()
const props = useDefaultProps("OmniBadge", () => ({ ...raw }))
const options = computed<BadgeOptions>(() => {
	const p = props.value
	return { badgeContent: p.badgeContent, max: p.max, showZero: p.showZero || undefined, variant: p.variant, invisible: p.invisible || undefined, color: p.color, anchorOrigin: p.anchorOrigin, overlap: p.overlap }
})
const text = computed(() => badgeState(options.value).text)
const mark = computed(() => toVueProps(badgeMarkPart(options.value)))
const root = toVueProps(displayPart("omni-badge"))
</script>

<template>
	<span v-bind="root">
		<slot />
		<span v-bind="mark">{{ text }}</span>
	</span>
</template>
