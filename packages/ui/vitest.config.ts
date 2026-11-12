import { mergeConfig } from "vitest/config"
import shared from "../../tooling/vitest/shared.config"

export default mergeConfig(shared, { test: { environment: "jsdom" } })
