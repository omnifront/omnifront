<script setup lang="ts">
defineOptions({ name: "OmniCardActions" })
defineProps<{ /** Drop the 8px between actions. */ disableSpacing?: boolean }>()
</script>

<template>
	<div class="omni-card__actions" :data-disable-spacing="disableSpacing ? '' : undefined"><slot /></div>
</template>
