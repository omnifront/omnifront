<script setup lang="ts">
import { linearProgressParts, type ProgressColor } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A bar: indeterminate, determinate (`value`) or buffer (`value` and `valueBuffer`). Name it with `aria-label`. */
defineOptions({ name: "OmniLinearProgress" })
const raw = defineProps<{
	variant?: "determinate" | "indeterminate" | "buffer" | undefined
	value?: number | undefined
	valueBuffer?: number | undefined
	color?: ProgressColor | undefined
}>()
const props = useDefaultProps("OmniLinearProgress", () => ({ ...raw }))
const parts = computed(() => {
	const p = props.value
	const all = linearProgressParts({ variant: p.variant, value: p.value, valueBuffer: p.valueBuffer, color: p.color })
	return { root: toVueProps(all.root), bar1: toVueProps(all.bar1), bar2: toVueProps(all.bar2) }
})
</script>

<template>
	<div v-bind="parts.root">
		<span v-bind="parts.bar1" />
		<span v-bind="parts.bar2" />
	</div>
</template>
