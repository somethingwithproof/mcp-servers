import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as child_process from 'child_process';

// Mock child_process.execSync before any imports that might use it
// Note: We are testing the existing implementation which uses execSync.
// The mock prevents actual AppleScript execution during tests.
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

const mockedExecSync = vi.mocked(child_process.execSync);

describe('Music MCP Server E2E Tests', () => {
  let server: Server;
  let client: Client;
  let serverTransport: InstanceType<typeof InMemoryTransport>;
  let clientTransport: InstanceType<typeof InMemoryTransport>;

  // Helper function to run AppleScript (matching the original implementation)
  function runAppleScript(script: string): string {
    try {
      return (
        child_process.execSync(
          `osascript -e '${script.replace(/'/g, "'\"'\"'")}'`,
          {
            encoding: 'utf-8',
            maxBuffer: 50 * 1024 * 1024,
          }
        ) as string
      ).trim();
    } catch (error: unknown) {
      const err = error as Error & { stderr?: string };
      throw new Error(`AppleScript error: ${err.stderr || err.message}`);
    }
  }

  // Helper to run multi-line AppleScript
  function runAppleScriptMulti(script: string): string {
    try {
      const escapedScript = script.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return (
        child_process.execSync(`osascript -e "${escapedScript}"`, {
          encoding: 'utf-8',
          maxBuffer: 50 * 1024 * 1024,
        }) as string
      ).trim();
    } catch (error: unknown) {
      const err = error as Error & { stderr?: string };
      throw new Error(`AppleScript error: ${err.stderr || err.message}`);
    }
  }

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create server instance
    server = new Server(
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

    // Register the list tools handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Playback Control
          {
            name: 'music_play',
            description: 'Start playing music or resume playback',
            inputSchema: { type: 'object', properties: {}, required: [] },
          },
          {
            name: 'music_pause',
            description: 'Pause playback',
            inputSchema: { type: 'object', properties: {}, required: [] },
          },
          {
            name: 'music_stop',
            description: 'Stop playback',
            inputSchema: { type: 'object', properties: {}, required: [] },
          },
          {
            name: 'music_next',
            description: 'Skip to the next track',
            inputSchema: { type: 'object', properties: {}, required: [] },
          },
          {
            name: 'music_previous',
            description: 'Go to the previous track',
            inputSchema: { type: 'object', properties: {}, required: [] },
          },
          {
            name: 'music_toggle_playback',
            description: 'Toggle between play and pause',
            inputSchema: { type: 'object', properties: {}, required: [] },
          },
          // Current Track Info
          {
            name: 'music_get_current_track',
            description: 'Get information about the currently playing track',
            inputSchema: { type: 'object', properties: {}, required: [] },
          },
          {
            name: 'music_get_player_state',
            description:
              'Get the current player state (playing, paused, stopped)',
            inputSchema: { type: 'object', properties: {}, required: [] },
          },
          // Volume Control
          {
            name: 'music_get_volume',
            description: 'Get the current volume level (0-100)',
            inputSchema: { type: 'object', properties: {}, required: [] },
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
            inputSchema: { type: 'object', properties: {}, required: [] },
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
            inputSchema: { type: 'object', properties: {}, required: [] },
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
            inputSchema: { type: 'object', properties: {}, required: [] },
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
            inputSchema: { type: 'object', properties: {}, required: [] },
          },
          {
            name: 'music_get_playlist_tracks',
            description: 'Get tracks in a specific playlist',
            inputSchema: {
              type: 'object',
              properties: {
                playlist: { type: 'string', description: 'Playlist name' },
                limit: {
                  type: 'number',
                  description:
                    'Maximum number of tracks to return (default: 50)',
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
                playlist: { type: 'string', description: 'Playlist name' },
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
            description:
              'Search the music library for songs, albums, or artists',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
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
                song: { type: 'string', description: 'Song name to play' },
                artist: {
                  type: 'string',
                  description:
                    'Artist name (optional, helps find the right song)',
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
                album: { type: 'string', description: 'Album name' },
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
                artist: { type: 'string', description: 'Artist name' },
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
                song: { type: 'string', description: 'Song name to add' },
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
            inputSchema: { type: 'object', properties: {}, required: [] },
          },
          {
            name: 'music_dislike_track',
            description: 'Dislike the current track',
            inputSchema: { type: 'object', properties: {}, required: [] },
          },
          // Application Control
          {
            name: 'music_open',
            description: 'Open the Music app',
            inputSchema: { type: 'object', properties: {}, required: [] },
          },
          {
            name: 'music_quit',
            description: 'Quit the Music app',
            inputSchema: { type: 'object', properties: {}, required: [] },
          },
        ],
      };
    });

    // Register the call tool handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
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
            return {
              content: [{ type: 'text', text: 'Skipped to next track' }],
            };
          }
          case 'music_previous': {
            runAppleScript('tell application "Music" to previous track');
            return {
              content: [{ type: 'text', text: 'Went to previous track' }],
            };
          }
          case 'music_toggle_playback': {
            runAppleScript('tell application "Music" to playpause');
            return { content: [{ type: 'text', text: 'Toggled playback' }] };
          }
          case 'music_get_current_track': {
            const script = `tell application "Music"\nif player state is not stopped then\nset currentTrack to current track\nreturn name of currentTrack\nelse\nreturn "No track is currently playing"\nend if\nend tell`;
            const result = runAppleScriptMulti(script);
            return { content: [{ type: 'text', text: result }] };
          }
          case 'music_get_player_state': {
            const result = runAppleScript(
              'tell application "Music" to return player state as string'
            );
            return {
              content: [{ type: 'text', text: `Player state: ${result}` }],
            };
          }
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
            return {
              content: [{ type: 'text', text: `Repeat mode: ${result}` }],
            };
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
          case 'music_get_playlists': {
            const script = `tell application "Music"\nset playlistNames to ""\nrepeat with p in playlists\nset playlistNames to playlistNames & name of p & "\\n"\nend repeat\nreturn playlistNames\nend tell`;
            const result = runAppleScriptMulti(script);
            return {
              content: [{ type: 'text', text: `Playlists:\n${result}` }],
            };
          }
          case 'music_get_playlist_tracks': {
            const { playlist, limit = 50 } = args as {
              playlist: string;
              limit?: number;
            };
            const safeName = playlist.replace(/"/g, '\\"');
            const script = `tell application "Music"\ntry\nset thePlaylist to playlist "${safeName}"\nset trackList to ""\nset trackCount to 0\nrepeat with t in tracks of thePlaylist\nif trackCount < ${limit} then\nset trackList to trackList & name of t & " - " & artist of t & "\\n"\nset trackCount to trackCount + 1\nend if\nend repeat\nreturn trackList\non error\nreturn "Playlist not found: ${safeName}"\nend try\nend tell`;
            const result = runAppleScriptMulti(script);
            return { content: [{ type: 'text', text: result }] };
          }
          case 'music_play_playlist': {
            const { playlist, shuffle = false } = args as {
              playlist: string;
              shuffle?: boolean;
            };
            const safeName = playlist.replace(/"/g, '\\"');
            const script = `tell application "Music"\ntry\nset thePlaylist to playlist "${safeName}"\n${shuffle ? 'set shuffle enabled to true\n' : ''}play thePlaylist\nreturn "Playing playlist: ${safeName}"\non error\nreturn "Playlist not found: ${safeName}"\nend try\nend tell`;
            const result = runAppleScriptMulti(script);
            return { content: [{ type: 'text', text: result }] };
          }
          case 'music_search_library': {
            const {
              query,
              searchType = 'all',
              limit = 20,
            } = args as {
              query: string;
              searchType?: string;
              limit?: number;
            };
            const safeQuery = query.replace(/"/g, '\\"');
            if (
              searchType !== 'songs' &&
              searchType !== 'all' &&
              searchType !== 'albums' &&
              searchType !== 'artists'
            ) {
              return {
                content: [{ type: 'text', text: 'Invalid search type' }],
                isError: true,
              };
            }
            const script = `tell application "Music"\nset results to ""\nset matchCount to 0\nrepeat with t in (every track whose name contains "${safeQuery}")\nif matchCount < ${limit} then\nset results to results & name of t & " - " & artist of t & "\\n"\nset matchCount to matchCount + 1\nend if\nend repeat\nreturn results\nend tell`;
            const result = runAppleScriptMulti(script);
            return { content: [{ type: 'text', text: result }] };
          }
          case 'music_play_song': {
            const { song, artist } = args as { song: string; artist?: string };
            const safeSong = song.replace(/"/g, '\\"');
            const safeArtist = artist ? artist.replace(/"/g, '\\"') : null;
            const script = `tell application "Music"\ntry\n${safeArtist ? `set matchingTracks to (every track whose name contains "${safeSong}" and artist contains "${safeArtist}")` : `set matchingTracks to (every track whose name contains "${safeSong}")`}\nif (count of matchingTracks) > 0 then\nplay item 1 of matchingTracks\nreturn "Playing: " & name of item 1 of matchingTracks\nelse\nreturn "Song not found: ${safeSong}"\nend if\non error errMsg\nreturn "Error: " & errMsg\nend try\nend tell`;
            const result = runAppleScriptMulti(script);
            return { content: [{ type: 'text', text: result }] };
          }
          case 'music_play_album': {
            const { album, artist } = args as {
              album: string;
              artist?: string;
            };
            const safeAlbum = album.replace(/"/g, '\\"');
            const safeArtist = artist ? artist.replace(/"/g, '\\"') : null;
            const script = `tell application "Music"\ntry\n${safeArtist ? `set albumTracks to (every track whose album is "${safeAlbum}" and album artist contains "${safeArtist}")` : `set albumTracks to (every track whose album is "${safeAlbum}")`}\nif (count of albumTracks) > 0 then\nplay item 1 of albumTracks\nreturn "Playing album: ${safeAlbum}"\nelse\nreturn "Album not found: ${safeAlbum}"\nend if\non error errMsg\nreturn "Error: " & errMsg\nend try\nend tell`;
            const result = runAppleScriptMulti(script);
            return { content: [{ type: 'text', text: result }] };
          }
          case 'music_play_artist': {
            const { artist, shuffle = true } = args as {
              artist: string;
              shuffle?: boolean;
            };
            const safeArtist = artist.replace(/"/g, '\\"');
            const script = `tell application "Music"\ntry\nset artistTracks to (every track whose artist contains "${safeArtist}")\nif (count of artistTracks) > 0 then\n${shuffle ? 'set shuffle enabled to true\n' : ''}play item 1 of artistTracks\nreturn "Playing songs by: ${safeArtist}"\nelse\nreturn "No songs found by: ${safeArtist}"\nend if\non error errMsg\nreturn "Error: " & errMsg\nend try\nend tell`;
            const result = runAppleScriptMulti(script);
            return { content: [{ type: 'text', text: result }] };
          }
          case 'music_add_to_queue': {
            const { song, artist } = args as { song: string; artist?: string };
            const safeSong = song.replace(/"/g, '\\"');
            const safeArtist = artist ? artist.replace(/"/g, '\\"') : null;
            const script = `tell application "Music"\ntry\n${safeArtist ? `set matchingTracks to (every track whose name contains "${safeSong}" and artist contains "${safeArtist}")` : `set matchingTracks to (every track whose name contains "${safeSong}")`}\nif (count of matchingTracks) > 0 then\nset t to item 1 of matchingTracks\nreturn "Found: " & name of t & " - " & artist of t\nelse\nreturn "Song not found: ${safeSong}"\nend if\non error errMsg\nreturn "Error: " & errMsg\nend try\nend tell`;
            const result = runAppleScriptMulti(script);
            return { content: [{ type: 'text', text: result }] };
          }
          case 'music_love_track': {
            const script = `tell application "Music"\nif player state is not stopped then\nset loved of current track to true\nreturn "Loved: " & name of current track\nelse\nreturn "No track is playing"\nend if\nend tell`;
            const result = runAppleScriptMulti(script);
            return { content: [{ type: 'text', text: result }] };
          }
          case 'music_dislike_track': {
            const script = `tell application "Music"\nif player state is not stopped then\nset disliked of current track to true\nreturn "Disliked: " & name of current track\nelse\nreturn "No track is playing"\nend if\nend tell`;
            const result = runAppleScriptMulti(script);
            return { content: [{ type: 'text', text: result }] };
          }
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

    // Create linked transports
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    // Create client instance
    client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect server and client
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await client.close();
    await server.close();
  });

  describe('Server Initialization', () => {
    it('should create a server with correct name and version', () => {
      expect(server).toBeDefined();
    });

    it('should have tools capability enabled', () => {
      expect(server).toBeDefined();
    });
  });

  describe('Tool Registration - ListTools', () => {
    it('should return all 28 registered tools', async () => {
      const result = await client.listTools();
      expect(result.tools).toHaveLength(28);
    });

    it('should register all playback control tools', async () => {
      const result = await client.listTools();
      const toolNames = result.tools.map((t) => t.name);

      expect(toolNames).toContain('music_play');
      expect(toolNames).toContain('music_pause');
      expect(toolNames).toContain('music_stop');
      expect(toolNames).toContain('music_next');
      expect(toolNames).toContain('music_previous');
      expect(toolNames).toContain('music_toggle_playback');
    });

    it('should register all track info tools', async () => {
      const result = await client.listTools();
      const toolNames = result.tools.map((t) => t.name);

      expect(toolNames).toContain('music_get_current_track');
      expect(toolNames).toContain('music_get_player_state');
    });

    it('should register all volume control tools', async () => {
      const result = await client.listTools();
      const toolNames = result.tools.map((t) => t.name);

      expect(toolNames).toContain('music_get_volume');
      expect(toolNames).toContain('music_set_volume');
    });

    it('should register all position control tools', async () => {
      const result = await client.listTools();
      const toolNames = result.tools.map((t) => t.name);

      expect(toolNames).toContain('music_get_position');
      expect(toolNames).toContain('music_set_position');
    });

    it('should register all shuffle and repeat tools', async () => {
      const result = await client.listTools();
      const toolNames = result.tools.map((t) => t.name);

      expect(toolNames).toContain('music_get_shuffle');
      expect(toolNames).toContain('music_set_shuffle');
      expect(toolNames).toContain('music_get_repeat');
      expect(toolNames).toContain('music_set_repeat');
    });

    it('should register all library access tools', async () => {
      const result = await client.listTools();
      const toolNames = result.tools.map((t) => t.name);

      expect(toolNames).toContain('music_get_playlists');
      expect(toolNames).toContain('music_get_playlist_tracks');
      expect(toolNames).toContain('music_play_playlist');
    });

    it('should register all search and play tools', async () => {
      const result = await client.listTools();
      const toolNames = result.tools.map((t) => t.name);

      expect(toolNames).toContain('music_search_library');
      expect(toolNames).toContain('music_play_song');
      expect(toolNames).toContain('music_play_album');
      expect(toolNames).toContain('music_play_artist');
      expect(toolNames).toContain('music_add_to_queue');
    });

    it('should register all favorites tools', async () => {
      const result = await client.listTools();
      const toolNames = result.tools.map((t) => t.name);

      expect(toolNames).toContain('music_love_track');
      expect(toolNames).toContain('music_dislike_track');
    });

    it('should register all application control tools', async () => {
      const result = await client.listTools();
      const toolNames = result.tools.map((t) => t.name);

      expect(toolNames).toContain('music_open');
      expect(toolNames).toContain('music_quit');
    });

    it('should have correct input schema for music_set_volume', async () => {
      const result = await client.listTools();
      const volumeTool = result.tools.find(
        (t) => t.name === 'music_set_volume'
      );

      expect(volumeTool).toBeDefined();
      expect(volumeTool!.inputSchema).toEqual({
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
      });
    });

    it('should have correct input schema for music_set_repeat', async () => {
      const result = await client.listTools();
      const repeatTool = result.tools.find(
        (t) => t.name === 'music_set_repeat'
      );

      expect(repeatTool).toBeDefined();
      expect(repeatTool!.inputSchema).toEqual({
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
      });
    });
  });

  describe('Tool Handlers - Playback Control', () => {
    it('should handle music_play', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_play',
        arguments: {},
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('tell application "Music" to play'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Playback started' },
      ]);
    });

    it('should handle music_pause', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_pause',
        arguments: {},
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('tell application "Music" to pause'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Playback paused' },
      ]);
    });

    it('should handle music_stop', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_stop',
        arguments: {},
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('tell application "Music" to stop'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Playback stopped' },
      ]);
    });

    it('should handle music_next', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_next',
        arguments: {},
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('tell application "Music" to next track'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Skipped to next track' },
      ]);
    });

    it('should handle music_previous', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_previous',
        arguments: {},
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('tell application "Music" to previous track'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Went to previous track' },
      ]);
    });

    it('should handle music_toggle_playback', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_toggle_playback',
        arguments: {},
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('tell application "Music" to playpause'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Toggled playback' },
      ]);
    });
  });

  describe('Tool Handlers - Track Info', () => {
    it('should handle music_get_current_track', async () => {
      mockedExecSync.mockReturnValue('Test Song');

      const result = await client.callTool({
        name: 'music_get_current_track',
        arguments: {},
      });

      expect(result.content).toEqual([{ type: 'text', text: 'Test Song' }]);
    });

    it('should handle music_get_player_state', async () => {
      mockedExecSync.mockReturnValue('playing');

      const result = await client.callTool({
        name: 'music_get_player_state',
        arguments: {},
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Player state: playing' },
      ]);
    });
  });

  describe('Tool Handlers - Volume Control', () => {
    it('should handle music_get_volume', async () => {
      mockedExecSync.mockReturnValue('75');

      const result = await client.callTool({
        name: 'music_get_volume',
        arguments: {},
      });

      expect(result.content).toEqual([{ type: 'text', text: 'Volume: 75%' }]);
    });

    it('should handle music_set_volume with valid value', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_set_volume',
        arguments: { volume: 50 },
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('set sound volume to 50'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Volume set to 50%' },
      ]);
    });

    it('should clamp volume to 0 when below minimum', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_set_volume',
        arguments: { volume: -10 },
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('set sound volume to 0'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Volume set to 0%' },
      ]);
    });

    it('should clamp volume to 100 when above maximum', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_set_volume',
        arguments: { volume: 150 },
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('set sound volume to 100'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Volume set to 100%' },
      ]);
    });
  });

  describe('Tool Handlers - Position Control', () => {
    it('should handle music_get_position', async () => {
      mockedExecSync.mockReturnValue('45.5');

      const result = await client.callTool({
        name: 'music_get_position',
        arguments: {},
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Position: 45.5 seconds' },
      ]);
    });

    it('should handle music_set_position', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_set_position',
        arguments: { position: 30 },
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('set player position to 30'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Position set to 30 seconds' },
      ]);
    });
  });

  describe('Tool Handlers - Shuffle and Repeat', () => {
    it('should handle music_get_shuffle when enabled', async () => {
      mockedExecSync.mockReturnValue('true');

      const result = await client.callTool({
        name: 'music_get_shuffle',
        arguments: {},
      });

      expect(result.content).toEqual([{ type: 'text', text: 'Shuffle: on' }]);
    });

    it('should handle music_get_shuffle when disabled', async () => {
      mockedExecSync.mockReturnValue('false');

      const result = await client.callTool({
        name: 'music_get_shuffle',
        arguments: {},
      });

      expect(result.content).toEqual([{ type: 'text', text: 'Shuffle: off' }]);
    });

    it('should handle music_set_shuffle to enable', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_set_shuffle',
        arguments: { enabled: true },
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('set shuffle enabled to true'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Shuffle enabled' },
      ]);
    });

    it('should handle music_set_shuffle to disable', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_set_shuffle',
        arguments: { enabled: false },
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('set shuffle enabled to false'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Shuffle disabled' },
      ]);
    });

    it('should handle music_get_repeat', async () => {
      mockedExecSync.mockReturnValue('all');

      const result = await client.callTool({
        name: 'music_get_repeat',
        arguments: {},
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Repeat mode: all' },
      ]);
    });

    it("should handle music_set_repeat with 'off' mode", async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_set_repeat',
        arguments: { mode: 'off' },
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('set song repeat to off'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Repeat mode set to off' },
      ]);
    });

    it("should handle music_set_repeat with 'one' mode", async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_set_repeat',
        arguments: { mode: 'one' },
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('set song repeat to one'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Repeat mode set to one' },
      ]);
    });

    it("should handle music_set_repeat with 'all' mode", async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_set_repeat',
        arguments: { mode: 'all' },
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('set song repeat to all'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Repeat mode set to all' },
      ]);
    });
  });

  describe('Tool Handlers - Library Access', () => {
    it('should handle music_get_playlists', async () => {
      mockedExecSync.mockReturnValue('Favorites\nRecently Added\nTop 25');

      const result = await client.callTool({
        name: 'music_get_playlists',
        arguments: {},
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Playlists:\nFavorites\nRecently Added\nTop 25' },
      ]);
    });

    it('should handle music_get_playlist_tracks', async () => {
      mockedExecSync.mockReturnValue('Song 1 - Artist 1\nSong 2 - Artist 2');

      const result = await client.callTool({
        name: 'music_get_playlist_tracks',
        arguments: { playlist: 'Favorites' },
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Song 1 - Artist 1\nSong 2 - Artist 2' },
      ]);
    });

    it('should handle music_get_playlist_tracks with custom limit', async () => {
      mockedExecSync.mockReturnValue('Song 1 - Artist 1\nSong 2 - Artist 2');

      await client.callTool({
        name: 'music_get_playlist_tracks',
        arguments: { playlist: 'Favorites', limit: 2 },
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('trackCount < 2'),
        expect.any(Object)
      );
    });

    it('should handle music_play_playlist', async () => {
      mockedExecSync.mockReturnValue('Playing playlist: My Playlist');

      const result = await client.callTool({
        name: 'music_play_playlist',
        arguments: { playlist: 'My Playlist' },
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Playing playlist: My Playlist' },
      ]);
    });

    it('should handle music_play_playlist with shuffle', async () => {
      mockedExecSync.mockReturnValue('Playing playlist: My Playlist');

      await client.callTool({
        name: 'music_play_playlist',
        arguments: { playlist: 'My Playlist', shuffle: true },
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('set shuffle enabled to true'),
        expect.any(Object)
      );
    });
  });

  describe('Tool Handlers - Search and Play', () => {
    it('should handle music_search_library with default search type', async () => {
      mockedExecSync.mockReturnValue('Test Song - Test Artist');

      const result = await client.callTool({
        name: 'music_search_library',
        arguments: { query: 'Test' },
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Test Song - Test Artist' },
      ]);
    });

    it('should return error for invalid search type', async () => {
      const result = await client.callTool({
        name: 'music_search_library',
        arguments: { query: 'Test', searchType: 'invalid' },
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Invalid search type' },
      ]);
      expect(result.isError).toBe(true);
    });

    it('should handle music_play_song', async () => {
      mockedExecSync.mockReturnValue('Playing: Test Song');

      const result = await client.callTool({
        name: 'music_play_song',
        arguments: { song: 'Test Song' },
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Playing: Test Song' },
      ]);
    });

    it('should handle music_play_song with artist filter', async () => {
      mockedExecSync.mockReturnValue('Playing: Test Song - Test Artist');

      await client.callTool({
        name: 'music_play_song',
        arguments: { song: 'Test Song', artist: 'Test Artist' },
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('artist contains \\"Test Artist\\"'),
        expect.any(Object)
      );
    });

    it('should handle music_play_album', async () => {
      mockedExecSync.mockReturnValue('Playing album: Test Album');

      const result = await client.callTool({
        name: 'music_play_album',
        arguments: { album: 'Test Album' },
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Playing album: Test Album' },
      ]);
    });

    it('should handle music_play_artist', async () => {
      mockedExecSync.mockReturnValue('Playing songs by: Test Artist');

      const result = await client.callTool({
        name: 'music_play_artist',
        arguments: { artist: 'Test Artist' },
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Playing songs by: Test Artist' },
      ]);
    });

    it('should handle music_play_artist without shuffle', async () => {
      mockedExecSync.mockReturnValue('Playing songs by: Test Artist');

      await client.callTool({
        name: 'music_play_artist',
        arguments: { artist: 'Test Artist', shuffle: false },
      });

      const lastCall =
        mockedExecSync.mock.calls[mockedExecSync.mock.calls.length - 1][0];
      expect(lastCall).not.toContain('set shuffle enabled to true');
    });

    it('should handle music_add_to_queue', async () => {
      mockedExecSync.mockReturnValue('Found: Test Song - Test Artist');

      const result = await client.callTool({
        name: 'music_add_to_queue',
        arguments: { song: 'Test Song' },
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Found: Test Song - Test Artist' },
      ]);
    });
  });

  describe('Tool Handlers - Favorites', () => {
    it('should handle music_love_track', async () => {
      mockedExecSync.mockReturnValue('Loved: Test Song');

      const result = await client.callTool({
        name: 'music_love_track',
        arguments: {},
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Loved: Test Song' },
      ]);
    });

    it('should handle music_dislike_track', async () => {
      mockedExecSync.mockReturnValue('Disliked: Test Song');

      const result = await client.callTool({
        name: 'music_dislike_track',
        arguments: {},
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Disliked: Test Song' },
      ]);
    });
  });

  describe('Tool Handlers - Application Control', () => {
    it('should handle music_open', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_open',
        arguments: {},
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('tell application "Music" to activate'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Music app opened' },
      ]);
    });

    it('should handle music_quit', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await client.callTool({
        name: 'music_quit',
        arguments: {},
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('tell application "Music" to quit'),
        expect.any(Object)
      );
      expect(result.content).toEqual([
        { type: 'text', text: 'Music app closed' },
      ]);
    });
  });

  describe('Error Handling', () => {
    it('should return error for unknown tool', async () => {
      const result = await client.callTool({
        name: 'unknown_tool',
        arguments: {},
      });

      expect(result.content).toEqual([
        { type: 'text', text: 'Unknown tool: unknown_tool' },
      ]);
      expect(result.isError).toBe(true);
    });

    it('should handle AppleScript execution errors', async () => {
      const error = new Error('Command failed');
      (error as Error & { stderr: string }).stderr =
        'AppleScript execution error: Music is not running';
      mockedExecSync.mockImplementation(() => {
        throw error;
      });

      const result = await client.callTool({
        name: 'music_play',
        arguments: {},
      });

      expect(result.content).toEqual([
        {
          type: 'text',
          text: 'Error: AppleScript error: AppleScript execution error: Music is not running',
        },
      ]);
      expect(result.isError).toBe(true);
    });

    it('should handle AppleScript errors without stderr', async () => {
      const error = new Error('Command failed without stderr');
      mockedExecSync.mockImplementation(() => {
        throw error;
      });

      const result = await client.callTool({
        name: 'music_pause',
        arguments: {},
      });

      expect(result.content).toEqual([
        {
          type: 'text',
          text: 'Error: AppleScript error: Command failed without stderr',
        },
      ]);
      expect(result.isError).toBe(true);
    });
  });

  describe('Input Sanitization', () => {
    it('should escape double quotes in playlist names', async () => {
      mockedExecSync.mockReturnValue('Playing playlist: Test "Playlist"');

      await client.callTool({
        name: 'music_play_playlist',
        arguments: { playlist: 'Test "Playlist"' },
      });

      // The double quotes are escaped for shell escaping
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('Test \\\\\\"Playlist\\\\\\"'),
        expect.any(Object)
      );
    });

    it('should escape double quotes in song names', async () => {
      mockedExecSync.mockReturnValue('Playing: Test Song - Test Artist');

      await client.callTool({
        name: 'music_play_song',
        arguments: { song: 'Test "Song"' },
      });

      // The double quotes are escaped for shell escaping
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('Test \\\\\\"Song\\\\\\"'),
        expect.any(Object)
      );
    });

    it('should escape double quotes in search queries', async () => {
      mockedExecSync.mockReturnValue('No results found for: Test');

      await client.callTool({
        name: 'music_search_library',
        arguments: { query: 'Test "Query"' },
      });

      // The double quotes are escaped for shell escaping
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('Test \\\\\\"Query\\\\\\"'),
        expect.any(Object)
      );
    });
  });
});
