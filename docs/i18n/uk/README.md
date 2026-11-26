> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Монорепозиторій серверів Model Context Protocol (MCP) для застосунків macOS.

## Пакети

- Пакети робочої області TypeScript у `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` та `voice-memos`.
- Python-пакет у `packages/ical`, керований за допомогою `uv`.

## Локалізація

`packages/i18n` (`@somethingwithproof/mcp-i18n`) надає допоміжну бібліотеку локалізації на TypeScript без залежностей часу виконання для 45 локалей (20 рівня Tier 1, 15 африканських і 10 азійських локалей) для довідки CLI, діагностики, повідомлень про помилки та локалізованих метаданих. Визначення локалі враховує `LC_ALL`, `LC_MESSAGES` та `LANG` (а також `--lang`), за замовчуванням використовуючи англійську, щоб схеми та відповіді інструментів MCP залишалися зворотно сумісними.

## Команди

```bash
npm install
npm run build
npm run test
npm run lint
```

## Ліцензія

Див. повний [README англійською](../../../README.md) та [LICENSE](../../../LICENSE).
