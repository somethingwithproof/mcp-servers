import { describe, expect, it } from "vitest";
import { TOOLS, handleToolCall } from "../handlers.js";

describe("tool registry", () => {
  it("exports a non-empty tools array", () => {
    expect(TOOLS.length).toBeGreaterThan(0);
  });

  it("every tool has a name, description, and inputSchema", () => {
    for (const tool of TOOLS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("tool names are unique", () => {
    const names = TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("all tool names follow finder_* convention", () => {
    for (const tool of TOOLS) {
      expect(tool.name).toMatch(/^finder_/);
    }
  });
});

describe("handleToolCall input validation", () => {
  it("throws on unknown tool", async () => {
    await expect(handleToolCall("not_a_tool", {})).rejects.toThrow("Unknown tool");
  });

  it("throws when finder_get_info missing path", async () => {
    await expect(handleToolCall("finder_get_info", {})).rejects.toThrow("path is required");
  });

  it("throws when finder_list_directory missing path", async () => {
    await expect(handleToolCall("finder_list_directory", {})).rejects.toThrow("path is required");
  });

  it("throws when finder_search missing query", async () => {
    await expect(handleToolCall("finder_search", {})).rejects.toThrow("query is required");
  });

  it("throws when finder_get_tags missing path", async () => {
    await expect(handleToolCall("finder_get_tags", {})).rejects.toThrow("path is required");
  });

  it("throws when finder_set_tags missing tags", async () => {
    await expect(handleToolCall("finder_set_tags", { path: "/tmp" })).rejects.toThrow(
      "tags is required"
    );
  });

  it("throws when finder_add_tag missing tag", async () => {
    await expect(handleToolCall("finder_add_tag", { path: "/tmp" })).rejects.toThrow(
      "path and tag are required"
    );
  });

  it("throws when finder_find_by_tag missing tag", async () => {
    await expect(handleToolCall("finder_find_by_tag", {})).rejects.toThrow("tag is required");
  });

  it("throws when finder_reveal missing path", async () => {
    await expect(handleToolCall("finder_reveal", {})).rejects.toThrow("path is required");
  });

  it("throws when finder_open missing path", async () => {
    await expect(handleToolCall("finder_open", {})).rejects.toThrow("path is required");
  });

  it("throws when finder_open_with missing app", async () => {
    await expect(handleToolCall("finder_open_with", { path: "/tmp" })).rejects.toThrow(
      "path and app are required"
    );
  });

  it("throws when finder_trash missing path", async () => {
    await expect(handleToolCall("finder_trash", {})).rejects.toThrow("path is required");
  });

  it("throws when finder_create_folder missing path", async () => {
    await expect(handleToolCall("finder_create_folder", {})).rejects.toThrow("path is required");
  });

  it("throws when finder_search_contents missing query", async () => {
    await expect(handleToolCall("finder_search_contents", {})).rejects.toThrow("query is required");
  });

  it("throws when finder_search_in_file missing query", async () => {
    await expect(handleToolCall("finder_search_in_file", { path: "/tmp/x" })).rejects.toThrow(
      "path and query are required"
    );
  });

  it("throws when finder_find_duplicates missing scope", async () => {
    await expect(handleToolCall("finder_find_duplicates", {})).rejects.toThrow("scope is required");
  });
});

describe("path safety", () => {
  it("rejects path traversal in expandPath", async () => {
    // Handler returns a structured error rather than throwing — shell
    // metacharacters in the path trigger the protected-path guard.
    const result = await handleToolCall("finder_set_tags", { path: "; rm -rf /", tags: [] });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toBeDefined();
  });
});
