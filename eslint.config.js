import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{ ignores: ["**/dist/**", "**/.angular/**", "**/.vitepress/**", "**/.next/**", "**/next-env.d.ts", "**/node_modules/**", "graphify-out/**", "**/*.cjs"] },
	js.configs.recommended,
	// Node scripts (not library code): allow Node globals such as process and console.
	{ files: ["**/*.mjs"], languageOptions: { globals: { process: "readonly", console: "readonly", Buffer: "readonly" } } },
	...tseslint.configs.recommended,
);
