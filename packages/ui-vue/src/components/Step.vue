<script setup lang="ts">
import { ICON_PATHS, stepPart, stepState } from "@omnifront/ui"
import { computed, getCurrentInstance, onBeforeMount, onBeforeUpdate, ref } from "vue"
import { hasListener, toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** One step: a number (or tick, or error mark) and a label. A `click` listener makes its header a button. The default slot is content shown under the label of the active step in a vertical stepper. */
defineOptions({ name: "OmniStep" })
const raw = defineProps<{
	label?: string | undefined
	/** A second line under the label ("Optional"). */
	optional?: string | undefined
	/** Override the state the stepper's `activeStep` gives. */
	completed?: boolean | undefined
	active?: boolean | undefined
	disabled?: boolean | undefined
	error?: boolean | undefined
	/** Set by the Stepper: position, current step, count and orientation. Not for you to pass. */
	index?: number | undefined
	activeStep?: number | undefined
	count?: number | undefined
	orientation?: "horizontal" | "vertical" | undefined
}>()
const emit = defineEmits<{ click: [event: MouseEvent] }>()
const props = useDefaultProps("OmniStep", () => ({ ...raw }))
const instance = getCurrentInstance()
const clickable = ref(false)
const read = (): void => void (clickable.value = hasListener(instance?.vnode.props, "click"))
read()
onBeforeMount(read)
onBeforeUpdate(read)
const options = computed(() => {
	const p = props.value
	return { index: p.index ?? 0, activeStep: p.activeStep ?? 0, count: p.count, completed: p.completed || undefined, active: p.active || undefined, disabled: p.disabled || undefined, error: p.error || undefined }
})
const state = computed(() => stepState(options.value))
const bound = computed(() => ({ ...toVueProps(stepPart(options.value)), "aria-current": (state.value.active ? "step" : undefined) as "step" | undefined }))
</script>

<template>
	<li v-bind="bound">
		<component :is="clickable ? 'button' : 'span'" class="omni-step__header" v-bind="clickable ? { type: 'button', disabled: props.disabled || undefined } : {}" @click="clickable && emit('click', $event)">
			<span class="omni-step__icon">
				<slot name="icon">
					<svg v-if="state.error" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path :d="ICON_PATHS.warning" /></svg>
					<svg v-else-if="state.completed" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path :d="ICON_PATHS.check" /></svg>
					<template v-else>{{ (props.index ?? 0) + 1 }}</template>
				</slot>
			</span>
			<span>
				<span class="omni-step__label"><slot name="label">{{ props.label }}</slot></span>
				<span v-if="props.optional" class="omni-step__optional">{{ props.optional }}</span>
			</span>
		</component>
		<div v-if="props.orientation === 'vertical'" class="omni-step__content"><slot v-if="state.active" /></div>
	</li>
</template>
