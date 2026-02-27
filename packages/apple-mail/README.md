# Apple Mail MCP

A Model Context Protocol (MCP) server for Apple Mail on macOS. Read, send, search, and manage emails directly through AI assistants.

## Features

- **Account Management**: List mail accounts and mailboxes
- **Email Retrieval**: Get unread, recent, or specific emails
- **Search**: Search emails by sender, subject, content, or date
- **Compose & Send**: Send new emails with To, CC, and BCC
- **Reply**: Reply to existing emails
- **Organize**: Mark as read/unread, delete, move between mailboxes
- **Statistics**: Get unread counts per account/mailbox

## Prerequisites

- macOS with Apple Mail configured
- Node.js 18 or higher
- Apple Mail must have at least one account configured

## Installation

```bash
npm install -g apple-mail-mcp
```

Or clone and build locally:

```bash
git clone https://github.com/thomasvincent/apple-mail-mcp.git
cd apple-mail-mcp
npm install
npm run build
```

## Configuration

Add to your MCP client config (e.g., Claude Desktop at `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "apple-mail": {
      "command": "node",
      "args": ["/path/to/apple-mail-mcp/dist/index.js"]
    }
  }
}
```

## Development

Build the project:

```bash
npm run build
```

Watch mode for development:

```bash
npm run dev
```

Run linter:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

## Testing

Run tests:

```bash
npm test
```

Watch mode for tests:

```bash
npm run test:watch
```

## Available Tools

### Account & Mailbox Management

- `mail_get_accounts` - List all configured mail accounts
- `mail_get_mailboxes` - List mailboxes for an account

### Email Retrieval

- `mail_get_unread` - Get unread emails (optionally filtered by account/mailbox)
- `mail_get_recent` - Get recent emails with configurable limit
- `mail_get_email` - Get a specific email by ID

### Search

- `mail_search` - Search emails by sender, subject, content, or date range

### Compose & Send

- `mail_send` - Send a new email (with optional CC/BCC)
- `mail_reply` - Reply to an existing email

### Organization

- `mail_mark_read` - Mark email as read
- `mail_mark_unread` - Mark email as unread
- `mail_delete` - Delete an email
- `mail_move` - Move email to a different mailbox

### Utilities

- `mail_unread_count` - Get unread email count
- `mail_open` - Open Apple Mail application
- `mail_check` - Check for new emails

## Permissions

The MCP server uses AppleScript to interact with Apple Mail. On first use, you may need to grant automation permissions in System Preferences > Security & Privacy > Privacy > Automation.

## License

MIT License - see LICENSE file for details.

## Author

Thomas Vincent
