<script setup lang="ts">
/** A picture (an Avatar) at the start of a row, with the same gap as ListItemIcon. */
defineOptions({ name: "OmniListItemAvatar" })
</script>

<template>
	<div class="omni-list__avatar"><slot /></div>
</template>
