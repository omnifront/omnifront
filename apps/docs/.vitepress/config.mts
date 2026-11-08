import { defineConfig } from "vitepress"

// Set DOCS_BASE (for example "/unicore/") when hosting under a sub-path such as GitHub Pages.
export default defineConfig({
	title: "unicore",
	description: "One data layer (queries and state) for React, Next.js, Vue and Angular.",
	base: process.env.DOCS_BASE ?? "/",
	cleanUrls: true,
	themeConfig: {
		nav: [
			{ text: "Guide", link: "/guide/introduction" },
			{ text: "API", link: "/api/query" },
			{ text: "Benchmarks", link: "/benchmarks" },
			{ text: "GitHub", link: "https://github.com/AMHB-DEV/unicore" },
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
						{ text: "Writing an adapter", link: "/guide/writing-an-adapter" },
					],
				},
			],
			"/api/": [
				{
					text: "Packages",
					items: [
						{ text: "@unicore/core", link: "/api/core" },
						{ text: "@unicore/query", link: "/api/query" },
						{ text: "@unicore/store", link: "/api/store" },
						{ text: "@unicore/react", link: "/api/react" },
						{ text: "@unicore/vue", link: "/api/vue" },
						{ text: "@unicore/angular", link: "/api/angular" },
						{ text: "@unicore/next", link: "/api/next" },
						{ text: "@unicore/query-infinite", link: "/api/query-infinite" },
						{ text: "@unicore/persist", link: "/api/persist" },
						{ text: "@unicore/devtools", link: "/api/devtools" },
					],
				},
			],
		},
		socialLinks: [{ icon: "github", link: "https://github.com/AMHB-DEV/unicore" }],
		search: { provider: "local" },
	},
})
