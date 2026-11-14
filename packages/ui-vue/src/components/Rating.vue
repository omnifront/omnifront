<script setup lang="ts">
import { createRating } from "@omnifront/ui"
import { computed, mergeProps, useAttrs } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { useDefaultProps } from "../theme"

defineOptions({ name: "OmniRating", inheritAttrs: false })

const raw = defineProps<{
	/** The rating (`v-model`). `0` means none. Leave it out for an uncontrolled rating. */
	modelValue?: number | undefined
	defaultValue?: number | undefined
	/** Number of stars. Default 5. */
	max?: number | undefined
	/** `1` (whole stars, default), `0.5` or `0.25`. */
	precision?: 1 | 0.5 | 0.25 | undefined
	/** Show the value without letting the user change it. It is an image with a text alternative. */
	readOnly?: boolean | undefined
	disabled?: boolean | undefined
	size?: "small" | "medium" | "large" | undefined
	color?: "primary" | "secondary" | "error" | undefined
	name?: string | undefined
	id?: string | undefined
}>()
const emit = defineEmits<{
	"update:modelValue": [value: number]
	change: [event: Event | undefined, value: number]
	/** The value under the pointer, or `undefined` when it leaves. */
	changeActive: [value: number | undefined]
}>()

const attrs = useAttrs()
const props = useDefaultProps("OmniRating", () => ({ ...raw }))
const generated = useUid()
const id = computed(() => props.value.id ?? generated)
const { machine, state } = useMachine(
	() => createRating({ id: id.value, defaultValue: raw.defaultValue }),
	() => ({
		id: id.value,
		name: props.value.name,
		label: attrs["aria-label"] as string | undefined,
		value: props.value.modelValue,
		max: props.value.max,
		precision: props.value.precision,
		readOnly: props.value.readOnly,
		disabled: props.value.disabled,
		onValueChange: (value: number, event?: Event) => {
			emit("change", event, value)
			emit("update:modelValue", value)
		},
		onHoverChange: (value: number | undefined) => emit("changeActive", value),
	}),
)
// `aria-label` is the machine's (a read-only rating adds its value to it); the other attributes go to the root as they are.
const groupAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => k !== "aria-label")))
const parts = computed(() => (void state.value, machine.connect()))
const stars = computed(() => (void state.value, machine.stars()))
</script>

<template>
	<span v-bind="mergeProps(toVueProps(parts.group), { class: 'omni-rating' }, groupAttrs)" :data-size="props.size ?? 'medium'" :data-color="props.color">
		<input v-if="!state.readOnly" v-bind="toVueProps(parts.clear)" class="omni-rating__clear" />
		<span v-for="star in stars" :key="star.index" class="omni-rating__star" :data-fill="star.fill">
			<span class="omni-rating__icon" aria-hidden="true" />
			<span class="omni-rating__fill-box" aria-hidden="true"><span class="omni-rating__fill" /></span>
			<template v-if="!state.readOnly">
				<input v-for="radio in star.radios" :key="radio.value" v-bind="toVueProps(radio.part)" class="omni-rating__radio" />
			</template>
		</span>
	</span>
</template>
