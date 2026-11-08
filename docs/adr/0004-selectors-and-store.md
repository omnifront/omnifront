# ADR-0004: انتخاب‌گر (derive) و پکیج store

**وضعیت:** Proposed
**تاریخ:** 2026-11-08

## زمینه

ADR-0001 گفته بود چون Subscribable فقط کل snapshot را می‌دهد، «granular reactivity» نداریم و یک `select` لازم می‌شود. همچنین `getServerSnapshot` تا الان استفاده نشده بود. فاز store هم باید state با selector، action و آداپتر برای هر سه فریم‌ورک بدهد.

## تصمیم

1. **`derive(source, selector, equals?)` در core** (نه در store). هر `Subscribable` (Store، QueryObserver، ...) را می‌گیرد و یک `Subscribable` از یک برش آن برمی‌گرداند. فقط وقتی listener صدا زده می‌شود که برش تغییر کرده باشد (`Object.is` یا `shallowEqual`). چون روی خود قرارداد کار می‌کند، یک مدل ذهنی برای query و store است و آداپترها فقط یک تابع (`useStore` / `useStore` / `injectStore`) دارند.
2. **`getServerSnapshot` در `derive` پیاده شد**: برش snapshot سروری منبع را (یا در نبودش snapshot زنده را) با cache جدا و پایدار برمی‌گرداند. React در hydration از آن استفاده می‌کند.
3. **پکیج `@omnifront/store`**: `Store` (کلاس) و `createStore(initial | (set, get) => state)`. state یک آبجکت ساده است و action ها داخل آن (سبک zustand). هر `setState` یک snapshot جدید می‌سازد، تغییر بی‌اثر نادیده گرفته می‌شود، و `getServerSnapshot()` همیشه state اولیه است. `reset()` هم هست.
4. **آداپترها**: `useStore(source, selector?, equals?)` در React و Vue، `injectStore(...)` در Angular. selector باید پایدار باشد (در React)؛ وگرنه فقط هر رندر دوباره subscribe می‌شود.

## گزینه‌های ردشده

- `select` به‌عنوان گزینه‌ی هر آداپتر: منطق سه بار تکرار می‌شود.
- `derive` در پکیج store: query هم به آن نیاز دارد و قاعده‌ی وابستگی اجازه نمی‌دهد query از store import کند.
- Proxy برای ردیابی خودکار فیلدها (سبک Valtio/Pinia): حجم و پیچیدگی زیاد؛ می‌تواند بعداً اضافه شود.

## پیامدها (مثبت و منفی)

مثبت: یک مفهوم برای همه؛ آداپترها کوچک ماندند (کمتر از ۱KB)؛ تست مشترک conformance برای store هم روی هر سه فریم‌ورک اجرا می‌شود.
منفی: core حدود ۳۰۰ بایت بزرگ‌تر شد (۰.۷KB از ۱KB). selector ناپایدار در React هزینه‌ی subscribe مجدد دارد. هنوز middleware / persistence / devtools نداریم.

## معیار بازبینی

اگر بودجه‌ی core از ۱KB گذشت، `derive` به پکیج جدا (`@omnifront/select`) برود یا بودجه عوض شود. اگر فاز SSR نشان داد snapshot سروری برای query هم باید serialize شود، این ADR و ADR-0001 دوباره باز می‌شوند.
