# Reminders MCP Server

A Model Context Protocol (MCP) server for Apple Reminders on macOS. Provides full access to create, manage, and search reminders through the native Reminders app.

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

## Prerequisites

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

## Configuration

Add to your MCP client configuration:

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

### Grant Permissions

On first use, macOS will prompt for Reminders access. Click "OK" to allow.

If you need to grant permission manually:
1. Open **System Settings** > **Privacy & Security** > **Reminders**
2. Enable access for your terminal app

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

This project uses manual testing with the Reminders app. Ensure you have:
- Test reminder lists set up
- Sample reminders with various due dates
- Both completed and incomplete reminders

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
