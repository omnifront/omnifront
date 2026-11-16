import { defineConfig, devices } from "@playwright/test"

// Three static builds of the same page, one per framework. `pnpm build:examples` makes them.
const servers = [
	{ name: "react", dir: "../../examples/ui-react/dist", port: 5181 },
	{ name: "vue", dir: "../../examples/ui-vue/dist", port: 5182 },
	{ name: "angular", dir: "../../examples/ui-angular/dist/browser", port: 5183 },
]

export default defineConfig({
	testDir: "./tests",
	// Same browser, same fonts, no motion: any pixel difference between frameworks is real.
	use: { viewport: { width: 1000, height: 1500 }, reducedMotion: "reduce", colorScheme: "light" },
	// The three engines: a native control is styled through engine-specific pseudo-elements (the slider's thumb and track),
	// so Chromium passing says nothing about Firefox or Safari. Within each engine, React, Vue and Angular must still match.
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1000, height: 1500 } } },
		{ name: "firefox", use: { ...devices["Desktop Firefox"], viewport: { width: 1000, height: 1500 } } },
		{ name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1000, height: 1500 } } },
	],
	reporter: [["list"]],
	webServer: servers.map((s) => ({
		command: `pnpm exec vite preview --outDir ${s.dir} --port ${s.port} --strictPort`,
		url: `http://localhost:${s.port}`,
		reuseExistingServer: true,
		stdout: "ignore" as const,
	})),
})
