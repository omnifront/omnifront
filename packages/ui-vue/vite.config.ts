import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"

// Library build: one ESM and one CJS file; vue and omnifront packages stay external.
export default defineConfig({
	plugins: [vue()],
	build: {
		lib: { entry: "src/index.ts", formats: ["es", "cjs"], fileName: (format) => (format === "es" ? "index.js" : "index.cjs") },
		rollupOptions: { external: ["vue", /^@omnifront\//] },
		minify: false,
		sourcemap: true,
	},
})
