<script setup lang="ts">
import { createRadioGroup } from "@omnifront/ui"
import { computed, mergeProps, nextTick, provide, ref, useAttrs } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { useDefaultProps } from "../theme"
import { RADIO_GROUP } from "./radio-context"

defineOptions({ name: "OmniRadioGroup", inheritAttrs: false })

// Vue turns an absent boolean prop into `false`; `modelValue` is a string, so it stays undefined when absent.
const raw = defineProps<{
	label?: string | undefined
	helperText?: string | undefined
	/** The chosen value (`v-model`). Leave it out for an uncontrolled group. */
	modelValue?: string | undefined
	defaultValue?: string | undefined
	/** The `name` the radios share. Defaults to a generated one. */
	name?: string | undefined
	error?: boolean | undefined
	disabled?: boolean | undefined
	required?: boolean | undefined
	/** Lay the radios out in a row. */
	row?: boolean | undefined
	id?: string | undefined
}>()
const emit = defineEmits<{ "update:modelValue": [value: string]; change: [event: Event | undefined, value: string] }>()

const attrs = useAttrs()
const props = useDefaultProps("OmniRadioGroup", () => ({ ...raw }))
const generated = useUid()
const id = computed(() => props.value.id ?? generated)
const hasLabel = computed(() => props.value.label !== undefined && props.value.label !== "")
const hasHelper = computed(() => props.value.helperText !== undefined && props.value.helperText !== "")

const { machine: group, state } = useMachine(
	() => createRadioGroup({ id: id.value, defaultValue: raw.defaultValue }),
	() => ({
		id: id.value,
		name: props.value.name,
		value: props.value.modelValue,
		disabled: props.value.disabled,
		required: props.value.required,
		error: props.value.error,
		row: props.value.row,
		hasLabel: hasLabel.value,
		hasHelper: hasHelper.value,
		onValueChange: (value: string, event?: Event) => {
			emit("change", event, value)
			emit("update:modelValue", value)
		},
	}),
)
provide(RADIO_GROUP, { group, state })
const parts = computed(() => (void state.value, group.connect()))

const root = ref<HTMLElement | null>(null)
// The browser moves the choice between radios itself. If the parent did not accept it (controlled), put every radio back.
const resync = (): void =>
	void nextTick(() => {
		for (const el of root.value?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? []) el.checked = el.value === state.value.value
	})
</script>

<template>
	<fieldset ref="root" v-bind="mergeProps(toVueProps(parts.group), attrs)" :class="['omni-form-group']" @change="resync">
		<legend v-if="hasLabel" v-bind="toVueProps(parts.label)" class="omni-form-group__label">{{ props.label }}</legend>
		<div v-bind="toVueProps(parts.items)" class="omni-form-group__items"><slot /></div>
		<p v-if="hasHelper" v-bind="toVueProps(parts.helper)" class="omni-form-group__helper">{{ props.helperText }}</p>
	</fieldset>
</template>
