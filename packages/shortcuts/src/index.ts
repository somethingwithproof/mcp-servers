#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { exec, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ============================================================================
// Shortcuts CLI Wrapper
// ============================================================================

interface Shortcut {
  name: string;
  folder?: string;
}

async function listShortcuts(): Promise<Shortcut[]> {
  try {
    const result = await execAsync("shortcuts list", {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    });

    const lines = result.stdout.trim().split("\n").filter(Boolean);
    return lines.map((name) => ({ name: name.trim() }));
  } catch (error: any) {
    throw new Error(`Failed to list shortcuts: ${error.message}`);
  }
}

async function listFolders(): Promise<string[]> {
  try {
    const result = await execAsync("shortcuts list --folders", {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    });

    return result.stdout.trim().split("\n").filter(Boolean);
  } catch (error: any) {
    // Folders might not be supported in all versions
    return [];
  }
}

async function runShortcut(
  name: string,
  options: {
    input?: string;
    inputFile?: string;
    outputType?: string;
  } = {}
): Promise<{ success: boolean; output?: string; error?: string }> {
  const { input, inputFile, outputType } = options;

  return new Promise((resolve) => {
    const args = ["run", name];

    if (inputFile) {
      args.push("--input-path", inputFile);
    }

    if (outputType) {
      args.push("--output-type", outputType);
    }

    const proc = spawn("shortcuts", args, {
      timeout: 120000, // 2 minute timeout
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // If input is provided, write it to stdin
    if (input && !inputFile) {
      proc.stdin.write(input);
      proc.stdin.end();
    }

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout.trim() || "Shortcut completed successfully" });
      } else {
        resolve({
          success: false,
          error: stderr.trim() || `Shortcut exited with code ${code}`,
        });
      }
    });

    proc.on("error", (error) => {
      resolve({ success: false, error: error.message });
    });
  });
}

async function getShortcutDetails(name: string): Promise<{
  exists: boolean;
  name: string;
  error?: string;
}> {
  try {
    const shortcuts = await listShortcuts();
    const found = shortcuts.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );

    if (found) {
      return { exists: true, name: found.name };
    } else {
      return { exists: false, name, error: "Shortcut not found" };
    }
  } catch (error: any) {
    return { exists: false, name, error: error.message };
  }
}

async function searchShortcuts(query: string): Promise<Shortcut[]> {
  const shortcuts = await listShortcuts();
  const lowerQuery = query.toLowerCase();

  return shortcuts.filter((s) =>
    s.name.toLowerCase().includes(lowerQuery)
  );
}

// ============================================================================
// Tool Definitions
// ============================================================================

const tools: Tool[] = [
  {
    name: "shortcuts_list",
    description: "List all available shortcuts on this Mac.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "shortcuts_list_folders",
    description: "List all shortcut folders.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "shortcuts_search",
    description: "Search for shortcuts by name.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text to search for in shortcut names" },
      },
      required: ["query"],
    },
  },
  {
    name: "shortcuts_run",
    description:
      "Run a shortcut by name. Can optionally pass input text or a file path. This is a powerful tool that can trigger any automation the user has created.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the shortcut to run (exact match)" },
        input: { type: "string", description: "Text input to pass to the shortcut (optional)" },
        input_file: { type: "string", description: "Path to file to use as input (optional)" },
        output_type: {
          type: "string",
          description: "Output format: 'public.plain-text', 'public.html', 'public.json', etc. (optional)",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "shortcuts_exists",
    description: "Check if a shortcut exists by name.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the shortcut to check" },
      },
      required: ["name"],
    },
  },
];

// ============================================================================
// Tool Handler
// ============================================================================

async function handleToolCall(name: string, args: Record<string, any>): Promise<string> {
  switch (name) {
    case "shortcuts_list": {
      const shortcuts = await listShortcuts();
      return JSON.stringify(
        {
          count: shortcuts.length,
          shortcuts: shortcuts.map((s) => s.name),
        },
        null,
        2
      );
    }

    case "shortcuts_list_folders": {
      const folders = await listFolders();
      return JSON.stringify({ folders }, null, 2);
    }

    case "shortcuts_search": {
      if (!args.query) throw new Error("query is required");
      const shortcuts = await searchShortcuts(args.query);
      return JSON.stringify(
        {
          query: args.query,
          count: shortcuts.length,
          shortcuts: shortcuts.map((s) => s.name),
        },
        null,
        2
      );
    }

    case "shortcuts_run": {
      if (!args.name) throw new Error("name is required");
      const result = await runShortcut(args.name, {
        input: args.input,
        inputFile: args.input_file,
        outputType: args.output_type,
      });
      return JSON.stringify(result, null, 2);
    }

    case "shortcuts_exists": {
      if (!args.name) throw new Error("name is required");
      const result = await getShortcutDetails(args.name);
      return JSON.stringify(result, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ============================================================================
// Server Setup
// ============================================================================

async function main() {
  const server = new Server(
    { name: "shortcuts-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleToolCall(name, args || {});
      return { content: [{ type: "text", text: result }] };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Shortcuts MCP server v1.0.0 running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
