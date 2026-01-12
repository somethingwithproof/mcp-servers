# safari-mcp

MCP server for Safari on macOS - tabs, windows, bookmarks, history, and reading list via the Model Context Protocol.

## Features

- **Tab Management**: Get, open, close, switch, and search tabs
- **Window Management**: Create, close, and manage Safari windows (including private windows)
- **Navigation**: Back, forward, reload
- **Bookmarks**: Read bookmarks from folders
- **Reading List**: Get and add items to Reading List
- **Page Content**: Get page text content and HTML source
- **JavaScript Execution**: Run JavaScript in the current tab

## Installation

```bash
npm install -g safari-mcp
```

Or run directly with npx:

```bash
npx safari-mcp
```

## Configuration

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "safari": {
      "command": "npx",
      "args": ["-y", "safari-mcp"]
    }
  }
}
```

## Requirements

- macOS (uses AppleScript to interact with Safari)
- Node.js 18+
- For JavaScript execution: Enable "Allow JavaScript from Apple Events" in Safari's Develop menu

## Available Tools

### Tab Management
- **safari_get_current_tab** - Get info about the current active tab
- **safari_get_all_tabs** - Get all open tabs across all windows
- **safari_get_window_tabs** - Get all tabs in a specific window
- **safari_open_url** - Open a URL (new tab, current tab, or new window)
- **safari_close_tab** - Close a specific tab
- **safari_close_current_tab** - Close the current active tab
- **safari_switch_tab** - Switch to a specific tab
- **safari_search_tabs** - Search tabs by title or URL

### Navigation
- **safari_reload** - Reload the current tab
- **safari_back** - Navigate back
- **safari_forward** - Navigate forward

### Window Management
- **safari_get_windows** - Get all Safari windows
- **safari_new_window** - Open a new window (optionally private)
- **safari_close_window** - Close a specific window

### Bookmarks & Reading List
- **safari_get_bookmarks** - Get bookmarks from a folder
- **safari_add_bookmark** - Add a bookmark (opens dialog)
- **safari_get_reading_list** - Get Reading List items
- **safari_add_to_reading_list** - Add URL to Reading List

### Page Content
- **safari_get_page_content** - Get text content of current page
- **safari_get_page_source** - Get HTML source of current page
- **safari_run_javascript** - Execute JavaScript in current tab

### Application Control
- **safari_open** - Open Safari application
- **safari_activate** - Bring Safari to foreground

## Example Usage

### Get current tab info
```
What page am I currently viewing in Safari?
```

### Open a URL
```
Open https://example.com in Safari
```

### Search tabs
```
Find all Safari tabs with "GitHub" in the title
```

### Get page content
```
Get the text content of the current Safari page
```

## Enabling JavaScript Execution

To use `safari_run_javascript`, `safari_back`, and `safari_forward`:

1. Open Safari
2. Go to Safari > Settings > Advanced
3. Check "Show features for web developers"
4. Go to Develop menu > Allow JavaScript from Apple Events

## Privacy & Security

This MCP server:
- Requires Automation permission for Safari on macOS
- Does not store or transmit browsing data externally
- All operations are performed locally via AppleScript
- JavaScript execution requires explicit Safari permission

## License

MIT License - see LICENSE file for details.

## Author

Thomas Vincent
