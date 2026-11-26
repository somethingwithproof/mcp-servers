> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo von Model-Context-Protocol-(MCP)-Servern für macOS-Anwendungen.

## Pakete

- TypeScript-Workspace-Pakete unter `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` und `voice-memos`.
- Python-Paket unter `packages/ical`, verwaltet mit `uv`.

## Lokalisierung

`packages/i18n` (`@somethingwithproof/mcp-i18n`) stellt einen TypeScript-Lokalisierungshelfer ohne Laufzeitabhängigkeiten für 45 Locales (20 Tier-1-, 15 afrikanische und 10 asiatische Locales) für CLI-Hilfe, Diagnosen, Fehlermeldungen und lokalisierte Metadaten bereit. Die Locale-Erkennung berücksichtigt `LC_ALL`, `LC_MESSAGES` und `LANG` (sowie `--lang`) und verwendet standardmäßig Englisch, damit MCP-Tool-Schemas und -Antworten abwärtskompatibel bleiben.

## Befehle

```bash
npm install
npm run build
npm run test
npm run lint
```

## Lizenz

Siehe die vollständige [englische README](../../../README.md) und [LICENSE](../../../LICENSE).
