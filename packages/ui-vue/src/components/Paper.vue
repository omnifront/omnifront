<script setup lang="ts">
import { paperPart } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A surface that lifts off the page: `elevation` 0 to 24, or `variant="outlined"`. */
defineOptions({ name: "OmniPaper" })
const raw = defineProps<{
	elevation?: number | undefined
	variant?: "elevation" | "outlined" | undefined
	square?: boolean | undefined
	component?: string | undefined
}>()
const props = useDefaultProps("OmniPaper", () => ({ ...raw }))
const bound = computed(() => toVueProps(paperPart({ elevation: props.value.elevation, variant: props.value.variant, square: props.value.square || undefined })))
</script>

<template>
	<component :is="props.component ?? 'div'" v-bind="bound"><slot /></component>
</template>
