<script setup lang="ts">
import { cardPart } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A Paper for one subject: media, a header, content and actions. */
defineOptions({ name: "OmniCard" })
const raw = defineProps<{ variant?: "elevation" | "outlined" | undefined; raised?: boolean | undefined; component?: string | undefined }>()
const props = useDefaultProps("OmniCard", () => ({ ...raw }))
const bound = computed(() => toVueProps(cardPart({ variant: props.value.variant, raised: props.value.raised || undefined })))
</script>

<template>
	<component :is="props.component ?? 'div'" v-bind="bound"><slot /></component>
</template>
