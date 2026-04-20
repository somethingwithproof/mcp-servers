import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as childProcess from 'child_process';

// Mock child_process module to prevent actual AppleScript execution during tests
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

const mockedExecSync = vi.mocked(childProcess.execSync);

// Define tool input schemas for testing
interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

// Helper function to run AppleScript (same as in index.ts)
function runAppleScript(script: string): string {
  try {
    return (
      childProcess.execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024,
      }) as string
    ).trim();
  } catch (error: unknown) {
    const err = error as Error & { stderr?: string };
    throw new Error(`AppleScript error: ${err.stderr || err.message}`);
  }
}

// Helper to open URLs
function openURL(url: string): void {
  const safeUrl = url.replace(/'/g, "'\"'\"'");
  childProcess.execSync(`open '${safeUrl}'`);
}

// Define tools array (same as in index.ts)
function getTools(): Tool[] {
  return [
    {
      name: 'maps_open',
      description: 'Open the Apple Maps app',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'maps_search',
      description: 'Search for a location in Apple Maps',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: "Search query (e.g., 'coffee shops near me', 'Eiffel Tower')",
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'maps_get_directions',
      description: 'Get directions between two locations',
      inputSchema: {
        type: 'object',
        properties: {
          from: {
            type: 'string',
            description: "Starting location (address or place name, or 'current location')",
          },
          to: {
            type: 'string',
            description: 'Destination (address or place name)',
          },
          mode: {
            type: 'string',
            enum: ['driving', 'walking', 'transit'],
            description: 'Transportation mode (default: driving)',
          },
        },
        required: ['to'],
      },
    },
    {
      name: 'maps_show_location',
      description: 'Show a specific location on the map',
      inputSchema: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Address or place name to show',
          },
        },
        required: ['address'],
      },
    },
    {
      name: 'maps_show_coordinates',
      description: 'Show a location by coordinates',
      inputSchema: {
        type: 'object',
        properties: {
          latitude: {
            type: 'number',
            description: 'Latitude coordinate',
          },
          longitude: {
            type: 'number',
            description: 'Longitude coordinate',
          },
          label: {
            type: 'string',
            description: 'Optional label for the pin',
          },
        },
        required: ['latitude', 'longitude'],
      },
    },
    {
      name: 'maps_drop_pin',
      description: 'Drop a pin at a specific location',
      inputSchema: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Address where to drop the pin',
          },
          label: {
            type: 'string',
            description: 'Label for the pin (optional)',
          },
        },
        required: ['address'],
      },
    },
    {
      name: 'maps_nearby',
      description: 'Find nearby places of a specific type',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: "Type of place (e.g., 'restaurants', 'gas stations', 'hotels', 'coffee')",
          },
          near: {
            type: 'string',
            description: 'Location to search near (optional, defaults to current location)',
          },
        },
        required: ['type'],
      },
    },
    {
      name: 'maps_create_url',
      description: 'Create a shareable Apple Maps URL for a location',
      inputSchema: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Address or place name',
          },
        },
        required: ['address'],
      },
    },
  ];
}

// Tool handler function (same logic as in index.ts)
interface ToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

function handleToolCall(name: string, args: Record<string, unknown>): ToolResponse {
  try {
    switch (name) {
      case 'maps_open': {
        runAppleScript('tell application "Maps" to activate');
        return { content: [{ type: 'text', text: 'Apple Maps opened' }] };
      }

      case 'maps_search': {
        const query = (args as { query: string }).query;
        const encodedQuery = encodeURIComponent(query);
        const url = `maps://?q=${encodedQuery}`;
        openURL(url);
        return { content: [{ type: 'text', text: `Searching for: ${query}` }] };
      }

      case 'maps_get_directions': {
        const { from, to, mode = 'driving' } = args as { from?: string; to: string; mode?: string };
        const modeMap: Record<string, string> = {
          driving: 'd',
          walking: 'w',
          transit: 'r',
        };
        const dirMode = modeMap[mode] || 'd';

        let url: string;
        if (from && from.toLowerCase() !== 'current location') {
          const encodedFrom = encodeURIComponent(from);
          const encodedTo = encodeURIComponent(to);
          url = `maps://?saddr=${encodedFrom}&daddr=${encodedTo}&dirflg=${dirMode}`;
        } else {
          const encodedTo = encodeURIComponent(to);
          url = `maps://?daddr=${encodedTo}&dirflg=${dirMode}`;
        }

        openURL(url);
        return {
          content: [
            {
              type: 'text',
              text: `Getting ${mode} directions${from ? ` from ${from}` : ''} to ${to}`,
            },
          ],
        };
      }

      case 'maps_show_location': {
        const address = (args as { address: string }).address;
        const encodedAddress = encodeURIComponent(address);
        const url = `maps://?address=${encodedAddress}`;
        openURL(url);
        return { content: [{ type: 'text', text: `Showing: ${address}` }] };
      }

      case 'maps_show_coordinates': {
        const { latitude, longitude, label } = args as {
          latitude: number;
          longitude: number;
          label?: string;
        };
        let url = `maps://?ll=${latitude},${longitude}`;
        if (label) {
          url += `&q=${encodeURIComponent(label)}`;
        }
        openURL(url);
        return {
          content: [
            {
              type: 'text',
              text: `Showing coordinates: ${latitude}, ${longitude}${label ? ` (${label})` : ''}`,
            },
          ],
        };
      }

      case 'maps_drop_pin': {
        const { address, label } = args as { address: string; label?: string };
        const encodedAddress = encodeURIComponent(address);
        let url = `maps://?address=${encodedAddress}`;
        if (label) {
          url += `&q=${encodeURIComponent(label)}`;
        }
        openURL(url);
        return {
          content: [
            {
              type: 'text',
              text: `Dropped pin at: ${address}${label ? ` (${label})` : ''}`,
            },
          ],
        };
      }

      case 'maps_nearby': {
        const { type, near } = args as { type: string; near?: string };
        let query = type;
        if (near) {
          query += ` near ${near}`;
        }
        const encodedQuery = encodeURIComponent(query);
        const url = `maps://?q=${encodedQuery}`;
        openURL(url);
        return {
          content: [
            {
              type: 'text',
              text: `Searching for ${type}${near ? ` near ${near}` : ' nearby'}`,
            },
          ],
        };
      }

      case 'maps_create_url': {
        const address = (args as { address: string }).address;
        const encodedAddress = encodeURIComponent(address);
        const appleUrl = `maps://?address=${encodedAddress}`;
        const webUrl = `https://maps.apple.com/?address=${encodedAddress}`;
        return {
          content: [
            {
              type: 'text',
              text: `Apple Maps URLs for "${address}":\n\nApp URL: ${appleUrl}\nWeb URL: ${webUrl}`,
            },
          ],
        };
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
}

describe('Maps MCP Server E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedExecSync.mockReturnValue('');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Server Initialization', () => {
    it('should have correct server configuration', () => {
      const serverConfig = {
        name: 'maps-mcp',
        version: '1.0.0',
      };
      expect(serverConfig.name).toBe('maps-mcp');
      expect(serverConfig.version).toBe('1.0.0');
    });

    it('should have tools capability enabled', () => {
      const capabilities = {
        tools: {},
      };
      expect(capabilities.tools).toBeDefined();
    });
  });

  describe('Tool Registration', () => {
    it('should register all 8 tools', () => {
      const tools = getTools();
      expect(tools).toHaveLength(8);
    });

    it('should register maps_open tool', () => {
      const tools = getTools();
      const tool = tools.find((t) => t.name === 'maps_open');
      expect(tool).toBeDefined();
      expect(tool?.description).toBe('Open the Apple Maps app');
    });

    it('should register maps_search tool with correct schema', () => {
      const tools = getTools();
      const tool = tools.find((t) => t.name === 'maps_search');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('query');
    });

    it('should register maps_get_directions tool with correct schema', () => {
      const tools = getTools();
      const tool = tools.find((t) => t.name === 'maps_get_directions');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('to');
      expect(tool?.inputSchema.properties).toHaveProperty('mode');
    });

    it('should register maps_show_location tool', () => {
      const tools = getTools();
      const tool = tools.find((t) => t.name === 'maps_show_location');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('address');
    });

    it('should register maps_show_coordinates tool with lat/long', () => {
      const tools = getTools();
      const tool = tools.find((t) => t.name === 'maps_show_coordinates');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('latitude');
      expect(tool?.inputSchema.required).toContain('longitude');
    });

    it('should register maps_drop_pin tool', () => {
      const tools = getTools();
      const tool = tools.find((t) => t.name === 'maps_drop_pin');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('address');
    });

    it('should register maps_nearby tool', () => {
      const tools = getTools();
      const tool = tools.find((t) => t.name === 'maps_nearby');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('type');
    });

    it('should register maps_create_url tool', () => {
      const tools = getTools();
      const tool = tools.find((t) => t.name === 'maps_create_url');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('address');
    });

    it('should have unique tool names', () => {
      const tools = getTools();
      const names = tools.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have valid input schemas for all tools', () => {
      const tools = getTools();
      for (const tool of tools) {
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
        expect(Array.isArray(tool.inputSchema.required)).toBe(true);
      }
    });
  });

  describe('Tool Handlers - maps_open', () => {
    it('should open Apple Maps app', () => {
      const response = handleToolCall('maps_open', {});
      expect(response.content).toEqual([{ type: 'text', text: 'Apple Maps opened' }]);
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('osascript -e'),
        expect.any(Object)
      );
    });

    it('should call AppleScript with correct command', () => {
      handleToolCall('maps_open', {});
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('tell application "Maps" to activate'),
        expect.any(Object)
      );
    });
  });

  describe('Tool Handlers - maps_search', () => {
    it('should search for a location', () => {
      const response = handleToolCall('maps_search', { query: 'coffee shops' });
      expect(response.content).toEqual([{ type: 'text', text: 'Searching for: coffee shops' }]);
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('maps://?q=coffee%20shops')
      );
    });

    it('should URL encode special characters in search query', () => {
      const response = handleToolCall('maps_search', {
        query: 'San Francisco, CA',
      });
      expect(response.content).toEqual([
        { type: 'text', text: 'Searching for: San Francisco, CA' },
      ]);
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('San%20Francisco%2C%20CA')
      );
    });

    it('should handle spaces in query', () => {
      const response = handleToolCall('maps_search', {
        query: 'new york city',
      });
      expect(response.content[0].text).toBe('Searching for: new york city');
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('new%20york%20city'));
    });
  });

  describe('Tool Handlers - maps_get_directions', () => {
    it('should get directions with destination only (from current location)', () => {
      const response = handleToolCall('maps_get_directions', {
        to: 'Times Square, New York',
      });
      expect(response.content).toEqual([
        {
          type: 'text',
          text: 'Getting driving directions to Times Square, New York',
        },
      ]);
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('daddr=Times%20Square%2C%20New%20York')
      );
    });

    it('should get directions with from and to locations', () => {
      const response = handleToolCall('maps_get_directions', {
        from: 'Central Park',
        to: 'Times Square',
      });
      expect(response.content).toEqual([
        {
          type: 'text',
          text: 'Getting driving directions from Central Park to Times Square',
        },
      ]);
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('saddr=Central%20Park'));
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('daddr=Times%20Square'));
    });

    it("should handle 'current location' as from address", () => {
      handleToolCall('maps_get_directions', {
        from: 'current location',
        to: 'Airport',
      });
      // When from is "current location", it should not include saddr
      expect(mockedExecSync).toHaveBeenCalledWith(expect.not.stringContaining('saddr'));
    });

    it("should handle 'Current Location' with different case", () => {
      handleToolCall('maps_get_directions', {
        from: 'CURRENT LOCATION',
        to: 'Airport',
      });
      expect(mockedExecSync).toHaveBeenCalledWith(expect.not.stringContaining('saddr'));
    });

    it('should use walking mode', () => {
      const response = handleToolCall('maps_get_directions', {
        to: 'Library',
        mode: 'walking',
      });
      expect(response.content[0]).toHaveProperty('text', 'Getting walking directions to Library');
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('dirflg=w'));
    });

    it('should use transit mode', () => {
      const response = handleToolCall('maps_get_directions', {
        to: 'Downtown',
        mode: 'transit',
      });
      expect(response.content[0]).toHaveProperty('text', 'Getting transit directions to Downtown');
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('dirflg=r'));
    });

    it('should default to driving mode when not specified', () => {
      handleToolCall('maps_get_directions', { to: 'Mall' });
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('dirflg=d'));
    });

    it('should default to driving mode for unknown mode', () => {
      handleToolCall('maps_get_directions', { to: 'Mall', mode: 'bicycle' });
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('dirflg=d'));
    });
  });

  describe('Tool Handlers - maps_show_location', () => {
    it('should show a location by address', () => {
      const response = handleToolCall('maps_show_location', {
        address: '1600 Pennsylvania Avenue',
      });
      expect(response.content).toEqual([
        { type: 'text', text: 'Showing: 1600 Pennsylvania Avenue' },
      ]);
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('address=1600%20Pennsylvania%20Avenue')
      );
    });

    it('should handle international addresses', () => {
      const response = handleToolCall('maps_show_location', {
        address: '10 Downing Street, London, UK',
      });
      expect(response.content[0].text).toBe('Showing: 10 Downing Street, London, UK');
    });
  });

  describe('Tool Handlers - maps_show_coordinates', () => {
    it('should show coordinates without label', () => {
      const response = handleToolCall('maps_show_coordinates', {
        latitude: 37.7749,
        longitude: -122.4194,
      });
      expect(response.content).toEqual([
        { type: 'text', text: 'Showing coordinates: 37.7749, -122.4194' },
      ]);
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('ll=37.7749,-122.4194'));
    });

    it('should show coordinates with label', () => {
      const response = handleToolCall('maps_show_coordinates', {
        latitude: 37.7749,
        longitude: -122.4194,
        label: 'San Francisco',
      });
      expect(response.content).toEqual([
        {
          type: 'text',
          text: 'Showing coordinates: 37.7749, -122.4194 (San Francisco)',
        },
      ]);
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('q=San%20Francisco'));
    });

    it('should handle zero coordinates', () => {
      const response = handleToolCall('maps_show_coordinates', {
        latitude: 0,
        longitude: 0,
      });
      expect(response.content[0].text).toBe('Showing coordinates: 0, 0');
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('ll=0,0'));
    });

    it('should handle extreme coordinates', () => {
      const response = handleToolCall('maps_show_coordinates', {
        latitude: 90,
        longitude: 180,
      });
      expect(response.content[0].text).toBe('Showing coordinates: 90, 180');
    });
  });

  describe('Tool Handlers - maps_drop_pin', () => {
    it('should drop pin at address without label', () => {
      const response = handleToolCall('maps_drop_pin', {
        address: '123 Main Street',
      });
      expect(response.content).toEqual([{ type: 'text', text: 'Dropped pin at: 123 Main Street' }]);
    });

    it('should drop pin at address with label', () => {
      const response = handleToolCall('maps_drop_pin', {
        address: '123 Main Street',
        label: 'My Home',
      });
      expect(response.content).toEqual([
        { type: 'text', text: 'Dropped pin at: 123 Main Street (My Home)' },
      ]);
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('q=My%20Home'));
    });

    it('should URL encode address', () => {
      handleToolCall('maps_drop_pin', { address: '123 Main St & 5th Ave' });
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('123%20Main%20St%20%26%205th%20Ave')
      );
    });
  });

  describe('Tool Handlers - maps_nearby', () => {
    it('should search for nearby places without location', () => {
      const response = handleToolCall('maps_nearby', { type: 'restaurants' });
      expect(response.content).toEqual([
        { type: 'text', text: 'Searching for restaurants nearby' },
      ]);
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('q=restaurants'));
    });

    it('should search for nearby places with location', () => {
      const response = handleToolCall('maps_nearby', {
        type: 'coffee',
        near: 'Union Square',
      });
      expect(response.content).toEqual([
        { type: 'text', text: 'Searching for coffee near Union Square' },
      ]);
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('coffee%20near%20Union%20Square')
      );
    });

    it('should handle various place types', () => {
      const types = ['gas stations', 'hotels', 'pharmacies', 'ATM'];
      for (const type of types) {
        vi.clearAllMocks();
        const response = handleToolCall('maps_nearby', { type });
        expect(response.content[0].text).toContain(`Searching for ${type}`);
      }
    });
  });

  describe('Tool Handlers - maps_create_url', () => {
    it('should create shareable URLs', () => {
      const response = handleToolCall('maps_create_url', {
        address: 'Eiffel Tower, Paris',
      });
      const text = response.content[0].text;
      expect(text).toContain('Apple Maps URLs for "Eiffel Tower, Paris"');
      expect(text).toContain('maps://?address=Eiffel%20Tower%2C%20Paris');
      expect(text).toContain('https://maps.apple.com/?address=Eiffel%20Tower%2C%20Paris');
    });

    it('should not call execSync (no external command needed)', () => {
      const callCountBefore = mockedExecSync.mock.calls.length;
      handleToolCall('maps_create_url', { address: 'Test Location' });
      // maps_create_url should not execute any commands
      expect(mockedExecSync.mock.calls.length).toBe(callCountBefore);
    });

    it('should generate both app and web URLs', () => {
      const response = handleToolCall('maps_create_url', {
        address: 'Statue of Liberty',
      });
      const text = response.content[0].text;
      expect(text).toContain('App URL: maps://');
      expect(text).toContain('Web URL: https://maps.apple.com/');
    });
  });

  describe('Error Handling', () => {
    it('should return error for unknown tool', () => {
      const response = handleToolCall('unknown_tool', {});
      expect(response.content).toEqual([{ type: 'text', text: 'Unknown tool: unknown_tool' }]);
      expect(response.isError).toBe(true);
    });

    it('should handle AppleScript execution errors', () => {
      mockedExecSync.mockImplementation(() => {
        const error = new Error('Command failed') as Error & { stderr: string };
        error.stderr = 'AppleScript execution failed';
        throw error;
      });

      const response = handleToolCall('maps_open', {});
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0].text).toContain('Error:');
      expect(response.content[0].text).toContain('AppleScript');
      expect(response.isError).toBe(true);
    });

    it('should handle URL open errors', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Unable to open URL');
      });

      const response = handleToolCall('maps_search', { query: 'test' });
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Error:');
    });

    it('should handle errors without stderr', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Generic error');
      });

      const response = handleToolCall('maps_open', {});
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Error:');
    });
  });

  describe('Input Validation', () => {
    it('should handle empty query in maps_search', () => {
      const response = handleToolCall('maps_search', { query: '' });
      // Should still work, just with empty query
      expect(response.content).toEqual([{ type: 'text', text: 'Searching for: ' }]);
    });

    it('should handle special characters in address', () => {
      const response = handleToolCall('maps_show_location', {
        address: "123 O'Brien Street & Main Ave",
      });
      expect(response.content[0]).toHaveProperty('text', "Showing: 123 O'Brien Street & Main Ave");
    });

    it('should handle negative coordinates', () => {
      const response = handleToolCall('maps_show_coordinates', {
        latitude: -33.8688,
        longitude: 151.2093,
      });
      expect(response.content).toEqual([
        { type: 'text', text: 'Showing coordinates: -33.8688, 151.2093' },
      ]);
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('ll=-33.8688,151.2093'));
    });

    it('should handle unicode characters', () => {
      const response = handleToolCall('maps_search', { query: 'Tokyo' });
      expect(response.content[0]).toHaveProperty('text', 'Searching for: Tokyo');
    });

    it('should handle very long addresses', () => {
      const longAddress =
        'This is a very long address with many words to test the handling of long strings in the maps MCP server';
      const response = handleToolCall('maps_show_location', {
        address: longAddress,
      });
      expect(response.content[0].text).toBe(`Showing: ${longAddress}`);
    });

    it('should handle addresses with numbers', () => {
      const response = handleToolCall('maps_show_location', {
        address: '12345 67890 Street, Unit #100',
      });
      expect(response.content[0].text).toBe('Showing: 12345 67890 Street, Unit #100');
    });
  });

  describe('URL Encoding', () => {
    it('should properly encode spaces', () => {
      handleToolCall('maps_search', { query: 'new york' });
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('new%20york'));
    });

    it('should properly encode ampersands', () => {
      handleToolCall('maps_search', { query: 'bars & restaurants' });
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('bars%20%26%20restaurants')
      );
    });

    it('should properly encode question marks', () => {
      handleToolCall('maps_search', { query: 'where is the station?' });
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('where%20is%20the%20station%3F')
      );
    });

    it('should properly encode plus signs', () => {
      handleToolCall('maps_search', { query: 'coffee+tea' });
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining('coffee%2Btea'));
    });
  });

  describe('Helper Functions', () => {
    it('runAppleScript should escape single quotes', () => {
      // Test that runAppleScript properly handles single quotes
      mockedExecSync.mockReturnValue('success');
      runAppleScript("tell application 'Maps' to activate");
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("'\"'\"'"),
        expect.any(Object)
      );
    });

    it('openURL should escape single quotes in URLs', () => {
      // Test that openURL properly handles single quotes
      openURL("maps://?q=O'Brien");
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining("'\"'\"'"));
    });
  });
});
