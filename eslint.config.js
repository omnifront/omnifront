import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{ ignores: ["**/dist/**", "**/.angular/**", "**/.next/**", "**/next-env.d.ts", "**/node_modules/**", "graphify-out/**", "**/*.cjs"] },
	js.configs.recommended,
	...tseslint.configs.recommended,
);
