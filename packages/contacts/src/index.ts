#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// Escape a string for safe interpolation inside an AppleScript double-quoted string.
// Must escape backslashes before quotes to avoid partial escaping.
function escapeAppleScript(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// ============================================================================
// AppleScript Helpers
// ============================================================================

async function runAppleScript(script: string): Promise<string> {
  try {
    const result = await execFileAsync('osascript', ['-e', script], {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 30000,
    });
    return result.stdout.trim();
  } catch (err: unknown) {
    const msg = errorMessage(err);
    if (msg.includes('Not authorized')) {
      throw new Error(
        'Contacts access denied. Grant permission in System Settings > Privacy & Security > Contacts'
      );
    }
    throw err;
  }
}

async function runAppleScriptJSON<T>(script: string): Promise<T> {
  const result = await runAppleScript(script);
  if (!result) return [] as unknown as T;
  try {
    return JSON.parse(result) as T;
  } catch {
    return result as unknown as T;
  }
}

// ============================================================================
// Permission Checking
// ============================================================================

interface PermissionStatus {
  contacts: boolean;
  details: string[];
}

async function checkPermissions(): Promise<PermissionStatus> {
  const status: PermissionStatus = {
    contacts: false,
    details: [],
  };

  try {
    await runAppleScript('tell application "Contacts" to count of people');
    status.contacts = true;
    status.details.push('Contacts: accessible');
  } catch {
    status.details.push('Contacts: NOT accessible (grant Contacts permission in System Settings)');
  }

  return status;
}

// ============================================================================
// Contact Types
// ============================================================================

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nickname?: string;
  company?: string;
  jobTitle?: string;
  department?: string;
  phones: { label: string; value: string }[];
  emails: { label: string; value: string }[];
  addresses: {
    label: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  }[];
  birthday?: string;
  note?: string;
  groups: string[];
}

interface ContactGroup {
  id: string;
  name: string;
  contactCount: number;
}

// ============================================================================
// Get Contacts
// ============================================================================

async function getContacts(
  options: {
    limit?: number;
    group?: string;
  } = {}
): Promise<Contact[]> {
  const { limit = 100, group } = options;

  const groupFilter = group ? `people of group "${escapeAppleScript(group)}"` : 'people';

  const script = `
    tell application "Contacts"
      set output to "["
      set allPeople to ${groupFilter}
      set itemCount to count of allPeople
      if itemCount > ${limit} then set itemCount to ${limit}

      repeat with i from 1 to itemCount
        set p to item i of allPeople
        set pId to id of p
        set pFirst to first name of p
        if pFirst is missing value then set pFirst to ""
        set pLast to last name of p
        if pLast is missing value then set pLast to ""
        set pNick to nickname of p
        if pNick is missing value then set pNick to ""
        set pCompany to organization of p
        if pCompany is missing value then set pCompany to ""
        set pTitle to job title of p
        if pTitle is missing value then set pTitle to ""
        set pDept to department of p
        if pDept is missing value then set pDept to ""
        set pNote to note of p
        if pNote is missing value then set pNote to ""
        set pBirth to birth date of p
        if pBirth is missing value then
          set pBirthStr to ""
        else
          set pBirthStr to (pBirth as «class isot» as string)
        end if

        -- Escape strings
        set pFirst to my replaceText(pFirst, "\\\\", "\\\\\\\\")
        set pFirst to my replaceText(pFirst, "\\"", "\\\\\\"")
        set pLast to my replaceText(pLast, "\\\\", "\\\\\\\\")
        set pLast to my replaceText(pLast, "\\"", "\\\\\\"")
        set pNick to my replaceText(pNick, "\\\\", "\\\\\\\\")
        set pNick to my replaceText(pNick, "\\"", "\\\\\\"")
        set pCompany to my replaceText(pCompany, "\\\\", "\\\\\\\\")
        set pCompany to my replaceText(pCompany, "\\"", "\\\\\\"")
        set pTitle to my replaceText(pTitle, "\\\\", "\\\\\\\\")
        set pTitle to my replaceText(pTitle, "\\"", "\\\\\\"")
        set pNote to my replaceText(pNote, "\\\\", "\\\\\\\\")
        set pNote to my replaceText(pNote, "\\"", "\\\\\\"")
        set pNote to my replaceText(pNote, return, "\\\\n")

        -- Get phones
        set phoneList to "["
        set allPhones to phones of p
        repeat with j from 1 to count of allPhones
          set ph to item j of allPhones
          set phLabel to label of ph
          if phLabel is missing value then set phLabel to "other"
          set phValue to value of ph
          set phLabel to my replaceText(phLabel, "\\"", "\\\\\\"")
          set phValue to my replaceText(phValue, "\\"", "\\\\\\"")
          if j > 1 then set phoneList to phoneList & ","
          set phoneList to phoneList & "{\\"label\\":\\"" & phLabel & "\\",\\"value\\":\\"" & phValue & "\\"}"
        end repeat
        set phoneList to phoneList & "]"

        -- Get emails
        set emailList to "["
        set allEmails to emails of p
        repeat with j from 1 to count of allEmails
          set em to item j of allEmails
          set emLabel to label of em
          if emLabel is missing value then set emLabel to "other"
          set emValue to value of em
          set emLabel to my replaceText(emLabel, "\\"", "\\\\\\"")
          set emValue to my replaceText(emValue, "\\"", "\\\\\\"")
          if j > 1 then set emailList to emailList & ","
          set emailList to emailList & "{\\"label\\":\\"" & emLabel & "\\",\\"value\\":\\"" & emValue & "\\"}"
        end repeat
        set emailList to emailList & "]"

        -- Get groups
        set groupList to "["
        set contactGroups to groups of p
        repeat with j from 1 to count of contactGroups
          set g to item j of contactGroups
          set gName to name of g
          set gName to my replaceText(gName, "\\"", "\\\\\\"")
          if j > 1 then set groupList to groupList & ","
          set groupList to groupList & "\\"" & gName & "\\""
        end repeat
        set groupList to groupList & "]"

        if i > 1 then set output to output & ","
        set output to output & "{\\"id\\":\\"" & pId & "\\","
        set output to output & "\\"firstName\\":\\"" & pFirst & "\\","
        set output to output & "\\"lastName\\":\\"" & pLast & "\\","
        set output to output & "\\"fullName\\":\\"" & pFirst & " " & pLast & "\\","
        set output to output & "\\"nickname\\":\\"" & pNick & "\\","
        set output to output & "\\"company\\":\\"" & pCompany & "\\","
        set output to output & "\\"jobTitle\\":\\"" & pTitle & "\\","
        set output to output & "\\"department\\":\\"" & pDept & "\\","
        set output to output & "\\"phones\\":" & phoneList & ","
        set output to output & "\\"emails\\":" & emailList & ","
        set output to output & "\\"addresses\\":[],"
        set output to output & "\\"birthday\\":\\"" & pBirthStr & "\\","
        set output to output & "\\"note\\":\\"" & pNote & "\\","
        set output to output & "\\"groups\\":" & groupList & "}"
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

  return runAppleScriptJSON<Contact[]>(script);
}

async function getContact(contactId: string): Promise<Contact | null> {
  const script = `
    tell application "Contacts"
      try
        set p to person id "${escapeAppleScript(contactId)}"
        set pId to id of p
        set pFirst to first name of p
        if pFirst is missing value then set pFirst to ""
        set pLast to last name of p
        if pLast is missing value then set pLast to ""
        set pNick to nickname of p
        if pNick is missing value then set pNick to ""
        set pCompany to organization of p
        if pCompany is missing value then set pCompany to ""
        set pTitle to job title of p
        if pTitle is missing value then set pTitle to ""
        set pNote to note of p
        if pNote is missing value then set pNote to ""
        set pBirth to birth date of p
        if pBirth is missing value then
          set pBirthStr to ""
        else
          set pBirthStr to (pBirth as «class isot» as string)
        end if

        set pFirst to my replaceText(pFirst, "\\\\", "\\\\\\\\")
        set pFirst to my replaceText(pFirst, "\\"", "\\\\\\"")
        set pLast to my replaceText(pLast, "\\\\", "\\\\\\\\")
        set pLast to my replaceText(pLast, "\\"", "\\\\\\"")
        set pNick to my replaceText(pNick, "\\\\", "\\\\\\\\")
        set pNick to my replaceText(pNick, "\\"", "\\\\\\"")
        set pCompany to my replaceText(pCompany, "\\\\", "\\\\\\\\")
        set pCompany to my replaceText(pCompany, "\\"", "\\\\\\"")
        set pNote to my replaceText(pNote, "\\\\", "\\\\\\\\")
        set pNote to my replaceText(pNote, "\\"", "\\\\\\"")
        set pNote to my replaceText(pNote, return, "\\\\n")

        -- Get phones
        set phoneList to "["
        set allPhones to phones of p
        repeat with j from 1 to count of allPhones
          set ph to item j of allPhones
          set phLabel to label of ph
          if phLabel is missing value then set phLabel to "other"
          set phValue to value of ph
          set phLabel to my replaceText(phLabel, "\\"", "\\\\\\"")
          set phValue to my replaceText(phValue, "\\"", "\\\\\\"")
          if j > 1 then set phoneList to phoneList & ","
          set phoneList to phoneList & "{\\"label\\":\\"" & phLabel & "\\",\\"value\\":\\"" & phValue & "\\"}"
        end repeat
        set phoneList to phoneList & "]"

        -- Get emails
        set emailList to "["
        set allEmails to emails of p
        repeat with j from 1 to count of allEmails
          set em to item j of allEmails
          set emLabel to label of em
          if emLabel is missing value then set emLabel to "other"
          set emValue to value of em
          set emLabel to my replaceText(emLabel, "\\"", "\\\\\\"")
          set emValue to my replaceText(emValue, "\\"", "\\\\\\"")
          if j > 1 then set emailList to emailList & ","
          set emailList to emailList & "{\\"label\\":\\"" & emLabel & "\\",\\"value\\":\\"" & emValue & "\\"}"
        end repeat
        set emailList to emailList & "]"

        -- Get groups
        set groupList to "["
        set contactGroups to groups of p
        repeat with j from 1 to count of contactGroups
          set g to item j of contactGroups
          set gName to name of g
          set gName to my replaceText(gName, "\\"", "\\\\\\"")
          if j > 1 then set groupList to groupList & ","
          set groupList to groupList & "\\"" & gName & "\\""
        end repeat
        set groupList to groupList & "]"

        return "{\\"id\\":\\"" & pId & "\\",\\"firstName\\":\\"" & pFirst & "\\",\\"lastName\\":\\"" & pLast & "\\",\\"fullName\\":\\"" & pFirst & " " & pLast & "\\",\\"nickname\\":\\"" & pNick & "\\",\\"company\\":\\"" & pCompany & "\\",\\"jobTitle\\":\\"" & pTitle & "\\",\\"phones\\":" & phoneList & ",\\"emails\\":" & emailList & ",\\"addresses\\":[],\\"birthday\\":\\"" & pBirthStr & "\\",\\"note\\":\\"" & pNote & "\\",\\"groups\\":" & groupList & "}"
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
  if (result === 'null') return null;
  try {
    return JSON.parse(result) as Contact;
  } catch {
    return null;
  }
}

// ============================================================================
// Search Contacts
// ============================================================================

async function searchContacts(query: string, options: { limit?: number } = {}): Promise<Contact[]> {
  const { limit = 50 } = options;
  // escapeAppleScript handles both \ and " — toLowerCase is safe (no special chars)
  const escapedQuery = escapeAppleScript(query.toLowerCase());

  const script = `
    tell application "Contacts"
      set output to "["
      set searchQuery to "${escapedQuery}"
      set matchCount to 0
      set allPeople to people

      repeat with p in allPeople
        if matchCount < ${limit} then
          set pFirst to first name of p
          if pFirst is missing value then set pFirst to ""
          set pLast to last name of p
          if pLast is missing value then set pLast to ""
          set pCompany to organization of p
          if pCompany is missing value then set pCompany to ""
          set pNick to nickname of p
          if pNick is missing value then set pNick to ""

          set lowerFirst to my toLowerCase(pFirst)
          set lowerLast to my toLowerCase(pLast)
          set lowerCompany to my toLowerCase(pCompany)
          set lowerNick to my toLowerCase(pNick)

          set matched to false
          if lowerFirst contains searchQuery then set matched to true
          if lowerLast contains searchQuery then set matched to true
          if lowerCompany contains searchQuery then set matched to true
          if lowerNick contains searchQuery then set matched to true

          -- Check phones
          if not matched then
            repeat with ph in phones of p
              if (value of ph) contains searchQuery then
                set matched to true
                exit repeat
              end if
            end repeat
          end if

          -- Check emails
          if not matched then
            repeat with em in emails of p
              set lowerEmail to my toLowerCase(value of em)
              if lowerEmail contains searchQuery then
                set matched to true
                exit repeat
              end if
            end repeat
          end if

          if matched then
            set pId to id of p
            set pTitle to job title of p
            if pTitle is missing value then set pTitle to ""

            set pFirst to my replaceText(pFirst, "\\\\", "\\\\\\\\")
            set pFirst to my replaceText(pFirst, "\\"", "\\\\\\"")
            set pLast to my replaceText(pLast, "\\\\", "\\\\\\\\")
            set pLast to my replaceText(pLast, "\\"", "\\\\\\"")
            set pNick to my replaceText(pNick, "\\\\", "\\\\\\\\")
            set pNick to my replaceText(pNick, "\\"", "\\\\\\"")
            set pCompany to my replaceText(pCompany, "\\\\", "\\\\\\\\")
            set pCompany to my replaceText(pCompany, "\\"", "\\\\\\"")

            -- Get phones
            set phoneList to "["
            set allPhones to phones of p
            repeat with j from 1 to count of allPhones
              set ph to item j of allPhones
              set phLabel to label of ph
              if phLabel is missing value then set phLabel to "other"
              set phValue to value of ph
              set phLabel to my replaceText(phLabel, "\\"", "\\\\\\"")
              set phValue to my replaceText(phValue, "\\"", "\\\\\\"")
              if j > 1 then set phoneList to phoneList & ","
              set phoneList to phoneList & "{\\"label\\":\\"" & phLabel & "\\",\\"value\\":\\"" & phValue & "\\"}"
            end repeat
            set phoneList to phoneList & "]"

            -- Get emails
            set emailList to "["
            set allEmails to emails of p
            repeat with j from 1 to count of allEmails
              set em to item j of allEmails
              set emLabel to label of em
              if emLabel is missing value then set emLabel to "other"
              set emValue to value of em
              set emLabel to my replaceText(emLabel, "\\"", "\\\\\\"")
              set emValue to my replaceText(emValue, "\\"", "\\\\\\"")
              if j > 1 then set emailList to emailList & ","
              set emailList to emailList & "{\\"label\\":\\"" & emLabel & "\\",\\"value\\":\\"" & emValue & "\\"}"
            end repeat
            set emailList to emailList & "]"

            if matchCount > 0 then set output to output & ","
            set output to output & "{\\"id\\":\\"" & pId & "\\","
            set output to output & "\\"firstName\\":\\"" & pFirst & "\\","
            set output to output & "\\"lastName\\":\\"" & pLast & "\\","
            set output to output & "\\"fullName\\":\\"" & pFirst & " " & pLast & "\\","
            set output to output & "\\"nickname\\":\\"" & pNick & "\\","
            set output to output & "\\"company\\":\\"" & pCompany & "\\","
            set output to output & "\\"jobTitle\\":\\"" & pTitle & "\\","
            set output to output & "\\"phones\\":" & phoneList & ","
            set output to output & "\\"emails\\":" & emailList & ","
            set output to output & "\\"addresses\\":[],"
            set output to output & "\\"groups\\":[]}"
            set matchCount to matchCount + 1
          end if
        end if
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

  return runAppleScriptJSON<Contact[]>(script);
}

// ============================================================================
// Create Contact
// ============================================================================

interface PhoneEntry {
  label: string;
  value: string;
}

interface EmailEntry {
  label: string;
  value: string;
}

interface CreateContactData {
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phones?: PhoneEntry[];
  emails?: EmailEntry[];
  note?: string;
}

interface MutationResult {
  success: boolean;
  id?: string;
  error?: string;
}

async function createContact(data: CreateContactData): Promise<MutationResult> {
  const {
    firstName = '',
    lastName = '',
    company = '',
    jobTitle = '',
    phones = [],
    emails = [],
    note = '',
  } = data;

  const escFirst = escapeAppleScript(firstName);
  const escLast = escapeAppleScript(lastName);
  const escCompany = escapeAppleScript(company);
  const escTitle = escapeAppleScript(jobTitle);
  const escNote = escapeAppleScript(note).replace(/\n/g, '\\n');

  let phoneScript = '';
  for (const phone of phones) {
    const label = escapeAppleScript(phone.label);
    const value = escapeAppleScript(phone.value);
    phoneScript += `make new phone at end of phones of newPerson with properties {label:"${label}", value:"${value}"}\n`;
  }

  let emailScript = '';
  for (const email of emails) {
    const label = escapeAppleScript(email.label);
    const value = escapeAppleScript(email.value);
    emailScript += `make new email at end of emails of newPerson with properties {label:"${label}", value:"${value}"}\n`;
  }

  const script = `
    tell application "Contacts"
      set newPerson to make new person with properties {first name:"${escFirst}", last name:"${escLast}", organization:"${escCompany}", job title:"${escTitle}", note:"${escNote}"}
      ${phoneScript}
      ${emailScript}
      save
      return id of newPerson
    end tell
  `;

  try {
    const id = await runAppleScript(script);
    return { success: true, id };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err) };
  }
}

// ============================================================================
// Update Contact
// ============================================================================

interface UpdateContactFields {
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  nickname?: string;
  note?: string;
}

async function updateContact(
  contactId: string,
  updates: UpdateContactFields
): Promise<{ success: boolean; error?: string }> {
  const { firstName, lastName, company, jobTitle, nickname, note } = updates;

  const updateLines: string[] = [];

  if (firstName !== undefined) {
    updateLines.push(`set first name of thePerson to "${escapeAppleScript(firstName)}"`);
  }
  if (lastName !== undefined) {
    updateLines.push(`set last name of thePerson to "${escapeAppleScript(lastName)}"`);
  }
  if (company !== undefined) {
    updateLines.push(`set organization of thePerson to "${escapeAppleScript(company)}"`);
  }
  if (jobTitle !== undefined) {
    updateLines.push(`set job title of thePerson to "${escapeAppleScript(jobTitle)}"`);
  }
  if (nickname !== undefined) {
    updateLines.push(`set nickname of thePerson to "${escapeAppleScript(nickname)}"`);
  }
  if (note !== undefined) {
    updateLines.push(`set note of thePerson to "${escapeAppleScript(note).replace(/\n/g, '\\n')}"`);
  }

  if (updateLines.length === 0) {
    return { success: false, error: 'No updates provided' };
  }

  const script = `
    tell application "Contacts"
      set thePerson to person id "${escapeAppleScript(contactId)}"
      ${updateLines.join('\n      ')}
      save
      return "done"
    end tell
  `;

  try {
    await runAppleScript(script);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err) };
  }
}

// ============================================================================
// Delete Contact
// ============================================================================

async function deleteContact(contactId: string): Promise<{ success: boolean; error?: string }> {
  const script = `
    tell application "Contacts"
      delete person id "${escapeAppleScript(contactId)}"
      save
      return "done"
    end tell
  `;

  try {
    await runAppleScript(script);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err) };
  }
}

// ============================================================================
// Groups
// ============================================================================

async function getGroups(): Promise<ContactGroup[]> {
  const script = `
    tell application "Contacts"
      set output to "["
      set allGroups to groups
      repeat with i from 1 to count of allGroups
        set g to item i of allGroups
        set gId to id of g
        set gName to name of g
        set gCount to count of people of g

        set gName to my replaceText(gName, "\\\\", "\\\\\\\\")
        set gName to my replaceText(gName, "\\"", "\\\\\\"")

        if i > 1 then set output to output & ","
        set output to output & "{\\"id\\":\\"" & gId & "\\",\\"name\\":\\"" & gName & "\\",\\"contactCount\\":" & gCount & "}"
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

  return runAppleScriptJSON<ContactGroup[]>(script);
}

async function createGroup(name: string): Promise<MutationResult> {
  const escapedName = escapeAppleScript(name);

  const script = `
    tell application "Contacts"
      set newGroup to make new group with properties {name:"${escapedName}"}
      save
      return id of newGroup
    end tell
  `;

  try {
    const id = await runAppleScript(script);
    return { success: true, id };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err) };
  }
}

async function deleteGroup(groupName: string): Promise<{ success: boolean; error?: string }> {
  const escapedName = escapeAppleScript(groupName);

  const script = `
    tell application "Contacts"
      delete group "${escapedName}"
      save
      return "done"
    end tell
  `;

  try {
    await runAppleScript(script);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err) };
  }
}

async function addToGroup(
  contactId: string,
  groupName: string
): Promise<{ success: boolean; error?: string }> {
  const escapedGroup = escapeAppleScript(groupName);

  const script = `
    tell application "Contacts"
      set thePerson to person id "${escapeAppleScript(contactId)}"
      set theGroup to group "${escapedGroup}"
      add thePerson to theGroup
      save
      return "done"
    end tell
  `;

  try {
    await runAppleScript(script);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err) };
  }
}

async function removeFromGroup(
  contactId: string,
  groupName: string
): Promise<{ success: boolean; error?: string }> {
  const escapedGroup = escapeAppleScript(groupName);

  const script = `
    tell application "Contacts"
      set thePerson to person id "${escapeAppleScript(contactId)}"
      set theGroup to group "${escapedGroup}"
      remove thePerson from theGroup
      save
      return "done"
    end tell
  `;

  try {
    await runAppleScript(script);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err) };
  }
}

// ============================================================================
// Open Contacts App
// ============================================================================

async function openContacts(): Promise<{ success: boolean; error?: string }> {
  try {
    // execFile avoids shell interpretation; 'open' is a fixed path, no injection risk
    await execFileAsync('open', ['-a', 'Contacts']);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err) };
  }
}

async function openContact(contactId: string): Promise<{ success: boolean; error?: string }> {
  const script = `
    tell application "Contacts"
      set thePerson to person id "${escapeAppleScript(contactId)}"
      activate
    end tell
  `;

  try {
    await runAppleScript(script);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err) };
  }
}

// ============================================================================
// Tool Definitions
// ============================================================================

const tools: Tool[] = [
  {
    name: 'contacts_check_permissions',
    description: 'Check if the MCP server has permission to access Apple Contacts.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'contacts_get_all',
    description: 'Get all contacts or contacts in a specific group.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum contacts to return (default: 100)' },
        group: { type: 'string', description: 'Filter by group name (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'contacts_get_contact',
    description: 'Get a specific contact by ID with full details.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_id: { type: 'string', description: 'The contact ID' },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'contacts_search',
    description: 'Search contacts by name, phone, email, or company.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search text' },
        limit: { type: 'number', description: 'Maximum results (default: 50)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'contacts_create',
    description: 'Create a new contact.',
    inputSchema: {
      type: 'object',
      properties: {
        first_name: { type: 'string', description: 'First name' },
        last_name: { type: 'string', description: 'Last name' },
        company: { type: 'string', description: 'Company/organization' },
        job_title: { type: 'string', description: 'Job title' },
        phones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'Phone label (home, work, mobile, etc.)' },
              value: { type: 'string', description: 'Phone number' },
            },
            required: ['label', 'value'],
          },
          description: 'Phone numbers',
        },
        emails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'Email label (home, work, etc.)' },
              value: { type: 'string', description: 'Email address' },
            },
            required: ['label', 'value'],
          },
          description: 'Email addresses',
        },
        note: { type: 'string', description: 'Notes' },
      },
      required: [],
    },
  },
  {
    name: 'contacts_update',
    description: "Update an existing contact's information.",
    inputSchema: {
      type: 'object',
      properties: {
        contact_id: { type: 'string', description: 'The contact ID to update' },
        first_name: { type: 'string', description: 'New first name' },
        last_name: { type: 'string', description: 'New last name' },
        company: { type: 'string', description: 'New company' },
        job_title: { type: 'string', description: 'New job title' },
        nickname: { type: 'string', description: 'New nickname' },
        note: { type: 'string', description: 'New notes' },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'contacts_delete',
    description: 'Delete a contact.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_id: { type: 'string', description: 'The contact ID to delete' },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'contacts_get_groups',
    description: 'Get all contact groups.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'contacts_create_group',
    description: 'Create a new contact group.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Group name' },
      },
      required: ['name'],
    },
  },
  {
    name: 'contacts_delete_group',
    description: 'Delete a contact group.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Group name to delete' },
      },
      required: ['name'],
    },
  },
  {
    name: 'contacts_add_to_group',
    description: 'Add a contact to a group.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_id: { type: 'string', description: 'Contact ID' },
        group: { type: 'string', description: 'Group name' },
      },
      required: ['contact_id', 'group'],
    },
  },
  {
    name: 'contacts_remove_from_group',
    description: 'Remove a contact from a group.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_id: { type: 'string', description: 'Contact ID' },
        group: { type: 'string', description: 'Group name' },
      },
      required: ['contact_id', 'group'],
    },
  },
  {
    name: 'contacts_open',
    description: 'Open the Contacts app.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'contacts_open_contact',
    description: 'Open a specific contact in the Contacts app.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_id: { type: 'string', description: 'Contact ID to open' },
      },
      required: ['contact_id'],
    },
  },
];

// ============================================================================
// Tool Handler
// ============================================================================

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

function asPhoneEntries(v: unknown): PhoneEntry[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.filter(
    (item): item is PhoneEntry =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).label === 'string' &&
      typeof (item as Record<string, unknown>).value === 'string'
  );
}

function asEmailEntries(v: unknown): EmailEntry[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.filter(
    (item): item is EmailEntry =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).label === 'string' &&
      typeof (item as Record<string, unknown>).value === 'string'
  );
}

async function handleToolCall(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'contacts_check_permissions': {
      const status = await checkPermissions();
      return JSON.stringify(status, null, 2);
    }

    case 'contacts_get_all': {
      const contacts = await getContacts({
        limit: asNumber(args.limit),
        group: asString(args.group),
      });
      return JSON.stringify(contacts, null, 2);
    }

    case 'contacts_get_contact': {
      const contactId = asString(args.contact_id);
      if (!contactId) throw new Error('contact_id is required');
      const contact = await getContact(contactId);
      if (!contact) {
        return JSON.stringify({ error: 'Contact not found' }, null, 2);
      }
      return JSON.stringify(contact, null, 2);
    }

    case 'contacts_search': {
      const query = asString(args.query);
      if (!query) throw new Error('query is required');
      const contacts = await searchContacts(query, { limit: asNumber(args.limit) });
      return JSON.stringify(contacts, null, 2);
    }

    case 'contacts_create': {
      const result = await createContact({
        firstName: asString(args.first_name),
        lastName: asString(args.last_name),
        company: asString(args.company),
        jobTitle: asString(args.job_title),
        phones: asPhoneEntries(args.phones),
        emails: asEmailEntries(args.emails),
        note: asString(args.note),
      });
      return JSON.stringify(result, null, 2);
    }

    case 'contacts_update': {
      const contactId = asString(args.contact_id);
      if (!contactId) throw new Error('contact_id is required');
      const result = await updateContact(contactId, {
        firstName: asString(args.first_name),
        lastName: asString(args.last_name),
        company: asString(args.company),
        jobTitle: asString(args.job_title),
        nickname: asString(args.nickname),
        note: asString(args.note),
      });
      return JSON.stringify(result, null, 2);
    }

    case 'contacts_delete': {
      const contactId = asString(args.contact_id);
      if (!contactId) throw new Error('contact_id is required');
      const result = await deleteContact(contactId);
      return JSON.stringify(result, null, 2);
    }

    case 'contacts_get_groups': {
      const groups = await getGroups();
      return JSON.stringify(groups, null, 2);
    }

    case 'contacts_create_group': {
      const groupName = asString(args.name);
      if (!groupName) throw new Error('name is required');
      const result = await createGroup(groupName);
      return JSON.stringify(result, null, 2);
    }

    case 'contacts_delete_group': {
      const groupName = asString(args.name);
      if (!groupName) throw new Error('name is required');
      const result = await deleteGroup(groupName);
      return JSON.stringify(result, null, 2);
    }

    case 'contacts_add_to_group': {
      const contactId = asString(args.contact_id);
      const group = asString(args.group);
      if (!contactId || !group) throw new Error('contact_id and group are required');
      const result = await addToGroup(contactId, group);
      return JSON.stringify(result, null, 2);
    }

    case 'contacts_remove_from_group': {
      const contactId = asString(args.contact_id);
      const group = asString(args.group);
      if (!contactId || !group) throw new Error('contact_id and group are required');
      const result = await removeFromGroup(contactId, group);
      return JSON.stringify(result, null, 2);
    }

    case 'contacts_open': {
      const result = await openContacts();
      return JSON.stringify(result, null, 2);
    }

    case 'contacts_open_contact': {
      const contactId = asString(args.contact_id);
      if (!contactId) throw new Error('contact_id is required');
      const result = await openContact(contactId);
      return JSON.stringify(result, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ============================================================================
// Server Setup
// ============================================================================

async function main(): Promise<void> {
  const server = new Server(
    { name: 'contacts-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleToolCall(name, (args ?? {}) as Record<string, unknown>);
      return { content: [{ type: 'text', text: result }] };
    } catch (err: unknown) {
      return {
        content: [{ type: 'text', text: `Error: ${errorMessage(err)}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Contacts MCP server v1.0.0 running on stdio');
}

main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
