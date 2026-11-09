# نقشه‌ی برابری با TanStack Query و axios

**وضعیت:** تأییدشده؛ تصمیم‌های بخش ۱ در [ADR-0013](adr/0013-feature-placement-and-parity.md) ثبت شده‌اند
**تاریخ:** 2026-11-09
**مرجع مقایسه:** TanStack Query v5 (مستندات `latest`) و axios 1.x (README شاخه‌ی `v1.x`)، هر دو در همین تاریخ خوانده شدند.

این سند سه چیز دارد: فهرست هر گزینه/متد/فیلدی که آن دو دارند و ما نداریم، جای پیشنهادی هر کدام در بسته‌ها، و ترتیب اجرا. آنچه الان داریم از روی کد `packages/*/src` استخراج شده، نه از روی مستندات.

## ۱. تصمیم‌هایی که قبل از شروع لازم است

| # | تصمیم | پیشنهاد |
|---|---|---|
| ۱ | **بودجه‌ی `@omnifront/query`.** الان ۳.۰۶ از ۳.۱KB است، یعنی حدود ۴۰ بایت جا دارد. حدود ۱۲ قلم از این فهرست فقط داخل `Query` / `QueryObserver` / `Mutation` قابل پیاده‌سازی‌اند و تخمین من برای مجموعشان حدود ۰.۸KB است (تخمین، اندازه‌گیری نشده). | سقف جدید **۴KB** با ADR-0013 و یک دفتر بایت برای هر قلم. هنوز حدود یک‌سوم `query-core` است. بدون این تصمیم فاز ۳ و ۴ قابل اجرا نیست. |
| ۲ | **`select`.** ADR-0006 بند ۳ آن را رد کرده (`derive` جایگزین است). | بازگشایی: برای مهاجرت لازم است و هزینه‌اش بیشتر در تایپ generic آداپترهاست تا بایت. |
| ۳ | **فلگ‌های بولی نتیجه** (`isPending`، `isLoading`، `isError`، `isSuccess`). راهنمای مهاجرت الان می‌گوید «`status` را مقایسه کن». | اضافه شوند. رایج‌ترین الگوی کد TanStack همین destructure است و نبودنش یعنی هیچ کامپوننتی با «فقط عوض کردن import» منتقل نمی‌شود. |
| ۴ | **گزینه‌های مخصوص Node در axios** (`proxy`، `httpAgent`، `maxRedirects` و بقیه). ADR-0009 آن‌ها را به `fetch` سفارشی سپرده. | همان بماند. اگر کسی واقعاً خواست، بسته‌ی جدا `@omnifront/api-node` (به `undici` وابسته می‌شود، پس طبق قاعده نمی‌تواند داخل `api` باشد). |

## ۲. قاعده‌ی جایابی

| کد | جا | شرط |
|---|---|---|
| **M** | ورودی اصلی همان بسته | به internals نیاز دارد و تقریباً هر کاربری لازمش دارد |
| **E** | ورودی فرعی (`@omnifront/x/y`) با بودجه‌ی جدا | اختیاری است، یا فقط با API عمومی ساخته می‌شود |
| **A** | آداپتر (`react` / `vue` / `angular` / `next`) | به مفهوم خود فریم‌ورک گره خورده |
| **P** | بسته‌ی جدا | وابستگی خارجی یا چرخه‌ی انتشار مستقل دارد |
| **T** | فقط تایپ | صفر بایت |
| **—** | انجام نمی‌شود | دلیل در ستون توضیح |

اولویت: **H** مانع مهاجرت است، **M** پرکاربرد، **L** کم‌کاربرد یا جایگزین دارد.

ورودی‌های فرعی تازه‌ای که این نقشه معرفی می‌کند:

| ورودی | محتوا |
|---|---|
| `@omnifront/query/options` | `queryOptions`، `mutationOptions`، `infiniteQueryOptions`، `skipToken` |
| `@omnifront/query/filters` | متدهای گروهی client و فیلترهای کامل |
| `@omnifront/query/events` | callbackهای سراسری و رویدادهای کش |
| `@omnifront/query/offline` | `scope`، mutationهای متوقف‌شده، `resumePausedMutations` |
| `@omnifront/query/stream` | `streamedQuery` |
| `@omnifront/api/serialize` | قالب‌های `params`، `toFormData`، `formToJSON`، `postForm` |
| `@omnifront/api/progress` | نرخ و زمان تخمینی برای رویداد پیشرفت |
| `@omnifront/react/errors` | `throwOnError`، `QueryErrorResetBoundary` |

## ۳. TanStack Query: آنچه نداریم

### ۳.۱ گزینه‌های `useQuery` / `QueryObserver`

داریم: `queryKey`، `queryFn`، `staleTime` (عدد)، `gcTime`، `enabled` (بولی)، `retry`، `retryDelay`، `refetchOnWindowFocus` و `refetchOnReconnect` (بولی)، `refetchInterval` (عدد)، `initialData`، `placeholderData`. در `query-infinite`: `maxPages`.

| گزینه | جا | اولویت | توضیح |
|---|---|---|---|
| `select` | M + تایپ هر سه آداپتر | H | تصمیم ۲. در `view()` محاسبه و memo می‌شود |
| `refetchOnMount` (`true` / `false` / `"always"` / تابع) | M | H | الان همیشه مثل `true` رفتار می‌کند |
| `enabled` به شکل تابع | M | M | |
| `staleTime` به شکل تابع و `"static"` | M | M | |
| `refetchOnWindowFocus` / `refetchOnReconnect` با `"always"` و تابع | M | M | |
| `refetchInterval` به شکل تابع | M | M | برای polling تا رسیدن به یک وضعیت |
| `refetchIntervalInBackground` | M | M | الان در پس‌زمینه همیشه متوقف است |
| `networkMode` (`online` / `always` / `offlineFirst`) | M | M | با `fetchStatus` و `isPaused` یک قلم است (۳.۲) |
| `meta` | M | M | به `queryFn` و callbackهای سراسری می‌رسد |
| `retryOnMount` | M | L | |
| `initialDataUpdatedAt` | M | L | ADR-0006 بند ۴ رد کرده؛ چند بایت است |
| `structuralSharing` برای هر کوئری (بولی یا تابع) | M | L | الان فقط در سطح client است |
| `queryKeyHashFn` | M، در سطح client | L | |
| `notifyOnChangeProps` | — | L | `derive(observer, pick, shallowEqual)` همین کار را می‌کند؛ در راهنما مستند شود |
| `throwOnError` | A (`@omnifront/react/errors`) | M | فقط React مرز خطا دارد. Vue و Angular معادل مستقیم ندارند |
| `subscribed` | A | L | برای React Native / صفحه‌های غیرفعال |
| `persister` (برای هر کوئری) | E (`@omnifront/persist/query`) | L | در TanStack هم experimental است |
| `queryHash` | — | L | داخلی |

### ۳.۲ فیلدهای نتیجه

داریم: `status`، `data`، `error`، `isFetching`، `isStale`، `isInvalidated`، `isPlaceholderData`، `failureCount`، `dataUpdatedAt`، `refetch()`.

| فیلد | جا | اولویت | توضیح |
|---|---|---|---|
| `isPending`، `isLoading`، `isSuccess`، `isError` | M | H | تصمیم ۳. `UseQueryReturn` در Vue و `InjectQueryResult` در Angular فهرست فیلد صریح دارند و باید به‌روز شوند |
| `fetchStatus` (`fetching` / `paused` / `idle`) و `isPaused` | M | M | با `networkMode` |
| `isRefetching`، `isLoadingError`، `isRefetchError`، `isInitialLoading`، `isEnabled` | M | M | همه از state مشتق می‌شوند |
| `failureReason` | M | M | |
| `errorUpdatedAt`، `errorUpdateCount` | M | L | |
| `isFetched`، `isFetchedAfterMount` | M | L | |
| `refetch({ cancelRefetch, throwOnError })` | M | L | الان همیشه به درخواست جاری می‌پیوندد و همیشه reject می‌کند |
| `promise` (برای `React.use`) | A (`@omnifront/react/suspense`) | L | experimental در TanStack |
| وضعیت `"pending"` به‌جای `"loading"` / `"idle"` | — | — | نام‌گذاری ما می‌ماند؛ فلگ‌ها فاصله را می‌پوشانند |

### ۳.۳ context تابع `queryFn`

داریم: `signal` (و `pageParam` در infinite).

| فیلد | جا | اولویت |
|---|---|---|
| `queryKey` | M | H |
| `meta` | M | M |
| `client` | M | M |
| `direction` (infinite) | M در `query-infinite` | L |

### ۳.۴ `QueryClient`

داریم: `fetchQuery(key, fn, retry)`، `cancelQuery(key)`، `invalidateQueries({ queryKey, exact })`، `getQueryData`، `setQueryData`، `getQueryState`، `getQueries`، `onChange`، `clear`، و `prefetchQuery` در `/prefetch`. گزینه‌های سازنده: `scheduler`، `gcTime`، `structuralSharing`.

| متد / گزینه | جا | اولویت | توضیح |
|---|---|---|---|
| `defaultOptions` (`queries` و `mutations`)، `getDefaultOptions`، `setDefaultOptions` | M | H | observer هنگام ساخت و `setOptions` ادغام می‌کند |
| `removeQueries`، `resetQueries` | E `/filters` + دو متد کوچک روی `Query` در M | H | `Query.reset()` و حذف entry به internals نیاز دارند |
| `refetchQueries`، `cancelQueries(filters)` | E `/filters` | H | با `getQueries()` و `query.cancel()` ساخته می‌شوند |
| `ensureQueryData` | E `/filters` | H | برای loaderهای router |
| `setQueriesData`، `getQueriesData` | E `/filters` | M | |
| فیلترها: `predicate`، `type` (`active` / `inactive`)، `stale`، `fetchStatus` | E `/filters` | M | `query.hasListeners` از قبل عمومی است |
| `refetchType` در `invalidateQueries` | E `/filters` | M | |
| شکل تک‌آبجکتی `fetchQuery({ queryKey, queryFn, staleTime })` | M (overload) | M | الان سه آرگومان جدا می‌گیرد |
| `isFetching(filters)`، `isMutating(filters)` (غیرواکنشی) | E `/activity` | L | نسخه‌ی واکنشی را داریم |
| `setQueryDefaults`، `getQueryDefaults`، `setMutationDefaults`، `getMutationDefaults` | E `/options` | L | پیش‌فرض بر اساس پیشوند کلید |
| `query()`، `infiniteQuery()` | E `/filters` | L | تازه در v5؛ همان `fetchQuery` با `staleTime` |
| `resumePausedMutations` | E `/offline` | M | |
| `getQueryCache().find` / `findAll` / `subscribe` | E `/events` | M | devtools می‌تواند به‌جای polling از آن استفاده کند (معیار بازبینی ADR-0011) |
| `QueryCache({ onError, onSuccess, onSettled })` | E `/events` | H | toast خطای سراسری. با مقایسه‌ی state در `client.onChange` ساخته می‌شود، بدون بایت در M |
| `MutationCache({ onError, onSuccess, onSettled, onMutate })` | E `/events` | H | روی رجیستری `trackMutation` |
| `getMutationCache()` | E `/activity` | M | |
| `mount` / `unmount` | — | — | چرخه‌ی عمر ما با تعداد مشترک است (ADR-0001 قاعده‌ی ۴) |

### ۳.۵ Mutation

داریم: `mutationFn`، `onMutate`، `onSuccess`، `onError`، `onSettled`؛ state شامل `status`، `data`، `error`، `variables`؛ `mutate`، `mutateAsync`، `reset`.

| گزینه / فیلد | جا | اولویت | توضیح |
|---|---|---|---|
| callbackهای هر فراخوانی: `mutate(vars, { onSuccess, onError, onSettled })` | M | H | بسیار رایج |
| `isPending`، `isSuccess`، `isError`، `isIdle` | M | H | همراه تصمیم ۳ |
| `mutationKey` | M | M | پیش‌نیاز فیلتر `useIsMutating` و `useMutationState` |
| `retry`، `retryDelay` | M | M | `shouldRetry` و `getRetryDelay` از قبل در باندل‌اند |
| `failureCount`، `failureReason`، `submittedAt`، `context` | M | M | |
| `meta` | M | L | |
| `throwOnError` | A (`@omnifront/react/errors`) | L | |
| `networkMode`، `isPaused` | M (حالت) + E `/offline` (صف) | M | |
| `scope: { id }` (اجرای سریالی) | E `/offline` | M | |
| `gcTime` | E `/activity` | L | فقط وقتی mutation در کش بماند معنا دارد |

### ۳.۶ Infinite (`@omnifront/query-infinite`)

داریم: `initialPageParam`، `getNextPageParam`، `getPreviousPageParam`، `maxPages`، `hasNextPage`، `hasPreviousPage`، `isFetchingNextPage`، `isFetchingPreviousPage`، `fetchNextPage`، `fetchPreviousPage`.

| قلم | جا | اولویت |
|---|---|---|
| `fetchInfiniteQuery`، `prefetchInfiniteQuery` (با `pages`)، `ensureInfiniteQueryData` | M همین بسته | M |
| `fetchNextPage({ cancelRefetch })` | M همین بسته | L |
| `isFetchNextPageError`، `isFetchPreviousPageError` | M همین بسته | L |
| `infiniteQueryOptions` | E `@omnifront/query/options` (فقط تایپ) | M |

### ۳.۷ Hydration (`@omnifront/query/hydration`)

داریم: `dehydrate` با `shouldDehydrate`، و `hydrate`. فقط کوئری‌های موفق.

| قلم | جا | اولویت | توضیح |
|---|---|---|---|
| `serializeData` / `deserializeData` | همان ورودی | M | برای `Date`، `Map` با superjson |
| dehydrate کوئری‌های pending (استریم promise) | همان ورودی + `next` | M | الگوی «prefetch بدون await» در App Router |
| dehydrate mutationها، `shouldDehydrateMutation` | همان ورودی | L | پیش‌نیاز: mutationهای متوقف‌شده |
| `shouldRedactErrors` و dehydrate خطا | همان ورودی | L | |
| `hydrate(..., { defaultOptions })` | همان ورودی | L | |

### ۳.۸ Persist (`@omnifront/persist`)

داریم: `persistQueryClient` با `key`، `maxAge`، `buster`، `throttle`، `shouldDehydrate`، `serialize`، `deserialize`، `onError`، و ورودی `/indexeddb`.

| قلم | جا | اولویت |
|---|---|---|
| ذخیره و ادامه‌ی mutationهای متوقف‌شده | M همین بسته | M |
| `retry` هنگام پر شدن storage (`removeOldestQuery`) | M همین بسته | L |
| `useIsRestoring` / `PersistQueryClientProvider` | A | L |
| persister برای هر کوئری | E `/query` | L |

### ۳.۹ هوک‌های آداپتر

| قلم | React | Vue | Angular | اولویت |
|---|---|---|---|---|
| شکل `{ queries, combine }` برای `useQueries` | `/queries` | `/queries` | `/queries` | M |
| `useMutationState` | `/activity` | `/activity` | `injectMutationState` | M |
| `useIsMutating(filters)` | `/activity` | `/activity` | `/activity` | M |
| `usePrefetchQuery`، `usePrefetchInfiniteQuery` | `/suspense` | — | — | L |
| `useSuspenseQueries` | `/suspense` | — | — | M |
| `QueryErrorResetBoundary`، `useQueryErrorResetBoundary` | `/errors` | — | — | M |
| آرگومان دوم `queryClient` برای دور زدن provider | M | M | M | L |

### ۳.۱۰ ابزارها، افزونه‌ها و تایپ

| قلم | جا | اولویت | توضیح |
|---|---|---|---|
| generic خطا (`TError`) و `Register` برای نوع خطای پیش‌فرض | T | H | الان `error` همیشه `unknown` است |
| `queryOptions()`، `mutationOptions()` با کلید تایپ‌دار (`DataTag`) | E `/options` | H | `getQueryData(todos.queryKey)` نوع را بداند |
| `skipToken` | E `/options` + یک شرط در M | M | |
| `broadcastQueryClient` (همگام‌سازی بین تب‌ها) | P `@omnifront/broadcast` | M | فقط API عمومی لازم دارد |
| `streamedQuery` | E `/stream` | L | به `client` در context نیاز دارد |
| `matchQuery`، `isCancelledError`، `isServer` | E `/filters` | L | |
| `notifyManager.setScheduler` / `setNotifyFunction` / `setBatchNotifyFunction` | M در `core` | L | `core` در ۹۴۴ از ۱۰۰۰ بایت است |
| `timeoutManager` | — | — | `Scheduler` تزریقی همین است |
| `focusManager.setEventListener` | — | — | `EnvironmentSignal.set()` همین است |
| پلاگین ESLint | P `@omnifront/eslint-plugin` | L | |
| Devtools | P (موجود) | — | در جریان، ADR-0012 |

## ۴. axios: آنچه نداریم

### ۴.۱ گزینه‌های درخواست

داریم: `url`، `method`، `baseURL`، `headers`، `params`، `paramsSerializer` (تابع)، `data`، `timeout`، `signal`، `responseType` (`json` / `text` / `blob` / `arrayBuffer` / `stream`)، `validateStatus`، `transformRequest`، `transformResponse`، `onDownloadProgress`، `onUploadProgress` (با `/xhr`)، `adapter` (تابع). اضافه بر axios: `retry`، `fetch`، `scheduler`، `meta`.

| گزینه | جا | اولویت | توضیح |
|---|---|---|---|
| `withCredentials` | M + نگاشت در `/xhr` | H | الان فقط با `fetch` سفارشی ممکن است؛ `/xhr` اصلاً راهی ندارد |
| `fetchOptions` (`credentials`، `cache`، `mode`، `redirect`، `keepalive`، `referrer`، `integrity`، `priority`) | M | H | مستقیم به `RequestInit` می‌رود |
| `allowAbsoluteUrls` | M | M | الان URL مطلق همیشه `baseURL` را دور می‌زند؛ خاموش کردنش جلوی نشت توکن به میزبان دیگر را می‌گیرد |
| `auth` (Basic) | E `/auth` → `basicAuth(api, …)` | M | |
| `xsrfCookieName`، `xsrfHeaderName`، `withXSRFToken` | E `/auth` → `withXsrf(api, …)` | M | فقط مرورگر |
| `paramsSerializer` به شکل آبجکت (`indexes`، `encode`، `serialize`، `maxDepth`) | E `/serialize` | M | قالب `a[]=1` و `a[0]=1`؛ الان فقط `a=1&a=2` |
| `formSerializer` (`dots`، `indexes`، `metaTokens`، `visitor`، `maxDepth`) و تبدیل خودکار آبجکت به `FormData` / urlencoded بر اساس `content-type` | E `/serialize` | M | به شکل یک `transformRequest` آماده |
| `maxContentLength` | E (adapter پوششی) | L | روی stream دانلود قابل اعمال است |
| `maxBodyLength` | E (همان) | L | |
| `timeoutErrorMessage` | M | L | |
| `parseReviver` | M | L | الان فقط با `responseType: "text"` و transform ممکن است |
| `responseType: "document"` و `"formData"` | `/xhr` و fetch adapter | L | |
| `transitional.*` | — | — | رفتار ما ثابت است: timeout همیشه `TIMEOUT`، JSON خراب همیشه `PARSE` |
| `redact`، `formDataHeaderPolicy`، `env.FormData` | — | L | بسیار خاص |
| `cancelToken` | — | — | در axios هم منسوخ است |
| `adapter` با نام (`"xhr"`، `"fetch"`) یا آرایه | — | — | تابع می‌گیریم تا tree-shaking بماند |
| `proxy`، `httpAgent`، `httpsAgent`، `socketPath`، `allowedSocketPaths`، `transport`، `maxRedirects`، `beforeRedirect`، `sensitiveHeaders`، `decompress`، `insecureHTTPParser`، `maxRate`، `responseEncoding`، `http2Options` | — یا P `@omnifront/api-node` | L | تصمیم ۴ |

### ۴.۲ instance، interceptor و توابع کمکی

| قلم | جا | اولویت | توضیح |
|---|---|---|---|
| `getUri(config)` | M | M | `buildURL` از قبل در باندل است، فقط export نمی‌شود |
| `interceptors.request.use(fn, { runWhen })` | M | M | |
| `interceptors.*.clear()` | M | L | |
| `{ synchronous }` | — | — | زنجیره‌ی ما همیشه promise است |
| `postForm`، `putForm`، `patchForm` | E `/serialize` | M | |
| `toFormData`، `formToJSON` | E `/serialize` | M | |
| `mergeConfig` | M (فقط export) | L | |
| `isCancel(error)` | M | L | یک خط؛ برای مهاجرت |
| instance قابل‌فراخوانی `api(config)` | M | L | `api.request(config)` همان است |
| header پیش‌فرض برای هر متد (`defaults.headers.post`) | — | L | با request interceptor |
| `AxiosHeaders` | — | — | header ما آبجکت ساده با نام کوچک است |
| `HttpStatusCode` | E `/status` | L | |
| `axios.all` / `spread` | — | — | `Promise.all` |
| instance سراسری | — | — | عمداً نداریم |

### ۴.۳ خطا، پاسخ و پیشرفت

| قلم | جا | اولویت | توضیح |
|---|---|---|---|
| فیلدهای رویداد پیشرفت: `progress`، `bytes`، `rate`، `estimated`، `lengthComputable` | E `/progress` | M | یک پوشش دور callback |
| `error.toJSON()` | M | L | برای ارسال به Sentry |
| تفکیک `ERR_BAD_REQUEST` (4xx) از `ERR_BAD_RESPONSE` (5xx) | — | L | از `error.status` معلوم است |
| `error.request`، `response.request` | — | — | adapter مستقل از نوع درخواست است |

## ۵. ترتیب اجرا

هر فاز مستقل قابل انتشار است. قاعده‌ی سند پروژه پابرجاست: فاز بعد تا رسیدن فاز قبل به معیار خروج شروع نمی‌شود.

### فاز ۰: ADR-0013 (بدون کد)

- ثبت قاعده‌ی جایابی بخش ۲ و چهار تصمیم بخش ۱.
- دفتر بایت: تخمین هر قلم M در `query`، و اندازه‌ی واقعی بعد از هر merge.
- به‌روزرسانی ADR-0006 (بندهای ۳ و ۴) و بخش «بودجه» در `CLAUDE.md`.

خروج: ADR پذیرفته، بودجه‌ی جدید در `.size-limit.json`.

### فاز ۱: هر چه بایتی از ورودی‌های اصلی نمی‌خورد

1. تایپ: `TError` در `Query`، `QueryObserver`، `Mutation` و هر سه آداپتر، به‌علاوه‌ی `Register`. تست تایپ.
2. `@omnifront/query/options`: `queryOptions`، `mutationOptions`، `infiniteQueryOptions` با کلید تایپ‌دار.
3. `@omnifront/query/filters`: `refetchQueries`، `cancelQueries`، `ensureQueryData`، `setQueriesData`، `getQueriesData`، فیلترهای کامل، `refetchType`. (`removeQueries` و `resetQueries` به فاز ۳ می‌روند چون به `Query` دست می‌زنند.)
4. `@omnifront/query/events`: callbackهای سراسری کوئری و mutation.
5. `query-infinite`: `fetchInfiniteQuery`، `prefetchInfiniteQuery`، `ensureInfiniteQueryData`.
6. `@omnifront/api/serialize`، `@omnifront/api/progress`، و `basicAuth` + `withXsrf` در `@omnifront/api/auth`.

خروج: `query` و `api` اصلی بایتی بزرگ‌تر نشده‌اند؛ هر ورودی تازه بودجه در `.size-limit.json` دارد.

**وضعیت (2026-11-09):** هر شش قلم انجام شد؛ `query` اصلی ۳.۰۶KB و `api` اصلی ۲.۷KB ماندند. `TError` با ترتیب TanStack آمد (پارامتر دوم؛ پیش‌فرض `Error`، قابل تغییر با `Register`). این تغییر شکننده است: `Mutation<TData, TVariables>` حالا `Mutation<TData, TError, TVariables>` است، و `InfiniteQueryObserver<TPage, TPageParam>` حالا `<TPage, TError, TPageParam>`. `api.mutationOptions<TData, TVariables>` عوض نشده. تفاوت‌ها با متن بالا:

- `infiniteQueryOptions` در `@omnifront/query-infinite` است، نه `/options` (قانون وابستگی: `query` نمی‌تواند از `query-infinite` تایپ بگیرد).
- `refetchType` به فاز ۳ رفت: کش تابع `queryFn` کوئری‌های بدون observer را نگه نمی‌دارد، پس بدون تغییر در `Query` نمی‌شود کوئری غیرفعال را refetch کرد یا جلوی refetch کوئری فعال را گرفت. به همین دلیل `refetchQueries` فقط کوئری‌های observed را refetch می‌کند.
- فیلتر `stale` یعنی «invalidate شده یا بدون داده»؛ `staleTime` مال observer است و کش آن را نمی‌داند.
- `/events` فقط callbackهای سراسری را دارد. رویدادهای ریز کش (`added` / `removed` / `updated`) نیامده‌اند؛ `client.onChange` و `findQueries` فعلاً جای `getQueryCache().subscribe` / `findAll` را می‌گیرند.
- `formSerializer.visitor`، `metaTokens` و `maxDepth` پیاده نشده‌اند.

### فاز ۲: `api` اصلی (حدود ۱۳۰ بایت، در بودجه‌ی فعلی ۳KB جا می‌شود)

`withCredentials`، `fetchOptions`، `allowAbsoluteUrls`، `runWhen`، `getUri`، `isCancel`، export `mergeConfig`، `timeoutErrorMessage`، `parseReviver`. نگاشت `withCredentials` در `/xhr`.

خروج: بخش «Not supported» در `migrating-from-axios.md` فقط گزینه‌های Node و موارد «—» این سند را دارد.

**وضعیت (2026-11-09):** هر نه قلم انجام شد. `api` اصلی از ۲.۷KB به ۲.۸۳KB رسید (تخمین ۱۳۰ بایت بود؛ سقف ۳KB). `fetchOptions` درخواست جایگزین `fetchOptions` پیش‌فرض instance می‌شود، ادغام نمی‌شود.

### فاز ۳: `query` اصلی، بخش کوئری (نیازمند تصمیم ۱)

به این ترتیب، چون هر کدام روی قبلی سوار است:

1. فلگ‌های بولی و فیلدهای مشتق (`isPending` … `isRefetchError`، `failureReason`).
2. context کامل `queryFn` (`queryKey`، `meta`، `client`) و گزینه‌ی `meta`.
3. `defaultOptions`.
4. `refetchOnMount`، شکل‌های `"always"` و تابعی، `refetchIntervalInBackground`، `enabled` و `staleTime` تابعی.
5. `select`.
6. `Query.reset()` و حذف entry، سپس `removeQueries` و `resetQueries` در `/filters`.
7. `skipToken`، `initialDataUpdatedAt`، `refetch({ cancelRefetch })`، شکل تک‌آبجکتی `fetchQuery`.

هر قلم: تست در `query`، تست conformance برای هر سه آداپتر، به‌روزرسانی فهرست فیلد در Vue و Angular.

خروج: بخش «Renamed or changed» راهنمای TanStack فقط تفاوت‌های عمدی را دارد (`status`، ترتیب interceptor، notify همگام).

### فاز ۴: mutation و آفلاین

1. `Mutation`: callbackهای هر فراخوانی، فلگ‌ها، `mutationKey`، `meta`، `retry`، فیلدهای state.
2. `fetchStatus`، `networkMode`، `isPaused` برای کوئری.
3. `@omnifront/query/offline`: `scope`، توقف mutation در حالت آفلاین، `resumePausedMutations`.
4. `/activity`: فیلتر برای `useIsMutating`، `useMutationState` در هر سه آداپتر.
5. `persist` و `hydration`: mutationهای متوقف‌شده، `serializeData` / `deserializeData`، کوئری‌های pending.

خروج: مثال آفلاین (ثبت در حالت قطع، reload، ارسال بعد از وصل شدن) در هر چهار example کار می‌کند.

### فاز ۵: مخصوص آداپتر

React: `@omnifront/react/errors` (`throwOnError`، `QueryErrorResetBoundary`)، `useSuspenseQueries`، `usePrefetchQuery`، شکل آبجکتی `useQueries`. همان شکل آبجکتی برای Vue و Angular. Next: استریم کوئری‌های pending.

### فاز ۶: بسته‌های جدا (هر کدام فقط با درخواست واقعی)

`@omnifront/broadcast`، `@omnifront/query/stream`، `@omnifront/persist/query`، `@omnifront/eslint-plugin`، `@omnifront/api-node`.

## ۶. تعریف «تمام‌شده» برای هر قلم

- تست واحد در بسته‌ی خودش؛ اگر رفتار آداپتر را عوض می‌کند، تست در `packages/conformance`.
- `pnpm size` سبز، و عدد واقعی در دفتر بایت ADR-0013.
- سطر مربوط در `migrating-from-tanstack.md` یا `migrating-from-axios.md` از «نیست» به «همان» منتقل شده.
- صفحه‌ی API در `apps/docs/api/` به‌روز (`check-api.mjs` سبز).
- یک changeset.
- هیچ import از `react` / `vue` / `@angular/*` بیرون از آداپترها؛ `api` همچنان به `query` وابسته نیست.
