# music-mcp

MCP server for Apple Music on macOS - playback control, library management, playlists, and search via the Model Context Protocol.

## Features

- **Playback Control**: Play, pause, stop, skip, previous
- **Volume Control**: Get and set volume level
- **Position Control**: Seek to specific positions in tracks
- **Shuffle & Repeat**: Control shuffle and repeat modes
- **Library Access**: Browse playlists and tracks
- **Search**: Search for songs, albums, and artists
- **Play Specific Content**: Play songs, albums, artists, or playlists
- **Favorites**: Love or dislike tracks

## Prerequisites

- macOS (uses AppleScript to interact with Music.app)
- Node.js 18+
- Apple Music app installed

## Installation

```bash
npm install -g music-mcp
```

Or run directly with npx:

```bash
npx music-mcp
```

## Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "music": {
      "command": "npx",
      "args": ["-y", "music-mcp"]
    }
  }
}
```

## Available Tools

### Playback Control

- **music_play** - Start/resume playback
- **music_pause** - Pause playback
- **music_stop** - Stop playback
- **music_next** - Skip to next track
- **music_previous** - Go to previous track
- **music_toggle_playback** - Toggle play/pause

### Current Track

- **music_get_current_track** - Get info about the current track
- **music_get_player_state** - Get player state (playing/paused/stopped)

### Volume Control

- **music_get_volume** - Get current volume (0-100)
- **music_set_volume** - Set volume level

### Position Control

- **music_get_position** - Get playback position in seconds
- **music_set_position** - Set playback position

### Shuffle & Repeat

- **music_get_shuffle** - Get shuffle state
- **music_set_shuffle** - Enable/disable shuffle
- **music_get_repeat** - Get repeat mode
- **music_set_repeat** - Set repeat mode (off/one/all)

### Library Access

- **music_get_playlists** - Get all playlists
- **music_get_playlist_tracks** - Get tracks in a playlist
- **music_play_playlist** - Play a playlist

### Search & Play

- **music_search_library** - Search for songs/albums/artists
- **music_play_song** - Play a specific song
- **music_play_album** - Play a specific album
- **music_play_artist** - Play songs by an artist
- **music_add_to_queue** - Add song to queue

### Favorites

- **music_love_track** - Love the current track
- **music_dislike_track** - Dislike the current track

### Application Control

- **music_open** - Open the Music app
- **music_quit** - Quit the Music app

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode with watch
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Privacy & Security

This MCP server:

- Requires Automation permission for Music on macOS
- Only accesses your local Music library
- Does not store or transmit music data externally
- All operations are performed locally via AppleScript

## License

MIT License - see LICENSE file for details.
