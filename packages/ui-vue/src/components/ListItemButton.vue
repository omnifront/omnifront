<script setup lang="ts">
import { displayPart } from "@omnifront/ui"
import { computed, mergeProps, useAttrs } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A row that can be pressed: a real `<button>` (or `<a>` with `href`) that fills the row. */
defineOptions({ name: "OmniListItemButton", inheritAttrs: false })
const raw = defineProps<{
	selected?: boolean | undefined
	disabled?: boolean | undefined
	/** Renders an `<a>` instead of a `<button>`. */
	href?: string | undefined
	type?: "button" | "submit" | "reset" | undefined
}>()
const emit = defineEmits<{ click: [event: MouseEvent] }>()
const attrs = useAttrs()
const props = useDefaultProps("OmniListItemButton", () => ({ ...raw }))
const tag = computed(() => (props.value.href === undefined ? "button" : "a"))
const bound = computed(() => {
	const p = props.value
	const part = displayPart("omni-list__button", { selected: p.selected || undefined, disabled: p.disabled || undefined }, {
		"aria-current": p.selected ? "true" : undefined,
		...(tag.value === "button" ? { type: p.type ?? "button", disabled: p.disabled || undefined } : { "aria-disabled": p.disabled ? "true" : undefined, tabindex: p.disabled ? -1 : undefined }),
	})
	return mergeProps(toVueProps(part), attrs, p.href === undefined ? {} : { href: p.href })
})
function onClick(event: MouseEvent): void {
	if (props.value.disabled) event.preventDefault()
	else emit("click", event)
}
</script>

<template>
	<component :is="tag" v-bind="bound" @click="onClick"><slot /></component>
</template>
