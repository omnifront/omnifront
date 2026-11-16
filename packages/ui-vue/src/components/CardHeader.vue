<script setup lang="ts">
import { displayPart } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"

/** Avatar, title, subheader and an action. Use the props for text, the `avatar` and `action` slots for elements. */
defineOptions({ name: "OmniCardHeader" })
const props = defineProps<{ title?: string | undefined; subheader?: string | undefined }>()
const bound = computed(() => toVueProps(displayPart("omni-card__header")))
</script>

<template>
	<div v-bind="bound">
		<div v-if="$slots['avatar']" class="omni-card__header-avatar"><slot name="avatar" /></div>
		<div class="omni-card__header-content">
			<span v-if="props.title !== undefined || $slots['title']" class="omni-card__title"><slot name="title">{{ props.title }}</slot></span>
			<span v-if="props.subheader !== undefined || $slots['subheader']" class="omni-card__subheader"><slot name="subheader">{{ props.subheader }}</slot></span>
		</div>
		<div v-if="$slots['action']" class="omni-card__header-action"><slot name="action" /></div>
	</div>
</template>
