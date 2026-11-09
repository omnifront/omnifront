# ADR-0009: کلاینت HTTP (`@omnifront/api`)

**وضعیت:** Accepted
**تاریخ:** 2026-11-08

## زمینه

`query` فقط کش و چرخه‌ی عمر را مدیریت می‌کند و عمداً کلاینت HTTP ندارد (`queryFn` هر تابع async است). تیم‌ها عملاً برای همان `queryFn` باز هم axios یا `fetch` خام می‌آورند و هر بار interceptor، auth، خطای تایپ‌شده و لغو را دوباره می‌نویسند. هدف این ADR یک کلاینت HTTP است که:

1. امکانات روزمره‌ی axios را داشته باشد؛
2. بدون وابستگی به هیچ فریم‌ورک باشد (قانون وابستگی ADR-0003: `api → core`، و هیچ import از `react` / `vue` / `@angular/*`)؛
3. با `query` و `store` هماهنگ کار کند، ولی به `query` وابسته نشود، چون بودجه‌ی `query` (۳KB) پر است و هر قابلیت جدید باید بسته‌ی جدا باشد (ADR-0008).

این بسته در رودمپ اولیه نبود و فقط «plugin/middleware (auth, logging)» بعد از MVP ذکر شده بود؛ interceptorهای `api` همان نیاز را پوشش می‌دهند.

## تصمیم

### ۱. هسته بر پایه‌ی `fetch`

- پیش‌فرض: `fetch` سراسری (Node ≥ 18، مرورگرها، Edge). هیچ وابستگی runtime ندارد. `fetch` قابل تزریق است (`createApi({ fetch })`) برای تست، SSR و polyfill.
- **Adapter قابل تعویض** با امضای کوچک `(request) => Promise<RawResponse>`. دو adapter:
  - `fetchAdapter` (پیش‌فرض، در هسته)؛
  - `xhrAdapter` در ورودی جدا `@omnifront/api/xhr` (tree-shakeable) برای **پیشرفت آپلود** (`onUploadProgress`) که `fetch` ندارد. این نیاز تأییدشده است، پس در نسخه‌ی اول می‌آید.

### ۲. سطح API (هم‌سطح axios)

```ts
const api = createApi({
  baseURL: "https://api.example.com",
  headers: { Accept: "application/json" },
  timeout: 10_000,
})

api.get<Todo[]>("/todos", { params: { done: false } })
api.post<Todo>("/todos", { title: "x" })      // JSON خودکار
api.put / patch / delete / head / request(config)
api.extend({ baseURL: "/v2" })                // instance فرزند، به ارث بردن interceptorها
```

- `baseURL`، `headers` (ادغام در سطح instance و درخواست)، `params` با serializer قابل تعویض (آرایه و آبجکت تو در تو)، `timeout`، `signal`، `responseType` (`json` | `text` | `blob` | `arrayBuffer` | `stream`)، `validateStatus`.
- بدنه: JSON، `FormData`، `URLSearchParams`، `Blob`، stream؛ `Content-Type` خودکار.
- پیشرفت دانلود (`onDownloadProgress`) روی `fetch` با خواندن stream. آپلود فقط با `xhrAdapter`.
- `transformRequest` / `transformResponse` به‌صورت زنجیره‌ی توابع.
- **Interceptorها:** `api.interceptors.request.use(fn)`، `response.use(onOk, onError)`، و `error`. هر `use` تابع unsubscribe برمی‌گرداند. ترتیب: درخواست LIFO مثل axios را **نمی‌گیریم**؛ ترتیب ثبت (FIFO) برای هر دو طرف، تا قابل پیش‌بینی باشد (تفاوت با axios در مستندات ذکر می‌شود).
- **خطا:** همیشه `ApiError` (`status`، `data`، `config`، `response`، `code`: `"HTTP" | "TIMEOUT" | "ABORT" | "NETWORK" | "PARSE"`) و type guard به نام `isApiError`. لغو واقعی (`AbortError`) از timeout جدا می‌شود.
- **لغو:** `AbortSignal` کاربر و timeout داخلی ترکیب می‌شوند (`AbortSignal.any` با fallback).
- **retry:** اختیاری و **پیش‌فرض خاموش** (`retry: { attempts, backoff, retryOn }`). دلیل: `query` خودش retry با backoff دارد و دو لایه‌ی retry تعداد درخواست را ضرب می‌کند. این گزینه برای استفاده‌ی بدون `query` است و در مستندات صریحاً گفته می‌شود که با `query` خاموش بماند.
- **ردیابی:** hook `onRequest` / `onResponse` برای logging (همان interceptor، بدون API جدا).

### ۳. یکپارچگی با `query` (بدون وابستگی)

`api` به `@omnifront/query` import نمی‌کند. شکل `queryOptions` را **ساختاری** برمی‌گرداند، تا مستقیم به `useQuery` / `injectQuery` / `QueryClient.fetch` پاس شود:

```ts
const todos = api.queryOptions<Todo[]>("/todos", { params: { done: false } })
// { queryKey: ["/todos", { done: false }], queryFn: ({ signal }) => api.get(..., { signal }).then(r => r.data) }

useQuery({ ...todos, staleTime: 5_000 })

const create = api.mutationOptions<Todo, NewTodo>("POST", "/todos") // { mutationFn }
useMutation({ ...create, onSuccess: () => client.invalidateQueries({ queryKey: api.queryKey("/todos") }) })
```

- `queryKey` به شکل `[path, params?]` است (فقط GET/HEAD؛ متد در کلید نمی‌آید) تا با کلیدهای دستی کاربر هماهنگ باشد و invalidation با پیشوند (`api.queryKey("/todos")`) کار کند.
- `signal` از `queryFn` به درخواست می‌رسد، پس لغو query = لغو درخواست.
- `mutationOptions` فقط `{ mutationFn }` برمی‌گرداند و invalidate را کاربر با `api.queryKey` انجام می‌دهد؛ پس نیازی به import از `query` نیست. اگر در آینده میان‌بر invalidate خودکار خواستیم و انجام invalidate در بسته‌ی `api` مستلزم import از `query` بود، این بخش به بسته‌ی کوچک `@omnifront/query-api` (وابسته به هر دو) منتقل می‌شود. این تصمیم در پیاده‌سازی با اندازه‌گیری گرفته می‌شود و ADR به‌روز می‌شود.
- تایپ‌ها: خروجی `queryOptions` باید با type test (مثل بسته‌های دیگر) با `useQuery` سازگار بماند.

### ۴. یکپارچگی با `store`

`api` فقط به **قرارداد `Subscribable`** در `core` وابسته است، نه به `store`:

```ts
const auth = createStore({ token: null as string | null })
api.interceptors.request.use(req => {
  const { token } = auth.getSnapshot()
  return token ? { ...req, headers: { ...req.headers, Authorization: `Bearer ${token}` } } : req
})
```

- میان‌بر `withAuth(api, subscribable, (snap) => headers)` در ورودی `./auth` (به‌جای متد روی `api`، تا هسته کوچک بماند)، که همیشه آخرین snapshot را در لحظه‌ی درخواست می‌خواند (نه در لحظه‌ی ساخت).
- الگوی refresh توکن (`401 → refresh → تکرار`) به‌صورت helper در ورودی جدا `@omnifront/api/auth` با dedupe یک refresh هم‌زمان، چون خطای رایج است.

### ۵. SSR و تست

- بدون state سراسری: هر `createApi` مستقل است (درس ADR-0005: instance جدا برای هر درخواست).
- کوکی/headerهای درخواست SSR با `headers` تابعی یا `fetch` تزریقی؛ بدون دسترسی به `window`.
- پکیج `@omnifront/api/testing` (ورودی جدا) یک `mockAdapter` ساده برای تست‌ها می‌دهد.
- تست‌ها: Vitest با سرور HTTP واقعی Node برای adapterها، به‌علاوه‌ی تست‌های conformance مربوط به `queryOptions` در هر آداپتر.

### ۶. بسته‌بندی و بودجه

- پکیج `packages/api`، وابسته به `@omnifront/core` فقط (برای تایپ `Subscribable`). `sideEffects: false`.
- ورودی‌ها: `.` (هسته)، `./xhr`، `./auth` (helper رفرش توکن)، `./testing`.
- **بودجه‌ی gzip:** هسته ≤ ۳KB، `xhr` ≤ ۱KB، `auth` و `testing` هرکدام ≤ ۱KB. (بودجه‌ی اولیه ۲KB بود؛ پیاده‌سازی کامل با interceptor، retry، timeout، progress و queryOptions ۲.۷KB شد. سقف به ۳KB رفت، هم‌اندازه‌ی `query`، و این ADR همان تصمیم علنی است. افزودن بیشتر از ۳KB باید ADR یا شکستن بسته باشد.)
- قاعده‌ی dependency-boundary: `api` نباید از `query`، `store` یا هیچ فریم‌ورکی import کند.

## گزینه‌های ردشده

- **بستن به axios یا wrapper روی آن:** حجم (~۱۳KB) و وابستگی، و XHR پیش‌فرض در Edge/SSR مناسب نیست.
- **ساختن مستقیم داخل `query`:** بودجه‌ی ۳KB پر است و کاربر `query` بدون HTTP هم باید بتواند کار کند.
- **import از `query` داخل `api`:** قانون ADR-0003 را درگیر می‌کند و دو بسته را هم‌نسخه می‌کند؛ ساختاری‌بودن شکل `queryOptions` همان فایده را بدون این هزینه می‌دهد.
- **ترتیب LIFO برای interceptorهای request (مثل axios):** برای کاربر تازه‌وارد گیج‌کننده است؛ تفاوت مستند می‌شود.
- **retry پیش‌فرض روشن:** ضرب شدن با retry خود `query`.
- **فقط XHR یا فقط fetch:** XHR در Edge نیست، `fetch` آپلود ندارد؛ adapter دوگانه هر دو نیاز را می‌پوشاند.

## پیامدها (مثبت و منفی)

مثبت: یک مدل ذهنی واحد برای HTTP + کش + state؛ لغو و خطا یک‌دست؛ بدون وابستگی runtime؛ interceptorها نیاز «middleware» رودمپ را پوشش می‌دهند؛ برای مهاجرت (مثلاً Angular `HttpClient` → React) منطق شبکه‌ای مشترک می‌شود.
منفی: سطح API بزرگ و نگهداری آن سنگین است (ویژگی‌های axios بی‌پایان‌اند: برای محدود ماندن، فهرست «پشتیبانی‌شده / نه» در مستندات می‌آید)؛ دو adapter یعنی دو مسیر تست؛ ممکن است `query-api` بسته‌ی چهاردهم شود.

## معیار بازبینی

- اگر ساخت `mutationOptions` بدون import از `query` ممکن نشد، بسته‌ی `query-api` ساخته شود و این ADR به‌روز شود.
- اگر بودجه‌ی ۲KB شکست، یا `xhrAdapter` به اندازه‌ای رشد کرد که استفاده از آن را سخت کرد، بسته تقسیم شود.
- اگر `query` در آینده کلاینت HTTP را به‌عنوان گزینه‌ی داخلی بخواهد، ADR-0001 و ADR-0006 دوباره باز شوند.

## تصمیم‌های سؤال‌های باز (تأییدشده)

1. interceptorها FIFO هستند، برای هر دو طرف.
2. `queryKey` به شکل `[path, params?]`.
3. helper رفرش توکن در ورودی جدا `./auth`.
4. WebSocket / SSE بسته‌ی جدا و خارج از دامنه‌ی این ADR.
