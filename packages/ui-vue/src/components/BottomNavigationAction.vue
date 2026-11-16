<script setup lang="ts">
import { bottomNavigationActionPart } from "@omnifront/ui"
import { computed, inject } from "vue"
import { toVueProps } from "../internal"
import { BOTTOM_NAVIGATION } from "./bottom-navigation-context"

/** One destination of a BottomNavigation. The `icon` slot holds its icon. */
defineOptions({ name: "OmniBottomNavigationAction" })
const props = defineProps<{ value?: string | number | undefined; label?: string | undefined; disabled?: boolean | undefined }>()
const emit = defineEmits<{ click: [event: MouseEvent] }>()
const nav = inject(BOTTOM_NAVIGATION, null)
const selected = computed(() => props.value !== undefined && props.value === nav?.value.value)
const bound = computed(() => toVueProps(bottomNavigationActionPart({ selected: selected.value || undefined, showLabel: nav?.showLabels.value || undefined, disabled: props.disabled || undefined })))
function onClick(event: MouseEvent): void {
	emit("click", event)
	if (props.value !== undefined) nav?.select(event, props.value)
}
</script>

<template>
	<button v-bind="bound" @click="onClick">
		<slot name="icon" />
		<span class="omni-bottom-navigation__label"><slot>{{ props.label }}</slot></span>
	</button>
</template>
