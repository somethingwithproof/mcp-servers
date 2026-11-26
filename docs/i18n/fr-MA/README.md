> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monodépôt de serveurs Model Context Protocol (MCP) pour les applications macOS.

## Paquets

- Paquets d'espace de travail TypeScript sous `packages/*` : `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` et `voice-memos`.
- Paquet Python sous `packages/ical` géré avec `uv`.

## Localisation

`packages/i18n` (`@somethingwithproof/mcp-i18n`) fournit un utilitaire de localisation TypeScript sans dépendance d'exécution pour 45 locales (20 de niveau 1, 15 africaines et 10 asiatiques) destiné à l'aide CLI, aux diagnostics, aux messages d'erreur et aux métadonnées localisées. La détection de la locale respecte `LC_ALL`, `LC_MESSAGES` et `LANG` (ainsi que `--lang`), avec l'anglais par défaut afin que les schémas et réponses des outils MCP restent rétrocompatibles.

## Commandes

```bash
npm install
npm run build
npm run test
npm run lint
```

## Licence

Consultez le [README en anglais](../../../README.md) complet et le fichier [LICENSE](../../../LICENSE).
