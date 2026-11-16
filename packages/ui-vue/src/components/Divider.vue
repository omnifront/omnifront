<script setup lang="ts">
import { dividerPart } from "@omnifront/ui"
import { computed, useSlots } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A line that separates content: a real `<hr>`, or `li` in a list. With content it becomes a `role="separator"` `div` with the text in the line. */
defineOptions({ name: "OmniDivider" })
const raw = defineProps<{
	orientation?: "horizontal" | "vertical" | undefined
	variant?: "fullWidth" | "inset" | "middle" | undefined
	flexItem?: boolean | undefined
	textAlign?: "center" | "left" | "right" | undefined
	/** `hr` (default) or `li` inside a List. */
	component?: "hr" | "li" | "div" | undefined
}>()
const props = useDefaultProps("OmniDivider", () => ({ ...raw }))
const slots = useSlots()
const withText = computed(() => slots["default"] !== undefined)
const tag = computed(() => (withText.value ? "div" : (props.value.component ?? "hr")))
const bound = computed(() => {
	const p = props.value
	return toVueProps(dividerPart({ orientation: p.orientation, variant: p.variant, flexItem: p.flexItem || undefined, textAlign: p.textAlign, withText: withText.value, as: tag.value as "hr" | "li" | "div" }))
})
</script>

<template>
	<component :is="tag" v-bind="bound"><span v-if="withText" class="omni-divider__text"><slot /></span></component>
</template>
