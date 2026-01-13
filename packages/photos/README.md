# photos-mcp

MCP server for Apple Photos on macOS - browse albums, search photos, export images via the Model Context Protocol.

## Features

- **Album Management**: Get, create, and delete albums
- **Photo Browsing**: View recent photos, favorites, and album contents
- **Search**: Search by filename, description, or date range
- **Export**: Export photos to local directories
- **Import**: Import photos into your library
- **Favorites**: Mark photos as favorites

## Installation

```bash
npm install -g photos-mcp
```

Or run directly with npx:

```bash
npx photos-mcp
```

## Configuration

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "photos": {
      "command": "npx",
      "args": ["-y", "photos-mcp"]
    }
  }
}
```

## Requirements

- macOS (uses AppleScript to interact with Photos.app)
- Node.js 18+
- Photos app installed with a library

## Available Tools

### Album Management

- **photos_get_albums** - Get all albums with photo counts
- **photos_get_album_photos** - Get photos in a specific album
- **photos_create_album** - Create a new album
- **photos_delete_album** - Delete an album (photos kept)
- **photos_get_smart_albums** - Get smart albums (Favorites, Recents, etc.)

### Photo Browsing

- **photos_get_recent** - Get recently added photos
- **photos_get_favorites** - Get favorite photos
- **photos_get_photo_info** - Get detailed info about a photo

### Search

- **photos_search** - Search by filename or description
- **photos_search_by_date** - Search photos in a date range

### Export & Import

- **photos_export** - Export photos from an album
- **photos_export_photo** - Export a specific photo by ID
- **photos_import** - Import photos from a file/directory

### Favorites

- **photos_set_favorite** - Mark/unmark photo as favorite

### Library Info

- **photos_get_library_stats** - Get library statistics

### Application Control

- **photos_open** - Open the Photos app
- **photos_open_album** - Open a specific album

## Example Usage

### Browse your library

```
Show me my photo albums
How many photos do I have?
Show me my recent photos
```

### Search for photos

```
Search for photos with "vacation" in the name
Find photos from January 2024
Show me my favorite photos
```

### Export photos

```
Export photos from my "Hawaii Trip" album
Export the 10 most recent photos
```

### Manage albums

```
Create an album called "Best of 2024"
Show me what's in the "Family" album
```

## Privacy & Security

This MCP server:

- Requires Photos access permission on macOS
- Only accesses your local Photos library
- Does not upload or transmit photos externally
- Export destinations are local directories only
- All operations are performed locally via AppleScript

## Limitations

- Large libraries may be slow to search/iterate
- Date search requires AppleScript date format
- Some metadata may not be accessible via AppleScript
- Export preserves original file format

## License

MIT License - see LICENSE file for details.

## Author

Thomas Vincent
