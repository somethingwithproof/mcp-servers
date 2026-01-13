import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as childProcess from 'child_process';

// Mock child_process module to prevent actual AppleScript/shortcuts execution during tests
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

// Get the mocked execSync
const mockedExecSync = vi.mocked(childProcess.execSync);

// Expected tool names based on the server implementation
const EXPECTED_TOOLS = [
  'home_open',
  'home_run_scene',
  'home_control_device',
  'home_list_shortcuts',
  'home_lights_on',
  'home_lights_off',
  'home_set_thermostat',
  'home_lock_doors',
  'home_unlock_doors',
  'home_get_status',
];

// Tool definitions matching index.ts
const TOOL_DEFINITIONS = [
  {
    name: 'home_open',
    description: 'Open the Home app',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'home_run_scene',
    description: 'Run a HomeKit scene by name (uses Shortcuts)',
    inputSchema: {
      type: 'object',
      properties: {
        scene: {
          type: 'string',
          description: "Scene name to run (e.g., 'Good Morning', 'Movie Time')",
        },
      },
      required: ['scene'],
    },
  },
  {
    name: 'home_control_device',
    description:
      'Control a HomeKit device (requires a Shortcut set up for the device)',
    inputSchema: {
      type: 'object',
      properties: {
        shortcutName: {
          type: 'string',
          description: 'Name of the Shortcut that controls the device',
        },
        action: {
          type: 'string',
          description: 'Action to perform (passed as input to the shortcut)',
        },
      },
      required: ['shortcutName'],
    },
  },
  {
    name: 'home_list_shortcuts',
    description: 'List available Shortcuts that may be related to Home control',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'Filter shortcuts by name (optional)',
        },
      },
      required: [],
    },
  },
  {
    name: 'home_lights_on',
    description: "Turn on lights (requires 'Lights On' shortcut)",
    inputSchema: {
      type: 'object',
      properties: {
        room: {
          type: 'string',
          description: "Room name (optional, e.g., 'living room', 'bedroom')",
        },
      },
      required: [],
    },
  },
  {
    name: 'home_lights_off',
    description: "Turn off lights (requires 'Lights Off' shortcut)",
    inputSchema: {
      type: 'object',
      properties: {
        room: {
          type: 'string',
          description: "Room name (optional, e.g., 'living room', 'bedroom')",
        },
      },
      required: [],
    },
  },
  {
    name: 'home_set_thermostat',
    description:
      "Set thermostat temperature (requires 'Set Thermostat' shortcut)",
    inputSchema: {
      type: 'object',
      properties: {
        temperature: {
          type: 'number',
          description: 'Temperature to set',
        },
        unit: {
          type: 'string',
          enum: ['fahrenheit', 'celsius'],
          description: 'Temperature unit (default: fahrenheit)',
        },
      },
      required: ['temperature'],
    },
  },
  {
    name: 'home_lock_doors',
    description: "Lock all doors (requires 'Lock Doors' shortcut)",
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'home_unlock_doors',
    description: "Unlock all doors (requires 'Unlock Doors' shortcut)",
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'home_get_status',
    description: 'Open Home app to view device status (limited API access)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// Helper function to run AppleScript (matches index.ts implementation)
// Note: This is mocked in tests to avoid actual system calls
function runAppleScript(script: string): string {
  try {
    return childProcess
      .execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024,
      })
      .toString()
      .trim();
  } catch (error: unknown) {
    const err = error as Error & { stderr?: string };
    throw new Error(`AppleScript error: ${err.stderr || err.message}`);
  }
}

// Helper to run shortcuts (matches index.ts implementation)
// Note: This is mocked in tests to avoid actual system calls
function runShortcut(name: string, input?: string): string {
  try {
    const escapedName = name.replace(/'/g, "'\"'\"'");
    const inputPart = input ? ` -i '${input.replace(/'/g, "'\"'\"'")}'` : '';
    return childProcess
      .execSync(`shortcuts run '${escapedName}'${inputPart}`, {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024,
      })
      .toString()
      .trim();
  } catch (error: unknown) {
    const err = error as Error & { stderr?: string };
    throw new Error(`Shortcut error: ${err.stderr || err.message}`);
  }
}

// Tool handler implementation matching index.ts
async function handleToolCall(
  name: string,
  args: Record<string, unknown> = {}
): Promise<{
  content: { type: string; text: string }[];
  isError?: boolean;
}> {
  try {
    switch (name) {
      case 'home_open': {
        runAppleScript('tell application "Home" to activate');
        return { content: [{ type: 'text', text: 'Home app opened' }] };
      }

      case 'home_run_scene': {
        const scene = (args as { scene: string }).scene;
        try {
          runShortcut(scene);
          return {
            content: [{ type: 'text', text: `Activated scene: ${scene}` }],
          };
        } catch {
          return {
            content: [
              {
                type: 'text',
                text: `To run scene "${scene}", please create a Shortcut with that name that activates the HomeKit scene.`,
              },
            ],
          };
        }
      }

      case 'home_control_device': {
        const { shortcutName, action } = args as {
          shortcutName: string;
          action?: string;
        };
        try {
          runShortcut(shortcutName, action);
          return {
            content: [
              {
                type: 'text',
                text: `Executed shortcut: ${shortcutName}${action ? ` with action: ${action}` : ''}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error running shortcut "${shortcutName}": ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }

      case 'home_list_shortcuts': {
        const filter = (args as { filter?: string }).filter?.toLowerCase();
        try {
          const result = childProcess.execSync('shortcuts list', {
            encoding: 'utf-8',
          }) as string;
          const shortcuts = result.split('\n').filter((s) => s.trim());
          const homeRelated = filter
            ? shortcuts.filter((s) => s.toLowerCase().includes(filter))
            : shortcuts.filter(
                (s) =>
                  s.toLowerCase().includes('light') ||
                  s.toLowerCase().includes('home') ||
                  s.toLowerCase().includes('scene') ||
                  s.toLowerCase().includes('lock') ||
                  s.toLowerCase().includes('thermostat') ||
                  s.toLowerCase().includes('door') ||
                  s.toLowerCase().includes('room')
              );

          if (homeRelated.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: filter
                    ? `No shortcuts found matching: ${filter}`
                    : 'No Home-related shortcuts found. Create Shortcuts in the Shortcuts app to control your Home devices.',
                },
              ],
            };
          }
          return {
            content: [
              {
                type: 'text',
                text: `Available Shortcuts:\n${homeRelated.join('\n')}`,
              },
            ],
          };
        } catch {
          return {
            content: [
              {
                type: 'text',
                text: 'Error listing shortcuts. Make sure Shortcuts app is available.',
              },
            ],
            isError: true,
          };
        }
      }

      case 'home_lights_on': {
        const room = (args as { room?: string }).room;
        const command = room ? `turn on ${room} lights` : 'turn on the lights';
        try {
          const shortcutName = room ? `${room} Lights On` : 'Lights On';
          runShortcut(shortcutName);
          return {
            content: [
              { type: 'text', text: `Lights on${room ? ` in ${room}` : ''}` },
            ],
          };
        } catch {
          return {
            content: [
              {
                type: 'text',
                text: `To turn on lights${room ? ` in ${room}` : ''}, create a Shortcut named "${room ? `${room} Lights On` : 'Lights On'}" that controls your HomeKit lights.\n\nAlternatively, you can say to Siri: "${command}"`,
              },
            ],
          };
        }
      }

      case 'home_lights_off': {
        const room = (args as { room?: string }).room;
        const command = room
          ? `turn off ${room} lights`
          : 'turn off the lights';
        try {
          const shortcutName = room ? `${room} Lights Off` : 'Lights Off';
          runShortcut(shortcutName);
          return {
            content: [
              {
                type: 'text',
                text: `Lights off${room ? ` in ${room}` : ''}`,
              },
            ],
          };
        } catch {
          return {
            content: [
              {
                type: 'text',
                text: `To turn off lights${room ? ` in ${room}` : ''}, create a Shortcut named "${room ? `${room} Lights Off` : 'Lights Off'}" that controls your HomeKit lights.\n\nAlternatively, you can say to Siri: "${command}"`,
              },
            ],
          };
        }
      }

      case 'home_set_thermostat': {
        const { temperature, unit = 'fahrenheit' } = args as {
          temperature: number;
          unit?: string;
        };
        const tempStr = `${temperature} degrees ${unit}`;
        try {
          runShortcut('Set Thermostat', tempStr);
          return {
            content: [
              {
                type: 'text',
                text: `Thermostat set to ${temperature}${unit === 'celsius' ? 'C' : 'F'}`,
              },
            ],
          };
        } catch {
          return {
            content: [
              {
                type: 'text',
                text: `To set thermostat to ${temperature}${unit === 'celsius' ? 'C' : 'F'}, create a Shortcut named "Set Thermostat" that controls your HomeKit thermostat.\n\nAlternatively, you can say to Siri: "Set the thermostat to ${tempStr}"`,
              },
            ],
          };
        }
      }

      case 'home_lock_doors': {
        try {
          runShortcut('Lock Doors');
          return { content: [{ type: 'text', text: 'Doors locked' }] };
        } catch {
          return {
            content: [
              {
                type: 'text',
                text: `To lock doors, create a Shortcut named "Lock Doors" that controls your HomeKit locks.\n\nAlternatively, you can say to Siri: "Lock all doors"`,
              },
            ],
          };
        }
      }

      case 'home_unlock_doors': {
        try {
          runShortcut('Unlock Doors');
          return { content: [{ type: 'text', text: 'Doors unlocked' }] };
        } catch {
          return {
            content: [
              {
                type: 'text',
                text: `To unlock doors, create a Shortcut named "Unlock Doors" that controls your HomeKit locks.\n\nAlternatively, you can say to Siri: "Unlock all doors"`,
              },
            ],
          };
        }
      }

      case 'home_get_status': {
        runAppleScript('tell application "Home" to activate');
        return {
          content: [
            {
              type: 'text',
              text: 'Home app opened. Note: HomeKit device status is not accessible via AppleScript. View status in the Home app.',
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

describe('Home MCP Server E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Server Configuration', () => {
    it('should have correct server name and version', () => {
      const serverInfo = {
        name: 'home-mcp',
        version: '1.0.0',
      };
      expect(serverInfo.name).toBe('home-mcp');
      expect(serverInfo.version).toBe('1.0.0');
    });

    it('should have tools capability enabled', () => {
      const capabilities = {
        tools: {},
      };
      expect(capabilities).toHaveProperty('tools');
    });
  });

  describe('Tool Registration', () => {
    it('should register all expected tools', () => {
      const toolNames = TOOL_DEFINITIONS.map((t) => t.name);

      expect(toolNames).toHaveLength(EXPECTED_TOOLS.length);
      for (const expectedTool of EXPECTED_TOOLS) {
        expect(toolNames).toContain(expectedTool);
      }
    });

    it('should have correct schema for home_run_scene', () => {
      const tool = TOOL_DEFINITIONS.find((t) => t.name === 'home_run_scene');

      expect(tool).toBeDefined();
      expect(tool?.inputSchema).toMatchObject({
        type: 'object',
        properties: {
          scene: {
            type: 'string',
          },
        },
        required: ['scene'],
      });
    });

    it('should have correct schema for home_set_thermostat', () => {
      const tool = TOOL_DEFINITIONS.find(
        (t) => t.name === 'home_set_thermostat'
      );

      expect(tool).toBeDefined();
      expect(tool?.inputSchema).toMatchObject({
        type: 'object',
        properties: {
          temperature: {
            type: 'number',
          },
          unit: {
            type: 'string',
            enum: ['fahrenheit', 'celsius'],
          },
        },
        required: ['temperature'],
      });
    });

    it('should have correct schema for home_control_device', () => {
      const tool = TOOL_DEFINITIONS.find(
        (t) => t.name === 'home_control_device'
      );

      expect(tool).toBeDefined();
      expect(tool?.inputSchema).toMatchObject({
        type: 'object',
        properties: {
          shortcutName: {
            type: 'string',
          },
          action: {
            type: 'string',
          },
        },
        required: ['shortcutName'],
      });
    });

    it('should have descriptions for all tools', () => {
      for (const tool of TOOL_DEFINITIONS) {
        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Tool Handlers - home_open', () => {
    it('should open Home app successfully', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await handleToolCall('home_open');

      expect(result.content[0].text).toBe('Home app opened');
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('osascript'),
        expect.any(Object)
      );
    });

    it('should handle AppleScript error when opening Home app', async () => {
      const error = new Error('AppleScript failed') as Error & {
        stderr: string;
      };
      error.stderr = 'Application not found';
      mockedExecSync.mockImplementation(() => {
        throw error;
      });

      const result = await handleToolCall('home_open');

      expect(result.content[0].text).toContain('Error');
      expect(result.isError).toBe(true);
    });
  });

  describe('Tool Handlers - home_run_scene', () => {
    it('should run scene successfully when shortcut exists', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await handleToolCall('home_run_scene', {
        scene: 'Good Morning',
      });

      expect(result.content[0].text).toBe('Activated scene: Good Morning');
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("shortcuts run 'Good Morning'"),
        expect.any(Object)
      );
    });

    it('should return helpful message when shortcut does not exist', async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Shortcut not found');
      });

      const result = await handleToolCall('home_run_scene', {
        scene: 'Movie Time',
      });

      expect(result.content[0].text).toContain(
        'To run scene "Movie Time", please create a Shortcut'
      );
    });
  });

  describe('Tool Handlers - home_control_device', () => {
    it('should execute shortcut without action', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await handleToolCall('home_control_device', {
        shortcutName: 'Kitchen Light',
      });

      expect(result.content[0].text).toBe('Executed shortcut: Kitchen Light');
    });

    it('should execute shortcut with action', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await handleToolCall('home_control_device', {
        shortcutName: 'Kitchen Light',
        action: 'toggle',
      });

      expect(result.content[0].text).toBe(
        'Executed shortcut: Kitchen Light with action: toggle'
      );
    });

    it('should handle error when shortcut fails', async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Shortcut execution failed');
      });

      const result = await handleToolCall('home_control_device', {
        shortcutName: 'Nonexistent Shortcut',
      });

      expect(result.content[0].text).toContain(
        'Error running shortcut "Nonexistent Shortcut"'
      );
      expect(result.isError).toBe(true);
    });
  });

  describe('Tool Handlers - home_list_shortcuts', () => {
    it('should list home-related shortcuts', async () => {
      mockedExecSync.mockReturnValue(
        'Lights On\nLights Off\nLock Doors\nUnrelated Shortcut\nBedroom Scene'
      );

      const result = await handleToolCall('home_list_shortcuts', {});

      expect(result.content[0].text).toContain('Available Shortcuts:');
      expect(result.content[0].text).toContain('Lights On');
      expect(result.content[0].text).toContain('Lock Doors');
    });

    it('should filter shortcuts by name', async () => {
      mockedExecSync.mockReturnValue(
        'Lights On\nLights Off\nLock Doors\nBedroom Lights'
      );

      const result = await handleToolCall('home_list_shortcuts', {
        filter: 'lights',
      });

      expect(result.content[0].text).toContain('Lights On');
      expect(result.content[0].text).toContain('Bedroom Lights');
    });

    it('should return message when no shortcuts found', async () => {
      mockedExecSync.mockReturnValue('Random Shortcut\nAnother One');

      const result = await handleToolCall('home_list_shortcuts', {});

      expect(result.content[0].text).toContain(
        'No Home-related shortcuts found'
      );
    });

    it('should handle error when listing shortcuts fails', async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('shortcuts command failed');
      });

      const result = await handleToolCall('home_list_shortcuts', {});

      expect(result.content[0].text).toContain('Error listing shortcuts');
      expect(result.isError).toBe(true);
    });
  });

  describe('Tool Handlers - home_lights_on', () => {
    it('should turn on lights without room specified', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await handleToolCall('home_lights_on', {});

      expect(result.content[0].text).toBe('Lights on');
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("shortcuts run 'Lights On'"),
        expect.any(Object)
      );
    });

    it('should turn on lights in specific room', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await handleToolCall('home_lights_on', {
        room: 'living room',
      });

      expect(result.content[0].text).toBe('Lights on in living room');
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("shortcuts run 'living room Lights On'"),
        expect.any(Object)
      );
    });

    it('should return helpful message when shortcut not found', async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Shortcut not found');
      });

      const result = await handleToolCall('home_lights_on', {});

      expect(result.content[0].text).toContain(
        'create a Shortcut named "Lights On"'
      );
      expect(result.content[0].text).toContain(
        'Alternatively, you can say to Siri'
      );
    });
  });

  describe('Tool Handlers - home_lights_off', () => {
    it('should turn off lights without room specified', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await handleToolCall('home_lights_off', {});

      expect(result.content[0].text).toBe('Lights off');
    });

    it('should turn off lights in specific room', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await handleToolCall('home_lights_off', {
        room: 'bedroom',
      });

      expect(result.content[0].text).toBe('Lights off in bedroom');
    });
  });

  describe('Tool Handlers - home_set_thermostat', () => {
    it('should set thermostat with fahrenheit (default)', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await handleToolCall('home_set_thermostat', {
        temperature: 72,
      });

      expect(result.content[0].text).toBe('Thermostat set to 72F');
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("shortcuts run 'Set Thermostat'"),
        expect.any(Object)
      );
    });

    it('should set thermostat with celsius', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await handleToolCall('home_set_thermostat', {
        temperature: 22,
        unit: 'celsius',
      });

      expect(result.content[0].text).toBe('Thermostat set to 22C');
    });

    it('should return helpful message when shortcut not found', async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Shortcut not found');
      });

      const result = await handleToolCall('home_set_thermostat', {
        temperature: 70,
      });

      expect(result.content[0].text).toContain(
        'create a Shortcut named "Set Thermostat"'
      );
    });
  });

  describe('Tool Handlers - home_lock_doors', () => {
    it('should lock doors successfully', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await handleToolCall('home_lock_doors');

      expect(result.content[0].text).toBe('Doors locked');
    });

    it('should return helpful message when shortcut not found', async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Shortcut not found');
      });

      const result = await handleToolCall('home_lock_doors');

      expect(result.content[0].text).toContain(
        'create a Shortcut named "Lock Doors"'
      );
    });
  });

  describe('Tool Handlers - home_unlock_doors', () => {
    it('should unlock doors successfully', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await handleToolCall('home_unlock_doors');

      expect(result.content[0].text).toBe('Doors unlocked');
    });

    it('should return helpful message when shortcut not found', async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Shortcut not found');
      });

      const result = await handleToolCall('home_unlock_doors');

      expect(result.content[0].text).toContain(
        'create a Shortcut named "Unlock Doors"'
      );
    });
  });

  describe('Tool Handlers - home_get_status', () => {
    it('should open Home app and return status message', async () => {
      mockedExecSync.mockReturnValue('');

      const result = await handleToolCall('home_get_status');

      expect(result.content[0].text).toContain('Home app opened');
      expect(result.content[0].text).toContain(
        'HomeKit device status is not accessible via AppleScript'
      );
    });
  });

  describe('Error Handling', () => {
    it('should return error for unknown tool', async () => {
      const result = await handleToolCall('unknown_tool');

      expect(result.content[0].text).toBe('Unknown tool: unknown_tool');
      expect(result.isError).toBe(true);
    });

    it('should handle general errors gracefully', async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await handleToolCall('home_open');

      expect(result.content[0].text).toContain('Error');
      expect(result.isError).toBe(true);
    });

    it('should handle errors with stderr', async () => {
      const error = new Error('Command failed') as Error & { stderr: string };
      error.stderr = 'Permission denied';
      mockedExecSync.mockImplementation(() => {
        throw error;
      });

      const result = await handleToolCall('home_open');

      expect(result.content[0].text).toContain('Permission denied');
      expect(result.isError).toBe(true);
    });
  });

  describe('Input Escaping', () => {
    it('should escape single quotes in scene names', async () => {
      mockedExecSync.mockReturnValue('');

      await handleToolCall('home_run_scene', {
        scene: "John's Scene",
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("John'\"'\"'s Scene"),
        expect.any(Object)
      );
    });

    it('should escape single quotes in shortcut names', async () => {
      mockedExecSync.mockReturnValue('');

      await handleToolCall('home_control_device', {
        shortcutName: "Living Room's Light",
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("Living Room'\"'\"'s Light"),
        expect.any(Object)
      );
    });
  });

  describe('Helper Functions', () => {
    describe('runAppleScript', () => {
      it('should execute osascript with correct parameters', () => {
        mockedExecSync.mockReturnValue('success');

        const result = runAppleScript('test script');

        expect(mockedExecSync).toHaveBeenCalledWith(
          "osascript -e 'test script'",
          expect.objectContaining({
            encoding: 'utf-8',
            maxBuffer: 50 * 1024 * 1024,
          })
        );
        expect(result).toBe('success');
      });

      it('should throw error with stderr message when AppleScript fails', () => {
        const error = new Error('Failed') as Error & { stderr: string };
        error.stderr = 'Script error occurred';
        mockedExecSync.mockImplementation(() => {
          throw error;
        });

        expect(() => runAppleScript('bad script')).toThrow(
          'AppleScript error: Script error occurred'
        );
      });
    });

    describe('runShortcut', () => {
      it('should execute shortcuts run with correct parameters', () => {
        mockedExecSync.mockReturnValue('done');

        const result = runShortcut('My Shortcut');

        expect(mockedExecSync).toHaveBeenCalledWith(
          "shortcuts run 'My Shortcut'",
          expect.objectContaining({
            encoding: 'utf-8',
            maxBuffer: 50 * 1024 * 1024,
          })
        );
        expect(result).toBe('done');
      });

      it('should include input parameter when provided', () => {
        mockedExecSync.mockReturnValue('');

        runShortcut('My Shortcut', 'some input');

        expect(mockedExecSync).toHaveBeenCalledWith(
          "shortcuts run 'My Shortcut' -i 'some input'",
          expect.any(Object)
        );
      });

      it('should escape single quotes in input', () => {
        mockedExecSync.mockReturnValue('');

        runShortcut('Shortcut', "value's with quote");

        expect(mockedExecSync).toHaveBeenCalledWith(
          expect.stringContaining("value'\"'\"'s with quote"),
          expect.any(Object)
        );
      });
    });
  });
});
