# CLAUDE.md

## Project Context
- **Name**: reminders-mcp
- **Description**: MCP server for Apple Reminders on macOS - create, manage, and search reminders
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
- macOS-specific: relies on JXA/AppleScript for Reminders.app integration
