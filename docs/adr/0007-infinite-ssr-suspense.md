# ADR-0007: infinite query، SSR برای Vue/Angular و Suspense

**وضعیت:** Proposed
**تاریخ:** 2026-11-09

## زمینه

سه شکاف باقی‌مانده نسبت به سند: لیست‌های صفحه‌به‌صفحه، SSR برای Vue و Angular (فقط React/Next داشت)، و Suspense در React. بودجه‌ی `query` (۳KB) پر بود.

## تصمیم

1. **`@omnifront/query-infinite` پکیج جدا.** `InfiniteQueryObserver` روی یک `QueryObserver` معمولی سوار است و entry کش `{ pages, pageParams }` است، پس staleness، retry، refetch روی focus، invalidation، hydration و persistence بدون تغییر کار می‌کنند. refetch همه‌ی صفحه‌های بارشده را به ترتیب دوباره می‌گیرد. `fetchNextPage` هرگز reject نمی‌شود (خطا در state). hookها هم در آداپترها به‌صورت subpath ‏`/infinite` هستند تا ورودی اصلی آداپتر بزرگ نشود.
2. **Vue SSR:** `useQuery` روی سرور subscribe نمی‌کند ولی `onServerPrefetch` ثبت می‌کند. در مرورگر رندر اول از snapshot مستقل از ساعت می‌آید و subscription **در `onMounted`** شروع می‌شود (نه `setup`)، چون fetch شروع‌شده در setup رندر اول را از HTML سرور جدا می‌کرد (تست hydration با ساعت مرورگر ۵۰۰ ثانیه جلو، این را گرفت). مثال Vite SSR واقعی هم اجرا شد. Nuxt فقط به‌صورت plugin مستند شد و در برنامه‌ی Nuxt واقعی اجرا نشده است.
3. **Angular SSR:** `provideOmnifrontSsr()` در `@omnifront/angular/ssr`: روی سرور با `PendingTasks` تا پایان همه‌ی fetchها صبر می‌کند (و fetchهای زنجیره‌ای را دنبال می‌کند) و cache را در `TransferState` می‌گذارد؛ در مرورگر قبل از هر کامپوننت hydrate می‌کند. با `renderApplication` واقعی `@angular/platform-server` تست شد، نه با اپ کامل `@angular/ssr`. Angular DOM را ساختاری hydrate می‌کند، پس مشکل متنِ وابسته به ساعت ندارد.
4. **Suspense:** `useSuspenseQuery` در `@omnifront/react/suspense`. بدون داده promise می‌اندازد (همان fetch در جریان، پس چند کامپوننت یک درخواست دارند) و خطا را به error boundary می‌اندازد. حالت state در کامپوننتی که suspend می‌شود حفظ نمی‌شود، پس هیچ چیز به state کامپوننت وابسته نیست؛ همه از cache می‌آید. **retry بعد از خطا با `invalidateQueries` در reset boundary** انجام می‌شود (query خطادارِ invalidated دوباره load می‌شود، نه throw)، بدون API جدید. `staleTime` پیش‌فرض ۱ ثانیه است تا داده‌ی تازه‌بارشده بلافاصله دوباره fetch نشود.

## گزینه‌های ردشده

- infinite در بسته‌ی `query`: بودجه را می‌شکست.
- hookهای infinite در خود `query-infinite` با import مستقیم فریم‌ورک: قاعده‌ی «فقط آداپترها فریم‌ورک را import کنند» را نقض می‌کرد.
- نگه‌داشتن «خطا شده بود، یک بار throw کردیم» در حافظه‌ی کامپوننت: در Suspense حافظه‌ی کامپوننت پایدار نیست.
- نوشتن یک Nuxt module کامل: وابستگی سنگین و غیرقابل‌تست در این repo؛ plugin مستند کافی است.

## پیامدها (مثبت و منفی)

مثبت: هر سه شکاف بسته شد، بدون لمس بودجه‌ی query؛ همه با تست و در صورت امکان با رندر واقعی.
منفی: refetch یک لیست طولانی چند درخواست است؛ `maxPages` نداریم. Nuxt و اپ کامل `@angular/ssr` اجرا نشده‌اند. `useSuspenseInfiniteQuery` نیست. در Vue، شروع fetch به mount موکول شد (اثرش در عمل صفر است چون mount همزمان است، ولی دیگر «قبل از mount» نیست).

## معیار بازبینی

اگر کاربری Nuxt یا اپ `@angular/ssr` واقعی را امتحان کرد و رفتار متفاوت بود، بخش مربوط بازنگری شود. اگر لیست‌های بلند مشکل شدند، `maxPages` اضافه شود.
