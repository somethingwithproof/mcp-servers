> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo di server Model Context Protocol (MCP) per applicazioni macOS.

## Pacchetti

- Pacchetti workspace TypeScript in `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` e `voice-memos`.
- Pacchetto Python in `packages/ical` gestito con `uv`.

## Localizzazione

`packages/i18n` (`@somethingwithproof/mcp-i18n`) fornisce un helper TypeScript di localizzazione senza dipendenze di runtime in 45 localizzazioni (20 Tier 1, 15 africane e 10 asiatiche) per l'aiuto della CLI, la diagnostica, i messaggi di errore e i metadati localizzati. Il rilevamento della lingua rispetta `LC_ALL`, `LC_MESSAGES` e `LANG` (oltre a `--lang`), utilizzando l'inglese come valore predefinito affinché gli schemi e le risposte degli strumenti MCP rimangano retrocompatibili.

## Comandi

```bash
npm install
npm run build
npm run test
npm run lint
```

## Licenza

Consulta il [README completo in inglese](../../../README.md) e [LICENSE](../../../LICENSE).
