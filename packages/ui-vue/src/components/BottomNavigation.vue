<script setup lang="ts">
import { displayPart } from "@omnifront/ui"
import { computed, provide, useAttrs } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"
import { BOTTOM_NAVIGATION } from "./bottom-navigation-context"

/** A bar of 3 to 5 top-level destinations at the bottom of a phone screen. Give the `nav` an `aria-label`. `value` is the current action's value (controlled: update it on `change`). */
defineOptions({ name: "OmniBottomNavigation", inheritAttrs: false })
const raw = defineProps<{
	value?: string | number | undefined
	/** Show every label, not only the current one's. */
	showLabels?: boolean | undefined
}>()
const emit = defineEmits<{ change: [event: MouseEvent, value: string | number]; "update:value": [value: string | number] }>()
const attrs = useAttrs()
const props = useDefaultProps("OmniBottomNavigation", () => ({ ...raw }))
provide(BOTTOM_NAVIGATION, {
	value: computed(() => props.value.value),
	showLabels: computed(() => Boolean(props.value.showLabels)),
	select: (event, value) => {
		emit("change", event, value)
		emit("update:value", value)
	},
})
const bound = computed(() => ({ ...toVueProps(displayPart("omni-bottom-navigation", { showLabels: props.value.showLabels || undefined })), ...attrs }))
</script>

<template>
	<nav v-bind="bound"><slot /></nav>
</template>
