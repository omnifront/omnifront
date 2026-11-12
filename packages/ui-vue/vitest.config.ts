import vue from "@vitejs/plugin-vue"
import { mergeConfig } from "vitest/config"
import shared from "../../tooling/vitest/shared.config"

export default mergeConfig(shared, {
	plugins: [vue()],
	test: { environment: "jsdom", setupFiles: ["./test/setup.ts"], coverage: { include: ["src/**"], exclude: ["src/index.ts", "src/shims.d.ts", "src/**/*-context.ts"] } },
})
