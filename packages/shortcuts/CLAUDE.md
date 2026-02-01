# CLAUDE.md

## Project Context
- **Name**: shortcuts-mcp
- **Description**: MCP server for Apple Shortcuts on macOS - run any shortcut via MCP
- **Language**: TypeScript (ESM)
- **Build**: `tsc`
- **Package Manager**: npm

## Development Commands
```bash
npm run build    # Compile TypeScript
npm run start    # Run server
npm run dev      # Watch mode
```

## Code Standards
- TypeScript strict mode
- ESM modules (`"type": "module"`)
- Google TypeScript Style Guide as baseline

## Architecture
- Single MCP server entry point (`src/index.ts`)
- Uses `@modelcontextprotocol/sdk` for MCP protocol
- macOS-specific: relies on `shortcuts` CLI for execution
