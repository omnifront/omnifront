<script setup lang="ts">
import { ICON_PATHS, alertPart } from "@omnifront/ui"
import { computed, getCurrentInstance, onBeforeMount, onBeforeUpdate, ref } from "vue"
import { hasListener, toVueProps } from "../internal"
import { useDefaultProps } from "../theme"
import IconButton from "./IconButton.vue"

/**
 * A short message with a status icon. `error` and `warning` are announced at once (`role="alert"`);
 * `info` and `success` politely (`role="status"`). A `close` listener shows a close button; the
 * `icon` slot replaces the severity's icon, `icon="false"` removes it; the `action` slot sits at the far end.
 */
defineOptions({ name: "OmniAlert" })
// `icon` is `false` or absent: Vue would cast an absent Boolean to false, so say undefined.
const raw = withDefaults(
	defineProps<{
		severity?: "error" | "warning" | "info" | "success" | undefined
		variant?: "standard" | "filled" | "outlined" | undefined
		/** `false` removes the icon. A custom one goes in the `icon` slot. */
		icon?: false | undefined
		/** The close button's accessible name. Default "Close". */
		closeText?: string | undefined
	}>(),
	{ icon: undefined },
)
const emit = defineEmits<{ close: [event: MouseEvent] }>()
const props = useDefaultProps("OmniAlert", () => ({ ...raw }))
const instance = getCurrentInstance()
const hasClose = ref(false)
const read = (): void => void (hasClose.value = hasListener(instance?.vnode.props, "close"))
read()
onBeforeMount(read)
onBeforeUpdate(read)
const severity = computed(() => props.value.severity ?? "success")
const bound = computed(() => toVueProps(alertPart({ severity: severity.value, variant: props.value.variant })))
</script>

<template>
	<div v-bind="bound">
		<div v-if="props.icon !== false" class="omni-alert__icon">
			<slot name="icon"><svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path :d="ICON_PATHS[severity]" /></svg></slot>
		</div>
		<div class="omni-alert__message"><slot /></div>
		<div v-if="$slots['action'] || hasClose" class="omni-alert__action">
			<slot name="action">
				<IconButton size="small" color="inherit" :aria-label="props.closeText ?? 'Close'" @click="emit('close', $event)">
					<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path :d="ICON_PATHS.close" /></svg>
				</IconButton>
			</slot>
		</div>
	</div>
</template>
