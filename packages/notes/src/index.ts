#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ============================================================================
// AppleScript Helpers
// ============================================================================

async function runAppleScript(script: string): Promise<string> {
  try {
    const escaped = script.replace(/'/g, "'\\''");
    const result = await execAsync(`osascript -e '${escaped}'`, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 60000,
    });
    return result.stdout.trim();
  } catch (error: any) {
    if (error.message?.includes("Not authorized")) {
      throw new Error(
        "Notes access denied. Grant permission in System Settings > Privacy & Security > Automation"
      );
    }
    throw error;
  }
}

async function runAppleScriptJSON<T>(script: string): Promise<T> {
  const result = await runAppleScript(script);
  if (!result) return [] as unknown as T;
  try {
    return JSON.parse(result);
  } catch {
    return result as unknown as T;
  }
}

// ============================================================================
// Permission Checking
// ============================================================================

interface PermissionStatus {
  notes: boolean;
  details: string[];
}

async function checkPermissions(): Promise<PermissionStatus> {
  const status: PermissionStatus = {
    notes: false,
    details: [],
  };

  try {
    await runAppleScript('tell application "Notes" to count of folders');
    status.notes = true;
    status.details.push("Notes: accessible");
  } catch {
    status.details.push("Notes: NOT accessible (grant Automation permission in System Settings)");
  }

  return status;
}

// ============================================================================
// Folders (Accounts and Folders)
// ============================================================================

interface NotesFolder {
  id: string;
  name: string;
  account: string;
  noteCount: number;
}

async function getFolders(): Promise<NotesFolder[]> {
  const script = `
    tell application "Notes"
      set output to "["
      set isFirst to true
      repeat with acc in accounts
        set accName to name of acc
        repeat with f in folders of acc
          set fId to id of f
          set fName to name of f
          set noteCount to count of notes in f

          set fName to my replaceText(fName, "\\\\", "\\\\\\\\")
          set fName to my replaceText(fName, "\\"", "\\\\\\"")
          set accName to my replaceText(accName, "\\\\", "\\\\\\\\")
          set accName to my replaceText(accName, "\\"", "\\\\\\"")

          if not isFirst then set output to output & ","
          set isFirst to false
          set output to output & "{\\"id\\":\\"" & fId & "\\",\\"name\\":\\"" & fName & "\\",\\"account\\":\\"" & accName & "\\",\\"noteCount\\":" & noteCount & "}"
        end repeat
      end repeat
      set output to output & "]"
      return output
    end tell

    on replaceText(theText, searchStr, replaceStr)
      set AppleScript's text item delimiters to searchStr
      set theItems to text items of theText
      set AppleScript's text item delimiters to replaceStr
      set theText to theItems as text
      set AppleScript's text item delimiters to ""
      return theText
    end replaceText
  `;

  return runAppleScriptJSON<NotesFolder[]>(script);
}

async function getAccounts(): Promise<string[]> {
  const script = `
    tell application "Notes"
      set output to "["
      set accs to accounts
      repeat with i from 1 to count of accs
        set accName to name of item i of accs
        set accName to my replaceText(accName, "\\\\", "\\\\\\\\")
        set accName to my replaceText(accName, "\\"", "\\\\\\"")
        if i > 1 then set output to output & ","
        set output to output & "\\"" & accName & "\\""
      end repeat
      set output to output & "]"
      return output
    end tell

    on replaceText(theText, searchStr, replaceStr)
      set AppleScript's text item delimiters to searchStr
      set theItems to text items of theText
      set AppleScript's text item delimiters to replaceStr
      set theText to theItems as text
      set AppleScript's text item delimiters to ""
      return theText
    end replaceText
  `;

  return runAppleScriptJSON<string[]>(script);
}

// ============================================================================
// Notes CRUD
// ============================================================================

interface Note {
  id: string;
  name: string;
  body: string;
  plaintext: string;
  folder: string;
  account: string;
  creationDate: string;
  modificationDate: string;
}

async function getNotes(options: {
  folder?: string;
  account?: string;
  limit?: number;
} = {}): Promise<Note[]> {
  const { folder, account, limit = 50 } = options;

  let targetFolder = "default folder";
  if (folder && account) {
    targetFolder = `folder "${folder.replace(/"/g, '\\"')}" of account "${account.replace(/"/g, '\\"')}"`;
  } else if (folder) {
    targetFolder = `folder "${folder.replace(/"/g, '\\"')}"`;
  }

  const script = `
    tell application "Notes"
      set output to "["
      set matchCount to 0
      set allNotes to notes of ${targetFolder}
      repeat with n in allNotes
        if matchCount < ${limit} then
          set nId to id of n
          set nName to name of n
          set nBody to body of n
          set nPlain to plaintext of n
          set nFolder to name of container of n
          set nAccount to name of account of container of n
          set nCreation to creation date of n
          set nMod to modification date of n

          set nName to my replaceText(nName, "\\\\", "\\\\\\\\")
          set nName to my replaceText(nName, "\\"", "\\\\\\"")
          set nName to my replaceText(nName, return, "\\\\n")
          set nName to my replaceText(nName, tab, "\\\\t")
          set nPlain to my replaceText(nPlain, "\\\\", "\\\\\\\\")
          set nPlain to my replaceText(nPlain, "\\"", "\\\\\\"")
          set nPlain to my replaceText(nPlain, return, "\\\\n")
          set nPlain to my replaceText(nPlain, tab, "\\\\t")
          set nFolder to my replaceText(nFolder, "\\\\", "\\\\\\\\")
          set nFolder to my replaceText(nFolder, "\\"", "\\\\\\"")
          set nAccount to my replaceText(nAccount, "\\\\", "\\\\\\\\")
          set nAccount to my replaceText(nAccount, "\\"", "\\\\\\"")

          if matchCount > 0 then set output to output & ","
          set output to output & "{\\"id\\":\\"" & nId & "\\","
          set output to output & "\\"name\\":\\"" & nName & "\\","
          set output to output & "\\"plaintext\\":\\"" & nPlain & "\\","
          set output to output & "\\"folder\\":\\"" & nFolder & "\\","
          set output to output & "\\"account\\":\\"" & nAccount & "\\","
          set output to output & "\\"creationDate\\":\\"" & (nCreation as «class isot» as string) & "\\","
          set output to output & "\\"modificationDate\\":\\"" & (nMod as «class isot» as string) & "\\"}"
          set matchCount to matchCount + 1
        end if
      end repeat
      set output to output & "]"
      return output
    end tell

    on replaceText(theText, searchStr, replaceStr)
      set AppleScript's text item delimiters to searchStr
      set theItems to text items of theText
      set AppleScript's text item delimiters to replaceStr
      set theText to theItems as text
      set AppleScript's text item delimiters to ""
      return theText
    end replaceText
  `;

  return runAppleScriptJSON<Note[]>(script);
}

async function getNote(noteId: string): Promise<Note | null> {
  const script = `
    tell application "Notes"
      try
        set n to note id "${noteId.replace(/"/g, '\\"')}"
        set nId to id of n
        set nName to name of n
        set nBody to body of n
        set nPlain to plaintext of n
        set nFolder to name of container of n
        set nAccount to name of account of container of n
        set nCreation to creation date of n
        set nMod to modification date of n

        set nName to my replaceText(nName, "\\\\", "\\\\\\\\")
        set nName to my replaceText(nName, "\\"", "\\\\\\"")
        set nName to my replaceText(nName, return, "\\\\n")
        set nPlain to my replaceText(nPlain, "\\\\", "\\\\\\\\")
        set nPlain to my replaceText(nPlain, "\\"", "\\\\\\"")
        set nPlain to my replaceText(nPlain, return, "\\\\n")
        set nBody to my replaceText(nBody, "\\\\", "\\\\\\\\")
        set nBody to my replaceText(nBody, "\\"", "\\\\\\"")
        set nBody to my replaceText(nBody, return, "\\\\n")
        set nFolder to my replaceText(nFolder, "\\\\", "\\\\\\\\")
        set nFolder to my replaceText(nFolder, "\\"", "\\\\\\"")
        set nAccount to my replaceText(nAccount, "\\\\", "\\\\\\\\")
        set nAccount to my replaceText(nAccount, "\\"", "\\\\\\"")

        return "{\\"id\\":\\"" & nId & "\\",\\"name\\":\\"" & nName & "\\",\\"body\\":\\"" & nBody & "\\",\\"plaintext\\":\\"" & nPlain & "\\",\\"folder\\":\\"" & nFolder & "\\",\\"account\\":\\"" & nAccount & "\\",\\"creationDate\\":\\"" & (nCreation as «class isot» as string) & "\\",\\"modificationDate\\":\\"" & (nMod as «class isot» as string) & "\\"}"
      on error
        return "null"
      end try
    end tell

    on replaceText(theText, searchStr, replaceStr)
      set AppleScript's text item delimiters to searchStr
      set theItems to text items of theText
      set AppleScript's text item delimiters to replaceStr
      set theText to theItems as text
      set AppleScript's text item delimiters to ""
      return theText
    end replaceText
  `;

  const result = await runAppleScript(script);
  if (result === "null") return null;
  try {
    return JSON.parse(result);
  } catch {
    return null;
  }
}

async function createNote(options: {
  name: string;
  body: string;
  folder?: string;
  account?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const { name, body, folder, account } = options;

  const escapedName = name.replace(/"/g, '\\"');
  const escapedBody = body.replace(/"/g, '\\"').replace(/\n/g, "<br>");

  let targetFolder = "default folder";
  if (folder && account) {
    targetFolder = `folder "${folder.replace(/"/g, '\\"')}" of account "${account.replace(/"/g, '\\"')}"`;
  } else if (folder) {
    targetFolder = `folder "${folder.replace(/"/g, '\\"')}"`;
  }

  const script = `
    tell application "Notes"
      set newNote to make new note at ${targetFolder} with properties {name:"${escapedName}", body:"<h1>${escapedName}</h1><br>${escapedBody}"}
      return id of newNote
    end tell
  `;

  try {
    const id = await runAppleScript(script);
    return { success: true, id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function updateNote(
  noteId: string,
  updates: { name?: string; body?: string }
): Promise<{ success: boolean; error?: string }> {
  const { name, body } = updates;

  let updateLines: string[] = [];

  if (name !== undefined) {
    updateLines.push(`set name of theNote to "${name.replace(/"/g, '\\"')}"`);
  }
  if (body !== undefined) {
    const escapedBody = body.replace(/"/g, '\\"').replace(/\n/g, "<br>");
    updateLines.push(`set body of theNote to "${escapedBody}"`);
  }

  if (updateLines.length === 0) {
    return { success: false, error: "No updates provided" };
  }

  const script = `
    tell application "Notes"
      set theNote to note id "${noteId.replace(/"/g, '\\"')}"
      ${updateLines.join("\n      ")}
      return "done"
    end tell
  `;

  try {
    await runAppleScript(script);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function deleteNote(noteId: string): Promise<{ success: boolean; error?: string }> {
  const script = `
    tell application "Notes"
      delete note id "${noteId.replace(/"/g, '\\"')}"
      return "done"
    end tell
  `;

  try {
    await runAppleScript(script);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function appendToNote(
  noteId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const escapedContent = content.replace(/"/g, '\\"').replace(/\n/g, "<br>");

  const script = `
    tell application "Notes"
      set theNote to note id "${noteId.replace(/"/g, '\\"')}"
      set currentBody to body of theNote
      set body of theNote to currentBody & "<br>${escapedContent}"
      return "done"
    end tell
  `;

  try {
    await runAppleScript(script);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// Search
// ============================================================================

async function searchNotes(
  query: string,
  options: { folder?: string; account?: string; limit?: number } = {}
): Promise<Note[]> {
  const { folder, account, limit = 50 } = options;
  const escapedQuery = query.toLowerCase().replace(/"/g, '\\"');

  const script = `
    tell application "Notes"
      set output to "["
      set searchQuery to "${escapedQuery}"
      set matchCount to 0

      repeat with acc in accounts
        ${account ? `if name of acc is "${account.replace(/"/g, '\\"')}" then` : ""}
        repeat with f in folders of acc
          ${folder ? `if name of f is "${folder.replace(/"/g, '\\"')}" then` : ""}
          repeat with n in notes of f
            if matchCount < ${limit} then
              set nName to name of n
              set nPlain to plaintext of n
              set lowerName to my toLowerCase(nName)
              set lowerPlain to my toLowerCase(nPlain)

              if lowerName contains searchQuery or lowerPlain contains searchQuery then
                set nId to id of n
                set nFolder to name of container of n
                set nAccount to name of account of container of n
                set nCreation to creation date of n
                set nMod to modification date of n

                set nName to my replaceText(nName, "\\\\", "\\\\\\\\")
                set nName to my replaceText(nName, "\\"", "\\\\\\"")
                set nName to my replaceText(nName, return, "\\\\n")
                set nPlain to my replaceText(nPlain, "\\\\", "\\\\\\\\")
                set nPlain to my replaceText(nPlain, "\\"", "\\\\\\"")
                set nPlain to my replaceText(nPlain, return, "\\\\n")
                set nFolder to my replaceText(nFolder, "\\\\", "\\\\\\\\")
                set nFolder to my replaceText(nFolder, "\\"", "\\\\\\"")
                set nAccount to my replaceText(nAccount, "\\\\", "\\\\\\\\")
                set nAccount to my replaceText(nAccount, "\\"", "\\\\\\"")

                if matchCount > 0 then set output to output & ","
                set output to output & "{\\"id\\":\\"" & nId & "\\","
                set output to output & "\\"name\\":\\"" & nName & "\\","
                set output to output & "\\"plaintext\\":\\"" & nPlain & "\\","
                set output to output & "\\"folder\\":\\"" & nFolder & "\\","
                set output to output & "\\"account\\":\\"" & nAccount & "\\","
                set output to output & "\\"creationDate\\":\\"" & (nCreation as «class isot» as string) & "\\","
                set output to output & "\\"modificationDate\\":\\"" & (nMod as «class isot» as string) & "\\"}"
                set matchCount to matchCount + 1
              end if
            end if
          end repeat
          ${folder ? "end if" : ""}
        end repeat
        ${account ? "end if" : ""}
      end repeat
      set output to output & "]"
      return output
    end tell

    on toLowerCase(theText)
      set lowercaseChars to "abcdefghijklmnopqrstuvwxyz"
      set uppercaseChars to "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      set resultText to ""
      repeat with c in theText
        set charOffset to offset of c in uppercaseChars
        if charOffset > 0 then
          set resultText to resultText & character charOffset of lowercaseChars
        else
          set resultText to resultText & c
        end if
      end repeat
      return resultText
    end toLowerCase

    on replaceText(theText, searchStr, replaceStr)
      set AppleScript's text item delimiters to searchStr
      set theItems to text items of theText
      set AppleScript's text item delimiters to replaceStr
      set theText to theItems as text
      set AppleScript's text item delimiters to ""
      return theText
    end replaceText
  `;

  return runAppleScriptJSON<Note[]>(script);
}

// ============================================================================
// Folder Management
// ============================================================================

async function createFolder(name: string, account?: string): Promise<{ success: boolean; error?: string }> {
  const escapedName = name.replace(/"/g, '\\"');
  const accountTarget = account
    ? `account "${account.replace(/"/g, '\\"')}"`
    : "default account";

  const script = `
    tell application "Notes"
      make new folder at ${accountTarget} with properties {name:"${escapedName}"}
      return "done"
    end tell
  `;

  try {
    await runAppleScript(script);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// Open in Notes App
// ============================================================================

async function openNotes(): Promise<{ success: boolean; error?: string }> {
  const script = `
    tell application "Notes"
      activate
    end tell
  `;

  try {
    await runAppleScript(script);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function openNote(noteId: string): Promise<{ success: boolean; error?: string }> {
  const script = `
    tell application "Notes"
      set theNote to note id "${noteId.replace(/"/g, '\\"')}"
      show theNote
      activate
    end tell
  `;

  try {
    await runAppleScript(script);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function openFolder(folderName: string, account?: string): Promise<{ success: boolean; error?: string }> {
  const accountTarget = account
    ? `account "${account.replace(/"/g, '\\"')}"`
    : "first account";

  const script = `
    tell application "Notes"
      set theFolder to folder "${folderName.replace(/"/g, '\\"')}" of ${accountTarget}
      show theFolder
      activate
    end tell
  `;

  try {
    await runAppleScript(script);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// Advanced Search with Relevance
// ============================================================================

interface SearchResult extends Note {
  relevanceScore: number;
  matchedIn: string[];
}

async function searchNotesAdvanced(
  query: string,
  options: { folder?: string; account?: string; limit?: number } = {}
): Promise<SearchResult[]> {
  const { folder, account, limit = 50 } = options;

  // Get all matching notes using keyword search
  const notes = await searchNotes(query, { folder, account, limit: limit * 2 });

  // Calculate relevance scores
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

  const results: SearchResult[] = notes.map(note => {
    const name = note.name.toLowerCase();
    const content = note.plaintext.toLowerCase();
    let score = 0;
    const matchedIn: string[] = [];

    for (const term of queryTerms) {
      // Title matches are worth more
      const titleMatches = (name.match(new RegExp(term, 'gi')) || []).length;
      if (titleMatches > 0) {
        score += titleMatches * 3;
        if (!matchedIn.includes('title')) matchedIn.push('title');
      }

      // Content matches
      const contentMatches = (content.match(new RegExp(term, 'gi')) || []).length;
      if (contentMatches > 0) {
        score += contentMatches;
        if (!matchedIn.includes('content')) matchedIn.push('content');
      }

      // Exact phrase bonus
      if (name.includes(query.toLowerCase())) {
        score += 10;
      }
      if (content.includes(query.toLowerCase())) {
        score += 5;
      }
    }

    // Recency bonus (notes modified in last 7 days get a boost)
    const modDate = new Date(note.modificationDate);
    const daysSinceModified = (Date.now() - modDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceModified < 7) {
      score += Math.max(0, (7 - daysSinceModified) / 7) * 2;
    }

    return {
      ...note,
      relevanceScore: Math.round(score * 100) / 100,
      matchedIn,
    };
  });

  // Sort by relevance and return top results
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

// ============================================================================
// Recent Notes (with better performance)
// ============================================================================

async function getRecentNotes(limit: number = 20): Promise<Note[]> {
  const script = `
    tell application "Notes"
      set output to "["
      set matchCount to 0
      set allNotes to {}

      repeat with acc in accounts
        repeat with f in folders of acc
          repeat with n in notes of f
            set end of allNotes to n
          end repeat
        end repeat
      end repeat

      -- Sort by modification date (most recent first)
      set sortedNotes to my sortByModDate(allNotes)

      repeat with n in sortedNotes
        if matchCount < ${limit} then
          set nId to id of n
          set nName to name of n
          set nPlain to plaintext of n
          set nFolder to name of container of n
          set nAccount to name of account of container of n
          set nCreation to creation date of n
          set nMod to modification date of n

          set nName to my replaceText(nName, "\\\\", "\\\\\\\\")
          set nName to my replaceText(nName, "\\"", "\\\\\\"")
          set nName to my replaceText(nName, return, "\\\\n")
          set nPlain to my replaceText(nPlain, "\\\\", "\\\\\\\\")
          set nPlain to my replaceText(nPlain, "\\"", "\\\\\\"")
          set nPlain to my replaceText(nPlain, return, "\\\\n")
          set nFolder to my replaceText(nFolder, "\\\\", "\\\\\\\\")
          set nFolder to my replaceText(nFolder, "\\"", "\\\\\\"")
          set nAccount to my replaceText(nAccount, "\\\\", "\\\\\\\\")
          set nAccount to my replaceText(nAccount, "\\"", "\\\\\\"")

          if matchCount > 0 then set output to output & ","
          set output to output & "{\\"id\\":\\"" & nId & "\\","
          set output to output & "\\"name\\":\\"" & nName & "\\","
          set output to output & "\\"plaintext\\":\\"" & nPlain & "\\","
          set output to output & "\\"folder\\":\\"" & nFolder & "\\","
          set output to output & "\\"account\\":\\"" & nAccount & "\\","
          set output to output & "\\"creationDate\\":\\"" & (nCreation as «class isot» as string) & "\\","
          set output to output & "\\"modificationDate\\":\\"" & (nMod as «class isot» as string) & "\\"}"
          set matchCount to matchCount + 1
        end if
      end repeat
      set output to output & "]"
      return output
    end tell

    on sortByModDate(noteList)
      set sortedList to noteList
      repeat with i from 1 to (count of sortedList) - 1
        repeat with j from i + 1 to count of sortedList
          if modification date of item j of sortedList > modification date of item i of sortedList then
            set temp to item i of sortedList
            set item i of sortedList to item j of sortedList
            set item j of sortedList to temp
          end if
        end repeat
      end repeat
      return sortedList
    end sortByModDate

    on replaceText(theText, searchStr, replaceStr)
      set AppleScript's text item delimiters to searchStr
      set theItems to text items of theText
      set AppleScript's text item delimiters to replaceStr
      set theText to theItems as text
      set AppleScript's text item delimiters to ""
      return theText
    end replaceText
  `;

  return runAppleScriptJSON<Note[]>(script);
}

// ============================================================================
// Tool Definitions
// ============================================================================

const tools: Tool[] = [
  {
    name: "notes_check_permissions",
    description: "Check if the MCP server has permission to access Apple Notes.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "notes_get_accounts",
    description: "Get all Notes accounts (iCloud, On My Mac, etc.).",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "notes_get_folders",
    description: "Get all folders across all accounts with note counts.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "notes_get_notes",
    description: "Get notes from a specific folder or the default folder.",
    inputSchema: {
      type: "object",
      properties: {
        folder: { type: "string", description: "Folder name (optional)" },
        account: { type: "string", description: "Account name (optional)" },
        limit: { type: "number", description: "Maximum notes to return (default: 50)" },
      },
      required: [],
    },
  },
  {
    name: "notes_get_note",
    description: "Get a specific note by ID with full content.",
    inputSchema: {
      type: "object",
      properties: {
        note_id: { type: "string", description: "The note ID" },
      },
      required: ["note_id"],
    },
  },
  {
    name: "notes_get_recent",
    description: "Get the most recently modified notes across all folders.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum notes to return (default: 20)" },
      },
      required: [],
    },
  },
  {
    name: "notes_create",
    description: "Create a new note in a specified folder.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Note title" },
        body: { type: "string", description: "Note content (plain text or HTML)" },
        folder: { type: "string", description: "Folder name (uses default if not specified)" },
        account: { type: "string", description: "Account name (optional)" },
      },
      required: ["name", "body"],
    },
  },
  {
    name: "notes_update",
    description: "Update an existing note's title or content.",
    inputSchema: {
      type: "object",
      properties: {
        note_id: { type: "string", description: "The note ID to update" },
        name: { type: "string", description: "New title (optional)" },
        body: { type: "string", description: "New content (optional)" },
      },
      required: ["note_id"],
    },
  },
  {
    name: "notes_append",
    description: "Append content to an existing note.",
    inputSchema: {
      type: "object",
      properties: {
        note_id: { type: "string", description: "The note ID to append to" },
        content: { type: "string", description: "Content to append" },
      },
      required: ["note_id", "content"],
    },
  },
  {
    name: "notes_delete",
    description: "Delete a note (moves to Recently Deleted).",
    inputSchema: {
      type: "object",
      properties: {
        note_id: { type: "string", description: "The note ID to delete" },
      },
      required: ["note_id"],
    },
  },
  {
    name: "notes_search",
    description: "Search notes by text in title or content.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text to search for" },
        folder: { type: "string", description: "Limit search to folder (optional)" },
        account: { type: "string", description: "Limit search to account (optional)" },
        limit: { type: "number", description: "Maximum results (default: 50)" },
      },
      required: ["query"],
    },
  },
  {
    name: "notes_search_advanced",
    description: "Search notes with relevance scoring. Returns results ranked by match quality.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text to search for" },
        folder: { type: "string", description: "Limit search to folder (optional)" },
        account: { type: "string", description: "Limit search to account (optional)" },
        limit: { type: "number", description: "Maximum results (default: 50)" },
      },
      required: ["query"],
    },
  },
  {
    name: "notes_create_folder",
    description: "Create a new folder in Notes.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Folder name" },
        account: { type: "string", description: "Account to create folder in (optional)" },
      },
      required: ["name"],
    },
  },
  {
    name: "notes_open",
    description: "Open the Notes app.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "notes_open_note",
    description: "Open a specific note in the Notes app.",
    inputSchema: {
      type: "object",
      properties: {
        note_id: { type: "string", description: "The note ID to open" },
      },
      required: ["note_id"],
    },
  },
  {
    name: "notes_open_folder",
    description: "Open a specific folder in the Notes app.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Folder name to open" },
        account: { type: "string", description: "Account containing the folder (optional)" },
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
    case "notes_check_permissions": {
      const status = await checkPermissions();
      return JSON.stringify(status, null, 2);
    }

    case "notes_get_accounts": {
      const accounts = await getAccounts();
      return JSON.stringify({ accounts }, null, 2);
    }

    case "notes_get_folders": {
      const folders = await getFolders();
      return JSON.stringify(folders, null, 2);
    }

    case "notes_get_notes": {
      const notes = await getNotes({
        folder: args.folder,
        account: args.account,
        limit: args.limit,
      });
      return JSON.stringify(notes, null, 2);
    }

    case "notes_get_note": {
      if (!args.note_id) throw new Error("note_id is required");
      const note = await getNote(args.note_id);
      if (!note) {
        return JSON.stringify({ error: "Note not found" }, null, 2);
      }
      return JSON.stringify(note, null, 2);
    }

    case "notes_get_recent": {
      const notes = await getRecentNotes(args.limit || 20);
      return JSON.stringify(notes, null, 2);
    }

    case "notes_create": {
      if (!args.name || !args.body) throw new Error("name and body are required");
      const result = await createNote({
        name: args.name,
        body: args.body,
        folder: args.folder,
        account: args.account,
      });
      return JSON.stringify(result, null, 2);
    }

    case "notes_update": {
      if (!args.note_id) throw new Error("note_id is required");
      const result = await updateNote(args.note_id, {
        name: args.name,
        body: args.body,
      });
      return JSON.stringify(result, null, 2);
    }

    case "notes_append": {
      if (!args.note_id || !args.content) throw new Error("note_id and content are required");
      const result = await appendToNote(args.note_id, args.content);
      return JSON.stringify(result, null, 2);
    }

    case "notes_delete": {
      if (!args.note_id) throw new Error("note_id is required");
      const result = await deleteNote(args.note_id);
      return JSON.stringify(result, null, 2);
    }

    case "notes_search": {
      if (!args.query) throw new Error("query is required");
      const notes = await searchNotes(args.query, {
        folder: args.folder,
        account: args.account,
        limit: args.limit,
      });
      return JSON.stringify(notes, null, 2);
    }

    case "notes_search_advanced": {
      if (!args.query) throw new Error("query is required");
      const results = await searchNotesAdvanced(args.query, {
        folder: args.folder,
        account: args.account,
        limit: args.limit,
      });
      return JSON.stringify(results, null, 2);
    }

    case "notes_create_folder": {
      if (!args.name) throw new Error("name is required");
      const result = await createFolder(args.name, args.account);
      return JSON.stringify(result, null, 2);
    }

    case "notes_open": {
      const result = await openNotes();
      return JSON.stringify(result, null, 2);
    }

    case "notes_open_note": {
      if (!args.note_id) throw new Error("note_id is required");
      const result = await openNote(args.note_id);
      return JSON.stringify(result, null, 2);
    }

    case "notes_open_folder": {
      if (!args.name) throw new Error("name is required");
      const result = await openFolder(args.name, args.account);
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
    { name: "notes-mcp", version: "2.0.0" },
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

  console.error("Notes MCP server v2.0.0 running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
