<script setup lang="ts">
import { appBarPart, type AppBarOptions } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** The bar at the top of a page: a `<header>`. Put a Toolbar inside. */
defineOptions({ name: "OmniAppBar" })
const raw = defineProps<{
	position?: AppBarOptions["position"]
	color?: AppBarOptions["color"]
	/** Depth, 0 to 24. Default 4. */
	elevation?: number | undefined
	component?: string | undefined
}>()
const props = useDefaultProps("OmniAppBar", () => ({ ...raw }))
const bound = computed(() => toVueProps(appBarPart({ position: props.value.position, color: props.value.color, elevation: props.value.elevation })))
</script>

<template>
	<component :is="props.component ?? 'header'" v-bind="bound"><slot /></component>
</template>
