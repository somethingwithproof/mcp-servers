# maps-mcp

MCP server for Apple Maps on macOS - search locations, get directions, and open maps via the Model Context Protocol.

## Features

- **Search**: Find locations, businesses, and points of interest
- **Directions**: Get driving, walking, or transit directions
- **Location Display**: Show addresses or coordinates on the map
- **Nearby Search**: Find nearby restaurants, gas stations, hotels, etc.
- **Shareable URLs**: Create Apple Maps URLs

## Prerequisites

- macOS
- Node.js 18 or higher
- Apple Maps app

## Installation

```bash
npm install -g maps-mcp
```

Or run directly with npx:

```bash
npx maps-mcp
```

## Configuration

Add to your MCP client config (e.g., Claude Desktop at `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "maps": {
      "command": "npx",
      "args": ["-y", "maps-mcp"]
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

- **maps_open** - Open the Apple Maps app
- **maps_search** - Search for a location
- **maps_get_directions** - Get directions (driving/walking/transit)
- **maps_show_location** - Show an address on the map
- **maps_show_coordinates** - Show a location by lat/long
- **maps_drop_pin** - Drop a pin at a location
- **maps_nearby** - Find nearby places of a type
- **maps_create_url** - Create shareable Apple Maps URLs

## Example Usage

### Search

```
Search for coffee shops near me
Find the Eiffel Tower on maps
```

### Directions

```
Get directions to the airport
Get walking directions to Central Park
Get transit directions from downtown to the museum
```

### Show Location

```
Show me 1600 Pennsylvania Avenue on the map
Show coordinates 37.7749, -122.4194
```

### Nearby

```
Find restaurants nearby
Find gas stations near Times Square
```

## License

MIT License - see LICENSE file for details.

## Author

Thomas Vincent
