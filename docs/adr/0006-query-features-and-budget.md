# ADR-0006: ویژگی‌های جدید query و حسابداری بودجه‌ی حجم

**وضعیت:** Proposed
**تاریخ:** 2026-11-08

## زمینه

بعد از MVP، فاصله‌ی اصلی با TanStack Query این بود: refetch روی focus/reconnect، polling، `onMutate` برای optimistic update، `initialData`/`placeholderData`. بودجه‌ی `query` طبق تصمیم قطعی ۳KB است و این ویژگی‌ها آن را از مرز رد می‌کردند (۳.۰۲KB).

## تصمیم

1. اضافه شد: `refetchOnWindowFocus` / `refetchOnReconnect` (پیش‌فرض روشن، فقط داده‌ی stale را refetch می‌کنند)، `refetchInterval` (فقط وقتی صفحه دیده می‌شود)، `initialData`، `placeholderData` (+ `keepPreviousData` و `isPlaceholderData`)، `onMutate` با `context` برای رول‌بک، و حالت updater برای `setQueryData`.
2. `focusManager` و `onlineManager` از یک کلاس عمومی `EnvironmentSignal` ساخته می‌شوند که در **core** است (یک `Subscribable<boolean>` که فقط وقتی مشترک دارد به محیط وصل می‌شود، و با `set()` قابل override است برای React Native و تست). بودجه‌ی core از ۰.۷۳ به ۰.۸KB رسید و query در ۲.۹۸KB ماند، بدون تغییر بودجه‌ها. مجموع core+query بزرگ‌تر شده است (حدود ۳.۰۷KB با esbuild در بنچمارک)، و README بنچمارک بازبینی شد.
3. **`select` اضافه نشد.** `derive(observer, selector)` / `useStore(observer, selector)` همان کار را روی هر Subscribable می‌کند و نوع generic همه‌ی آداپترها (`UseQueryResult<TData>`) را پیچیده نمی‌کند.
4. `initialDataUpdatedAt` عمداً نیست (کم‌استفاده، و بایت می‌خورد).
5. در React، با هر کلید یک observer جدید ساخته می‌شود (ADR-0005)، پس `keepPreviousData` باید داده‌ی قبلی را منتقل کند: `observer.inherit(previous)`. Vue و Angular یک observer دارند و `setOptions` می‌زنند، پس به آن نیاز ندارند. هر سه با یک تست conformance مشترک (صفحه‌بندی با placeholder) راستی‌آزمایی شدند.

## گزینه‌های ردشده

- بالا بردن بودجه‌ی query به ۴KB: تصمیم قطعی سند است و حفظ آن اولویت بود.
- refetch روی focus به‌صورت opt-in: با پیش‌فرض TanStack یکی نبود و مهاجرت را گیج می‌کرد.
- ویژگی‌ها در subpath جدا (مثل hydration): refetch/polling باید داخل observer باشند و جدا نمی‌شوند.

## پیامدها (مثبت و منفی)

مثبت: فاصله‌ی ویژگی با TanStack برای کاربردهای رایج بسته شد؛ هیچ آداپتری جز افزودن فیلد `isPlaceholderData` تغییر نکرد؛ تست‌های conformance برای هر ویژگی روی هر سه فریم‌ورک.
منفی: بودجه‌ی query اکنون تقریباً پر است (۲.۹۸ از ۳KB)؛ ویژگی بعدی (مثل infinite query) باید در بسته‌ی جدا یا با بازنگری بودجه بیاید. `refetchOnWindowFocus` پیش‌فرض روشن، رفتار شبکه‌ی بیشتری ایجاد می‌کند (با `staleTime` قابل کنترل است).

## معیار بازبینی

هر ویژگی بعدی که query را از ۳KB رد کند: یا بسته‌ی جدا (`@unicore/query-infinite`) یا ADR جدید برای تغییر بودجه.
