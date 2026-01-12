# voice-memos-mcp

MCP server for Voice Memos on macOS - record, list, and play voice memos via the Model Context Protocol.

## Features

- **List Recordings**: View all voice memo recordings with metadata
- **Record**: Start and stop voice memo recordings
- **Playback**: Play voice memos directly
- **Open App**: Launch the Voice Memos application

## Installation

```bash
npm install -g voice-memos-mcp
```

Or run directly with npx:

```bash
npx voice-memos-mcp
```

## Configuration

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "voicememos": {
      "command": "npx",
      "args": ["-y", "voice-memos-mcp"]
    }
  }
}
```

## Requirements

- macOS
- Node.js 18+
- Voice Memos app
- Accessibility permissions (for recording control)

## Available Tools

- **voicememos_open** - Open the Voice Memos app
- **voicememos_list** - List voice memo recordings
- **voicememos_start_recording** - Start a new recording
- **voicememos_stop_recording** - Stop the current recording
- **voicememos_play** - Play a specific voice memo
- **voicememos_get_info** - Get storage location and capabilities info

## Example Usage

### List recordings
```
Show me my voice memos
```

### Record
```
Start a voice memo recording
Stop the recording
```

### Playback
```
Play my most recent voice memo
```

## Accessibility Permissions

Recording control requires Accessibility permissions:

1. Open System Preferences > Security & Privacy > Privacy
2. Select Accessibility
3. Add Terminal (or your IDE) to the list

## License

MIT License - see LICENSE file for details.

## Author

Thomas Vincent
