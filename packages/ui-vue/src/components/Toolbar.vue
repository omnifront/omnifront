<script setup lang="ts">
import { displayPart } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A row of items with Material's heights (56px, 64px from 600px wide; `dense` 48px). */
defineOptions({ name: "OmniToolbar" })
const raw = defineProps<{ variant?: "regular" | "dense" | undefined; disableGutters?: boolean | undefined; component?: string | undefined }>()
const props = useDefaultProps("OmniToolbar", () => ({ ...raw }))
const bound = computed(() => toVueProps(displayPart("omni-toolbar", { variant: props.value.variant === "dense" ? "dense" : undefined, disableGutters: props.value.disableGutters || undefined })))
</script>

<template>
	<component :is="props.component ?? 'div'" v-bind="bound"><slot /></component>
</template>
