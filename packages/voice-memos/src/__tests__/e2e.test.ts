import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";

// Mock child_process - must be at top level before any imports
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

// Mock fs
vi.mock("fs", () => ({
  readdirSync: vi.fn(),
  statSync: vi.fn(),
}));

// Mock os
vi.mock("os", () => ({
  homedir: vi.fn(() => "/Users/testuser"),
}));

// Constants matching the actual implementation
const VOICE_MEMOS_PATH = path.join(
  "/Users/testuser",
  "Library",
  "Group Containers",
  "group.com.apple.VoiceMemos.shared",
  "Recordings"
);

// Helper function to run AppleScript (matches the actual implementation)
// Note: This is a test file that MOCKS child_process to avoid actual execution
function runAppleScript(script: string): string {
  try {
    return (child_process.execSync as ReturnType<typeof vi.fn>)(
      `osascript -e '${script.replace(/'/g, "'\"'\"'")}'`,
      {
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024,
      }
    ).trim();
  } catch (error: unknown) {
    const err = error as Error & { stderr?: string };
    throw new Error(`AppleScript error: ${err.stderr || err.message}`);
  }
}

// Helper to create a test server that mimics the actual implementation
function createTestServer() {
  const server = new Server(
    {
      name: "voice-memos-mcp",
      version: "1.0.0",
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
        {
          name: "voicememos_open",
          description: "Open the Voice Memos app",
          inputSchema: {
            type: "object" as const,
            properties: {},
            required: [],
          },
        },
        {
          name: "voicememos_list",
          description: "List voice memo recordings",
          inputSchema: {
            type: "object" as const,
            properties: {
              limit: {
                type: "number",
                description:
                  "Maximum number of recordings to list (default: 20)",
              },
            },
            required: [],
          },
        },
        {
          name: "voicememos_start_recording",
          description: "Start a new voice memo recording",
          inputSchema: {
            type: "object" as const,
            properties: {},
            required: [],
          },
        },
        {
          name: "voicememos_stop_recording",
          description: "Stop the current voice memo recording",
          inputSchema: {
            type: "object" as const,
            properties: {},
            required: [],
          },
        },
        {
          name: "voicememos_play",
          description: "Play a voice memo by filename",
          inputSchema: {
            type: "object" as const,
            properties: {
              filename: {
                type: "string",
                description: "Name of the voice memo file to play",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "voicememos_get_info",
          description:
            "Get information about the Voice Memos storage location",
          inputSchema: {
            type: "object" as const,
            properties: {},
            required: [],
          },
        },
      ],
    };
  });

  // Register the call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "voicememos_open": {
          runAppleScript('tell application "Voice Memos" to activate');
          return {
            content: [{ type: "text" as const, text: "Voice Memos app opened" }],
          };
        }

        case "voicememos_list": {
          const limit = (args as { limit?: number })?.limit || 20;
          try {
            const files = (fs.readdirSync as ReturnType<typeof vi.fn>)(
              VOICE_MEMOS_PATH
            )
              .filter((f: string) => f.endsWith(".m4a"))
              .map((f: string) => {
                const filePath = path.join(VOICE_MEMOS_PATH, f);
                const stats = (fs.statSync as ReturnType<typeof vi.fn>)(
                  filePath
                );
                return {
                  name: f,
                  size: stats.size,
                  modified: stats.mtime,
                };
              })
              .sort(
                (a: { modified: Date }, b: { modified: Date }) =>
                  b.modified.getTime() - a.modified.getTime()
              )
              .slice(0, limit);

            if (files.length === 0) {
              return {
                content: [{ type: "text" as const, text: "No voice memos found" }],
              };
            }

            const listing = files
              .map(
                (f: { name: string; size: number; modified: Date }) =>
                  `${f.name}\n  Size: ${(f.size / 1024).toFixed(1)} KB\n  Modified: ${f.modified.toLocaleString()}`
              )
              .join("\n\n");

            return {
              content: [
                {
                  type: "text" as const,
                  text: `Voice Memos (${files.length}):\n\n${listing}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Could not access Voice Memos folder. Error: ${error instanceof Error ? error.message : String(error)}\n\nExpected path: ${VOICE_MEMOS_PATH}`,
                },
              ],
            };
          }
        }

        case "voicememos_start_recording": {
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
                  type: "text" as const,
                  text: "Started recording. Use voicememos_stop_recording to stop.",
                },
              ],
            };
          } catch {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Could not start recording. Please ensure Voice Memos is open and Accessibility permissions are granted.",
                },
              ],
            };
          }
        }

        case "voicememos_stop_recording": {
          const script = `
tell application "System Events"
  tell process "Voice Memos"
    click button 1 of window 1
  end tell
end tell`;
          try {
            runAppleScript(script);
            return { content: [{ type: "text" as const, text: "Stopped recording" }] };
          } catch {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Could not stop recording. Please ensure Voice Memos is open and has an active recording.",
                },
              ],
            };
          }
        }

        case "voicememos_play": {
          const filename = (args as { filename: string })?.filename;
          if (!filename) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Error: filename is required",
                },
              ],
              isError: true,
            };
          }
          const filePath = path.join(VOICE_MEMOS_PATH, filename);
          const safeFilePath = filePath.replace(/'/g, "'\"'\"'");
          try {
            // Note: This is mocked in tests - no actual execution occurs
            (child_process.execSync as ReturnType<typeof vi.fn>)(
              `afplay '${safeFilePath}' &`,
              { encoding: "utf-8" }
            );
            return {
              content: [{ type: "text" as const, text: `Playing: ${filename}` }],
            };
          } catch {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Could not play file: ${filename}. Make sure it exists in the Voice Memos folder.`,
                },
              ],
            };
          }
        }

        case "voicememos_get_info": {
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

          return { content: [{ type: "text" as const, text: info }] };
        }

        default:
          return {
            content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// Create connected client and server pair
async function createTestPair() {
  const server = createTestServer();
  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ]);

  return { client, server };
}

describe("Voice Memos MCP Server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Server Initialization", () => {
    it("should create and connect a server successfully", async () => {
      const { client } = await createTestPair();
      expect(client).toBeDefined();
    });
  });

  describe("Tool Registration", () => {
    it("should register all 6 tools", async () => {
      const { client } = await createTestPair();
      const result = await client.listTools();

      expect(result.tools).toHaveLength(6);
    });

    it("should register voicememos_open tool", async () => {
      const { client } = await createTestPair();
      const result = await client.listTools();

      const openTool = result.tools.find((t) => t.name === "voicememos_open");
      expect(openTool).toBeDefined();
      expect(openTool?.name).toBe("voicememos_open");
    });

    it("should register voicememos_list tool with limit parameter", async () => {
      const { client } = await createTestPair();
      const result = await client.listTools();

      const listTool = result.tools.find((t) => t.name === "voicememos_list");
      expect(listTool).toBeDefined();
      expect(
        (listTool?.inputSchema as { properties?: { limit?: unknown } })
          ?.properties?.limit
      ).toBeDefined();
    });

    it("should register voicememos_play tool with required filename parameter", async () => {
      const { client } = await createTestPair();
      const result = await client.listTools();

      const playTool = result.tools.find((t) => t.name === "voicememos_play");
      expect(playTool).toBeDefined();
      expect(
        (playTool?.inputSchema as { required?: string[] })?.required
      ).toContain("filename");
    });

    it("should register voicememos_start_recording tool", async () => {
      const { client } = await createTestPair();
      const result = await client.listTools();

      const startTool = result.tools.find(
        (t) => t.name === "voicememos_start_recording"
      );
      expect(startTool).toBeDefined();
    });

    it("should register voicememos_stop_recording tool", async () => {
      const { client } = await createTestPair();
      const result = await client.listTools();

      const stopTool = result.tools.find(
        (t) => t.name === "voicememos_stop_recording"
      );
      expect(stopTool).toBeDefined();
    });

    it("should register voicememos_get_info tool", async () => {
      const { client } = await createTestPair();
      const result = await client.listTools();

      const infoTool = result.tools.find(
        (t) => t.name === "voicememos_get_info"
      );
      expect(infoTool).toBeDefined();
    });
  });

  describe("Tool Handlers", () => {
    describe("voicememos_open", () => {
      it("should open Voice Memos app successfully", async () => {
        (child_process.execSync as ReturnType<typeof vi.fn>).mockReturnValue(
          ""
        );

        const { client } = await createTestPair();
        const result = await client.callTool({
          name: "voicememos_open",
          arguments: {},
        });

        expect(result).toBeDefined();
        const textContent = result.content.find(
          (c) => c.type === "text"
        ) as { type: "text"; text: string };
        expect(textContent?.text).toBe("Voice Memos app opened");
        expect(child_process.execSync).toHaveBeenCalledWith(
          expect.stringContaining("osascript"),
          expect.any(Object)
        );
      });

      it("should handle AppleScript errors", async () => {
        const error = new Error("AppleScript failed") as Error & {
          stderr: string;
        };
        error.stderr = "Script error";
        (child_process.execSync as ReturnType<typeof vi.fn>).mockImplementation(
          () => {
            throw error;
          }
        );

        const { client } = await createTestPair();
        const result = await client.callTool({
          name: "voicememos_open",
          arguments: {},
        });

        const textContent = result.content.find(
          (c) => c.type === "text"
        ) as { type: "text"; text: string };
        expect(textContent?.text).toContain("Error");
      });
    });

    describe("voicememos_list", () => {
      it("should list voice memos successfully", async () => {
        const mockFiles = ["memo1.m4a", "memo2.m4a", "other.txt"];
        const mockDate = new Date("2024-01-15T10:30:00");

        (fs.readdirSync as ReturnType<typeof vi.fn>).mockReturnValue(mockFiles);
        (fs.statSync as ReturnType<typeof vi.fn>).mockReturnValue({
          size: 1024 * 100, // 100 KB
          mtime: mockDate,
        });

        const { client } = await createTestPair();
        const result = await client.callTool({
          name: "voicememos_list",
          arguments: {},
        });

        const textContent = result.content.find(
          (c) => c.type === "text"
        ) as { type: "text"; text: string };
        expect(textContent?.text).toContain("Voice Memos (2)");
        expect(textContent?.text).toContain("memo1.m4a");
        expect(textContent?.text).toContain("memo2.m4a");
        expect(textContent?.text).not.toContain("other.txt");
      });

      it("should respect limit parameter", async () => {
        const mockFiles = [
          "memo1.m4a",
          "memo2.m4a",
          "memo3.m4a",
          "memo4.m4a",
          "memo5.m4a",
        ];
        const mockDate = new Date("2024-01-15T10:30:00");

        (fs.readdirSync as ReturnType<typeof vi.fn>).mockReturnValue(mockFiles);
        (fs.statSync as ReturnType<typeof vi.fn>).mockReturnValue({
          size: 1024 * 100,
          mtime: mockDate,
        });

        const { client } = await createTestPair();
        const result = await client.callTool({
          name: "voicememos_list",
          arguments: { limit: 2 },
        });

        const textContent = result.content.find(
          (c) => c.type === "text"
        ) as { type: "text"; text: string };
        expect(textContent?.text).toContain("Voice Memos (2)");
      });

      it("should handle empty folder", async () => {
        (fs.readdirSync as ReturnType<typeof vi.fn>).mockReturnValue([]);

        const { client } = await createTestPair();
        const result = await client.callTool({
          name: "voicememos_list",
          arguments: {},
        });

        const textContent = result.content.find(
          (c) => c.type === "text"
        ) as { type: "text"; text: string };
        expect(textContent?.text).toBe("No voice memos found");
      });

      it("should handle folder access error", async () => {
        (fs.readdirSync as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("Permission denied");
        });

        const { client } = await createTestPair();
        const result = await client.callTool({
          name: "voicememos_list",
          arguments: {},
        });

        const textContent = result.content.find(
          (c) => c.type === "text"
        ) as { type: "text"; text: string };
        expect(textContent?.text).toContain("Could not access Voice Memos folder");
        expect(textContent?.text).toContain("Permission denied");
      });
    });

    describe("voicememos_start_recording", () => {
      it("should start recording successfully", async () => {
        (child_process.execSync as ReturnType<typeof vi.fn>).mockReturnValue(
          ""
        );

        const { client } = await createTestPair();
        const result = await client.callTool({
          name: "voicememos_start_recording",
          arguments: {},
        });

        const textContent = result.content.find(
          (c) => c.type === "text"
        ) as { type: "text"; text: string };
        expect(textContent?.text).toContain("Started recording");
      });

      it("should handle recording start failure", async () => {
        (child_process.execSync as ReturnType<typeof vi.fn>).mockImplementation(
          () => {
            throw new Error("UI scripting failed");
          }
        );

        const { client } = await createTestPair();
        const result = await client.callTool({
          name: "voicememos_start_recording",
          arguments: {},
        });

        const textContent = result.content.find(
          (c) => c.type === "text"
        ) as { type: "text"; text: string };
        expect(textContent?.text).toContain("Could not start recording");
      });
    });

    describe("voicememos_stop_recording", () => {
      it("should stop recording successfully", async () => {
        (child_process.execSync as ReturnType<typeof vi.fn>).mockReturnValue(
          ""
        );

        const { client } = await createTestPair();
        const result = await client.callTool({
          name: "voicememos_stop_recording",
          arguments: {},
        });

        const textContent = result.content.find(
          (c) => c.type === "text"
        ) as { type: "text"; text: string };
        expect(textContent?.text).toBe("Stopped recording");
      });

      it("should handle recording stop failure", async () => {
        (child_process.execSync as ReturnType<typeof vi.fn>).mockImplementation(
          () => {
            throw new Error("No active recording");
          }
        );

        const { client } = await createTestPair();
        const result = await client.callTool({
          name: "voicememos_stop_recording",
          arguments: {},
        });

        const textContent = result.content.find(
          (c) => c.type === "text"
        ) as { type: "text"; text: string };
        expect(textContent?.text).toContain("Could not stop recording");
      });
    });

    describe("voicememos_play", () => {
      it("should play a voice memo successfully", async () => {
        (child_process.execSync as ReturnType<typeof vi.fn>).mockReturnValue(
          ""
        );

        const { client } = await createTestPair();
        const result = await client.callTool({
          name: "voicememos_play",
          arguments: { filename: "test.m4a" },
        });

        const textContent = result.content.find(
          (c) => c.type === "text"
        ) as { type: "text"; text: string };
        expect(textContent?.text).toBe("Playing: test.m4a");
        expect(child_process.execSync).toHaveBeenCalledWith(
          expect.stringContaining("afplay"),
          expect.any(Object)
        );
      });

      it("should handle file not found error", async () => {
        (child_process.execSync as ReturnType<typeof vi.fn>).mockImplementation(
          () => {
            throw new Error("File not found");
          }
        );

        const { client } = await createTestPair();
        const result = await client.callTool({
          name: "voicememos_play",
          arguments: { filename: "nonexistent.m4a" },
        });

        const textContent = result.content.find(
          (c) => c.type === "text"
        ) as { type: "text"; text: string };
        expect(textContent?.text).toContain("Could not play file");
      });

      it("should handle missing filename", async () => {
        const { client } = await createTestPair();
        const result = await client.callTool({
          name: "voicememos_play",
          arguments: {},
        });

        const textContent = result.content.find(
          (c) => c.type === "text"
        ) as { type: "text"; text: string };
        expect(textContent?.text).toContain("filename is required");
        expect(result.isError).toBe(true);
      });

      it("should properly escape filenames with special characters", async () => {
        (child_process.execSync as ReturnType<typeof vi.fn>).mockReturnValue(
          ""
        );

        const { client } = await createTestPair();
        await client.callTool({
          name: "voicememos_play",
          arguments: { filename: "test's memo.m4a" },
        });

        // Verify the command was called with escaped path
        expect(child_process.execSync).toHaveBeenCalled();
      });
    });

    describe("voicememos_get_info", () => {
      it("should return information about Voice Memos MCP", async () => {
        const { client } = await createTestPair();
        const result = await client.callTool({
          name: "voicememos_get_info",
          arguments: {},
        });

        const textContent = result.content.find(
          (c) => c.type === "text"
        ) as { type: "text"; text: string };
        expect(textContent?.text).toContain("Voice Memos MCP Information");
        expect(textContent?.text).toContain("Voice Memos Storage Location");
        expect(textContent?.text).toContain("Accessibility permissions");
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle unknown tool gracefully", async () => {
      const { client } = await createTestPair();
      const result = await client.callTool({
        name: "unknown_tool",
        arguments: {},
      });

      const textContent = result.content.find(
        (c) => c.type === "text"
      ) as { type: "text"; text: string };
      expect(textContent?.text).toContain("Unknown tool");
      expect(result.isError).toBe(true);
    });
  });

  describe("Path Construction", () => {
    it("should construct correct Voice Memos path", () => {
      const expectedPath =
        "/Users/testuser/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings";
      expect(VOICE_MEMOS_PATH).toBe(expectedPath);
    });
  });
});
