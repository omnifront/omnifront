<script setup lang="ts">
import { skeletonPart } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A grey placeholder while content loads. It is hidden from screen readers: put `aria-busy` on the loading region. */
defineOptions({ name: "OmniSkeleton" })
// `animation` can be `false`: Vue would cast an absent one to false, so say undefined.
const raw = withDefaults(
	defineProps<{
		variant?: "text" | "circular" | "rectangular" | "rounded" | undefined
		animation?: "pulse" | "wave" | false | undefined
		width?: number | string | undefined
		height?: number | string | undefined
	}>(),
	{ animation: undefined },
)
const props = useDefaultProps("OmniSkeleton", () => ({ ...raw }))
const bound = computed(() => toVueProps(skeletonPart(props.value)))
</script>

<template>
	<span v-bind="bound" />
</template>
