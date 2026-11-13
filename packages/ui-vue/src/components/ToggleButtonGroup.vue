<script setup lang="ts">
import { createToggleGroup } from "@omnifront/ui"
import { computed, mergeProps, provide, useAttrs } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { useDefaultProps } from "../theme"
import { TOGGLE_GROUP } from "./toggle-context"

/** A row (or column) of ToggleButtons: pick one (`exclusive`) or several. Real buttons with `aria-pressed`. */
defineOptions({ name: "OmniToggleButtonGroup", inheritAttrs: false })

const raw = defineProps<{
	/** Pressed value (`v-model`): a string (or null) when `exclusive`, a list otherwise. Leave it out for an uncontrolled group. */
	modelValue?: string | null | readonly string[] | undefined
	defaultValue?: string | null | readonly string[] | undefined
	/** At most one pressed at a time; pressing it again unpresses it. */
	exclusive?: boolean | undefined
	orientation?: "horizontal" | "vertical" | undefined
	size?: "small" | "medium" | "large" | undefined
	color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | undefined
	disabled?: boolean | undefined
	fullWidth?: boolean | undefined
}>()
const emit = defineEmits<{ "update:modelValue": [value: string | null | string[]]; change: [event: Event | undefined, value: string | null | string[]] }>()

const toList = (v: string | null | readonly string[] | undefined): string[] | undefined => (v === undefined ? undefined : v === null ? [] : typeof v === "string" ? [v] : [...v])
const attrs = useAttrs()
const props = useDefaultProps("OmniToggleButtonGroup", () => ({ ...raw }))
const id = useUid()
const { machine: group, state } = useMachine(
	() => createToggleGroup({ id, defaultValue: toList(raw.defaultValue) }),
	() => ({
		id,
		value: toList(props.value.modelValue),
		exclusive: props.value.exclusive,
		disabled: props.value.disabled,
		orientation: props.value.orientation,
		onValueChange: (next: string[], event?: Event) => {
			const value = props.value.exclusive ? (next[0] ?? null) : next
			emit("change", event, value)
			emit("update:modelValue", value)
		},
	}),
)
provide(TOGGLE_GROUP, { group, state, size: computed(() => props.value.size), color: computed(() => props.value.color) })
const parts = computed(() => (void state.value, group.connect()))
</script>

<template>
	<div v-bind="mergeProps(toVueProps(parts.group), { class: 'omni-toggle-group' }, attrs)" :data-full-width="props.fullWidth ? '' : undefined"><slot /></div>
</template>
