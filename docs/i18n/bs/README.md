> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo Model Context Protocol (MCP) servera za macOS aplikacije.

## Paketi

- TypeScript radni paketi u direktoriju `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` i `voice-memos`.
- Python paket u direktoriju `packages/ical` kojim se upravlja putem `uv`.

## Lokalizacija

Paket `packages/i18n` (`@somethingwithproof/mcp-i18n`) pruža TypeScript pomoćni modul za lokalizaciju bez izvršnih zavisnosti za 48 jezičkih oznaka (20 Tier 1, 15 afričkih, 10 azijskih i 3 južnoslavenske), obuhvatajući CLI pomoć, dijagnostiku, poruke o greškama i lokalizirane metapodatke. Prepoznavanje jezika prati varijable `LC_ALL`, `LC_MESSAGES` i `LANG` (uz zastavicu `--lang`), sa engleskim kao zadanim jezikom kako bi MCP šeme alata i odgovori ostali unazad kompatibilni.

## Naredbe

```bash
npm install
npm run build
npm run test
npm run lint
```

## Licenca

Pogledajte punu [englesku verziju README](../../../README.md) i datoteku [LICENSE](../../../LICENSE).
