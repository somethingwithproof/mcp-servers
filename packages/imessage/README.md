# iChat MCP Server

A Model Context Protocol (MCP) server that provides access to Apple Messages (iChat) on macOS. This allows AI assistants like Claude to read and send messages through the native Messages app.

## Features

- **Read Recent Messages** - Get the latest messages across all conversations
- **List Conversations** - View all your chat threads with message counts
- **Get Chat History** - Retrieve messages from a specific conversation
- **Search Messages** - Find messages containing specific text
- **Send Messages** - Send new messages via iMessage or SMS
- **List Contacts** - View contacts you've messaged with

## Requirements

- macOS (tested on macOS 12+)
- Node.js 18 or later
- Full Disk Access permission for your terminal app

## Installation

### From npm

```bash
npm install -g ichat-mcp
```

### From source

```bash
git clone https://github.com/thomasvincent/ichat-mcp.git
cd ichat-mcp
npm install
npm run build
```

## Setup

### 1. Grant Full Disk Access

The MCP server needs to read the Messages database located at `~/Library/Messages/chat.db`. You must grant Full Disk Access to your terminal application:

1. Open **System Preferences** (or **System Settings** on macOS Ventura+)
2. Go to **Security & Privacy** > **Privacy** > **Full Disk Access**
3. Click the lock icon and authenticate
4. Add your terminal app (Terminal, iTerm2, etc.)
5. Restart your terminal

### 2. Configure Claude Desktop

Add the server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ichat": {
      "command": "npx",
      "args": ["-y", "ichat-mcp"]
    }
  }
}
```

Or if installed from source:

```json
{
  "mcpServers": {
    "ichat": {
      "command": "node",
      "args": ["/path/to/ichat-mcp/dist/index.js"]
    }
  }
}
```

### 3. Restart Claude Desktop

After updating the configuration, restart Claude Desktop to load the MCP server.

## Available Tools

### `messages_get_recent`

Get recent messages from all conversations.

**Parameters:**
- `limit` (optional): Maximum number of messages to return (default: 20)

### `messages_get_conversations`

Get a list of all conversations/chats.

**Parameters:**
- `limit` (optional): Maximum number of conversations to return (default: 50)

### `messages_get_chat`

Get messages from a specific conversation.

**Parameters:**
- `chat_id` (required): The chat identifier (phone number or email)
- `limit` (optional): Maximum number of messages to return (default: 50)

### `messages_search`

Search for messages containing specific text.

**Parameters:**
- `query` (required): The text to search for
- `limit` (optional): Maximum number of results to return (default: 20)

### `messages_send`

Send a new message.

**Parameters:**
- `recipient` (required): The recipient's phone number or email
- `message` (required): The message text to send

### `messages_get_contacts`

Get a list of contacts you have messaged.

**Parameters:**
- `limit` (optional): Maximum number of contacts to return (default: 50)

## Example Usage

Once configured, you can ask Claude to:

- "Show me my recent messages"
- "What conversations do I have?"
- "Search my messages for 'meeting tomorrow'"
- "Show me messages from +1234567890"
- "Send a message to john@example.com saying 'Hello!'"

## Privacy & Security

This MCP server:

- Only accesses the local Messages database on your Mac
- Requires explicit Full Disk Access permission
- Does not send any data externally (except through the Messages app when sending)
- All operations are performed locally

**Note:** Be cautious when using the send message feature. Always verify the recipient before sending.

## Troubleshooting

### "Cannot access Messages database"

Ensure you've granted Full Disk Access to your terminal app and restarted it.

### "Failed to send message"

- Make sure the Messages app is running
- Verify the recipient is a valid phone number or email
- Check that you're signed into iMessage/iCloud

### Messages not appearing

- The database is updated when you receive/send messages in the Messages app
- Try refreshing or checking for new messages in the Messages app first

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
