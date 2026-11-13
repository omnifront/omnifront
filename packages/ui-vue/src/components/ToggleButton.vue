<script setup lang="ts">
import { toggleButtonPart } from "@omnifront/ui"
import { computed, inject, mergeProps, useAttrs } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"
import { TOGGLE_GROUP } from "./toggle-context"

/** A button that is pressed or not (`aria-pressed`). Inside a ToggleButtonGroup its state comes from the group. */
defineOptions({ name: "OmniToggleButton", inheritAttrs: false })

const raw = defineProps<{
	/** What the group's value gets when this is pressed. */
	value?: string | undefined
	/** Only outside a ToggleButtonGroup: whether it is pressed. */
	selected?: boolean | undefined
	disabled?: boolean | undefined
	color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | undefined
	size?: "small" | "medium" | "large" | undefined
}>()
/** Only outside a ToggleButtonGroup: it was pressed. Inside one, listen to the group. */
const emit = defineEmits<{ change: [event: MouseEvent, value: string | undefined] }>()
const attrs = useAttrs()
const props = useDefaultProps("OmniToggleButton", () => ({ ...raw }))
const context = inject(TOGGLE_GROUP, null)
const bound = computed(() => {
	const p = props.value
	const part = context && p.value !== undefined ? context.group.item(p.value, { disabled: p.disabled || undefined }) : toggleButtonPart({ selected: p.selected, disabled: p.disabled || undefined })
	return mergeProps(toVueProps((void context?.state.value, part)), attrs)
})
const onClick = (event: MouseEvent): void => {
	if (!context) emit("change", event, props.value.value)
}
</script>

<template>
	<button v-bind="bound" :data-color="props.color ?? context?.color.value ?? 'primary'" :data-size="props.size ?? context?.size.value ?? 'medium'" @click="onClick"><slot /></button>
</template>
