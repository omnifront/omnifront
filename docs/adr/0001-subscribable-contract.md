# ADR-0001: قرارداد Subscribable بین Core و آداپترها

وضعیت: پیشنهادی (Proposed)
تاریخ: 2026-11-07

### زمینه

Core باید بدون هیچ وابستگی به فریم‌ورک، state و نتیجه‌ی queryها رو نگه داره و تغییرات رو به رابط کاربری خبر بده. هر فریم‌ورک مدل reactivity خودش رو داره (React: رندر + useSyncExternalStore، Vue: ref و scope، Angular: Signals و RxJS). نیاز داریم یه نقطه‌ی اتصال کوچک و پایدار داشته باشیم که نوشتن آداپتر رو ساده کنه و هیچ فریم‌ورکی رو ترجیح نده.

### تصمیم

هر چیزی در core که UI بهش گوش می‌ده (مثل QueryObserver و Store) این اینترفیس رو پیاده می‌کنه:

```ts
export interface Subscribable<TSnapshot> {
  /** ثبت listener؛ تابع لغو اشتراک برمی‌گردونه */
  subscribe(listener: () => void): () => void
  /** وضعیت فعلی؛ تا وقتی چیزی تغییر نکرده باید همون reference قبلی باشه */
  getSnapshot(): TSnapshot
  /** اختیاری: snapshot مخصوص SSR */
  getServerSnapshot?(): TSnapshot
}
```


### قواعد اجباری:

Snapshot تغییرناپذیره (immutable). با هر تغییر، آبجکت جدید؛ بدون تغییر، همون reference. (شرط لازم React.)
Listener بدون آرگومانه. اطلاعات رو از getSnapshot() می‌خونن، نه از رویداد.
اشتراک هم‌زمان (synchronous) اطلاع می‌ده، ولی core اطلاع‌رسانی‌های پشت‌سرهم رو داخلی batch می‌کنه (notifyManager)، تا آداپتر نگران رندر اضافه نباشه.
اولین subscribe باعث شروع کار (مثلاً fetch) و آخرین unsubscribe باعث شروع شمارش gc می‌شه. lifecycle با تعداد subscriber مدیریت می‌شه، نه با فریم‌ورک.
هیچ API زمان‌بندی (setTimeout) مستقیم نباید در کد منطقی باشه؛ همه از Scheduler تزریقی بگیرن (تست‌پذیری).

نمونه‌ی آداپترها (قصد و شکل، نه کد نهایی):

```ts
// react
useSyncExternalStore(o.subscribe, o.getSnapshot, o.getServerSnapshot ?? o.getSnapshot)

// vue
const state = shallowRef(o.getSnapshot())
const off = o.subscribe(() => { state.value = o.getSnapshot() })
onScopeDispose(off)

// angular
const state = signal(o.getSnapshot())
const off = o.subscribe(() => state.set(o.getSnapshot()))
inject(DestroyRef).onDestroy(off)
```

### گزینه‌های ردشده

سیگنال/reactivity اختصاصی در core: پیچیدگی و حجم زیاد، و رقابت با مدل خود فریم‌ورک‌ها. ممکنه در نسخه‌های بعد اضافه بشه.
RxJS Observable به‌عنوان قرارداد: وابستگی سنگین؛ برای کاربر React/Vue ناخواسته.
EventEmitter با payload: snapshot رو از دست می‌دیم و SSR/hydration سخت می‌شه.

### پیامدها

مثبت: آداپتر هر فریم‌ورک حدود ۲۰ تا ۵۰ خط؛ تست مشترک ممکنه؛ SSR از طریق getServerSnapshot طبیعیه.
منفی: برای ویژگی‌های خاص هر فریم‌ورک (مثل Suspense در React یا resource() در Angular) باید لایه‌ی اضافه‌ای در آداپتر نوشته بشه؛ ممکنه granular reactivity (آپدیت فقط یه فیلد) رو نداشته باشیم و select لازم بشه.

### معیار بازبینی

اگه موقع نوشتن آداپتر Vue یا Angular مجبور شدیم این قرارداد رو عوض کنیم، این ADR رو دوباره باز می‌کنیم.