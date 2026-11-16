<script setup lang="ts">
import { ICON_PATHS, createChip } from "@omnifront/ui"
import { computed, getCurrentInstance, onBeforeMount, onBeforeUpdate, ref } from "vue"
import { toVueProps, useMachine } from "../internal"
import { useDefaultProps } from "../theme"

/**
 * A compact tag, filter or choice. With a `click` listener it is a button (Enter and Space); with a
 * `delete` listener it shows a delete icon and Backspace / Delete on the focused chip removes it.
 */
defineOptions({ name: "OmniChip" })
const raw = defineProps<{
	label?: string | undefined
	variant?: "filled" | "outlined" | undefined
	color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" | undefined
	size?: "small" | "medium" | undefined
	/** Makes the chip a button even without a `click` listener. */
	clickable?: boolean | undefined
	disabled?: boolean | undefined
}>()
const emit = defineEmits<{ click: [event: MouseEvent]; delete: [event: Event] }>()
const props = useDefaultProps("OmniChip", () => ({ ...raw }))

// Vue has no "is anyone listening" prop, but the listeners are on the vnode. Read them before every render.
const instance = getCurrentInstance()
const hasClick = ref(false)
const hasDelete = ref(false)
const readListeners = (): void => {
	const vnodeProps = instance?.vnode.props ?? {}
	hasClick.value = vnodeProps["onClick"] !== undefined
	hasDelete.value = vnodeProps["onDelete"] !== undefined
}
readListeners()
onBeforeMount(readListeners)
onBeforeUpdate(readListeners)

const { machine, state } = useMachine(
	() => createChip(),
	() => ({
		clickable: props.value.clickable || hasClick.value || undefined,
		deletable: hasDelete.value,
		disabled: props.value.disabled || undefined,
		onDelete: (event: Event) => emit("delete", event),
	}),
)
const parts = computed(() => {
	void state.value
	return machine.connect()
})
const root = computed(() => toVueProps(parts.value.root))
const deleteIcon = computed(() => toVueProps(parts.value.deleteIcon))
</script>

<template>
	<div v-bind="root" class="omni-chip" :data-variant="props.variant ?? 'filled'" :data-color="props.color ?? 'default'" :data-size="props.size ?? 'medium'" @click="emit('click', $event)">
		<slot name="avatar" />
		<span v-if="$slots['icon']" class="omni-chip__icon"><slot name="icon" /></span>
		<span class="omni-chip__label"><slot>{{ props.label }}</slot></span>
		<svg v-if="hasDelete" v-bind="deleteIcon" viewBox="0 0 24 24" focusable="false"><path :d="ICON_PATHS.cancel" /></svg>
	</div>
</template>
