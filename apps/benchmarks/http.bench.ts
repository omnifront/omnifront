// Micro-benchmarks of the HTTP clients' own overhead: no network, every client gets the same fake
// `fetch` that answers with a small JSON body. Run:  pnpm --filter @omnifront/benchmarks bench
import { createApi } from "@omnifront/api"
import axios from "axios"
import ky from "ky"
import { bench, describe } from "vitest"

const fakeFetch = (async () =>
	new Response('{"id":1,"title":"x"}', { headers: { "content-type": "application/json" } })) as unknown as typeof fetch

const omnifront = createApi({ baseURL: "http://x.test", fetch: fakeFetch })
const kyClient = ky.create({ prefix: "http://x.test", fetch: fakeFetch, retry: 0 })
// axios's own fetch adapter, pointed at the same fake fetch.
const axiosClient = axios.create({ baseURL: "http://x.test", adapter: "fetch", env: { fetch: fakeFetch, Request, Response: Response as never } })

const N = 1000

describe("1,000 sequential GETs with query params, parsed JSON", () => {
	bench("@omnifront/api", async () => {
		for (let i = 0; i < N; i++) await omnifront.get("/todos", { params: { page: i, done: false } })
	})
	bench("axios (fetch adapter)", async () => {
		for (let i = 0; i < N; i++) await axiosClient.get("/todos", { params: { page: i, done: false } })
	})
	bench("ky", async () => {
		for (let i = 0; i < N; i++) await kyClient.get("todos", { searchParams: { page: i, done: false } }).json()
	})
})

describe("1,000 concurrent GETs", () => {
	bench("@omnifront/api", async () => {
		await Promise.all(Array.from({ length: N }, () => omnifront.get("/todos")))
	})
	bench("axios (fetch adapter)", async () => {
		await Promise.all(Array.from({ length: N }, () => axiosClient.get("/todos")))
	})
	bench("ky", async () => {
		await Promise.all(Array.from({ length: N }, () => kyClient.get("todos").json()))
	})
})

describe("1,000 POSTs with a JSON body and 3 request + 3 response interceptors", () => {
	const withInterceptors = createApi({ baseURL: "http://x.test", fetch: fakeFetch })
	const axiosWith = axios.create({ baseURL: "http://x.test", adapter: "fetch", env: { fetch: fakeFetch, Request, Response: Response as never } })
	for (let i = 0; i < 3; i++) {
		withInterceptors.interceptors.request.use((c) => ({ ...c, headers: { ...c.headers, [`x-${i}`]: "1" } }))
		withInterceptors.interceptors.response.use((r) => r)
		axiosWith.interceptors.request.use((c) => (c.headers.set(`x-${i}`, "1"), c))
		axiosWith.interceptors.response.use((r) => r)
	}
	bench("@omnifront/api", async () => {
		for (let i = 0; i < N; i++) await withInterceptors.post("/todos", { title: "x" })
	})
	bench("axios (fetch adapter)", async () => {
		for (let i = 0; i < N; i++) await axiosWith.post("/todos", { title: "x" })
	})
})
