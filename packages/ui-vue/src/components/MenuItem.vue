<script setup lang="ts">
import { computed, inject, mergeProps, useAttrs } from "vue"
import { toVueProps } from "../internal"
import { MENU } from "./menu-context"

defineOptions({ name: "OmniMenuItem", inheritAttrs: false })
const props = defineProps<{ disabled?: boolean; selected?: boolean; dense?: boolean }>()
/** Chosen by click, Enter or Space. The menu then closes. */
const emit = defineEmits<{ click: [event: MouseEvent] }>()
const attrs = useAttrs()
const menu = inject(MENU, null)
const bound = computed(() => {
	const part = menu?.item({ disabled: props.disabled, onSelect: (e) => emit("click", e as MouseEvent) })
	return mergeProps(part ? toVueProps(part) : {}, attrs)
})
</script>

<template>
	<li v-bind="bound" class="omni-menu__item" :data-selected="selected ? '' : undefined" :data-dense="dense ? '' : undefined">
		<slot />
	</li>
</template>
