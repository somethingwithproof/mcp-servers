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
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    });
    return result.stdout.trim();
  } catch (error: any) {
    if (error.message?.includes("Not authorized")) {
      throw new Error(
        "Reminders access denied. Grant permission in System Settings > Privacy & Security > Reminders"
      );
    }
    throw error;
  }
}

// Run AppleScript and parse as JSON (using our custom JSON output format)
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
// Date Utilities
// ============================================================================

function formatDateForAppleScript(date: Date): string {
  // AppleScript date format: "month day, year at hour:minute:second AM/PM"
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function formatISODate(dateStr: string): string {
  if (!dateStr || dateStr === "missing value") return "";
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "" : date.toISOString();
  } catch {
    return "";
  }
}

// ============================================================================
// Permission Checking
// ============================================================================

interface PermissionStatus {
  reminders: boolean;
  details: string[];
}

async function checkPermissions(): Promise<PermissionStatus> {
  const status: PermissionStatus = {
    reminders: false,
    details: [],
  };

  try {
    await runAppleScript('tell application "Reminders" to count of lists');
    status.reminders = true;
    status.details.push("Reminders: accessible");
  } catch {
    status.details.push("Reminders: NOT accessible (grant Reminders permission in System Settings)");
  }

  return status;
}

// ============================================================================
// Reminder Lists
// ============================================================================

interface ReminderList {
  id: string;
  name: string;
  count: number;
}

async function getLists(): Promise<ReminderList[]> {
  const script = `
    tell application "Reminders"
      set output to "["
      set allLists to lists
      repeat with i from 1 to count of allLists
        set theList to item i of allLists
        set listId to id of theList
        set listName to name of theList
        set reminderCount to count of reminders in theList
        if i > 1 then set output to output & ","
        set output to output & "{\\"id\\":\\"" & listId & "\\",\\"name\\":\\"" & listName & "\\",\\"count\\":" & reminderCount & "}"
      end repeat
      set output to output & "]"
      return output
    end tell
  `;

  return runAppleScriptJSON<ReminderList[]>(script);
}

// ============================================================================
// Reminders CRUD
// ============================================================================

interface Reminder {
  id: string;
  name: string;
  body: string;
  completed: boolean;
  dueDate: string;
  priority: number;
  priorityName: string;
  list: string;
  creationDate: string;
  modificationDate: string;
  url: string;
  flagged: boolean;
}

// Priority helpers
function getPriorityName(priority: number): string {
  if (priority === 0) return "none";
  if (priority >= 1 && priority <= 4) return "high";
  if (priority === 5) return "medium";
  return "low";
}

function getPriorityValue(name: string): number {
  switch (name.toLowerCase()) {
    case "high": return 1;
    case "medium": return 5;
    case "low": return 9;
    case "none": return 0;
    default: return 0;
  }
}

async function getReminders(
  listName?: string,
  options: {
    completed?: boolean;
    limit?: number;
  } = {}
): Promise<Reminder[]> {
  const { completed, limit = 100 } = options;

  let listFilter = listName
    ? `list "${listName.replace(/"/g, '\\"')}"`
    : "default list";

  let completedFilter = "";
  if (completed === true) {
    completedFilter = "whose completed is true";
  } else if (completed === false) {
    completedFilter = "whose completed is false";
  }

  const script = `
    tell application "Reminders"
      set output to "["
      set theList to ${listFilter}
      set allReminders to reminders ${completedFilter} in theList
      set itemCount to count of allReminders
      if itemCount > ${limit} then set itemCount to ${limit}
      repeat with i from 1 to itemCount
        set r to item i of allReminders
        set rId to id of r
        set rName to name of r
        set rBody to body of r
        if rBody is missing value then set rBody to ""
        set rCompleted to completed of r
        set rDueDate to due date of r
        if rDueDate is missing value then
          set rDueDateStr to ""
        else
          set rDueDateStr to (rDueDate as «class isot» as string)
        end if
        set rPriority to priority of r
        set rListName to name of container of r
        set rCreation to creation date of r
        set rMod to modification date of r
        set rFlagged to flagged of r

        -- Escape special characters in strings
        set rName to my replaceText(rName, "\\\\", "\\\\\\\\")
        set rName to my replaceText(rName, "\\"", "\\\\\\"")
        set rName to my replaceText(rName, return, "\\\\n")
        set rBody to my replaceText(rBody, "\\\\", "\\\\\\\\")
        set rBody to my replaceText(rBody, "\\"", "\\\\\\"")
        set rBody to my replaceText(rBody, return, "\\\\n")

        if i > 1 then set output to output & ","
        set output to output & "{\\"id\\":\\"" & rId & "\\","
        set output to output & "\\"name\\":\\"" & rName & "\\","
        set output to output & "\\"body\\":\\"" & rBody & "\\","
        set output to output & "\\"completed\\":" & rCompleted & ","
        set output to output & "\\"dueDate\\":\\"" & rDueDateStr & "\\","
        set output to output & "\\"priority\\":" & rPriority & ","
        set output to output & "\\"flagged\\":" & rFlagged & ","
        set output to output & "\\"list\\":\\"" & rListName & "\\","
        set output to output & "\\"creationDate\\":\\"" & (rCreation as «class isot» as string) & "\\","
        set output to output & "\\"modificationDate\\":\\"" & (rMod as «class isot» as string) & "\\"}"
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

  const reminders = await runAppleScriptJSON<Reminder[]>(script);
  return reminders.map((r) => ({
    ...r,
    dueDate: r.dueDate ? formatISODate(r.dueDate) : "",
    creationDate: formatISODate(r.creationDate),
    modificationDate: formatISODate(r.modificationDate),
    priorityName: getPriorityName(r.priority),
    url: r.url || "",
    flagged: r.flagged || false,
  }));
}

async function createReminder(options: {
  name: string;
  body?: string;
  list?: string;
  dueDate?: string;
  priority?: number | string;
  url?: string;
  flagged?: boolean;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const { name, body, list, dueDate, priority, url, flagged } = options;

  const escapedName = name.replace(/"/g, '\\"');
  const escapedBody = body?.replace(/"/g, '\\"') || "";
  const listTarget = list
    ? `list "${list.replace(/"/g, '\\"')}"`
    : "default list";

  let dueDateLine = "";
  if (dueDate) {
    const date = parseDate(dueDate);
    if (date) {
      dueDateLine = `set due date of newReminder to date "${formatDateForAppleScript(date)}"`;
    }
  }

  let priorityLine = "";
  if (priority !== undefined) {
    const priorityNum = typeof priority === "string" ? getPriorityValue(priority) : priority;
    if (priorityNum >= 0 && priorityNum <= 9) {
      priorityLine = `set priority of newReminder to ${priorityNum}`;
    }
  }

  let flaggedLine = "";
  if (flagged !== undefined) {
    flaggedLine = `set flagged of newReminder to ${flagged}`;
  }

  const script = `
    tell application "Reminders"
      set newReminder to make new reminder in ${listTarget} with properties {name:"${escapedName}", body:"${escapedBody}"}
      ${dueDateLine}
      ${priorityLine}
      ${flaggedLine}
      return id of newReminder
    end tell
  `;

  try {
    const id = await runAppleScript(script);
    return { success: true, id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function completeReminder(
  reminderId: string
): Promise<{ success: boolean; error?: string }> {
  const script = `
    tell application "Reminders"
      set theReminder to reminder id "${reminderId.replace(/"/g, '\\"')}"
      set completed of theReminder to true
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

async function uncompleteReminder(
  reminderId: string
): Promise<{ success: boolean; error?: string }> {
  const script = `
    tell application "Reminders"
      set theReminder to reminder id "${reminderId.replace(/"/g, '\\"')}"
      set completed of theReminder to false
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

async function deleteReminder(
  reminderId: string
): Promise<{ success: boolean; error?: string }> {
  const script = `
    tell application "Reminders"
      delete reminder id "${reminderId.replace(/"/g, '\\"')}"
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

async function updateReminder(
  reminderId: string,
  updates: {
    name?: string;
    body?: string;
    dueDate?: string | null;
    priority?: number | string;
    flagged?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const { name, body, dueDate, priority, flagged } = updates;

  let updateLines: string[] = [];

  if (name !== undefined) {
    updateLines.push(`set name of theReminder to "${name.replace(/"/g, '\\"')}"`);
  }
  if (body !== undefined) {
    updateLines.push(`set body of theReminder to "${body.replace(/"/g, '\\"')}"`);
  }
  if (dueDate === null) {
    updateLines.push(`set due date of theReminder to missing value`);
  } else if (dueDate) {
    const date = parseDate(dueDate);
    if (date) {
      updateLines.push(`set due date of theReminder to date "${formatDateForAppleScript(date)}"`);
    }
  }
  if (priority !== undefined) {
    const priorityNum = typeof priority === "string" ? getPriorityValue(priority) : priority;
    if (priorityNum >= 0 && priorityNum <= 9) {
      updateLines.push(`set priority of theReminder to ${priorityNum}`);
    }
  }
  if (flagged !== undefined) {
    updateLines.push(`set flagged of theReminder to ${flagged}`);
  }

  if (updateLines.length === 0) {
    return { success: false, error: "No updates provided" };
  }

  const script = `
    tell application "Reminders"
      set theReminder to reminder id "${reminderId.replace(/"/g, '\\"')}"
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

// ============================================================================
// Search and Filtered Queries
// ============================================================================

async function searchReminders(
  query: string,
  options: { list?: string; limit?: number } = {}
): Promise<Reminder[]> {
  const { list, limit = 50 } = options;
  const escapedQuery = query.toLowerCase().replace(/"/g, '\\"');

  let listFilter = list
    ? `list "${list.replace(/"/g, '\\"')}"`
    : "default list";

  // Get all reminders and filter by query
  // AppleScript doesn't have great search, so we fetch and filter
  const script = `
    tell application "Reminders"
      set output to "["
      set searchQuery to "${escapedQuery}"
      set matchCount to 0
      ${list ? `set targetLists to {${listFilter}}` : "set targetLists to lists"}
      repeat with theList in targetLists
        set allReminders to reminders in theList
        repeat with r in allReminders
          if matchCount < ${limit} then
            set rName to name of r
            set rBody to body of r
            if rBody is missing value then set rBody to ""
            set lowerName to my toLowerCase(rName)
            set lowerBody to my toLowerCase(rBody)
            if lowerName contains searchQuery or lowerBody contains searchQuery then
              set rId to id of r
              set rCompleted to completed of r
              set rDueDate to due date of r
              if rDueDate is missing value then
                set rDueDateStr to ""
              else
                set rDueDateStr to (rDueDate as «class isot» as string)
              end if
              set rPriority to priority of r
              set rListName to name of container of r
              set rCreation to creation date of r
              set rMod to modification date of r

              set rName to my replaceText(rName, "\\\\", "\\\\\\\\")
              set rName to my replaceText(rName, "\\"", "\\\\\\"")
              set rName to my replaceText(rName, return, "\\\\n")
              set rBody to my replaceText(rBody, "\\\\", "\\\\\\\\")
              set rBody to my replaceText(rBody, "\\"", "\\\\\\"")
              set rBody to my replaceText(rBody, return, "\\\\n")

              if matchCount > 0 then set output to output & ","
              set output to output & "{\\"id\\":\\"" & rId & "\\","
              set output to output & "\\"name\\":\\"" & rName & "\\","
              set output to output & "\\"body\\":\\"" & rBody & "\\","
              set output to output & "\\"completed\\":" & rCompleted & ","
              set output to output & "\\"dueDate\\":\\"" & rDueDateStr & "\\","
              set output to output & "\\"priority\\":" & rPriority & ","
              set output to output & "\\"list\\":\\"" & rListName & "\\","
              set output to output & "\\"creationDate\\":\\"" & (rCreation as «class isot» as string) & "\\","
              set output to output & "\\"modificationDate\\":\\"" & (rMod as «class isot» as string) & "\\"}"
              set matchCount to matchCount + 1
            end if
          end if
        end repeat
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

  const reminders = await runAppleScriptJSON<Reminder[]>(script);
  return reminders.map((r) => ({
    ...r,
    dueDate: r.dueDate ? formatISODate(r.dueDate) : "",
    creationDate: formatISODate(r.creationDate),
    modificationDate: formatISODate(r.modificationDate),
  }));
}

async function getDueToday(): Promise<Reminder[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const script = `
    tell application "Reminders"
      set output to "["
      set todayStart to current date
      set time of todayStart to 0
      set todayEnd to todayStart + (24 * 60 * 60)
      set matchCount to 0
      repeat with theList in lists
        set allReminders to reminders whose completed is false in theList
        repeat with r in allReminders
          set rDueDate to due date of r
          if rDueDate is not missing value then
            if rDueDate ≥ todayStart and rDueDate < todayEnd then
              set rId to id of r
              set rName to name of r
              set rBody to body of r
              if rBody is missing value then set rBody to ""
              set rPriority to priority of r
              set rListName to name of container of r
              set rCreation to creation date of r
              set rMod to modification date of r

              set rName to my replaceText(rName, "\\\\", "\\\\\\\\")
              set rName to my replaceText(rName, "\\"", "\\\\\\"")
              set rName to my replaceText(rName, return, "\\\\n")
              set rBody to my replaceText(rBody, "\\\\", "\\\\\\\\")
              set rBody to my replaceText(rBody, "\\"", "\\\\\\"")
              set rBody to my replaceText(rBody, return, "\\\\n")

              if matchCount > 0 then set output to output & ","
              set output to output & "{\\"id\\":\\"" & rId & "\\","
              set output to output & "\\"name\\":\\"" & rName & "\\","
              set output to output & "\\"body\\":\\"" & rBody & "\\","
              set output to output & "\\"completed\\":false,"
              set output to output & "\\"dueDate\\":\\"" & (rDueDate as «class isot» as string) & "\\","
              set output to output & "\\"priority\\":" & rPriority & ","
              set output to output & "\\"list\\":\\"" & rListName & "\\","
              set output to output & "\\"creationDate\\":\\"" & (rCreation as «class isot» as string) & "\\","
              set output to output & "\\"modificationDate\\":\\"" & (rMod as «class isot» as string) & "\\"}"
              set matchCount to matchCount + 1
            end if
          end if
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

  const reminders = await runAppleScriptJSON<Reminder[]>(script);
  return reminders.map((r) => ({
    ...r,
    dueDate: r.dueDate ? formatISODate(r.dueDate) : "",
    creationDate: formatISODate(r.creationDate),
    modificationDate: formatISODate(r.modificationDate),
  }));
}

async function getOverdue(): Promise<Reminder[]> {
  const script = `
    tell application "Reminders"
      set output to "["
      set rightNow to current date
      set matchCount to 0
      repeat with theList in lists
        set allReminders to reminders whose completed is false in theList
        repeat with r in allReminders
          set rDueDate to due date of r
          if rDueDate is not missing value then
            if rDueDate < rightNow then
              set rId to id of r
              set rName to name of r
              set rBody to body of r
              if rBody is missing value then set rBody to ""
              set rPriority to priority of r
              set rListName to name of container of r
              set rCreation to creation date of r
              set rMod to modification date of r

              set rName to my replaceText(rName, "\\\\", "\\\\\\\\")
              set rName to my replaceText(rName, "\\"", "\\\\\\"")
              set rName to my replaceText(rName, return, "\\\\n")
              set rBody to my replaceText(rBody, "\\\\", "\\\\\\\\")
              set rBody to my replaceText(rBody, "\\"", "\\\\\\"")
              set rBody to my replaceText(rBody, return, "\\\\n")

              if matchCount > 0 then set output to output & ","
              set output to output & "{\\"id\\":\\"" & rId & "\\","
              set output to output & "\\"name\\":\\"" & rName & "\\","
              set output to output & "\\"body\\":\\"" & rBody & "\\","
              set output to output & "\\"completed\\":false,"
              set output to output & "\\"dueDate\\":\\"" & (rDueDate as «class isot» as string) & "\\","
              set output to output & "\\"priority\\":" & rPriority & ","
              set output to output & "\\"list\\":\\"" & rListName & "\\","
              set output to output & "\\"creationDate\\":\\"" & (rCreation as «class isot» as string) & "\\","
              set output to output & "\\"modificationDate\\":\\"" & (rMod as «class isot» as string) & "\\"}"
              set matchCount to matchCount + 1
            end if
          end if
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

  const reminders = await runAppleScriptJSON<Reminder[]>(script);
  return reminders.map((r) => ({
    ...r,
    dueDate: r.dueDate ? formatISODate(r.dueDate) : "",
    creationDate: formatISODate(r.creationDate),
    modificationDate: formatISODate(r.modificationDate),
  }));
}

async function getUpcoming(days: number = 7): Promise<Reminder[]> {
  const script = `
    tell application "Reminders"
      set output to "["
      set rightNow to current date
      set futureDate to rightNow + (${days} * 24 * 60 * 60)
      set matchCount to 0
      repeat with theList in lists
        set allReminders to reminders whose completed is false in theList
        repeat with r in allReminders
          set rDueDate to due date of r
          if rDueDate is not missing value then
            if rDueDate ≥ rightNow and rDueDate ≤ futureDate then
              set rId to id of r
              set rName to name of r
              set rBody to body of r
              if rBody is missing value then set rBody to ""
              set rPriority to priority of r
              set rListName to name of container of r
              set rCreation to creation date of r
              set rMod to modification date of r

              set rName to my replaceText(rName, "\\\\", "\\\\\\\\")
              set rName to my replaceText(rName, "\\"", "\\\\\\"")
              set rName to my replaceText(rName, return, "\\\\n")
              set rBody to my replaceText(rBody, "\\\\", "\\\\\\\\")
              set rBody to my replaceText(rBody, "\\"", "\\\\\\"")
              set rBody to my replaceText(rBody, return, "\\\\n")

              if matchCount > 0 then set output to output & ","
              set output to output & "{\\"id\\":\\"" & rId & "\\","
              set output to output & "\\"name\\":\\"" & rName & "\\","
              set output to output & "\\"body\\":\\"" & rBody & "\\","
              set output to output & "\\"completed\\":false,"
              set output to output & "\\"dueDate\\":\\"" & (rDueDate as «class isot» as string) & "\\","
              set output to output & "\\"priority\\":" & rPriority & ","
              set output to output & "\\"list\\":\\"" & rListName & "\\","
              set output to output & "\\"creationDate\\":\\"" & (rCreation as «class isot» as string) & "\\","
              set output to output & "\\"modificationDate\\":\\"" & (rMod as «class isot» as string) & "\\"}"
              set matchCount to matchCount + 1
            end if
          end if
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

  const reminders = await runAppleScriptJSON<Reminder[]>(script);
  return reminders
    .map((r) => ({
      ...r,
      dueDate: r.dueDate ? formatISODate(r.dueDate) : "",
      creationDate: formatISODate(r.creationDate),
      modificationDate: formatISODate(r.modificationDate),
    }))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

// ============================================================================
// List Management
// ============================================================================

async function createList(name: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const escapedName = name.replace(/"/g, '\\"');

  const script = `
    tell application "Reminders"
      set newList to make new list with properties {name:"${escapedName}"}
      return id of newList
    end tell
  `;

  try {
    const id = await runAppleScript(script);
    return { success: true, id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function deleteList(listName: string): Promise<{ success: boolean; error?: string }> {
  const escapedName = listName.replace(/"/g, '\\"');

  const script = `
    tell application "Reminders"
      delete list "${escapedName}"
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
// Batch Operations
// ============================================================================

interface BulkReminderInput {
  name: string;
  body?: string;
  dueDate?: string;
  priority?: number | string;
  flagged?: boolean;
}

async function bulkCreateReminders(
  reminders: BulkReminderInput[],
  list?: string
): Promise<{ success: boolean; created: number; errors: string[] }> {
  const results = { success: true, created: 0, errors: [] as string[] };

  for (const reminder of reminders) {
    const result = await createReminder({
      name: reminder.name,
      body: reminder.body,
      list,
      dueDate: reminder.dueDate,
      priority: reminder.priority,
      flagged: reminder.flagged,
    });

    if (result.success) {
      results.created++;
    } else {
      results.errors.push(`Failed to create "${reminder.name}": ${result.error}`);
    }
  }

  results.success = results.errors.length === 0;
  return results;
}

async function bulkCompleteReminders(
  reminderIds: string[]
): Promise<{ success: boolean; completed: number; errors: string[] }> {
  const results = { success: true, completed: 0, errors: [] as string[] };

  for (const id of reminderIds) {
    const result = await completeReminder(id);
    if (result.success) {
      results.completed++;
    } else {
      results.errors.push(`Failed to complete ${id}: ${result.error}`);
    }
  }

  results.success = results.errors.length === 0;
  return results;
}

async function bulkDeleteReminders(
  reminderIds: string[]
): Promise<{ success: boolean; deleted: number; errors: string[] }> {
  const results = { success: true, deleted: 0, errors: [] as string[] };

  for (const id of reminderIds) {
    const result = await deleteReminder(id);
    if (result.success) {
      results.deleted++;
    } else {
      results.errors.push(`Failed to delete ${id}: ${result.error}`);
    }
  }

  results.success = results.errors.length === 0;
  return results;
}

// ============================================================================
// Flagged & Open
// ============================================================================

async function getFlagged(): Promise<Reminder[]> {
  const script = `
    tell application "Reminders"
      set output to "["
      set matchCount to 0
      repeat with theList in lists
        set allReminders to reminders whose flagged is true and completed is false in theList
        repeat with r in allReminders
          set rId to id of r
          set rName to name of r
          set rBody to body of r
          if rBody is missing value then set rBody to ""
          set rCompleted to completed of r
          set rDueDate to due date of r
          if rDueDate is missing value then
            set rDueDateStr to ""
          else
            set rDueDateStr to (rDueDate as «class isot» as string)
          end if
          set rPriority to priority of r
          set rListName to name of container of r
          set rCreation to creation date of r
          set rMod to modification date of r
          set rFlagged to flagged of r

          set rName to my replaceText(rName, "\\\\", "\\\\\\\\")
          set rName to my replaceText(rName, "\\"", "\\\\\\"")
          set rName to my replaceText(rName, return, "\\\\n")
          set rBody to my replaceText(rBody, "\\\\", "\\\\\\\\")
          set rBody to my replaceText(rBody, "\\"", "\\\\\\"")
          set rBody to my replaceText(rBody, return, "\\\\n")

          if matchCount > 0 then set output to output & ","
          set output to output & "{\\"id\\":\\"" & rId & "\\","
          set output to output & "\\"name\\":\\"" & rName & "\\","
          set output to output & "\\"body\\":\\"" & rBody & "\\","
          set output to output & "\\"completed\\":" & rCompleted & ","
          set output to output & "\\"dueDate\\":\\"" & rDueDateStr & "\\","
          set output to output & "\\"priority\\":" & rPriority & ","
          set output to output & "\\"flagged\\":" & rFlagged & ","
          set output to output & "\\"list\\":\\"" & rListName & "\\","
          set output to output & "\\"creationDate\\":\\"" & (rCreation as «class isot» as string) & "\\","
          set output to output & "\\"modificationDate\\":\\"" & (rMod as «class isot» as string) & "\\"}"
          set matchCount to matchCount + 1
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

  const reminders = await runAppleScriptJSON<Reminder[]>(script);
  return reminders.map((r) => ({
    ...r,
    dueDate: r.dueDate ? formatISODate(r.dueDate) : "",
    creationDate: formatISODate(r.creationDate),
    modificationDate: formatISODate(r.modificationDate),
    priorityName: getPriorityName(r.priority),
    url: r.url || "",
    flagged: r.flagged || false,
  }));
}

async function openReminder(reminderId: string): Promise<{ success: boolean; error?: string }> {
  // Open the Reminders app and try to show the reminder
  const script = `
    tell application "Reminders"
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

async function openList(listName: string): Promise<{ success: boolean; error?: string }> {
  const escapedName = listName.replace(/"/g, '\\"');

  const script = `
    tell application "Reminders"
      activate
      set theList to list "${escapedName}"
      show theList
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
// Tool Definitions
// ============================================================================

const tools: Tool[] = [
  {
    name: "reminders_check_permissions",
    description: "Check if the MCP server has permission to access Apple Reminders.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "reminders_get_lists",
    description: "Get all reminder lists (folders) with their reminder counts.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "reminders_get_reminders",
    description: "Get reminders from a specific list or the default list.",
    inputSchema: {
      type: "object",
      properties: {
        list: { type: "string", description: "Name of the list (optional, uses default if not specified)" },
        completed: { type: "boolean", description: "Filter by completion status (optional)" },
        limit: { type: "number", description: "Maximum number of reminders to return (default: 100)" },
      },
      required: [],
    },
  },
  {
    name: "reminders_create",
    description: "Create a new reminder in a specified list or the default list.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "The reminder title/name" },
        body: { type: "string", description: "Optional notes/description for the reminder" },
        list: { type: "string", description: "List to add the reminder to (uses default if not specified)" },
        due_date: { type: "string", description: "Due date in ISO 8601 format (e.g., 2024-12-25T10:00:00)" },
        priority: { type: "string", description: "Priority: 'high', 'medium', 'low', or 'none' (or number 0-9)" },
        flagged: { type: "boolean", description: "Whether the reminder should be flagged" },
      },
      required: ["name"],
    },
  },
  {
    name: "reminders_complete",
    description: "Mark a reminder as completed.",
    inputSchema: {
      type: "object",
      properties: {
        reminder_id: { type: "string", description: "The unique ID of the reminder to complete" },
      },
      required: ["reminder_id"],
    },
  },
  {
    name: "reminders_uncomplete",
    description: "Mark a completed reminder as not completed.",
    inputSchema: {
      type: "object",
      properties: {
        reminder_id: { type: "string", description: "The unique ID of the reminder to uncomplete" },
      },
      required: ["reminder_id"],
    },
  },
  {
    name: "reminders_delete",
    description: "Delete a reminder permanently.",
    inputSchema: {
      type: "object",
      properties: {
        reminder_id: { type: "string", description: "The unique ID of the reminder to delete" },
      },
      required: ["reminder_id"],
    },
  },
  {
    name: "reminders_update",
    description: "Update an existing reminder's properties.",
    inputSchema: {
      type: "object",
      properties: {
        reminder_id: { type: "string", description: "The unique ID of the reminder to update" },
        name: { type: "string", description: "New title/name for the reminder" },
        body: { type: "string", description: "New notes/description" },
        due_date: { type: "string", description: "New due date (ISO 8601) or null to remove" },
        priority: { type: "string", description: "Priority: 'high', 'medium', 'low', or 'none' (or number 0-9)" },
        flagged: { type: "boolean", description: "Whether the reminder should be flagged" },
      },
      required: ["reminder_id"],
    },
  },
  {
    name: "reminders_search",
    description: "Search for reminders by text in name or notes.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text to search for" },
        list: { type: "string", description: "Limit search to a specific list (optional)" },
        limit: { type: "number", description: "Maximum results to return (default: 50)" },
      },
      required: ["query"],
    },
  },
  {
    name: "reminders_get_due_today",
    description: "Get all incomplete reminders due today.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "reminders_get_overdue",
    description: "Get all incomplete reminders that are past their due date.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "reminders_get_upcoming",
    description: "Get all incomplete reminders due within the next N days.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Number of days to look ahead (default: 7)" },
      },
      required: [],
    },
  },
  {
    name: "reminders_get_flagged",
    description: "Get all flagged incomplete reminders across all lists.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "reminders_create_list",
    description: "Create a new reminder list.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name for the new list" },
      },
      required: ["name"],
    },
  },
  {
    name: "reminders_delete_list",
    description: "Delete a reminder list and all its reminders.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the list to delete" },
      },
      required: ["name"],
    },
  },
  {
    name: "reminders_bulk_create",
    description: "Create multiple reminders at once in a single list.",
    inputSchema: {
      type: "object",
      properties: {
        reminders: {
          type: "array",
          description: "Array of reminder objects with name, body, dueDate, priority, flagged",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Reminder title" },
              body: { type: "string", description: "Notes/description" },
              dueDate: { type: "string", description: "Due date (ISO 8601)" },
              priority: { type: "string", description: "Priority: high/medium/low/none" },
              flagged: { type: "boolean", description: "Flagged status" },
            },
            required: ["name"],
          },
        },
        list: { type: "string", description: "Target list name (optional)" },
      },
      required: ["reminders"],
    },
  },
  {
    name: "reminders_bulk_complete",
    description: "Mark multiple reminders as completed at once.",
    inputSchema: {
      type: "object",
      properties: {
        reminder_ids: {
          type: "array",
          description: "Array of reminder IDs to complete",
          items: { type: "string" },
        },
      },
      required: ["reminder_ids"],
    },
  },
  {
    name: "reminders_bulk_delete",
    description: "Delete multiple reminders at once.",
    inputSchema: {
      type: "object",
      properties: {
        reminder_ids: {
          type: "array",
          description: "Array of reminder IDs to delete",
          items: { type: "string" },
        },
      },
      required: ["reminder_ids"],
    },
  },
  {
    name: "reminders_open",
    description: "Open the Reminders app.",
    inputSchema: {
      type: "object",
      properties: {
        reminder_id: { type: "string", description: "Optional reminder ID (opens app)" },
      },
      required: [],
    },
  },
  {
    name: "reminders_open_list",
    description: "Open a specific list in the Reminders app.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the list to open" },
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
    case "reminders_check_permissions": {
      const status = await checkPermissions();
      return JSON.stringify(status, null, 2);
    }

    case "reminders_get_lists": {
      const lists = await getLists();
      return JSON.stringify(lists, null, 2);
    }

    case "reminders_get_reminders": {
      const reminders = await getReminders(args.list, {
        completed: args.completed,
        limit: args.limit,
      });
      return JSON.stringify(reminders, null, 2);
    }

    case "reminders_create": {
      if (!args.name) throw new Error("name is required");
      const result = await createReminder({
        name: args.name,
        body: args.body,
        list: args.list,
        dueDate: args.due_date,
        priority: args.priority,
        flagged: args.flagged,
      });
      return JSON.stringify(result, null, 2);
    }

    case "reminders_complete": {
      if (!args.reminder_id) throw new Error("reminder_id is required");
      const result = await completeReminder(args.reminder_id);
      return JSON.stringify(result, null, 2);
    }

    case "reminders_uncomplete": {
      if (!args.reminder_id) throw new Error("reminder_id is required");
      const result = await uncompleteReminder(args.reminder_id);
      return JSON.stringify(result, null, 2);
    }

    case "reminders_delete": {
      if (!args.reminder_id) throw new Error("reminder_id is required");
      const result = await deleteReminder(args.reminder_id);
      return JSON.stringify(result, null, 2);
    }

    case "reminders_update": {
      if (!args.reminder_id) throw new Error("reminder_id is required");
      const result = await updateReminder(args.reminder_id, {
        name: args.name,
        body: args.body,
        dueDate: args.due_date,
        priority: args.priority,
        flagged: args.flagged,
      });
      return JSON.stringify(result, null, 2);
    }

    case "reminders_search": {
      if (!args.query) throw new Error("query is required");
      const reminders = await searchReminders(args.query, {
        list: args.list,
        limit: args.limit,
      });
      return JSON.stringify(reminders, null, 2);
    }

    case "reminders_get_due_today": {
      const reminders = await getDueToday();
      return JSON.stringify(reminders, null, 2);
    }

    case "reminders_get_overdue": {
      const reminders = await getOverdue();
      return JSON.stringify(reminders, null, 2);
    }

    case "reminders_get_upcoming": {
      const reminders = await getUpcoming(args.days || 7);
      return JSON.stringify(reminders, null, 2);
    }

    case "reminders_get_flagged": {
      const reminders = await getFlagged();
      return JSON.stringify(reminders, null, 2);
    }

    case "reminders_create_list": {
      if (!args.name) throw new Error("name is required");
      const result = await createList(args.name);
      return JSON.stringify(result, null, 2);
    }

    case "reminders_delete_list": {
      if (!args.name) throw new Error("name is required");
      const result = await deleteList(args.name);
      return JSON.stringify(result, null, 2);
    }

    case "reminders_bulk_create": {
      if (!args.reminders || !Array.isArray(args.reminders)) {
        throw new Error("reminders array is required");
      }
      const result = await bulkCreateReminders(args.reminders, args.list);
      return JSON.stringify(result, null, 2);
    }

    case "reminders_bulk_complete": {
      if (!args.reminder_ids || !Array.isArray(args.reminder_ids)) {
        throw new Error("reminder_ids array is required");
      }
      const result = await bulkCompleteReminders(args.reminder_ids);
      return JSON.stringify(result, null, 2);
    }

    case "reminders_bulk_delete": {
      if (!args.reminder_ids || !Array.isArray(args.reminder_ids)) {
        throw new Error("reminder_ids array is required");
      }
      const result = await bulkDeleteReminders(args.reminder_ids);
      return JSON.stringify(result, null, 2);
    }

    case "reminders_open": {
      const result = await openReminder(args.reminder_id || "");
      return JSON.stringify(result, null, 2);
    }

    case "reminders_open_list": {
      if (!args.name) throw new Error("name is required");
      const result = await openList(args.name);
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
    { name: "reminders-mcp", version: "2.0.0" },
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

  console.error("Reminders MCP server v2.0.0 running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
