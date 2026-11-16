<script setup lang="ts">
import { computed } from "vue"

defineOptions({ name: "OmniCardMedia" })
const props = defineProps<{
	/** The picture's URL. Give it `alt` (empty when it is only decoration). */
	image: string
	alt?: string | undefined
	height?: number | string | undefined
}>()
const style = computed(() => (props.height === undefined ? undefined : { blockSize: typeof props.height === "number" ? `${props.height}px` : props.height }))
</script>

<template>
	<img class="omni-card__media" :src="props.image" :alt="props.alt ?? ''" :style="style" />
</template>
