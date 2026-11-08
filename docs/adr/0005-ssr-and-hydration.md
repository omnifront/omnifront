# ADR-0005: SSR، dehydrate/hydrate و پکیج next

**وضعیت:** Proposed
**تاریخ:** 2026-11-08

## زمینه

فاز ۵ می‌خواهد داده روی سرور prefetch شود، به Client Component برسد، بدون اختلاف HTML (hydration mismatch) و بدون نشت state بین درخواست‌ها.

## تصمیم

1. **`dehydrate(client)` / `hydrate(client, state)`** در `@omnifront/query/hydration` (subpath جدا تا بودجه‌ی ۳KB بسته‌ی اصلی نخورد). حالت dehydrated یک JSON ساده است: `{ queries: [{ queryKey, data, dataUpdatedAt }] }`، فقط کوئری‌های موفق. `hydrate` هرگز داده‌ی تازه‌تر را بازنویسی نمی‌کند، پس تکرارش امن است. زمان سرور که از ساعت مرورگر جلوتر باشد به «اکنونِ مرورگر» محدود می‌شود.
2. **snapshot سروری قطعی**: `QueryObserver.getServerSnapshot()` هیچ‌وقت ساعت را نمی‌خواند؛ `isStale` را «در لحظه‌ی رسیدن داده» می‌سنجد (فقط `staleTime` صفر، داده‌ی خالی یا invalidated یعنی stale). React هم روی سرور و هم موقع hydration از همین استفاده می‌کند. چون سرور و مرورگر درباره‌ی «الان» اختلاف دارند، `isStale` زمان‌محور باعث mismatch می‌شد؛ تست با ساعت مرورگر ۵۰۰ ثانیه جلوتر دقیقاً همین را گرفت (با جایگزینی موقت `getServerSnapshot` با `getSnapshot` تست شکست خورد).
3. **`HydrationBoundary`** (در `@omnifront/react`): داده را هنگام رندر (نه در effect) داخل cache می‌گذارد تا رندر اول مرورگر با HTML سرور یکی باشد. idempotent است.
4. **`@omnifront/next`** با دو entry: `@omnifront/next` (امن برای سرور: `getQueryClient` با `React.cache`، `createServerQueryClient`، `dehydrate`) و `@omnifront/next/client` (با `"use client"`: `OmnifrontProvider`، `HydrationBoundary`، hookها). client سروری `gcTime: Infinity` دارد تا تایمر معلق نماند. هر درخواست client خودش را دارد.
5. App Router و Pages Router هر دو همان `dehydrate` + `HydrationBoundary` را استفاده می‌کنند (Pages: prop از `getServerSideProps`).

## گزینه‌های ردشده

- singleton سراسری برای client سروری: state بین کاربران نشت می‌کند.
- hydrate داخل `useEffect`: رندر اول بدون داده می‌شود و mismatch / پرش ایجاد می‌کند.
- سریال‌سازی خودکار Date/Map: سربار و پیچیدگی؛ داده باید JSON-safe باشد (تبدیل در `queryFn`).
- streaming / promise در حال انجام (React `use`): بعداً، وقتی لازم شد.

## پیامدها (مثبت و منفی)

مثبت: بدون flash و بدون fetch اضافه در لود (در مثال: ۰ درخواست شبکه‌ی اولیه)؛ تست mismatch خودکار؛ همان API برای دو router.
منفی: داده‌ی کوئری باید JSON-safe باشد؛ `isStale` در hydration برای staleTime های خیلی کوچک (کمتر از زمان رندر) ممکن است با سرور تفاوت لحظه‌ای داشته باشد (فقط تا mount). برای کاربرانی که پکیج را از npm نصب می‌کنند (نه workspace) رفتار bundling/externals در Next هنوز تست نشده، فقط در monorepo.

## معیار بازبینی

اگر Nuxt یا Angular SSR نیاز به شکل دیگری از state سریال‌شده داشت (مثلاً `TransferState`)، `DehydratedState` باید بازنگری شود. اگر کاربران streaming بخواهند، پشتیبانی از کوئری‌های pending اضافه می‌شود.
