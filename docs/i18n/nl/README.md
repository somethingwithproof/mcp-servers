> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo van Model Context Protocol (MCP)-servers voor macOS-applicaties.

## Pakketten

- TypeScript-workspacepakketten onder `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` en `voice-memos`.
- Python-pakket onder `packages/ical` beheerd met `uv`.

## Lokalisatie

`packages/i18n` (`@somethingwithproof/mcp-i18n`) biedt een TypeScript-lokalisatiehelper zonder runtime-afhankelijkheden voor 45 locales (20 Tier 1-, 15 Afrikaanse en 10 Aziatische locales) voor CLI-hulp, diagnostiek, foutmeldingen en gelokaliseerde metadata. De localedetectie respecteert `LC_ALL`, `LC_MESSAGES` en `LANG` (plus `--lang`), en valt standaard terug op Engels zodat MCP-toolschema's en -antwoorden achterwaarts compatibel blijven.

## Opdrachten

```bash
npm install
npm run build
npm run test
npm run lint
```

## Licentie

Zie de volledige [Engelse README](../../../README.md) en [LICENSE](../../../LICENSE).
