<script setup lang="ts">
import { ICON_PATHS, avatarPart } from "@omnifront/ui"
import { computed, ref, watch } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/** A person or thing as a picture, initials or an icon. If the picture fails to load it falls back to the content, then to a generic person. */
defineOptions({ name: "OmniAvatar" })
const raw = defineProps<{
	variant?: "circular" | "rounded" | "square" | undefined
	src?: string | undefined
	srcSet?: string | undefined
	/** Describes the picture. Without a `src`, the slot (initials, an icon) is the content. */
	alt?: string | undefined
}>()
const props = useDefaultProps("OmniAvatar", () => ({ ...raw }))
const failed = ref(false)
watch(() => [props.value.src, props.value.srcSet], () => (failed.value = false))
const showImage = computed(() => Boolean(props.value.src || props.value.srcSet) && !failed.value)
const bound = computed(() => toVueProps(avatarPart({ variant: props.value.variant })))
</script>

<template>
	<div v-bind="bound">
		<img v-if="showImage" class="omni-avatar__img" :src="props.src" :srcset="props.srcSet" :alt="props.alt ?? ''" @error="failed = true" />
		<slot v-else>
			<svg class="omni-avatar__fallback" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path :d="ICON_PATHS.person" /></svg>
		</slot>
	</div>
</template>
