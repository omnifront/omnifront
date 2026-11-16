<script setup lang="ts">
defineOptions({ name: "OmniListSubheader" })
defineProps<{ /** Do not stick to the top while the list scrolls. */ disableSticky?: boolean }>()
</script>

<template>
	<li class="omni-list__subheader" :data-sticky="disableSticky ? undefined : ''"><slot /></li>
</template>
