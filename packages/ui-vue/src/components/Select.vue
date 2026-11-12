<script setup lang="ts">
import { createField, createSelect, mergeParts, type CloseReason, type SelectOption } from "@omnifront/ui"
import { autoPosition } from "@omnifront/ui/position"
import { computed, mergeProps, ref, useAttrs, watch } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { Portal, useDefaultProps } from "../theme"

defineOptions({ name: "OmniSelect", inheritAttrs: false })

// Vue turns an absent boolean prop into `false`; `open` must stay `undefined` to mean "not controlled".
const raw = withDefaults(
	defineProps<{
		label?: string | undefined
		/** What can be chosen. `value` is what the model holds; `label` is what the user sees. */
		options: readonly SelectOption[]
		/** The chosen value (`v-model`). Leave it out for an uncontrolled select. `""` means nothing is selected. */
		modelValue?: string | undefined
		defaultValue?: string | undefined
		open?: boolean | undefined
		defaultOpen?: boolean | undefined
		helperText?: string | undefined
		error?: boolean | undefined
		disabled?: boolean | undefined
		required?: boolean | undefined
		variant?: "outlined" | "filled" | "standard" | undefined
		size?: "small" | "medium" | undefined
		color?: "primary" | "secondary" | "success" | "info" | "warning" | undefined
		fullWidth?: boolean | undefined
		/** Name for a form: the value is also written to a hidden `<input>`. */
		name?: string | undefined
		id?: string | undefined
	}>(),
	{ open: undefined },
)
type SelectCloseReason = Extract<CloseReason, "escapeKeyDown" | "outsidePress" | "tab" | "select" | "trigger" | "programmatic">
const emit = defineEmits<{
	"update:modelValue": [value: string]
	/** The user chose an option. */
	change: [event: Event | undefined, value: string]
	"update:open": [open: boolean]
	/** The list closed, and why. */
	close: [reason: SelectCloseReason]
}>()

const attrs = useAttrs()
const props = useDefaultProps("OmniSelect", () => ({ ...raw }))
const generated = useUid()
const id = computed(() => props.value.id ?? generated)
const hasLabel = computed(() => props.value.label !== undefined && props.value.label !== "")
const hasHelper = computed(() => props.value.helperText !== undefined && props.value.helperText !== "")

const { machine: select, state } = useMachine(
	() => createSelect({ id: id.value, options: raw.options, defaultValue: raw.defaultValue, defaultOpen: raw.defaultOpen }),
	() => ({
		id: id.value,
		options: props.value.options,
		value: props.value.modelValue,
		disabled: props.value.disabled,
		open: props.value.open,
		onValueChange: (value: string, event?: Event) => {
			emit("change", event, value)
			emit("update:modelValue", value)
		},
		onOpenChange: (open: boolean, reason: CloseReason) => {
			emit("update:open", open)
			if (!open) emit("close", reason as SelectCloseReason)
		},
	}),
)
const { machine: field, state: fieldState } = useMachine(
	() => createField({ id: id.value }),
	() => ({
		id: id.value,
		disabled: props.value.disabled,
		error: props.value.error,
		required: props.value.required,
		hasHelper: hasHelper.value,
		filled: state.value.filled,
	}),
)
const parts = computed(() => (void state.value, select.connect()))
const fieldParts = computed(() => (void fieldState.value, field.connect()))
const triggerBinding = computed(() => toVueProps(mergeParts(parts.value.trigger, fieldParts.value.trigger)))
const rootBinding = computed(() => mergeProps(toVueProps(fieldParts.value.root), { class: ["omni-text-field", "omni-select", attrs.class], style: attrs.style as never }))
const optionBinding = (option: SelectOption) => toVueProps((void state.value, select.option(option)))

const trigger = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)
// Vue lifecycle: the DOM side runs after render, once the list exists, while open; it stops when it closes or unmounts.
watch(
	() => [state.value.open, list.value, trigger.value] as const,
	([open, content, anchor], _old, onCleanup) => {
		if (!open || !content || !anchor) return
		onCleanup(select.attach({ content, trigger: anchor, position: (a, floating) => autoPosition(a, floating, { matchWidth: true }) }))
	},
	{ flush: "post", immediate: true },
)
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
		<label v-if="hasLabel" v-bind="{ ...toVueProps(fieldParts.label), for: undefined }" class="omni-text-field__label" @click="trigger?.focus()">
			{{ props.label }}<span v-if="fieldState.required" class="omni-text-field__required" aria-hidden="true">&thinsp;*</span>
		</label>
		<div class="omni-text-field__control">
			<div ref="trigger" v-bind="triggerBinding" class="omni-text-field__input omni-select__trigger">{{ state.label }}</div>
			<span class="omni-select__icon" aria-hidden="true" :data-state="state.open ? 'open' : 'closed'" />
			<input v-if="props.name" type="hidden" :name="props.name" :value="state.value ?? ''" />
			<fieldset v-bind="toVueProps(fieldParts.fieldset)" class="omni-text-field__fieldset">
				<legend class="omni-text-field__legend"><span v-if="hasLabel">{{ props.label }}</span></legend>
			</fieldset>
		</div>
		<p v-if="hasHelper" v-bind="toVueProps(fieldParts.helper)" class="omni-text-field__helper">{{ props.helperText }}</p>
		<Portal>
			<ul v-if="state.mounted" ref="list" v-bind="toVueProps(parts.listbox)" class="omni-menu omni-select__listbox">
				<li v-for="option in props.options" :key="option.value" v-bind="optionBinding(option)" class="omni-menu__item">{{ option.label }}</li>
			</ul>
		</Portal>
	</div>
</template>
