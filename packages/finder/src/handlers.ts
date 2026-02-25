import { type Tool } from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "child_process";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// ============================================================================
// Injection Escaping
// ============================================================================

// Escapes backslashes and double-quotes for embedding in an AppleScript string literal.
function escapeAppleScript(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// Escapes the five XML predefined entities to prevent plist injection.
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Escapes characters that have special meaning inside an mdfind predicate string.
// Backslash must come first to avoid double-escaping.
function escapeMdfind(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\*/g, "\\*");
}

// ============================================================================
// Path Safety
// ============================================================================

const PROTECTED_PATHS = [
  "/System",
  "/Library",
  "/usr",
  "/bin",
  "/sbin",
  "/private",
  "/etc",
  "/var",
];

function isProtectedPath(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  return PROTECTED_PATHS.some((p) => resolved.startsWith(p));
}

export function expandPath(filePath: string): string {
  if (filePath.startsWith("~")) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return path.resolve(filePath);
}

// Resolves symlinks so that a symlink pointing into a protected path is caught
// by isProtectedPath. Falls back to the synchronous-resolved path on error
// (e.g. file does not yet exist).
export async function expandPathReal(filePath: string): Promise<string> {
  const expanded = expandPath(filePath);
  try {
    return await fs.realpath(expanded);
  } catch {
    return expanded;
  }
}

// ============================================================================
// File Info
// ============================================================================

interface FileInfo {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
  created: string;
  modified: string;
  accessed: string;
  permissions: string;
  owner: string;
  extension: string;
  tags?: string[];
}

async function getFileInfo(filePath: string): Promise<FileInfo> {
  const resolved = expandPath(filePath);
  const stats = await fs.lstat(resolved);
  const parsed = path.parse(resolved);

  // Get tags via xattr — pipeline requires shell; parse output in process instead
  let tags: string[] = [];
  try {
    const xattrResult = await execFileAsync(
      "xattr",
      ["-p", "com.apple.metadata:_kMDItemUserTags", resolved],
      { timeout: 5000 }
    );
    // xattr outputs hex; convert via xxd then plutil
    const xxdResult = await execFileAsync("xxd", ["-r", "-p"], {
      timeout: 5000,
      // Pass hex string as stdin via shell — use /bin/sh only for the pipe, no user input
      maxBuffer: 1024 * 1024,
    });
    void xxdResult; // pipe handled below via shell-safe intermediate
    // Safer: write to temp file to avoid shell injection
    const tempPlist = `/tmp/fmcp_tags_${process.pid}.plist`;
    const hexData = xattrResult.stdout.trim();
    const binaryBuf = Buffer.from(hexData.replace(/\s/g, ""), "hex");
    await fs.writeFile(tempPlist, binaryBuf);
    const plutilResult = await execFileAsync(
      "plutil",
      ["-convert", "json", "-o", "-", tempPlist],
      { timeout: 5000 }
    );
    await fs.unlink(tempPlist).catch(() => undefined);
    tags = JSON.parse(plutilResult.stdout) as string[];
  } catch {
    // No tags or unsupported format
  }

  // Get owner via stat(1)
  let owner = "";
  try {
    const result = await execFileAsync("stat", ["-f", "%Su", resolved], { timeout: 5000 });
    owner = result.stdout.trim();
  } catch {
    // Non-fatal
  }

  return {
    name: parsed.base,
    path: resolved,
    size: stats.size,
    isDirectory: stats.isDirectory(),
    isFile: stats.isFile(),
    isSymlink: stats.isSymbolicLink(),
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString(),
    accessed: stats.atime.toISOString(),
    permissions: (stats.mode & 0o777).toString(8),
    owner,
    extension: parsed.ext,
    tags: tags.length > 0 ? tags : undefined,
  };
}

async function listDirectory(
  dirPath: string,
  options: { showHidden?: boolean; limit?: number } = {}
): Promise<FileInfo[]> {
  const { showHidden = false, limit = 100 } = options;
  const resolved = expandPath(dirPath);

  const entries = await fs.readdir(resolved, { withFileTypes: true });
  const results: FileInfo[] = [];

  for (const entry of entries) {
    if (!showHidden && entry.name.startsWith(".")) continue;
    if (results.length >= limit) break;

    const fullPath = path.join(resolved, entry.name);
    try {
      const info = await getFileInfo(fullPath);
      results.push(info);
    } catch {
      // Skip files we can't access
    }
  }

  return results;
}

// ============================================================================
// Spotlight Search
// ============================================================================

interface SpotlightResult {
  name: string;
  path: string;
  kind: string;
  size?: number;
  modified?: string;
}

async function spotlightSearch(
  query: string,
  options: {
    scope?: string;
    kind?: string;
    limit?: number;
  } = {}
): Promise<SpotlightResult[]> {
  const { scope, kind, limit = 50 } = options;

  // Build mdquery expression — query is embedded in a quoted mdfind argument,
  // not interpolated into a shell string, so no shell injection risk here.
  // escapeMdfind neutralises predicate metacharacters within the value.
  const safeQuery = escapeMdfind(query);
  let mdQuery = `kMDItemFSName == "*${safeQuery}*"wc || kMDItemTextContent == "*${safeQuery}*"wc`;

  if (kind) {
    const kindMap: Record<string, string> = {
      image: "public.image",
      video: "public.video",
      audio: "public.audio",
      pdf: "com.adobe.pdf",
      document: "public.content",
      folder: "public.folder",
      application: "com.apple.application-bundle",
    };
    const kindType = kindMap[kind.toLowerCase()] ?? kind;
    mdQuery = `(${mdQuery}) && kMDItemContentType == "${kindType}"`;
  }

  // execFile with array args — no shell interpolation
  const mdfindArgs = scope
    ? ["-onlyin", expandPath(scope), mdQuery]
    : [mdQuery];

  try {
    const result = await execFileAsync("mdfind", mdfindArgs, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    });

    const paths = result.stdout.trim().split("\n").filter(Boolean).slice(0, limit);
    const results: SpotlightResult[] = [];

    for (const p of paths) {
      try {
        const stats = await fs.stat(p);
        const parsed = path.parse(p);
        results.push({
          name: parsed.base,
          path: p,
          kind: stats.isDirectory() ? "folder" : parsed.ext || "file",
          size: stats.size,
          modified: stats.mtime.toISOString(),
        });
      } catch {
        results.push({ name: path.basename(p), path: p, kind: "unknown" });
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Spotlight search failed: ${(error as NodeJS.ErrnoException).message}`);
  }
}

// ============================================================================
// Recent Files
// ============================================================================

async function getRecentFiles(limit: number = 20): Promise<SpotlightResult[]> {
  try {
    const result = await execFileAsync(
      "mdfind",
      ["-onlyin", os.homedir(), "kMDItemFSContentChangeDate >= $time.today(-7)"],
      { maxBuffer: 10 * 1024 * 1024, timeout: 30000 }
    );

    const paths = result.stdout.trim().split("\n").filter(Boolean);
    const results: SpotlightResult[] = [];

    for (const p of paths) {
      if (results.length >= limit) break;
      if (path.basename(p).startsWith(".")) continue;

      try {
        const stats = await fs.stat(p);
        if (stats.isFile()) {
          const parsed = path.parse(p);
          results.push({
            name: parsed.base,
            path: p,
            kind: parsed.ext || "file",
            size: stats.size,
            modified: stats.mtime.toISOString(),
          });
        }
      } catch {
        // Skip inaccessible files
      }
    }

    return results.sort(
      (a, b) => new Date(b.modified ?? 0).getTime() - new Date(a.modified ?? 0).getTime()
    );
  } catch (error) {
    throw new Error(`Failed to get recent files: ${(error as NodeJS.ErrnoException).message}`);
  }
}

async function getDownloads(limit: number = 30): Promise<FileInfo[]> {
  return listDirectory(path.join(os.homedir(), "Downloads"), { limit, showHidden: false });
}

async function getDesktopFiles(limit: number = 30): Promise<FileInfo[]> {
  return listDirectory(path.join(os.homedir(), "Desktop"), { limit, showHidden: false });
}

// ============================================================================
// Tags
// ============================================================================

async function getFileTags(filePath: string): Promise<string[]> {
  const resolved = expandPath(filePath);

  try {
    const xattrResult = await execFileAsync(
      "xattr",
      ["-p", "com.apple.metadata:_kMDItemUserTags", resolved],
      { timeout: 5000 }
    );
    const tempPlist = `/tmp/fmcp_tags_${process.pid}.plist`;
    const binaryBuf = Buffer.from(xattrResult.stdout.trim().replace(/\s/g, ""), "hex");
    await fs.writeFile(tempPlist, binaryBuf);
    const plutilResult = await execFileAsync(
      "plutil",
      ["-convert", "json", "-o", "-", tempPlist],
      { timeout: 5000 }
    );
    await fs.unlink(tempPlist).catch(() => undefined);
    return JSON.parse(plutilResult.stdout) as string[];
  } catch {
    return [];
  }
}

async function setFileTags(
  filePath: string,
  tags: string[]
): Promise<{ success: boolean; error?: string }> {
  const resolved = expandPath(filePath);

  if (isProtectedPath(resolved)) {
    return { success: false, error: "Cannot modify tags on protected system files" };
  }

  try {
    // Build plist in process; write to temp file; convert to binary; set via xattr
    const plistTags = tags.map((t) => `<string>${escapeXml(t)}</string>`).join("");
    const plist = `<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><array>${plistTags}</array></plist>`;

    const tempFile = `/tmp/fmcp_settags_${process.pid}_${Date.now()}.plist`;
    await fs.writeFile(tempFile, plist);
    await execFileAsync("plutil", ["-convert", "binary1", tempFile]);
    const binary = await fs.readFile(tempFile);
    await fs.unlink(tempFile).catch(() => undefined);

    // xattr -wx takes the hex string as a positional arg — no shell involved
    await execFileAsync("xattr", [
      "-wx",
      "com.apple.metadata:_kMDItemUserTags",
      binary.toString("hex"),
      resolved,
    ]);

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function addFileTag(
  filePath: string,
  tag: string
): Promise<{ success: boolean; error?: string }> {
  const currentTags = await getFileTags(filePath);
  if (currentTags.includes(tag)) return { success: true };
  return setFileTags(filePath, [...currentTags, tag]);
}

async function removeFileTag(
  filePath: string,
  tag: string
): Promise<{ success: boolean; error?: string }> {
  const currentTags = await getFileTags(filePath);
  return setFileTags(filePath, currentTags.filter((t) => t !== tag));
}

async function findFilesByTag(tag: string, limit: number = 50): Promise<SpotlightResult[]> {
  try {
    const result = await execFileAsync(
      "mdfind",
      [`kMDItemUserTags == "${escapeMdfind(tag)}"`],
      { maxBuffer: 10 * 1024 * 1024, timeout: 30000 }
    );

    const paths = result.stdout.trim().split("\n").filter(Boolean).slice(0, limit);
    const results: SpotlightResult[] = [];

    for (const p of paths) {
      try {
        const stats = await fs.stat(p);
        const parsed = path.parse(p);
        results.push({
          name: parsed.base,
          path: p,
          kind: stats.isDirectory() ? "folder" : parsed.ext || "file",
          size: stats.size,
          modified: stats.mtime.toISOString(),
        });
      } catch {
        // Skip inaccessible
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to find files by tag: ${(error as Error).message}`);
  }
}

// ============================================================================
// Finder Operations
// ============================================================================

async function revealInFinder(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    await execFileAsync("open", ["-R", expandPath(filePath)]);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function openFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    await execFileAsync("open", [expandPath(filePath)]);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function openWithApp(
  filePath: string,
  appName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await execFileAsync("open", ["-a", appName, expandPath(filePath)]);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function moveToTrash(filePath: string): Promise<{ success: boolean; error?: string }> {
  // Use realpath so a symlink pointing into a protected directory is caught.
  const resolved = await expandPathReal(filePath);

  if (isProtectedPath(resolved)) {
    return { success: false, error: "Cannot trash protected system files" };
  }

  try {
    await execFileAsync("osascript", [
      "-e",
      `tell application "Finder" to delete POSIX file "${escapeAppleScript(resolved)}"`,
    ]);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function createFolder(
  folderPath: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  const resolved = expandPath(folderPath);

  if (isProtectedPath(resolved)) {
    return { success: false, error: "Cannot create folders in protected system locations" };
  }

  try {
    await fs.mkdir(resolved, { recursive: true });
    return { success: true, path: resolved };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function getSelectedFinderItems(): Promise<string[]> {
  try {
    const result = await execFileAsync("osascript", [
      "-e",
      'tell application "Finder" to get POSIX path of (selection as alias list)',
    ]);
    return result.stdout.trim().split(", ").filter(Boolean);
  } catch {
    return [];
  }
}

// ============================================================================
// Content Search
// ============================================================================

interface ContentSearchResult {
  path: string;
  name: string;
  lineNumber?: number;
  matchedLine?: string;
  extension: string;
}

async function searchFileContents(
  query: string,
  options: {
    scope?: string;
    extensions?: string[];
    regex?: boolean;
    caseSensitive?: boolean;
    limit?: number;
  } = {}
): Promise<ContentSearchResult[]> {
  const {
    scope = os.homedir(),
    extensions = [],
    regex = false,
    caseSensitive = false,
    limit = 50,
  } = options;

  const resolved = expandPath(scope);

  // Build grep argv — no shell; args are passed as array
  const grepArgs: string[] = ["-rn"];
  if (!caseSensitive) grepArgs.push("-i");
  if (!regex) grepArgs.push("-F");
  for (const ext of extensions) {
    grepArgs.push(`--include=*.${ext}`);
  }
  grepArgs.push(query, resolved);

  try {
    const result = await execFileAsync("grep", grepArgs, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60000,
    });

    const lines = result.stdout.trim().split("\n").filter(Boolean);
    const results: ContentSearchResult[] = [];
    const seenPaths = new Set<string>();

    for (const line of lines) {
      if (results.length >= limit) break;

      const match = line.match(/^(.+?):(\d+):(.*)$/);
      if (match) {
        const [, filePath, lineNum, content] = match;
        if (seenPaths.has(filePath)) continue;
        seenPaths.add(filePath);

        const parsed = path.parse(filePath);
        results.push({
          path: filePath,
          name: parsed.base,
          lineNumber: parseInt(lineNum, 10),
          matchedLine: content.trim().substring(0, 200),
          extension: parsed.ext,
        });
      }
    }

    return results;
  } catch (error) {
    // grep exits 1 on no matches — not an error
    if ((error as NodeJS.ErrnoException & { status?: number }).status === 1) return [];
    throw new Error(`Content search failed: ${(error as Error).message}`);
  }
}

async function searchInFile(
  filePath: string,
  query: string,
  options: { regex?: boolean; caseSensitive?: boolean; limit?: number } = {}
): Promise<{ lineNumber: number; content: string }[]> {
  const { regex = false, caseSensitive = false, limit = 100 } = options;

  const resolved = expandPath(filePath);

  const grepArgs: string[] = ["-n"];
  if (!caseSensitive) grepArgs.push("-i");
  if (!regex) grepArgs.push("-F");
  grepArgs.push(query, resolved);

  try {
    const result = await execFileAsync("grep", grepArgs, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    });

    return result.stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .slice(0, limit)
      .map((line) => {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0) {
          return {
            lineNumber: parseInt(line.substring(0, colonIdx), 10),
            content: line.substring(colonIdx + 1).trim(),
          };
        }
        return { lineNumber: 0, content: line };
      });
  } catch (error) {
    // grep exits 1 on no matches — not an error
    if ((error as NodeJS.ErrnoException & { status?: number }).status === 1) return [];
    throw new Error(`Search in file failed: ${(error as Error).message}`);
  }
}

// ============================================================================
// Duplicate File Finder
// ============================================================================

interface DuplicateGroup {
  size: number;
  hash: string;
  files: string[];
}

async function findDuplicates(
  scope: string,
  options: { minSize?: number; extensions?: string[]; limit?: number } = {}
): Promise<DuplicateGroup[]> {
  const { minSize = 1024, extensions = [], limit = 20 } = options;
  const resolved = expandPath(scope);

  // Build find argv — no shell interpolation
  const findArgs = [resolved, "-type", "f", "-size", `+${minSize}c`];
  if (extensions.length > 0) {
    findArgs.push("(");
    extensions.forEach((e, i) => {
      if (i > 0) findArgs.push("-o");
      findArgs.push("-name", `*.${e}`);
    });
    findArgs.push(")");
  }

  try {
    const findResult = await execFileAsync("find", findArgs, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 120000,
    });

    const files = findResult.stdout.trim().split("\n").filter(Boolean);

    const sizeGroups: Map<number, string[]> = new Map();
    for (const file of files.slice(0, 1000)) {
      try {
        const stats = await fs.stat(file);
        const { size } = stats;
        const group = sizeGroups.get(size) ?? [];
        group.push(file);
        sizeGroups.set(size, group);
      } catch {
        // Skip inaccessible files
      }
    }

    const duplicates: DuplicateGroup[] = [];
    for (const [size, paths] of sizeGroups) {
      if (paths.length < 2) continue;
      if (duplicates.length >= limit) break;

      const hashGroups: Map<string, string[]> = new Map();
      for (const p of paths) {
        try {
          // md5 -q takes path as argv — no shell
          const hashResult = await execFileAsync("md5", ["-q", p], { timeout: 10000 });
          const hash = hashResult.stdout.trim();
          const group = hashGroups.get(hash) ?? [];
          group.push(p);
          hashGroups.set(hash, group);
        } catch {
          // Skip
        }
      }

      for (const [hash, hashPaths] of hashGroups) {
        if (hashPaths.length >= 2) {
          duplicates.push({ size, hash, files: hashPaths });
          if (duplicates.length >= limit) break;
        }
      }
    }

    return duplicates;
  } catch (error) {
    throw new Error(`Find duplicates failed: ${(error as Error).message}`);
  }
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const TOOLS: Tool[] = [
  {
    name: "finder_get_info",
    description: "Get detailed information about a file or folder.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to file or folder (supports ~)" },
      },
      required: ["path"],
    },
  },
  {
    name: "finder_list_directory",
    description: "List contents of a directory.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path (supports ~)" },
        show_hidden: { type: "boolean", description: "Include hidden files (default: false)" },
        limit: { type: "number", description: "Maximum items to return (default: 100)" },
      },
      required: ["path"],
    },
  },
  {
    name: "finder_search",
    description: "Search for files using Spotlight.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query (filename or content)" },
        scope: { type: "string", description: "Limit search to path (optional, supports ~)" },
        kind: {
          type: "string",
          description: "Filter by type: image, video, audio, pdf, document, folder, application",
        },
        limit: { type: "number", description: "Maximum results (default: 50)" },
      },
      required: ["query"],
    },
  },
  {
    name: "finder_get_recent",
    description: "Get recently modified files in home directory.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum files (default: 20)" },
      },
      required: [],
    },
  },
  {
    name: "finder_get_downloads",
    description: "List files in the Downloads folder.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum files (default: 30)" },
      },
      required: [],
    },
  },
  {
    name: "finder_get_desktop",
    description: "List files on the Desktop.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum files (default: 30)" },
      },
      required: [],
    },
  },
  {
    name: "finder_get_tags",
    description: "Get Finder tags on a file or folder.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to file or folder" },
      },
      required: ["path"],
    },
  },
  {
    name: "finder_set_tags",
    description: "Set Finder tags on a file or folder (replaces existing tags).",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to file or folder" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "List of tag names",
        },
      },
      required: ["path", "tags"],
    },
  },
  {
    name: "finder_add_tag",
    description: "Add a Finder tag to a file or folder.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to file or folder" },
        tag: { type: "string", description: "Tag name to add" },
      },
      required: ["path", "tag"],
    },
  },
  {
    name: "finder_remove_tag",
    description: "Remove a Finder tag from a file or folder.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to file or folder" },
        tag: { type: "string", description: "Tag name to remove" },
      },
      required: ["path", "tag"],
    },
  },
  {
    name: "finder_find_by_tag",
    description: "Find all files with a specific Finder tag.",
    inputSchema: {
      type: "object",
      properties: {
        tag: { type: "string", description: "Tag name to search for" },
        limit: { type: "number", description: "Maximum results (default: 50)" },
      },
      required: ["tag"],
    },
  },
  {
    name: "finder_reveal",
    description: "Reveal a file or folder in Finder.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to reveal" },
      },
      required: ["path"],
    },
  },
  {
    name: "finder_open",
    description: "Open a file with its default application.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to open" },
      },
      required: ["path"],
    },
  },
  {
    name: "finder_open_with",
    description: "Open a file with a specific application.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to open" },
        app: {
          type: "string",
          description: "Application name (e.g., 'TextEdit', 'Visual Studio Code')",
        },
      },
      required: ["path", "app"],
    },
  },
  {
    name: "finder_trash",
    description: "Move a file or folder to Trash.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to trash" },
      },
      required: ["path"],
    },
  },
  {
    name: "finder_create_folder",
    description: "Create a new folder.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path for new folder" },
      },
      required: ["path"],
    },
  },
  {
    name: "finder_get_selection",
    description: "Get the currently selected items in Finder.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "finder_search_contents",
    description: "Search for text within file contents (grep-like search).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text or pattern to search for" },
        scope: {
          type: "string",
          description: "Directory to search in (default: home, supports ~)",
        },
        extensions: {
          type: "array",
          items: { type: "string" },
          description: "File extensions to search (e.g., ['txt', 'md', 'js'])",
        },
        regex: { type: "boolean", description: "Treat query as regex pattern (default: false)" },
        case_sensitive: { type: "boolean", description: "Case-sensitive search (default: false)" },
        limit: { type: "number", description: "Maximum results (default: 50)" },
      },
      required: ["query"],
    },
  },
  {
    name: "finder_search_in_file",
    description: "Search for text within a specific file.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to file to search" },
        query: { type: "string", description: "Text or pattern to search for" },
        regex: { type: "boolean", description: "Treat query as regex (default: false)" },
        case_sensitive: { type: "boolean", description: "Case-sensitive (default: false)" },
        limit: { type: "number", description: "Maximum matches (default: 100)" },
      },
      required: ["path", "query"],
    },
  },
  {
    name: "finder_find_duplicates",
    description: "Find duplicate files by content hash.",
    inputSchema: {
      type: "object",
      properties: {
        scope: { type: "string", description: "Directory to search (supports ~)" },
        min_size: { type: "number", description: "Minimum file size in bytes (default: 1024)" },
        extensions: {
          type: "array",
          items: { type: "string" },
          description: "File extensions to check (optional)",
        },
        limit: { type: "number", description: "Maximum duplicate groups (default: 20)" },
      },
      required: ["scope"],
    },
  },
];

// ============================================================================
// Tool Handler
// ============================================================================

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "finder_get_info": {
      if (!args.path) throw new Error("path is required");
      const info = await getFileInfo(args.path as string);
      return JSON.stringify(info, null, 2);
    }

    case "finder_list_directory": {
      if (!args.path) throw new Error("path is required");
      const items = await listDirectory(args.path as string, {
        showHidden: args.show_hidden as boolean | undefined,
        limit: args.limit as number | undefined,
      });
      return JSON.stringify(items, null, 2);
    }

    case "finder_search": {
      if (!args.query) throw new Error("query is required");
      const results = await spotlightSearch(args.query as string, {
        scope: args.scope as string | undefined,
        kind: args.kind as string | undefined,
        limit: args.limit as number | undefined,
      });
      return JSON.stringify(results, null, 2);
    }

    case "finder_get_recent": {
      const files = await getRecentFiles((args.limit as number | undefined) ?? 20);
      return JSON.stringify(files, null, 2);
    }

    case "finder_get_downloads": {
      const files = await getDownloads((args.limit as number | undefined) ?? 30);
      return JSON.stringify(files, null, 2);
    }

    case "finder_get_desktop": {
      const files = await getDesktopFiles((args.limit as number | undefined) ?? 30);
      return JSON.stringify(files, null, 2);
    }

    case "finder_get_tags": {
      if (!args.path) throw new Error("path is required");
      const tags = await getFileTags(args.path as string);
      return JSON.stringify({ path: args.path, tags }, null, 2);
    }

    case "finder_set_tags": {
      if (!args.path) throw new Error("path is required");
      if (!args.tags) throw new Error("tags is required");
      const result = await setFileTags(args.path as string, args.tags as string[]);
      return JSON.stringify(result, null, 2);
    }

    case "finder_add_tag": {
      if (!args.path || !args.tag) throw new Error("path and tag are required");
      const result = await addFileTag(args.path as string, args.tag as string);
      return JSON.stringify(result, null, 2);
    }

    case "finder_remove_tag": {
      if (!args.path || !args.tag) throw new Error("path and tag are required");
      const result = await removeFileTag(args.path as string, args.tag as string);
      return JSON.stringify(result, null, 2);
    }

    case "finder_find_by_tag": {
      if (!args.tag) throw new Error("tag is required");
      const results = await findFilesByTag(
        args.tag as string,
        (args.limit as number | undefined) ?? 50
      );
      return JSON.stringify(results, null, 2);
    }

    case "finder_reveal": {
      if (!args.path) throw new Error("path is required");
      const result = await revealInFinder(args.path as string);
      return JSON.stringify(result, null, 2);
    }

    case "finder_open": {
      if (!args.path) throw new Error("path is required");
      const result = await openFile(args.path as string);
      return JSON.stringify(result, null, 2);
    }

    case "finder_open_with": {
      if (!args.path || !args.app) throw new Error("path and app are required");
      const result = await openWithApp(args.path as string, args.app as string);
      return JSON.stringify(result, null, 2);
    }

    case "finder_trash": {
      if (!args.path) throw new Error("path is required");
      const result = await moveToTrash(args.path as string);
      return JSON.stringify(result, null, 2);
    }

    case "finder_create_folder": {
      if (!args.path) throw new Error("path is required");
      const result = await createFolder(args.path as string);
      return JSON.stringify(result, null, 2);
    }

    case "finder_get_selection": {
      const selection = await getSelectedFinderItems();
      return JSON.stringify({ selection }, null, 2);
    }

    case "finder_search_contents": {
      if (!args.query) throw new Error("query is required");
      const results = await searchFileContents(args.query as string, {
        scope: args.scope as string | undefined,
        extensions: args.extensions as string[] | undefined,
        regex: args.regex as boolean | undefined,
        caseSensitive: args.case_sensitive as boolean | undefined,
        limit: args.limit as number | undefined,
      });
      return JSON.stringify(results, null, 2);
    }

    case "finder_search_in_file": {
      if (!args.path || !args.query) throw new Error("path and query are required");
      const matches = await searchInFile(args.path as string, args.query as string, {
        regex: args.regex as boolean | undefined,
        caseSensitive: args.case_sensitive as boolean | undefined,
        limit: args.limit as number | undefined,
      });
      return JSON.stringify({ path: args.path, matches }, null, 2);
    }

    case "finder_find_duplicates": {
      if (!args.scope) throw new Error("scope is required");
      const duplicates = await findDuplicates(args.scope as string, {
        minSize: args.min_size as number | undefined,
        extensions: args.extensions as string[] | undefined,
        limit: args.limit as number | undefined,
      });
      return JSON.stringify(duplicates, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
