# Shortcuts MCP Server

A Model Context Protocol (MCP) server for Apple Shortcuts on macOS. Run any shortcut from MCP-compatible applications - a force multiplier that unlocks the entire Shortcuts automation ecosystem.

## Why This Matters

Instead of building custom MCPs for every app, you can:
1. Create a Shortcut in the Shortcuts app
2. Run it through your MCP client via this server

This gives MCP clients access to **anything Shortcuts can do**: HomeKit, Music, Mail, Files, web APIs, and thousands of third-party app integrations.

## Features

- **List Shortcuts** - See all available shortcuts
- **Search Shortcuts** - Find shortcuts by name
- **Run Shortcuts** - Execute any shortcut with optional input
- **Pass Input** - Send text or files to shortcuts
- **Get Output** - Receive shortcut results

## Prerequisites

- macOS 12 or later
- Node.js 18+
- Shortcuts app (built into macOS)

## Installation

### From npm

```bash
npm install -g shortcuts-mcp
```

### From source

```bash
git clone https://github.com/thomasvincent/shortcuts-mcp.git
cd shortcuts-mcp
npm install
npm run build
```

## Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "shortcuts": {
      "command": "npx",
      "args": ["-y", "shortcuts-mcp"]
    }
  }
}
```

No special permissions needed - Shortcuts are controlled via the `shortcuts` CLI.

## Available Tools

| Tool | Description |
|------|-------------|
| `shortcuts_list` | List all available shortcuts |
| `shortcuts_list_folders` | List shortcut folders |
| `shortcuts_search` | Search shortcuts by name |
| `shortcuts_run` | Run a shortcut (with optional input) |
| `shortcuts_exists` | Check if a shortcut exists |

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode with watch
npm run dev
```

## Testing

This project uses manual testing with the Shortcuts app. Ensure you have:
- Test shortcuts created in the Shortcuts app
- Shortcuts with various input/output types
- Both simple and complex shortcuts

## Creating Shortcuts for MCP Clients

For best results when creating shortcuts to use with MCP clients:

1. **Name clearly** - Use descriptive names like "Send Email to Team"
2. **Accept input** - Configure shortcuts to receive text input when useful
3. **Return output** - Use "Stop and Output" to return results to the client
4. **Handle errors** - Add error handling so the client gets useful feedback

## Input/Output

### Input Types
- **Text**: Pass text directly via the `input` parameter
- **File**: Pass a file path via `input_file` parameter

### Output Types
Specify output format with `output_type`:
- `public.plain-text` - Plain text (default)
- `public.html` - HTML content
- `public.json` - JSON data

## Privacy & Security

- Shortcuts run locally on your Mac
- No data is sent externally (unless your shortcuts do so)
- Each shortcut runs with your user permissions
- Be cautious with shortcuts that perform destructive actions

## Troubleshooting

### "Shortcut not found"
- Check the exact name (case-insensitive but must match)
- Use `shortcuts_list` to see available shortcuts
- Ensure the shortcut is synced if using iCloud

### Shortcut runs but returns nothing
- Add "Stop and Output" action at the end of your shortcut
- Check if the shortcut is configured to return output

### Timeout errors
- Shortcuts have a 2-minute timeout
- For long-running shortcuts, consider breaking them up

### Permission prompts
- Some shortcuts may trigger system permission dialogs
- These must be approved in the Shortcuts app first

## License

MIT
