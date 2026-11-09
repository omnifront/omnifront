---
"@omnifront/api": minor
---

More axios options in the client itself (ADR-0013, phase 2): `withCredentials`, `fetchOptions` (passed to `fetch` unchanged), `allowAbsoluteUrls`, `timeoutErrorMessage`, `parseReviver`; `api.getUri(config)`; `runWhen` for request interceptors; `isCancel` and `mergeConfig` exports. The XHR adapter honours `withCredentials`. Custom adapters receive two more fields on `ApiRequest`: `withCredentials` and `fetchOptions`.

New opt-in entries, which do not add to the main entry:

- `@omnifront/api/serialize`: `createParamsSerializer`, `toFormData`, `toURLEncoded`, `formToJSON`, `formTransform`, `postForm`, `putForm`, `patchForm`.
- `@omnifront/api/progress`: `trackProgress` (fraction, rate, time left).
- `@omnifront/api/auth`: `basicAuth` and `withXsrf`.
