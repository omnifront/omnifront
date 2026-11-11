# HTTP client

`@omnifront/api` is a small `fetch`-based HTTP client, about 2.8 KB gzipped. It has no framework code and no dependency except `@omnifront/core`. It does what you usually reach for axios for, and it plugs into [queries](/guide/queries), [mutations](/guide/mutations) and the [store](/guide/store) without depending on them. Design: [ADR-0009](https://github.com/omnifront/omnifront/blob/main/docs/adr/0009-api-client.md).

```ts
import { createApi } from "@omnifront/api"

export const api = createApi({
	baseURL: "https://api.example.com",
	headers: { Accept: "application/json" },
	timeout: 10_000,
})

const { data } = await api.get<Todo[]>("/todos", { params: { done: false } })
await api.post<Todo>("/todos", { title: "Write docs" })   // JSON body and content-type are automatic
```

Every method returns `{ data, status, statusText, headers, config }`. Header names are always lower-case.

## Requests

| | |
|---|---|
| `baseURL`, `url` | A relative `url` is joined to `baseURL` with exactly one slash. An absolute `url` ignores `baseURL`. |
| `params` | Query string. Arrays repeat (`a=1&a=2`), nested objects use brackets (`a[b]=1`), `null` and `undefined` are skipped, dates become ISO strings. Pass `paramsSerializer` to change that. |
| `headers` | Merged: instance defaults, then the request. |
| `data` | Plain objects and arrays are JSON-encoded. Strings, `FormData`, `URLSearchParams`, `Blob`, buffers and streams go through untouched. |
| `responseType` | `"json"` (default), `"text"`, `"blob"`, `"arrayBuffer"` or `"stream"`. |
| `timeout` | Milliseconds, **per attempt**. |
| `signal` | An `AbortSignal`. |
| `validateStatus` | Which statuses resolve. Default 200 to 299. |
| `transformRequest`, `transformResponse` | One function or an array, run in order. |
| `onDownloadProgress` | `({ loaded, total }) => void`. `total` is `undefined` when the server sends no length. |
| `onUploadProgress` | See [upload progress](#upload-progress). |

`api.extend({ ... })` makes a child instance with merged defaults and a **copy** of the interceptors added so far. Changes to the parent afterwards do not reach the child, and the other way round.

## Errors

Every failure is an `ApiError`, and `isApiError(error)` narrows to it. `error.code` says what happened:

| `code` | Meaning |
|---|---|
| `"HTTP"` | The status was rejected by `validateStatus`. `error.status` and `error.data` (already parsed) are set. |
| `"TIMEOUT"` | `timeout` elapsed. |
| `"ABORT"` | The caller's signal aborted. |
| `"NETWORK"` | `fetch` itself failed (offline, DNS, refused). `error.cause` has the original error. |
| `"PARSE"` | A successful response was not valid JSON. |

```ts
try {
	await api.get("/todos")
} catch (error) {
	if (isApiError(error) && error.code === "HTTP" && error.status === 404) {
		/* error.data is the parsed body */
	}
}
```

A non-JSON body on a failing response (an HTML 502 page) stays as text in `error.data` instead of becoming a `PARSE` error that hides the real status.

## Interceptors

```ts
const off = api.interceptors.request.use((config) => ({ ...config, headers: { ...config.headers, "x-trace": id() } }))
api.interceptors.response.use(
	(response) => response,                       // success
	(error) => { log(error); throw error },       // failure: rethrow, or return a response to recover
)
off()                                              // remove it again
```

::: warning Not axios's order
Interceptors run **in the order you added them**, on both the request and the response side. axios runs request interceptors in reverse. This is deliberate: one rule is easier to remember.
:::

## Retry

Off by default, because [queries](/guide/queries) already retry with backoff and two layers multiply the number of requests. Turn it on when you use the client **without** a query:

```ts
createApi({ retry: { attempts: 3 } })
// attempts: retries after the first try. backoff(attempt) => ms (default 1s, 2s, 4s ... max 30s).
// retryOn(error) => boolean. Default: network errors, timeouts, 5xx and 429, on GET/HEAD/OPTIONS/PUT/DELETE only.
```

A caller's abort stops the wait between attempts.

## With queries and mutations

`queryOptions` and `mutationOptions` return objects you pass straight to `useQuery`, `injectQuery`, `useMutation` and the rest. The package does not import `@omnifront/query`; the shapes are compatible.

```ts
const todos = api.queryOptions<Todo[]>("/todos", { params: { done: false } })
// { queryKey: ["/todos", { done: false }], queryFn: ({ signal }) => ... }

useQuery({ ...todos, staleTime: 5_000 })

const create = api.mutationOptions<Todo, NewTodo>("POST", "/todos")
useMutation({
	...create,
	onSuccess: () => client.invalidateQueries({ queryKey: api.queryKey("/todos") }),
})
```

- The query key is `[path]` or `[path, params]`. `api.queryKey("/todos")` is the prefix of every `/todos` query, whatever its params.
- The query's `signal` goes to the request, so cancelling a query cancels the HTTP request.
- The path of a mutation can depend on the variables: `api.mutationOptions("PUT", (todo: Todo) => "/todos/" + todo.id)`. The variables are the request body.

## With the store: authentication

`@omnifront/api/auth` reads headers from any `Subscribable` (a store, say) **when each request is sent**, so a token that changes later is used.

```ts
import { createStore } from "@omnifront/store"
import { refreshOnUnauthorized, withAuth } from "@omnifront/api/auth"

export const session = createStore<{ token: string | null }>({ token: null })

withAuth(api, session, (s) => (s.token ? { Authorization: `Bearer ${s.token}` } : {}))

refreshOnUnauthorized(api, {
	refresh: async () => session.setState({ token: await fetchNewToken() }),
})
```

`refreshOnUnauthorized` handles a `401` by refreshing **once**, even when many requests fail together, then repeats each request one time. If the refresh fails, the original error is thrown. It never loops. Pass `shouldRefresh` to react to another error.

## Upload progress

`fetch` cannot report upload progress. For that, use the XHR adapter (browser only; `responseType: "stream"` is not supported):

```ts
import { xhrAdapter } from "@omnifront/api/xhr"

await api.post("/files", form, {
	adapter: xhrAdapter,
	onUploadProgress: ({ loaded, total }) => setPercent(total ? loaded / total : 0),
})
```

An adapter is just `(request) => Promise<{ status, statusText, headers, data }>`, so you can write your own. For `responseType: "json"` it returns the body as text and the client parses it.

## SSR and testing

There is no global state: every `createApi` is independent, so create one per request on the server (see [SSR](/guide/ssr)). Pass `fetch` to use a custom one, for example to forward cookies.

For tests, `@omnifront/api/testing` gives an adapter with no network:

```ts
import { createMockAdapter } from "@omnifront/api/testing"

const adapter = createMockAdapter({
	"GET /todos": { data: [{ id: 1 }] },
	"POST /todos": (request) => ({ status: 201, data: { echoed: request.body } }),
	"GET /offline": { error: new TypeError("offline") },
})
const api = createApi({ adapter })
// adapter.calls: every request received. Unmatched routes reply 404.
```

Coming from axios? See [Migrating from axios](/guide/migrating-from-axios) for a side-by-side list.

## Not supported

Things axios has that this client leaves out on purpose: automatic cookie jars and proxies in Node, `maxRedirects` and other options of Node's `http`, request cancellation by a `CancelToken` (use `AbortSignal`), and `XSRF` helpers (add a header in an interceptor).
