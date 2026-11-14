<script setup lang="ts">
import { computed, inject, mergeProps, onBeforeUnmount, onMounted, ref, useAttrs } from "vue"
import { toVueProps } from "../internal"
import { TABS } from "./tabs-context"

defineOptions({ name: "OmniTabList", inheritAttrs: false })
const props = withDefaults(
	defineProps<{ color?: "primary" | "secondary"; variant?: "standard" | "fullWidth"; centered?: boolean }>(),
	{ color: "primary", variant: "standard" },
)
const attrs = useAttrs()
const ctx = inject(TABS)
if (!ctx) throw new Error("omnifront/ui-vue: <TabList> must be inside <TabContext>")
const parts = computed(() => {
	void ctx.version.value
	return ctx.tabs.connect()
})
const list = ref<HTMLElement | null>(null)
let stop: (() => void) | undefined
onMounted(() => {
	if (list.value) stop = ctx.tabs.attach(list.value)
})
onBeforeUnmount(() => stop?.())
const { class: className, style, ...listAttrs } = attrs
</script>

<template>
	<div
		v-bind="toVueProps(parts.root)"
		:class="['omni-tabs', className]"
		:style="style as never"
		:data-color="props.color"
		:data-variant="props.variant"
		:data-centered="props.centered ? '' : undefined"
		:data-orientation="ctx.orientation.value"
	>
		<div ref="list" v-bind="mergeProps(toVueProps(parts.list), listAttrs)" class="omni-tabs__list">
			<slot />
			<span class="omni-tabs__indicator" aria-hidden="true" />
		</div>
	</div>
</template>
