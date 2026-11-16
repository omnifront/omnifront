<script setup lang="ts">
import { svgIconPart, type SvgIconOptions } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A 24px glyph that takes the text colour. The slot is the SVG content (`<path d="…" />`). Decorative unless `titleAccess` names it. */
defineOptions({ name: "OmniSvgIcon" })
const raw = defineProps<{
	fontSize?: SvgIconOptions["fontSize"]
	color?: SvgIconOptions["color"]
	viewBox?: string | undefined
	/** Makes it meaningful to a screen reader (`role="img"`, this as its name). */
	titleAccess?: string | undefined
}>()
const props = useDefaultProps("OmniSvgIcon", () => ({ ...raw }))
const bound = computed(() => toVueProps(svgIconPart({ fontSize: props.value.fontSize, color: props.value.color, viewBox: props.value.viewBox, titleAccess: props.value.titleAccess })))
</script>

<template>
	<svg v-bind="bound"><slot /></svg>
</template>
