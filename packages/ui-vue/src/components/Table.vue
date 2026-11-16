<script setup lang="ts">
import { displayPart } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A real `<table>`. Build it from TableHead, TableBody, TableFooter, TableRow and TableCell. */
defineOptions({ name: "OmniTable" })
const raw = defineProps<{
	size?: "small" | "medium" | undefined
	/** Keep the header row at the top while the container scrolls. */
	stickyHeader?: boolean | undefined
}>()
const props = useDefaultProps("OmniTable", () => ({ ...raw }))
const bound = computed(() => toVueProps(displayPart("omni-table", { size: props.value.size === "small" ? "small" : undefined, stickyHeader: props.value.stickyHeader || undefined })))
</script>

<template>
	<table v-bind="bound"><slot /></table>
</template>
