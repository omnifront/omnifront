<script setup lang="ts">
import type { ButtonColor, ButtonSize, ButtonVariant } from "@omnifront/ui"
import { computed, mergeProps, provide, useAttrs } from "vue"
import { useDefaultProps } from "../theme"
import { BUTTON_GROUP } from "./button-group-context"

/** Buttons joined into one control. `variant`, `color`, `size` and `disabled` apply to every Button inside. */
defineOptions({ name: "OmniButtonGroup", inheritAttrs: false })

// `disabled` and `disableElevation` stay undefined (not false) when absent, so they only apply when set.
const raw = withDefaults(
	defineProps<{
		variant?: ButtonVariant | undefined
		color?: ButtonColor | undefined
		size?: ButtonSize | undefined
		disabled?: boolean | undefined
		disableElevation?: boolean | undefined
		orientation?: "horizontal" | "vertical" | undefined
		fullWidth?: boolean | undefined
	}>(),
	{ disabled: undefined, disableElevation: undefined },
)
const attrs = useAttrs()
const props = useDefaultProps("OmniButtonGroup", () => ({ ...raw }))
provide(
	BUTTON_GROUP,
	computed(() => ({
		variant: props.value.variant,
		color: props.value.color,
		size: props.value.size,
		disabled: props.value.disabled,
		disableElevation: props.value.disableElevation,
	})),
)
</script>

<template>
	<div
		v-bind="mergeProps({ role: 'group', class: 'omni-button-group' }, attrs)"
		:data-orientation="props.orientation ?? 'horizontal'"
		:data-full-width="props.fullWidth ? '' : undefined"
	>
		<slot />
	</div>
</template>
