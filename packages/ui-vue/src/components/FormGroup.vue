<script setup lang="ts">
import { formGroupParts } from "@omnifront/ui"
import { computed, mergeProps, useAttrs } from "vue"
import { toVueProps, useUid } from "../internal"
import { useDefaultProps } from "../theme"

/** A labelled group of related controls (a `<fieldset>` with a `<legend>`), for example several Checkboxes. */
defineOptions({ name: "OmniFormGroup", inheritAttrs: false })

const raw = defineProps<{
	label?: string | undefined
	helperText?: string | undefined
	error?: boolean | undefined
	disabled?: boolean | undefined
	/** Lay the items out in a row. */
	row?: boolean | undefined
	id?: string | undefined
}>()
const attrs = useAttrs()
const props = useDefaultProps("OmniFormGroup", () => ({ ...raw }))
const generated = useUid()
const hasLabel = computed(() => props.value.label !== undefined && props.value.label !== "")
const hasHelper = computed(() => props.value.helperText !== undefined && props.value.helperText !== "")
const parts = computed(() =>
	formGroupParts({ id: props.value.id ?? generated, hasLabel: hasLabel.value, hasHelper: hasHelper.value, error: props.value.error, disabled: props.value.disabled, row: props.value.row }),
)
</script>

<template>
	<fieldset v-bind="mergeProps(toVueProps(parts.group), attrs)" class="omni-form-group">
		<legend v-if="hasLabel" v-bind="toVueProps(parts.label)" class="omni-form-group__label">{{ props.label }}</legend>
		<div v-bind="toVueProps(parts.items)" class="omni-form-group__items"><slot /></div>
		<p v-if="hasHelper" v-bind="toVueProps(parts.helper)" class="omni-form-group__helper">{{ props.helperText }}</p>
	</fieldset>
</template>
