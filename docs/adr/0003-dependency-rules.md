# ADR-0003: قواعد وابستگی بین پکیج‌ها

**وضعیت:** Accepted
**تاریخ:** 2026-11-07

## زمینه

مهم‌ترین ویژگی ثابت پروژه این است که منطق مشترک به هیچ فریم‌ورکی وابسته نباشد. اگر این قاعده فقط در ذهن بماند، با گذر زمان نقض می‌شود.

## تصمیم

جهت وابستگی‌ها:

```
core  -> (هیچ)
query -> core
store -> core
api   -> core   (ADR-0009: دسترسی به query و store فقط ساختاری است، با import نیست)
query-infinite / persist / devtools -> query, core
react / vue / angular -> query, store, core  (+ peerDependency روی فریم‌ورک)
next  -> react
```

قاعده‌ی اجباری: هیچ پکیجی جز آداپترها حق import از `react`، `vue` یا `@angular/*` ندارد. `next` فقط از طریق `react` به React می‌رسد.

اجرا: `dependency-cruiser` با فایل `.dependency-cruiser.cjs` و اسکریپت `pnpm deps:check` که در CI اجرا می‌شود.

## به‌روزرسانی (۲۰۲۶-۱۱-۰۹)

پکیج `api` اضافه شد و قاعده‌ی `api-imports-core-only` در `.dependency-cruiser.cjs` اجرا می‌شود. هر بسته‌ی جدید باید همین‌جا و در آن فایل قاعده بگیرد.

## گزینه‌های ردشده

- `eslint-plugin-boundaries`: برای این تعداد قاعده، dependency-cruiser مستقل از ESLint و ساده‌تر است.
- تکیه بر code review: قابل اعتماد نیست.

## پیامدها (مثبت و منفی)

مثبت: نقض قاعده در CI گرفته می‌شود و آداپترها سبک می‌مانند.
منفی: با اضافه‌شدن پکیج جدید باید فایل قواعد هم به‌روز شود.

## معیار بازبینی

اگر پکیجی مثل devtools اضافه شد که به چند فریم‌ورک نیاز دارد، قواعد را دوباره بررسی کن.
