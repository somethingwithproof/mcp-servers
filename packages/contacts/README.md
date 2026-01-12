# contacts-mcp

MCP server for Apple Contacts on macOS - full contact CRUD, search, and group management via the Model Context Protocol.

## Features

- **Full Contact CRUD**: Create, read, update, and delete contacts
- **Search**: Search contacts by name, email, or phone number
- **Group Management**: Create groups, add/remove contacts from groups
- **Open Actions**: Open Contacts app or specific contact cards
- **Permission Checking**: Verify contacts access before operations

## Installation

```bash
npm install -g contacts-mcp
```

Or run directly with npx:

```bash
npx contacts-mcp
```

## Configuration

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "contacts": {
      "command": "npx",
      "args": ["-y", "contacts-mcp"]
    }
  }
}
```

## Requirements

- macOS (uses AppleScript to interact with Contacts.app)
- Node.js 18+
- Contacts access permission granted to the terminal/app running the MCP server

## Available Tools

### Permission & Access
- **contacts_check_permissions** - Check if Contacts access is granted

### Read Operations
- **contacts_get_all** - Get all contacts (with optional limit)
- **contacts_get_contact** - Get a specific contact by ID
- **contacts_search** - Search contacts by name, email, or phone

### Write Operations
- **contacts_create** - Create a new contact with name, email, phone, etc.
- **contacts_update** - Update an existing contact's information
- **contacts_delete** - Delete a contact by ID

### Group Management
- **contacts_get_groups** - List all contact groups
- **contacts_create_group** - Create a new group
- **contacts_delete_group** - Delete a group (contacts are not deleted)
- **contacts_add_to_group** - Add a contact to a group
- **contacts_remove_from_group** - Remove a contact from a group

### Open Actions
- **contacts_open** - Open the Contacts app
- **contacts_open_contact** - Open a specific contact card

## Example Usage

### Search for a contact
```
Search for "John" in my contacts
```

### Create a new contact
```
Create a contact for Jane Doe with email jane@example.com and phone 555-1234
```

### Manage groups
```
Create a group called "Work Colleagues"
Add John Smith to the Work Colleagues group
```

## Privacy & Security

This MCP server:
- Requires explicit Contacts access permission on macOS
- Only accesses contact data when explicitly requested
- Does not store or transmit contact information externally
- All operations are performed locally via AppleScript

## License

MIT License - see LICENSE file for details.

## Author

Thomas Vincent
