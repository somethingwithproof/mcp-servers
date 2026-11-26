> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

מאגר יחיד (Monorepo) של שרתי Model Context Protocol (MCP) עבור יישומי macOS.

## חבילות

- חבילות סביבת עבודה של TypeScript תחת `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` ו-`voice-memos`.
- חבילת Python תחת `packages/ical` המנוהלת באמצעות `uv`.

## לוקליזציה

`packages/i18n` (`@somethingwithproof/mcp-i18n`) מספקת כלי עזר ללוקליזציה ב-TypeScript ללא תלויות זמן ריצה עבור 45 אזורי שפה (20 אזורי Tier 1, 15 אזורים אפריקאיים ו-10 אזורים אסייתיים) לטובת עזרת CLI, אבחון, הודעות שגיאה ומטא-נתונים מתורגמים. זיהוי אזור השפה מתחשב במשתנים `LC_ALL`, `LC_MESSAGES` ו-`LANG` (בנוסף ל-`--lang`), וברירת המחדל היא אנגלית כך שסכמות ותגובות של כלי MCP נשארות תואמות לאחור.

## פקודות

```bash
npm install
npm run build
npm run test
npm run lint
```

## רישיון

ראו את קובץ ה-[README המלא באנגלית](../../../README.md) ואת [LICENSE](../../../LICENSE).
