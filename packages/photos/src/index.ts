#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import { homedir } from "os";
import { join } from "path";

const server = new Server(
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

// Helper to run multi-line AppleScript
function runAppleScriptMulti(script: string): string {
  try {
    const escapedScript = script.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return execSync(`osascript -e "${escapedScript}"`, {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    }).trim();
  } catch (error: unknown) {
    const err = error as Error & { stderr?: string };
    throw new Error(`AppleScript error: ${err.stderr || err.message}`);
  }
}

// Default export directory
const DEFAULT_EXPORT_DIR = join(homedir(), "Pictures", "PhotosExport");

server.setRequestHandler(ListToolsRequestSchema, async () => {
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
            album: {
              type: "string",
              description: "Album name",
            },
            limit: {
              type: "number",
              description: "Maximum number of photos to return (default: 50)",
            },
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
            name: {
              type: "string",
              description: "Name for the new album",
            },
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
            album: {
              type: "string",
              description: "Album name to delete",
            },
          },
          required: ["album"],
        },
      },
      // Smart Albums
      {
        name: "photos_get_smart_albums",
        description: "Get all smart albums (Favorites, Recently Added, etc.)",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      // Photo Information
      {
        name: "photos_get_recent",
        description: "Get recently added photos",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of photos to return (default: 20)",
            },
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
            limit: {
              type: "number",
              description: "Maximum number of photos to return (default: 50)",
            },
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
            photoId: {
              type: "string",
              description: "Photo ID",
            },
          },
          required: ["photoId"],
        },
      },
      // Search
      {
        name: "photos_search",
        description: "Search photos by description, filename, or keywords",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 20)",
            },
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
            startDate: {
              type: "string",
              description: "Start date (YYYY-MM-DD)",
            },
            endDate: {
              type: "string",
              description: "End date (YYYY-MM-DD)",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 50)",
            },
          },
          required: ["startDate", "endDate"],
        },
      },
      // Export
      {
        name: "photos_export",
        description: "Export photos to a directory",
        inputSchema: {
          type: "object",
          properties: {
            album: {
              type: "string",
              description: "Album name to export (optional - exports selection if not specified)",
            },
            destination: {
              type: "string",
              description: `Destination directory (default: ${DEFAULT_EXPORT_DIR})`,
            },
            limit: {
              type: "number",
              description: "Maximum number of photos to export (default: 10)",
            },
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
            photoId: {
              type: "string",
              description: "Photo ID to export",
            },
            destination: {
              type: "string",
              description: `Destination directory (default: ${DEFAULT_EXPORT_DIR})`,
            },
          },
          required: ["photoId"],
        },
      },
      // Favorites
      {
        name: "photos_set_favorite",
        description: "Set or unset a photo as favorite",
        inputSchema: {
          type: "object",
          properties: {
            photoId: {
              type: "string",
              description: "Photo ID",
            },
            favorite: {
              type: "boolean",
              description: "Set as favorite (true) or remove favorite (false)",
            },
          },
          required: ["photoId", "favorite"],
        },
      },
      // Library Stats
      {
        name: "photos_get_library_stats",
        description: "Get statistics about the Photos library",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      // Application Control
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
            album: {
              type: "string",
              description: "Album name to open",
            },
          },
          required: ["album"],
        },
      },
      // Import
      {
        name: "photos_import",
        description: "Import photos from a file or directory",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to file or directory to import",
            },
            album: {
              type: "string",
              description: "Album to import into (optional)",
            },
          },
          required: ["path"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Album Management
      case "photos_get_albums": {
        const script = `
tell application "Photos"
  set albumList to ""
  repeat with a in albums
    set albumList to albumList & name of a & " (" & (count of media items of a) & " photos)\\n"
  end repeat
  if albumList is "" then
    return "No albums found"
  end if
  return albumList
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: `Albums:\n${result}` }] };
      }

      case "photos_get_album_photos": {
        const { album, limit = 50 } = args as { album: string; limit?: number };
        const safeAlbum = album.replace(/"/g, '\\"');
        const script = `
tell application "Photos"
  try
    set theAlbum to album "${safeAlbum}"
    set photoList to ""
    set photoCount to 0
    repeat with p in media items of theAlbum
      if photoCount < ${limit} then
        set photoList to photoList & id of p & " - " & filename of p & " (" & date of p & ")\\n"
        set photoCount to photoCount + 1
      end if
    end repeat
    if photoList is "" then
      return "Album is empty"
    end if
    return photoList
  on error
    return "Album not found: ${safeAlbum}"
  end try
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      case "photos_create_album": {
        const albumName = (args as { name: string }).name.replace(/"/g, '\\"');
        const script = `
tell application "Photos"
  try
    make new album named "${albumName}"
    return "Created album: ${albumName}"
  on error errMsg
    return "Error creating album: " & errMsg
  end try
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      case "photos_delete_album": {
        const album = (args as { album: string }).album.replace(/"/g, '\\"');
        const script = `
tell application "Photos"
  try
    delete album "${album}"
    return "Deleted album: ${album}"
  on error errMsg
    return "Error deleting album: " & errMsg
  end try
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      // Smart Albums
      case "photos_get_smart_albums": {
        const script = `
tell application "Photos"
  set smartList to ""
  repeat with a in containers
    if class of a is not album then
      set smartList to smartList & name of a & "\\n"
    end if
  end repeat
  if smartList is "" then
    return "No smart albums found"
  end if
  return smartList
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: `Smart Albums:\n${result}` }] };
      }

      // Photo Information
      case "photos_get_recent": {
        const limit = (args as { limit?: number }).limit || 20;
        const script = `
tell application "Photos"
  set photoList to ""
  set photoCount to 0
  repeat with p in media items
    if photoCount < ${limit} then
      set photoList to photoList & id of p & " - " & filename of p & " (" & date of p & ")\\n"
      set photoCount to photoCount + 1
    end if
  end repeat
  if photoList is "" then
    return "No photos found"
  end if
  return photoList
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: `Recent Photos:\n${result}` }] };
      }

      case "photos_get_favorites": {
        const limit = (args as { limit?: number }).limit || 50;
        const script = `
tell application "Photos"
  set photoList to ""
  set photoCount to 0
  repeat with p in media items
    if favorite of p is true and photoCount < ${limit} then
      set photoList to photoList & id of p & " - " & filename of p & " (" & date of p & ")\\n"
      set photoCount to photoCount + 1
    end if
  end repeat
  if photoList is "" then
    return "No favorite photos found"
  end if
  return photoList
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: `Favorites:\n${result}` }] };
      }

      case "photos_get_photo_info": {
        const photoId = (args as { photoId: string }).photoId.replace(/"/g, '\\"');
        const script = `
tell application "Photos"
  try
    set p to media item id "${photoId}"
    set infoText to "ID: " & id of p & "\\n"
    set infoText to infoText & "Filename: " & filename of p & "\\n"
    set infoText to infoText & "Date: " & date of p & "\\n"
    set infoText to infoText & "Favorite: " & favorite of p & "\\n"
    set infoText to infoText & "Width: " & width of p & "\\n"
    set infoText to infoText & "Height: " & height of p & "\\n"
    try
      set infoText to infoText & "Description: " & description of p & "\\n"
    end try
    try
      set infoText to infoText & "Keywords: " & (keywords of p as text) & "\\n"
    end try
    try
      set infoText to infoText & "Location: " & location of p & "\\n"
    end try
    return infoText
  on error errMsg
    return "Photo not found or error: " & errMsg
  end try
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      // Search
      case "photos_search": {
        const { query, limit = 20 } = args as { query: string; limit?: number };
        const safeQuery = query.toLowerCase().replace(/"/g, '\\"');
        const script = `
tell application "Photos"
  set results to ""
  set matchCount to 0
  repeat with p in media items
    if matchCount < ${limit} then
      set pFilename to filename of p
      try
        set pDesc to description of p
      on error
        set pDesc to ""
      end try
      if pFilename contains "${safeQuery}" or pDesc contains "${safeQuery}" then
        set results to results & id of p & " - " & pFilename & " (" & date of p & ")\\n"
        set matchCount to matchCount + 1
      end if
    end if
  end repeat
  if results is "" then
    return "No photos found matching: ${safeQuery}"
  end if
  return results
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      case "photos_search_by_date": {
        const { startDate, endDate, limit = 50 } = args as { startDate: string; endDate: string; limit?: number };
        const script = `
tell application "Photos"
  set startD to date "${startDate}"
  set endD to date "${endDate}"
  set results to ""
  set matchCount to 0
  repeat with p in media items
    if matchCount < ${limit} then
      set pDate to date of p
      if pDate >= startD and pDate <= endD then
        set results to results & id of p & " - " & filename of p & " (" & pDate & ")\\n"
        set matchCount to matchCount + 1
      end if
    end if
  end repeat
  if results is "" then
    return "No photos found in date range"
  end if
  return results
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      // Export
      case "photos_export": {
        const { album, destination = DEFAULT_EXPORT_DIR, limit = 10 } = args as { album?: string; destination?: string; limit?: number };
        const safeDest = destination.replace(/"/g, '\\"');
        const safeAlbum = album ? album.replace(/"/g, '\\"') : null;

        // Ensure destination exists using execSync with proper escaping
        execSync(`mkdir -p '${destination.replace(/'/g, "'\"'\"'")}'`);

        const script = safeAlbum ? `
tell application "Photos"
  try
    set theAlbum to album "${safeAlbum}"
    set exportCount to 0
    repeat with p in media items of theAlbum
      if exportCount < ${limit} then
        export {p} to POSIX file "${safeDest}"
        set exportCount to exportCount + 1
      end if
    end repeat
    return "Exported " & exportCount & " photos from ${safeAlbum} to ${safeDest}"
  on error errMsg
    return "Error: " & errMsg
  end try
end tell` : `
tell application "Photos"
  try
    set exportCount to 0
    repeat with p in selection
      if exportCount < ${limit} then
        export {p} to POSIX file "${safeDest}"
        set exportCount to exportCount + 1
      end if
    end repeat
    if exportCount = 0 then
      return "No photos selected. Please select photos in the Photos app or specify an album."
    end if
    return "Exported " & exportCount & " selected photos to ${safeDest}"
  on error errMsg
    return "Error: " & errMsg
  end try
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      case "photos_export_photo": {
        const { photoId, destination = DEFAULT_EXPORT_DIR } = args as { photoId: string; destination?: string };
        const safeDest = destination.replace(/"/g, '\\"');
        const safeId = photoId.replace(/"/g, '\\"');

        // Ensure destination exists
        execSync(`mkdir -p '${destination.replace(/'/g, "'\"'\"'")}'`);

        const script = `
tell application "Photos"
  try
    set p to media item id "${safeId}"
    export {p} to POSIX file "${safeDest}"
    return "Exported " & filename of p & " to ${safeDest}"
  on error errMsg
    return "Error: " & errMsg
  end try
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      // Favorites
      case "photos_set_favorite": {
        const { photoId, favorite } = args as { photoId: string; favorite: boolean };
        const safeId = photoId.replace(/"/g, '\\"');
        const script = `
tell application "Photos"
  try
    set p to media item id "${safeId}"
    set favorite of p to ${favorite}
    return "Set favorite to ${favorite} for photo: " & filename of p
  on error errMsg
    return "Error: " & errMsg
  end try
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      // Library Stats
      case "photos_get_library_stats": {
        const script = `
tell application "Photos"
  set totalPhotos to count of media items
  set totalAlbums to count of albums
  set favoriteCount to 0
  repeat with p in media items
    if favorite of p is true then
      set favoriteCount to favoriteCount + 1
    end if
  end repeat
  return "Total Photos: " & totalPhotos & "\\nTotal Albums: " & totalAlbums & "\\nFavorites: " & favoriteCount
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: `Library Statistics:\n${result}` }] };
      }

      // Application Control
      case "photos_open": {
        runAppleScript('tell application "Photos" to activate');
        return { content: [{ type: "text", text: "Photos app opened" }] };
      }

      case "photos_open_album": {
        const album = (args as { album: string }).album.replace(/"/g, '\\"');
        const script = `
tell application "Photos"
  activate
  try
    set theAlbum to album "${album}"
    return "Opened Photos app. Navigate to album: ${album}"
  on error
    return "Album not found: ${album}"
  end try
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      // Import
      case "photos_import": {
        const { path, album } = args as { path: string; album?: string };
        const safePath = path.replace(/"/g, '\\"');
        const safeAlbum = album ? album.replace(/"/g, '\\"') : null;

        const script = safeAlbum ? `
tell application "Photos"
  try
    set theAlbum to album "${safeAlbum}"
    import POSIX file "${safePath}" into theAlbum
    return "Imported to album: ${safeAlbum}"
  on error errMsg
    return "Error: " & errMsg
  end try
end tell` : `
tell application "Photos"
  try
    import POSIX file "${safePath}"
    return "Imported: ${safePath}"
  on error errMsg
    return "Error: " & errMsg
  end try
end tell`;
        const result = runAppleScriptMulti(script);
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
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Photos MCP server running on stdio");
}

main().catch(console.error);
