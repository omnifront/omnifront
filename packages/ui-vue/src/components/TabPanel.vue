<script setup lang="ts">
import { computed, inject, mergeProps, useAttrs } from "vue"
import { toVueProps } from "../internal"
import { TABS } from "./tabs-context"

defineOptions({ name: "OmniTabPanel", inheritAttrs: false })
const props = defineProps<{
	value: string
	/** Keep the content in the page (hidden) while the tab is not selected. */
	keepMounted?: boolean | undefined
}>()
const attrs = useAttrs()
const ctx = inject(TABS)
if (!ctx) throw new Error("omnifront/ui-vue: <TabPanel> must be inside <TabContext>")
const bound = computed(() => {
	void ctx.version.value
	return mergeProps(toVueProps(ctx.tabs.panel(props.value)), attrs)
})
</script>

<template>
	<div v-bind="bound" class="omni-tab-panel">
		<slot v-if="ctx.selected.value === value || keepMounted" />
	</div>
</template>
