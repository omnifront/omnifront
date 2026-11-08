import { defineConfig } from "tsup"

// Server-safe entry: no hooks, no "use client".
export default defineConfig({ entry: { index: "src/index.ts" }, format: ["esm", "cjs"], dts: true, clean: true })
