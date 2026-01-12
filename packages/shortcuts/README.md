# Shortcuts MCP Server

A Model Context Protocol (MCP) server for Apple Shortcuts on macOS. Run any shortcut from AI assistants like Claude - a force multiplier that unlocks the entire Shortcuts automation ecosystem.

## Why This Matters

Instead of building custom MCPs for every app, you can:
1. Create a Shortcut in the Shortcuts app
2. Run it through Claude via this MCP

This gives Claude access to **anything Shortcuts can do**: HomeKit, Music, Mail, Files, web APIs, and thousands of third-party app integrations.

## Features

- **List Shortcuts** - See all available shortcuts
- **Search Shortcuts** - Find shortcuts by name
- **Run Shortcuts** - Execute any shortcut with optional input
- **Pass Input** - Send text or files to shortcuts
- **Get Output** - Receive shortcut results

## Requirements

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

## Setup

### 1. Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### 2. Restart Claude Desktop

No special permissions needed - Shortcuts are controlled via the `shortcuts` CLI.

## Available Tools

| Tool | Description |
|------|-------------|
| `shortcuts_list` | List all available shortcuts |
| `shortcuts_list_folders` | List shortcut folders |
| `shortcuts_search` | Search shortcuts by name |
| `shortcuts_run` | Run a shortcut (with optional input) |
| `shortcuts_exists` | Check if a shortcut exists |

## Example Usage

Once configured, ask Claude to:

- "What shortcuts do I have?"
- "Run the 'Morning Routine' shortcut"
- "Search for shortcuts about email"
- "Run 'Process Text' with input 'Hello World'"
- "Do I have a shortcut called 'Backup Photos'?"

## Power User Examples

### Home Automation
```
"Run 'Goodnight' shortcut" → Turns off all lights, locks doors, sets thermostat
```

### Quick Actions
```
"Run 'New Meeting Note'" → Creates a formatted note in your notes app
```

### Data Processing
```
"Run 'Summarize Clipboard' with the text I just copied" → Uses Shortcuts to process text
```

### System Control
```
"Run 'Toggle Dark Mode'" → Switches system appearance
```

## Creating Shortcuts for Claude

For best results when creating shortcuts to use with Claude:

1. **Name clearly** - Use descriptive names like "Send Email to Team"
2. **Accept input** - Configure shortcuts to receive text input when useful
3. **Return output** - Use "Stop and Output" to return results to Claude
4. **Handle errors** - Add error handling so Claude gets useful feedback

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

## Contributing

Contributions welcome! Please open an issue or submit a PR.

Ideas for contributions:
- Shortcut templates for common tasks
- Documentation for creating Claude-friendly shortcuts
- Integration examples
