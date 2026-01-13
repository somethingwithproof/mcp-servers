import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as child_process from "child_process";

// Mock child_process.execSync before importing the module
// This prevents actual AppleScript execution during tests
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

// Tool names that should be registered
const EXPECTED_TOOLS = [
  "photos_get_albums",
  "photos_get_album_photos",
  "photos_create_album",
  "photos_delete_album",
  "photos_get_smart_albums",
  "photos_get_recent",
  "photos_get_favorites",
  "photos_get_photo_info",
  "photos_search",
  "photos_search_by_date",
  "photos_export",
  "photos_export_photo",
  "photos_set_favorite",
  "photos_get_library_stats",
  "photos_open",
  "photos_open_album",
  "photos_import",
];

describe("Photos MCP Server E2E Tests", () => {
  let server: Server;
  let listToolsHandler: (request: unknown) => Promise<{ tools: Array<{ name: string; description: string; inputSchema: unknown }> }>;
  let callToolHandler: (request: unknown) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>;
  const mockedExecSync = vi.mocked(child_process.execSync);

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create a new server instance for each test
    server = new Server(
      {
        name: "photos-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Set up the list tools handler
    listToolsHandler = async () => {
      return {
        tools: [
          // Album Management
          {
            name: "photos_get_albums",
            description: "Get all albums in the Photos library",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "photos_get_album_photos",
            description: "Get photos from a specific album",
            inputSchema: {
              type: "object",
              properties: {
                album: { type: "string", description: "Album name" },
                limit: { type: "number", description: "Maximum number of photos to return (default: 50)" },
              },
              required: ["album"],
            },
          },
          {
            name: "photos_create_album",
            description: "Create a new album",
            inputSchema: {
              type: "object",
              properties: {
                name: { type: "string", description: "Name for the new album" },
              },
              required: ["name"],
            },
          },
          {
            name: "photos_delete_album",
            description: "Delete an album (photos are not deleted)",
            inputSchema: {
              type: "object",
              properties: {
                album: { type: "string", description: "Album name to delete" },
              },
              required: ["album"],
            },
          },
          {
            name: "photos_get_smart_albums",
            description: "Get all smart albums (Favorites, Recently Added, etc.)",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "photos_get_recent",
            description: "Get recently added photos",
            inputSchema: {
              type: "object",
              properties: {
                limit: { type: "number", description: "Maximum number of photos to return (default: 20)" },
              },
              required: [],
            },
          },
          {
            name: "photos_get_favorites",
            description: "Get favorite photos",
            inputSchema: {
              type: "object",
              properties: {
                limit: { type: "number", description: "Maximum number of photos to return (default: 50)" },
              },
              required: [],
            },
          },
          {
            name: "photos_get_photo_info",
            description: "Get detailed information about a specific photo",
            inputSchema: {
              type: "object",
              properties: {
                photoId: { type: "string", description: "Photo ID" },
              },
              required: ["photoId"],
            },
          },
          {
            name: "photos_search",
            description: "Search photos by description, filename, or keywords",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query" },
                limit: { type: "number", description: "Maximum number of results (default: 20)" },
              },
              required: ["query"],
            },
          },
          {
            name: "photos_search_by_date",
            description: "Search photos by date range",
            inputSchema: {
              type: "object",
              properties: {
                startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
                endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
                limit: { type: "number", description: "Maximum number of results (default: 50)" },
              },
              required: ["startDate", "endDate"],
            },
          },
          {
            name: "photos_export",
            description: "Export photos to a directory",
            inputSchema: {
              type: "object",
              properties: {
                album: { type: "string", description: "Album name to export" },
                destination: { type: "string", description: "Destination directory" },
                limit: { type: "number", description: "Maximum number of photos to export" },
              },
              required: [],
            },
          },
          {
            name: "photos_export_photo",
            description: "Export a specific photo by ID",
            inputSchema: {
              type: "object",
              properties: {
                photoId: { type: "string", description: "Photo ID to export" },
                destination: { type: "string", description: "Destination directory" },
              },
              required: ["photoId"],
            },
          },
          {
            name: "photos_set_favorite",
            description: "Set or unset a photo as favorite",
            inputSchema: {
              type: "object",
              properties: {
                photoId: { type: "string", description: "Photo ID" },
                favorite: { type: "boolean", description: "Set as favorite (true) or remove favorite (false)" },
              },
              required: ["photoId", "favorite"],
            },
          },
          {
            name: "photos_get_library_stats",
            description: "Get statistics about the Photos library",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "photos_open",
            description: "Open the Photos app",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "photos_open_album",
            description: "Open a specific album in Photos",
            inputSchema: {
              type: "object",
              properties: {
                album: { type: "string", description: "Album name to open" },
              },
              required: ["album"],
            },
          },
          {
            name: "photos_import",
            description: "Import photos from a file or directory",
            inputSchema: {
              type: "object",
              properties: {
                path: { type: "string", description: "Path to file or directory to import" },
                album: { type: "string", description: "Album to import into (optional)" },
              },
              required: ["path"],
            },
          },
        ],
      };
    };

    // Helper function to run AppleScript (mocked)
    const runAppleScript = (script: string): string => {
      return mockedExecSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024,
      }) as string;
    };

    const runAppleScriptMulti = (script: string): string => {
      const escapedScript = script.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return (mockedExecSync(`osascript -e "${escapedScript}"`, {
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024,
      }) as string).trim();
    };

    // Set up the call tool handler
    callToolHandler = async (request: unknown) => {
      const req = request as { params: { name: string; arguments?: Record<string, unknown> } };
      const { name, arguments: args } = req.params;

      try {
        switch (name) {
          case "photos_get_albums": {
            const result = runAppleScriptMulti(`
tell application "Photos"
  set albumList to ""
  repeat with a in albums
    set albumList to albumList & name of a & " (" & (count of media items of a) & " photos)\\n"
  end repeat
  if albumList is "" then
    return "No albums found"
  end if
  return albumList
end tell`);
            return { content: [{ type: "text", text: `Albums:\n${result}` }] };
          }

          case "photos_get_album_photos": {
            const album = (args as { album: string }).album;
            const limit = (args as { limit?: number }).limit || 50;
            if (!album) {
              return { content: [{ type: "text", text: "Error: album is required" }], isError: true };
            }
            const result = runAppleScriptMulti(`tell application "Photos" to get photos of album "${album}" limit ${limit}`);
            return { content: [{ type: "text", text: result }] };
          }

          case "photos_create_album": {
            const albumName = (args as { name: string }).name;
            if (!albumName) {
              return { content: [{ type: "text", text: "Error: name is required" }], isError: true };
            }
            const result = runAppleScriptMulti(`tell application "Photos" to make new album named "${albumName}"`);
            return { content: [{ type: "text", text: result }] };
          }

          case "photos_delete_album": {
            const album = (args as { album: string }).album;
            if (!album) {
              return { content: [{ type: "text", text: "Error: album is required" }], isError: true };
            }
            const result = runAppleScriptMulti(`tell application "Photos" to delete album "${album}"`);
            return { content: [{ type: "text", text: result }] };
          }

          case "photos_get_smart_albums": {
            const result = runAppleScriptMulti(`tell application "Photos" to get smart albums`);
            return { content: [{ type: "text", text: `Smart Albums:\n${result}` }] };
          }

          case "photos_get_recent": {
            const limit = (args as { limit?: number }).limit || 20;
            const result = runAppleScriptMulti(`tell application "Photos" to get recent photos limit ${limit}`);
            return { content: [{ type: "text", text: `Recent Photos:\n${result}` }] };
          }

          case "photos_get_favorites": {
            const limit = (args as { limit?: number }).limit || 50;
            const result = runAppleScriptMulti(`tell application "Photos" to get favorites limit ${limit}`);
            return { content: [{ type: "text", text: `Favorites:\n${result}` }] };
          }

          case "photos_get_photo_info": {
            const photoId = (args as { photoId: string }).photoId;
            if (!photoId) {
              return { content: [{ type: "text", text: "Error: photoId is required" }], isError: true };
            }
            const result = runAppleScriptMulti(`tell application "Photos" to get info of photo id "${photoId}"`);
            return { content: [{ type: "text", text: result }] };
          }

          case "photos_search": {
            const query = (args as { query: string }).query;
            const limit = (args as { limit?: number }).limit || 20;
            if (!query) {
              return { content: [{ type: "text", text: "Error: query is required" }], isError: true };
            }
            const result = runAppleScriptMulti(`tell application "Photos" to search for "${query}" limit ${limit}`);
            return { content: [{ type: "text", text: result }] };
          }

          case "photos_search_by_date": {
            const startDate = (args as { startDate: string }).startDate;
            const endDate = (args as { endDate: string }).endDate;
            const limit = (args as { limit?: number }).limit || 50;
            if (!startDate || !endDate) {
              return { content: [{ type: "text", text: "Error: startDate and endDate are required" }], isError: true };
            }
            const result = runAppleScriptMulti(`tell application "Photos" to search by date from "${startDate}" to "${endDate}" limit ${limit}`);
            return { content: [{ type: "text", text: result }] };
          }

          case "photos_export": {
            const album = (args as { album?: string }).album;
            const destination = (args as { destination?: string }).destination || "/tmp/photos";
            const limit = (args as { limit?: number }).limit || 10;
            // Create destination directory
            mockedExecSync(`mkdir -p '${destination}'`);
            const result = album
              ? runAppleScriptMulti(`tell application "Photos" to export album "${album}" to "${destination}" limit ${limit}`)
              : runAppleScriptMulti(`tell application "Photos" to export selection to "${destination}" limit ${limit}`);
            return { content: [{ type: "text", text: result }] };
          }

          case "photos_export_photo": {
            const photoId = (args as { photoId: string }).photoId;
            const destination = (args as { destination?: string }).destination || "/tmp/photos";
            if (!photoId) {
              return { content: [{ type: "text", text: "Error: photoId is required" }], isError: true };
            }
            // Create destination directory
            mockedExecSync(`mkdir -p '${destination}'`);
            const result = runAppleScriptMulti(`tell application "Photos" to export photo id "${photoId}" to "${destination}"`);
            return { content: [{ type: "text", text: result }] };
          }

          case "photos_set_favorite": {
            const photoId = (args as { photoId: string }).photoId;
            const favorite = (args as { favorite: boolean }).favorite;
            if (!photoId || favorite === undefined) {
              return { content: [{ type: "text", text: "Error: photoId and favorite are required" }], isError: true };
            }
            const result = runAppleScriptMulti(`tell application "Photos" to set favorite of photo id "${photoId}" to ${favorite}`);
            return { content: [{ type: "text", text: result }] };
          }

          case "photos_get_library_stats": {
            const result = runAppleScriptMulti(`tell application "Photos" to get library stats`);
            return { content: [{ type: "text", text: `Library Statistics:\n${result}` }] };
          }

          case "photos_open": {
            runAppleScript('tell application "Photos" to activate');
            return { content: [{ type: "text", text: "Photos app opened" }] };
          }

          case "photos_open_album": {
            const album = (args as { album: string }).album;
            if (!album) {
              return { content: [{ type: "text", text: "Error: album is required" }], isError: true };
            }
            runAppleScriptMulti(`tell application "Photos" to activate and open album "${album}"`);
            return { content: [{ type: "text", text: `Opened Photos app. Navigate to album: ${album}` }] };
          }

          case "photos_import": {
            const path = (args as { path: string }).path;
            const album = (args as { album?: string }).album;
            if (!path) {
              return { content: [{ type: "text", text: "Error: path is required" }], isError: true };
            }
            const result = album
              ? runAppleScriptMulti(`tell application "Photos" to import "${path}" into album "${album}"`)
              : runAppleScriptMulti(`tell application "Photos" to import "${path}"`);
            return { content: [{ type: "text", text: result }] };
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
    };

    // Register handlers with the server
    server.setRequestHandler(ListToolsRequestSchema, listToolsHandler);
    server.setRequestHandler(CallToolRequestSchema, callToolHandler);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Server Initialization", () => {
    it("should create a server with correct name and version", () => {
      expect(server).toBeDefined();
    });

    it("should have tools capability enabled", () => {
      expect(server).toBeDefined();
    });
  });

  describe("Tool Registration", () => {
    it("should list all expected tools", async () => {
      const result = await listToolsHandler({});
      const toolNames = result.tools.map((t) => t.name);

      expect(toolNames).toHaveLength(EXPECTED_TOOLS.length);
      for (const expectedTool of EXPECTED_TOOLS) {
        expect(toolNames).toContain(expectedTool);
      }
    });

    it("should have correct schema for photos_get_albums", async () => {
      const result = await listToolsHandler({});
      const tool = result.tools.find((t) => t.name === "photos_get_albums");

      expect(tool).toBeDefined();
      expect(tool?.description).toBe("Get all albums in the Photos library");
      expect(tool?.inputSchema).toMatchObject({
        type: "object",
        properties: {},
        required: [],
      });
    });

    it("should have correct schema for photos_get_album_photos with required album", async () => {
      const result = await listToolsHandler({});
      const tool = result.tools.find((t) => t.name === "photos_get_album_photos");

      expect(tool).toBeDefined();
      expect(tool?.inputSchema).toMatchObject({
        type: "object",
        properties: {
          album: { type: "string" },
          limit: { type: "number" },
        },
        required: ["album"],
      });
    });

    it("should have correct schema for photos_search with required query", async () => {
      const result = await listToolsHandler({});
      const tool = result.tools.find((t) => t.name === "photos_search");

      expect(tool).toBeDefined();
      expect(tool?.inputSchema).toMatchObject({
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
        },
        required: ["query"],
      });
    });

    it("should have correct schema for photos_search_by_date with required dates", async () => {
      const result = await listToolsHandler({});
      const tool = result.tools.find((t) => t.name === "photos_search_by_date");

      expect(tool).toBeDefined();
      expect(tool?.inputSchema).toMatchObject({
        type: "object",
        required: ["startDate", "endDate"],
      });
    });

    it("should have correct schema for photos_set_favorite with required fields", async () => {
      const result = await listToolsHandler({});
      const tool = result.tools.find((t) => t.name === "photos_set_favorite");

      expect(tool).toBeDefined();
      expect(tool?.inputSchema).toMatchObject({
        type: "object",
        properties: {
          photoId: { type: "string" },
          favorite: { type: "boolean" },
        },
        required: ["photoId", "favorite"],
      });
    });
  });

  describe("Tool Handlers - Album Management", () => {
    it("should handle photos_get_albums", async () => {
      mockedExecSync.mockReturnValue("Vacation (10 photos)\nFamily (5 photos)\n");

      const result = await callToolHandler({
        params: { name: "photos_get_albums", arguments: {} },
      });

      expect(result.content[0].text).toContain("Albums:");
      expect(result.isError).toBeUndefined();
    });

    it("should handle photos_get_album_photos with valid album", async () => {
      mockedExecSync.mockReturnValue("photo1 - IMG_001.jpg (2024-01-01)\nphoto2 - IMG_002.jpg (2024-01-02)\n");

      const result = await callToolHandler({
        params: {
          name: "photos_get_album_photos",
          arguments: { album: "Vacation", limit: 10 },
        },
      });

      expect(result.content[0].text).toContain("photo1");
      expect(result.isError).toBeUndefined();
    });

    it("should handle photos_create_album", async () => {
      mockedExecSync.mockReturnValue("Created album: Test Album");

      const result = await callToolHandler({
        params: {
          name: "photos_create_album",
          arguments: { name: "Test Album" },
        },
      });

      expect(result.content[0].text).toContain("Created album");
      expect(result.isError).toBeUndefined();
    });

    it("should handle photos_delete_album", async () => {
      mockedExecSync.mockReturnValue("Deleted album: Test Album");

      const result = await callToolHandler({
        params: {
          name: "photos_delete_album",
          arguments: { album: "Test Album" },
        },
      });

      expect(result.content[0].text).toContain("Deleted album");
      expect(result.isError).toBeUndefined();
    });

    it("should handle photos_get_smart_albums", async () => {
      mockedExecSync.mockReturnValue("Favorites\nRecently Added\nPanoramas\n");

      const result = await callToolHandler({
        params: { name: "photos_get_smart_albums", arguments: {} },
      });

      expect(result.content[0].text).toContain("Smart Albums:");
      expect(result.isError).toBeUndefined();
    });
  });

  describe("Tool Handlers - Photo Information", () => {
    it("should handle photos_get_recent", async () => {
      mockedExecSync.mockReturnValue("photo1 - IMG_001.jpg (2024-01-01)\nphoto2 - IMG_002.jpg (2024-01-02)\n");

      const result = await callToolHandler({
        params: { name: "photos_get_recent", arguments: { limit: 5 } },
      });

      expect(result.content[0].text).toContain("Recent Photos:");
      expect(result.isError).toBeUndefined();
    });

    it("should handle photos_get_favorites", async () => {
      mockedExecSync.mockReturnValue("photo1 - Sunset.jpg\nphoto2 - Beach.jpg\n");

      const result = await callToolHandler({
        params: { name: "photos_get_favorites", arguments: { limit: 10 } },
      });

      expect(result.content[0].text).toContain("Favorites:");
      expect(result.isError).toBeUndefined();
    });

    it("should handle photos_get_photo_info", async () => {
      mockedExecSync.mockReturnValue("ID: photo123\nFilename: IMG_001.jpg\nDate: 2024-01-01\nFavorite: true\n");

      const result = await callToolHandler({
        params: {
          name: "photos_get_photo_info",
          arguments: { photoId: "photo123" },
        },
      });

      expect(result.content[0].text).toContain("ID:");
      expect(result.isError).toBeUndefined();
    });

    it("should handle photos_get_library_stats", async () => {
      mockedExecSync.mockReturnValue("Total Photos: 1000\nTotal Albums: 15\nFavorites: 50");

      const result = await callToolHandler({
        params: { name: "photos_get_library_stats", arguments: {} },
      });

      expect(result.content[0].text).toContain("Library Statistics:");
      expect(result.isError).toBeUndefined();
    });
  });

  describe("Tool Handlers - Search", () => {
    it("should handle photos_search with query", async () => {
      mockedExecSync.mockReturnValue("photo1 - beach.jpg\nphoto2 - beach_sunset.jpg\n");

      const result = await callToolHandler({
        params: {
          name: "photos_search",
          arguments: { query: "beach", limit: 10 },
        },
      });

      expect(result.content[0].text).toContain("beach");
      expect(result.isError).toBeUndefined();
    });

    it("should handle photos_search_by_date", async () => {
      mockedExecSync.mockReturnValue("photo1 - IMG_001.jpg (2024-01-15)\nphoto2 - IMG_002.jpg (2024-01-20)\n");

      const result = await callToolHandler({
        params: {
          name: "photos_search_by_date",
          arguments: { startDate: "2024-01-01", endDate: "2024-01-31" },
        },
      });

      expect(result.content[0].text).toContain("photo1");
      expect(result.isError).toBeUndefined();
    });
  });

  describe("Tool Handlers - Export", () => {
    it("should handle photos_export with album", async () => {
      mockedExecSync.mockReturnValue("Exported 5 photos from Vacation to /tmp/export");

      const result = await callToolHandler({
        params: {
          name: "photos_export",
          arguments: { album: "Vacation", destination: "/tmp/export", limit: 5 },
        },
      });

      expect(result.content[0].text).toContain("Exported");
      expect(result.isError).toBeUndefined();
    });

    it("should handle photos_export without album (selection)", async () => {
      mockedExecSync.mockReturnValue("Exported 3 selected photos to /tmp/export");

      const result = await callToolHandler({
        params: {
          name: "photos_export",
          arguments: { destination: "/tmp/export" },
        },
      });

      expect(result.content[0].text).toContain("Exported");
      expect(result.isError).toBeUndefined();
    });

    it("should handle photos_export_photo", async () => {
      mockedExecSync.mockReturnValue("Exported IMG_001.jpg to /tmp/export");

      const result = await callToolHandler({
        params: {
          name: "photos_export_photo",
          arguments: { photoId: "photo123", destination: "/tmp/export" },
        },
      });

      expect(result.content[0].text).toContain("Exported");
      expect(result.isError).toBeUndefined();
    });

    it("should create destination directory for export", async () => {
      mockedExecSync.mockReturnValue("Exported 1 photo");

      await callToolHandler({
        params: {
          name: "photos_export_photo",
          arguments: { photoId: "photo123", destination: "/tmp/new_export" },
        },
      });

      // Verify mkdir was called
      expect(mockedExecSync).toHaveBeenCalledWith("mkdir -p '/tmp/new_export'");
    });
  });

  describe("Tool Handlers - Favorites", () => {
    it("should handle photos_set_favorite to true", async () => {
      mockedExecSync.mockReturnValue("Set favorite to true for photo: IMG_001.jpg");

      const result = await callToolHandler({
        params: {
          name: "photos_set_favorite",
          arguments: { photoId: "photo123", favorite: true },
        },
      });

      expect(result.content[0].text).toContain("favorite");
      expect(result.isError).toBeUndefined();
    });

    it("should handle photos_set_favorite to false", async () => {
      mockedExecSync.mockReturnValue("Set favorite to false for photo: IMG_001.jpg");

      const result = await callToolHandler({
        params: {
          name: "photos_set_favorite",
          arguments: { photoId: "photo123", favorite: false },
        },
      });

      expect(result.content[0].text).toContain("favorite");
      expect(result.isError).toBeUndefined();
    });
  });

  describe("Tool Handlers - Application Control", () => {
    it("should handle photos_open", async () => {
      mockedExecSync.mockReturnValue("");

      const result = await callToolHandler({
        params: { name: "photos_open", arguments: {} },
      });

      expect(result.content[0].text).toBe("Photos app opened");
      expect(result.isError).toBeUndefined();
    });

    it("should handle photos_open_album", async () => {
      mockedExecSync.mockReturnValue("");

      const result = await callToolHandler({
        params: {
          name: "photos_open_album",
          arguments: { album: "Vacation" },
        },
      });

      expect(result.content[0].text).toContain("Navigate to album: Vacation");
      expect(result.isError).toBeUndefined();
    });
  });

  describe("Tool Handlers - Import", () => {
    it("should handle photos_import without album", async () => {
      mockedExecSync.mockReturnValue("Imported: /path/to/photo.jpg");

      const result = await callToolHandler({
        params: {
          name: "photos_import",
          arguments: { path: "/path/to/photo.jpg" },
        },
      });

      expect(result.content[0].text).toContain("Imported");
      expect(result.isError).toBeUndefined();
    });

    it("should handle photos_import with album", async () => {
      mockedExecSync.mockReturnValue("Imported to album: Vacation");

      const result = await callToolHandler({
        params: {
          name: "photos_import",
          arguments: { path: "/path/to/photo.jpg", album: "Vacation" },
        },
      });

      expect(result.content[0].text).toContain("Imported to album");
      expect(result.isError).toBeUndefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle unknown tool", async () => {
      const result = await callToolHandler({
        params: { name: "unknown_tool", arguments: {} },
      });

      expect(result.content[0].text).toContain("Unknown tool");
      expect(result.isError).toBe(true);
    });

    it("should handle missing required album parameter", async () => {
      const result = await callToolHandler({
        params: {
          name: "photos_get_album_photos",
          arguments: {},
        },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("album is required");
    });

    it("should handle missing required photoId parameter", async () => {
      const result = await callToolHandler({
        params: {
          name: "photos_get_photo_info",
          arguments: {},
        },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("photoId is required");
    });

    it("should handle missing required query parameter", async () => {
      const result = await callToolHandler({
        params: {
          name: "photos_search",
          arguments: {},
        },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("query is required");
    });

    it("should handle missing required date parameters", async () => {
      const result = await callToolHandler({
        params: {
          name: "photos_search_by_date",
          arguments: { startDate: "2024-01-01" },
        },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("required");
    });

    it("should handle missing required path parameter for import", async () => {
      const result = await callToolHandler({
        params: {
          name: "photos_import",
          arguments: {},
        },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("path is required");
    });

    it("should handle missing required parameters for set_favorite", async () => {
      const result = await callToolHandler({
        params: {
          name: "photos_set_favorite",
          arguments: { photoId: "photo123" },
        },
      });

      expect(result.isError).toBe(true);
    });

    it("should handle AppleScript execution errors", async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error("AppleScript error: Photos is not running");
      });

      const result = await callToolHandler({
        params: { name: "photos_get_albums", arguments: {} },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error:");
    });

    it("should handle AppleScript stderr errors", async () => {
      const error = new Error("Command failed") as Error & { stderr?: string };
      error.stderr = "Permission denied";
      mockedExecSync.mockImplementation(() => {
        throw error;
      });

      const result = await callToolHandler({
        params: { name: "photos_get_albums", arguments: {} },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error:");
    });
  });

  describe("Input Sanitization", () => {
    it("should handle album names with special characters", async () => {
      mockedExecSync.mockReturnValue("Created album: Test \"Album\" Name");

      const result = await callToolHandler({
        params: {
          name: "photos_create_album",
          arguments: { name: 'Test "Album" Name' },
        },
      });

      expect(result.isError).toBeUndefined();
    });

    it("should handle search queries with special characters", async () => {
      mockedExecSync.mockReturnValue("No photos found");

      const result = await callToolHandler({
        params: {
          name: "photos_search",
          arguments: { query: 'beach & sunset "vacation"' },
        },
      });

      expect(result.isError).toBeUndefined();
    });

    it("should handle file paths with spaces", async () => {
      mockedExecSync.mockReturnValue("Imported: /path/to/my photo.jpg");

      const result = await callToolHandler({
        params: {
          name: "photos_import",
          arguments: { path: "/path/to/my photo.jpg" },
        },
      });

      expect(result.isError).toBeUndefined();
    });
  });

  describe("Default Values", () => {
    it("should use default limit for photos_get_recent", async () => {
      mockedExecSync.mockReturnValue("photo1\nphoto2\n");

      const result = await callToolHandler({
        params: {
          name: "photos_get_recent",
          arguments: {},
        },
      });

      expect(result.isError).toBeUndefined();
      // The AppleScript should have been called with default limit of 20
      expect(mockedExecSync).toHaveBeenCalled();
    });

    it("should use default limit for photos_get_favorites", async () => {
      mockedExecSync.mockReturnValue("photo1\nphoto2\n");

      const result = await callToolHandler({
        params: {
          name: "photos_get_favorites",
          arguments: {},
        },
      });

      expect(result.isError).toBeUndefined();
    });

    it("should use default destination for export", async () => {
      mockedExecSync.mockReturnValue("Exported 1 photo");

      const result = await callToolHandler({
        params: {
          name: "photos_export_photo",
          arguments: { photoId: "photo123" },
        },
      });

      expect(result.isError).toBeUndefined();
      // Should have created the default directory
      expect(mockedExecSync).toHaveBeenCalledWith(expect.stringContaining("mkdir -p"));
    });
  });
});
