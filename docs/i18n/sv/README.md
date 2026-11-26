> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo med Model Context Protocol (MCP)-servrar för macOS-applikationer.

## Paket

- TypeScript-arbetsytepaket under `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` och `voice-memos`.
- Python-paket under `packages/ical` som hanteras med `uv`.

## Lokalisering

`packages/i18n` (`@somethingwithproof/mcp-i18n`) tillhandahåller en TypeScript-hjälpare för lokalisering utan körtidsberoenden för 45 språkområden (20 Tier 1-, 15 afrikanska och 10 asiatiska språkområden) för CLI-hjälp, diagnostik, felmeddelanden och lokaliserad metadata. Språkidentifieringen följer `LC_ALL`, `LC_MESSAGES` och `LANG` (samt `--lang`) och använder engelska som standard så att MCP-verktygens scheman och svar förblir bakåtkompatibla.

## Kommandon

```bash
npm install
npm run build
npm run test
npm run lint
```

## Licens

Se den fullständiga [engelska README-filen](../../../README.md) och [LICENSE](../../../LICENSE).
