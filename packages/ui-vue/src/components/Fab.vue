<script setup lang="ts">
import { attachRipple, fabPart, type ButtonColor, type ButtonSize } from "@omnifront/ui"
import { computed, mergeProps, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** The floating action button: the main action of a screen. A circular one needs an `aria-label`. */
defineOptions({ name: "OmniFab", inheritAttrs: false })

const raw = defineProps<{
	color?: ButtonColor | undefined
	size?: ButtonSize | undefined
	/** `circular` (icon only) or `extended` (icon and text). */
	variant?: "circular" | "extended" | undefined
	disabled?: boolean | undefined
	disableRipple?: boolean | undefined
	href?: string | undefined
	type?: "button" | "submit" | "reset" | undefined
}>()
const emit = defineEmits<{ click: [event: MouseEvent] }>()
const attrs = useAttrs()
const props = useDefaultProps("OmniFab", () => ({ ...raw }))
const tag = computed(() => (props.value.href === undefined ? "button" : "a"))
const bound = computed(() => {
	const p = props.value
	const part = fabPart({ color: p.color, size: p.size, variant: p.variant, disabled: p.disabled || undefined, as: tag.value, type: p.type })
	return mergeProps(toVueProps(part), attrs, p.href === undefined ? {} : { href: p.href })
})
function onClick(event: MouseEvent): void {
	if (props.value.disabled) {
		event.preventDefault()
		return
	}
	emit("click", event)
}
const el = ref<HTMLElement | null>(null)
let stopRipple: (() => void) | undefined
const syncRipple = (): void => {
	stopRipple?.()
	stopRipple = el.value && !props.value.disableRipple ? attachRipple(el.value, { centered: props.value.variant !== "extended" }) : undefined
}
onMounted(syncRipple)
watch(() => [props.value.disableRipple, props.value.variant, tag.value], syncRipple, { flush: "post" })
onBeforeUnmount(() => stopRipple?.())
</script>

<template>
	<component :is="tag" ref="el" v-bind="bound" @click="onClick"><slot /></component>
</template>
