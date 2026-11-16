<script setup lang="ts">
import { displayPart } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"

defineOptions({ name: "OmniTableRow" })
const props = defineProps<{ /** Tint on hover. */ hover?: boolean; selected?: boolean }>()
const bound = computed(() => toVueProps(displayPart("omni-table__row", { hover: props.hover || undefined, selected: props.selected || undefined })))
</script>

<template>
	<tr v-bind="bound" :aria-selected="props.selected ? 'true' : undefined"><slot /></tr>
</template>
