# CLAUDE.md

An MCP server for Apple Contacts on macOS. Supports full contact CRUD, search, and group management through AppleScript.

## Stack

- TypeScript, Node.js >=18, ESM
- `@modelcontextprotocol/sdk`

## Commands

```sh
npm run build         # tsc
npm test              # vitest run
npm run lint          # eslint .
npm run lint:fix      # eslint . --fix
npm run format:check  # prettier --check .
```

## Project Layout

- `src/index.ts` is the sole entry point
- Tests are in `src/__tests__/`
- Husky pre-commit hook triggers lint-staged (eslint + prettier on `*.ts`)
- ESLint uses the v9 flat config format
