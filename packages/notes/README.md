# Notes MCP Server

A Model Context Protocol (MCP) server for Apple Notes on macOS. Provides full access to create, search, and manage notes.

## Features

### Core Operations
- **Get Notes** - Fetch notes from any folder
- **Create Notes** - Create new notes with title and content
- **Update Notes** - Modify existing note title or content
- **Append to Notes** - Add content to existing notes
- **Delete Notes** - Remove notes (moves to Recently Deleted)

### Organization
- **Get Accounts** - List all Notes accounts (iCloud, On My Mac, etc.)
- **Get Folders** - List all folders with note counts
- **Recent Notes** - Get most recently modified notes

### Search
- **Search Notes** - Find notes by text in title or content

## Prerequisites

- macOS 12 or later
- Node.js 18+
- Automation permission (granted on first use)

## Installation

### From npm

```bash
npm install -g notes-mcp
```

### From source

```bash
git clone https://github.com/thomasvincent/notes-mcp.git
cd notes-mcp
npm install
npm run build
```

## Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "notes": {
      "command": "npx",
      "args": ["-y", "notes-mcp"]
    }
  }
}
```

### Grant Permissions

On first use, macOS will prompt for Automation access to Notes. Click "OK" to allow.

## Available Tools

### Organization

| Tool | Description |
|------|-------------|
| `notes_get_accounts` | List all Notes accounts |
| `notes_get_folders` | List all folders with note counts |

### Notes CRUD

| Tool | Description |
|------|-------------|
| `notes_get_notes` | Get notes from a folder |
| `notes_get_note` | Get a specific note with full content |
| `notes_get_recent` | Get recently modified notes |
| `notes_create` | Create a new note |
| `notes_update` | Update note title or content |
| `notes_append` | Append content to a note |
| `notes_delete` | Delete a note |

### Search

| Tool | Description |
|------|-------------|
| `notes_search` | Search notes by text |

### Utility

| Tool | Description |
|------|-------------|
| `notes_check_permissions` | Check Notes access permission |

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

This project uses manual testing with the Notes app. Ensure you have:
- Test notes in your Notes app
- Different folders set up
- Both iCloud and local notes (if applicable)

## Content Format

Notes support both plain text and HTML:

- **Plain text**: Automatically converted to basic HTML
- **HTML**: Use `<br>` for line breaks, `<h1>` for headings, etc.

## Privacy & Security

- All operations are performed locally via AppleScript
- No data is sent externally
- Requires Automation permission for Notes app
- Notes are stored in iCloud or locally per your Notes settings

## Troubleshooting

### "Notes access denied"
1. Open System Settings > Privacy & Security > Automation
2. Enable access for your terminal app to control Notes
3. Restart the terminal

### Notes not syncing
- Ensure iCloud Notes is enabled in System Settings
- Check your internet connection
- Try opening Notes app to trigger sync

### Slow performance
- Large notes or many notes can slow down AppleScript
- Use `limit` parameter to reduce results
- Consider organizing notes into folders

## License

MIT
