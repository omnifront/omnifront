<script setup lang="ts">
import { createDialog, type CloseReason } from "@omnifront/ui"
import { computed, mergeProps, provide, ref, useAttrs, watch } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { Portal, useDefaultProps } from "../theme"
import { DIALOG } from "./dialog-context"

defineOptions({ name: "OmniDialog", inheritAttrs: false })

const raw = defineProps<{
	open: boolean
	maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false | undefined
	fullWidth?: boolean | undefined
	fullScreen?: boolean | undefined
	disableEscapeKeyDown?: boolean | undefined
	hideBackdrop?: boolean | undefined
	role?: "dialog" | "alertdialog" | undefined
}>()
type DialogCloseReason = Extract<CloseReason, "escapeKeyDown" | "backdropClick" | "closeButton" | "programmatic">
const emit = defineEmits<{
	/** The user asked to close (Escape, click outside). You decide by setting `open`. */
	close: [event: Event | undefined, reason: DialogCloseReason]
	"update:open": [open: boolean]
}>()

const attrs = useAttrs()
const props = useDefaultProps("OmniDialog", () => ({ ...raw }))
const id = useUid()
const { machine, state } = useMachine(
	() => createDialog({ id }),
	() => ({
		id,
		open: props.value.open,
		role: props.value.role,
		label: attrs["aria-label"] as string | undefined,
		closeOnEscape: !props.value.disableEscapeKeyDown,
		onOpenChange: (open: boolean, reason: CloseReason, event?: Event) => {
			emit("close", event, reason as DialogCloseReason)
			emit("update:open", open)
		},
	}),
)
const parts = computed(() => {
	void state.value
	return machine.connect()
})
provide(DIALOG, parts)

const paper = ref<HTMLElement | null>(null)
const container = ref<HTMLElement | null>(null)
// Vue lifecycle: run the DOM side after render, once the paper exists, while open; stop when it closes or unmounts.
watch(
	() => [state.value.open, paper.value, container.value] as const,
	([open, content, wrapper], _old, onCleanup) => {
		if (!open || !content) return
		onCleanup(machine.attach({ content, container: wrapper ?? undefined }))
	},
	{ flush: "post", immediate: true },
)
const { class: className, style, ...paperAttrs } = attrs
const dataState = computed(() => (state.value.open ? "open" : "closed"))
</script>

<template>
	<Portal>
		<div
			v-if="state.mounted"
			:class="['omni-dialog', className]"
			:style="style as never"
			:data-max-width="props.maxWidth === false ? undefined : (props.maxWidth ?? 'sm')"
			:data-full-width="props.fullWidth ? '' : undefined"
			:data-full-screen="props.fullScreen ? '' : undefined"
			:data-state="dataState"
		>
			<div v-if="!props.hideBackdrop" v-bind="toVueProps(parts.backdrop)" class="omni-dialog__backdrop" />
			<div ref="container" v-bind="toVueProps(parts.container)" class="omni-dialog__container">
				<div ref="paper" v-bind="mergeProps(toVueProps(parts.content), paperAttrs)" class="omni-dialog__paper">
					<slot />
				</div>
			</div>
		</div>
	</Portal>
</template>
