<script setup lang="ts">
import { createField } from "@omnifront/ui"
import { computed, mergeProps, ref, useAttrs, useSlots } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { useDefaultProps } from "../theme"

defineOptions({ name: "OmniTextField", inheritAttrs: false })

const raw = defineProps<{
	/** Controlled value (`v-model`). Leave it out for an uncontrolled field. */
	modelValue?: string | number | undefined
	defaultValue?: string | number | undefined
	label?: string | undefined
	helperText?: string | undefined
	error?: boolean | undefined
	disabled?: boolean | undefined
	required?: boolean | undefined
	readOnly?: boolean | undefined
	variant?: "outlined" | "filled" | "standard" | undefined
	size?: "small" | "medium" | undefined
	color?: "primary" | "secondary" | "success" | "info" | "warning" | undefined
	fullWidth?: boolean | undefined
	/** A `<textarea>` instead of an `<input>`. */
	multiline?: boolean | undefined
	rows?: number | undefined
	id?: string | undefined
	type?: string | undefined
	placeholder?: string | undefined
}>()
const emit = defineEmits<{ "update:modelValue": [value: string]; focus: [event: FocusEvent]; blur: [event: FocusEvent] }>()

const attrs = useAttrs()
const slots = useSlots()
const props = useDefaultProps("OmniTextField", () => ({ ...raw }))
const generated = useUid()
const id = computed(() => props.value.id ?? generated)
const hasLabel = computed(() => props.value.label !== undefined && props.value.label !== "")
const hasHelper = computed(() => props.value.helperText !== undefined && props.value.helperText !== "")
const controlled = computed(() => props.value.modelValue !== undefined)

const { machine, state } = useMachine(
	() => createField({ id: id.value, defaultFilled: raw.defaultValue !== undefined && String(raw.defaultValue) !== "" }),
	() => {
		const p = props.value
		return {
			id: id.value,
			disabled: p.disabled,
			error: p.error,
			required: p.required,
			readOnly: p.readOnly,
			hasHelper: hasHelper.value,
			filled: controlled.value ? String(p.modelValue) !== "" : undefined,
			alwaysShrink: slots["startAdornment"] ? true : undefined,
		}
	},
)

const parts = computed(() => {
	void state.value // re-read the machine whenever its state changes
	return machine.connect()
})
const input = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const inputBinding = computed(() => {
	const p = props.value
	const { class: _class, style: _style, ...inputAttrs } = attrs
	return mergeProps(toVueProps(parts.value.input), inputAttrs, {
		type: p.multiline ? undefined : p.type,
		placeholder: p.placeholder,
		rows: p.multiline ? (p.rows ?? 1) : undefined,
		value: controlled.value ? p.modelValue : p.defaultValue,
	})
})
const rootBinding = computed(() => mergeProps(toVueProps(parts.value.root), { class: ["omni-text-field", attrs.class], style: attrs.style as never }))
const onInput = (event: Event): void => emit("update:modelValue", (event.target as HTMLInputElement).value)
defineExpose({ focus: () => input.value?.focus(), input })
</script>

<template>
	<div
		v-bind="rootBinding"
		:data-variant="props.variant ?? 'outlined'"
		:data-size="props.size ?? 'medium'"
		:data-color="props.color ?? 'primary'"
		:data-full-width="props.fullWidth ? '' : undefined"
		:data-has-label="hasLabel ? '' : undefined"
	>
		<label v-if="hasLabel" v-bind="toVueProps(parts.label)" class="omni-text-field__label">
			{{ props.label }}<span v-if="state.required" class="omni-text-field__required" aria-hidden="true">&thinsp;*</span>
		</label>
		<div class="omni-text-field__control" @click="input?.focus()">
			<span v-if="$slots['startAdornment']" class="omni-text-field__adornment" data-position="start"><slot name="startAdornment" /></span>
			<component
				:is="props.multiline ? 'textarea' : 'input'"
				ref="input"
				v-bind="inputBinding"
				class="omni-text-field__input"
				@input="onInput"
				@focus="emit('focus', $event as FocusEvent)"
				@blur="emit('blur', $event as FocusEvent)"
			/>
			<span v-if="$slots['endAdornment']" class="omni-text-field__adornment" data-position="end"><slot name="endAdornment" /></span>
			<fieldset v-bind="toVueProps(parts.fieldset)" class="omni-text-field__fieldset">
				<legend class="omni-text-field__legend"><span v-if="hasLabel">{{ props.label }}</span></legend>
			</fieldset>
		</div>
		<p v-if="hasHelper" v-bind="toVueProps(parts.helper)" class="omni-text-field__helper">{{ props.helperText }}</p>
	</div>
</template>
