<script setup lang="ts">
defineOptions({ name: "OmniListItemText" })
const props = defineProps<{ primary?: string | undefined; secondary?: string | undefined }>()
</script>

<template>
	<div class="omni-list__text">
		<span v-if="props.primary !== undefined || $slots['default'] || $slots['primary']" class="omni-list__primary"><slot name="primary"><slot>{{ props.primary }}</slot></slot></span>
		<span v-if="props.secondary !== undefined || $slots['secondary']" class="omni-list__secondary"><slot name="secondary">{{ props.secondary }}</slot></span>
	</div>
</template>
