> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo serwerów Model Context Protocol (MCP) dla aplikacji systemu macOS.

## Pakiety

- Pakiety przestrzeni roboczej TypeScript w katalogu `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` i `voice-memos`.
- Pakiet Pythona w katalogu `packages/ical` zarządzany za pomocą `uv`.

## Lokalizacja

Pakiet `packages/i18n` (`@somethingwithproof/mcp-i18n`) udostępnia pozbawiony zależności uruchomieniowych moduł pomocniczy lokalizacji w TypeScript dla 45 ustawień regionalnych (20 z grupy Tier 1, 15 afrykańskich i 10 azjatyckich), obejmujący pomoc CLI, diagnostykę, komunikaty o błędach i zlokalizowane metadane. Wykrywanie języka uwzględnia zmienne `LC_ALL`, `LC_MESSAGES` i `LANG` (oraz flagę `--lang`), domyślnie przyjmując język angielski, aby schematy narzędzi MCP i odpowiedzi zachowały wsteczną kompatybilność.

## Polecenia

```bash
npm install
npm run build
npm run test
npm run lint
```

## Licencja

Zobacz pełną [angielską wersję README](../../../README.md) oraz plik [LICENSE](../../../LICENSE).
