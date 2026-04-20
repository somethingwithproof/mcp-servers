# CLAUDE.md

Provides CRUD access to Apple Calendar events and calendars from macOS, exposed as MCP tools. Uses AppleScript under the hood.

## Stack

- TypeScript / Node.js (>=18), ES modules
- MCP SDK (`@modelcontextprotocol/sdk`)
- Vitest, ESLint 9 (flat config), Prettier

## Development

```sh
npm run build        # compile with tsc
npm test             # vitest run
npm run test:coverage # vitest with coverage
npm run lint         # eslint src
npm run format:check # prettier check
npm run dev          # tsc --watch
```

## Notes

- Source is in `src/index.ts`; tests under `src/__tests__/`
- Husky + lint-staged run eslint --fix and prettier on staged TS files before each commit
- Dates are handled in ISO 8601 format throughout the codebase
