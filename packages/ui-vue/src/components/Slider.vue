<script setup lang="ts">
import { createSlider } from "@omnifront/ui"
import { computed, mergeProps, useAttrs } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { useDefaultProps } from "../theme"

// `aria-*` attributes go to the native input; everything else to the root.
defineOptions({ name: "OmniSlider", inheritAttrs: false })

interface SliderMark {
	value: number
	label?: string | undefined
}

const raw = defineProps<{
	/** The value (`v-model`). Leave it out for an uncontrolled slider. */
	modelValue?: number | undefined
	defaultValue?: number | undefined
	min?: number | undefined
	max?: number | undefined
	step?: number | undefined
	disabled?: boolean | undefined
	size?: "small" | "medium" | undefined
	color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | undefined
	/** `true` puts a mark on every step; a list gives marks (and labels) at chosen values. */
	marks?: boolean | readonly SliderMark[] | undefined
	/** When the bubble with the value shows: on hover and focus (`auto`), always (`on`), or never (`off`). */
	valueLabelDisplay?: "auto" | "on" | "off" | undefined
	valueLabelFormat?: ((value: number) => string) | undefined
	/** The value as words for screen readers, for example `${value} degrees`. */
	getAriaValueText?: ((value: number) => string) | undefined
	name?: string | undefined
	id?: string | undefined
}>()
const emit = defineEmits<{ "update:modelValue": [value: number]; change: [event: Event | undefined, value: number] }>()

const attrs = useAttrs()
const props = useDefaultProps("OmniSlider", () => ({ ...raw }))
const generated = useUid()
const id = computed(() => props.value.id ?? generated)
const min = computed(() => props.value.min ?? 0)
const max = computed(() => props.value.max ?? 100)
const step = computed(() => props.value.step ?? 1)
const { machine, state } = useMachine(
	() => createSlider({ id: id.value, defaultValue: raw.defaultValue, min: min.value, max: max.value, step: step.value }),
	() => ({
		id: id.value,
		value: props.value.modelValue,
		min: min.value,
		max: max.value,
		step: step.value,
		disabled: props.value.disabled,
		onValueChange: (value: number, event?: Event) => {
			emit("change", event, value)
			emit("update:modelValue", value)
		},
	}),
)
const ariaAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith("aria-"))))
const rootAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => !k.startsWith("aria-") && k !== "class" && k !== "style")))
const inputBinding = computed(() =>
	mergeProps(toVueProps((void state.value, machine.connect().input)), ariaAttrs.value, {
		name: props.value.name,
		"aria-valuetext": props.value.getAriaValueText?.(state.value.value),
	}),
)
const marks = computed<SliderMark[]>(() => {
	const m = props.value.marks
	if (m === true) return Array.from({ length: Math.floor((max.value - min.value) / step.value) + 1 }, (_, i) => ({ value: Number((min.value + i * step.value).toFixed(6)) }))
	return m ? [...m] : []
})
const percentOf = (v: number): number => (max.value === min.value ? 0 : ((v - min.value) / (max.value - min.value)) * 100)
const hasMarkLabels = computed(() => marks.value.some((m) => m.label !== undefined))
const display = computed(() => props.value.valueLabelDisplay ?? "off")
</script>

<template>
	<span
		v-bind="rootAttrs"
		:class="['omni-slider', attrs.class]"
		:style="[{ '--omni-slider-percent': state.percent } as never, attrs.style as never]"
		:data-size="props.size ?? 'medium'"
		:data-color="props.color ?? 'primary'"
		:data-label="display"
		:data-disabled="state.disabled ? '' : undefined"
		:data-marks-labels="hasMarkLabels ? '' : undefined"
	>
		<input v-bind="inputBinding" class="omni-slider__input" />
		<span v-if="marks.length > 0" class="omni-slider__marks" aria-hidden="true">
			<span v-for="mark in marks" :key="mark.value">
				<span class="omni-slider__mark" :style="{ '--omni-mark': percentOf(mark.value) } as never" />
				<span v-if="mark.label !== undefined" class="omni-slider__mark-label" :style="{ '--omni-mark': percentOf(mark.value) } as never">{{ mark.label }}</span>
			</span>
		</span>
		<span v-if="display !== 'off'" class="omni-slider__label" aria-hidden="true">{{ props.valueLabelFormat ? props.valueLabelFormat(state.value) : state.value }}</span>
	</span>
</template>
