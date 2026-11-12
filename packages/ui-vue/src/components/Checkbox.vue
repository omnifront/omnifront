<script setup lang="ts">
import { createCheckbox } from "@omnifront/ui"
import { computed, mergeProps, nextTick, onMounted, ref, useAttrs, watch } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { useDefaultProps } from "../theme"

// `aria-*` attributes go to the native input (for a checkbox with no visible label); everything else to the root.
defineOptions({ name: "OmniCheckbox", inheritAttrs: false })

// Vue turns an absent boolean prop into `false`; `modelValue` must stay `undefined` to mean "not controlled".
const raw = withDefaults(
	defineProps<{
		/** Checked (`v-model`). Leave it out for an uncontrolled checkbox. */
		modelValue?: boolean | undefined
		defaultChecked?: boolean | undefined
		/** The "some of them" state; a click then makes it checked. */
		indeterminate?: boolean | undefined
		label?: string | undefined
		labelPlacement?: "end" | "start" | "top" | "bottom" | undefined
		disabled?: boolean | undefined
		required?: boolean | undefined
		error?: boolean | undefined
		color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | undefined
		size?: "small" | "medium" | undefined
		name?: string | undefined
		value?: string | undefined
		id?: string | undefined
	}>(),
	{ modelValue: undefined },
)
const emit = defineEmits<{ "update:modelValue": [checked: boolean]; change: [event: Event | undefined, checked: boolean] }>()

const attrs = useAttrs()
const props = useDefaultProps("OmniCheckbox", () => ({ ...raw }))
const generated = useUid()
const id = computed(() => props.value.id ?? generated)
const { machine, state } = useMachine(
	() => createCheckbox({ id: id.value, defaultChecked: raw.defaultChecked }),
	() => ({
		id: id.value,
		checked: props.value.modelValue,
		indeterminate: props.value.indeterminate,
		disabled: props.value.disabled,
		required: props.value.required,
		error: props.value.error,
		onCheckedChange: (checked: boolean, event?: Event) => {
			emit("change", event, checked)
			emit("update:modelValue", checked)
		},
	}),
)

const input = ref<HTMLInputElement | null>(null)
// `indeterminate` has no HTML attribute, and the browser clears it on click: set it after every change.
const applyIndeterminate = (): void => {
	if (input.value) input.value.indeterminate = state.value.indeterminate
}
onMounted(applyIndeterminate)
watch(() => [state.value.indeterminate, state.value.checked] as const, applyIndeterminate, { flush: "post" })
// A controlled checkbox the parent did not update must go back to what it was told (Vue only patches changed props).
const resync = (): void => void nextTick(() => input.value && (input.value.checked = state.value.checked))

const ariaAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith("aria-"))))
const rootAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => !k.startsWith("aria-") && k !== "class")))
const inputBinding = computed(() =>
	mergeProps(toVueProps((void state.value, machine.connect().input)), ariaAttrs.value, { name: props.value.name, value: props.value.value }),
)
const hasLabel = computed(() => props.value.label !== undefined && props.value.label !== "")
</script>

<template>
	<label
		v-bind="rootAttrs"
		:class="['omni-checkbox', attrs.class]"
		:data-size="props.size ?? 'medium'"
		:data-color="props.color ?? 'primary'"
		:data-label-placement="props.labelPlacement && props.labelPlacement !== 'end' ? props.labelPlacement : undefined"
		:data-disabled="state.disabled ? '' : undefined"
		:data-error="props.error ? '' : undefined"
	>
		<span class="omni-checkbox__control">
			<input ref="input" v-bind="inputBinding" class="omni-checkbox__input" @change="resync" />
			<span class="omni-checkbox__box" aria-hidden="true" />
		</span>
		<span v-if="hasLabel || $slots['default']" class="omni-checkbox__label"><slot>{{ props.label }}</slot></span>
	</label>
</template>
