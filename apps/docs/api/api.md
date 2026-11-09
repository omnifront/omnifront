# @omnifront/api

A `fetch`-based HTTP client. About 2.7 KB gzipped (budget 3 KB, excluding `@omnifront/core`). See the [HTTP client guide](/guide/http-client). Entries: `@omnifront/api`, `/xhr`, `/auth`, `/testing`.

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
| `interceptors.request` / `.response` | `use(...)` returns a function that removes the interceptor. Run in the order added. |
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

`baseURL`, `url`, `method`, `headers`, `params`, `paramsSerializer`, `data`, `timeout`, `signal`, `responseType`, `validateStatus`, `transformRequest`, `transformResponse`, `retry`, `onDownloadProgress`, `onUploadProgress`, `adapter`, `fetch`, `scheduler`, `meta`. `meta` is free-form data that travels with the request, visible to interceptors.

### `ApiResponse`

`{ data, status, statusText, headers, config }`.

### `ApiError`

Extends `Error`. `code` (an `ApiErrorCode`), `status`, `data`, `config`, `response`, `cause`.

### `isApiError`

Type guard for `ApiError`.

### `ApiErrorCode`

`"HTTP" | "TIMEOUT" | "ABORT" | "NETWORK" | "PARSE"`.

### `RetryConfig`

`{ attempts, backoff?, retryOn? }`. See [retry](/guide/http-client#retry).

### `serializeParams`

The default query string serializer.

### `fetchAdapter`

The default adapter.

### `Adapter`

`(request: ApiRequest) => Promise<RawResponse>`. `ApiRequest` is the resolved request (`url`, `method`, `headers`, `body`, `signal`, `responseType`, progress callbacks, `fetch`); `RawResponse` is `{ status, statusText, headers, data }`.

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
