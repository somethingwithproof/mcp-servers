# iMessage MCP Server

A comprehensive Model Context Protocol (MCP) server for iMessage on macOS. Provides AI assistants like Claude with full access to read, search, and send messages through the native Messages app.

## Features

### Core Messaging
- **Read Recent Messages** - Get latest messages with contact names and read receipts
- **List Conversations** - View all chats with message counts and previews
- **Get Chat History** - Retrieve messages from specific conversations
- **Send Messages** - Send via iMessage with automatic SMS fallback
- **Group Chat Support** - Full support for group conversations with participant names

### Advanced Search
- **Text Search** - Search with date range and contact filters
- **Semantic Search** - Find messages by meaning/concept using AI embeddings (optional OpenAI API)
- **Date Filtering** - Filter messages by start/end dates (ISO 8601)

### Contact Integration
- **Contact Resolution** - Automatically resolves phone numbers to contact names
- **Contact Lookup** - Look up names from phone numbers or emails
- **Phone Validation** - Validates and normalizes phone numbers

### Message Details
- **Attachments** - List and filter attachments by type (images, videos, PDFs)
- **Reactions/Tapbacks** - Get love, like, laugh, and other reactions on messages
- **Read Receipts** - Check delivered/read status and timestamps
- **Message Context** - Get surrounding messages for conversation context

### Utilities
- **Permission Check** - Verify database, contacts, and automation access
- **iMessage Check** - Determine if a contact uses iMessage or SMS

## Requirements

- macOS 12 or later
- Node.js 18+
- Full Disk Access permission (required)
- Contacts permission (optional, for name resolution)
- Automation permission (optional, for sending messages)

## Installation

### From npm

```bash
npm install -g imessage-mcp
```

### From source

```bash
git clone https://github.com/thomasvincent/imessage-mcp.git
cd imessage-mcp
npm install
npm run build
```

## Setup

### 1. Grant Permissions

**Full Disk Access** (Required):
1. Open **System Settings** > **Privacy & Security** > **Full Disk Access**
2. Add your terminal app (Terminal, iTerm2, VS Code, etc.)
3. Restart the terminal

**Contacts** (Optional - for name resolution):
1. Open **System Settings** > **Privacy & Security** > **Contacts**
2. Add your terminal app

**Automation** (Optional - for sending messages):
- Permission is requested automatically when sending the first message

### 2. Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "imessage": {
      "command": "npx",
      "args": ["-y", "imessage-mcp"]
    }
  }
}
```

For semantic search, add your OpenAI API key:

```json
{
  "mcpServers": {
    "imessage": {
      "command": "npx",
      "args": ["-y", "imessage-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

### 3. Restart Claude Desktop

## Available Tools

### Permission & Status

| Tool | Description |
|------|-------------|
| `imessage_check_permissions` | Check access to Messages database, Contacts, and Automation |
| `imessage_check_imessage` | Check if a recipient uses iMessage or SMS |
| `imessage_validate_phone` | Validate and normalize a phone number |

### Reading Messages

| Tool | Description |
|------|-------------|
| `imessage_get_recent` | Get recent messages with optional date filtering |
| `imessage_get_conversations` | List all conversations with previews |
| `imessage_get_chat` | Get messages from a specific conversation |
| `imessage_get_group_chats` | List group chats with participants |
| `imessage_get_context` | Get messages before/after a specific message |

### Search

| Tool | Description |
|------|-------------|
| `imessage_search` | Text search with date/contact filters |
| `imessage_semantic_search` | AI-powered semantic search (requires OpenAI API key) |

### Contacts

| Tool | Description |
|------|-------------|
| `imessage_get_contacts` | List contacts with message statistics |
| `imessage_lookup_contact` | Look up a contact's name |

### Attachments & Details

| Tool | Description |
|------|-------------|
| `imessage_get_attachments` | List attachments, filter by MIME type |
| `imessage_get_reactions` | Get tapback reactions for a message |
| `imessage_get_read_receipt` | Get read/delivered status |

### Sending

| Tool | Description |
|------|-------------|
| `imessage_send` | Send a message (iMessage with SMS fallback) |

## Example Usage

Once configured, ask Claude to:

- "Show my recent messages"
- "What conversations do I have?"
- "Search messages for 'dinner' from last week"
- "Show messages from John"
- "Find messages about the project meeting" (semantic search)
- "What attachments have I received?"
- "Send a message to +1234567890 saying 'On my way!'"
- "Who liked my last message?"
- "Was my message to Mom read?"

## Semantic Search

Semantic search finds messages by meaning, not just keywords. For example:
- Query: "food plans" matches "Want to grab dinner?" and "Let's get lunch tomorrow"
- Query: "feeling sick" matches "I have a cold" and "Not feeling well today"

**Setup**: Set the `OPENAI_API_KEY` environment variable. Without it, semantic search falls back to keyword search.

**Cost**: Uses `text-embedding-3-small` model (~$0.02 per 1M tokens). A typical search costs less than $0.001.

## Privacy & Security

- All data stays local - the MCP server only accesses your Mac's Messages database
- No data is sent externally except:
  - Messages you explicitly send via the `imessage_send` tool
  - Queries to OpenAI for semantic search (if API key is configured)
- Requires explicit macOS permissions for database and contact access

## Troubleshooting

### "Cannot access Messages database"
Grant Full Disk Access to your terminal app and restart it.

### "Contacts: NOT accessible"
Grant Contacts permission in System Settings > Privacy & Security > Contacts.

### "Failed to send message"
1. Ensure Messages app is open
2. Grant Automation permission when prompted
3. Verify the recipient is a valid phone number or email

### Contact names not showing
1. Grant Contacts permission
2. Ensure the contact exists in your Contacts app with that phone number/email

### Semantic search not working
1. Verify `OPENAI_API_KEY` is set correctly
2. Check your OpenAI API quota

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a PR.

## Changelog

### v2.0.0
- Renamed from ichat-mcp to imessage-mcp
- Standardized all tool names to `imessage_` prefix
- Added contact name resolution from Contacts.app
- Added attachment support with MIME filtering
- Added phone number validation and normalization
- Added group chat support with participant names
- Added date range filtering for all queries
- Added message context (surrounding messages)
- Added iMessage availability checking
- Added tapback/reactions support
- Added read receipt support
- Added permission checking tool
- Added semantic search with OpenAI embeddings
- Improved search with multiple filters
