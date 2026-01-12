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
        "Calendar access denied. Grant permission in System Settings > Privacy & Security > Calendars"
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
// Date Utilities
// ============================================================================

function formatDateForAppleScript(date: Date): string {
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

function getDateRange(startDate: Date, endDate: Date): { start: string; end: string } {
  return {
    start: formatDateForAppleScript(startDate),
    end: formatDateForAppleScript(endDate),
  };
}

// ============================================================================
// Permission Checking
// ============================================================================

interface PermissionStatus {
  calendar: boolean;
  details: string[];
}

async function checkPermissions(): Promise<PermissionStatus> {
  const status: PermissionStatus = {
    calendar: false,
    details: [],
  };

  try {
    await runAppleScript('tell application "Calendar" to count of calendars');
    status.calendar = true;
    status.details.push("Calendar: accessible");
  } catch {
    status.details.push("Calendar: NOT accessible (grant Calendar permission in System Settings)");
  }

  return status;
}

// ============================================================================
// Calendars
// ============================================================================

interface CalendarInfo {
  id: string;
  name: string;
  color: string;
  writable: boolean;
}

async function getCalendars(): Promise<CalendarInfo[]> {
  const script = `
    tell application "Calendar"
      set output to "["
      set allCals to calendars
      repeat with i from 1 to count of allCals
        set theCal to item i of allCals
        set calId to uid of theCal
        set calName to name of theCal
        set calColor to color of theCal
        set calWritable to writable of theCal

        set calName to my replaceText(calName, "\\\\", "\\\\\\\\")
        set calName to my replaceText(calName, "\\"", "\\\\\\"")

        if i > 1 then set output to output & ","
        set output to output & "{\\"id\\":\\"" & calId & "\\",\\"name\\":\\"" & calName & "\\",\\"color\\":\\"" & calColor & "\\",\\"writable\\":" & calWritable & "}"
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

  return runAppleScriptJSON<CalendarInfo[]>(script);
}

// ============================================================================
// Events
// ============================================================================

interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  calendar: string;
  url: string;
  status: string;
}

async function getEvents(
  options: {
    calendar?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}
): Promise<CalendarEvent[]> {
  const { calendar, startDate, endDate, limit = 100 } = options;

  // Default to next 30 days if no dates specified
  const start = startDate ? parseDate(startDate) : new Date();
  const end = endDate ? parseDate(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (!start || !end) {
    throw new Error("Invalid date format");
  }

  const dateRange = getDateRange(start, end);
  const calendarFilter = calendar
    ? `calendar "${calendar.replace(/"/g, '\\"')}"`
    : "calendars";

  const script = `
    tell application "Calendar"
      set output to "["
      set startDate to date "${dateRange.start}"
      set endDate to date "${dateRange.end}"
      set matchCount to 0

      if "${calendar}" is "" then
        set targetCals to calendars
      else
        set targetCals to {calendar "${calendar?.replace(/"/g, '\\"') || ""}"}
      end if

      repeat with theCal in targetCals
        set calEvents to (events of theCal whose start date ≥ startDate and start date ≤ endDate)
        repeat with e in calEvents
          if matchCount < ${limit} then
            set eId to uid of e
            set eSummary to summary of e
            set eDesc to description of e
            if eDesc is missing value then set eDesc to ""
            set eLoc to location of e
            if eLoc is missing value then set eLoc to ""
            set eStart to start date of e
            set eEnd to end date of e
            set eAllDay to allday event of e
            set eCalName to name of theCal
            set eUrl to url of e
            if eUrl is missing value then set eUrl to ""
            set eStatus to status of e

            set eSummary to my replaceText(eSummary, "\\\\", "\\\\\\\\")
            set eSummary to my replaceText(eSummary, "\\"", "\\\\\\"")
            set eSummary to my replaceText(eSummary, return, "\\\\n")
            set eDesc to my replaceText(eDesc, "\\\\", "\\\\\\\\")
            set eDesc to my replaceText(eDesc, "\\"", "\\\\\\"")
            set eDesc to my replaceText(eDesc, return, "\\\\n")
            set eLoc to my replaceText(eLoc, "\\\\", "\\\\\\\\")
            set eLoc to my replaceText(eLoc, "\\"", "\\\\\\"")

            if matchCount > 0 then set output to output & ","
            set output to output & "{\\"id\\":\\"" & eId & "\\","
            set output to output & "\\"summary\\":\\"" & eSummary & "\\","
            set output to output & "\\"description\\":\\"" & eDesc & "\\","
            set output to output & "\\"location\\":\\"" & eLoc & "\\","
            set output to output & "\\"startDate\\":\\"" & (eStart as «class isot» as string) & "\\","
            set output to output & "\\"endDate\\":\\"" & (eEnd as «class isot» as string) & "\\","
            set output to output & "\\"allDay\\":" & eAllDay & ","
            set output to output & "\\"calendar\\":\\"" & eCalName & "\\","
            set output to output & "\\"url\\":\\"" & eUrl & "\\","
            set output to output & "\\"status\\":\\"" & eStatus & "\\"}"
            set matchCount to matchCount + 1
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

  const events = await runAppleScriptJSON<CalendarEvent[]>(script);
  return events
    .map((e) => ({
      ...e,
      startDate: formatISODate(e.startDate),
      endDate: formatISODate(e.endDate),
    }))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

async function createEvent(options: {
  summary: string;
  startDate: string;
  endDate?: string;
  allDay?: boolean;
  calendar?: string;
  description?: string;
  location?: string;
  url?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const {
    summary,
    startDate,
    endDate,
    allDay = false,
    calendar,
    description,
    location,
    url,
  } = options;

  const start = parseDate(startDate);
  if (!start) {
    return { success: false, error: "Invalid start date" };
  }

  // Default end date to 1 hour after start for non-all-day events
  const end = endDate
    ? parseDate(endDate)
    : new Date(start.getTime() + (allDay ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000));

  if (!end) {
    return { success: false, error: "Invalid end date" };
  }

  const escapedSummary = summary.replace(/"/g, '\\"');
  const escapedDesc = description?.replace(/"/g, '\\"') || "";
  const escapedLoc = location?.replace(/"/g, '\\"') || "";
  const escapedUrl = url?.replace(/"/g, '\\"') || "";

  const calendarTarget = calendar
    ? `calendar "${calendar.replace(/"/g, '\\"')}"`
    : "first calendar";

  const script = `
    tell application "Calendar"
      set newEvent to make new event at end of events of ${calendarTarget} with properties {summary:"${escapedSummary}", start date:date "${formatDateForAppleScript(start)}", end date:date "${formatDateForAppleScript(end)}", allday event:${allDay}}
      ${description ? `set description of newEvent to "${escapedDesc}"` : ""}
      ${location ? `set location of newEvent to "${escapedLoc}"` : ""}
      ${url ? `set url of newEvent to "${escapedUrl}"` : ""}
      return uid of newEvent
    end tell
  `;

  try {
    const id = await runAppleScript(script);
    return { success: true, id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function updateEvent(
  eventId: string,
  calendarName: string,
  updates: {
    summary?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    location?: string;
    allDay?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const { summary, startDate, endDate, description, location, allDay } = updates;

  let updateLines: string[] = [];

  if (summary !== undefined) {
    updateLines.push(`set summary of theEvent to "${summary.replace(/"/g, '\\"')}"`);
  }
  if (description !== undefined) {
    updateLines.push(`set description of theEvent to "${description.replace(/"/g, '\\"')}"`);
  }
  if (location !== undefined) {
    updateLines.push(`set location of theEvent to "${location.replace(/"/g, '\\"')}"`);
  }
  if (startDate) {
    const date = parseDate(startDate);
    if (date) {
      updateLines.push(`set start date of theEvent to date "${formatDateForAppleScript(date)}"`);
    }
  }
  if (endDate) {
    const date = parseDate(endDate);
    if (date) {
      updateLines.push(`set end date of theEvent to date "${formatDateForAppleScript(date)}"`);
    }
  }
  if (allDay !== undefined) {
    updateLines.push(`set allday event of theEvent to ${allDay}`);
  }

  if (updateLines.length === 0) {
    return { success: false, error: "No updates provided" };
  }

  const script = `
    tell application "Calendar"
      set theCal to calendar "${calendarName.replace(/"/g, '\\"')}"
      set theEvent to (first event of theCal whose uid is "${eventId.replace(/"/g, '\\"')}")
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

async function deleteEvent(
  eventId: string,
  calendarName: string
): Promise<{ success: boolean; error?: string }> {
  const script = `
    tell application "Calendar"
      set theCal to calendar "${calendarName.replace(/"/g, '\\"')}"
      set theEvent to (first event of theCal whose uid is "${eventId.replace(/"/g, '\\"')}")
      delete theEvent
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

async function searchEvents(
  query: string,
  options: { calendar?: string; limit?: number } = {}
): Promise<CalendarEvent[]> {
  const { calendar, limit = 50 } = options;
  const escapedQuery = query.toLowerCase().replace(/"/g, '\\"');

  // Search in next 365 days
  const start = new Date();
  const end = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const dateRange = getDateRange(start, end);

  const script = `
    tell application "Calendar"
      set output to "["
      set searchQuery to "${escapedQuery}"
      set matchCount to 0
      set startDate to date "${dateRange.start}"
      set endDate to date "${dateRange.end}"

      ${calendar ? `set targetCals to {calendar "${calendar.replace(/"/g, '\\"')}"}` : "set targetCals to calendars"}

      repeat with theCal in targetCals
        set calEvents to (events of theCal whose start date ≥ startDate and start date ≤ endDate)
        repeat with e in calEvents
          if matchCount < ${limit} then
            set eSummary to summary of e
            set eDesc to description of e
            if eDesc is missing value then set eDesc to ""
            set eLoc to location of e
            if eLoc is missing value then set eLoc to ""

            set lowerSummary to my toLowerCase(eSummary)
            set lowerDesc to my toLowerCase(eDesc)
            set lowerLoc to my toLowerCase(eLoc)

            if lowerSummary contains searchQuery or lowerDesc contains searchQuery or lowerLoc contains searchQuery then
              set eId to uid of e
              set eStart to start date of e
              set eEnd to end date of e
              set eAllDay to allday event of e
              set eCalName to name of theCal
              set eUrl to url of e
              if eUrl is missing value then set eUrl to ""
              set eStatus to status of e

              set eSummary to my replaceText(eSummary, "\\\\", "\\\\\\\\")
              set eSummary to my replaceText(eSummary, "\\"", "\\\\\\"")
              set eSummary to my replaceText(eSummary, return, "\\\\n")
              set eDesc to my replaceText(eDesc, "\\\\", "\\\\\\\\")
              set eDesc to my replaceText(eDesc, "\\"", "\\\\\\"")
              set eDesc to my replaceText(eDesc, return, "\\\\n")
              set eLoc to my replaceText(eLoc, "\\\\", "\\\\\\\\")
              set eLoc to my replaceText(eLoc, "\\"", "\\\\\\"")

              if matchCount > 0 then set output to output & ","
              set output to output & "{\\"id\\":\\"" & eId & "\\","
              set output to output & "\\"summary\\":\\"" & eSummary & "\\","
              set output to output & "\\"description\\":\\"" & eDesc & "\\","
              set output to output & "\\"location\\":\\"" & eLoc & "\\","
              set output to output & "\\"startDate\\":\\"" & (eStart as «class isot» as string) & "\\","
              set output to output & "\\"endDate\\":\\"" & (eEnd as «class isot» as string) & "\\","
              set output to output & "\\"allDay\\":" & eAllDay & ","
              set output to output & "\\"calendar\\":\\"" & eCalName & "\\","
              set output to output & "\\"url\\":\\"" & eUrl & "\\","
              set output to output & "\\"status\\":\\"" & eStatus & "\\"}"
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

  const events = await runAppleScriptJSON<CalendarEvent[]>(script);
  return events
    .map((e) => ({
      ...e,
      startDate: formatISODate(e.startDate),
      endDate: formatISODate(e.endDate),
    }))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

async function getTodayEvents(): Promise<CalendarEvent[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getEvents({
    startDate: today.toISOString(),
    endDate: tomorrow.toISOString(),
  });
}

async function getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return getEvents({
    startDate: now.toISOString(),
    endDate: future.toISOString(),
  });
}

// ============================================================================
// Tool Definitions
// ============================================================================

const tools: Tool[] = [
  {
    name: "calendar_check_permissions",
    description: "Check if the MCP server has permission to access Apple Calendar.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "calendar_get_calendars",
    description: "Get all calendars with their names and colors.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "calendar_get_events",
    description: "Get events from calendars within a date range.",
    inputSchema: {
      type: "object",
      properties: {
        calendar: { type: "string", description: "Calendar name to filter by (optional)" },
        start_date: { type: "string", description: "Start date in ISO 8601 format (default: now)" },
        end_date: { type: "string", description: "End date in ISO 8601 format (default: 30 days from now)" },
        limit: { type: "number", description: "Maximum events to return (default: 100)" },
      },
      required: [],
    },
  },
  {
    name: "calendar_create_event",
    description: "Create a new calendar event.",
    inputSchema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Event title" },
        start_date: { type: "string", description: "Start date/time in ISO 8601 format" },
        end_date: { type: "string", description: "End date/time (default: 1 hour after start)" },
        all_day: { type: "boolean", description: "Is this an all-day event? (default: false)" },
        calendar: { type: "string", description: "Calendar to add event to (default: first calendar)" },
        description: { type: "string", description: "Event description/notes" },
        location: { type: "string", description: "Event location" },
        url: { type: "string", description: "URL associated with the event" },
      },
      required: ["summary", "start_date"],
    },
  },
  {
    name: "calendar_update_event",
    description: "Update an existing calendar event.",
    inputSchema: {
      type: "object",
      properties: {
        event_id: { type: "string", description: "Event ID to update" },
        calendar: { type: "string", description: "Calendar containing the event" },
        summary: { type: "string", description: "New event title" },
        start_date: { type: "string", description: "New start date/time" },
        end_date: { type: "string", description: "New end date/time" },
        description: { type: "string", description: "New description" },
        location: { type: "string", description: "New location" },
        all_day: { type: "boolean", description: "Change all-day status" },
      },
      required: ["event_id", "calendar"],
    },
  },
  {
    name: "calendar_delete_event",
    description: "Delete a calendar event.",
    inputSchema: {
      type: "object",
      properties: {
        event_id: { type: "string", description: "Event ID to delete" },
        calendar: { type: "string", description: "Calendar containing the event" },
      },
      required: ["event_id", "calendar"],
    },
  },
  {
    name: "calendar_search",
    description: "Search for events by text in title, description, or location.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text to search for" },
        calendar: { type: "string", description: "Limit search to specific calendar (optional)" },
        limit: { type: "number", description: "Maximum results (default: 50)" },
      },
      required: ["query"],
    },
  },
  {
    name: "calendar_get_today",
    description: "Get all events scheduled for today.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "calendar_get_upcoming",
    description: "Get upcoming events within the next N days.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Number of days to look ahead (default: 7)" },
      },
      required: [],
    },
  },
];

// ============================================================================
// Tool Handler
// ============================================================================

async function handleToolCall(name: string, args: Record<string, any>): Promise<string> {
  switch (name) {
    case "calendar_check_permissions": {
      const status = await checkPermissions();
      return JSON.stringify(status, null, 2);
    }

    case "calendar_get_calendars": {
      const calendars = await getCalendars();
      return JSON.stringify(calendars, null, 2);
    }

    case "calendar_get_events": {
      const events = await getEvents({
        calendar: args.calendar,
        startDate: args.start_date,
        endDate: args.end_date,
        limit: args.limit,
      });
      return JSON.stringify(events, null, 2);
    }

    case "calendar_create_event": {
      if (!args.summary || !args.start_date) {
        throw new Error("summary and start_date are required");
      }
      const result = await createEvent({
        summary: args.summary,
        startDate: args.start_date,
        endDate: args.end_date,
        allDay: args.all_day,
        calendar: args.calendar,
        description: args.description,
        location: args.location,
        url: args.url,
      });
      return JSON.stringify(result, null, 2);
    }

    case "calendar_update_event": {
      if (!args.event_id || !args.calendar) {
        throw new Error("event_id and calendar are required");
      }
      const result = await updateEvent(args.event_id, args.calendar, {
        summary: args.summary,
        startDate: args.start_date,
        endDate: args.end_date,
        description: args.description,
        location: args.location,
        allDay: args.all_day,
      });
      return JSON.stringify(result, null, 2);
    }

    case "calendar_delete_event": {
      if (!args.event_id || !args.calendar) {
        throw new Error("event_id and calendar are required");
      }
      const result = await deleteEvent(args.event_id, args.calendar);
      return JSON.stringify(result, null, 2);
    }

    case "calendar_search": {
      if (!args.query) throw new Error("query is required");
      const events = await searchEvents(args.query, {
        calendar: args.calendar,
        limit: args.limit,
      });
      return JSON.stringify(events, null, 2);
    }

    case "calendar_get_today": {
      const events = await getTodayEvents();
      return JSON.stringify(events, null, 2);
    }

    case "calendar_get_upcoming": {
      const events = await getUpcomingEvents(args.days || 7);
      return JSON.stringify(events, null, 2);
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
    { name: "calendar-mcp", version: "1.0.0" },
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

  console.error("Calendar MCP server v1.0.0 running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
