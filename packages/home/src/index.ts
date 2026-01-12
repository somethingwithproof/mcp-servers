#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";

const server = new Server(
  {
    name: "home-mcp",
    version: "1.0.0",
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
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    }).trim();
  } catch (error: unknown) {
    const err = error as Error & { stderr?: string };
    throw new Error(`AppleScript error: ${err.stderr || err.message}`);
  }
}

// Helper to run shortcuts - uses execSync for shortcuts CLI
function runShortcut(name: string, input?: string): string {
  try {
    const escapedName = name.replace(/'/g, "'\"'\"'");
    const inputPart = input ? ` -i '${input.replace(/'/g, "'\"'\"'")}'` : '';
    return execSync(`shortcuts run '${escapedName}'${inputPart}`, {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    }).trim();
  } catch (error: unknown) {
    const err = error as Error & { stderr?: string };
    throw new Error(`Shortcut error: ${err.stderr || err.message}`);
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Home App Control
      {
        name: "home_open",
        description: "Open the Home app",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      // Scene Control via Siri/Shortcuts
      {
        name: "home_run_scene",
        description: "Run a HomeKit scene by name (uses Shortcuts)",
        inputSchema: {
          type: "object",
          properties: {
            scene: {
              type: "string",
              description: "Scene name to run (e.g., 'Good Morning', 'Movie Time')",
            },
          },
          required: ["scene"],
        },
      },
      // Device Control via Shortcuts
      {
        name: "home_control_device",
        description: "Control a HomeKit device (requires a Shortcut set up for the device)",
        inputSchema: {
          type: "object",
          properties: {
            shortcutName: {
              type: "string",
              description: "Name of the Shortcut that controls the device",
            },
            action: {
              type: "string",
              description: "Action to perform (passed as input to the shortcut)",
            },
          },
          required: ["shortcutName"],
        },
      },
      // List Available Shortcuts (for Home)
      {
        name: "home_list_shortcuts",
        description: "List available Shortcuts that may be related to Home control",
        inputSchema: {
          type: "object",
          properties: {
            filter: {
              type: "string",
              description: "Filter shortcuts by name (optional)",
            },
          },
          required: [],
        },
      },
      // Quick Actions
      {
        name: "home_lights_on",
        description: "Turn on lights (requires 'Lights On' shortcut)",
        inputSchema: {
          type: "object",
          properties: {
            room: {
              type: "string",
              description: "Room name (optional, e.g., 'living room', 'bedroom')",
            },
          },
          required: [],
        },
      },
      {
        name: "home_lights_off",
        description: "Turn off lights (requires 'Lights Off' shortcut)",
        inputSchema: {
          type: "object",
          properties: {
            room: {
              type: "string",
              description: "Room name (optional, e.g., 'living room', 'bedroom')",
            },
          },
          required: [],
        },
      },
      {
        name: "home_set_thermostat",
        description: "Set thermostat temperature (requires 'Set Thermostat' shortcut)",
        inputSchema: {
          type: "object",
          properties: {
            temperature: {
              type: "number",
              description: "Temperature to set",
            },
            unit: {
              type: "string",
              enum: ["fahrenheit", "celsius"],
              description: "Temperature unit (default: fahrenheit)",
            },
          },
          required: ["temperature"],
        },
      },
      {
        name: "home_lock_doors",
        description: "Lock all doors (requires 'Lock Doors' shortcut)",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "home_unlock_doors",
        description: "Unlock all doors (requires 'Unlock Doors' shortcut)",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      // Status
      {
        name: "home_get_status",
        description: "Open Home app to view device status (limited API access)",
        inputSchema: {
          type: "object",
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
      case "home_open": {
        runAppleScript('tell application "Home" to activate');
        return { content: [{ type: "text", text: "Home app opened" }] };
      }

      case "home_run_scene": {
        const scene = (args as { scene: string }).scene;
        try {
          runShortcut(scene);
          return { content: [{ type: "text", text: `Activated scene: ${scene}` }] };
        } catch {
          return { content: [{ type: "text", text: `To run scene "${scene}", please create a Shortcut with that name that activates the HomeKit scene.` }] };
        }
      }

      case "home_control_device": {
        const { shortcutName, action } = args as { shortcutName: string; action?: string };
        try {
          runShortcut(shortcutName, action);
          return { content: [{ type: "text", text: `Executed shortcut: ${shortcutName}${action ? ` with action: ${action}` : ''}` }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error running shortcut "${shortcutName}": ${error instanceof Error ? error.message : String(error)}` }], isError: true };
        }
      }

      case "home_list_shortcuts": {
        const filter = (args as { filter?: string }).filter?.toLowerCase();
        try {
          const result = execSync('shortcuts list', { encoding: 'utf-8' });
          const shortcuts = result.split('\n').filter(s => s.trim());
          const homeRelated = filter
            ? shortcuts.filter(s => s.toLowerCase().includes(filter))
            : shortcuts.filter(s =>
                s.toLowerCase().includes('light') ||
                s.toLowerCase().includes('home') ||
                s.toLowerCase().includes('scene') ||
                s.toLowerCase().includes('lock') ||
                s.toLowerCase().includes('thermostat') ||
                s.toLowerCase().includes('door') ||
                s.toLowerCase().includes('room')
              );

          if (homeRelated.length === 0) {
            return { content: [{ type: "text", text: filter
              ? `No shortcuts found matching: ${filter}`
              : "No Home-related shortcuts found. Create Shortcuts in the Shortcuts app to control your Home devices." }] };
          }
          return { content: [{ type: "text", text: `Available Shortcuts:\n${homeRelated.join('\n')}` }] };
        } catch {
          return { content: [{ type: "text", text: "Error listing shortcuts. Make sure Shortcuts app is available." }], isError: true };
        }
      }

      case "home_lights_on": {
        const room = (args as { room?: string }).room;
        const command = room ? `turn on ${room} lights` : 'turn on the lights';
        try {
          const shortcutName = room ? `${room} Lights On` : 'Lights On';
          runShortcut(shortcutName);
          return { content: [{ type: "text", text: `Lights on${room ? ` in ${room}` : ''}` }] };
        } catch {
          return { content: [{ type: "text", text: `To turn on lights${room ? ` in ${room}` : ''}, create a Shortcut named "${room ? `${room} Lights On` : 'Lights On'}" that controls your HomeKit lights.\n\nAlternatively, you can say to Siri: "${command}"` }] };
        }
      }

      case "home_lights_off": {
        const room = (args as { room?: string }).room;
        const command = room ? `turn off ${room} lights` : 'turn off the lights';
        try {
          const shortcutName = room ? `${room} Lights Off` : 'Lights Off';
          runShortcut(shortcutName);
          return { content: [{ type: "text", text: `Lights off${room ? ` in ${room}` : ''}` }] };
        } catch {
          return { content: [{ type: "text", text: `To turn off lights${room ? ` in ${room}` : ''}, create a Shortcut named "${room ? `${room} Lights Off` : 'Lights Off'}" that controls your HomeKit lights.\n\nAlternatively, you can say to Siri: "${command}"` }] };
        }
      }

      case "home_set_thermostat": {
        const { temperature, unit = 'fahrenheit' } = args as { temperature: number; unit?: string };
        const tempStr = `${temperature} degrees ${unit}`;
        try {
          runShortcut('Set Thermostat', tempStr);
          return { content: [{ type: "text", text: `Thermostat set to ${temperature}°${unit === 'celsius' ? 'C' : 'F'}` }] };
        } catch {
          return { content: [{ type: "text", text: `To set thermostat to ${temperature}°${unit === 'celsius' ? 'C' : 'F'}, create a Shortcut named "Set Thermostat" that controls your HomeKit thermostat.\n\nAlternatively, you can say to Siri: "Set the thermostat to ${tempStr}"` }] };
        }
      }

      case "home_lock_doors": {
        try {
          runShortcut('Lock Doors');
          return { content: [{ type: "text", text: "Doors locked" }] };
        } catch {
          return { content: [{ type: "text", text: `To lock doors, create a Shortcut named "Lock Doors" that controls your HomeKit locks.\n\nAlternatively, you can say to Siri: "Lock all doors"` }] };
        }
      }

      case "home_unlock_doors": {
        try {
          runShortcut('Unlock Doors');
          return { content: [{ type: "text", text: "Doors unlocked" }] };
        } catch {
          return { content: [{ type: "text", text: `To unlock doors, create a Shortcut named "Unlock Doors" that controls your HomeKit locks.\n\nAlternatively, you can say to Siri: "Unlock all doors"` }] };
        }
      }

      case "home_get_status": {
        runAppleScript('tell application "Home" to activate');
        return { content: [{ type: "text", text: "Home app opened. Note: HomeKit device status is not accessible via AppleScript. View status in the Home app." }] };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Home MCP server running on stdio");
}

main().catch(console.error);
