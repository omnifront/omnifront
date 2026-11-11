# @omnifront/api

A `fetch`-based HTTP client. About 2.8 KB gzipped (budget 3 KB, excluding `@omnifront/core`). See the [HTTP client guide](/guide/http-client). Entries: `@omnifront/api`, `/xhr`, `/auth`, `/serialize`, `/progress`, `/testing`.

## `@omnifront/api`

### `createApi`

```ts
createApi(defaults?: ApiConfig): Api
```

An independent client. `ApiConfig` is both the instance default and the per-request config.

### `Api`

| Member | |
|---|---|
| `defaults` | The merged instance config. |
| `interceptors.request` / `.response` | `use(...)` returns a function that removes the interceptor. Run in the order added. A request interceptor takes a second argument `{ runWhen: (config) => boolean }` to skip some requests. |
| `getUri(config?)` | The full URL the config would request (base URL and query string included). Sends nothing. |
| `request(config)` | Any method. |
| `get`, `delete`, `head`, `options` `(url, config?)` | |
| `post`, `put`, `patch` `(url, data?, config?)` | |
| `extend(config?)` | A child instance: merged defaults, a copy of the interceptors. |
| `queryKey(path, params?)` | `[path]` or `[path, params]`. |
| `queryOptions(path, config?)` | `{ queryKey, queryFn }` for `useQuery` and friends. |
| `mutationOptions(method, path, config?)` | `{ mutationFn }`; `path` may be a function of the variables. |

### `Interceptors`

The class behind `api.interceptors.request` and `.response`.

### `ApiConfig`

`baseURL`, `allowAbsoluteUrls`, `url`, `method`, `headers`, `params`, `paramsSerializer`, `data`, `timeout`, `timeoutErrorMessage`, `withCredentials`, `fetchOptions`, `signal`, `responseType`, `validateStatus`, `transformRequest`, `transformResponse`, `parseReviver`, `retry`, `onDownloadProgress`, `onUploadProgress`, `adapter`, `fetch`, `scheduler`, `meta`. `meta` is free-form data that travels with the request, visible to interceptors.

| Option | |
|---|---|
| `allowAbsoluteUrls` | Default `true`: an absolute `url` ignores `baseURL`. `false` always prefixes `baseURL`, so a URL built from user input cannot send the request and its credentials to another host. |
| `withCredentials` | Send cookies on cross-origin requests (`credentials: "include"`; `xhr.withCredentials` with the XHR adapter). |
| `fetchOptions` | `FetchOptions`, handed to `fetch` unchanged. A `credentials` here wins over `withCredentials`. The per-request object replaces the instance one. |
| `timeoutErrorMessage` | Message of the `TIMEOUT` error. |
| `parseReviver` | The `reviver` of `JSON.parse` for JSON responses. |

### `FetchOptions`

`RequestInit` without what the client manages (`method`, `headers`, `body`, `signal`): `credentials`, `cache`, `mode`, `redirect`, `keepalive`, `referrer`, `integrity`, `priority`.

### `ApiResponse`

`{ data, status, statusText, headers, config }`.

### `ApiError`

Extends `Error`. `code` (an `ApiErrorCode`), `status`, `data`, `config`, `response`, `cause`.

### `isApiError`

Type guard for `ApiError`.

### `isCancel`

```ts
isCancel(error): error is ApiError
```

The request was aborted through its `signal` (`code === "ABORT"`). A timeout is not a cancel.

### `mergeConfig`

```ts
mergeConfig(...configs: (ApiConfig | undefined)[]): ApiConfig
```

How the client combines instance and request config: later ones win, `headers`, `params` and `meta` merge, `undefined` never overrides.

### `ApiErrorCode`

`"HTTP" | "TIMEOUT" | "ABORT" | "NETWORK" | "PARSE"`.

### `RetryConfig`

`{ attempts, backoff?, retryOn? }`. See [retry](/guide/http-client#retry).

### `serializeParams`

The default query string serializer.

### `fetchAdapter`

The default adapter.

### `Adapter`

`(request: ApiRequest) => Promise<RawResponse>`. `ApiRequest` is the resolved request (`url`, `method`, `headers`, `body`, `signal`, `responseType`, progress callbacks, `fetch`, `withCredentials`, `fetchOptions`); `RawResponse` is `{ status, statusText, headers, data }`.

### `ApiRequest`

What an adapter receives.

### `RawResponse`

What an adapter returns. For `responseType: "json"`, `data` is the body as text.

### `Transform`

`(data, headers) => unknown`, for `transformRequest` and `transformResponse`.

Also exported as types: `Headers`, `Method`, `Params`, `Progress`, `ResponseType`.

### `Headers`

`Record<string, string>` with lower-case names.

### `Method`

`"GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS"`.

### `Params`

`Record<string, unknown>`.

### `Progress`

`{ loaded: number; total: number | undefined }`.

### `ResponseType`

`"json" | "text" | "blob" | "arrayBuffer" | "stream"`.

## `@omnifront/api/xhr`

### `xhrAdapter`

An `XMLHttpRequest` adapter for `onUploadProgress`. Browser only; no `"stream"` response type.

## `@omnifront/api/auth`

### `withAuth`

```ts
withAuth(api, source: Subscribable<T>, select: (snapshot: T) => Record<string, string>): () => void
```

Adds the headers `select` returns, reading `source.getSnapshot()` when each request is sent.

### `refreshOnUnauthorized`

```ts
refreshOnUnauthorized(api, { refresh, shouldRefresh? }): () => void
```

On a 401: one shared `refresh()`, then the request is repeated once.

### `RefreshOptions`

`{ refresh: () => Promise<unknown>; shouldRefresh?: (error) => boolean }`.

### `basicAuth`

```ts
basicAuth(api, { username, password? }): () => void
```

HTTP Basic authentication on every request (axios's `auth` option). UTF-8 safe.

### `withXsrf`

```ts
withXsrf(api, { cookieName?, headerName?, send?, cookie? }): () => void
```

Copies the XSRF cookie (`XSRF-TOKEN`) into a request header (`X-XSRF-TOKEN`), like axios's `xsrfCookieName` / `xsrfHeaderName`. By default only same-origin requests get it; `send: true` is axios's `withXSRFToken: true`, and `send` may be a function of the request config.

### `XsrfOptions`

The options object of `withXsrf`. `cookie` replaces `document.cookie` as the source (tests, non-browser runtimes).

## `@omnifront/api/serialize`

Query-string formats and form bodies. See [migrating from axios](/guide/migrating-from-axios).

### `createParamsSerializer`

```ts
createApi({ paramsSerializer: createParamsSerializer({ indexes: null }) })
```

A `paramsSerializer` with axios's options: `indexes` (`false`, the default: `a[]=1&a[]=2`; `true`: `a[0]=1`; `null`: `a=1&a=2`), `dots` (`a.b=1` instead of `a[b]=1`) and `encode`. The built-in `serializeParams` writes `a=1&a=2`.

### `ParamsSerializerOptions`

`SerializeOptions` plus `encode`.

### `SerializeOptions`

`{ indexes?, dots? }`, shared by every function in this entry.

### `toFormData`

```ts
toFormData(data: object, formData?: FormData, options?: SerializeOptions): FormData
```

A plain object as `FormData`: nested objects become `a[b]`, arrays `a[]`, Dates ISO strings; `File`s and `Blob`s are appended as they are; `undefined` is skipped.

### `toURLEncoded`

```ts
toURLEncoded(data: object, options?: SerializeOptions): URLSearchParams
```

### `formToJSON`

```ts
formToJSON(form: FormData | URLSearchParams): Record<string, unknown>
```

The reverse: nested names become objects, `a[]`, `a[0]` and repeated names become arrays.

### `formTransform`

```ts
createApi({ transformRequest: formTransform() })
api.post("/upload", { name, file }, { headers: { "content-type": "multipart/form-data" } })
```

A `transformRequest` that converts a plain-object body according to the `content-type`: `multipart/form-data` to `FormData`, `application/x-www-form-urlencoded` to a query string.

### `postForm`

```ts
postForm(api, url, data, config?)
```

`api.post` with the body sent as `multipart/form-data`.

### `putForm`

`api.put`, the same way.

### `patchForm`

`api.patch`, the same way.

## `@omnifront/api/progress`

### `trackProgress`

```ts
api.get("/file", { onDownloadProgress: trackProgress((p) => bar.set(p.progress ?? 0)) })
```

Wraps a progress callback to add what axios's progress event carries. Make one per request.

### `ProgressDetails`

`Progress` plus `bytes` (since the previous event), `progress` (0 to 1), `rate` (bytes per second) and `estimated` (seconds left). The last three are `undefined` while unknown.

## `@omnifront/api/testing`

### `createMockAdapter`

```ts
createMockAdapter(routes: MockHandler | Record<"METHOD /path", MockReply | MockHandler>): MockAdapter
```

### `MockAdapter`

An `Adapter` with `calls`, every request it received.

### `MockHandler`

`(request) => MockReply | Promise<MockReply>`.

### `MockReply`

`{ status?, statusText?, headers?, data?, error? }`. Objects in `data` are JSON-encoded for `responseType: "json"`; `error` makes the adapter throw.
