<script setup lang="ts">
import { createSnackbar, type CloseReason } from "@omnifront/ui"
import { computed, ref, useAttrs, watch } from "vue"
import { toVueProps, useMachine } from "../internal"
import { Portal, useDefaultProps } from "../theme"

/**
 * A short message at the edge of the screen. It is a polite live region (`role="status"`); put an
 * `Alert` in the default slot for a severity, or use `message` and the `action` slot.
 */
defineOptions({ name: "OmniSnackbar", inheritAttrs: false })
const raw = withDefaults(
	defineProps<{
		open: boolean
		/** Milliseconds before it asks to close. Leave out to stay until closed. Hovering or focusing it pauses the timer. */
		autoHideDuration?: number | null | undefined
		anchorOrigin?: { vertical: "top" | "bottom"; horizontal: "left" | "center" | "right" } | undefined
		message?: string | undefined
		/** A press outside does not close it. */
		disableClickAway?: boolean | undefined
	}>(),
	{ autoHideDuration: undefined, disableClickAway: undefined },
)
type SnackbarCloseReason = Extract<CloseReason, "timeout" | "outsidePress" | "escapeKeyDown" | "programmatic">
const emit = defineEmits<{
	/** It asks to close (after `autoHideDuration`, on Escape, on a press outside). You decide by setting `open`. */
	close: [event: Event | undefined, reason: SnackbarCloseReason]
	"update:open": [open: boolean]
}>()
const attrs = useAttrs()
const props = useDefaultProps("OmniSnackbar", () => ({ ...raw }))
const { machine, state } = useMachine(
	() => createSnackbar(),
	() => ({
		open: props.value.open,
		autoHideDuration: props.value.autoHideDuration,
		anchorOrigin: props.value.anchorOrigin,
		closeOnOutsidePress: !props.value.disableClickAway,
		onOpenChange: (open: boolean, reason: CloseReason, event?: Event) => {
			emit("close", event, reason as SnackbarCloseReason)
			emit("update:open", open)
		},
	}),
)
const parts = computed(() => {
	void state.value
	const all = machine.connect()
	return { root: toVueProps(all.root), content: toVueProps(all.content) }
})
const content = ref<HTMLElement | null>(null)
watch(
	() => [state.value.open, content.value] as const,
	([open, el], _old, onCleanup) => {
		if (!open || !el) return
		onCleanup(machine.attach({ content: el }))
	},
	{ flush: "post", immediate: true },
)
</script>

<template>
	<Portal>
		<div v-if="state.mounted" v-bind="{ ...parts.root, ...attrs }" class="omni-snackbar">
			<div ref="content" v-bind="parts.content" class="omni-snackbar__content">
				<slot>
					<div class="omni-snackbar__message">{{ props.message }}</div>
					<div v-if="$slots['action']" class="omni-snackbar__action"><slot name="action" /></div>
				</slot>
			</div>
		</div>
	</Portal>
</template>
