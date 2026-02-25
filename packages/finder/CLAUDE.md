# CLAUDE.md

Exposes macOS Finder operations (file management, Spotlight search, tag manipulation) as MCP tools via AppleScript.

## Stack

- TypeScript / Node.js, ES modules
- MCP SDK

## Build

```sh
npm run build   # tsc
npm start       # node dist/index.js
npm run dev     # tsc --watch
```

## Conventions

- Minimal setup: no test runner, no linter, no formatter configured yet
- Single source file at `src/index.ts`
- `prepare` script runs the build automatically on `npm install`
