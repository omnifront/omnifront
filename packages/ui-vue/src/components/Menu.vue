<script setup lang="ts">
import { createMenu, type CloseReason } from "@omnifront/ui"
import { autoPosition, type Placement } from "@omnifront/ui/position"
import { computed, mergeProps, provide, ref, useAttrs, watch } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { Portal, useDefaultProps } from "../theme"
import { MENU } from "./menu-context"

defineOptions({ name: "OmniMenu", inheritAttrs: false })

// Vue turns an absent boolean prop into `false`, so the "default true" has to be stated.
const raw = withDefaults(
	defineProps<{
		/** The element the menu hangs from, usually the button that opened it. */
		anchorEl: Element | null
		open: boolean
		/** Where it goes relative to the anchor. Default `bottom-start`; it flips when there is no room. */
		placement?: Placement | undefined
		/** Move focus to the first item on open. Default true. */
		autoFocus?: boolean | undefined
	}>(),
	{ autoFocus: true },
)
type MenuCloseReason = Extract<CloseReason, "escapeKeyDown" | "outsidePress" | "tab" | "select" | "programmatic">
const emit = defineEmits<{
	close: [event: Event | undefined, reason: MenuCloseReason]
	"update:open": [open: boolean]
}>()

const attrs = useAttrs()
const props = useDefaultProps("OmniMenu", () => ({ ...raw }))
const id = useUid()
const { machine, state } = useMachine(
	() => createMenu({ id }),
	() => ({
		id,
		open: props.value.open,
		autoFocus: props.value.autoFocus,
		onOpenChange: (open: boolean, reason: CloseReason, event?: Event) => {
			emit("close", event, reason as MenuCloseReason)
			emit("update:open", open)
		},
	}),
)
provide(MENU, machine)
const list = ref<HTMLElement | null>(null)
watch(
	() => [state.value.open, list.value, props.value.anchorEl, props.value.placement] as const,
	([open, content, anchor, placement], _old, onCleanup) => {
		if (!open || !content) return
		onCleanup(machine.attach({ content, anchor, position: (a, floating) => autoPosition(a, floating, placement ? { placement } : {}) }))
	},
	{ flush: "post", immediate: true },
)
const parts = computed(() => {
	void state.value
	return machine.connect()
})
const labelled = computed(() => (attrs["aria-label"] ? undefined : props.value.anchorEl?.id || undefined))
</script>

<template>
	<Portal>
		<ul
			v-if="state.mounted"
			ref="list"
			v-bind="mergeProps(toVueProps(parts.content), attrs, { 'aria-labelledby': labelled })"
			class="omni-menu"
		>
			<slot />
		</ul>
	</Portal>
</template>
