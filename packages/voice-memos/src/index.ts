#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';
import { readdirSync, statSync } from 'fs';

const server = new Server(
  {
    name: 'voice-memos-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Voice Memos are stored in this location
const VOICE_MEMOS_PATH = join(
  homedir(),
  'Library',
  'Group Containers',
  'group.com.apple.VoiceMemos.shared',
  'Recordings'
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
        name: 'voicememos_open',
        description: 'Open the Voice Memos app',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'voicememos_list',
        description: 'List voice memo recordings',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of recordings to list (default: 20)',
            },
          },
          required: [],
        },
      },
      {
        name: 'voicememos_start_recording',
        description: 'Start a new voice memo recording',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'voicememos_stop_recording',
        description: 'Stop the current voice memo recording',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'voicememos_play',
        description: 'Play a voice memo by filename',
        inputSchema: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Name of the voice memo file to play',
            },
          },
          required: ['filename'],
        },
      },
      {
        name: 'voicememos_get_info',
        description: 'Get information about the Voice Memos storage location',
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
      case 'voicememos_open': {
        runAppleScript('tell application "Voice Memos" to activate');
        return { content: [{ type: 'text', text: 'Voice Memos app opened' }] };
      }

      case 'voicememos_list': {
        const limit = (args as { limit?: number }).limit || 20;
        try {
          const files = readdirSync(VOICE_MEMOS_PATH)
            .filter((f) => f.endsWith('.m4a'))
            .map((f) => {
              const filePath = join(VOICE_MEMOS_PATH, f);
              const stats = statSync(filePath);
              return {
                name: f,
                size: stats.size,
                modified: stats.mtime,
              };
            })
            .sort((a, b) => b.modified.getTime() - a.modified.getTime())
            .slice(0, limit);

          if (files.length === 0) {
            return {
              content: [{ type: 'text', text: 'No voice memos found' }],
            };
          }

          const listing = files
            .map(
              (f) =>
                `${f.name}\n  Size: ${(f.size / 1024).toFixed(1)} KB\n  Modified: ${f.modified.toLocaleString()}`
            )
            .join('\n\n');

          return {
            content: [
              {
                type: 'text',
                text: `Voice Memos (${files.length}):\n\n${listing}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Could not access Voice Memos folder. Error: ${error instanceof Error ? error.message : String(error)}\n\nExpected path: ${VOICE_MEMOS_PATH}`,
              },
            ],
          };
        }
      }

      case 'voicememos_start_recording': {
        const script = `
tell application "Voice Memos" to activate
delay 0.5
tell application "System Events"
  tell process "Voice Memos"
    click button 1 of window 1
  end tell
end tell`;
        try {
          runAppleScript(script);
          return {
            content: [
              {
                type: 'text',
                text: 'Started recording. Use voicememos_stop_recording to stop.',
              },
            ],
          };
        } catch {
          return {
            content: [
              {
                type: 'text',
                text: 'Could not start recording. Please ensure Voice Memos is open and Accessibility permissions are granted.',
              },
            ],
          };
        }
      }

      case 'voicememos_stop_recording': {
        const script = `
tell application "System Events"
  tell process "Voice Memos"
    click button 1 of window 1
  end tell
end tell`;
        try {
          runAppleScript(script);
          return { content: [{ type: 'text', text: 'Stopped recording' }] };
        } catch {
          return {
            content: [
              {
                type: 'text',
                text: 'Could not stop recording. Please ensure Voice Memos is open and has an active recording.',
              },
            ],
          };
        }
      }

      case 'voicememos_play': {
        const filename = (args as { filename: string }).filename;
        const filePath = join(VOICE_MEMOS_PATH, filename);
        const safeFilePath = filePath.replace(/'/g, "'\"'\"'");
        try {
          execSync(`afplay '${safeFilePath}' &`, { encoding: 'utf-8' });
          return { content: [{ type: 'text', text: `Playing: ${filename}` }] };
        } catch {
          return {
            content: [
              {
                type: 'text',
                text: `Could not play file: ${filename}. Make sure it exists in the Voice Memos folder.`,
              },
            ],
          };
        }
      }

      case 'voicememos_get_info': {
        const info = `Voice Memos MCP Information:

Voice Memos Storage Location:
${VOICE_MEMOS_PATH}

This MCP can:
- Open the Voice Memos app
- List voice memo recordings
- Start/stop recording (requires Accessibility permissions)
- Play recordings using system audio

Limitations:
- Voice Memos has limited AppleScript support
- Start/stop recording uses UI scripting (requires Accessibility permissions)
- Recording names are auto-generated by Voice Memos

To grant Accessibility permissions:
1. Open System Preferences > Security & Privacy > Privacy
2. Select Accessibility
3. Add Terminal (or your IDE) to the list`;

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

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Voice Memos MCP server running on stdio');
}

main().catch(console.error);
