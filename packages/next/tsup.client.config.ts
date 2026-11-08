import { defineConfig } from "tsup"

// The "use client" directive at the top of src/client.ts is kept in the output, which makes Next
// treat everything exported from here as client code.
export default defineConfig({ entry: { client: "src/client.ts" }, format: ["esm", "cjs"], dts: true, clean: false })
