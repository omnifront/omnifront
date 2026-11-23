<script setup lang="ts">
import { displayPart } from "@omnifront/ui"
import { computed } from "vue"
import { toVueProps } from "../internal"

/**
 * The whole card as one press target: a real `<button>` (or `<a>` with `href`) around the card's content.
 * Do not put another button or link inside it (HTML forbids interactive content in a button); keep CardActions outside.
 */
defineOptions({ name: "OmniCardActionArea" })
const props = defineProps<{ href?: string | undefined; type?: "button" | "submit" | "reset" | undefined }>()
const tag = computed(() => (props.href === undefined ? "button" : "a"))
const bound = computed(() => ({
	...toVueProps(displayPart("omni-card__action-area", {}, tag.value === "button" ? { type: props.type ?? "button" } : {})),
	href: props.href,
}))
</script>

<template>
	<component :is="tag" v-bind="bound"><slot /></component>
</template>
