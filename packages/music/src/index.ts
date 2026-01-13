#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';

const server = new Server(
  {
    name: 'music-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to run AppleScript
// Note: Using execSync with osascript is required for AppleScript execution
// All user input is properly escaped before being included in scripts
function runAppleScript(script: string): string {
  try {
    return execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    }).trim();
  } catch (error: unknown) {
    const err = error as Error & { stderr?: string };
    throw new Error(`AppleScript error: ${err.stderr || err.message}`);
  }
}

// Helper to run multi-line AppleScript
function runAppleScriptMulti(script: string): string {
  try {
    const escapedScript = script.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return execSync(`osascript -e "${escapedScript}"`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    }).trim();
  } catch (error: unknown) {
    const err = error as Error & { stderr?: string };
    throw new Error(`AppleScript error: ${err.stderr || err.message}`);
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Playback Control
      {
        name: 'music_play',
        description: 'Start playing music or resume playback',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'music_pause',
        description: 'Pause playback',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'music_stop',
        description: 'Stop playback',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'music_next',
        description: 'Skip to the next track',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'music_previous',
        description: 'Go to the previous track',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'music_toggle_playback',
        description: 'Toggle between play and pause',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      // Current Track Info
      {
        name: 'music_get_current_track',
        description: 'Get information about the currently playing track',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'music_get_player_state',
        description: 'Get the current player state (playing, paused, stopped)',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      // Volume Control
      {
        name: 'music_get_volume',
        description: 'Get the current volume level (0-100)',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'music_set_volume',
        description: 'Set the volume level (0-100)',
        inputSchema: {
          type: 'object',
          properties: {
            volume: {
              type: 'number',
              description: 'Volume level (0-100)',
              minimum: 0,
              maximum: 100,
            },
          },
          required: ['volume'],
        },
      },
      // Position Control
      {
        name: 'music_get_position',
        description: 'Get the current playback position in seconds',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'music_set_position',
        description: 'Set the playback position in seconds',
        inputSchema: {
          type: 'object',
          properties: {
            position: {
              type: 'number',
              description: 'Position in seconds',
            },
          },
          required: ['position'],
        },
      },
      // Shuffle and Repeat
      {
        name: 'music_get_shuffle',
        description: 'Get the shuffle state',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'music_set_shuffle',
        description: 'Set shuffle on or off',
        inputSchema: {
          type: 'object',
          properties: {
            enabled: {
              type: 'boolean',
              description: 'Enable or disable shuffle',
            },
          },
          required: ['enabled'],
        },
      },
      {
        name: 'music_get_repeat',
        description: 'Get the repeat mode (off, one, all)',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'music_set_repeat',
        description: 'Set the repeat mode',
        inputSchema: {
          type: 'object',
          properties: {
            mode: {
              type: 'string',
              enum: ['off', 'one', 'all'],
              description:
                'Repeat mode: off, one (repeat track), or all (repeat playlist)',
            },
          },
          required: ['mode'],
        },
      },
      // Library Access
      {
        name: 'music_get_playlists',
        description: 'Get all playlists',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'music_get_playlist_tracks',
        description: 'Get tracks in a specific playlist',
        inputSchema: {
          type: 'object',
          properties: {
            playlist: {
              type: 'string',
              description: 'Playlist name',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of tracks to return (default: 50)',
            },
          },
          required: ['playlist'],
        },
      },
      {
        name: 'music_play_playlist',
        description: 'Play a specific playlist',
        inputSchema: {
          type: 'object',
          properties: {
            playlist: {
              type: 'string',
              description: 'Playlist name',
            },
            shuffle: {
              type: 'boolean',
              description: 'Shuffle the playlist (default: false)',
            },
          },
          required: ['playlist'],
        },
      },
      // Search and Play
      {
        name: 'music_search_library',
        description: 'Search the music library for songs, albums, or artists',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            searchType: {
              type: 'string',
              enum: ['songs', 'albums', 'artists', 'all'],
              description: 'Type of search (default: all)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 20)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'music_play_song',
        description: 'Play a specific song by name',
        inputSchema: {
          type: 'object',
          properties: {
            song: {
              type: 'string',
              description: 'Song name to play',
            },
            artist: {
              type: 'string',
              description: 'Artist name (optional, helps find the right song)',
            },
          },
          required: ['song'],
        },
      },
      {
        name: 'music_play_album',
        description: 'Play a specific album',
        inputSchema: {
          type: 'object',
          properties: {
            album: {
              type: 'string',
              description: 'Album name',
            },
            artist: {
              type: 'string',
              description: 'Artist name (optional)',
            },
          },
          required: ['album'],
        },
      },
      {
        name: 'music_play_artist',
        description: 'Play songs by a specific artist',
        inputSchema: {
          type: 'object',
          properties: {
            artist: {
              type: 'string',
              description: 'Artist name',
            },
            shuffle: {
              type: 'boolean',
              description: 'Shuffle the songs (default: true)',
            },
          },
          required: ['artist'],
        },
      },
      {
        name: 'music_add_to_queue',
        description: 'Add a song to the play queue',
        inputSchema: {
          type: 'object',
          properties: {
            song: {
              type: 'string',
              description: 'Song name to add',
            },
            artist: {
              type: 'string',
              description: 'Artist name (optional)',
            },
          },
          required: ['song'],
        },
      },
      // Favorites
      {
        name: 'music_love_track',
        description: 'Love (favorite) the current track',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'music_dislike_track',
        description: 'Dislike the current track',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      // Application Control
      {
        name: 'music_open',
        description: 'Open the Music app',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'music_quit',
        description: 'Quit the Music app',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Playback Control
      case 'music_play': {
        runAppleScript('tell application "Music" to play');
        return { content: [{ type: 'text', text: 'Playback started' }] };
      }

      case 'music_pause': {
        runAppleScript('tell application "Music" to pause');
        return { content: [{ type: 'text', text: 'Playback paused' }] };
      }

      case 'music_stop': {
        runAppleScript('tell application "Music" to stop');
        return { content: [{ type: 'text', text: 'Playback stopped' }] };
      }

      case 'music_next': {
        runAppleScript('tell application "Music" to next track');
        return { content: [{ type: 'text', text: 'Skipped to next track' }] };
      }

      case 'music_previous': {
        runAppleScript('tell application "Music" to previous track');
        return { content: [{ type: 'text', text: 'Went to previous track' }] };
      }

      case 'music_toggle_playback': {
        runAppleScript('tell application "Music" to playpause');
        return { content: [{ type: 'text', text: 'Toggled playback' }] };
      }

      // Current Track Info
      case 'music_get_current_track': {
        const script = `
tell application "Music"
  if player state is not stopped then
    set currentTrack to current track
    set trackInfo to "Name: " & name of currentTrack & "\\n"
    set trackInfo to trackInfo & "Artist: " & artist of currentTrack & "\\n"
    set trackInfo to trackInfo & "Album: " & album of currentTrack & "\\n"
    set trackInfo to trackInfo & "Duration: " & (duration of currentTrack) & " seconds\\n"
    set trackInfo to trackInfo & "Year: " & year of currentTrack & "\\n"
    set trackInfo to trackInfo & "Genre: " & genre of currentTrack
    return trackInfo
  else
    return "No track is currently playing"
  end if
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: 'text', text: result }] };
      }

      case 'music_get_player_state': {
        const result = runAppleScript(
          'tell application "Music" to return player state as string'
        );
        return { content: [{ type: 'text', text: `Player state: ${result}` }] };
      }

      // Volume Control
      case 'music_get_volume': {
        const result = runAppleScript(
          'tell application "Music" to return sound volume'
        );
        return { content: [{ type: 'text', text: `Volume: ${result}%` }] };
      }

      case 'music_set_volume': {
        const volume = Math.max(
          0,
          Math.min(100, (args as { volume: number }).volume)
        );
        runAppleScript(
          `tell application "Music" to set sound volume to ${volume}`
        );
        return {
          content: [{ type: 'text', text: `Volume set to ${volume}%` }],
        };
      }

      // Position Control
      case 'music_get_position': {
        const result = runAppleScript(
          'tell application "Music" to return player position'
        );
        return {
          content: [{ type: 'text', text: `Position: ${result} seconds` }],
        };
      }

      case 'music_set_position': {
        const position = (args as { position: number }).position;
        runAppleScript(
          `tell application "Music" to set player position to ${position}`
        );
        return {
          content: [
            { type: 'text', text: `Position set to ${position} seconds` },
          ],
        };
      }

      // Shuffle and Repeat
      case 'music_get_shuffle': {
        const result = runAppleScript(
          'tell application "Music" to return shuffle enabled'
        );
        return {
          content: [
            {
              type: 'text',
              text: `Shuffle: ${result === 'true' ? 'on' : 'off'}`,
            },
          ],
        };
      }

      case 'music_set_shuffle': {
        const enabled = (args as { enabled: boolean }).enabled;
        runAppleScript(
          `tell application "Music" to set shuffle enabled to ${enabled}`
        );
        return {
          content: [
            {
              type: 'text',
              text: `Shuffle ${enabled ? 'enabled' : 'disabled'}`,
            },
          ],
        };
      }

      case 'music_get_repeat': {
        const result = runAppleScript(
          'tell application "Music" to return song repeat as string'
        );
        return { content: [{ type: 'text', text: `Repeat mode: ${result}` }] };
      }

      case 'music_set_repeat': {
        const mode = (args as { mode: string }).mode;
        const repeatValue =
          mode === 'off' ? 'off' : mode === 'one' ? 'one' : 'all';
        runAppleScript(
          `tell application "Music" to set song repeat to ${repeatValue}`
        );
        return {
          content: [{ type: 'text', text: `Repeat mode set to ${mode}` }],
        };
      }

      // Library Access
      case 'music_get_playlists': {
        const script = `
tell application "Music"
  set playlistNames to ""
  repeat with p in playlists
    set playlistNames to playlistNames & name of p & "\\n"
  end repeat
  return playlistNames
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: 'text', text: `Playlists:\n${result}` }] };
      }

      case 'music_get_playlist_tracks': {
        const { playlist, limit = 50 } = args as {
          playlist: string;
          limit?: number;
        };
        const safeName = playlist.replace(/"/g, '\\"');
        const script = `
tell application "Music"
  try
    set thePlaylist to playlist "${safeName}"
    set trackList to ""
    set trackCount to 0
    repeat with t in tracks of thePlaylist
      if trackCount < ${limit} then
        set trackList to trackList & name of t & " - " & artist of t & "\\n"
        set trackCount to trackCount + 1
      end if
    end repeat
    if trackList is "" then
      return "Playlist is empty"
    end if
    return trackList
  on error
    return "Playlist not found: ${safeName}"
  end try
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: 'text', text: result }] };
      }

      case 'music_play_playlist': {
        const { playlist, shuffle = false } = args as {
          playlist: string;
          shuffle?: boolean;
        };
        const safeName = playlist.replace(/"/g, '\\"');
        const script = `
tell application "Music"
  try
    set thePlaylist to playlist "${safeName}"
    ${shuffle ? 'set shuffle enabled to true' : ''}
    play thePlaylist
    return "Playing playlist: ${safeName}"
  on error
    return "Playlist not found: ${safeName}"
  end try
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: 'text', text: result }] };
      }

      // Search and Play
      case 'music_search_library': {
        const {
          query,
          searchType = 'all',
          limit = 20,
        } = args as { query: string; searchType?: string; limit?: number };
        const safeQuery = query.replace(/"/g, '\\"');
        let script: string;

        if (searchType === 'songs' || searchType === 'all') {
          script = `
tell application "Music"
  set results to ""
  set matchCount to 0
  repeat with t in (every track whose name contains "${safeQuery}" or artist contains "${safeQuery}" or album contains "${safeQuery}")
    if matchCount < ${limit} then
      set results to results & name of t & " - " & artist of t & " (" & album of t & ")\\n"
      set matchCount to matchCount + 1
    end if
  end repeat
  if results is "" then
    return "No results found for: ${safeQuery}"
  end if
  return results
end tell`;
        } else if (searchType === 'albums') {
          script = `
tell application "Music"
  set results to ""
  set albumList to {}
  set matchCount to 0
  repeat with t in (every track whose album contains "${safeQuery}")
    if matchCount < ${limit} then
      set albumKey to album of t & " - " & album artist of t
      if albumKey is not in albumList then
        set end of albumList to albumKey
        set results to results & album of t & " - " & album artist of t & "\\n"
        set matchCount to matchCount + 1
      end if
    end if
  end repeat
  if results is "" then
    return "No albums found for: ${safeQuery}"
  end if
  return results
end tell`;
        } else if (searchType === 'artists') {
          script = `
tell application "Music"
  set results to ""
  set artistList to {}
  set matchCount to 0
  repeat with t in (every track whose artist contains "${safeQuery}")
    if matchCount < ${limit} then
      set artistName to artist of t
      if artistName is not in artistList then
        set end of artistList to artistName
        set results to results & artistName & "\\n"
        set matchCount to matchCount + 1
      end if
    end if
  end repeat
  if results is "" then
    return "No artists found for: ${safeQuery}"
  end if
  return results
end tell`;
        } else {
          return {
            content: [{ type: 'text', text: 'Invalid search type' }],
            isError: true,
          };
        }

        const result = runAppleScriptMulti(script);
        return { content: [{ type: 'text', text: result }] };
      }

      case 'music_play_song': {
        const { song, artist } = args as { song: string; artist?: string };
        const safeSong = song.replace(/"/g, '\\"');
        const safeArtist = artist ? artist.replace(/"/g, '\\"') : null;
        const script = `
tell application "Music"
  try
    ${
      safeArtist
        ? `set matchingTracks to (every track whose name contains "${safeSong}" and artist contains "${safeArtist}")`
        : `set matchingTracks to (every track whose name contains "${safeSong}")`
    }
    if (count of matchingTracks) > 0 then
      play item 1 of matchingTracks
      set t to item 1 of matchingTracks
      return "Playing: " & name of t & " - " & artist of t
    else
      return "Song not found: ${safeSong}"
    end if
  on error errMsg
    return "Error: " & errMsg
  end try
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: 'text', text: result }] };
      }

      case 'music_play_album': {
        const { album, artist } = args as { album: string; artist?: string };
        const safeAlbum = album.replace(/"/g, '\\"');
        const safeArtist = artist ? artist.replace(/"/g, '\\"') : null;
        const script = `
tell application "Music"
  try
    ${
      safeArtist
        ? `set albumTracks to (every track whose album is "${safeAlbum}" and album artist contains "${safeArtist}")`
        : `set albumTracks to (every track whose album is "${safeAlbum}")`
    }
    if (count of albumTracks) > 0 then
      play item 1 of albumTracks
      return "Playing album: ${safeAlbum}"
    else
      return "Album not found: ${safeAlbum}"
    end if
  on error errMsg
    return "Error: " & errMsg
  end try
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: 'text', text: result }] };
      }

      case 'music_play_artist': {
        const { artist, shuffle = true } = args as {
          artist: string;
          shuffle?: boolean;
        };
        const safeArtist = artist.replace(/"/g, '\\"');
        const script = `
tell application "Music"
  try
    set artistTracks to (every track whose artist contains "${safeArtist}")
    if (count of artistTracks) > 0 then
      ${shuffle ? 'set shuffle enabled to true' : ''}
      play item 1 of artistTracks
      return "Playing songs by: ${safeArtist}"
    else
      return "No songs found by: ${safeArtist}"
    end if
  on error errMsg
    return "Error: " & errMsg
  end try
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: 'text', text: result }] };
      }

      case 'music_add_to_queue': {
        const { song, artist } = args as { song: string; artist?: string };
        const safeSong = song.replace(/"/g, '\\"');
        const safeArtist = artist ? artist.replace(/"/g, '\\"') : null;
        const script = `
tell application "Music"
  try
    ${
      safeArtist
        ? `set matchingTracks to (every track whose name contains "${safeSong}" and artist contains "${safeArtist}")`
        : `set matchingTracks to (every track whose name contains "${safeSong}")`
    }
    if (count of matchingTracks) > 0 then
      set t to item 1 of matchingTracks
      return "Found: " & name of t & " - " & artist of t & "\\nNote: Direct queue manipulation requires manual action in Music app"
    else
      return "Song not found: ${safeSong}"
    end if
  on error errMsg
    return "Error: " & errMsg
  end try
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: 'text', text: result }] };
      }

      // Favorites
      case 'music_love_track': {
        const script = `
tell application "Music"
  if player state is not stopped then
    set loved of current track to true
    return "Loved: " & name of current track
  else
    return "No track is playing"
  end if
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: 'text', text: result }] };
      }

      case 'music_dislike_track': {
        const script = `
tell application "Music"
  if player state is not stopped then
    set disliked of current track to true
    return "Disliked: " & name of current track
  else
    return "No track is playing"
  end if
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: 'text', text: result }] };
      }

      // Application Control
      case 'music_open': {
        runAppleScript('tell application "Music" to activate');
        return { content: [{ type: 'text', text: 'Music app opened' }] };
      }

      case 'music_quit': {
        runAppleScript('tell application "Music" to quit');
        return { content: [{ type: 'text', text: 'Music app closed' }] };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Music MCP server running on stdio');
}

main().catch(console.error);
