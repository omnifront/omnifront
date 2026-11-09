import { defineConfig } from "vitepress"

// Set DOCS_BASE (for example "/omnifront/") when hosting under a sub-path such as GitHub Pages.
export default defineConfig({
	title: "omnifront",
	description: "One data layer (queries and state) for React, Next.js, Vue and Angular.",
	base: process.env.DOCS_BASE ?? "/",
	cleanUrls: true,
	themeConfig: {
		nav: [
			{ text: "Guide", link: "/guide/introduction" },
			{ text: "API", link: "/api/query" },
			{ text: "Benchmarks", link: "/benchmarks" },
			{ text: "GitHub", link: "https://github.com/omnifront/omnifront" },
		],
		sidebar: {
			"/guide/": [
				{
					text: "Start here",
					items: [
						{ text: "Introduction", link: "/guide/introduction" },
						{ text: "React", link: "/guide/react" },
						{ text: "Next.js", link: "/guide/next" },
						{ text: "Vue", link: "/guide/vue" },
						{ text: "Angular", link: "/guide/angular" },
					],
				},
				{
					text: "Using it",
					items: [
						{ text: "Queries", link: "/guide/queries" },
						{ text: "Infinite queries", link: "/guide/infinite-queries" },
						{ text: "Mutations", link: "/guide/mutations" },
						{ text: "Store", link: "/guide/store" },
						{ text: "HTTP client", link: "/guide/http-client" },
						{ text: "Server-side rendering", link: "/guide/ssr" },
						{ text: "Suspense (React)", link: "/guide/suspense" },
						{ text: "Persistence", link: "/guide/persistence" },
						{ text: "Devtools", link: "/guide/devtools" },
						{ text: "Testing", link: "/guide/testing" },
					],
				},
				{
					text: "More",
					items: [
						{ text: "Migrating from TanStack Query", link: "/guide/migrating-from-tanstack" },
						{ text: "Migrating from axios", link: "/guide/migrating-from-axios" },
						{ text: "Compatibility", link: "/guide/compatibility" },
						{ text: "Writing an adapter", link: "/guide/writing-an-adapter" },
					],
				},
			],
			"/api/": [
				{
					text: "Packages",
					items: [
						{ text: "@omnifront/core", link: "/api/core" },
						{ text: "@omnifront/query", link: "/api/query" },
						{ text: "@omnifront/store", link: "/api/store" },
						{ text: "@omnifront/api", link: "/api/api" },
						{ text: "@omnifront/react", link: "/api/react" },
						{ text: "@omnifront/vue", link: "/api/vue" },
						{ text: "@omnifront/angular", link: "/api/angular" },
						{ text: "@omnifront/next", link: "/api/next" },
						{ text: "@omnifront/query-infinite", link: "/api/query-infinite" },
						{ text: "@omnifront/persist", link: "/api/persist" },
						{ text: "@omnifront/devtools", link: "/api/devtools" },
					],
				},
			],
		},
		socialLinks: [{ icon: "github", link: "https://github.com/omnifront/omnifront" }],
		search: { provider: "local" },
	},
})
