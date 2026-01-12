#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync, exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

// Messages database path
const MESSAGES_DB_PATH = path.join(
  os.homedir(),
  "Library",
  "Messages",
  "chat.db"
);

// Tool definitions
const tools: Tool[] = [
  {
    name: "messages_get_recent",
    description:
      "Get recent messages from Apple Messages (iChat). Returns the most recent messages across all conversations.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of messages to return (default: 20)",
        },
      },
      required: [],
    },
  },
  {
    name: "messages_get_conversations",
    description:
      "Get a list of all conversations/chats from Apple Messages. Returns chat identifiers and display names.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of conversations to return (default: 50)",
        },
      },
      required: [],
    },
  },
  {
    name: "messages_get_chat",
    description:
      "Get messages from a specific conversation/chat by chat identifier (phone number or email).",
    inputSchema: {
      type: "object",
      properties: {
        chat_id: {
          type: "string",
          description:
            "The chat identifier (phone number like +1234567890 or email address)",
        },
        limit: {
          type: "number",
          description: "Maximum number of messages to return (default: 50)",
        },
      },
      required: ["chat_id"],
    },
  },
  {
    name: "messages_search",
    description:
      "Search for messages containing specific text across all conversations.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The text to search for in messages",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 20)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "messages_send",
    description:
      "Send a new message to a contact via Apple Messages. Requires Full Disk Access permission.",
    inputSchema: {
      type: "object",
      properties: {
        recipient: {
          type: "string",
          description:
            "The recipient's phone number (e.g., +1234567890) or email address",
        },
        message: {
          type: "string",
          description: "The message text to send",
        },
      },
      required: ["recipient", "message"],
    },
  },
  {
    name: "messages_get_contacts",
    description:
      "Get a list of contacts you have messaged, showing their identifiers and message counts.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of contacts to return (default: 50)",
        },
      },
      required: [],
    },
  },
];

// Helper function to run SQLite queries on the Messages database
async function queryMessagesDb(query: string): Promise<string> {
  try {
    const result = await execAsync(
      `sqlite3 -json "${MESSAGES_DB_PATH}" "${query.replace(/"/g, '\\"')}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    );
    return result.stdout;
  } catch (error: any) {
    if (error.message?.includes("unable to open database")) {
      throw new Error(
        "Cannot access Messages database. Please grant Full Disk Access permission to the terminal app in System Preferences > Security & Privacy > Privacy > Full Disk Access"
      );
    }
    throw error;
  }
}

// Helper function to convert Apple's timestamp format (nanoseconds since 2001-01-01)
function formatAppleTimestamp(timestamp: number): string {
  if (!timestamp) return "Unknown";
  // Apple uses nanoseconds since 2001-01-01
  const appleEpoch = new Date("2001-01-01T00:00:00Z").getTime();
  const date = new Date(appleEpoch + timestamp / 1000000);
  return date.toISOString();
}

// Get recent messages
async function getRecentMessages(limit: number = 20): Promise<any[]> {
  const query = `
    SELECT
      m.ROWID as id,
      m.text,
      m.date as timestamp,
      m.is_from_me,
      h.id as contact_id,
      c.display_name as chat_name
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
    LEFT JOIN chat c ON cmj.chat_id = c.ROWID
    WHERE m.text IS NOT NULL AND m.text != ''
    ORDER BY m.date DESC
    LIMIT ${limit}
  `;

  const result = await queryMessagesDb(query);
  if (!result.trim()) return [];

  try {
    const messages = JSON.parse(result);
    return messages.map((msg: any) => ({
      id: msg.id,
      text: msg.text,
      timestamp: formatAppleTimestamp(msg.timestamp),
      is_from_me: msg.is_from_me === 1,
      contact: msg.contact_id || "Unknown",
      chat_name: msg.chat_name || msg.contact_id || "Unknown",
    }));
  } catch {
    return [];
  }
}

// Get conversations
async function getConversations(limit: number = 50): Promise<any[]> {
  const query = `
    SELECT
      c.ROWID as id,
      c.chat_identifier,
      c.display_name,
      c.service_name,
      (SELECT COUNT(*) FROM chat_message_join WHERE chat_id = c.ROWID) as message_count,
      (SELECT MAX(m.date) FROM message m
       JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
       WHERE cmj.chat_id = c.ROWID) as last_message_date
    FROM chat c
    ORDER BY last_message_date DESC
    LIMIT ${limit}
  `;

  const result = await queryMessagesDb(query);
  if (!result.trim()) return [];

  try {
    const chats = JSON.parse(result);
    return chats.map((chat: any) => ({
      id: chat.id,
      identifier: chat.chat_identifier,
      display_name: chat.display_name || chat.chat_identifier,
      service: chat.service_name,
      message_count: chat.message_count,
      last_message: formatAppleTimestamp(chat.last_message_date),
    }));
  } catch {
    return [];
  }
}

// Get messages from a specific chat
async function getChatMessages(
  chatId: string,
  limit: number = 50
): Promise<any[]> {
  const query = `
    SELECT
      m.ROWID as id,
      m.text,
      m.date as timestamp,
      m.is_from_me,
      h.id as contact_id
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
    LEFT JOIN chat c ON cmj.chat_id = c.ROWID
    WHERE (c.chat_identifier LIKE '%${chatId.replace(/'/g, "''")}%'
           OR h.id LIKE '%${chatId.replace(/'/g, "''")}%')
      AND m.text IS NOT NULL AND m.text != ''
    ORDER BY m.date DESC
    LIMIT ${limit}
  `;

  const result = await queryMessagesDb(query);
  if (!result.trim()) return [];

  try {
    const messages = JSON.parse(result);
    return messages.map((msg: any) => ({
      id: msg.id,
      text: msg.text,
      timestamp: formatAppleTimestamp(msg.timestamp),
      is_from_me: msg.is_from_me === 1,
      contact: msg.contact_id || chatId,
    }));
  } catch {
    return [];
  }
}

// Search messages
async function searchMessages(
  query: string,
  limit: number = 20
): Promise<any[]> {
  const escapedQuery = query.replace(/'/g, "''");
  const sqlQuery = `
    SELECT
      m.ROWID as id,
      m.text,
      m.date as timestamp,
      m.is_from_me,
      h.id as contact_id,
      c.display_name as chat_name
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
    LEFT JOIN chat c ON cmj.chat_id = c.ROWID
    WHERE m.text LIKE '%${escapedQuery}%'
    ORDER BY m.date DESC
    LIMIT ${limit}
  `;

  const result = await queryMessagesDb(sqlQuery);
  if (!result.trim()) return [];

  try {
    const messages = JSON.parse(result);
    return messages.map((msg: any) => ({
      id: msg.id,
      text: msg.text,
      timestamp: formatAppleTimestamp(msg.timestamp),
      is_from_me: msg.is_from_me === 1,
      contact: msg.contact_id || "Unknown",
      chat_name: msg.chat_name || msg.contact_id || "Unknown",
    }));
  } catch {
    return [];
  }
}

// Send a message using AppleScript
async function sendMessage(
  recipient: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const escapedMessage = message.replace(/"/g, '\\"').replace(/\\/g, "\\\\");
  const escapedRecipient = recipient.replace(/"/g, '\\"');

  const appleScript = `
    tell application "Messages"
      set targetService to 1st service whose service type = iMessage
      set targetBuddy to buddy "${escapedRecipient}" of targetService
      send "${escapedMessage}" to targetBuddy
    end tell
  `;

  try {
    await execAsync(`osascript -e '${appleScript.replace(/'/g, "'\\''")}'`);
    return { success: true };
  } catch (error: any) {
    // Try SMS service if iMessage fails
    const smsScript = `
      tell application "Messages"
        set targetService to 1st service whose service type = SMS
        set targetBuddy to buddy "${escapedRecipient}" of targetService
        send "${escapedMessage}" to targetBuddy
      end tell
    `;

    try {
      await execAsync(`osascript -e '${smsScript.replace(/'/g, "'\\''")}'`);
      return { success: true };
    } catch (smsError: any) {
      return {
        success: false,
        error: `Failed to send message: ${error.message}. Please ensure Messages app is running and you have permission to send messages.`,
      };
    }
  }
}

// Get contacts
async function getContacts(limit: number = 50): Promise<any[]> {
  const query = `
    SELECT
      h.id as identifier,
      h.service,
      COUNT(m.ROWID) as message_count,
      MAX(m.date) as last_message_date
    FROM handle h
    LEFT JOIN message m ON h.ROWID = m.handle_id
    GROUP BY h.id
    ORDER BY last_message_date DESC
    LIMIT ${limit}
  `;

  const result = await queryMessagesDb(query);
  if (!result.trim()) return [];

  try {
    const contacts = JSON.parse(result);
    return contacts.map((contact: any) => ({
      identifier: contact.identifier,
      service: contact.service,
      message_count: contact.message_count,
      last_message: formatAppleTimestamp(contact.last_message_date),
    }));
  } catch {
    return [];
  }
}

// Handle tool calls
async function handleToolCall(
  name: string,
  args: Record<string, any>
): Promise<string> {
  switch (name) {
    case "messages_get_recent": {
      const limit = args.limit || 20;
      const messages = await getRecentMessages(limit);
      return JSON.stringify(messages, null, 2);
    }

    case "messages_get_conversations": {
      const limit = args.limit || 50;
      const conversations = await getConversations(limit);
      return JSON.stringify(conversations, null, 2);
    }

    case "messages_get_chat": {
      const chatId = args.chat_id;
      const limit = args.limit || 50;
      if (!chatId) {
        throw new Error("chat_id is required");
      }
      const messages = await getChatMessages(chatId, limit);
      return JSON.stringify(messages, null, 2);
    }

    case "messages_search": {
      const query = args.query;
      const limit = args.limit || 20;
      if (!query) {
        throw new Error("query is required");
      }
      const messages = await searchMessages(query, limit);
      return JSON.stringify(messages, null, 2);
    }

    case "messages_send": {
      const { recipient, message } = args;
      if (!recipient || !message) {
        throw new Error("recipient and message are required");
      }
      const result = await sendMessage(recipient, message);
      return JSON.stringify(result, null, 2);
    }

    case "messages_get_contacts": {
      const limit = args.limit || 50;
      const contacts = await getContacts(limit);
      return JSON.stringify(contacts, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Create and run the server
async function main() {
  const server = new Server(
    {
      name: "ichat-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleToolCall(name, args || {});
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("iChat MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
