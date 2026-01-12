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
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as https from "https";

const execAsync = promisify(exec);

// ============================================================================
// Configuration
// ============================================================================

const MESSAGES_DB_PATH = path.join(os.homedir(), "Library", "Messages", "chat.db");
const CONTACTS_DB_PATH = path.join(os.homedir(), "Library", "Application Support", "AddressBook", "Sources");
const SCHEDULED_MESSAGES_PATH = path.join(os.homedir(), ".imessage-mcp-scheduled.json");

// Optional OpenAI API key for semantic search (can be set via environment variable)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Contact cache for performance
const contactCache = new Map<string, string>();

// ============================================================================
// Phone Number Utilities
// ============================================================================

function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  const hasPlus = phone.startsWith("+");
  const digits = phone.replace(/\D/g, "");

  // Handle US numbers
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return hasPlus ? `+${digits}` : digits;
}

function validatePhoneNumber(phone: string): { valid: boolean; normalized: string; error?: string } {
  const normalized = normalizePhoneNumber(phone);
  const digits = normalized.replace(/\D/g, "");

  if (digits.length < 10) {
    return { valid: false, normalized, error: "Phone number too short (minimum 10 digits)" };
  }
  if (digits.length > 15) {
    return { valid: false, normalized, error: "Phone number too long (maximum 15 digits)" };
  }

  return { valid: true, normalized };
}

function isEmail(identifier: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
}

// ============================================================================
// Database Utilities
// ============================================================================

async function queryMessagesDb(query: string): Promise<string> {
  try {
    const result = await execAsync(
      `sqlite3 -json "${MESSAGES_DB_PATH}" "${query.replace(/"/g, '\\"')}"`,
      { maxBuffer: 50 * 1024 * 1024 }
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

function parseDbResult<T>(result: string): T[] {
  if (!result.trim()) return [];
  try {
    return JSON.parse(result);
  } catch {
    return [];
  }
}

// Apple timestamps are nanoseconds since 2001-01-01
const APPLE_EPOCH = new Date("2001-01-01T00:00:00Z").getTime();

function formatAppleTimestamp(timestamp: number): string {
  if (!timestamp) return "Unknown";
  const date = new Date(APPLE_EPOCH + timestamp / 1000000);
  return date.toISOString();
}

function appleTimestampFromDate(date: Date): number {
  return (date.getTime() - APPLE_EPOCH) * 1000000;
}

function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// ============================================================================
// Contact Resolution
// ============================================================================

async function getContactName(identifier: string): Promise<string | null> {
  // Check cache first
  if (contactCache.has(identifier)) {
    return contactCache.get(identifier) || null;
  }

  try {
    // Use AppleScript to query Contacts app
    const escapedId = identifier.replace(/"/g, '\\"').replace(/'/g, "'\\''");

    const script = `
      tell application "Contacts"
        set matchingPeople to {}
        try
          set matchingPeople to (people whose value of phones contains "${escapedId}")
        end try
        if (count of matchingPeople) = 0 then
          try
            set matchingPeople to (people whose value of emails contains "${escapedId}")
          end try
        end if
        if (count of matchingPeople) > 0 then
          set thePerson to item 1 of matchingPeople
          return (first name of thePerson) & " " & (last name of thePerson)
        else
          return ""
        end if
      end tell
    `;

    const result = await execAsync(`osascript -e '${script}'`, { timeout: 5000 });
    const name = result.stdout.trim();

    if (name && name !== " ") {
      contactCache.set(identifier, name);
      return name;
    }
  } catch {
    // Contacts access may be denied, continue without name
  }

  contactCache.set(identifier, "");
  return null;
}

async function enrichWithContactNames<T extends { contact?: string; contact_id?: string }>(
  items: T[]
): Promise<(T & { contact_name?: string })[]> {
  const results = await Promise.all(
    items.map(async (item) => {
      const identifier = item.contact || item.contact_id;
      if (identifier) {
        const name = await getContactName(identifier);
        return { ...item, contact_name: name || undefined };
      }
      return item;
    })
  );
  return results;
}

// ============================================================================
// Permission Checking
// ============================================================================

interface PermissionStatus {
  imessage_db: boolean;
  contacts: boolean;
  automation: boolean;
  full_disk_access: boolean;
  details: string[];
}

async function checkPermissions(): Promise<PermissionStatus> {
  const status: PermissionStatus = {
    imessage_db: false,
    contacts: false,
    automation: false,
    full_disk_access: false,
    details: [],
  };

  // Check Messages database access
  try {
    await execAsync(`sqlite3 "${MESSAGES_DB_PATH}" "SELECT 1 LIMIT 1"`);
    status.imessage_db = true;
    status.full_disk_access = true;
    status.details.push("Messages database: accessible");
  } catch {
    status.details.push("Messages database: NOT accessible (grant Full Disk Access)");
  }

  // Check Contacts access
  try {
    await execAsync(`osascript -e 'tell application "Contacts" to count people'`, { timeout: 5000 });
    status.contacts = true;
    status.details.push("Contacts: accessible");
  } catch {
    status.details.push("Contacts: NOT accessible (grant Contacts permission)");
  }

  // Check Automation access (Messages app)
  try {
    await execAsync(`osascript -e 'tell application "Messages" to count services'`, { timeout: 5000 });
    status.automation = true;
    status.details.push("Messages automation: accessible");
  } catch {
    status.details.push("Messages automation: NOT accessible (grant Automation permission)");
  }

  return status;
}

// ============================================================================
// iMessage Availability Check
// ============================================================================

async function checkiMessageAvailability(recipient: string): Promise<{
  available: boolean;
  service: "iMessage" | "SMS" | "unknown";
  details: string;
}> {
  const normalized = normalizePhoneNumber(recipient);

  // Check if we have an existing chat with this recipient
  const query = `
    SELECT c.service_name
    FROM chat c
    JOIN chat_handle_join chj ON c.ROWID = chj.chat_id
    JOIN handle h ON chj.handle_id = h.ROWID
    WHERE h.id LIKE '%${normalized.replace(/'/g, "''")}%'
    ORDER BY c.ROWID DESC
    LIMIT 1
  `;

  try {
    const result = await queryMessagesDb(query);
    const rows = parseDbResult<{ service_name: string }>(result);

    if (rows.length > 0) {
      const service = rows[0].service_name;
      if (service === "iMessage") {
        return { available: true, service: "iMessage", details: "Recipient uses iMessage" };
      } else if (service === "SMS") {
        return { available: true, service: "SMS", details: "Recipient uses SMS" };
      }
    }

    return { available: false, service: "unknown", details: "No previous conversation found - service unknown" };
  } catch (error: any) {
    return { available: false, service: "unknown", details: `Error checking: ${error.message}` };
  }
}

// ============================================================================
// Attachments
// ============================================================================

interface Attachment {
  id: number;
  filename: string;
  mime_type: string;
  file_size: number;
  filepath: string;
  is_outgoing: boolean;
  created_date: string;
}

async function getMessageAttachments(messageId: number): Promise<Attachment[]> {
  const query = `
    SELECT
      a.ROWID as id,
      a.filename,
      a.mime_type,
      a.total_bytes as file_size,
      a.filename as filepath,
      a.is_outgoing,
      a.created_date
    FROM attachment a
    JOIN message_attachment_join maj ON a.ROWID = maj.attachment_id
    WHERE maj.message_id = ${messageId}
  `;

  const result = await queryMessagesDb(query);
  const rows = parseDbResult<any>(result);

  return rows.map((row) => ({
    id: row.id,
    filename: row.filename ? path.basename(row.filename) : "unknown",
    mime_type: row.mime_type || "application/octet-stream",
    file_size: row.file_size || 0,
    filepath: row.filepath || "",
    is_outgoing: row.is_outgoing === 1,
    created_date: formatAppleTimestamp(row.created_date),
  }));
}

async function getAttachments(limit: number = 50, mimeFilter?: string): Promise<Attachment[]> {
  let query = `
    SELECT
      a.ROWID as id,
      a.filename,
      a.mime_type,
      a.total_bytes as file_size,
      a.filename as filepath,
      a.is_outgoing,
      a.created_date
    FROM attachment a
    WHERE a.filename IS NOT NULL
  `;

  if (mimeFilter) {
    query += ` AND a.mime_type LIKE '%${mimeFilter.replace(/'/g, "''")}%'`;
  }

  query += ` ORDER BY a.created_date DESC LIMIT ${limit}`;

  const result = await queryMessagesDb(query);
  const rows = parseDbResult<any>(result);

  return rows.map((row) => ({
    id: row.id,
    filename: row.filename ? path.basename(row.filename) : "unknown",
    mime_type: row.mime_type || "application/octet-stream",
    file_size: row.file_size || 0,
    filepath: row.filepath || "",
    is_outgoing: row.is_outgoing === 1,
    created_date: formatAppleTimestamp(row.created_date),
  }));
}

// ============================================================================
// Reactions / Tapbacks
// ============================================================================

const TAPBACK_TYPES: Record<number, string> = {
  2000: "love",
  2001: "like",
  2002: "dislike",
  2003: "laugh",
  2004: "emphasis",
  2005: "question",
  3000: "remove_love",
  3001: "remove_like",
  3002: "remove_dislike",
  3003: "remove_laugh",
  3004: "remove_emphasis",
  3005: "remove_question",
};

interface Reaction {
  type: string;
  from_me: boolean;
  contact: string;
  timestamp: string;
}

async function getMessageReactions(messageId: number): Promise<Reaction[]> {
  const query = `
    SELECT
      m.associated_message_type as type,
      m.is_from_me,
      h.id as contact_id,
      m.date as timestamp
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    WHERE m.associated_message_guid IS NOT NULL
      AND m.associated_message_id = ${messageId}
  `;

  const result = await queryMessagesDb(query);
  const rows = parseDbResult<any>(result);

  return rows.map((row) => ({
    type: TAPBACK_TYPES[row.type] || `unknown_${row.type}`,
    from_me: row.is_from_me === 1,
    contact: row.contact_id || "Unknown",
    timestamp: formatAppleTimestamp(row.timestamp),
  }));
}

// ============================================================================
// Read Receipts
// ============================================================================

interface ReadReceiptInfo {
  is_read: boolean;
  is_delivered: boolean;
  date_read: string | null;
  date_delivered: string | null;
}

async function getReadReceipt(messageId: number): Promise<ReadReceiptInfo> {
  const query = `
    SELECT
      is_read,
      is_delivered,
      date_read,
      date_delivered
    FROM message
    WHERE ROWID = ${messageId}
  `;

  const result = await queryMessagesDb(query);
  const rows = parseDbResult<any>(result);

  if (rows.length === 0) {
    return { is_read: false, is_delivered: false, date_read: null, date_delivered: null };
  }

  const row = rows[0];
  return {
    is_read: row.is_read === 1,
    is_delivered: row.is_delivered === 1,
    date_read: row.date_read ? formatAppleTimestamp(row.date_read) : null,
    date_delivered: row.date_delivered ? formatAppleTimestamp(row.date_delivered) : null,
  };
}

// ============================================================================
// Group Chats
// ============================================================================

interface GroupChat {
  id: number;
  identifier: string;
  display_name: string;
  participants: string[];
  participant_names: string[];
  message_count: number;
  last_message: string;
  is_group: boolean;
}

async function getGroupChats(limit: number = 50): Promise<GroupChat[]> {
  const query = `
    SELECT
      c.ROWID as id,
      c.chat_identifier as identifier,
      c.display_name,
      c.service_name,
      (SELECT COUNT(*) FROM chat_message_join WHERE chat_id = c.ROWID) as message_count,
      (SELECT MAX(m.date) FROM message m
       JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
       WHERE cmj.chat_id = c.ROWID) as last_message_date,
      (SELECT GROUP_CONCAT(h.id, '|') FROM handle h
       JOIN chat_handle_join chj ON h.ROWID = chj.handle_id
       WHERE chj.chat_id = c.ROWID) as participants
    FROM chat c
    WHERE c.chat_identifier LIKE 'chat%'
    ORDER BY last_message_date DESC
    LIMIT ${limit}
  `;

  const result = await queryMessagesDb(query);
  const rows = parseDbResult<any>(result);

  const groupChats = await Promise.all(
    rows.map(async (row) => {
      const participants = row.participants ? row.participants.split("|") : [];
      const participantNames = await Promise.all(
        participants.map(async (p: string) => (await getContactName(p)) || p)
      );

      return {
        id: row.id,
        identifier: row.identifier,
        display_name: row.display_name || "Group Chat",
        participants,
        participant_names: participantNames,
        message_count: row.message_count,
        last_message: formatAppleTimestamp(row.last_message_date),
        is_group: true,
      };
    })
  );

  return groupChats;
}

// ============================================================================
// Message Context
// ============================================================================

async function getMessageContext(
  messageId: number,
  before: number = 5,
  after: number = 5
): Promise<{ before: any[]; message: any; after: any[] }> {
  // Get the target message's chat and date
  const targetQuery = `
    SELECT m.date, cmj.chat_id
    FROM message m
    JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
    WHERE m.ROWID = ${messageId}
  `;

  const targetResult = await queryMessagesDb(targetQuery);
  const targetRows = parseDbResult<any>(targetResult);

  if (targetRows.length === 0) {
    throw new Error("Message not found");
  }

  const { date: targetDate, chat_id: chatId } = targetRows[0];

  // Get messages before
  const beforeQuery = `
    SELECT
      m.ROWID as id,
      m.text,
      m.date as timestamp,
      m.is_from_me,
      h.id as contact_id
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
    WHERE cmj.chat_id = ${chatId}
      AND m.date < ${targetDate}
      AND m.text IS NOT NULL
    ORDER BY m.date DESC
    LIMIT ${before}
  `;

  // Get messages after
  const afterQuery = `
    SELECT
      m.ROWID as id,
      m.text,
      m.date as timestamp,
      m.is_from_me,
      h.id as contact_id
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
    WHERE cmj.chat_id = ${chatId}
      AND m.date > ${targetDate}
      AND m.text IS NOT NULL
    ORDER BY m.date ASC
    LIMIT ${after}
  `;

  // Get the message itself
  const messageQuery = `
    SELECT
      m.ROWID as id,
      m.text,
      m.date as timestamp,
      m.is_from_me,
      h.id as contact_id
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    WHERE m.ROWID = ${messageId}
  `;

  const [beforeResult, afterResult, messageResult] = await Promise.all([
    queryMessagesDb(beforeQuery),
    queryMessagesDb(afterQuery),
    queryMessagesDb(messageQuery),
  ]);

  const formatMessage = (msg: any) => ({
    id: msg.id,
    text: msg.text,
    timestamp: formatAppleTimestamp(msg.timestamp),
    is_from_me: msg.is_from_me === 1,
    contact: msg.contact_id || "Unknown",
  });

  const beforeMessages = parseDbResult<any>(beforeResult).map(formatMessage).reverse();
  const afterMessages = parseDbResult<any>(afterResult).map(formatMessage);
  const message = parseDbResult<any>(messageResult).map(formatMessage)[0];

  return { before: beforeMessages, message, after: afterMessages };
}

// ============================================================================
// Full-Text Search
// ============================================================================

async function searchMessagesFTS(
  query: string,
  options: {
    limit?: number;
    startDate?: string;
    endDate?: string;
    contact?: string;
    chatId?: string;
  } = {}
): Promise<any[]> {
  const { limit = 50, startDate, endDate, contact, chatId } = options;
  const escapedQuery = query.replace(/'/g, "''");

  let whereConditions = [`m.text LIKE '%${escapedQuery}%'`];

  if (startDate) {
    const date = parseDate(startDate);
    if (date) {
      whereConditions.push(`m.date >= ${appleTimestampFromDate(date)}`);
    }
  }

  if (endDate) {
    const date = parseDate(endDate);
    if (date) {
      whereConditions.push(`m.date <= ${appleTimestampFromDate(date)}`);
    }
  }

  if (contact) {
    const normalizedContact = normalizePhoneNumber(contact);
    whereConditions.push(`h.id LIKE '%${normalizedContact.replace(/'/g, "''")}%'`);
  }

  if (chatId) {
    whereConditions.push(`c.chat_identifier = '${chatId.replace(/'/g, "''")}'`);
  }

  const sqlQuery = `
    SELECT
      m.ROWID as id,
      m.text,
      m.date as timestamp,
      m.is_from_me,
      m.is_read,
      m.is_delivered,
      h.id as contact_id,
      c.display_name as chat_name,
      c.chat_identifier
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
    LEFT JOIN chat c ON cmj.chat_id = c.ROWID
    WHERE ${whereConditions.join(" AND ")}
    ORDER BY m.date DESC
    LIMIT ${limit}
  `;

  const result = await queryMessagesDb(sqlQuery);
  const rows = parseDbResult<any>(result);

  return rows.map((msg) => ({
    id: msg.id,
    text: msg.text,
    timestamp: formatAppleTimestamp(msg.timestamp),
    is_from_me: msg.is_from_me === 1,
    is_read: msg.is_read === 1,
    is_delivered: msg.is_delivered === 1,
    contact: msg.contact_id || "Unknown",
    chat_name: msg.chat_name || msg.contact_id || "Unknown",
    chat_identifier: msg.chat_identifier,
  }));
}

// ============================================================================
// Semantic Search (Optional - requires OpenAI API key)
// ============================================================================

async function getEmbedding(text: string): Promise<number[] | null> {
  if (!OPENAI_API_KEY) {
    return null;
  }

  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    });

    const options = {
      hostname: "api.openai.com",
      port: 443,
      path: "/v1/embeddings",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const response = JSON.parse(body);
          if (response.data && response.data[0]) {
            resolve(response.data[0].embedding);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on("error", () => resolve(null));
    req.write(data);
    req.end();
  });
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function semanticSearch(
  query: string,
  limit: number = 20
): Promise<{ results: any[]; method: "semantic" | "keyword" }> {
  const queryEmbedding = await getEmbedding(query);

  if (!queryEmbedding) {
    // Fallback to keyword search
    const results = await searchMessagesFTS(query, { limit });
    return { results, method: "keyword" };
  }

  // Get recent messages for semantic search
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
    WHERE m.text IS NOT NULL AND m.text != '' AND length(m.text) > 10
    ORDER BY m.date DESC
    LIMIT 500
  `;

  const result = await queryMessagesDb(sqlQuery);
  const messages = parseDbResult<any>(result);

  // Get embeddings for messages and calculate similarity
  const scoredMessages = await Promise.all(
    messages.map(async (msg) => {
      const embedding = await getEmbedding(msg.text);
      const similarity = embedding ? cosineSimilarity(queryEmbedding, embedding) : 0;
      return { ...msg, similarity };
    })
  );

  // Sort by similarity and return top results
  const sortedMessages = scoredMessages
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return {
    results: sortedMessages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      timestamp: formatAppleTimestamp(msg.timestamp),
      is_from_me: msg.is_from_me === 1,
      contact: msg.contact_id || "Unknown",
      chat_name: msg.chat_name || msg.contact_id || "Unknown",
      similarity_score: msg.similarity.toFixed(4),
    })),
    method: "semantic",
  };
}

// ============================================================================
// Core Message Functions
// ============================================================================

async function getRecentMessages(
  limit: number = 20,
  options: { startDate?: string; endDate?: string; includeAttachments?: boolean } = {}
): Promise<any[]> {
  const { startDate, endDate, includeAttachments } = options;

  let whereConditions = ["m.text IS NOT NULL AND m.text != ''"];

  if (startDate) {
    const date = parseDate(startDate);
    if (date) whereConditions.push(`m.date >= ${appleTimestampFromDate(date)}`);
  }

  if (endDate) {
    const date = parseDate(endDate);
    if (date) whereConditions.push(`m.date <= ${appleTimestampFromDate(date)}`);
  }

  const query = `
    SELECT
      m.ROWID as id,
      m.text,
      m.date as timestamp,
      m.is_from_me,
      m.is_read,
      m.is_delivered,
      m.cache_has_attachments as has_attachments,
      h.id as contact_id,
      c.display_name as chat_name,
      c.chat_identifier
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
    LEFT JOIN chat c ON cmj.chat_id = c.ROWID
    WHERE ${whereConditions.join(" AND ")}
    ORDER BY m.date DESC
    LIMIT ${limit}
  `;

  const result = await queryMessagesDb(query);
  const rows = parseDbResult<any>(result);

  const messages = await Promise.all(
    rows.map(async (msg) => {
      const base = {
        id: msg.id,
        text: msg.text,
        timestamp: formatAppleTimestamp(msg.timestamp),
        is_from_me: msg.is_from_me === 1,
        is_read: msg.is_read === 1,
        is_delivered: msg.is_delivered === 1,
        contact: msg.contact_id || "Unknown",
        contact_name: (await getContactName(msg.contact_id)) || undefined,
        chat_name: msg.chat_name || msg.contact_id || "Unknown",
        chat_identifier: msg.chat_identifier,
        has_attachments: msg.has_attachments === 1,
      };

      if (includeAttachments && msg.has_attachments) {
        const attachments = await getMessageAttachments(msg.id);
        return { ...base, attachments };
      }

      return base;
    })
  );

  return messages;
}

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
       WHERE cmj.chat_id = c.ROWID) as last_message_date,
      (SELECT m.text FROM message m
       JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
       WHERE cmj.chat_id = c.ROWID
       ORDER BY m.date DESC LIMIT 1) as last_message_text,
      (SELECT COUNT(DISTINCT h.ROWID) FROM handle h
       JOIN chat_handle_join chj ON h.ROWID = chj.handle_id
       WHERE chj.chat_id = c.ROWID) as participant_count
    FROM chat c
    ORDER BY last_message_date DESC
    LIMIT ${limit}
  `;

  const result = await queryMessagesDb(query);
  const rows = parseDbResult<any>(result);

  return Promise.all(
    rows.map(async (chat) => {
      const isGroup = chat.chat_identifier?.startsWith("chat") || chat.participant_count > 1;
      let contactName = null;

      if (!isGroup && chat.chat_identifier) {
        contactName = await getContactName(chat.chat_identifier);
      }

      return {
        id: chat.id,
        identifier: chat.chat_identifier,
        display_name: chat.display_name || contactName || chat.chat_identifier,
        contact_name: contactName,
        service: chat.service_name,
        message_count: chat.message_count,
        participant_count: chat.participant_count,
        is_group: isGroup,
        last_message: formatAppleTimestamp(chat.last_message_date),
        last_message_preview: chat.last_message_text?.substring(0, 100),
      };
    })
  );
}

async function getChatMessages(
  chatId: string,
  options: { limit?: number; startDate?: string; endDate?: string; includeAttachments?: boolean } = {}
): Promise<any[]> {
  const { limit = 50, startDate, endDate, includeAttachments } = options;
  const normalizedId = isEmail(chatId) ? chatId : normalizePhoneNumber(chatId);

  let whereConditions = [
    `(c.chat_identifier LIKE '%${normalizedId.replace(/'/g, "''")}%' OR h.id LIKE '%${normalizedId.replace(/'/g, "''")}%')`,
    "m.text IS NOT NULL AND m.text != ''",
  ];

  if (startDate) {
    const date = parseDate(startDate);
    if (date) whereConditions.push(`m.date >= ${appleTimestampFromDate(date)}`);
  }

  if (endDate) {
    const date = parseDate(endDate);
    if (date) whereConditions.push(`m.date <= ${appleTimestampFromDate(date)}`);
  }

  const query = `
    SELECT
      m.ROWID as id,
      m.text,
      m.date as timestamp,
      m.is_from_me,
      m.is_read,
      m.is_delivered,
      m.cache_has_attachments as has_attachments,
      h.id as contact_id
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
    LEFT JOIN chat c ON cmj.chat_id = c.ROWID
    WHERE ${whereConditions.join(" AND ")}
    ORDER BY m.date DESC
    LIMIT ${limit}
  `;

  const result = await queryMessagesDb(query);
  const rows = parseDbResult<any>(result);

  return Promise.all(
    rows.map(async (msg) => {
      const base = {
        id: msg.id,
        text: msg.text,
        timestamp: formatAppleTimestamp(msg.timestamp),
        is_from_me: msg.is_from_me === 1,
        is_read: msg.is_read === 1,
        is_delivered: msg.is_delivered === 1,
        contact: msg.contact_id || chatId,
        contact_name: (await getContactName(msg.contact_id)) || undefined,
        has_attachments: msg.has_attachments === 1,
      };

      if (includeAttachments && msg.has_attachments) {
        const attachments = await getMessageAttachments(msg.id);
        return { ...base, attachments };
      }

      return base;
    })
  );
}

async function sendMessage(
  recipient: string,
  message: string
): Promise<{ success: boolean; service?: string; error?: string }> {
  // Validate recipient
  if (!isEmail(recipient)) {
    const validation = validatePhoneNumber(recipient);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    recipient = validation.normalized;
  }

  const escapedMessage = message.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const escapedRecipient = recipient.replace(/"/g, '\\"');

  // Try iMessage first
  const imessageScript = `
    tell application "Messages"
      set targetService to 1st service whose service type = iMessage
      set targetBuddy to buddy "${escapedRecipient}" of targetService
      send "${escapedMessage}" to targetBuddy
    end tell
  `;

  try {
    await execAsync(`osascript -e '${imessageScript.replace(/'/g, "'\\''")}'`);
    return { success: true, service: "iMessage" };
  } catch {
    // Try SMS as fallback
    const smsScript = `
      tell application "Messages"
        set targetService to 1st service whose service type = SMS
        set targetBuddy to buddy "${escapedRecipient}" of targetService
        send "${escapedMessage}" to targetBuddy
      end tell
    `;

    try {
      await execAsync(`osascript -e '${smsScript.replace(/'/g, "'\\''")}'`);
      return { success: true, service: "SMS" };
    } catch (smsError: any) {
      return {
        success: false,
        error: `Failed to send message. Ensure Messages app is running and you have automation permission. Error: ${smsError.message}`,
      };
    }
  }
}

async function getContacts(limit: number = 50): Promise<any[]> {
  const query = `
    SELECT
      h.id as identifier,
      h.service,
      COUNT(m.ROWID) as message_count,
      MAX(m.date) as last_message_date,
      SUM(CASE WHEN m.is_from_me = 1 THEN 1 ELSE 0 END) as sent_count,
      SUM(CASE WHEN m.is_from_me = 0 THEN 1 ELSE 0 END) as received_count
    FROM handle h
    LEFT JOIN message m ON h.ROWID = m.handle_id
    GROUP BY h.id
    HAVING message_count > 0
    ORDER BY last_message_date DESC
    LIMIT ${limit}
  `;

  const result = await queryMessagesDb(query);
  const rows = parseDbResult<any>(result);

  return Promise.all(
    rows.map(async (contact) => ({
      identifier: contact.identifier,
      name: (await getContactName(contact.identifier)) || undefined,
      service: contact.service,
      message_count: contact.message_count,
      sent_count: contact.sent_count,
      received_count: contact.received_count,
      last_message: formatAppleTimestamp(contact.last_message_date),
    }))
  );
}

// ============================================================================
// Open Messages App
// ============================================================================

async function openMessages(): Promise<{ success: boolean; error?: string }> {
  try {
    await execAsync(`open -a Messages`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function openConversation(recipient: string): Promise<{ success: boolean; error?: string }> {
  // Normalize recipient
  if (!isEmail(recipient)) {
    const validation = validatePhoneNumber(recipient);
    if (validation.valid) {
      recipient = validation.normalized;
    }
  }

  const escapedRecipient = recipient.replace(/"/g, '\\"');

  const script = `
    tell application "Messages"
      activate
      try
        set targetService to 1st service whose service type = iMessage
        set targetBuddy to buddy "${escapedRecipient}" of targetService
        set targetChat to make new text chat with properties {participants:{targetBuddy}}
      end try
    end tell
  `;

  try {
    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, { timeout: 10000 });
    return { success: true };
  } catch (error: any) {
    // Even if the script fails, try to just open Messages
    await execAsync(`open -a Messages`);
    return { success: true };
  }
}

// ============================================================================
// Scheduled Messages
// ============================================================================

interface ScheduledMessage {
  id: string;
  recipient: string;
  message: string;
  scheduledTime: string;
  created: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  error?: string;
}

async function loadScheduledMessages(): Promise<ScheduledMessage[]> {
  try {
    if (fs.existsSync(SCHEDULED_MESSAGES_PATH)) {
      const data = fs.readFileSync(SCHEDULED_MESSAGES_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch {
    // File doesn't exist or is invalid
  }
  return [];
}

async function saveScheduledMessages(messages: ScheduledMessage[]): Promise<void> {
  fs.writeFileSync(SCHEDULED_MESSAGES_PATH, JSON.stringify(messages, null, 2));
}

async function scheduleMessage(
  recipient: string,
  message: string,
  scheduledTime: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  // Validate recipient
  if (!isEmail(recipient)) {
    const validation = validatePhoneNumber(recipient);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    recipient = validation.normalized;
  }

  // Validate scheduled time
  const scheduledDate = new Date(scheduledTime);
  if (isNaN(scheduledDate.getTime())) {
    return { success: false, error: "Invalid scheduled time format" };
  }

  if (scheduledDate <= new Date()) {
    return { success: false, error: "Scheduled time must be in the future" };
  }

  const scheduled: ScheduledMessage = {
    id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    recipient,
    message,
    scheduledTime: scheduledDate.toISOString(),
    created: new Date().toISOString(),
    status: "pending",
  };

  const messages = await loadScheduledMessages();
  messages.push(scheduled);
  await saveScheduledMessages(messages);

  return { success: true, id: scheduled.id };
}

async function getScheduledMessages(): Promise<ScheduledMessage[]> {
  return loadScheduledMessages();
}

async function cancelScheduledMessage(id: string): Promise<{ success: boolean; error?: string }> {
  const messages = await loadScheduledMessages();
  const index = messages.findIndex((m) => m.id === id);

  if (index === -1) {
    return { success: false, error: "Scheduled message not found" };
  }

  if (messages[index].status !== "pending") {
    return { success: false, error: `Cannot cancel message with status: ${messages[index].status}` };
  }

  messages[index].status = "cancelled";
  await saveScheduledMessages(messages);

  return { success: true };
}

async function sendScheduledMessages(): Promise<{ sent: number; failed: number; results: any[] }> {
  const messages = await loadScheduledMessages();
  const now = new Date();
  const results: any[] = [];
  let sent = 0;
  let failed = 0;

  for (const msg of messages) {
    if (msg.status !== "pending") continue;

    const scheduledTime = new Date(msg.scheduledTime);
    if (scheduledTime <= now) {
      // Time to send
      const result = await sendMessage(msg.recipient, msg.message);

      if (result.success) {
        msg.status = "sent";
        sent++;
        results.push({ id: msg.id, status: "sent", recipient: msg.recipient });
      } else {
        msg.status = "failed";
        msg.error = result.error;
        failed++;
        results.push({ id: msg.id, status: "failed", error: result.error });
      }
    }
  }

  await saveScheduledMessages(messages);

  return { sent, failed, results };
}

// ============================================================================
// Tool Definitions
// ============================================================================

const tools: Tool[] = [
  {
    name: "imessage_check_permissions",
    description: "Check what permissions are available for the iMessage MCP server (Messages database, Contacts, Automation).",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "imessage_get_recent",
    description: "Get recent messages from Apple Messages with optional date filtering and attachment info.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum number of messages (default: 20)" },
        start_date: { type: "string", description: "Filter messages after this date (ISO 8601 format)" },
        end_date: { type: "string", description: "Filter messages before this date (ISO 8601 format)" },
        include_attachments: { type: "boolean", description: "Include attachment details (default: false)" },
      },
      required: [],
    },
  },
  {
    name: "imessage_get_conversations",
    description: "Get all conversations with contact names, message counts, and last message preview.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum number of conversations (default: 50)" },
      },
      required: [],
    },
  },
  {
    name: "imessage_get_chat",
    description: "Get messages from a specific conversation with date filtering and attachment support.",
    inputSchema: {
      type: "object",
      properties: {
        chat_id: { type: "string", description: "Phone number (e.g., +1234567890) or email address" },
        limit: { type: "number", description: "Maximum number of messages (default: 50)" },
        start_date: { type: "string", description: "Filter messages after this date (ISO 8601)" },
        end_date: { type: "string", description: "Filter messages before this date (ISO 8601)" },
        include_attachments: { type: "boolean", description: "Include attachment details" },
      },
      required: ["chat_id"],
    },
  },
  {
    name: "imessage_search",
    description: "Search messages with text query, date range, and contact filters.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text to search for" },
        limit: { type: "number", description: "Maximum results (default: 50)" },
        start_date: { type: "string", description: "Filter after this date (ISO 8601)" },
        end_date: { type: "string", description: "Filter before this date (ISO 8601)" },
        contact: { type: "string", description: "Filter by contact phone/email" },
        chat_id: { type: "string", description: "Filter by specific chat" },
      },
      required: ["query"],
    },
  },
  {
    name: "imessage_semantic_search",
    description: "Search messages by meaning/concept using AI embeddings. Falls back to keyword search if no API key. Set OPENAI_API_KEY env var for semantic search.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Concept or meaning to search for" },
        limit: { type: "number", description: "Maximum results (default: 20)" },
      },
      required: ["query"],
    },
  },
  {
    name: "imessage_send",
    description: "Send a message via iMessage (with SMS fallback). Validates phone numbers automatically.",
    inputSchema: {
      type: "object",
      properties: {
        recipient: { type: "string", description: "Phone number or email address" },
        message: { type: "string", description: "Message text to send" },
      },
      required: ["recipient", "message"],
    },
  },
  {
    name: "imessage_check_imessage",
    description: "Check if a recipient uses iMessage or SMS based on chat history.",
    inputSchema: {
      type: "object",
      properties: {
        recipient: { type: "string", description: "Phone number or email to check" },
      },
      required: ["recipient"],
    },
  },
  {
    name: "imessage_get_contacts",
    description: "Get contacts you've messaged with names, message counts, and activity stats.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum contacts (default: 50)" },
      },
      required: [],
    },
  },
  {
    name: "imessage_get_group_chats",
    description: "Get all group conversations with participants and their names.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum groups (default: 50)" },
      },
      required: [],
    },
  },
  {
    name: "imessage_get_context",
    description: "Get messages surrounding a specific message for context.",
    inputSchema: {
      type: "object",
      properties: {
        message_id: { type: "number", description: "The message ID to get context for" },
        before: { type: "number", description: "Messages before (default: 5)" },
        after: { type: "number", description: "Messages after (default: 5)" },
      },
      required: ["message_id"],
    },
  },
  {
    name: "imessage_get_attachments",
    description: "Get attachments from messages, optionally filtered by type.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum attachments (default: 50)" },
        mime_filter: { type: "string", description: "Filter by MIME type (e.g., 'image', 'video', 'pdf')" },
        message_id: { type: "number", description: "Get attachments for specific message" },
      },
      required: [],
    },
  },
  {
    name: "imessage_get_reactions",
    description: "Get tapback reactions (love, like, laugh, etc.) for a specific message.",
    inputSchema: {
      type: "object",
      properties: {
        message_id: { type: "number", description: "The message ID to get reactions for" },
      },
      required: ["message_id"],
    },
  },
  {
    name: "imessage_get_read_receipt",
    description: "Get read/delivered status for a specific message.",
    inputSchema: {
      type: "object",
      properties: {
        message_id: { type: "number", description: "The message ID to check" },
      },
      required: ["message_id"],
    },
  },
  {
    name: "imessage_validate_phone",
    description: "Validate and normalize a phone number.",
    inputSchema: {
      type: "object",
      properties: {
        phone: { type: "string", description: "Phone number to validate" },
      },
      required: ["phone"],
    },
  },
  {
    name: "imessage_lookup_contact",
    description: "Look up a contact's name from their phone number or email.",
    inputSchema: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "Phone number or email address" },
      },
      required: ["identifier"],
    },
  },
  {
    name: "imessage_open",
    description: "Open the Messages app.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "imessage_open_conversation",
    description: "Open a conversation with a specific contact in Messages.",
    inputSchema: {
      type: "object",
      properties: {
        recipient: { type: "string", description: "Phone number or email address" },
      },
      required: ["recipient"],
    },
  },
  {
    name: "imessage_schedule_send",
    description: "Schedule a message to be sent at a future time.",
    inputSchema: {
      type: "object",
      properties: {
        recipient: { type: "string", description: "Phone number or email address" },
        message: { type: "string", description: "Message content to send" },
        scheduled_time: { type: "string", description: "When to send (ISO 8601 format, e.g., 2024-12-25T10:00:00)" },
      },
      required: ["recipient", "message", "scheduled_time"],
    },
  },
  {
    name: "imessage_get_scheduled",
    description: "Get all scheduled messages.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "imessage_cancel_scheduled",
    description: "Cancel a scheduled message.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The scheduled message ID to cancel" },
      },
      required: ["id"],
    },
  },
  {
    name: "imessage_send_scheduled_now",
    description: "Send all scheduled messages that are due (scheduled time has passed).",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// ============================================================================
// Tool Handler
// ============================================================================

async function handleToolCall(name: string, args: Record<string, any>): Promise<string> {
  switch (name) {
    case "imessage_check_permissions": {
      const status = await checkPermissions();
      return JSON.stringify(status, null, 2);
    }

    case "imessage_get_recent": {
      const messages = await getRecentMessages(args.limit || 20, {
        startDate: args.start_date,
        endDate: args.end_date,
        includeAttachments: args.include_attachments,
      });
      return JSON.stringify(messages, null, 2);
    }

    case "imessage_get_conversations": {
      const conversations = await getConversations(args.limit || 50);
      return JSON.stringify(conversations, null, 2);
    }

    case "imessage_get_chat": {
      if (!args.chat_id) throw new Error("chat_id is required");
      const messages = await getChatMessages(args.chat_id, {
        limit: args.limit,
        startDate: args.start_date,
        endDate: args.end_date,
        includeAttachments: args.include_attachments,
      });
      return JSON.stringify(messages, null, 2);
    }

    case "imessage_search": {
      if (!args.query) throw new Error("query is required");
      const messages = await searchMessagesFTS(args.query, {
        limit: args.limit,
        startDate: args.start_date,
        endDate: args.end_date,
        contact: args.contact,
        chatId: args.chat_id,
      });
      return JSON.stringify(messages, null, 2);
    }

    case "imessage_semantic_search": {
      if (!args.query) throw new Error("query is required");
      const result = await semanticSearch(args.query, args.limit || 20);
      return JSON.stringify({
        search_method: result.method,
        note: result.method === "keyword" ? "Set OPENAI_API_KEY env var for semantic search" : undefined,
        results: result.results,
      }, null, 2);
    }

    case "imessage_send": {
      if (!args.recipient || !args.message) throw new Error("recipient and message are required");
      const result = await sendMessage(args.recipient, args.message);
      return JSON.stringify(result, null, 2);
    }

    case "imessage_check_imessage": {
      if (!args.recipient) throw new Error("recipient is required");
      const result = await checkiMessageAvailability(args.recipient);
      return JSON.stringify(result, null, 2);
    }

    case "imessage_get_contacts": {
      const contacts = await getContacts(args.limit || 50);
      return JSON.stringify(contacts, null, 2);
    }

    case "imessage_get_group_chats": {
      const groups = await getGroupChats(args.limit || 50);
      return JSON.stringify(groups, null, 2);
    }

    case "imessage_get_context": {
      if (!args.message_id) throw new Error("message_id is required");
      const context = await getMessageContext(args.message_id, args.before || 5, args.after || 5);
      return JSON.stringify(context, null, 2);
    }

    case "imessage_get_attachments": {
      if (args.message_id) {
        const attachments = await getMessageAttachments(args.message_id);
        return JSON.stringify(attachments, null, 2);
      }
      const attachments = await getAttachments(args.limit || 50, args.mime_filter);
      return JSON.stringify(attachments, null, 2);
    }

    case "imessage_get_reactions": {
      if (!args.message_id) throw new Error("message_id is required");
      const reactions = await getMessageReactions(args.message_id);
      return JSON.stringify(reactions, null, 2);
    }

    case "imessage_get_read_receipt": {
      if (!args.message_id) throw new Error("message_id is required");
      const receipt = await getReadReceipt(args.message_id);
      return JSON.stringify(receipt, null, 2);
    }

    case "imessage_validate_phone": {
      if (!args.phone) throw new Error("phone is required");
      const result = validatePhoneNumber(args.phone);
      return JSON.stringify(result, null, 2);
    }

    case "imessage_lookup_contact": {
      if (!args.identifier) throw new Error("identifier is required");
      const normalized = isEmail(args.identifier) ? args.identifier : normalizePhoneNumber(args.identifier);
      const name = await getContactName(normalized);
      return JSON.stringify({
        identifier: args.identifier,
        normalized: normalized,
        name: name || null,
        found: !!name,
      }, null, 2);
    }

    case "imessage_open": {
      const result = await openMessages();
      return JSON.stringify(result, null, 2);
    }

    case "imessage_open_conversation": {
      if (!args.recipient) throw new Error("recipient is required");
      const result = await openConversation(args.recipient);
      return JSON.stringify(result, null, 2);
    }

    case "imessage_schedule_send": {
      if (!args.recipient || !args.message || !args.scheduled_time) {
        throw new Error("recipient, message, and scheduled_time are required");
      }
      const result = await scheduleMessage(args.recipient, args.message, args.scheduled_time);
      return JSON.stringify(result, null, 2);
    }

    case "imessage_get_scheduled": {
      const scheduled = await getScheduledMessages();
      return JSON.stringify(scheduled, null, 2);
    }

    case "imessage_cancel_scheduled": {
      if (!args.id) throw new Error("id is required");
      const result = await cancelScheduledMessage(args.id);
      return JSON.stringify(result, null, 2);
    }

    case "imessage_send_scheduled_now": {
      const result = await sendScheduledMessages();
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
    { name: "imessage-mcp", version: "3.0.0" },
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

  console.error("iMessage MCP server v3.0.0 running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
