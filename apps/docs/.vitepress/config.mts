import { defineConfig, type HeadConfig } from "vitepress"

// Set DOCS_BASE (for example "/omnifront/") when hosting under a sub-path such as GitHub Pages.
// Set DOCS_URL (for example "https://docs.example.dev", no trailing slash) once the site has an
// address: link previews need an absolute URL for the image, so og:image is only emitted then.
const base = process.env.DOCS_BASE ?? "/"
const site = process.env.DOCS_URL?.replace(/\/$/, "")
const title = "omnifront"
const description = "One data layer (queries and state) for React, Next.js, Vue and Angular."

const head: HeadConfig[] = [
	["link", { rel: "icon", type: "image/svg+xml", href: `${base}favicon.svg` }],
	["meta", { property: "og:type", content: "website" }],
	["meta", { property: "og:title", content: title }],
	["meta", { property: "og:description", content: description }],
	["meta", { name: "twitter:card", content: site ? "summary_large_image" : "summary" }],
]
if (site) head.push(["meta", { property: "og:image", content: `${site}${base}social.png` }])

export default defineConfig({
	title,
	description,
	base,
	cleanUrls: true,
	head,
	themeConfig: {
		logo: { light: "/logo-mark.svg", dark: "/logo-mark-dark.svg", alt: "omnifront" },
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
