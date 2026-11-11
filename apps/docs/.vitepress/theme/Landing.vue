<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue"
import { withBase } from "vitepress"

const tabs = [
	{
		id: "react",
		label: "React",
		file: "Todos.tsx",
		code: `import { useQuery } from "@omnifront/react"

function Todos() {
  const todos = useQuery({
    queryKey: ["todos"],
    queryFn: ({ signal }) => fetch("/api/todos", { signal }).then((r) => r.json()),
    staleTime: 5_000,
  })
  if (todos.status === "loading") return <p>Loading…</p>
  return <ul>{todos.data?.map((t) => <li key={t}>{t}</li>)}</ul>
}`,
	},
	{
		id: "vue",
		label: "Vue",
		file: "Todos.vue",
		code: `<script setup lang="ts">
import { useQuery } from "@omnifront/vue"

const { data, status } = useQuery({
  queryKey: ["todos"],
  queryFn: ({ signal }) => fetch("/api/todos", { signal }).then((r) => r.json()),
  staleTime: 5_000,
})
<\/script>

<template>
  <p v-if="status === 'loading'">Loading…</p>
  <ul><li v-for="t in data" :key="t">{{ t }}</li></ul>
</template>`,
	},
	{
		id: "angular",
		label: "Angular",
		file: "todos.component.ts",
		code: `import { injectQuery } from "@omnifront/angular"

@Component({
  template: \`
    @if (todos.status() === 'loading') { <p>Loading…</p> }
    <ul>@for (t of todos.data(); track t) { <li>{{ t }}</li> }</ul>
  \`,
})
export class TodosComponent {
  todos = injectQuery({
    queryKey: ["todos"],
    queryFn: ({ signal }) => fetch("/api/todos", { signal }).then((r) => r.json()),
    staleTime: 5_000,
  })
}`,
	},
]
const active = ref(0)

const onKey = (e: KeyboardEvent) => {
	if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
	const d = e.key === "ArrowRight" ? 1 : -1
	active.value = (active.value + d + tabs.length) % tabs.length
	;(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("[role=tab]")[active.value]?.focus()
}

const root = ref<HTMLElement | null>(null)
const ready = ref(false)
let io: IntersectionObserver | undefined
onMounted(() => {
	const els = root.value?.querySelectorAll<HTMLElement>(".rv") ?? []
	if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return
	ready.value = true
	io = new IntersectionObserver(
		(entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io?.unobserve(e.target) } }),
		{ rootMargin: "0px 0px -80px 0px" },
	)
	els.forEach((el) => io!.observe(el))
})
onBeforeUnmount(() => io?.disconnect())

// Decorative spotlight that follows the pointer on cards (mouse only).
const spot = (e: PointerEvent) => {
	if (e.pointerType !== "mouse") return
	const el = e.currentTarget as HTMLElement
	const r = el.getBoundingClientRect()
	el.style.setProperty("--mx", `${e.clientX - r.left}px`)
	el.style.setProperty("--my", `${e.clientY - r.top}px`)
}

const copied = ref(false)
const copy = async () => {
	try { await navigator.clipboard.writeText(tabs[active.value]!.code); copied.value = true; setTimeout(() => (copied.value = false), 1600) } catch {}
}

const stats = [
	{ v: "≈3 KB", l: "query core, gzip" },
	{ v: "≤1 KB", l: "per framework adapter" },
	{ v: "0.5 KB", l: "store" },
	{ v: "4", l: "frameworks, one engine" },
]

const features = [
	{ t: "Write the logic once", d: "A framework-free core with thin adapters. Teams on several frameworks, or migrating between them, share one data layer.", c: "violet", w: 2 },
	{ t: "Small on purpose", d: "Size budgets are enforced in CI. See the benchmarks for exactly what you trade away.", c: "green" },
	{ t: "One mental model", d: "Queries, stores and derived slices all speak the same tiny Subscribable contract.", c: "blue" },
	{ t: "SSR without mismatches", d: "dehydrate/hydrate, a clock-independent server snapshot, and a Next.js package for App and Pages Router.", c: "cyan" },
	{ t: "An HTTP client that fits", d: "Fetch-based, with interceptors, typed errors and cancellation. Plugs into every adapter.", c: "blue", w: 2 },
]

const packages = [
	["core", "Subscribable, batching, scheduler"],
	["query", "Cache, dedupe, retries, mutations"],
	["store", "State, selectors, derived values"],
	["api", "Typed fetch client and auth"],
	["react", "Hooks and Suspense"],
	["vue", "Composables and plugin"],
	["angular", "Signals and DI"],
	["next", "App and Pages Router SSR"],
	["query-infinite", "Infinite and paginated queries"],
	["persist", "localStorage / IndexedDB cache"],
	["devtools", "Inspect cache and queries"],
]
</script>

<template>
	<div ref="root" :class="['of', { ready }]">
		<section class="hero">
			<div class="glow" aria-hidden="true"></div>
			<div class="wrap hero-grid">
				<div>
					<p class="pill enter" style="--i:0"><span class="dot"></span>Pre-release · API may still change</p>
					<h1 class="enter" style="--i:1">One data layer.<br /><span class="grad">Every framework.</span></h1>
					<p class="lead enter" style="--i:2">Queries, caching and state that behave identically in React, Next.js, Vue and Angular, in about 3 KB.</p>
					<div class="cta enter" style="--i:3">
						<a class="btn primary" :href="withBase('/guide/introduction')">Get started</a>
						<a class="btn" :href="withBase('/api/query')">API reference</a>
						<a class="btn ghost" href="https://github.com/omnifront/omnifront">GitHub</a>
					</div>
					<ul class="fw enter" style="--i:4" aria-label="Supported frameworks">
						<li class="f-react">React 18+</li>
						<li class="f-next">Next 14+</li>
						<li class="f-vue">Vue 3.3+</li>
						<li class="f-ng">Angular 17+</li>
					</ul>
				</div>
				<div class="flow enter" style="--i:2">
					<img :src="withBase('/flow.svg')" alt="One query update leaves the omnifront core and reaches the React, Next.js, Vue and Angular adapters at the same time." width="720" height="auto" />
				</div>
			</div>
		</section>

		<section class="wrap stats" aria-label="Size budgets">
			<div v-for="(s, i) in stats" :key="s.l" class="stat rv" :style="{ '--i': i }">
				<strong>{{ s.v }}</strong><span>{{ s.l }}</span>
			</div>
		</section>

		<section class="wrap code-sec rv">
			<h2>Same query. Same options. Same result.</h2>
			<p class="sub">Only the last inch of the API changes to match your framework's reactivity.</p>
			<div class="window">
				<div class="bar">
					<div class="tabs" role="tablist" aria-label="Framework" @keydown="onKey">
						<button
							v-for="(t, i) in tabs" :key="t.id" role="tab" :id="`tab-${t.id}`"
							:aria-selected="active === i" :aria-controls="`panel-${t.id}`"
							:tabindex="active === i ? 0 : -1" :class="{ on: active === i }" @click="active = i"
						>{{ t.label }}</button>
					</div>
					<span class="file">{{ tabs[active]!.file }}</span>
					<button class="copy" type="button" :aria-label="`Copy ${tabs[active]!.label} code`" @click="copy">{{ copied ? "Copied" : "Copy" }}</button>
				</div>
				<div v-for="(t, i) in tabs" v-show="active === i" :key="t.id" class="panel" role="tabpanel" :id="`panel-${t.id}`" :aria-labelledby="`tab-${t.id}`" tabindex="0">
					<pre><code>{{ t.code }}</code></pre>
				</div>
			</div>
		</section>

		<section class="wrap rv">
			<h2>Why omnifront</h2>
			<div class="bento">
				<article v-for="(f, i) in features" :key="f.t" :class="['card', 'rv', f.c, { wide: f.w }]" :style="{ '--i': i }" @pointermove="spot">
					<h3>{{ f.t }}</h3>
					<p>{{ f.d }}</p>
				</article>
			</div>
		</section>

		<section class="wrap rv">
			<h2>Pick what you need</h2>
			<p class="sub">Every package is tree-shakeable and independently budgeted.</p>
			<ul class="pkgs">
				<li v-for="(p, i) in packages" :key="p[0]" :style="{ '--i': i }">
					<code>@omnifront/{{ p[0] }}</code><span>{{ p[1] }}</span>
				</li>
			</ul>
		</section>

		<section class="wrap final rv">
			<div class="final-card">
				<h2>Migrating, or running more than one framework?</h2>
				<p>Keep your data logic while you move. Start from your current setup.</p>
				<div class="cta center">
					<a class="btn primary" :href="withBase('/guide/migrating-from-tanstack')">From TanStack Query</a>
					<a class="btn" :href="withBase('/guide/migrating-from-axios')">From axios</a>
					<a class="btn ghost" :href="withBase('/benchmarks')">See benchmarks</a>
				</div>
			</div>
		</section>
	</div>
</template>

<style scoped>
.of {
	--bg: #f8fafc; --fg: #0f172a; --muted: #475569; --card: #ffffff; --line: #e2e8f0; --code: #0f172a;
	--shadow: 0 1px 2px rgb(15 23 42 / 0.06), 0 8px 24px rgb(15 23 42 / 0.06);
	background: var(--bg); color: var(--fg); font-family: var(--vp-font-family-base); overflow-x: clip;
}
:global(.dark) .of {
	--bg: #020617; --fg: #f8fafc; --muted: #94a3b8; --card: #0f172a; --line: #1e293b; --code: #0b1220;
	--shadow: 0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px rgb(0 0 0 / 0.3);
}
.wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
section { position: relative; }
section.wrap { padding-top: 96px; }
h1, h2, h3 { margin: 0; border: 0; letter-spacing: -0.02em; line-height: 1.1; }
h2 { font-size: clamp(1.75rem, 3.2vw, 2.5rem); font-weight: 700; padding: 0; }
.sub { color: var(--muted); font-size: 1.0625rem; margin: 12px 0 0; max-width: 60ch; }

/* Motion: ease-out curve, transform/opacity only */
.of { --ease: cubic-bezier(0.23, 1, 0.32, 1); }
@keyframes up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.enter { animation: up 600ms var(--ease) both; animation-delay: calc(var(--i, 0) * 70ms); }
.ready .rv { opacity: 0; transform: translateY(14px); transition: opacity 500ms var(--ease), transform 500ms var(--ease); }
.ready .rv.in { opacity: 1; transform: none; }
.ready .stat.rv, .ready .card.rv { transition-delay: calc(var(--i, 0) * 60ms); }
@keyframes drift { to { transform: translate3d(3%, 4%, 0) scale(1.06); } }

/* Hero */
.hero { padding: 72px 0 24px; }
.hero::before {
	content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
	background-image: radial-gradient(circle, var(--line) 1.2px, transparent 1.4px); background-size: 28px 28px;
	mask-image: radial-gradient(70% 80% at 50% 20%, #000, transparent 75%); -webkit-mask-image: radial-gradient(70% 80% at 50% 20%, #000, transparent 75%);
}
.glow {
	animation: drift 14s ease-in-out infinite alternate; will-change: transform;
	position: absolute; inset: -120px 0 auto; height: 560px; pointer-events: none; opacity: 0.55;
	background:
		radial-gradient(40% 50% at 15% 30%, rgb(124 58 237 / 0.35), transparent 70%),
		radial-gradient(35% 50% at 55% 10%, rgb(59 130 246 / 0.3), transparent 70%),
		radial-gradient(35% 50% at 90% 40%, rgb(6 182 212 / 0.3), transparent 70%);
}
:global(.dark) .glow { opacity: 0.8; }
.hero-grid { position: relative; display: grid; grid-template-columns: 1.05fr 1fr; gap: 48px; align-items: center; }
.pill {
	display: inline-flex; align-items: center; gap: 8px; margin: 0 0 20px; padding: 6px 12px; font-size: 0.8125rem;
	color: var(--muted); border: 1px solid var(--line); border-radius: 999px; background: var(--card);
}
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--of-green); }
h1 { font-size: clamp(2.5rem, 6vw, 4.25rem); font-weight: 800; padding: 0; }
.grad { background: linear-gradient(90deg, var(--of-violet), var(--of-blue) 50%, var(--of-cyan)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.lead { font-size: 1.1875rem; line-height: 1.6; color: var(--muted); margin: 20px 0 0; max-width: 46ch; }
.cta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
.cta.center { justify-content: center; }
.btn {
	display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 20px; border-radius: 10px;
	font-weight: 600; font-size: 0.9375rem; text-decoration: none; cursor: pointer; color: var(--fg);
	border: 1px solid var(--line); background: var(--card); transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.btn:active { transform: scale(0.97); transition-duration: 100ms; }
@media (hover: hover) and (pointer: fine) { .btn:hover { transform: translateY(-1px); border-color: var(--of-blue); box-shadow: var(--shadow); } }
.btn.primary { color: #fff; border-color: transparent; background: linear-gradient(135deg, #6d28d9, #2563eb); }
.btn.ghost { background: transparent; }
.btn:focus-visible, .tabs button:focus-visible, .window [tabindex]:focus-visible { outline: 3px solid var(--of-blue); outline-offset: 2px; }
.fw { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; margin: 28px 0 0; }
.fw li { margin: 0; padding: 4px 12px; font-size: 0.8125rem; font-weight: 600; border-radius: 8px; border: 1px solid var(--line); background: var(--card); border-left: 3px solid var(--c); }
.f-react { --c: var(--of-cyan); } .f-next { --c: var(--of-ink); } .f-vue { --c: var(--of-green); } .f-ng { --c: var(--of-violet); }
:global(.dark) .f-next { --c: #f8fafc; }
.flow img { width: 100%; height: auto; display: block; filter: drop-shadow(0 20px 40px rgb(59 130 246 / 0.2)); }

/* Stats */
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding-top: 56px !important; }
.stat { padding: 20px; border: 1px solid var(--line); border-radius: 14px; background: var(--card); }
.stat strong { display: block; font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.stat span { color: var(--muted); font-size: 0.875rem; }

/* Code */
.window { margin-top: 32px; border-radius: 14px; overflow: hidden; border: 1px solid var(--line); box-shadow: var(--shadow); background: var(--code); }
.bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 12px; border-bottom: 1px solid rgb(148 163 184 / 0.2); overflow-x: auto; }
.tabs { display: flex; }
.tabs button { min-height: 44px; padding: 0 16px; font: 600 0.875rem var(--vp-font-family-base); color: #94a3b8; background: none; border: 0; border-bottom: 2px solid transparent; cursor: pointer; transition: color 0.2s ease; }
.tabs button:hover { color: #f8fafc; }
.tabs button.on { color: #f8fafc; border-bottom-color: var(--of-blue); }
.copy { margin-left: auto; min-height: 44px; padding: 0 12px; font: 600 0.8125rem var(--vp-font-family-base); color: #94a3b8; background: none; border: 0; cursor: pointer; transition: color 150ms ease; }
.copy:hover { color: #f8fafc; }
.copy:focus-visible { outline: 3px solid var(--of-blue); outline-offset: -3px; }
.panel { animation: up 220ms var(--ease) both; }
.file { font: 0.8125rem var(--vp-font-family-mono); color: #94a3b8; white-space: nowrap; }
pre { margin: 0; padding: 20px 24px; overflow-x: auto; }
code { font: 0.875rem/1.7 var(--vp-font-family-mono); color: #e2e8f0; white-space: pre; background: none; }

/* Bento */
.bento { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 32px; }
.card { grid-column: span 2; padding: 28px; border-radius: 16px; background: var(--card); border: 1px solid var(--line); border-top: 3px solid var(--a); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.card.wide { grid-column: span 2; }
.card:last-child { grid-column: 1 / -1; }
.card { position: relative; overflow: hidden; }
.card::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 250ms ease;
	background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--a) 18%, transparent), transparent 70%); }
@media (hover: hover) and (pointer: fine) { .card:hover { transform: translateY(-2px); box-shadow: var(--shadow); } .card:hover::after { opacity: 1; } }
.ready .card.rv.in { transition: opacity 500ms var(--ease), transform 200ms var(--ease), box-shadow 200ms ease; }
.card h3 { font-size: 1.25rem; font-weight: 700; padding: 0; }
.card p { color: var(--muted); line-height: 1.65; margin: 10px 0 0; font-size: 0.9688rem; }
.violet { --a: var(--of-violet); } .blue { --a: var(--of-blue); } .cyan { --a: var(--of-cyan); } .green { --a: var(--of-green); }

/* Packages */
.pkgs { list-style: none; padding: 0; margin: 32px 0 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.pkgs li { margin: 0; display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); }
.pkgs code { font: 600 0.875rem var(--vp-font-family-mono); color: var(--fg); background: none; padding: 0; }
.pkgs span { color: var(--muted); font-size: 0.875rem; }

/* Final */
.final { padding-bottom: 96px; }
.final-card { text-align: center; padding: 56px 24px; border-radius: 20px; color: #f8fafc; background: radial-gradient(60% 120% at 20% 0%, #6d28d9, transparent 60%), radial-gradient(60% 120% at 90% 100%, #0891b2, transparent 60%), #0f172a; }
.final-card p { color: #cbd5e1; margin: 12px 0 0; }
.final-card .btn { color: #f8fafc; background: rgb(255 255 255 / 0.08); border-color: rgb(255 255 255 / 0.25); }
.final-card .btn.primary { background: #fff; color: #0f172a; }

@media (max-width: 860px) {
	.hero-grid { grid-template-columns: 1fr; gap: 32px; }
	.stats { grid-template-columns: repeat(2, 1fr); }
	.bento { grid-template-columns: 1fr; }
	.card, .card.wide, .card:last-child { grid-column: auto; }
	section.wrap { padding-top: 72px; }
}
@media (prefers-reduced-motion: reduce) {
	.enter, .panel, .glow { animation: none; }
	.btn, .card { transition: none; }
	.btn:hover, .card:hover { transform: none; }
}
</style>
