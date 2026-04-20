# CLAUDE.md

MCP server for controlling Apple Home (HomeKit) devices, scenes, and automations on macOS via AppleScript.

## Tech

- TypeScript, Node >=18, ESM
- `@modelcontextprotocol/sdk`
- Vitest, ESLint 9 flat config, Prettier, Husky

## Build & Test

```sh
npm run build           # tsc
npm test                # vitest run
npm run test:coverage   # vitest with coverage report
npm run lint            # eslint .
npm run format:check    # prettier --check .
```

## Repo Notes

- Entry point: `src/index.ts`; tests: `src/__tests__/`
- lint-staged is configured to auto-fix on commit
- All HomeKit interaction is via AppleScript (no native bindings)
