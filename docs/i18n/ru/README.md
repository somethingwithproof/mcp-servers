> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Монорепозиторий серверов Model Context Protocol (MCP) для приложений macOS.

## Пакеты

- Пакеты рабочей области TypeScript в `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` и `voice-memos`.
- Пакет Python в `packages/ical`, управляемый с помощью `uv`.

## Локализация

`packages/i18n` (`@somethingwithproof/mcp-i18n`) предоставляет вспомогательный модуль локализации на TypeScript без зависимостей времени выполнения для 45 локалей (20 локалей Tier 1, 15 африканских и 10 азиатских), используемый для справки CLI, диагностики, сообщений об ошибках и локализованных метаданных. Определение локали учитывает `LC_ALL`, `LC_MESSAGES` и `LANG` (а также `--lang`), по умолчанию используя английский язык, чтобы схемы и ответы инструментов MCP сохраняли обратную совместимость.

## Команды

```bash
npm install
npm run build
npm run test
npm run lint
```

## Лицензия

См. полную [английскую версию README](../../../README.md) и файл [LICENSE](../../../LICENSE).
