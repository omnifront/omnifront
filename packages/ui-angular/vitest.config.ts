import { mergeConfig } from "vitest/config"
import shared from "../../tooling/vitest/shared.config"

// Components are compiled just in time in tests (the Angular compiler is loaded in test/setup.ts);
// esbuild lowers the decorators, which is why tsconfig turns on `experimentalDecorators`.
export default mergeConfig(shared, { test: { environment: "jsdom", setupFiles: ["./test/setup.ts"] } })
