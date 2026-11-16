<script setup lang="ts">
import { displayPart } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A list of rows. Children are ListItem (or ListSubheader, Divider with `component="li"`). */
defineOptions({ name: "OmniList" })
const raw = defineProps<{
	/** Tighter rows. */
	dense?: boolean | undefined
	disablePadding?: boolean | undefined
	/** `ul` (default), `ol` or `nav`. */
	component?: string | undefined
}>()
const props = useDefaultProps("OmniList", () => ({ ...raw }))
const bound = computed(() => toVueProps(displayPart("omni-list", { dense: props.value.dense || undefined, disablePadding: props.value.disablePadding || undefined })))
</script>

<template>
	<component :is="props.component ?? 'ul'" v-bind="bound"><slot /></component>
</template>
