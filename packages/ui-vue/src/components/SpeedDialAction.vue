<script setup lang="ts">
import { computed, inject, mergeProps, useAttrs } from "vue"
import { toVueProps } from "../internal"
import { SPEED_DIAL } from "./speed-dial-context"
import Fab from "./Fab.vue"

/** One action of a SpeedDial: a small button whose name is `tooltipTitle`. The default slot holds its icon. */
defineOptions({ name: "OmniSpeedDialAction", inheritAttrs: false })
const props = defineProps<{ /** The action's name: its accessible name and the caption beside it. */ tooltipTitle: string }>()
const emit = defineEmits<{ click: [event: MouseEvent] }>()
const attrs = useAttrs()
const dial = inject(SPEED_DIAL, null)
const bound = computed(() => mergeProps(dial ? toVueProps(dial.value.action) : {}, attrs))
</script>

<template>
	<div class="omni-speed-dial__action" role="none">
		<Fab v-bind="bound" size="small" :aria-label="props.tooltipTitle" @click="emit('click', $event)"><slot /></Fab>
		<span class="omni-speed-dial__label" aria-hidden="true">{{ props.tooltipTitle }}</span>
	</div>
</template>
