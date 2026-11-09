const FRAMEWORK = "^(react|react-dom|vue|@angular/.+|next)(/|$)";

const pkgRule = (name, pkg, allowed) => ({
	name,
	severity: "error",
	from: { path: `^packages/${pkg}/src` },
	to: { path: `^packages/(?!(${[pkg, ...allowed].join("|")})/)` },
});

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
	forbidden: [
		pkgRule("core-imports-nothing", "core", []),
		pkgRule("query-imports-core-only", "query", ["core"]),
		pkgRule("store-imports-core-only", "store", ["core"]),
		pkgRule("api-imports-core-only", "api", ["core"]),
		pkgRule("persist-imports-query-core-only", "persist", ["query", "core"]),
		pkgRule("devtools-imports-query-core-only", "devtools", ["query", "core"]),
		pkgRule("query-infinite-imports-query-core-only", "query-infinite", ["query", "core"]),
		pkgRule("react-no-other-adapters", "react", ["core", "query", "store", "query-infinite"]),
		pkgRule("vue-no-other-adapters", "vue", ["core", "query", "store", "query-infinite"]),
		pkgRule("angular-no-other-adapters", "angular", ["core", "query", "store", "query-infinite"]),
		pkgRule("next-imports-react-only", "next", ["react", "core", "query", "store"]),
		{
			name: "no-framework-outside-adapters",
			comment: "Only adapter packages may import react, vue or @angular/*",
			severity: "error",
			from: { path: "^packages/(core|query|store|api|persist|devtools|query-infinite|conformance)/src" },
			to: { path: FRAMEWORK },
		},
		{
			name: "adapter-own-framework-only",
			severity: "error",
			from: { path: "^packages/react/src" },
			to: { path: "^(vue|@angular/.+|next)(/|$)" },
		},
		{
			name: "vue-own-framework-only",
			severity: "error",
			from: { path: "^packages/vue/src" },
			to: { path: "^(react|react-dom|@angular/.+|next)(/|$)" },
		},
		{
			name: "angular-own-framework-only",
			severity: "error",
			from: { path: "^packages/angular/src" },
			to: { path: "^(react|react-dom|vue|next)(/|$)" },
		},
	],
	options: {
		doNotFollow: { path: "node_modules" },
		tsPreCompilationDeps: true,
		tsConfig: { fileName: "tsconfig.json" },
	},
};
