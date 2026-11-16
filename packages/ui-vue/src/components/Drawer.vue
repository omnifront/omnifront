<script setup lang="ts">
import { createDialog, type CloseReason } from "@omnifront/ui"
import { computed, mergeProps, ref, useAttrs, watch } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { Portal, useDefaultProps } from "../theme"

/**
 * A panel at the edge of the screen. `temporary` is a modal dialog (focus trap, Escape, scroll lock);
 * `persistent` and `permanent` are an `<aside>` landmark that does not take focus.
 */
defineOptions({ name: "OmniDrawer", inheritAttrs: false })
const raw = withDefaults(
	defineProps<{
		/** `temporary` (a modal that closes on Escape and a click outside), `persistent` or `permanent`. Default `temporary`. */
		variant?: "temporary" | "persistent" | "permanent" | undefined
		/** Which edge it sits on: `start` and `end` follow the writing direction. Default `start`. */
		anchor?: "start" | "end" | "top" | "bottom" | undefined
		open?: boolean | undefined
		/** Width of a side drawer, in px or any CSS length. Default 240px. */
		width?: number | string | undefined
	}>(),
	{ open: false },
)
type DrawerCloseReason = Extract<CloseReason, "escapeKeyDown" | "backdropClick" | "programmatic">
const emit = defineEmits<{ close: [event: Event | undefined, reason: DrawerCloseReason]; "update:open": [open: boolean] }>()
const attrs = useAttrs()
const props = useDefaultProps("OmniDrawer", () => ({ ...raw }))
const id = useUid()
const temporary = computed(() => (props.value.variant ?? "temporary") === "temporary")
const label = computed(() => (attrs["aria-label"] as string | undefined) ?? "Navigation")
const { machine, state } = useMachine(
	() => createDialog({ id }),
	() => ({
		id,
		open: temporary.value ? props.value.open : false,
		label: label.value,
		onOpenChange: (open: boolean, reason: CloseReason, event?: Event) => {
			emit("close", event, reason as DrawerCloseReason)
			emit("update:open", open)
		},
	}),
)
const parts = computed(() => {
	void state.value
	const all = machine.connect()
	return { backdrop: toVueProps(all.backdrop), container: toVueProps(all.container), content: toVueProps(all.content) }
})
const paper = ref<HTMLElement | null>(null)
const container = ref<HTMLElement | null>(null)
watch(
	() => [temporary.value, state.value.open, paper.value, container.value] as const,
	([isTemporary, open, content, wrapper], _old, onCleanup) => {
		if (!isTemporary || !open || !content) return
		onCleanup(machine.attach({ content, container: wrapper ?? undefined }))
	},
	{ flush: "post", immediate: true },
)
const anchor = computed(() => props.value.anchor ?? "start")
const variant = computed(() => props.value.variant ?? "temporary")
const size = computed(() => (props.value.width === undefined ? undefined : { "--_w": typeof props.value.width === "number" ? `${props.value.width}px` : props.value.width }))
const closed = computed(() => variant.value === "persistent" && !props.value.open)
const rootAttrs = computed(() => mergeProps(attrs, { "data-variant": variant.value, "data-anchor": anchor.value, style: size.value as never }))
</script>

<template>
	<aside v-if="!temporary" v-bind="rootAttrs" :data-state="closed ? 'closed' : 'open'" :aria-label="label" class="omni-drawer">
		<div class="omni-drawer__paper" :data-state="closed ? 'closed' : 'open'"><slot /></div>
	</aside>
	<Portal v-else>
		<div v-if="state.mounted" v-bind="rootAttrs" class="omni-drawer">
			<div v-bind="parts.backdrop" class="omni-drawer__backdrop" />
			<div ref="container" v-bind="parts.container" class="omni-drawer__container">
				<div ref="paper" v-bind="parts.content" class="omni-drawer__paper"><slot /></div>
			</div>
		</div>
	</Portal>
</template>
