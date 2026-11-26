> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

مخزن یکپارچه شامل سرورهای Model Context Protocol (MCP) برای برنامه‌های macOS.

## بسته‌ها

- بسته‌های فضای کاری TypeScript در مسیر `packages/*`: `apple-mail`، `calendar`، `contacts`، `finder`، `home`، `i18n`، `imessage`، `maps`، `music`، `notes`، `photos`، `reminders`، `safari`، `screen-time`، `shortcuts` و `voice-memos`.
- بسته Python در مسیر `packages/ical` که با `uv` مدیریت می‌شود.

## بومی‌سازی

`packages/i18n` (`@somethingwithproof/mcp-i18n`) یک ابزار کمکی بومی‌سازی TypeScript بدون وابستگی زمان اجرا برای ۴۵ زبان محلی (۲۰ زبان رده اول، ۱۵ زبان آفریقایی و ۱۰ زبان آسیایی) جهت راهنمای خط فرمان، عیب‌یابی، پیام‌های خطا و فراداده‌های بومی‌سازی‌شده فراهم می‌کند. تشخیص زبان از `LC_ALL`، `LC_MESSAGES` و `LANG` (به همراه `--lang`) پیروی می‌کند و به‌طور پیش‌فرض روی انگلیسی قرار دارد تا طرحواره‌ها و پاسخ‌های ابزارهای MCP سازگاری روبه‌عقب خود را حفظ کنند.

## دستورها

```bash
npm install
npm run build
npm run test
npm run lint
```

## مجوز

به [نسخه انگلیسی README](../../../README.md) و [LICENSE](../../../LICENSE) مراجعه کنید.
