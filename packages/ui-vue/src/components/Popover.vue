<script setup lang="ts">
import { createPopover, type CloseReason } from "@omnifront/ui"
import { autoPosition, type Placement } from "@omnifront/ui/position"
import { computed, mergeProps, ref, useAttrs, watch } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { Portal, useDefaultProps } from "../theme"

/** A panel next to an element, holding anything. Not modal: the page stays usable. Escape and a press outside ask to close; focus moves in and goes back. A popover is a dialog and needs `aria-label` or `aria-labelledby`. */
defineOptions({ name: "OmniPopover", inheritAttrs: false })
const raw = defineProps<{
	open: boolean
	/** The element it hangs from. A press on it is not "outside". */
	anchorEl: Element | null | undefined
	/** Default `bottom-start`; it flips when there is no room. */
	placement?: Placement | undefined
}>()
type PopoverCloseReason = Extract<CloseReason, "escapeKeyDown" | "outsidePress" | "programmatic">
const emit = defineEmits<{ close: [event: Event | undefined, reason: PopoverCloseReason]; "update:open": [open: boolean] }>()
const attrs = useAttrs()
const props = useDefaultProps("OmniPopover", () => ({ ...raw }))
const id = useUid()
const { machine, state } = useMachine(
	() => createPopover({ id }),
	() => ({
		id,
		open: props.value.open,
		label: attrs["aria-label"] as string | undefined,
		labelledBy: attrs["aria-labelledby"] as string | undefined,
		onOpenChange: (open: boolean, reason: CloseReason, event?: Event) => {
			emit("close", event, reason as PopoverCloseReason)
			emit("update:open", open)
		},
	}),
)
const content = ref<HTMLElement | null>(null)
watch(
	() => [state.value.open, content.value, props.value.anchorEl, props.value.placement] as const,
	([open, el, anchor, placement], _old, onCleanup) => {
		if (!open || !el) return
		onCleanup(machine.attach({ content: el, anchor, position: (a, floating) => autoPosition(a, floating, { placement: placement ?? "bottom-start", offset: 8 }) }))
	},
	{ flush: "post", immediate: true },
)
const bound = computed(() => {
	void state.value
	return mergeProps(toVueProps(machine.connect().content), attrs)
})
</script>

<template>
	<Portal>
		<div v-if="state.mounted" ref="content" v-bind="bound" class="omni-popover"><slot /></div>
	</Portal>
</template>
