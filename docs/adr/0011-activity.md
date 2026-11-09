# ADR-0011: activity (useIsFetching و useIsMutating)

**وضعیت:** Accepted
**تاریخ:** 2026-11-09

## زمینه

شاخص بارگذاری سراسری (نوار پیشرفت بالای صفحه، اسپینر کنار لوگو) به شمارشی از «چند کوئری در حال گرفتن است» و «چند mutation در جریان است» نیاز دارد. در TanStack Query این `useIsFetching` و `useIsMutating` است و تنها موردی بود که README هنوز «اینجا نیست» می‌نوشت. دو قید مهم داریم:

- کش هیچ رویداد تغییری ندارد و هر `Query` فقط برای مشترکان خودش خبر می‌دهد. اگر ردیاب به هر `Query` مشترک شود، طبق ADR-0001 قاعده‌ی ۴ زمان‌سنج GC آن را لغو می‌کند و همه‌ی ورودی‌ها تا وقتی هوک mount است برای همیشه در کش می‌مانند.
- `Mutation` یک اسلات مستقل است: نه به client وصل است و نه `mutationKey` دارد؛ و `useMutation` امروز بدون provider هم کار می‌کند.
- بودجه‌ی `query` پر است (۲۹۹۹ از ۳۰۰۰ بایت، ADR-0006 و ADR-0010).

## تصمیم

1. `Query` با گزینه‌ی تازه‌ی `onChange` در هر تغییر state به client خبر می‌دهد و `QueryClient` متد `onChange(listener)` را برای گوش‌دادن به همه‌ی ورودی‌ها می‌دهد (و در `clear()` یک بار emit می‌کند). این تنها تغییر در ورودی اصلی است و بدون اشتراک جداگانه به هر کوئری، GC را دست‌نخورده می‌گذارد. **بودجه‌ی `@omnifront/query` از ۳KB به ۳.۱KB می‌رود** (فقط برای این هوک).
2. ورودی جدا `@omnifront/query/activity` (بودجه ۱KB) با سه تابع:
   - `createFetchingCount(client, filter?)`: `Subscribable<number>` از تعداد کوئری‌های در حال گرفتن؛ `filter` همان `InvalidateFilter` است (`queryKey` پیشوندی یا `exact`).
   - `createMutatingCount(client)`: `Subscribable<number>` از تعداد mutationهای `pending` ثبت‌شده برای آن client. فیلتر ندارد، چون mutation کلید ندارد.
   - `trackMutation(client, mutation)`: ثبت یک mutation در رجیستری client (با `WeakMap`)؛ تابع برگشتی ثبت را برمی‌دارد. اگر mutation هنوز `pending` است، برداشتن تا پایان آن به تعویق می‌افتد (مثل TanStack: unmount شدن کامپوننت یک mutation در جریان را از شمارش حذف نمی‌کند).
3. هر دو شمارنده طبق ADR-0001 تنبل‌اند: اولین subscribe وصل می‌شود، آخرین unsubscribe جدا می‌شود؛ فقط وقتی عدد عوض شود notify می‌کنند و `getSnapshot` وقتی مشترکی نیست تازه محاسبه می‌کند.
4. آداپترها هوک را در ورودی جدا `/activity` می‌دهند (مثل `/queries` و `/infinite`) تا بودجه‌ی ورودی اصلی‌شان نشکند: React `useIsFetching` و `useIsMutating` (عدد)؛ Vue همان نام‌ها (`ComputedRef<number>`)؛ Angular `injectIsFetching` و `injectIsMutating` (`Signal<number>`). `useMutation` / `injectMutation` در هر آداپتر mutation را با یک جست‌وجوی **اختیاری** client ثبت می‌کنند، پس بدون provider همچنان کار می‌کنند.
5. در SSR شمارنده‌ی سرور صفر است (`getServerSnapshot`).
6. بودجه‌های آداپتر: ورودی `/activity` هر آداپتر ۰.۶KB؛ و چون ثبت mutation به `useMutation` اضافه شد، بودجه‌ی ورودی اصلی **Vue از ۱KB به ۱.۱KB** می‌رود (اندازه‌ی واقعی ۱۰۱۴ بایت). React و Angular در بودجه‌ی قبلی ماندند.

## گزینه‌های ردشده

- اشتراک ردیاب به هر `Query`: GC را لغو می‌کند (بالا).
- polling مثل مدل devtools: تأخیر و کار بیهوده‌ی دائمی برای چیزی که باید فوری باشد.
- متد `isFetching()` روی `QueryClient`: غیرواکنشی است و بایت بیشتری از ورودی اصلی می‌خورد.
- رجیستری سراسری mutation (بدون client): بین درخواست‌های SSR نشت می‌کند و با چند client جور نیست.
- `mutationKey` و فیلتر برای `useIsMutating`: سطح API جدید برای نیازی که هنوز کسی نخواسته.

## پیامدها (مثبت و منفی)

مثبت: شکاف README بسته می‌شود؛ هزینه‌ای برای کسی که از activity استفاده نمی‌کند نیست جز حدود ۰.۱KB در `query`؛ همان `Subscribable` برای هر UI قابل استفاده است.
منفی: بودجه‌ی `query` شکسته شد (با این ADR ثبت شده)؛ `useMutation` حالا کمی کد ثبت دارد (و `trackMutation` از `/activity` وارد باندل آداپتر می‌شود)؛ کسی که `Mutation` را بی‌آداپتر می‌سازد باید خودش `trackMutation` را صدا بزند.

## معیار بازبینی

اگر `mutationKey` و فیلتر لازم شد، یا اگر devtools بخواهد به‌جای polling از `onChange` استفاده کند، ADR بازبینی شود. اگر ثبت mutation بیش از این رشد کرد، یا بودجه‌ی Vue دوباره شکست، همین ADR به‌روز می‌شود.
