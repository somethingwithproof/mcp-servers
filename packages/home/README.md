# home-mcp

MCP server for Apple Home on macOS - control HomeKit devices, scenes, and automations via the Model Context Protocol.

## Features

- **Scene Control**: Run HomeKit scenes
- **Device Control**: Control devices via Shortcuts
- **Quick Actions**: Turn lights on/off, control thermostat, lock/unlock doors
- **Shortcuts Integration**: Works with Apple Shortcuts for device control

## Important Note

Apple Home/HomeKit has limited AppleScript support. This MCP server works best when you create Shortcuts in the Shortcuts app that control your HomeKit devices. The MCP can then trigger these Shortcuts.

## Prerequisites

- macOS (uses Shortcuts app for HomeKit control)
- Node.js 18 or higher
- Apple Home app with configured HomeKit devices
- Shortcuts app with HomeKit Shortcuts created (see Setup section)

## Installation

```bash
npm install -g home-mcp
```

Or run directly with npx:

```bash
npx home-mcp
```

## Configuration

Add to your MCP client config (e.g., Claude Desktop at `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "home": {
      "command": "npx",
      "args": ["-y", "home-mcp"]
    }
  }
}
```

## Setup: Creating HomeKit Shortcuts

For best results, create these Shortcuts in the Shortcuts app:

1. **Lights On** / **Lights Off** - Control all lights
2. **[Room] Lights On** / **[Room] Lights Off** - Control lights by room
3. **Set Thermostat** - Set thermostat (accepts temperature as input)
4. **Lock Doors** / **Unlock Doors** - Control door locks
5. **[Scene Name]** - One Shortcut per HomeKit scene

### Creating a Light Control Shortcut

1. Open Shortcuts app
2. Click + to create new Shortcut
3. Add action: "Control [Device Name]"
4. Configure the action (turn on/off)
5. Name the Shortcut (e.g., "Living Room Lights On")

### Creating a Scene Shortcut

1. Open Shortcuts app
2. Click + to create new Shortcut
3. Add action: "Control Home"
4. Select your scene
5. Name the Shortcut with the scene name

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

Run tests with coverage:

```bash
npm run test:coverage
```

## Available Tools

### Application Control

- **home_open** - Open the Home app
- **home_get_status** - Open Home app to view device status

### Scene Control

- **home_run_scene** - Run a HomeKit scene by name

### Device Control

- **home_control_device** - Run any Shortcut to control devices
- **home_list_shortcuts** - List available Home-related Shortcuts

### Quick Actions

- **home_lights_on** - Turn on lights (optional: specify room)
- **home_lights_off** - Turn off lights (optional: specify room)
- **home_set_thermostat** - Set thermostat temperature
- **home_lock_doors** - Lock all doors
- **home_unlock_doors** - Unlock all doors

## Example Usage

### Control lights

```
Turn on the living room lights
Turn off all the lights
```

### Run scenes

```
Run the "Good Morning" scene
Activate "Movie Time"
```

### Thermostat

```
Set the thermostat to 72 degrees
```

### Security

```
Lock all the doors
```

## Limitations

- HomeKit does not expose device status via AppleScript
- Direct device control requires pre-configured Shortcuts
- Some actions may require the Shortcuts app to be accessible

## Privacy & Security

This MCP server:

- Runs Shortcuts locally on your Mac
- Does not access HomeKit data directly (uses Shortcuts)
- Does not transmit any home data externally
- All operations are performed locally

## License

MIT License - see LICENSE file for details.

## Author

Thomas Vincent
