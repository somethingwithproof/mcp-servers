# CLAUDE.md

## Project Context
- **Name**: notes-mcp
- **Description**: MCP server for Apple Notes on macOS - create, search, and manage notes
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
- macOS-specific: relies on JXA/AppleScript for Notes.app integration
