<script lang="ts">
import { cloneVNode, computed, defineComponent, h, type PropType } from "vue"
import { stepperPart } from "@omnifront/ui"
import { slotItems, toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

/**
 * A list of steps toward a goal. Put Step components in the default slot; their order gives each its
 * number. (Vue lifecycle: the stepper hands every step its position as props when it renders, so
 * steps can come and go with `v-for` and `v-if`.)
 */
export default defineComponent({
	name: "OmniStepper",
	props: {
		/** The current step, 0-based. Steps before it are completed. */
		activeStep: { type: Number, default: 0 },
		orientation: String as PropType<"horizontal" | "vertical" | undefined>,
		alternativeLabel: { type: Boolean, default: undefined },
		nonLinear: { type: Boolean, default: undefined },
	},
	setup(raw, { slots }) {
		const props = useDefaultProps("OmniStepper", () => ({ ...raw }))
		const attrs = computed(() => toVueProps(stepperPart({ orientation: props.value.orientation, alternativeLabel: props.value.alternativeLabel, nonLinear: props.value.nonLinear })))
		return () => {
			const steps = slotItems(slots["default"]?.())
			const p = props.value
			return h(
				"ol",
				attrs.value,
				steps.map((step, index) => cloneVNode(step, { index, activeStep: p.activeStep, count: steps.length, orientation: p.orientation ?? "horizontal" })),
			)
		}
	},
})
</script>
