<script setup lang="ts">
import { createTabs } from "@omnifront/ui"
import { computed, provide } from "vue"
import { useMachine, useUid } from "../internal"
import { useDefaultProps } from "../theme"
import { TABS } from "./tabs-context"

defineOptions({ name: "OmniTabContext" })

const raw = defineProps<{
	/** Selected tab (`v-model`). Leave it out for an uncontrolled set. */
	modelValue?: string | undefined
	defaultValue?: string | undefined
	orientation?: "horizontal" | "vertical" | undefined
	/** Arrow keys select as well as focus. Default false (Enter or Space selects). */
	selectionFollowsFocus?: boolean | undefined
}>()
const emit = defineEmits<{ "update:modelValue": [value: string]; change: [event: Event | undefined, value: string] }>()

const props = useDefaultProps("OmniTabs", () => ({ ...raw }))
const id = useUid()
const { machine, state } = useMachine(
	() => createTabs({ id, defaultValue: raw.defaultValue }),
	() => ({
		id,
		value: props.value.modelValue,
		orientation: props.value.orientation,
		selectionFollowsFocus: props.value.selectionFollowsFocus,
		onValueChange: (value: string, event?: Event) => {
			emit("change", event, value)
			emit("update:modelValue", value)
		},
	}),
)
provide(TABS, {
	tabs: machine,
	selected: computed(() => state.value.value),
	orientation: computed(() => state.value.orientation),
	version: state,
})
</script>

<template>
	<slot />
</template>
