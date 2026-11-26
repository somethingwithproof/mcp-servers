> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo Model Context Protocol (MCP) poslužitelja za macOS aplikacije.

## Paketi

- TypeScript radni paketi u mapi `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` i `voice-memos`.
- Python paket u mapi `packages/ical` kojim se upravlja pomoću alata `uv`.

## Lokalizacija

Paket `packages/i18n` (`@somethingwithproof/mcp-i18n`) pruža TypeScript pomoćni modul za lokalizaciju bez izvodnih ovisnosti za 48 jezičnih oznaka (20 Tier 1, 15 afričkih, 10 azijskih i 3 južnoslavenske), obuhvaćajući CLI pomoć, dijagnostiku, poruke o pogreškama i lokalizirane metapodatke. Prepoznavanje jezika poštuje varijable `LC_ALL`, `LC_MESSAGES` i `LANG` (uz zastavicu `--lang`), sa zadanim engleskim jezikom kako bi MCP sheme alata i odgovori ostali kompatibilni unatrag.

## Naredbe

```bash
npm install
npm run build
npm run test
npm run lint
```

## Licencija

Pogledajte cjelovitu [englesku inačicu README](../../../README.md) i datoteku [LICENSE](../../../LICENSE).
