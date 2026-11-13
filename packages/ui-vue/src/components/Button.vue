<script setup lang="ts">
import { attachRipple, buttonPart, type ButtonColor, type ButtonSize, type ButtonVariant } from "@omnifront/ui"
import { computed, inject, mergeProps, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"
import { BUTTON_GROUP } from "./button-group-context"

// We forward attributes ourselves so a click can be blocked while loading.
defineOptions({ name: "OmniButton", inheritAttrs: false })

// `disabled` and `disableElevation` default to undefined (not false) so a ButtonGroup can tell "not set" from "off".
const raw = withDefaults(defineProps<{
	variant?: ButtonVariant | undefined
	color?: ButtonColor | undefined
	size?: ButtonSize | undefined
	fullWidth?: boolean | undefined
	disableElevation?: boolean | undefined
	/** Shows a spinner and ignores clicks, e.g. `:loading="mutation.isPending"`. */
	loading?: boolean | undefined
	disabled?: boolean | undefined
	/** Turn off the touch ripple. */
	disableRipple?: boolean | undefined
	/** Renders an `<a>` instead of a `<button>`. */
	href?: string | undefined
	type?: "button" | "submit" | "reset" | undefined
}>(), { disabled: undefined, disableElevation: undefined })

const emit = defineEmits<{ click: [event: MouseEvent] }>()
const attrs = useAttrs()
const themed = useDefaultProps("OmniButton", () => ({ ...raw }))
const group = inject(BUTTON_GROUP, null)
// Inside a ButtonGroup, the group's props fill in what the Button did not set itself.
const props = computed(() => {
	const out: Record<string, unknown> = { ...themed.value }
	for (const [key, value] of Object.entries(group?.value ?? {})) if (out[key] === undefined && value !== undefined) out[key] = value
	return out as typeof themed.value
})
const tag = computed(() => (props.value.href === undefined ? "button" : "a"))
const bound = computed(() => {
	const p = props.value
	const part = buttonPart({
		variant: p.variant,
		color: p.color,
		size: p.size,
		fullWidth: p.fullWidth || undefined,
		disableElevation: p.disableElevation || undefined,
		disabled: p.disabled || undefined,
		loading: p.loading || undefined,
		as: tag.value,
		type: p.type,
	})
	// The machine's part first, then what the caller passed, so their class is appended and their attributes win.
	return mergeProps(toVueProps(part), attrs, p.href === undefined ? {} : { href: p.href })
})

function onClick(event: MouseEvent): void {
	if (props.value.loading || props.value.disabled) {
		event.preventDefault()
		return
	}
	emit("click", event)
}

const el = ref<HTMLElement | null>(null)
let stopRipple: (() => void) | undefined
const syncRipple = (): void => {
	stopRipple?.()
	stopRipple = el.value && !props.value.disableRipple ? attachRipple(el.value) : undefined
}
onMounted(syncRipple)
watch(() => [props.value.disableRipple, tag.value], syncRipple, { flush: "post" })
onBeforeUnmount(() => stopRipple?.())
</script>

<template>
	<component :is="tag" ref="el" v-bind="bound" @click="onClick">
		<span v-if="$slots['startIcon']" class="omni-button__start"><slot name="startIcon" /></span>
		<slot />
		<span v-if="$slots['endIcon']" class="omni-button__end"><slot name="endIcon" /></span>
	</component>
</template>
