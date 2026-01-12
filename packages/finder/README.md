# finder-mcp

MCP server for macOS Finder - file operations, Spotlight search, and tags via the Model Context Protocol.

## Features

- **File Information**: Get detailed file/folder metadata
- **Directory Listing**: List contents with filtering options
- **Spotlight Search**: Search files using macOS Spotlight (mdfind)
- **Recent Files**: Get recently modified files
- **Special Folders**: Quick access to Downloads, Desktop
- **Finder Tags**: Read, set, add, remove color tags
- **Tag Search**: Find files by tag color
- **Finder Actions**: Reveal, open, open with specific app, trash
- **Folder Creation**: Create new folders
- **Selection**: Get currently selected items in Finder

## Installation

```bash
npm install -g finder-mcp
```

Or run directly:

```bash
npx finder-mcp
```

## Configuration

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "finder": {
      "command": "npx",
      "args": ["-y", "finder-mcp"]
    }
  }
}
```

## Requirements

- macOS (uses AppleScript, Spotlight, and xattr)
- Node.js 18+
- Automation permission for Finder (will be requested on first use)

## Available Tools

### File Information
- `finder_get_info` - Get detailed file/folder information (size, dates, permissions, type)
- `finder_list_directory` - List directory contents with optional hidden file inclusion

### Search
- `finder_search` - Search using Spotlight (mdfind) with optional folder scope
- `finder_get_recent` - Get recently modified files
- `finder_get_downloads` - List files in Downloads folder
- `finder_get_desktop` - List files on Desktop

### Tags
- `finder_get_tags` - Get color tags on a file/folder
- `finder_set_tags` - Set color tags (replaces existing)
- `finder_add_tag` - Add a color tag
- `finder_remove_tag` - Remove a color tag
- `finder_find_by_tag` - Find all files with a specific tag color

### Finder Actions
- `finder_reveal` - Reveal file/folder in Finder
- `finder_open` - Open file with default application
- `finder_open_with` - Open file with specific application
- `finder_trash` - Move file/folder to Trash
- `finder_create_folder` - Create a new folder
- `finder_get_selection` - Get currently selected items in Finder

## Tag Colors

Finder supports these tag colors:
- `none` (0) - No tag / clear tags
- `gray` (1)
- `green` (2)
- `purple` (3)
- `blue` (4)
- `yellow` (5)
- `red` (6)
- `orange` (7)

## Safety Features

The server includes protection against modifying system-critical paths:
- `/System`
- `/usr`
- `/bin`
- `/sbin`
- `/private`
- `/Library` (system-level)
- `/Applications` (can open but not trash)

## Example Usage

### Search for documents
```
finder_search with query "project report" and folder "~/Documents"
```

### Tag a file
```
finder_add_tag with path "~/Documents/important.pdf" and tag "red"
```

### Find all red-tagged files
```
finder_find_by_tag with tag "red"
```

### Get recent downloads
```
finder_get_downloads with limit 10
```

## License

MIT License - see LICENSE file for details.

## Author

Thomas Vincent
