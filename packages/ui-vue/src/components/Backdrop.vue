<script setup lang="ts">
import { displayPart } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A dimmed layer over the page behind a modal piece. Decorative (`aria-hidden`); keep it out of the tab order. */
defineOptions({ name: "OmniBackdrop" })
const raw = defineProps<{
	open: boolean
	/** No dimming: it only catches clicks. */
	invisible?: boolean | undefined
}>()
const props = useDefaultProps("OmniBackdrop", () => ({ ...raw }))
const bound = computed(() => toVueProps(displayPart("omni-backdrop", { state: props.value.open ? "open" : "closed", invisible: props.value.invisible || undefined }, { "aria-hidden": "true" })))
</script>

<template>
	<div v-bind="bound"><slot /></div>
</template>
