<script setup lang="ts">
import { ICON_PATHS, sortLabelPart } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"

/** The text of a column header as a button, with a direction arrow. Sorting is yours: set `active` and `direction` and put `sortDirection` on the TableCell. */
defineOptions({ name: "OmniTableSortLabel" })
const props = defineProps<{
	/** This column is the one the table is sorted by. */
	active?: boolean | undefined
	direction?: "asc" | "desc" | undefined
}>()
const bound = computed(() => toVueProps(sortLabelPart({ active: props.active || undefined, direction: props.direction })))
</script>

<template>
	<button v-bind="bound">
		<slot />
		<svg class="omni-table__sort-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path :d="ICON_PATHS.arrowUpward" /></svg>
	</button>
</template>
