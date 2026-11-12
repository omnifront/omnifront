# ADR-0014: پکیج‌های UI (کتابخانه‌ی کامپوننت در سطح MUI)

**وضعیت:** Accepted
**تاریخ:** 2026-11-11 (پذیرش: 2026-11-12)

## زمینه

تا امروز omnifront فقط لایه‌ی داده است (`query`، `store`، `api`) و هیچ چیز قابل‌دیدنی ندارد. هدف تازه: یک کتابخانه‌ی کامپوننت با امکانات اصلی MUI (theme، حالت تیره، کامپوننت‌های اصلی، دسترس‌پذیری) که همان قواعد بقیه‌ی پروژه را رعایت کند: در React، Next، Vue و Angular یکسان کار کند و با بقیه‌ی بسته‌ها هماهنگ باشد.

قیدها:

- **قاعده‌ی سخت (ADR-0003):** فقط آداپترها حق import از `react`، `vue` یا `@angular/*` دارند. کامپوننت بدون فریم‌ورک رندر نمی‌شود، پس باید روشن شود منطق مشترک کجاست و مرز کجا می‌افتد.
- **قرارداد `Subscribable` (ADR-0001):** هر چیزی که UI به آن گوش می‌دهد باید همین قرارداد را داشته باشد؛ زمان‌سنج‌ها فقط از راه `Scheduler`.
- **SSR:** Next (App Router و RSC)، Nuxt و Angular SSR پشتیبانی می‌شوند (ADR-0005). موتور CSS-in-JS زمان اجرا (روش MUI با Emotion) در RSC کار نمی‌کند و در Vue و Angular معادل طبیعی ندارد.
- **بودجه:** به گفته‌ی مالک پروژه، حجم برای این بسته‌ها اولویت نیست؛ کامل بودن اولویت است. ادعای «core + query حدود ۵KB» نباید آسیب ببیند.
- **حجم کار:** MUI Core حدود ۶۰ کامپوننت دارد. نوشتن سه‌باره‌ی کامل آن‌ها از کل کار انجام‌شده تا امروز بزرگ‌تر است؛ ریسک «scope creep» در CLAUDE.md همین‌جا فعال می‌شود.

«شبیه MUI» در این ADR یعنی: همان فهرست کامپوننت، همان مدل theme و نام prop‌های آشنا (`variant`، `color`، `size`، `slots`، `slotProps`) تا مهاجرت ساده باشد. کد، نام و نشان MUI کپی نمی‌شود. ظاهر پیش‌فرض از Material Design پیروی می‌کند ولی با توکن‌های خود ما.

## تصمیم

### ۱. معماری سه‌لایه

```
@omnifront/ui            منطق بدون فریم‌ورک: theme، ماشین‌های رفتار، ابزار a11y، و CSS آماده
@omnifront/ui-react      کامپوننت‌های React   (روی ui + react)
@omnifront/ui-vue        کامپوننت‌های Vue     (روی ui + vue)
@omnifront/ui-angular    کامپوننت‌های Angular (روی ui + angular)
```

- **رفتار یک بار نوشته می‌شود.** هر کامپوننت تعاملی (Dialog، Menu، Select، Tabs، Slider، ...) در `@omnifront/ui` یک «ماشین» دارد: `createDialog(options)` یک `Subscribable<DialogState>` به‌علاوه‌ی actionها برمی‌گرداند و تابع `connect(snapshot)` نقشه‌ای خنثی از attributeها و handlerها می‌دهد (`role`، `aria-*`، `data-state`، `onClick`، `onKeydown`). این همان الگوی Zag.js است و دقیقاً روی ADR-0001 می‌نشیند.
- **ظاهر یک بار نوشته می‌شود.** CSS ایستا در `@omnifront/ui` است (بخش ۳). هر سه فریم‌ورک همان کلاس‌ها و همان DOM را تولید می‌کنند.
- **فقط رندر سه بار نوشته می‌شود.** بسته‌های `ui-*` نازک‌اند: ماشین را با سازوکار آداپتر موجود وصل می‌کنند (`useSyncExternalStore` / `shallowRef` + `onScopeDispose` / `signal` + `DestroyRef`) و خروجی `connect` را روی المنت می‌گذارند.
- کامپوننت‌های بدون رفتار (Button، Paper، Typography، Card، Divider، ...) ماشین ندارند؛ فقط CSS مشترک و یک تابع مشترک برای ساختن نام کلاس از propها.

یادداشت‌های مخصوص فریم‌ورک:

- **Angular:** قالب نمی‌تواند یک آبجکت prop را روی المنت پخش کند (معادل `{...props}` ندارد). پس خروجی `connect` با directive و host binding اعمال می‌شود، و `slots` با `ng-content` و `TemplateRef` ساخته می‌شود. کامپوننت‌ها standalone و مبتنی بر signal input هستند.
- **Vue:** `v-bind="api.triggerProps"` مستقیم کار می‌کند؛ `slots` همان slotهای Vue است؛ `v-model` برای مقدار کنترل‌شده.
- **React:** `value` / `onChange` و `slots` / `slotProps` مثل MUI. فایل‌های تعاملی `"use client"` دارند؛ چون CSS ایستاست، در RSC به registry یا provider برای استایل نیاز نیست.

### ۲. قواعد وابستگی (اصلاحیه‌ی ADR-0003 هنگام پذیرش)

```
ui          → core, store
ui-react    → ui, react   (+ peer: react)
ui-vue      → ui, vue     (+ peer: vue)
ui-angular  → ui, angular (+ peer: @angular/core, @angular/common)
```

- `ui` هرگز از `query` یا `api` import نمی‌کند (مثل ADR-0009: هماهنگی ساختاری است).
- بسته‌های `ui-*` در رده‌ی «آداپتر» قرار می‌گیرند و مجازند فریم‌ورک خودشان را import کنند. قاعده‌ی سخت به این شکل می‌ماند: «هیچ بسته‌ای جز آداپترها و `ui-*`».
- `ui` به DOM دست می‌زند (فوکوس، اندازه‌گیری، قفل اسکرول)، ولی فقط بعد از mount و هرگز هنگام import، تا در SSR امن بماند.
- تنها وابستگی خارجی مجاز: `@floating-ui/dom` برای جای‌گذاری Popper، فقط در ورودی `@omnifront/ui/position`.

### ۳. Theme و استایل: CSS ایستا + متغیرهای CSS، بدون موتور زمان اجرا

- **`createTheme(options)`** در `@omnifront/ui` (بدون فریم‌ورک) با همان شکل MUI: `palette` (primary، secondary، error، warning، info، success، grey، text، background، divider، action)، `typography` (variantها)، `spacing`، `breakpoints`، `shape`، `shadows`، `transitions`، `zIndex`، `direction` و `components` (برای `defaultProps` و variantهای سفارشی).
- theme به **متغیرهای CSS** تبدیل می‌شود (`--omni-palette-primary-main` و ...). دو راه خروجی: `themeToCss(theme)` که رشته‌ی CSS می‌دهد (برای SSR و build) و `applyTheme(theme, element)`.
- **حالت روشن و تیره:** `colorSchemes: { light, dark }` و attribute `data-omni-color-scheme` روی ریشه. حالت انتخابی (`light` / `dark` / `system`) در یک `Store` از `@omnifront/store` نگه داشته می‌شود و با همان `useStore` / `injectStore` خوانده می‌شود. برای SSR یک اسکریپت کوچک inline جلوی چشمک زدن را می‌گیرد.
- **theme تودرتو:** `ThemeProvider` در هر فریم‌ورک فقط یک المنت با متغیرهای بازنویسی‌شده می‌سازد (محدوده‌ی CSS)؛ context فقط برای `defaultProps` لازم است.
- **RTL:** همه‌ی CSS با ویژگی‌های منطقی نوشته می‌شود (`margin-inline-start`، `inset-inline-end`)، پس `dir="rtl"` بدون پلاگین کار می‌کند.
- **سفارشی‌سازی:** همه‌ی استایل‌ها در `@layer omnifront` هستند تا CSS کاربر همیشه برنده شود. راه‌های رسمی: متغیرهای CSS، `class`، `slots` / `slotProps`، attributeهای حالت (`data-state`، `data-disabled`) و `theme.components`.
- **`styled()` و `sx` کامل وجود ندارد.** کامپوننت‌های چیدمان (`Box`، `Stack`، `Grid`، `Container`) propهای سیستمی محدود و تایپ‌شده می‌گیرند (`p`، `m`، `gap`، `display`، `color`، ... با مقدار واکنش‌گرا به breakpoint) که به کلاس و متغیر CSS تبدیل می‌شوند، نه به استایل تزریق‌شده.
- `CssBaseline` یک فایل CSS است (`@omnifront/ui/baseline.css`).

### ۴. هماهنگی با بقیه‌ی بسته‌ها

- ماشین‌ها `Subscribable` هستند، اعلان‌هایشان از `notifyManager` می‌گذرد و زمان‌سنج‌ها (تأخیر Tooltip، بسته شدن خودکار Snackbar، انیمیشن خروج) از `Scheduler`؛ پس در تست بدون زمان واقعی اجرا می‌شوند.
- `derive` برای خواندن برشی از حالت ماشین (مثلاً فقط `open`) همان است که برای query و store هست.
- با `query` فقط از راه prop: `<Button loading={mutation.isPending}>`، `<Skeleton>` با `isPending`، `<Pagination>` با کلید کوئری. کامپوننتی که خودش fetch کند وجود ندارد. اگر الگوهای تکراری دیده شد (Autocomplete ناهمگام، Snackbar برای خطای mutation)، در ورودی فرعی `@omnifront/ui-*/query` می‌آیند (ADR-0013 ردیف ۲).
- شناسه‌های پایدار برای SSR: `useId` در React؛ در Vue ≥ 3.5 `useId` و برای ۳.۳ و ۳.۴ شمارنده‌ی provider؛ در Angular شمارنده‌ی تزریق‌شده در سطح اپ.
- پنل devtools (ADR-0012) DOM خام می‌ماند و از این بسته‌ها استفاده نمی‌کند.

### ۵. فهرست کامپوننت‌ها و موج‌ها

هر موج فقط وقتی تمام است که در **هر سه** فریم‌ورک، با تست conformance و مستندات، آماده باشد (ادامه‌ی قاعده‌ی «یک قابلیت، سه آداپتر، یک تغییر»).

| موج | محتوا |
|---|---|
| ۰. پایه | `createTheme`، متغیرهای CSS، حالت تیره، RTL، `ThemeProvider`، `CssBaseline`، ابزارهای مشترک (تله‌ی فوکوس، قفل اسکرول، پشته‌ی لایه‌ها، roving tabindex، Portal، جای‌گذاری). **پنج کامپوننت اثبات:** Button، TextField، Dialog، Menu، Tabs |
| ۱. ورودی‌ها | ButtonGroup، IconButton، Fab، Checkbox، Radio و RadioGroup، Switch، Slider، Rating، ToggleButton، Select، FormControl و FormLabel و FormHelperText، InputAdornment، TextareaAutosize |
| ۲. نمایش و سطح | Typography، Paper، Card، Divider، Avatar، Badge، Chip، List، Table، Tooltip، SvgIcon، Accordion، AppBar، Toolbar |
| ۳. بازخورد و ناوبری | Alert، Snackbar، Backdrop، CircularProgress، LinearProgress، Skeleton، Drawer، Popover، Breadcrumbs، Link، Pagination، Stepper، BottomNavigation، SpeedDial |
| ۴. چیدمان و ابزار | Box، Container، Grid، Stack، ImageList، Modal، Popper، ClickAwayListener، گذارها (Fade، Grow، Collapse، Slide، Zoom)، `useMediaQuery`، NoSsr، Autocomplete |

بیرون از دامنه (معادل MUI X و چیزهای دیگر): DataGrid، انتخابگر تاریخ، نمودار، TreeView، بسته‌ی آیکون، و اعتبارسنجی فرم (غیرهدف v1 در CLAUDE.md؛ ورودی‌ها فقط `error` و `helperText` می‌گیرند).

### ۶. Build، تست و بودجه

- **Build:** `ui` و `ui-react` با `tsup` (مثل بقیه). `ui-angular` با `ng-packagr` (کامپوننت قالب‌دار به کامپایلر Angular نیاز دارد؛ ADR-0002 همین را پیش‌بینی کرده بود). `ui-vue` با SFC و حالت کتابخانه‌ی Vite به‌علاوه‌ی `vue-tsc`.
- **ورودی جدا برای هر کامپوننت** (`@omnifront/ui-react/button`) به‌علاوه‌ی ورودی اصلی؛ CSS هر کامپوننت هم جدا قابل import است و هم یک‌جا (`@omnifront/ui/styles.css`).
- **تست رفتار:** ماشین‌ها در `ui` تست واحد دارند. `packages/conformance` یک مجموعه‌ی UI می‌گیرد: برای هر کامپوننت یک سناریو (صفحه‌کلید، فوکوس، `aria-*`، حالت کنترل‌شده و کنترل‌نشده، `axe`) که روی هر سه فریم‌ورک اجرا می‌شود.
- **تست ظاهر:** چون DOM و CSS مشترک است، یک داستان در سه فریم‌ورک باید تصویر یکسان بدهد؛ مقایسه‌ی تصویری با Playwright همین را در CI چک می‌کند.
- **بودجه:** برای `ui*` در v0 سقف سخت نیست؛ `size-limit` اندازه‌ی هر ورودی را ثبت و گزارش می‌کند و رشد بیش از ۱۰٪ در یک PR باید توضیح داشته باشد. بودجه‌ی بسته‌های موجود دست نمی‌خورد و هیچ‌کدام به `ui` وابسته نمی‌شوند.

## گزینه‌های ردشده

- **Web Components (Lit یا custom element خام) با پوسته‌ی نازک:** یک پیاده‌سازی، ولی SSR به declarative shadow DOM وابسته می‌شود، React 18 (که پشتیبانی می‌کنیم) prop و event المنت سفارشی را درست نمی‌فهمد، ارجاع `aria` از مرز shadow رد نمی‌شود، و `slots` / `slotProps` و theme تودرتو سخت می‌شوند. نتیجه در هیچ فریم‌ورکی «بومی» حس نمی‌شود.
- **سه پیاده‌سازی کاملاً مستقل:** سه برابر کار و سه مجموعه باگ a11y؛ زاویه‌ی تمایز (منطق مشترک بین فریم‌ورک‌ها) از دست می‌رود.
- **کامپایل از یک منبع (Mitosis):** خروجی برای کامپوننت‌های پیچیده (فوکوس، Portal، انیمیشن خروج) قابل‌اعتماد نیست و اشکال‌زدایی روی کد تولیدشده است.
- **CSS-in-JS زمان اجرا (Emotion، مثل MUI):** در RSC کار نمی‌کند، در Vue و Angular سه پیاده‌سازی جدا می‌خواهد، و هزینه‌ی زمان اجرا دارد.
- **Tailwind به‌عنوان لایه‌ی استایل:** وابستگی build به مصرف‌کننده تحمیل می‌کند و مدل theme به سبک MUI را نمی‌دهد.
- **گذاشتن کامپوننت‌ها در آداپترهای موجود** (`@omnifront/react/ui`): چرخه‌ی انتشار و build متفاوت (ng-packagr، SFC) و حجم بسیار بزرگ‌تر؛ طبق ADR-0013 ردیف ۴ بسته‌ی جدا.
- **پوشاندن MUI / Vuetify / Angular Material با یک API مشترک:** سه ظاهر و سه رفتار متفاوت؛ «یکسان در همه‌ی فریم‌ورک‌ها» به دست نمی‌آید.

## پیامدها (مثبت و منفی)

مثبت: رفتار، دسترس‌پذیری و ظاهر یک بار نوشته می‌شوند و فقط رندر تکرار می‌شود؛ تیم چندفریم‌ورکی یک design system واقعی با یک theme می‌گیرد (قوی‌ترین نمونه برای زاویه‌ی تمایز)؛ لایه‌ی بدون UI (`@omnifront/ui`) به‌تنهایی هم قابل‌استفاده است؛ RSC، Nuxt و Angular SSR بدون تنظیم اضافه کار می‌کنند؛ RTL رایگان است.

منفی:
- بزرگ‌ترین گسترش دامنه‌ی پروژه تا امروز؛ هر کامپوننت هنوز سه لایه‌ی رندر، سه مستند و سه مجموعه‌ی تایپ دارد.
- نبود `sx` و `styled` یعنی مهاجرت از MUI «عوض کردن import» نیست؛ راهنمای مهاجرت باید این را صریح بگوید.
- دو pipeline تازه‌ی build (ng-packagr، Vite) و تست تصویری زمان CI را بالا می‌برند و احتمالاً معیار افزودن Turborepo (CLAUDE.md بخش ۲) فعال می‌شود.
- زاویه‌ی «حجم کم» برای این بسته‌ها صدق نمی‌کند و README باید آن را فقط برای لایه‌ی داده ادعا کند.
- اعمال `connect` در Angular با directive پیچیده‌تر از دو فریم‌ورک دیگر است و ممکن است شکل `connect` را عوض کند.

با پذیرش به‌روز شدند: ADR-0003، `.dependency-cruiser.cjs` و `CLAUDE.md` (ساختار، قواعد وابستگی، نقشه‌ی راه). `.size-limit.json` وقتی به‌روز می‌شود که اولین بسته‌ی `ui` خروجی build داشته باشد (ورودی بدون فایل، `size-limit` را در CI می‌شکند).

## تصمیم‌های گرفته‌شده روی پرسش‌های باز (2026-11-12)

پرسش بازی نمانده است.

- **زبان بصری پیش‌فرض: Material Design 2**، همان پایه‌ی theme پیش‌فرض MUI (مقیاس تایپوگرافی، ۲۴ سطح elevation، ripple، گوشه‌ی ۴px، فاصله‌ی ۸px). دو نمونه از هویت بصری خود omnifront (بر پایه‌ی رنگ‌های `docs/brand`) بررسی و رد شد. Material 3 انتخاب نشد چون هدف آشنایی برای کاربر MUI است. رنگ‌های برند فقط در سایت مستندات و مثال‌ها، به شکل یک theme نمونه با `createTheme`، می‌آیند.

- **نام بسته‌ها:** `@omnifront/ui` و `@omnifront/ui-react` / `ui-vue` / `ui-angular` می‌مانند. همان الگوی موجود است (`query` + `react`)، با یک پیشوند قابل‌حدس، و با عرف اکوسیستم می‌خواند (`@ark-ui/react`، `@headlessui/vue`). بسته‌ی جدا با نام `headless` اضافه نمی‌شود تا تعداد نام‌ها کم بماند.
- **`sx`:** propهای سیستمی فقط روی کامپوننت‌های چیدمان (بخش ۳). `sx` روی همه‌ی کامپوننت‌ها فعلاً نه.
- **Vue:** SFC با حالت کتابخانه‌ی Vite و `vue-tsc` (بخش ۶).
- **زمان‌بندی:** کار قبل از فاز ۷ (انتشار) شروع می‌شود؛ فاز ۷ همچنان متوقف است.

## نتیجه‌ی موج ۰ (2026-11-12)

موج ۰ روی شاخه‌ی `feat/ui-wave-0` پیاده شد: `@omnifront/ui`، `ui-react`، `ui-vue` و `ui-angular` با Button، TextField، Dialog، Menu و Tabs، یک مجموعه‌ی conformance مشترک (۲۱ سناریو، روی هر سه فریم‌ورک سبز)، مثال `examples/ui-react` و راهنمای `apps/docs/guide/ui.md`. تصمیم‌های ریز و انحراف از متن بالا:

- **قرارداد ماشین:** `connect()` برای هر المان یک `Part` برمی‌گرداند (`attrs` با نام‌های DOM، `on` با نام رویداد DOM به‌حروف کوچک) و `attach()` سمت DOM را (فوکوس، قفل اسکرول، `aria-hidden`، جای‌گذاری) راه می‌اندازد. callbackها رویداد DOM اصلی را هم می‌گیرند تا `onClose(event, reason)` مثل MUI باشد. برای React، `setProps(props, { silent: true })` در render و `flush()` بعد از commit اضافه شد، چون اعلان در حین render ممنوع است.
- **CSS:** توکن‌های پیش‌فرض در `@layer omnifront-tokens` (کم‌اولویت‌ترین) و استایل کامپوننت‌ها در `@layer omnifront` هستند؛ CSS بدون لایه‌ی کاربر و خروجی `ThemeProvider` همیشه برنده‌اند. انیمیشن‌های ورود و خروج با `@keyframes` و `data-state` است (transition روی المنتی که تازه وارد DOM شده اثر ندارد).
- **ThemeProvider** متغیرها را فقط روی wrapper خودش (`display: contents`) می‌گذارد و overlayها (در portal) همان attribute را کپی می‌کنند. برای تم روی کل صفحه (از جمله `<body>`) prop `global` اضافه شد (تم روی `:root`، scheme روی `<html>`).
- **Angular:** کامپوننت‌ها با selector صفتی روی المان بومی (`button[omni-button]`، `a[omni-button]`، `li[omniMenuItem]`) ساخته شدند تا معنای HTML بماند. Dialog و Menu در Angular برای portal، خود host را به `<body>` منتقل می‌کنند و بعد از اولین رندر در مرورگر ظاهر می‌شوند (مثل React و Vue، پس HTML سرور و hydration یکی است). `@angular/forms` یک peer شد، چون TextField یک `ControlValueAccessor` است. Angular قالب را فقط با AOT (ng-packagr) می‌سازد؛ در تست‌ها JIT است.
- **Vue:** SFC با Vite و `vue-tsc` برای d.ts. Vue boolean prop نبودنش را `false` می‌کند، پس پیش‌فرض‌های `true` (مثل `autoFocus` منو) باید با `withDefaults` گفته شوند.
- **API نسبت به MUI:** منو زیر anchor باز می‌شود (در MUI روی آن)؛ Tabs با شکل MUI Lab (`TabContext` / `TabList` / `Tab` / `TabPanel`)؛ adornment به‌صورت `startAdornment` / `endAdornment`؛ `theme.components` فقط `defaultProps` دارد (custom variants هنوز نه).
- **بودجه (فقط ثبت، بدون سقف سخت):** `ui` ۸.۶KB، `ui/position` ۶.۹KB (floating-ui)، `styles.css` ۵.۴KB، `ui-react` ۳.۸KB، `ui-vue` ۴.۷KB، `ui-angular` ۷.۱KB (gzip). سقف‌های `.size-limit.json` همان اندازه‌ی ثبت‌شده به‌علاوه‌ی حدود ۱۵٪ است.

### تکمیل موج ۰ (2026-11-12، روز دوم)

آنچه در فهرست «انجام‌نشده» بود بسته شد:

- **axe:** در conformance (jsdom، بدون contrast و بدون قاعده‌ی `region`، که مخصوص صفحه‌ی کامل است) و در مرورگر واقعی با `@axe-core/playwright` (WCAG 2.1 AA، contrast هم) روی ۱۵ حالت صفحه، هر سه فریم‌ورک.
- **مقایسه‌ی تصویری:** `tooling/e2e-ui` همان صفحه را در React، Vue و Angular در هشت حالت (روشن، تیره، تم برند، دیالوگ، منو، تب) اسکرین‌شات می‌گیرد و pixel به pixel با React می‌سنجد (حداکثر ۰.۱٪ تفاوت). baseline ذخیره‌شده ندارد، پس به فونت و سیستم‌عامل وابسته نیست. job جدا در CI (`e2e-ui`).
- **مثال Vue و Angular** (`examples/ui-vue`, `examples/ui-angular`) با همان صفحه‌ی مثال React؛ حالت اولیه از URL می‌آید (`?scheme=dark&theme=brand&open=dialog&tab=queries`).
- **hydration واقعی** در هر سه فریم‌ورک: HTML سرور، بعد hydrate در کلاینت؛ بدون mismatch و با استفاده‌ی دوباره از همان DOM (در Angular همان المان `button` حفظ می‌شود).
- **صفحه‌های مرجع API** (`apps/docs/api/ui*.md`) که `check-api.mjs` هم صحتشان را می‌سنجد.
- **`global` روی ThemeProvider** (تم روی `:root` و scheme روی `<html>`) و **`keepMounted`** برای Dialog و Menu.

آزمون مرورگر سه مشکل واقعی پیدا کرد که با jsdom دیده نمی‌شد و رفع شد:

1. **contrast:** `contrastThreshold` پیش‌فرض MUI برابر ۳ است و متن سفید روی `#f44336` (نسبت ۳.۶۸) را مجاز می‌کند. پیش‌فرض ما **۴.۵ (WCAG AA)** شد. فقط رنگ برچسب `warning` و `info` در حالت روشن و `error` در حالت تیره عوض می‌شود (متن تیره به‌جای سفید). با `contrastThreshold: 3` همان انتخاب MUI برمی‌گردد.
2. **focus:** رنگ پس‌زمینه‌ی ۱۲٪ هنگام `:focus-visible` نسبت contrast دکمه‌ی متنی را به ۳.۹ می‌رساند؛ حالا برچسب در همان حالت ۳۰٪ به‌سمت رنگ متن می‌رود (Button و Tab).
3. **Vue:** prop ای که نوعش شامل `false` است (`maxWidth: "sm" | ... | false`) در صورت نبودن، به `false` تبدیل می‌شود (boolean casting) و دیالوگ بدون حداکثر عرض رندر می‌شد. با `withDefaults` رفع شد. همین ریشه را `autoFocus` منو داشت.

باقی‌مانده: hydration فقط با jsdom تست شده (نه مرورگر واقعی)؛ در Vue 3.3 و 3.4 شناسه‌ها شمارنده‌اند و بین سرور و کلاینت پایدار نیستند (Vue 3.5 `useId` دارد)؛ `variants` سفارشی در `theme.components` و دکمه‌های اسکرول Tabs هنوز نیستند؛ مقایسه‌ی تصویری فقط Chromium را پوشش می‌دهد.

## موج ۱: Select (2026-11-12)

اولین قلم موج ۱ ساخته شد: `Select` در `ui` (ماشین `createSelect` و `mergeParts`)، هر سه فریم‌ورک، conformance، مثال‌ها، آزمون مرورگر و مستندات.

- **ساختار:** مثل MUI ظاهرش شبیه TextField است (برچسب شناور، سه variant، متن راهنما، خطا) و فهرستی را در portal باز می‌کند. برای فناوری کمکی `combobox` با `listbox` است: `aria-expanded`، `aria-controls`، و `aria-labelledby` که برچسب و متن خود trigger را با هم می‌خواند. فوکوس واقعی بین گزینه‌ها می‌رود (مثل Menu)، با Enter، Space، فلش‌ها، Home، End و تایپ برای جست‌وجو، و بعد از بسته شدن به trigger برمی‌گردد. ماشین `Field` یک بخش `trigger` گرفت تا حالت فوکوس و خطا برای کنترل‌هایی که `<input>` نیستند هم کار کند.
- **`options` داده است، نه children:** تفاوت آگاهانه با MUI (که `MenuItem` می‌گیرد). علت: متن گزینه‌ی انتخاب‌شده باید وقتی لیست بسته است (و در رندر سرور) نشان داده شود، و در Vue و Angular نمی‌شود children را برای پیدا کردن برچسب بازرسی کرد. با داده، هر سه فریم‌ورک یک رفتار و یک DOM دارند. گزینه‌ی سفارشی (آیکون، گروه‌بندی) در موج بعد با یک slot برای رندر هر گزینه اضافه می‌شود.
- **API:** `onChange(event, value)` و نه رویدادی با `target.value`. فرم: ورودی `hidden` با `name`؛ Angular با `ngModel` و reactive forms؛ Vue با `v-model` و `v-model:open`.
- **ظاهر:** عرض پیش‌فرض ۲۱۰px (یک TextField عرضش را از `<input>` می‌گیرد، یک select چنین چیزی ندارد). آزمون مرورگر همین را نشان داد: بدون آن select‌ها به اندازه‌ی متن جمع می‌شدند و برچسب «Standard» بریده می‌شد.
- **انجام‌نشده برای Select:** چندانتخابی (`multiple`)، گروه‌بندی گزینه‌ها، گزینه‌ی سفارشی و جست‌وجوی داخل لیست. بقیه‌ی قلم‌های موج ۱ (Checkbox، Radio، Switch، Slider، Rating و ...) هنوز شروع نشده‌اند.

## معیار بازبینی

- اگر موج ۰ نشان داد یک ماشین نمی‌تواند در هر سه فریم‌ورک با قرارداد `Subscribable` و `connect` وصل شود (به‌خصوص Dialog یا Menu در Angular)، این ADR و در صورت لزوم ADR-0001 دوباره باز می‌شوند.
- اگر تست تصویری بین سه فریم‌ورک اختلاف پایدار نشان داد، فرض «DOM و CSS یکسان» بازبینی می‌شود.
- اگر موج ۰ (پایه و پنج کامپوننت در سه فریم‌ورک) بیش از شش هفته طول کشید، دامنه کوچک می‌شود (کامپوننت کمتر یا یک فریم‌ورک در هر موج).
- اگر کاربران واقعی نبود `sx` / `styled` را مانع اصلی مهاجرت دانستند، بخش ۳ بازبینی می‌شود.
- اگر CI از حدود ۵ دقیقه گذشت، Turborepo طبق معیار موجود.
