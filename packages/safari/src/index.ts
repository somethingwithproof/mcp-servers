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
    name: "safari-mcp",
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

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Tab Management
      {
        name: "safari_get_current_tab",
        description: "Get information about the current active tab in Safari",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "safari_get_all_tabs",
        description: "Get all open tabs across all Safari windows",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "safari_get_window_tabs",
        description: "Get all tabs in a specific Safari window",
        inputSchema: {
          type: "object",
          properties: {
            windowIndex: {
              type: "number",
              description: "Window index (1-based)",
            },
          },
          required: ["windowIndex"],
        },
      },
      {
        name: "safari_open_url",
        description: "Open a URL in Safari (new tab or current tab)",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL to open",
            },
            newTab: {
              type: "boolean",
              description: "Open in new tab (default: true)",
            },
            newWindow: {
              type: "boolean",
              description: "Open in new window (default: false)",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "safari_close_tab",
        description: "Close a specific tab",
        inputSchema: {
          type: "object",
          properties: {
            windowIndex: {
              type: "number",
              description: "Window index (1-based)",
            },
            tabIndex: {
              type: "number",
              description: "Tab index (1-based)",
            },
          },
          required: ["windowIndex", "tabIndex"],
        },
      },
      {
        name: "safari_close_current_tab",
        description: "Close the current active tab",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "safari_switch_tab",
        description: "Switch to a specific tab",
        inputSchema: {
          type: "object",
          properties: {
            windowIndex: {
              type: "number",
              description: "Window index (1-based)",
            },
            tabIndex: {
              type: "number",
              description: "Tab index (1-based)",
            },
          },
          required: ["windowIndex", "tabIndex"],
        },
      },
      {
        name: "safari_search_tabs",
        description: "Search for tabs by title or URL",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (matches title or URL)",
            },
          },
          required: ["query"],
        },
      },
      // Navigation
      {
        name: "safari_reload",
        description: "Reload the current tab",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "safari_back",
        description: "Navigate back in the current tab",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "safari_forward",
        description: "Navigate forward in the current tab",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      // Window Management
      {
        name: "safari_get_windows",
        description: "Get all Safari windows",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "safari_new_window",
        description: "Open a new Safari window",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Optional URL to open in the new window",
            },
            private: {
              type: "boolean",
              description: "Open as private window (default: false)",
            },
          },
          required: [],
        },
      },
      {
        name: "safari_close_window",
        description: "Close a Safari window",
        inputSchema: {
          type: "object",
          properties: {
            windowIndex: {
              type: "number",
              description: "Window index (1-based)",
            },
          },
          required: ["windowIndex"],
        },
      },
      // Bookmarks
      {
        name: "safari_get_bookmarks",
        description: "Get Safari bookmarks from a folder",
        inputSchema: {
          type: "object",
          properties: {
            folder: {
              type: "string",
              description: "Bookmark folder name (default: Favorites Bar)",
            },
          },
          required: [],
        },
      },
      {
        name: "safari_add_bookmark",
        description: "Add a bookmark for the current page or a specified URL",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL to bookmark (default: current page)",
            },
            title: {
              type: "string",
              description: "Bookmark title",
            },
            folder: {
              type: "string",
              description: "Folder to add bookmark to (default: Favorites Bar)",
            },
          },
          required: [],
        },
      },
      // Reading List
      {
        name: "safari_get_reading_list",
        description: "Get items from Safari Reading List",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of items to return",
            },
          },
          required: [],
        },
      },
      {
        name: "safari_add_to_reading_list",
        description: "Add a URL to Safari Reading List",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL to add (default: current page)",
            },
            title: {
              type: "string",
              description: "Title for the reading list item",
            },
          },
          required: [],
        },
      },
      // Page Content
      {
        name: "safari_get_page_content",
        description: "Get the text content of the current page",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "safari_get_page_source",
        description: "Get the HTML source of the current page",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "safari_run_javascript",
        description: "Run JavaScript in the current tab (requires Allow JavaScript from Apple Events in Safari's Develop menu)",
        inputSchema: {
          type: "object",
          properties: {
            script: {
              type: "string",
              description: "JavaScript code to execute",
            },
          },
          required: ["script"],
        },
      },
      // Open Safari
      {
        name: "safari_open",
        description: "Open Safari application",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "safari_activate",
        description: "Bring Safari to the foreground",
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
      // Tab Management
      case "safari_get_current_tab": {
        const script = `
tell application "Safari"
  if (count of windows) > 0 then
    set currentTab to current tab of front window
    set tabInfo to "URL: " & URL of currentTab & "\\nTitle: " & name of currentTab
    return tabInfo
  else
    return "No windows open"
  end if
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      case "safari_get_all_tabs": {
        const script = `
tell application "Safari"
  set tabList to ""
  set windowNum to 1
  repeat with w in windows
    set tabNum to 1
    repeat with t in tabs of w
      set tabList to tabList & "Window " & windowNum & ", Tab " & tabNum & ":\\n"
      set tabList to tabList & "  Title: " & name of t & "\\n"
      set tabList to tabList & "  URL: " & URL of t & "\\n"
      set tabNum to tabNum + 1
    end repeat
    set windowNum to windowNum + 1
  end repeat
  if tabList is "" then
    return "No tabs open"
  end if
  return tabList
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      case "safari_get_window_tabs": {
        const windowIndex = (args as { windowIndex: number }).windowIndex;
        const script = `
tell application "Safari"
  if ${windowIndex} > (count of windows) then
    return "Window ${windowIndex} does not exist"
  end if
  set w to window ${windowIndex}
  set tabList to ""
  set tabNum to 1
  repeat with t in tabs of w
    set tabList to tabList & "Tab " & tabNum & ":\\n"
    set tabList to tabList & "  Title: " & name of t & "\\n"
    set tabList to tabList & "  URL: " & URL of t & "\\n"
    set tabNum to tabNum + 1
  end repeat
  return tabList
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      case "safari_open_url": {
        const { url, newTab = true, newWindow = false } = args as { url: string; newTab?: boolean; newWindow?: boolean };
        // Escape URL for AppleScript
        const safeUrl = url.replace(/"/g, '\\"');
        let script: string;
        if (newWindow) {
          script = `
tell application "Safari"
  make new document with properties {URL:"${safeUrl}"}
  activate
end tell`;
        } else if (newTab) {
          script = `
tell application "Safari"
  if (count of windows) = 0 then
    make new document with properties {URL:"${safeUrl}"}
  else
    tell front window
      set newTab to make new tab with properties {URL:"${safeUrl}"}
      set current tab to newTab
    end tell
  end if
  activate
end tell`;
        } else {
          script = `
tell application "Safari"
  if (count of windows) = 0 then
    make new document with properties {URL:"${safeUrl}"}
  else
    set URL of current tab of front window to "${safeUrl}"
  end if
  activate
end tell`;
        }
        runAppleScriptMulti(script);
        return { content: [{ type: "text", text: `Opened: ${url}` }] };
      }

      case "safari_close_tab": {
        const { windowIndex, tabIndex } = args as { windowIndex: number; tabIndex: number };
        const script = `
tell application "Safari"
  close tab ${tabIndex} of window ${windowIndex}
end tell`;
        runAppleScriptMulti(script);
        return { content: [{ type: "text", text: `Closed tab ${tabIndex} in window ${windowIndex}` }] };
      }

      case "safari_close_current_tab": {
        const script = `
tell application "Safari"
  if (count of windows) > 0 then
    close current tab of front window
    return "Closed current tab"
  else
    return "No windows open"
  end if
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      case "safari_switch_tab": {
        const { windowIndex, tabIndex } = args as { windowIndex: number; tabIndex: number };
        const script = `
tell application "Safari"
  set current tab of window ${windowIndex} to tab ${tabIndex} of window ${windowIndex}
  set index of window ${windowIndex} to 1
  activate
end tell`;
        runAppleScriptMulti(script);
        return { content: [{ type: "text", text: `Switched to tab ${tabIndex} in window ${windowIndex}` }] };
      }

      case "safari_search_tabs": {
        const query = (args as { query: string }).query.toLowerCase().replace(/"/g, '\\"');
        const script = `
tell application "Safari"
  set matchingTabs to ""
  set windowNum to 1
  repeat with w in windows
    set tabNum to 1
    repeat with t in tabs of w
      set tabTitle to name of t
      set tabURL to URL of t
      if tabTitle contains "${query}" or tabURL contains "${query}" then
        set matchingTabs to matchingTabs & "Window " & windowNum & ", Tab " & tabNum & ":\\n"
        set matchingTabs to matchingTabs & "  Title: " & tabTitle & "\\n"
        set matchingTabs to matchingTabs & "  URL: " & tabURL & "\\n"
      end if
      set tabNum to tabNum + 1
    end repeat
    set windowNum to windowNum + 1
  end repeat
  if matchingTabs is "" then
    return "No tabs found matching: ${query}"
  end if
  return matchingTabs
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      // Navigation
      case "safari_reload": {
        const script = `
tell application "Safari"
  if (count of windows) > 0 then
    set docURL to URL of current tab of front window
    set URL of current tab of front window to docURL
    return "Reloaded current tab"
  else
    return "No windows open"
  end if
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      case "safari_back": {
        const script = `
tell application "Safari"
  tell front window
    do JavaScript "history.back()" in current tab
  end tell
  return "Navigated back"
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      case "safari_forward": {
        const script = `
tell application "Safari"
  tell front window
    do JavaScript "history.forward()" in current tab
  end tell
  return "Navigated forward"
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      // Window Management
      case "safari_get_windows": {
        const script = `
tell application "Safari"
  set windowList to ""
  set windowNum to 1
  repeat with w in windows
    set windowList to windowList & "Window " & windowNum & ":\\n"
    set windowList to windowList & "  Name: " & name of w & "\\n"
    set windowList to windowList & "  Tabs: " & (count of tabs of w) & "\\n"
    set windowNum to windowNum + 1
  end repeat
  if windowList is "" then
    return "No windows open"
  end if
  return windowList
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      case "safari_new_window": {
        const { url, private: isPrivate = false } = args as { url?: string; private?: boolean };
        const safeUrl = url ? url.replace(/"/g, '\\"') : '';
        let script: string;
        if (isPrivate) {
          // Private windows require different approach via menu
          script = `
tell application "Safari"
  activate
end tell
tell application "System Events"
  tell process "Safari"
    click menu item "New Private Window" of menu "File" of menu bar 1
  end tell
end tell
delay 0.5
${safeUrl ? `tell application "Safari"
  set URL of current tab of front window to "${safeUrl}"
end tell` : ''}`;
        } else {
          script = `
tell application "Safari"
  ${safeUrl ? `make new document with properties {URL:"${safeUrl}"}` : 'make new document'}
  activate
end tell`;
        }
        runAppleScriptMulti(script);
        return { content: [{ type: "text", text: `Opened new ${isPrivate ? 'private ' : ''}window${url ? ` with ${url}` : ''}` }] };
      }

      case "safari_close_window": {
        const windowIndex = (args as { windowIndex: number }).windowIndex;
        const script = `
tell application "Safari"
  close window ${windowIndex}
end tell`;
        runAppleScriptMulti(script);
        return { content: [{ type: "text", text: `Closed window ${windowIndex}` }] };
      }

      // Bookmarks
      case "safari_get_bookmarks": {
        const folder = (args as { folder?: string }).folder || "Favorites Bar";
        // Note: Safari's bookmark access via AppleScript is limited
        // This uses a workaround via reading the bookmarks plist
        const script = `
set plistPath to (POSIX path of (path to home folder)) & "Library/Safari/Bookmarks.plist"
try
  set bookmarkData to do shell script "plutil -convert json -o - " & quoted form of plistPath
  return bookmarkData
on error errMsg
  return "Error reading bookmarks: " & errMsg
end try`;
        const result = runAppleScriptMulti(script);
        // Parse and format the bookmarks
        try {
          const bookmarks = JSON.parse(result);
          const formatted = formatBookmarks(bookmarks, folder);
          return { content: [{ type: "text", text: formatted }] };
        } catch {
          return { content: [{ type: "text", text: result }] };
        }
      }

      case "safari_add_bookmark": {
        const { url } = args as { url?: string; title?: string; folder?: string };
        const safeUrl = url ? url.replace(/"/g, '\\"') : '';
        // Safari doesn't have direct AppleScript support for adding bookmarks
        // We'll use a workaround via keyboard shortcuts
        const script = `
tell application "Safari"
  activate
  ${safeUrl ? `set URL of current tab of front window to "${safeUrl}"
  delay 1` : ''}
end tell
tell application "System Events"
  tell process "Safari"
    keystroke "d" using {command down}
    delay 0.5
  end tell
end tell`;
        runAppleScriptMulti(script);
        return { content: [{ type: "text", text: `Opened bookmark dialog. Please complete adding the bookmark manually.` }] };
      }

      // Reading List
      case "safari_get_reading_list": {
        const limit = (args as { limit?: number }).limit || 50;
        const script = `
set plistPath to (POSIX path of (path to home folder)) & "Library/Safari/Bookmarks.plist"
try
  set bookmarkData to do shell script "plutil -convert json -o - " & quoted form of plistPath
  return bookmarkData
on error errMsg
  return "Error reading reading list: " & errMsg
end try`;
        const result = runAppleScriptMulti(script);
        try {
          const bookmarks = JSON.parse(result);
          const readingList = extractReadingList(bookmarks, limit);
          return { content: [{ type: "text", text: readingList }] };
        } catch {
          return { content: [{ type: "text", text: result }] };
        }
      }

      case "safari_add_to_reading_list": {
        const { url } = args as { url?: string; title?: string };
        const safeUrl = url ? url.replace(/"/g, '\\"') : '';
        const script = `
tell application "Safari"
  activate
  ${safeUrl ? `
  if (count of windows) = 0 then
    make new document with properties {URL:"${safeUrl}"}
  else
    set URL of current tab of front window to "${safeUrl}"
  end if
  delay 1` : ''}
end tell
tell application "System Events"
  tell process "Safari"
    keystroke "d" using {command down, shift down}
  end tell
end tell`;
        runAppleScriptMulti(script);
        return { content: [{ type: "text", text: `Added to Reading List${url ? ': ' + url : ''}` }] };
      }

      // Page Content
      case "safari_get_page_content": {
        const script = `
tell application "Safari"
  if (count of windows) > 0 then
    set pageText to do JavaScript "document.body.innerText" in current tab of front window
    return pageText
  else
    return "No windows open"
  end if
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      case "safari_get_page_source": {
        const script = `
tell application "Safari"
  if (count of windows) > 0 then
    set pageSource to do JavaScript "document.documentElement.outerHTML" in current tab of front window
    return pageSource
  else
    return "No windows open"
  end if
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result }] };
      }

      case "safari_run_javascript": {
        const jsCode = (args as { script: string }).script;
        // Escape the JavaScript for AppleScript
        const escapedJs = jsCode.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        const script = `
tell application "Safari"
  if (count of windows) > 0 then
    set jsResult to do JavaScript "${escapedJs}" in current tab of front window
    return jsResult as text
  else
    return "No windows open"
  end if
end tell`;
        const result = runAppleScriptMulti(script);
        return { content: [{ type: "text", text: result || "JavaScript executed (no return value)" }] };
      }

      // Open Safari
      case "safari_open": {
        runAppleScript('tell application "Safari" to activate');
        return { content: [{ type: "text", text: "Safari opened" }] };
      }

      case "safari_activate": {
        runAppleScript('tell application "Safari" to activate');
        return { content: [{ type: "text", text: "Safari brought to foreground" }] };
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

// Helper function to format bookmarks from the plist data
function formatBookmarks(data: BookmarkData, targetFolder: string): string {
  const results: string[] = [];

  function traverse(node: BookmarkData, path: string = ""): void {
    if (node.WebBookmarkType === "WebBookmarkTypeList" && node.Children) {
      const folderName = node.Title || "Root";
      const currentPath = path ? `${path}/${folderName}` : folderName;

      if (folderName.toLowerCase().includes(targetFolder.toLowerCase()) || targetFolder === "*") {
        for (const child of node.Children) {
          if (child.WebBookmarkType === "WebBookmarkTypeLeaf" && child.URLString) {
            results.push(`[${currentPath}] ${child.URIDictionary?.title || "Untitled"}: ${child.URLString}`);
          }
        }
      }

      for (const child of node.Children) {
        traverse(child, currentPath);
      }
    }
  }

  traverse(data);
  return results.length > 0 ? results.join("\n") : `No bookmarks found in folder: ${targetFolder}`;
}

// Helper function to extract reading list items
function extractReadingList(data: BookmarkData, limit: number): string {
  const results: string[] = [];

  function traverse(node: BookmarkData): void {
    if (node.Title === "com.apple.ReadingList" && node.Children) {
      for (const child of node.Children.slice(0, limit)) {
        if (child.URLString) {
          const title = child.URIDictionary?.title || "Untitled";
          const dateAdded = child.ReadingList?.DateAdded || "";
          results.push(`- ${title}\n  URL: ${child.URLString}${dateAdded ? `\n  Added: ${dateAdded}` : ""}`);
        }
      }
    } else if (node.Children) {
      for (const child of node.Children) {
        traverse(child);
      }
    }
  }

  traverse(data);
  return results.length > 0 ? `Reading List (${results.length} items):\n\n${results.join("\n\n")}` : "Reading List is empty";
}

// Type definitions for bookmark data
interface BookmarkData {
  WebBookmarkType?: string;
  Title?: string;
  URLString?: string;
  URIDictionary?: {
    title?: string;
  };
  ReadingList?: {
    DateAdded?: string;
  };
  Children?: BookmarkData[];
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Safari MCP server running on stdio");
}

main().catch(console.error);
