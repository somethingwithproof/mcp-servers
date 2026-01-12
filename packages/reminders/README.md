# Reminders MCP Server

A Model Context Protocol (MCP) server for Apple Reminders on macOS. Provides AI assistants like Claude with full access to create, manage, and search reminders through the native Reminders app.

## Features

### Core Operations
- **Get Lists** - View all reminder lists with counts
- **Get Reminders** - Fetch reminders from any list with filters
- **Create Reminders** - Add new reminders with due dates and priorities
- **Complete/Uncomplete** - Mark reminders as done or not done
- **Update Reminders** - Modify name, notes, due date, or priority
- **Delete Reminders** - Remove reminders permanently

### Smart Queries
- **Search** - Find reminders by text in name or notes
- **Due Today** - Get all reminders due today
- **Overdue** - Find past-due incomplete reminders
- **Upcoming** - Get reminders due within N days

## Requirements

- macOS 12 or later
- Node.js 18+
- Reminders permission (granted on first use)

## Installation

### From npm

```bash
npm install -g reminders-mcp
```

### From source

```bash
git clone https://github.com/thomasvincent/reminders-mcp.git
cd reminders-mcp
npm install
npm run build
```

## Setup

### 1. Grant Permissions

On first use, macOS will prompt for Reminders access. Click "OK" to allow.

If you need to grant permission manually:
1. Open **System Settings** > **Privacy & Security** > **Reminders**
2. Enable access for your terminal app

### 2. Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "reminders": {
      "command": "npx",
      "args": ["-y", "reminders-mcp"]
    }
  }
}
```

### 3. Restart Claude Desktop

## Available Tools

### Lists

| Tool | Description |
|------|-------------|
| `reminders_get_lists` | Get all reminder lists with counts |

### Reminders CRUD

| Tool | Description |
|------|-------------|
| `reminders_get_reminders` | Get reminders from a list (with filters) |
| `reminders_create` | Create a new reminder |
| `reminders_complete` | Mark a reminder as completed |
| `reminders_uncomplete` | Mark a reminder as not completed |
| `reminders_update` | Update reminder properties |
| `reminders_delete` | Delete a reminder |

### Search & Queries

| Tool | Description |
|------|-------------|
| `reminders_search` | Search reminders by text |
| `reminders_get_due_today` | Get reminders due today |
| `reminders_get_overdue` | Get overdue reminders |
| `reminders_get_upcoming` | Get reminders due in next N days |

### Utility

| Tool | Description |
|------|-------------|
| `reminders_check_permissions` | Check Reminders access permission |

## Example Usage

Once configured, ask Claude to:

- "What reminders do I have?"
- "Show my reminder lists"
- "Create a reminder to buy groceries tomorrow at 5pm"
- "What's overdue?"
- "Mark the groceries reminder as done"
- "Search reminders for 'meeting'"
- "What do I have due this week?"
- "Add a high priority reminder to call Mom"

## Priority Levels

When creating or updating reminders, use these priority values:

| Value | Meaning |
|-------|---------|
| 0 | No priority |
| 1-4 | High priority |
| 5 | Medium priority |
| 6-9 | Low priority |

## Date Format

Due dates use ISO 8601 format:
- `2024-12-25` - Date only (reminder at midnight)
- `2024-12-25T10:00:00` - Date and time
- `2024-12-25T10:00:00-08:00` - With timezone

## Privacy & Security

- All operations are performed locally via AppleScript
- No data is sent externally
- Requires explicit macOS permission for Reminders access
- The MCP server only accesses reminders you authorize

## Troubleshooting

### "Reminders access denied"
1. Open System Settings > Privacy & Security > Reminders
2. Enable access for your terminal app
3. Restart the terminal

### Reminders not syncing
- Ensure you're signed into iCloud
- Check that Reminders sync is enabled in iCloud settings
- Try opening the Reminders app to trigger a sync

### Permission prompt not appearing
- Try running `osascript -e 'tell application "Reminders" to count lists'` in Terminal
- This should trigger the permission prompt

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a PR.
