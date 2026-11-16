<script setup lang="ts">
import { typographyPart, typographyTag, type TypographyColor, type TypographyVariantName } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** Text in one of the theme's styles. The look is the variant; the element is separate (`component="h2"`). */
defineOptions({ name: "OmniTypography" })
const raw = defineProps<{
	variant?: TypographyVariantName | undefined
	align?: "inherit" | "left" | "center" | "right" | "justify" | undefined
	color?: TypographyColor | undefined
	gutterBottom?: boolean | undefined
	noWrap?: boolean | undefined
	paragraph?: boolean | undefined
	/** The element to draw. Default follows the variant (`h1`…`h6`, `p`, `span`). */
	component?: string | undefined
}>()
const props = useDefaultProps("OmniTypography", () => ({ ...raw }))
const tag = computed(() => props.value.component ?? typographyTag(props.value.variant, props.value.paragraph))
const bound = computed(() => {
	const p = props.value
	return toVueProps(typographyPart({ variant: p.variant, align: p.align, color: p.color, gutterBottom: p.gutterBottom || undefined, noWrap: p.noWrap || undefined, paragraph: p.paragraph || undefined }))
})
</script>

<template>
	<component :is="tag" v-bind="bound"><slot /></component>
</template>
