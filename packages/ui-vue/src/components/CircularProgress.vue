<script setup lang="ts">
import { circularProgressParts, type ProgressColor } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A spinning ring, or a ring filled to `value`. Name it with `aria-label` (it is a `role="progressbar"`). */
defineOptions({ name: "OmniCircularProgress" })
const raw = defineProps<{
	/** 0 to 100. Leave out for an indeterminate spinner. */
	value?: number | undefined
	/** Diameter in px (a number) or any CSS length. Default 40. */
	size?: number | string | undefined
	thickness?: number | undefined
	color?: ProgressColor | undefined
}>()
const props = useDefaultProps("OmniCircularProgress", () => ({ ...raw }))
const parts = computed(() => {
	const p = props.value
	const all = circularProgressParts({ value: p.value, size: p.size, thickness: p.thickness, color: p.color })
	return { root: toVueProps(all.root), svg: toVueProps(all.svg), circle: toVueProps(all.circle) }
})
</script>

<template>
	<span v-bind="parts.root">
		<svg v-bind="parts.svg"><circle v-bind="parts.circle" /></svg>
	</span>
</template>
