<script setup lang="ts" generic="T extends number | readonly [number, number] = number">
import { createSlider } from "@omnifront/ui"
import { computed, mergeProps, useAttrs } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { useDefaultProps } from "../theme"

// `aria-*` attributes go to the native input; everything else to the root.
defineOptions({ name: "OmniSlider", inheritAttrs: false })

// Vue turns an absent boolean prop into `false`; `range` is told apart from "not given" by its value, so the cast is harmless.
const raw = defineProps<{
	/** The value (`v-model`): a number, or with `range` a `[lower, upper]` pair. Leave it out for an uncontrolled slider. */
	modelValue?: T | undefined
	defaultValue?: T | undefined
	/** Two thumbs: a lower and an upper value. The lower one cannot pass the upper one. */
	range?: boolean | undefined
	min?: number | undefined
	max?: number | undefined
	step?: number | undefined
	disabled?: boolean | undefined
	size?: "small" | "medium" | undefined
	color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | undefined
	/** `vertical` puts the smallest value at the bottom. */
	orientation?: "horizontal" | "vertical" | undefined
	/** The height of a vertical slider (a number is pixels, or any CSS length). Default 200px. */
	length?: number | string | undefined
	/** `true` puts a mark on every step; a list gives marks (and labels) at chosen values. */
	marks?: boolean | readonly { value: number; label?: string | undefined }[] | undefined
	/** When the bubble with the value shows: on hover and focus (`auto`), always (`on`), or never (`off`). */
	valueLabelDisplay?: "auto" | "on" | "off" | undefined
	valueLabelFormat?: ((value: number) => string) | undefined
	/** The value as words for screen readers, for example `${value} degrees`. */
	getAriaValueText?: ((value: number) => string) | undefined
	/** Name for a form. A range submits both values under `name` (lower first). */
	name?: string | undefined
	id?: string | undefined
}>()
const emit = defineEmits<{ "update:modelValue": [value: T]; change: [event: Event | undefined, value: T] }>()

const attrs = useAttrs()
const props = useDefaultProps("OmniSlider", () => ({ ...raw }))
const generated = useUid()
const id = computed(() => props.value.id ?? generated)
const min = computed(() => props.value.min ?? 0)
const max = computed(() => props.value.max ?? 100)
const step = computed(() => props.value.step ?? 1)
const isRange = computed(() => props.value.range === true)
const asPair = (v: unknown): [number, number] | undefined => (Array.isArray(v) ? ([v[0], v[1]] as [number, number]) : undefined)
const asNumber = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined)
const { machine, state } = useMachine(
	() =>
		createSlider({
			id: id.value,
			range: raw.range === true,
			defaultValue: asNumber(raw.defaultValue),
			defaultValues: asPair(raw.defaultValue),
			min: min.value,
			max: max.value,
			step: step.value,
		}),
	() => ({
		id: id.value,
		range: isRange.value,
		value: asNumber(props.value.modelValue),
		values: asPair(props.value.modelValue),
		min: min.value,
		max: max.value,
		step: step.value,
		disabled: props.value.disabled,
		orientation: props.value.orientation,
		onValueChange: (value: number, event?: Event) => {
			emit("change", event, value as T)
			emit("update:modelValue", value as T)
		},
		onValuesChange: (values: [number, number], event?: Event) => {
			emit("change", event, values as unknown as T)
			emit("update:modelValue", values as unknown as T)
		},
	}),
)
const ariaAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith("aria-"))))
const rootAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => !k.startsWith("aria-") && k !== "class" && k !== "style")))
const thumbValues = computed(() => (state.value.range ? state.value.values : [state.value.value]))
const thumbName = (index: number): string | undefined => {
	const label = ariaAttrs.value["aria-label"] as string | undefined
	return state.value.range && label ? `${label} ${index === 0 ? "minimum" : "maximum"}` : label
}
const inputBindings = computed(() =>
	(void state.value, machine.connect().inputs).map((p, index) =>
		mergeProps(toVueProps(p), ariaAttrs.value, {
			name: props.value.name,
			"aria-label": thumbName(index),
			"aria-valuetext": props.value.getAriaValueText?.(thumbValues.value[index] as number),
		}),
	),
)
const marks = computed<{ value: number; label?: string | undefined }[]>(() => {
	const m = props.value.marks
	if (m === true) return Array.from({ length: Math.floor((max.value - min.value) / step.value) + 1 }, (_, i) => ({ value: Number((min.value + i * step.value).toFixed(6)) }))
	return m ? [...m] : []
})
const percentOf = (v: number): number => (max.value === min.value ? 0 : ((v - min.value) / (max.value - min.value)) * 100)
const hasMarkLabels = computed(() => marks.value.some((m) => m.label !== undefined))
const display = computed(() => props.value.valueLabelDisplay ?? "off")
const rootStyle = computed(() => {
	const length = props.value.length
	return {
		"--omni-slider-percent": state.value.percent,
		"--omni-slider-start": state.value.start,
		...(length !== undefined ? { "--omni-slider-length": typeof length === "number" ? `${length}px` : length } : {}),
	}
})
</script>

<template>
	<span
		v-bind="rootAttrs"
		:class="['omni-slider', attrs.class]"
		:style="[rootStyle as never, attrs.style as never]"
		:data-size="props.size ?? 'medium'"
		:data-color="props.color ?? 'primary'"
		:data-label="display"
		:data-orientation="state.orientation"
		:data-range="state.range ? '' : undefined"
		:data-disabled="state.disabled ? '' : undefined"
		:data-marks-labels="hasMarkLabels ? '' : undefined"
	>
		<span v-if="state.range" class="omni-slider__rail" aria-hidden="true"><span class="omni-slider__fill" /></span>
		<input v-for="(binding, index) in inputBindings" :key="index" v-bind="binding" class="omni-slider__input" />
		<span v-if="marks.length > 0" class="omni-slider__marks" aria-hidden="true">
			<span v-for="mark in marks" :key="mark.value">
				<span class="omni-slider__mark" :style="{ '--omni-mark': percentOf(mark.value) } as never" />
				<span v-if="mark.label !== undefined" class="omni-slider__mark-label" :style="{ '--omni-mark': percentOf(mark.value) } as never">{{ mark.label }}</span>
			</span>
		</span>
		<template v-if="display !== 'off'">
			<span v-for="(v, index) in thumbValues" :key="index" class="omni-slider__label" aria-hidden="true" :style="{ '--omni-slider-percent': percentOf(v) } as never">{{ props.valueLabelFormat ? props.valueLabelFormat(v) : v }}</span>
		</template>
	</span>
</template>
