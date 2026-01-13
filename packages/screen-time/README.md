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

## Installation

```bash
npm install -g screen-time-mcp
```

Or run directly with npx:

```bash
npx screen-time-mcp
```

## Configuration

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

## Requirements

- macOS
- Node.js 18+

## Available Tools

- **screentime_open** - Open Screen Time settings
- **screentime_open_app_limits** - Open App Limits settings
- **screentime_open_downtime** - Open Downtime settings
- **screentime_open_communication_limits** - Open Communication Limits settings
- **screentime_open_always_allowed** - Open Always Allowed settings
- **screentime_open_content_privacy** - Open Content & Privacy Restrictions
- **screentime_get_info** - Get information about capabilities

## Example Usage

```
Open my Screen Time settings
Show me the App Limits settings
```

## License

MIT License - see LICENSE file for details.

## Author

Thomas Vincent
