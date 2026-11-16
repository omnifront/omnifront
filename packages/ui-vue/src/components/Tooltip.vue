<script setup lang="ts">
import { createTooltip, type CloseReason } from "@omnifront/ui"
import { autoPosition, type Placement } from "@omnifront/ui/position"
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, watch } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { Portal, useDefaultProps } from "../theme"

/**
 * A short description that appears on hover and keyboard focus and goes on Escape. The trigger is
 * the single element in the default slot; the tooltip is wired to it with `aria-describedby`
 * while it is open. Use the `title` slot for anything richer than text.
 */
defineOptions({ name: "OmniTooltip", inheritAttrs: false })
// `open` must stay `undefined` to mean "not controlled" (Vue would turn a missing boolean into false).
const raw = withDefaults(
	defineProps<{
		/** What it says. Empty means no tooltip. It describes the element; it is not its name. */
		title?: string | undefined
		/** Default `bottom`; it flips when there is no room. */
		placement?: Placement | undefined
		/** Controlled (`v-model:open`). Leave out for hover and focus to decide. */
		open?: boolean | undefined
		defaultOpen?: boolean | undefined
		/** Milliseconds the pointer rests before it opens. Default 100. Keyboard focus opens at once. */
		enterDelay?: number | undefined
		leaveDelay?: number | undefined
		/** Close as soon as the pointer leaves the trigger, even towards the tooltip. */
		disableInteractive?: boolean | undefined
	}>(),
	{ open: undefined, defaultOpen: undefined, disableInteractive: undefined },
)
const emit = defineEmits<{ open: [event: Event | undefined]; close: [event: Event | undefined]; "update:open": [open: boolean] }>()
const props = useDefaultProps("OmniTooltip", () => ({ ...raw }))
const slots = defineSlots<{ default?: () => unknown; title?: () => unknown }>()
const id = useUid()
const hasTitle = computed(() => Boolean(props.value.title) || slots.title !== undefined)
const { machine, state } = useMachine(
	() => createTooltip({ id, defaultOpen: raw.defaultOpen }),
	() => ({
		id,
		open: hasTitle.value ? props.value.open : false,
		enterDelay: props.value.enterDelay,
		leaveDelay: props.value.leaveDelay,
		disableInteractive: props.value.disableInteractive || undefined,
		disabled: !hasTitle.value,
		onOpenChange: (open: boolean, _reason: CloseReason, event?: Event) => {
			if (open) emit("open", event)
			else emit("close", event)
			emit("update:open", open)
		},
	}),
)
const wrapper = ref<HTMLElement | null>(null)
const floating = ref<HTMLElement | null>(null)
const tooltipPart = computed(() => {
	void state.value
	return toVueProps(machine.connect().tooltip)
})

// The trigger is whatever element the slot rendered; re-attach if it was replaced.
let trigger: Element | null = null
let detach: (() => void) | undefined
const syncTrigger = (): void => {
	const next = wrapper.value?.firstElementChild ?? null
	if (next === trigger) return
	detach?.()
	trigger = next
	detach = next instanceof HTMLElement ? machine.attachTrigger(next) : undefined
}
onMounted(syncTrigger)
onUpdated(syncTrigger)
onBeforeUnmount(() => detach?.())
watch(
	() => [state.value.mounted, floating.value, props.value.placement] as const,
	([mounted, el, placement], _old, onCleanup) => {
		if (!mounted || !el || !(trigger instanceof HTMLElement)) return
		onCleanup(machine.attach({ trigger, tooltip: el, position: (anchor, node) => autoPosition(anchor, node, { placement: placement ?? "bottom", offset: 8 }) }))
	},
	{ flush: "post", immediate: true },
)
</script>

<template>
	<span ref="wrapper" class="omni-tooltip-trigger"><slot /></span>
	<Portal>
		<div v-if="state.mounted && hasTitle" ref="floating" v-bind="tooltipPart" class="omni-tooltip"><slot name="title">{{ props.title }}</slot></div>
	</Portal>
</template>
