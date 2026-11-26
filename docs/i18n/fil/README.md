> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo ng mga Model Context Protocol (MCP) server para sa mga macOS application.

## Mga Package

- Mga TypeScript workspace package sa ilalim ng `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, at `voice-memos`.
- Python package sa ilalim ng `packages/ical` na pinamamahalaan gamit ang `uv`.

## Lokalisasyon

Nagbibigay ang `packages/i18n` (`@somethingwithproof/mcp-i18n`) ng zero-runtime-dependency na TypeScript localization helper sa 45 locale (20 Tier 1, 15 African, at 10 Asian na locale) para sa tulong ng CLI, mga diagnostic, mga mensahe ng error, at naka-localize na metadata. Sinusunod ng pagtukoy ng locale ang `LC_ALL`, `LC_MESSAGES`, at `LANG` (kasama ang `--lang`), at naka-default sa Ingles upang manatiling backward-compatible ang mga MCP tool schema at tugon.

## Mga Command

```bash
npm install
npm run build
npm run test
npm run lint
```

## Lisensya

Tingnan ang buong [README sa Ingles](../../../README.md) at [LICENSE](../../../LICENSE).
