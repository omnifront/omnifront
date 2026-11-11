# ADR-0008: سازگاری نسخه‌ها، بسته‌بندی و ابزارهای تکمیلی

**وضعیت:** Accepted
**تاریخ:** 2026-11-09

## زمینه

تا اینجا همه‌ی تست‌ها روی آخرین نسخه‌ی فریم‌ورک‌ها اجرا می‌شد، ولی سند ادعا می‌کرد React ≥ 18، Vue ≥ 3.3، Angular ≥ 17، Next ≥ 14 را پشتیبانی می‌کنیم. چند شکاف ویژگی هم باقی بود (`useQueries`، structural sharing، `maxPages`، `useSuspenseInfiniteQuery`).

## تصمیم

1. **ماتریس نسخه‌ی قدیمی** (`scripts/test-matrix.sh`، CI هفتگی): تست کامل هر فریم‌ورک با کمترین نسخه‌ی ادعاشده (React 18.3.1، Vue 3.3.13، Angular 17.3 و 18.2) با override در pnpm روی یک کپی موقت از repo. لایه‌ی سازگاری فقط در **تست‌ها** است (`test/compat.ts`: نام ‏`provideZonelessChangeDetection`، `TestBed.tick`، پلتفرم JIT، zone.js)، نه در کتابخانه.
2. **تست بسته‌بندی** (`scripts/check-packages.sh`): `pnpm pack` + `publint` + `arethetypeswrong`. باگ واقعی پیدا کرد: شرط `require` در export map به `.d.ts` (ESM) اشاره می‌کرد؛ حالا هر شرط `types` خودش را دارد (`.d.cts` برای CJS). فیلد `engines.node >= 18` اضافه شد.
3. **تست مصرف‌کننده‌ی واقعی** (`scripts/consumer-next.sh`): بسته‌های pack‌شده (نه لینک workspace) در یک اپ Next بیرونی نصب و build می‌شوند و HTML هر دو router بررسی می‌شود (Next 14.2، 15 و 16). باگ واقعی پیدا کرد: Next 14 فایل `"use client"` منتشرشده به‌صورت **ESM** را درست نمی‌خواند (در RSC/SSR export‌ها را نمی‌بیند)، پس `@omnifront/next/client` به‌صورت CJS منتشر می‌شود (Node و bundlerهای جدید آن را درست می‌خوانند؛ `attw` فقط هشدار false-positive «named exports» می‌دهد و برای همین بسته قاعده‌اش را نادیده می‌گیرد).
4. **`combine(sources)` در core** (۹۴۴ از ۱۰۰۰ بایت): `Subscribable` از آرایه‌ی snapshotها. `useQueries` / `injectQueries` روی آن ساخته شدند. برای اینکه تغییرهای زنجیره‌ای (derive، combine) یک بار خبر بدهند، `notifyManager` حین flush هم «داخل batch» می‌ماند و در دورهای متوالی listener تکراری را حذف می‌کند.
5. **structural sharing اختیاری:** `replaceEqualDeep` در `@omnifront/query/structural` و گزینه‌ی `new QueryClient({ structuralSharing })`. پیش‌فرض خاموش تا بودجه‌ی `query` (۳KB) نشکند؛ برای جا شدن، تابع `noop` بین ماژول‌ها مشترک شد و `getQueries()` مستقیماً entryها (`{ key, query }`) را برمی‌گرداند. حجم `query` الان دقیقاً روی ۳KB است و جایی برای بیشتر ندارد.
6. **`maxPages`** برای infinite query و **`useSuspenseInfiniteQuery`** (با هوک مشترک `useObservedInfinite`).
7. **اپ‌های واقعی:** `examples/angular-ssr` (`@angular/ssr` + Express) و `examples/nuxt` (Nuxt 4) در مرورگر واقعی بررسی شدند: HTML دارای داده، بدون هشدار hydration و بدون درخواست اولیه. یافته‌ها: تنظیمات Angular باید تابعی باشد که برای هر درخواست صدا زده شود (وگرنه یک QueryClient بین همه‌ی کاربران مشترک می‌شود) و `allowedHosts` لازم است.

## گزینه‌های ردشده

- لایه‌ی سازگاری Angular 17 در خود کتابخانه: فقط انتظار سرور (`PendingTasks`) در 17 وجود ندارد؛ آن را مستند کردیم و در 17 تست‌های مربوط را skip می‌کنیم.
- ESM برای `@omnifront/next/client`: در Next 14 کار نمی‌کند.
- روشن‌بودن پیش‌فرض structural sharing: هزینه‌ی مقایسه‌ی عمیق در هر fetch و بایت.
- بالا بردن بودجه‌ی `query`: تصمیم قطعی سند است.

## پیامدها (مثبت و منفی)

مثبت: ادعای نسخه‌ها با تست پشتیبانی می‌شود؛ باگ بسته‌بندی و باگ Next 14 قبل از انتشار پیدا شد؛ SSR در چهار برنامه‌ی واقعی تأیید شد.
منفی: CI سنگین‌تر شد (workflow جدا `compat.yml`؛ بیلد مثال‌های Nuxt و Angular هم به `pnpm build` اضافه شد). هشدار `attw` برای `next/client` و `node10` (نادیده) باقی است. بودجه‌ی `query` پر است. Angular 17: انتظار سرور پشتیبانی نمی‌شود.

## معیار بازبینی

اگر Next نسخه‌ای ESM-اول بخواهد یا Next 14 از پشتیبانی خارج شود، `client` دوباره ESM شود. هر ویژگی جدید `query` یا بسته‌ی جدا است یا ADR تغییر بودجه.
