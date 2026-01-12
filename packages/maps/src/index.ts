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
    name: "maps-mcp",
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

// Helper to open URLs - using execSync for macOS open command
function openURL(url: string): void {
  const safeUrl = url.replace(/'/g, "'\"'\"'");
  execSync(`open '${safeUrl}'`);
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "maps_open",
        description: "Open the Apple Maps app",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "maps_search",
        description: "Search for a location in Apple Maps",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (e.g., 'coffee shops near me', 'Eiffel Tower')",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "maps_get_directions",
        description: "Get directions between two locations",
        inputSchema: {
          type: "object",
          properties: {
            from: {
              type: "string",
              description: "Starting location (address or place name, or 'current location')",
            },
            to: {
              type: "string",
              description: "Destination (address or place name)",
            },
            mode: {
              type: "string",
              enum: ["driving", "walking", "transit"],
              description: "Transportation mode (default: driving)",
            },
          },
          required: ["to"],
        },
      },
      {
        name: "maps_show_location",
        description: "Show a specific location on the map",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Address or place name to show",
            },
          },
          required: ["address"],
        },
      },
      {
        name: "maps_show_coordinates",
        description: "Show a location by coordinates",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude coordinate",
            },
            longitude: {
              type: "number",
              description: "Longitude coordinate",
            },
            label: {
              type: "string",
              description: "Optional label for the pin",
            },
          },
          required: ["latitude", "longitude"],
        },
      },
      {
        name: "maps_drop_pin",
        description: "Drop a pin at a specific location",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Address where to drop the pin",
            },
            label: {
              type: "string",
              description: "Label for the pin (optional)",
            },
          },
          required: ["address"],
        },
      },
      {
        name: "maps_nearby",
        description: "Find nearby places of a specific type",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description: "Type of place (e.g., 'restaurants', 'gas stations', 'hotels', 'coffee')",
            },
            near: {
              type: "string",
              description: "Location to search near (optional, defaults to current location)",
            },
          },
          required: ["type"],
        },
      },
      {
        name: "maps_create_url",
        description: "Create a shareable Apple Maps URL for a location",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Address or place name",
            },
          },
          required: ["address"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "maps_open": {
        runAppleScript('tell application "Maps" to activate');
        return { content: [{ type: "text", text: "Apple Maps opened" }] };
      }

      case "maps_search": {
        const query = (args as { query: string }).query;
        const encodedQuery = encodeURIComponent(query);
        const url = `maps://?q=${encodedQuery}`;
        openURL(url);
        return { content: [{ type: "text", text: `Searching for: ${query}` }] };
      }

      case "maps_get_directions": {
        const { from, to, mode = "driving" } = args as { from?: string; to: string; mode?: string };
        const modeMap: Record<string, string> = {
          driving: "d",
          walking: "w",
          transit: "r",
        };
        const dirMode = modeMap[mode] || "d";

        let url: string;
        if (from && from.toLowerCase() !== "current location") {
          const encodedFrom = encodeURIComponent(from);
          const encodedTo = encodeURIComponent(to);
          url = `maps://?saddr=${encodedFrom}&daddr=${encodedTo}&dirflg=${dirMode}`;
        } else {
          const encodedTo = encodeURIComponent(to);
          url = `maps://?daddr=${encodedTo}&dirflg=${dirMode}`;
        }

        openURL(url);
        return { content: [{ type: "text", text: `Getting ${mode} directions${from ? ` from ${from}` : ''} to ${to}` }] };
      }

      case "maps_show_location": {
        const address = (args as { address: string }).address;
        const encodedAddress = encodeURIComponent(address);
        const url = `maps://?address=${encodedAddress}`;
        openURL(url);
        return { content: [{ type: "text", text: `Showing: ${address}` }] };
      }

      case "maps_show_coordinates": {
        const { latitude, longitude, label } = args as { latitude: number; longitude: number; label?: string };
        let url = `maps://?ll=${latitude},${longitude}`;
        if (label) {
          url += `&q=${encodeURIComponent(label)}`;
        }
        openURL(url);
        return { content: [{ type: "text", text: `Showing coordinates: ${latitude}, ${longitude}${label ? ` (${label})` : ''}` }] };
      }

      case "maps_drop_pin": {
        const { address, label } = args as { address: string; label?: string };
        const encodedAddress = encodeURIComponent(address);
        let url = `maps://?address=${encodedAddress}`;
        if (label) {
          url += `&q=${encodeURIComponent(label)}`;
        }
        openURL(url);
        return { content: [{ type: "text", text: `Dropped pin at: ${address}${label ? ` (${label})` : ''}` }] };
      }

      case "maps_nearby": {
        const { type, near } = args as { type: string; near?: string };
        let query = type;
        if (near) {
          query += ` near ${near}`;
        }
        const encodedQuery = encodeURIComponent(query);
        const url = `maps://?q=${encodedQuery}`;
        openURL(url);
        return { content: [{ type: "text", text: `Searching for ${type}${near ? ` near ${near}` : ' nearby'}` }] };
      }

      case "maps_create_url": {
        const address = (args as { address: string }).address;
        const encodedAddress = encodeURIComponent(address);
        const appleUrl = `maps://?address=${encodedAddress}`;
        const webUrl = `https://maps.apple.com/?address=${encodedAddress}`;
        return {
          content: [{
            type: "text",
            text: `Apple Maps URLs for "${address}":\n\nApp URL: ${appleUrl}\nWeb URL: ${webUrl}`
          }]
        };
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
  console.error("Maps MCP server running on stdio");
}

main().catch(console.error);
