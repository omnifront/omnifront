# @omnifront/api

A tiny, framework-agnostic, `fetch`-based HTTP client: instances, interceptors, typed errors, abort and timeout, retry (opt-in), upload progress via an optional XHR adapter. It plugs into `@omnifront/query` and `@omnifront/store` without depending on them.

> Pre-release: private for now, and the API can still change. Design: [ADR-0009](../../docs/adr/0009-api-client.md).

```ts
import { createApi } from "@omnifront/api"

const api = createApi({ baseURL: "https://api.example.com" })

const todos = api.queryOptions<Todo[]>("/todos", { params: { done: false } })
useQuery({ ...todos, staleTime: 5_000 }) // queryKey ["/todos", { done: false }], signal wired for cancellation
```
