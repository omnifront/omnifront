<script setup lang="ts">
import { attachAutosize, createField } from "@omnifront/ui"
import { computed, mergeProps, onBeforeUnmount, ref, useAttrs, useSlots, watch } from "vue"
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
	/** With `multiline`: grow with the text, from this many rows... */
	minRows?: number | undefined
	/** ...up to this many, then scroll. */
	maxRows?: number | undefined
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
		rows: p.multiline ? (autosize.value ? (p.minRows ?? 1) : (p.rows ?? 1)) : undefined,
	})
})
// Vue writes `value` to the element on every render. An uncontrolled field must keep what was typed,
// so after the first render it passes the element's own value back instead of `defaultValue`.
const shownValue = (): string | number | undefined =>
	controlled.value ? props.value.modelValue : (input.value?.value ?? props.value.defaultValue)
const rootBinding = computed(() => mergeProps(toVueProps(parts.value.root), { class: ["omni-text-field", attrs.class], style: attrs.style as never }))
// `minRows` / `maxRows` make a multiline field grow and shrink with its text.
const autosize = computed(() => props.value.multiline === true && (props.value.minRows !== undefined || props.value.maxRows !== undefined))
let sizer: { update(): void; destroy(): void } | undefined
watch(
	() => [autosize.value, props.value.minRows, props.value.maxRows, input.value] as const,
	([on, , , el]) => {
		sizer?.destroy()
		sizer = on && el instanceof HTMLTextAreaElement ? attachAutosize(el, () => ({ minRows: props.value.minRows, maxRows: props.value.maxRows })) : undefined
	},
	{ flush: "post", immediate: true },
)
// a value set from code (controlled) does not fire an input event
watch(() => props.value.modelValue, () => sizer?.update(), { flush: "post" })
onBeforeUnmount(() => sizer?.destroy())
const onInput = (event: Event): void => {
	sizer?.update()
	emit("update:modelValue", (event.target as HTMLInputElement).value)
}
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
				:value="shownValue()"
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
