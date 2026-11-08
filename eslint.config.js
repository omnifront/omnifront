import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{ ignores: ["**/dist/**", "**/.angular/**", "**/node_modules/**", "graphify-out/**", "**/*.cjs"] },
	js.configs.recommended,
	...tseslint.configs.recommended,
);
