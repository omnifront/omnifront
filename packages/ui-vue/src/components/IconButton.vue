<script setup lang="ts">
import { attachRipple, iconButtonPart, type ButtonSize, type IconButtonColor } from "@omnifront/ui"
import { computed, mergeProps, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A round, icon-only button. Give it an `aria-label`: it has no text. */
defineOptions({ name: "OmniIconButton", inheritAttrs: false })

const raw = defineProps<{
	color?: IconButtonColor | undefined
	size?: ButtonSize | undefined
	/** Pull the button outwards so its icon lines up with the edge of its container. */
	edge?: "start" | "end" | false | undefined
	disabled?: boolean | undefined
	disableRipple?: boolean | undefined
	/** Renders an `<a>` instead of a `<button>`. */
	href?: string | undefined
	type?: "button" | "submit" | "reset" | undefined
}>()
const emit = defineEmits<{ click: [event: MouseEvent] }>()
const attrs = useAttrs()
const props = useDefaultProps("OmniIconButton", () => ({ ...raw }))
const tag = computed(() => (props.value.href === undefined ? "button" : "a"))
const bound = computed(() => {
	const p = props.value
	const part = iconButtonPart({ color: p.color, size: p.size, edge: p.edge, disabled: p.disabled || undefined, as: tag.value, type: p.type })
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
	stopRipple = el.value && !props.value.disableRipple ? attachRipple(el.value, { centered: true }) : undefined
}
onMounted(syncRipple)
watch(() => [props.value.disableRipple, tag.value], syncRipple, { flush: "post" })
onBeforeUnmount(() => stopRipple?.())
</script>

<template>
	<component :is="tag" ref="el" v-bind="bound" @click="onClick"><slot /></component>
</template>
