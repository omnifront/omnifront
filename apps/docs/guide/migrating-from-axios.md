# Migrating from axios

`@omnifront/api` covers what most apps use axios for. This page lines the two up and lists what is different or missing, so you can check before you switch.

```ts
// axios
import axios from "axios"
const api = axios.create({ baseURL: "https://api.example.com", timeout: 10_000 })
const { data } = await api.get<Todo[]>("/todos", { params: { done: false } })

// omnifront
import { createApi } from "@omnifront/api"
const api = createApi({ baseURL: "https://api.example.com", timeout: 10_000 })
const { data } = await api.get<Todo[]>("/todos", { params: { done: false } })
```

## Same

| axios | `@omnifront/api` |
|---|---|
| `axios.create(config)` | `createApi(config)` |
| `api.get/delete/head/options(url, config)` | the same |
| `api.post/put/patch(url, data, config)` | the same |
| `api.request(config)` | the same |
| `response.data / status / statusText / headers / config` | the same (header names are lower-case) |
| `baseURL`, `headers`, `params`, `timeout`, `responseType`, `validateStatus`, `transformRequest`, `transformResponse` | the same names and meaning |
| `signal` (an `AbortSignal`) | the same |
| `onDownloadProgress` | the same, `({ loaded, total })` |
| `paramsSerializer` | a function `(params) => string` (axios also accepts an options object) |
| `interceptors.request.use` / `response.use` | the same, and `use` returns the function that removes it |
| `instance.defaults` | `api.defaults` |

## Different

| axios | `@omnifront/api` |
|---|---|
| Request interceptors run **last-added first** | Interceptors run **in the order added**, on both sides |
| Errors are `AxiosError` (`error.response`, `error.code` like `"ECONNABORTED"`) | `ApiError` with `error.code` of `"HTTP"`, `"TIMEOUT"`, `"ABORT"`, `"NETWORK"` or `"PARSE"`; `error.status`, `error.data`, `error.response`; `isApiError(e)` instead of `axios.isAxiosError(e)` |
| `axios.isCancel(error)` | `isApiError(error) && error.code === "ABORT"` |
| `onUploadProgress` works in the browser | needs the XHR adapter: `adapter: xhrAdapter` from `@omnifront/api/xhr` (`fetch` cannot report upload progress) |
| `data` of a non-JSON body is the string | the same; a **bad JSON success body** is a `PARSE` error, a non-JSON **error** body stays as text |
| `timeout` per request | per **attempt** (matters when `retry` is on) |
| Retries via `axios-retry` | `retry: { attempts }` built in, **off** by default (queries already retry) |
| `axios.defaults.headers.common` | `createApi({ headers })` or `api.extend({ headers })`; there are no per-method default headers |
| Global `axios` instance | no global instance: create one and export it |

## Not supported

- `CancelToken` (deprecated in axios too): use `AbortSignal`.
- `maxRedirects`, `proxy`, `httpAgent`, `decompress`, cookie jar and other options of Node's `http`: the client is `fetch`-based, so it runs wherever a global `fetch` exists (browsers, current Node, edge runtimes) and leaves these to `fetch`. Pass your own `fetch` (`createApi({ fetch })`) for an `undici` agent, for example.
- `withCredentials`, `xsrfCookieName`, `xsrfHeaderName`: use `fetch`'s credentials through a custom `fetch`, and add the XSRF header in a request interceptor.
- `maxContentLength` and `maxBodyLength`.
- Automatic transformation of `FormData` from plain objects: build the `FormData` yourself.
- `axios.all` / `axios.spread`: use `Promise.all`.

## Why switch

- **Size:** about 2.6 KB gzipped against about 21.7 KB for axios 1.21 (see the [benchmarks](/benchmarks)).
- **Cancellation that follows the query:** `api.queryOptions` passes the query's `signal` to the request, so a cancelled or replaced query stops its HTTP request.
- **Auth from a store:** `withAuth` and `refreshOnUnauthorized` read the token from any `Subscribable`; see the [HTTP client guide](/guide/http-client#with-the-store-authentication).
- **Errors you can `switch` on:** one `code` field instead of checking `error.response`, `error.request` and `error.code`.

## A migration in small steps

1. Create the instance next to your axios one and move the config over (`baseURL`, `headers`, `timeout`).
2. Move interceptors. Check the **order**: if two request interceptors depend on each other, reverse them.
3. Replace error handling: `axios.isAxiosError` becomes `isApiError`, `error.response?.status` becomes `error.status`.
4. Move calls feature by feature. Both clients can live side by side until the last call is moved.
5. For uploads with progress, add `adapter: xhrAdapter` to those calls only.
