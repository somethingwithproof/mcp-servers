# mcp-servers

Monorepo of Model Context Protocol servers.

| Package | Source |
|---|---|
| `packages/apple-mail` | Apple Mail |
| `packages/calendar` | Apple Calendar |
| `packages/contacts` | Apple Contacts |
| `packages/finder` | Apple Finder |
| `packages/home` | Apple Home |
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

## Commands

```
npm install
npm run build
npm run test
npm run lint
```

History for each package is preserved via `git filter-repo --to-subdirectory-filter`.
