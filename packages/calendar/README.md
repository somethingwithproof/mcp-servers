# Calendar MCP Server

A Model Context Protocol (MCP) server for Apple Calendar on macOS. Provides AI assistants like Claude with full access to create, manage, and search calendar events.

## Features

### Core Operations

- **Get Calendars** - List all calendars with colors and write status
- **Get Events** - Fetch events with date range filtering
- **Create Events** - Add new events with all properties
- **Update Events** - Modify existing event details
- **Delete Events** - Remove events from calendars

### Smart Queries

- **Search** - Find events by text in title, description, or location
- **Today's Events** - Get all events for today
- **Upcoming Events** - Get events for the next N days

## Requirements

- macOS 12 or later
- Node.js 18+
- Calendar permission (granted on first use)

## Installation

### From npm

```bash
npm install -g calendar-mcp
```

### From source

```bash
git clone https://github.com/thomasvincent/calendar-mcp.git
cd calendar-mcp
npm install
npm run build
```

## Setup

### 1. Grant Permissions

On first use, macOS will prompt for Calendar access. Click "OK" to allow.

If you need to grant permission manually:

1. Open **System Settings** > **Privacy & Security** > **Calendars**
2. Enable access for your terminal app

### 2. Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "calendar": {
      "command": "npx",
      "args": ["-y", "calendar-mcp"]
    }
  }
}
```

### 3. Restart Claude Desktop

## Available Tools

### Calendars

| Tool                     | Description                             |
| ------------------------ | --------------------------------------- |
| `calendar_get_calendars` | Get all calendars with names and colors |

### Events CRUD

| Tool                    | Description                    |
| ----------------------- | ------------------------------ |
| `calendar_get_events`   | Get events within a date range |
| `calendar_create_event` | Create a new event             |
| `calendar_update_event` | Update an existing event       |
| `calendar_delete_event` | Delete an event                |

### Search & Queries

| Tool                    | Description                |
| ----------------------- | -------------------------- |
| `calendar_search`       | Search events by text      |
| `calendar_get_today`    | Get today's events         |
| `calendar_get_upcoming` | Get events for next N days |

### Utility

| Tool                         | Description                      |
| ---------------------------- | -------------------------------- |
| `calendar_check_permissions` | Check Calendar access permission |

## Example Usage

Once configured, ask Claude to:

- "What's on my calendar today?"
- "Show my calendars"
- "Schedule a meeting with John tomorrow at 2pm"
- "What do I have this week?"
- "Search my calendar for 'dentist'"
- "Create an all-day event for my vacation on December 25th"
- "Move my 3pm meeting to 4pm"
- "Delete the team standup event"

## Event Properties

When creating or updating events:

| Property      | Description                                 |
| ------------- | ------------------------------------------- |
| `summary`     | Event title (required for create)           |
| `start_date`  | Start date/time in ISO 8601 format          |
| `end_date`    | End date/time (default: 1 hour after start) |
| `all_day`     | Boolean for all-day events                  |
| `calendar`    | Calendar name (default: first calendar)     |
| `description` | Notes/description text                      |
| `location`    | Event location                              |
| `url`         | Associated URL                              |

## Date Format

Dates use ISO 8601 format:

- `2024-12-25` - Date only
- `2024-12-25T14:00:00` - Date and time
- `2024-12-25T14:00:00-08:00` - With timezone

## Privacy & Security

- All operations are performed locally via AppleScript
- No data is sent externally
- Requires explicit macOS permission for Calendar access
- Only accesses calendars you authorize

## Troubleshooting

### "Calendar access denied"

1. Open System Settings > Privacy & Security > Calendars
2. Enable access for your terminal app
3. Restart the terminal

### Events not syncing

- Ensure you're signed into iCloud
- Check that Calendar sync is enabled
- Try opening the Calendar app to trigger a sync

### Can't create events in a calendar

- Some calendars (like subscribed calendars) are read-only
- Check the `writable` property from `calendar_get_calendars`

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a PR.
