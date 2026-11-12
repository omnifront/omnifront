<script setup lang="ts">
import { computed, inject, mergeProps, useAttrs } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"
import { RADIO_GROUP } from "./radio-context"

// `aria-*` attributes go to the native input (for a radio with no visible label); everything else to the root.
defineOptions({ name: "OmniRadio", inheritAttrs: false })

const raw = defineProps<{
	/** What the group's value becomes when this radio is chosen. */
	value: string
	label?: string | undefined
	labelPlacement?: "end" | "start" | "top" | "bottom" | undefined
	disabled?: boolean | undefined
	color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | undefined
	size?: "small" | "medium" | undefined
	/** Only outside a RadioGroup: the checked state. */
	checked?: boolean | undefined
	/** Only outside a RadioGroup. */
	name?: string | undefined
	id?: string | undefined
}>()
const emit = defineEmits<{ change: [event: Event] }>()

const attrs = useAttrs()
const props = useDefaultProps("OmniRadio", () => ({ ...raw }))
const context = inject(RADIO_GROUP, null)
const isDisabled = computed(() => props.value.disabled === true || context?.state.value.disabled === true)
const ariaAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith("aria-"))))
const rootAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => !k.startsWith("aria-") && k !== "class")))
const inputBinding = computed(() => {
	const p = props.value
	const base = context
		? toVueProps((void context.state.value, context.group.radio(p.value, { disabled: p.disabled })))
		: { type: "radio", name: p.name, value: p.value, checked: p.checked, disabled: p.disabled || undefined }
	return mergeProps(base, ariaAttrs.value, { id: p.id })
})
const hasLabel = computed(() => props.value.label !== undefined && props.value.label !== "")
</script>

<template>
	<label
		v-bind="rootAttrs"
		:class="['omni-radio', attrs.class]"
		:data-size="props.size ?? 'medium'"
		:data-color="props.color ?? 'primary'"
		:data-label-placement="props.labelPlacement && props.labelPlacement !== 'end' ? props.labelPlacement : undefined"
		:data-disabled="isDisabled ? '' : undefined"
	>
		<span class="omni-radio__control">
			<input v-bind="inputBinding" class="omni-radio__input" @change="emit('change', $event)" />
			<span class="omni-radio__box" aria-hidden="true" />
		</span>
		<span v-if="hasLabel || $slots['default']" class="omni-radio__label"><slot>{{ props.label }}</slot></span>
	</label>
</template>
