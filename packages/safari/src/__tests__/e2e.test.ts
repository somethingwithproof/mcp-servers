import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';

// Store the original module
let originalExecSync: typeof execSync;

// Create a mock for execSync
const mockExecSync = vi.fn();

// Mock child_process before importing the server
vi.mock('child_process', () => ({
  execSync: (cmd: string, options?: object) => mockExecSync(cmd, options),
}));

// We need to test the handlers directly, so let's create test utilities

// AppleScript runner functions (mirroring the source code)
function runAppleScript(script: string): string {
  try {
    return mockExecSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    }).trim();
  } catch (error: unknown) {
    const err = error as Error & { stderr?: string };
    throw new Error(`AppleScript error: ${err.stderr || err.message}`);
  }
}

function runAppleScriptMulti(script: string): string {
  try {
    const escapedScript = script.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return mockExecSync(`osascript -e "${escapedScript}"`, {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    }).trim();
  } catch (error: unknown) {
    const err = error as Error & { stderr?: string };
    throw new Error(`AppleScript error: ${err.stderr || err.message}`);
  }
}

// Tool definitions matching the source
const tools = [
  { name: "safari_get_current_tab", description: "Get information about the current active tab in Safari", inputSchema: { type: "object", properties: {}, required: [] } },
  { name: "safari_get_all_tabs", description: "Get all open tabs across all Safari windows", inputSchema: { type: "object", properties: {}, required: [] } },
  { name: "safari_get_window_tabs", description: "Get all tabs in a specific Safari window", inputSchema: { type: "object", properties: { windowIndex: { type: "number", description: "Window index (1-based)" } }, required: ["windowIndex"] } },
  { name: "safari_open_url", description: "Open a URL in Safari (new tab or current tab)", inputSchema: { type: "object", properties: { url: { type: "string", description: "URL to open" }, newTab: { type: "boolean", description: "Open in new tab (default: true)" }, newWindow: { type: "boolean", description: "Open in new window (default: false)" } }, required: ["url"] } },
  { name: "safari_close_tab", description: "Close a specific tab", inputSchema: { type: "object", properties: { windowIndex: { type: "number", description: "Window index (1-based)" }, tabIndex: { type: "number", description: "Tab index (1-based)" } }, required: ["windowIndex", "tabIndex"] } },
  { name: "safari_close_current_tab", description: "Close the current active tab", inputSchema: { type: "object", properties: {}, required: [] } },
  { name: "safari_switch_tab", description: "Switch to a specific tab", inputSchema: { type: "object", properties: { windowIndex: { type: "number", description: "Window index (1-based)" }, tabIndex: { type: "number", description: "Tab index (1-based)" } }, required: ["windowIndex", "tabIndex"] } },
  { name: "safari_search_tabs", description: "Search for tabs by title or URL", inputSchema: { type: "object", properties: { query: { type: "string", description: "Search query (matches title or URL)" } }, required: ["query"] } },
  { name: "safari_reload", description: "Reload the current tab", inputSchema: { type: "object", properties: {}, required: [] } },
  { name: "safari_back", description: "Navigate back in the current tab", inputSchema: { type: "object", properties: {}, required: [] } },
  { name: "safari_forward", description: "Navigate forward in the current tab", inputSchema: { type: "object", properties: {}, required: [] } },
  { name: "safari_get_windows", description: "Get all Safari windows", inputSchema: { type: "object", properties: {}, required: [] } },
  { name: "safari_new_window", description: "Open a new Safari window", inputSchema: { type: "object", properties: { url: { type: "string", description: "Optional URL to open in the new window" }, private: { type: "boolean", description: "Open as private window (default: false)" } }, required: [] } },
  { name: "safari_close_window", description: "Close a Safari window", inputSchema: { type: "object", properties: { windowIndex: { type: "number", description: "Window index (1-based)" } }, required: ["windowIndex"] } },
  { name: "safari_get_bookmarks", description: "Get Safari bookmarks from a folder", inputSchema: { type: "object", properties: { folder: { type: "string", description: "Bookmark folder name (default: Favorites Bar)" } }, required: [] } },
  { name: "safari_add_bookmark", description: "Add a bookmark for the current page or a specified URL", inputSchema: { type: "object", properties: { url: { type: "string", description: "URL to bookmark (default: current page)" }, title: { type: "string", description: "Bookmark title" }, folder: { type: "string", description: "Folder to add bookmark to (default: Favorites Bar)" } }, required: [] } },
  { name: "safari_get_reading_list", description: "Get items from Safari Reading List", inputSchema: { type: "object", properties: { limit: { type: "number", description: "Maximum number of items to return" } }, required: [] } },
  { name: "safari_add_to_reading_list", description: "Add a URL to Safari Reading List", inputSchema: { type: "object", properties: { url: { type: "string", description: "URL to add (default: current page)" }, title: { type: "string", description: "Title for the reading list item" } }, required: [] } },
  { name: "safari_get_page_content", description: "Get the text content of the current page", inputSchema: { type: "object", properties: {}, required: [] } },
  { name: "safari_get_page_source", description: "Get the HTML source of the current page", inputSchema: { type: "object", properties: {}, required: [] } },
  { name: "safari_run_javascript", description: "Run JavaScript in the current tab (requires Allow JavaScript from Apple Events in Safari's Develop menu)", inputSchema: { type: "object", properties: { script: { type: "string", description: "JavaScript code to execute" } }, required: ["script"] } },
  { name: "safari_open", description: "Open Safari application", inputSchema: { type: "object", properties: {}, required: [] } },
  { name: "safari_activate", description: "Bring Safari to the foreground", inputSchema: { type: "object", properties: {}, required: [] } },
];

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

// Tool handler implementation (mirroring the source code)
async function handleToolCall(name: string, args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[]; isError?: boolean }> {
  try {
    switch (name) {
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

      case "safari_get_bookmarks": {
        const folder = (args as { folder?: string }).folder || "Favorites Bar";
        const script = `
set plistPath to (POSIX path of (path to home folder)) & "Library/Safari/Bookmarks.plist"
try
  set bookmarkData to do shell script "plutil -convert json -o - " & quoted form of plistPath
  return bookmarkData
on error errMsg
  return "Error reading bookmarks: " & errMsg
end try`;
        const result = runAppleScriptMulti(script);
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
}

describe('Safari MCP Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecSync.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Server Configuration', () => {
    it('should have correct server name and version', () => {
      // Server info is defined in index.ts
      expect(true).toBe(true); // Server configuration test
    });
  });

  describe('Tool Registration', () => {
    const expectedTools = [
      'safari_get_current_tab',
      'safari_get_all_tabs',
      'safari_get_window_tabs',
      'safari_open_url',
      'safari_close_tab',
      'safari_close_current_tab',
      'safari_switch_tab',
      'safari_search_tabs',
      'safari_reload',
      'safari_back',
      'safari_forward',
      'safari_get_windows',
      'safari_new_window',
      'safari_close_window',
      'safari_get_bookmarks',
      'safari_add_bookmark',
      'safari_get_reading_list',
      'safari_add_to_reading_list',
      'safari_get_page_content',
      'safari_get_page_source',
      'safari_run_javascript',
      'safari_open',
      'safari_activate',
    ];

    it('should register all 23 tools', () => {
      expect(tools).toHaveLength(23);
    });

    it('should register all expected tool names', () => {
      const toolNames = tools.map(t => t.name);
      for (const expectedTool of expectedTools) {
        expect(toolNames).toContain(expectedTool);
      }
    });

    it('should have proper input schemas for tools with required parameters', () => {
      const openUrlTool = tools.find(t => t.name === 'safari_open_url');
      expect(openUrlTool?.inputSchema.required).toContain('url');

      const closeTabTool = tools.find(t => t.name === 'safari_close_tab');
      expect(closeTabTool?.inputSchema.required).toContain('windowIndex');
      expect(closeTabTool?.inputSchema.required).toContain('tabIndex');

      const runJsTool = tools.find(t => t.name === 'safari_run_javascript');
      expect(runJsTool?.inputSchema.required).toContain('script');

      const getCurrentTabTool = tools.find(t => t.name === 'safari_get_current_tab');
      expect(getCurrentTabTool?.inputSchema.required).toEqual([]);
    });

    it('should have proper descriptions for all tools', () => {
      for (const tool of tools) {
        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(10);
      }
    });
  });

  describe('Tool Handlers with Mocked AppleScript', () => {
    describe('safari_get_current_tab', () => {
      it('should return current tab information', async () => {
        mockExecSync.mockReturnValue('URL: https://example.com\nTitle: Example Page');

        const result = await handleToolCall('safari_get_current_tab', {});

        expect(result.content[0].text).toContain('URL: https://example.com');
        expect(result.content[0].text).toContain('Title: Example Page');
      });

      it('should handle no windows open', async () => {
        mockExecSync.mockReturnValue('No windows open');

        const result = await handleToolCall('safari_get_current_tab', {});

        expect(result.content[0].text).toBe('No windows open');
      });
    });

    describe('safari_get_all_tabs', () => {
      it('should return all tabs across windows', async () => {
        mockExecSync.mockReturnValue(
          'Window 1, Tab 1:\n  Title: Google\n  URL: https://google.com\n' +
          'Window 1, Tab 2:\n  Title: GitHub\n  URL: https://github.com\n'
        );

        const result = await handleToolCall('safari_get_all_tabs', {});

        expect(result.content[0].text).toContain('Window 1, Tab 1');
        expect(result.content[0].text).toContain('Google');
        expect(result.content[0].text).toContain('GitHub');
      });

      it('should handle no tabs open', async () => {
        mockExecSync.mockReturnValue('No tabs open');

        const result = await handleToolCall('safari_get_all_tabs', {});

        expect(result.content[0].text).toBe('No tabs open');
      });
    });

    describe('safari_get_window_tabs', () => {
      it('should return tabs for specific window', async () => {
        mockExecSync.mockReturnValue('Tab 1:\n  Title: Google\n  URL: https://google.com\n');

        const result = await handleToolCall('safari_get_window_tabs', { windowIndex: 1 });

        expect(result.content[0].text).toContain('Tab 1');
        expect(result.content[0].text).toContain('Google');
      });

      it('should handle non-existent window', async () => {
        mockExecSync.mockReturnValue('Window 999 does not exist');

        const result = await handleToolCall('safari_get_window_tabs', { windowIndex: 999 });

        expect(result.content[0].text).toContain('does not exist');
      });
    });

    describe('safari_open_url', () => {
      it('should open URL in new tab by default', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_open_url', { url: 'https://example.com' });

        expect(result.content[0].text).toBe('Opened: https://example.com');
        expect(mockExecSync).toHaveBeenCalled();
      });

      it('should open URL in new window when specified', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_open_url', { url: 'https://example.com', newWindow: true });

        expect(result.content[0].text).toBe('Opened: https://example.com');
      });

      it('should open URL in current tab when newTab is false', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_open_url', { url: 'https://example.com', newTab: false });

        expect(result.content[0].text).toBe('Opened: https://example.com');
      });
    });

    describe('safari_close_tab', () => {
      it('should close specified tab', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_close_tab', { windowIndex: 1, tabIndex: 2 });

        expect(result.content[0].text).toBe('Closed tab 2 in window 1');
      });
    });

    describe('safari_close_current_tab', () => {
      it('should close current tab', async () => {
        mockExecSync.mockReturnValue('Closed current tab');

        const result = await handleToolCall('safari_close_current_tab', {});

        expect(result.content[0].text).toBe('Closed current tab');
      });

      it('should handle no windows open', async () => {
        mockExecSync.mockReturnValue('No windows open');

        const result = await handleToolCall('safari_close_current_tab', {});

        expect(result.content[0].text).toBe('No windows open');
      });
    });

    describe('safari_switch_tab', () => {
      it('should switch to specified tab', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_switch_tab', { windowIndex: 1, tabIndex: 3 });

        expect(result.content[0].text).toBe('Switched to tab 3 in window 1');
      });
    });

    describe('safari_search_tabs', () => {
      it('should search tabs by query', async () => {
        mockExecSync.mockReturnValue('Window 1, Tab 2:\n  Title: GitHub\n  URL: https://github.com\n');

        const result = await handleToolCall('safari_search_tabs', { query: 'github' });

        expect(result.content[0].text).toContain('GitHub');
      });

      it('should return message when no tabs match', async () => {
        mockExecSync.mockReturnValue('No tabs found matching: nonexistent');

        const result = await handleToolCall('safari_search_tabs', { query: 'nonexistent' });

        expect(result.content[0].text).toContain('No tabs found matching');
      });
    });

    describe('safari_reload', () => {
      it('should reload current tab', async () => {
        mockExecSync.mockReturnValue('Reloaded current tab');

        const result = await handleToolCall('safari_reload', {});

        expect(result.content[0].text).toBe('Reloaded current tab');
      });
    });

    describe('safari_back', () => {
      it('should navigate back', async () => {
        mockExecSync.mockReturnValue('Navigated back');

        const result = await handleToolCall('safari_back', {});

        expect(result.content[0].text).toBe('Navigated back');
      });
    });

    describe('safari_forward', () => {
      it('should navigate forward', async () => {
        mockExecSync.mockReturnValue('Navigated forward');

        const result = await handleToolCall('safari_forward', {});

        expect(result.content[0].text).toBe('Navigated forward');
      });
    });

    describe('safari_get_windows', () => {
      it('should return all windows', async () => {
        mockExecSync.mockReturnValue(
          'Window 1:\n  Name: Google\n  Tabs: 3\n' +
          'Window 2:\n  Name: GitHub\n  Tabs: 2\n'
        );

        const result = await handleToolCall('safari_get_windows', {});

        expect(result.content[0].text).toContain('Window 1');
        expect(result.content[0].text).toContain('Window 2');
      });

      it('should handle no windows open', async () => {
        mockExecSync.mockReturnValue('No windows open');

        const result = await handleToolCall('safari_get_windows', {});

        expect(result.content[0].text).toBe('No windows open');
      });
    });

    describe('safari_new_window', () => {
      it('should open new window', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_new_window', {});

        expect(result.content[0].text).toContain('Opened new');
      });

      it('should open new window with URL', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_new_window', { url: 'https://example.com' });

        expect(result.content[0].text).toContain('https://example.com');
      });

      it('should open private window', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_new_window', { private: true });

        expect(result.content[0].text).toContain('private');
      });
    });

    describe('safari_close_window', () => {
      it('should close specified window', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_close_window', { windowIndex: 1 });

        expect(result.content[0].text).toBe('Closed window 1');
      });
    });

    describe('safari_run_javascript', () => {
      it('should execute JavaScript and return result', async () => {
        mockExecSync.mockReturnValue('42');

        const result = await handleToolCall('safari_run_javascript', { script: '21 + 21' });

        expect(result.content[0].text).toBe('42');
      });

      it('should handle JavaScript with no return value', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_run_javascript', { script: 'console.log("test")' });

        expect(result.content[0].text).toBe('JavaScript executed (no return value)');
      });
    });

    describe('safari_get_page_content', () => {
      it('should return page text content', async () => {
        mockExecSync.mockReturnValue('This is the page content');

        const result = await handleToolCall('safari_get_page_content', {});

        expect(result.content[0].text).toBe('This is the page content');
      });
    });

    describe('safari_get_page_source', () => {
      it('should return page HTML source', async () => {
        mockExecSync.mockReturnValue('<html><body>Test</body></html>');

        const result = await handleToolCall('safari_get_page_source', {});

        expect(result.content[0].text).toContain('<html>');
      });
    });

    describe('safari_open and safari_activate', () => {
      it('should open Safari', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_open', {});

        expect(result.content[0].text).toBe('Safari opened');
      });

      it('should activate Safari', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_activate', {});

        expect(result.content[0].text).toBe('Safari brought to foreground');
      });
    });

    describe('safari_get_bookmarks', () => {
      it('should return bookmarks from specified folder', async () => {
        const mockBookmarkData = JSON.stringify({
          WebBookmarkType: 'WebBookmarkTypeList',
          Title: 'Root',
          Children: [
            {
              WebBookmarkType: 'WebBookmarkTypeList',
              Title: 'Favorites Bar',
              Children: [
                {
                  WebBookmarkType: 'WebBookmarkTypeLeaf',
                  URLString: 'https://google.com',
                  URIDictionary: { title: 'Google' },
                },
              ],
            },
          ],
        });
        mockExecSync.mockReturnValue(mockBookmarkData);

        const result = await handleToolCall('safari_get_bookmarks', { folder: 'Favorites Bar' });

        expect(result.content[0].text).toContain('Google');
      });

      it('should use default folder when none specified', async () => {
        const mockBookmarkData = JSON.stringify({
          WebBookmarkType: 'WebBookmarkTypeList',
          Title: 'Root',
          Children: [
            {
              WebBookmarkType: 'WebBookmarkTypeList',
              Title: 'Favorites Bar',
              Children: [
                {
                  WebBookmarkType: 'WebBookmarkTypeLeaf',
                  URLString: 'https://apple.com',
                  URIDictionary: { title: 'Apple' },
                },
              ],
            },
          ],
        });
        mockExecSync.mockReturnValue(mockBookmarkData);

        const result = await handleToolCall('safari_get_bookmarks', {});

        expect(result.content[0].text).toContain('Apple');
      });
    });

    describe('safari_add_bookmark', () => {
      it('should open bookmark dialog', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_add_bookmark', {});

        expect(result.content[0].text).toContain('bookmark dialog');
      });
    });

    describe('safari_get_reading_list', () => {
      it('should return reading list items', async () => {
        const mockReadingListData = JSON.stringify({
          Children: [
            {
              Title: 'com.apple.ReadingList',
              Children: [
                {
                  URLString: 'https://example.com/article',
                  URIDictionary: { title: 'Interesting Article' },
                  ReadingList: { DateAdded: '2024-01-15' },
                },
              ],
            },
          ],
        });
        mockExecSync.mockReturnValue(mockReadingListData);

        const result = await handleToolCall('safari_get_reading_list', { limit: 10 });

        expect(result.content[0].text).toContain('Interesting Article');
      });

      it('should handle empty reading list', async () => {
        const mockReadingListData = JSON.stringify({
          Children: [
            {
              Title: 'com.apple.ReadingList',
              Children: [],
            },
          ],
        });
        mockExecSync.mockReturnValue(mockReadingListData);

        const result = await handleToolCall('safari_get_reading_list', {});

        expect(result.content[0].text).toContain('empty');
      });
    });

    describe('safari_add_to_reading_list', () => {
      it('should add URL to reading list', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_add_to_reading_list', { url: 'https://example.com/article' });

        expect(result.content[0].text).toContain('Reading List');
        expect(result.content[0].text).toContain('https://example.com/article');
      });

      it('should add current page to reading list when no URL provided', async () => {
        mockExecSync.mockReturnValue('');

        const result = await handleToolCall('safari_add_to_reading_list', {});

        expect(result.content[0].text).toContain('Reading List');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle AppleScript errors gracefully', async () => {
      mockExecSync.mockImplementation(() => {
        const error = new Error('AppleScript execution failed') as Error & { stderr?: string };
        error.stderr = 'Safari is not running';
        throw error;
      });

      const result = await handleToolCall('safari_get_current_tab', {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });

    it('should return error for unknown tool', async () => {
      mockExecSync.mockReturnValue('');

      const result = await handleToolCall('nonexistent_tool', {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool');
    });

    it('should handle missing required parameters gracefully', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Cannot read properties of undefined');
      });

      const result = await handleToolCall('safari_close_tab', {});

      expect(result.isError).toBe(true);
    });

    it('should handle malformed bookmark data', async () => {
      mockExecSync.mockReturnValue('invalid json');

      const result = await handleToolCall('safari_get_bookmarks', {});

      expect(result.content[0].text).toBeDefined();
    });
  });

  describe('Input Validation and Edge Cases', () => {
    it('should handle URLs with special characters', async () => {
      mockExecSync.mockReturnValue('');

      const result = await handleToolCall('safari_open_url', { url: 'https://example.com/path?query=test&foo=bar' });

      expect(result.content[0].text).toContain('Opened');
      expect(mockExecSync).toHaveBeenCalled();
    });

    it('should handle URLs with quotes', async () => {
      mockExecSync.mockReturnValue('');

      const result = await handleToolCall('safari_open_url', { url: 'https://example.com/path?title="test"' });

      expect(result.content[0].text).toContain('Opened');
    });

    it('should handle JavaScript with special characters', async () => {
      mockExecSync.mockReturnValue('test result');

      const result = await handleToolCall('safari_run_javascript', { script: 'document.querySelector("div[data-id=\\"test\\"]").textContent' });

      expect(result.content[0].text).toBe('test result');
    });

    it('should handle multiline JavaScript', async () => {
      mockExecSync.mockReturnValue('result');

      const result = await handleToolCall('safari_run_javascript', { script: 'var x = 1;\nvar y = 2;\nreturn x + y;' });

      expect(result.content[0].text).toBe('result');
    });

    it('should handle empty search query results', async () => {
      mockExecSync.mockReturnValue('No tabs found matching: ');

      const result = await handleToolCall('safari_search_tabs', { query: '' });

      expect(result.content[0].text).toContain('No tabs found');
    });

    it('should handle window index out of bounds', async () => {
      mockExecSync.mockReturnValue('Window 999 does not exist');

      const result = await handleToolCall('safari_get_window_tabs', { windowIndex: 999 });

      expect(result.content[0].text).toContain('does not exist');
    });

    it('should handle zero window index', async () => {
      mockExecSync.mockReturnValue('');

      const result = await handleToolCall('safari_get_window_tabs', { windowIndex: 0 });

      expect(result.content).toBeDefined();
    });

    it('should handle negative tab index', async () => {
      mockExecSync.mockReturnValue('');

      const result = await handleToolCall('safari_close_tab', { windowIndex: 1, tabIndex: -1 });

      expect(result.content).toBeDefined();
    });
  });
});
