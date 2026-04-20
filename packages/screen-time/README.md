# screen-time-mcp

MCP server for Screen Time on macOS - view app usage and set limits via the Model Context Protocol.

## Features

- Open Screen Time settings panels
- Navigate to specific settings (App Limits, Downtime, etc.)

## Important Limitations

Screen Time on macOS has very limited API access. This MCP can only:

- Open various Screen Time settings panels

It cannot programmatically:

- Read app usage data
- Set app limits
- Enable/disable downtime
- Access Screen Time reports

## Prerequisites

- macOS
- Node.js 18+

## Installation

```bash
npm install -g screen-time-mcp
```

Or run directly with npx:

```bash
npx screen-time-mcp
```

## Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "screentime": {
      "command": "npx",
      "args": ["-y", "screen-time-mcp"]
    }
  }
}
```

## Available Tools

- **screentime_open** - Open Screen Time settings
- **screentime_open_app_limits** - Open App Limits settings
- **screentime_open_downtime** - Open Downtime settings
- **screentime_open_communication_limits** - Open Communication Limits settings
- **screentime_open_always_allowed** - Open Always Allowed settings
- **screentime_open_content_privacy** - Open Content & Privacy Restrictions
- **screentime_get_info** - Get information about capabilities

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode with watch
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## License

MIT License - see LICENSE file for details.
