<script setup lang="ts">
import { linkPart, type LinkOptions } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A real `<a>` styled as a link. */
defineOptions({ name: "OmniLink" })
const raw = defineProps<{
	underline?: LinkOptions["underline"]
	color?: LinkOptions["color"]
	/** Another element or component (a router link). Default `a`. */
	component?: string | object | undefined
}>()
const props = useDefaultProps("OmniLink", () => ({ ...raw }))
const bound = computed(() => toVueProps(linkPart({ underline: props.value.underline, color: props.value.color })))
</script>

<template>
	<component :is="props.component ?? 'a'" v-bind="bound"><slot /></component>
</template>
