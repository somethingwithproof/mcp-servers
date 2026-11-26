# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo of Model Context Protocol servers.

| Package | Source |
|---|---|
| `packages/apple-mail` | Apple Mail |
| `packages/calendar` | Apple Calendar |
| `packages/contacts` | Apple Contacts |
| `packages/finder` | Apple Finder |
| `packages/home` | Apple Home |
| `packages/i18n` | Shared 20-locale Tier 1 i18n helper |
| `packages/ical` | iCal (Python) |
| `packages/imessage` | Apple iMessage |
| `packages/maps` | Apple Maps |
| `packages/music` | Apple Music |
| `packages/notes` | Apple Notes |
| `packages/photos` | Apple Photos |
| `packages/reminders` | Apple Reminders |
| `packages/safari` | Apple Safari |
| `packages/screen-time` | Apple Screen Time |
| `packages/shortcuts` | Apple Shortcuts |
| `packages/voice-memos` | Apple Voice Memos |

## Layout

npm workspaces for TypeScript packages. `packages/ical` uses uv/Python.

## Localization

`packages/i18n` (`@somethingwithproof/mcp-i18n`) provides a zero-dependency localization helper across 20 Broad Tier 1 locales (`en`, `de`, `es`, `fr`, `it`, `pt-BR`, `nl`, `ru`, `uk`, `ja`, `ko`, `zh-CN`, `zh-TW`, `ar`, `hi`, `pl`, `tr`, `sv`, `vi`, `id`) for CLI help, diagnostics, error messages, and localized metadata. Locale detection honors `LC_ALL`, `LC_MESSAGES`, and `LANG` (plus `--lang`), while defaulting to English so MCP tool schemas and default responses remain backward-compatible.

## Commands

```
npm install
npm run build
npm run test
npm run lint
```

History for each package is preserved via `git filter-repo --to-subdirectory-filter`.
