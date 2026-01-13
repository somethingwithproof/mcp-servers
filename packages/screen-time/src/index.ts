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
    name: 'screen-time-mcp',
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

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'screentime_open',
        description: 'Open Screen Time settings',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'screentime_open_app_limits',
        description: 'Open App Limits settings',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'screentime_open_downtime',
        description: 'Open Downtime settings',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'screentime_open_communication_limits',
        description: 'Open Communication Limits settings',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'screentime_open_always_allowed',
        description: 'Open Always Allowed settings',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'screentime_open_content_privacy',
        description: 'Open Content & Privacy Restrictions settings',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'screentime_get_info',
        description:
          'Get information about Screen Time capabilities and limitations',
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
  const { name } = request.params;

  try {
    switch (name) {
      case 'screentime_open': {
        runAppleScript(
          'tell application "System Preferences" to reveal anchor "main" of pane id "com.apple.preference.screentime"'
        );
        runAppleScript('tell application "System Preferences" to activate');
        return {
          content: [{ type: 'text', text: 'Screen Time settings opened' }],
        };
      }

      case 'screentime_open_app_limits': {
        runAppleScript(
          'tell application "System Preferences" to reveal anchor "appLimits" of pane id "com.apple.preference.screentime"'
        );
        runAppleScript('tell application "System Preferences" to activate');
        return {
          content: [{ type: 'text', text: 'App Limits settings opened' }],
        };
      }

      case 'screentime_open_downtime': {
        runAppleScript(
          'tell application "System Preferences" to reveal anchor "downtime" of pane id "com.apple.preference.screentime"'
        );
        runAppleScript('tell application "System Preferences" to activate');
        return {
          content: [{ type: 'text', text: 'Downtime settings opened' }],
        };
      }

      case 'screentime_open_communication_limits': {
        runAppleScript(
          'tell application "System Preferences" to reveal anchor "communicationLimits" of pane id "com.apple.preference.screentime"'
        );
        runAppleScript('tell application "System Preferences" to activate');
        return {
          content: [
            { type: 'text', text: 'Communication Limits settings opened' },
          ],
        };
      }

      case 'screentime_open_always_allowed': {
        runAppleScript(
          'tell application "System Preferences" to reveal anchor "alwaysAllowed" of pane id "com.apple.preference.screentime"'
        );
        runAppleScript('tell application "System Preferences" to activate');
        return {
          content: [{ type: 'text', text: 'Always Allowed settings opened' }],
        };
      }

      case 'screentime_open_content_privacy': {
        runAppleScript(
          'tell application "System Preferences" to reveal anchor "contentPrivacy" of pane id "com.apple.preference.screentime"'
        );
        runAppleScript('tell application "System Preferences" to activate');
        return {
          content: [
            {
              type: 'text',
              text: 'Content & Privacy Restrictions settings opened',
            },
          ],
        };
      }

      case 'screentime_get_info': {
        const info = `Screen Time MCP Information:

Screen Time on macOS has very limited API access. This MCP can:
- Open various Screen Time settings panels

What this MCP cannot do (due to macOS limitations):
- Read app usage data programmatically
- Set app limits programmatically
- Enable/disable downtime programmatically
- Access Screen Time reports

To view your Screen Time data:
1. Open System Preferences/Settings
2. Click on Screen Time
3. View your usage reports and settings

To manage Screen Time:
- Use the tools to open specific settings panels
- Make changes manually in the Settings app`;
        return { content: [{ type: 'text', text: info }] };
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
  console.error('Screen Time MCP server running on stdio');
}

main().catch(console.error);
