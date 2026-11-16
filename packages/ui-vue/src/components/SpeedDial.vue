<script setup lang="ts">
import { ICON_PATHS, createSpeedDial, displayPart, type CloseReason } from "@omnifront/ui"
import { computed, mergeProps, provide, useAttrs } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { useDefaultProps } from "../theme"
import { SPEED_DIAL } from "./speed-dial-context"
import Fab from "./Fab.vue"

/** A floating button that fans out a few actions (SpeedDialAction). Opens on click or hover; arrow keys move between actions; Escape closes. `ariaLabel` (`aria-label`) names the main button; the `icon` slot replaces the plus. */
defineOptions({ name: "OmniSpeedDial", inheritAttrs: false })
const raw = withDefaults(
	defineProps<{
		/** The main button's accessible name. Required: the button is only an icon. */
		ariaLabel: string
		direction?: "up" | "down" | "left" | "right" | undefined
		open?: boolean | undefined
		defaultOpen?: boolean | undefined
	}>(),
	{ open: undefined, defaultOpen: undefined },
)
const emit = defineEmits<{ open: [event: Event | undefined]; close: [event: Event | undefined, reason: CloseReason]; "update:open": [open: boolean] }>()
const attrs = useAttrs()
const props = useDefaultProps("OmniSpeedDial", () => ({ ...raw }))
const id = useUid()
const { machine, state } = useMachine(
	() => createSpeedDial({ id, defaultOpen: raw.defaultOpen }),
	() => ({
		id,
		open: props.value.open,
		direction: props.value.direction,
		onOpenChange: (open: boolean, reason: CloseReason, event?: Event) => {
			if (open) emit("open", event)
			else emit("close", event, reason)
			emit("update:open", open)
		},
	}),
)
const parts = computed(() => {
	void state.value
	return machine.connect()
})
provide(SPEED_DIAL, parts)
const root = computed(() => mergeProps(toVueProps(displayPart("omni-speed-dial")), toVueProps(parts.value.root), attrs))
</script>

<template>
	<div v-bind="root">
		<Fab v-bind="toVueProps(parts.trigger)" class="omni-speed-dial__trigger" :aria-label="props.ariaLabel">
			<slot name="icon"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path :d="ICON_PATHS.add" /></svg></slot>
		</Fab>
		<div v-bind="toVueProps(parts.actions)" class="omni-speed-dial__actions"><slot /></div>
	</div>
</template>
