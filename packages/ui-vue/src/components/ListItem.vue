<script setup lang="ts">
import { displayPart } from "@omnifront/ui"
import { computed, useSlots } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** One row. The `secondaryAction` slot is something at the far end, such as an IconButton. */
defineOptions({ name: "OmniListItem" })
const raw = defineProps<{
	/** A line under the row. */
	divider?: boolean | undefined
	/** No padding: for a row whose ListItemButton does the padding. */
	disablePadding?: boolean | undefined
	disableGutters?: boolean | undefined
}>()
const props = useDefaultProps("OmniListItem", () => ({ ...raw }))
const slots = useSlots()
const bound = computed(() => {
	const p = props.value
	return toVueProps(displayPart("omni-list__item", { divider: p.divider || undefined, disablePadding: p.disablePadding || undefined, disableGutters: p.disableGutters || undefined, secondaryAction: slots["secondaryAction"] !== undefined }))
})
</script>

<template>
	<li v-bind="bound">
		<slot />
		<div v-if="$slots['secondaryAction']" class="omni-list__action"><slot name="secondaryAction" /></div>
	</li>
</template>
