<script lang="ts">
import { avatarGroupState, displayPart } from "@omnifront/ui"
import { computed, defineComponent, h, useAttrs, type PropType } from "vue"
import { slotItems, toVueProps } from "../internal"
import { useDefaultProps } from "../theme"
import Avatar from "./Avatar.vue"

/** Avatars side by side, overlapping. More than `max` fold into one "+N" avatar. Put Avatar components in the default slot. */
export default defineComponent({
	name: "OmniAvatarGroup",
	inheritAttrs: false,
	props: {
		/** Most avatars drawn, the last slot being "+N". Default 5. */
		max: Number as PropType<number | undefined>,
		/** How many avatars exist in all, when more than the children. */
		total: Number as PropType<number | undefined>,
		/** Overlap: `medium` (default, 8px), `small` (16px) or `large` (none). */
		spacing: String as PropType<"small" | "medium" | "large" | undefined>,
		variant: String as PropType<"circular" | "rounded" | "square" | undefined>,
	},
	setup(raw, { slots }) {
		const attrs = useAttrs()
		const props = useDefaultProps("OmniAvatarGroup", () => ({ ...raw }))
		const part = computed(() => toVueProps(displayPart("omni-avatar-group", { spacing: props.value.spacing && props.value.spacing !== "medium" ? props.value.spacing : undefined })))
		return () => {
			const items = slotItems(slots["default"]?.())
			const { shown, surplus } = avatarGroupState(items.length, props.value.max, props.value.total)
			return h("div", { ...part.value, ...attrs, role: "group" }, [
				...items.slice(0, shown),
				surplus > 0 ? h(Avatar, { variant: props.value.variant }, { default: () => `+${surplus}` }) : null,
			])
		}
	},
})
</script>
