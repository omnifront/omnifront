<script setup lang="ts">
import { computed, inject, mergeProps, useAttrs } from "vue"
import { toVueProps } from "../internal"
import { TABS } from "./tabs-context"

defineOptions({ name: "OmniTab", inheritAttrs: false })
const props = defineProps<{ value: string; label?: string; disabled?: boolean }>()
const attrs = useAttrs()
const ctx = inject(TABS)
if (!ctx) throw new Error("omnifront/ui-vue: <Tab> must be inside <TabContext>")
const bound = computed(() => {
	void ctx.version.value
	return mergeProps(toVueProps(ctx.tabs.tab(props.value, { disabled: props.disabled })), attrs)
})
</script>

<template>
	<button v-bind="bound" class="omni-tab">{{ label }}<slot /></button>
</template>
