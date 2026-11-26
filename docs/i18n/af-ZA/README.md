> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo van Model Context Protocol (MCP)-bedieners vir macOS-toepassings.

## Pakkette

- TypeScript-werkspasiepakkette onder `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` en `voice-memos`.
- Python-pakket onder `packages/ical` bestuur met `uv`.

## Lokalisering

`packages/i18n` (`@somethingwithproof/mcp-i18n`) bied 'n TypeScript-lokaliseringshulpfunksie sonder looptydafhanklikhede oor 45 locales (20 Vlak 1-, 15 Afrika- en 10 Asiatiese locales) vir CLI-hulp, diagnostiek, foutboodskappe en gelokaliseerde metadata. Locale-bespeuring respekteer `LC_ALL`, `LC_MESSAGES` en `LANG` (plus `--lang`), en val standaard terug na Engels sodat MCP-nutsgoedskemas en -antwoorde terugwaarts versoenbaar bly.

## Opdragte

```bash
npm install
npm run build
npm run test
npm run lint
```

## Lisensie

Sien die volledige [Engelse README](../../../README.md) en [LICENSE](../../../LICENSE).
