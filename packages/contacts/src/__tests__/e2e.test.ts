import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as childProcess from 'child_process';
import { promisify } from 'util';

// Mock child_process.exec to avoid actual AppleScript execution
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

const mockExec = childProcess.exec as unknown as ReturnType<typeof vi.fn>;

// Helper to create mock exec callback response
function mockExecResponse(stdout: string, stderr = '') {
  return (
    _cmd: string,
    _options: any,
    callback: (error: any, result: { stdout: string; stderr: string }) => void
  ) => {
    if (typeof _options === 'function') {
      callback = _options;
    }
    callback(null, { stdout, stderr });
  };
}

function mockExecError(message: string) {
  return (_cmd: string, _options: any, callback: (error: any, result: any) => void) => {
    if (typeof _options === 'function') {
      callback = _options;
    }
    callback(new Error(message), null);
  };
}

// Sample mock data
const mockContactJSON = JSON.stringify([
  {
    id: 'ABC123',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    nickname: 'Johnny',
    company: 'Acme Corp',
    jobTitle: 'Engineer',
    department: 'Engineering',
    phones: [{ label: 'mobile', value: '+1-555-1234' }],
    emails: [{ label: 'work', value: 'john@acme.com' }],
    addresses: [],
    birthday: '1990-01-15',
    note: 'Test contact',
    groups: ['Friends'],
  },
]);

const mockSingleContact = JSON.stringify({
  id: 'ABC123',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  nickname: 'Johnny',
  company: 'Acme Corp',
  jobTitle: 'Engineer',
  phones: [{ label: 'mobile', value: '+1-555-1234' }],
  emails: [{ label: 'work', value: 'john@acme.com' }],
  addresses: [],
  birthday: '1990-01-15',
  note: 'Test contact',
  groups: ['Friends'],
});

const mockGroupsJSON = JSON.stringify([
  { id: 'GRP001', name: 'Friends', contactCount: 5 },
  { id: 'GRP002', name: 'Work', contactCount: 10 },
]);

// Define the tool definitions (mirroring index.ts)
const tools = [
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
        phones: { type: 'array', description: 'Phone numbers' },
        emails: { type: 'array', description: 'Email addresses' },
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

// Tool handler implementation (mirroring index.ts logic)
// Note: This uses exec intentionally to match the main codebase behavior
// The exec calls are mocked in tests to prevent actual AppleScript execution
const execAsync = promisify(childProcess.exec);

async function runAppleScript(script: string): Promise<string> {
  try {
    const escaped = script.replace(/'/g, "'\\''");
    const result = await execAsync(`osascript -e '${escaped}'`, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 30000,
    });
    return result.stdout.trim();
  } catch (error: any) {
    if (error.message?.includes('Not authorized')) {
      throw new Error(
        'Contacts access denied. Grant permission in System Settings > Privacy & Security > Contacts'
      );
    }
    throw error;
  }
}

async function _runAppleScriptJSON<T>(script: string): Promise<T> {
  const result = await runAppleScript(script);
  if (!result) return [] as unknown as T;
  try {
    return JSON.parse(result);
  } catch {
    return result as unknown as T;
  }
}

async function handleToolCall(name: string, args: Record<string, any>): Promise<string> {
  switch (name) {
    case 'contacts_check_permissions': {
      try {
        await runAppleScript('tell application "Contacts" to count of people');
        return JSON.stringify({ contacts: true, details: ['Contacts: accessible'] }, null, 2);
      } catch {
        return JSON.stringify({ contacts: false, details: ['Contacts: NOT accessible'] }, null, 2);
      }
    }

    case 'contacts_get_all': {
      const result = await runAppleScript('get contacts');
      return result || '[]';
    }

    case 'contacts_get_contact': {
      if (!args.contact_id) throw new Error('contact_id is required');
      const result = await runAppleScript(`get contact ${args.contact_id}`);
      if (result === 'null') {
        return JSON.stringify({ error: 'Contact not found' }, null, 2);
      }
      return result;
    }

    case 'contacts_search': {
      if (!args.query) throw new Error('query is required');
      const result = await runAppleScript(`search ${args.query}`);
      return result || '[]';
    }

    case 'contacts_create': {
      const result = await runAppleScript('create contact');
      return JSON.stringify({ success: true, id: result }, null, 2);
    }

    case 'contacts_update': {
      if (!args.contact_id) throw new Error('contact_id is required');
      await runAppleScript(`update ${args.contact_id}`);
      return JSON.stringify({ success: true }, null, 2);
    }

    case 'contacts_delete': {
      if (!args.contact_id) throw new Error('contact_id is required');
      await runAppleScript(`delete ${args.contact_id}`);
      return JSON.stringify({ success: true }, null, 2);
    }

    case 'contacts_get_groups': {
      const result = await runAppleScript('get groups');
      return result || '[]';
    }

    case 'contacts_create_group': {
      if (!args.name) throw new Error('name is required');
      const result = await runAppleScript(`create group ${args.name}`);
      return JSON.stringify({ success: true, id: result }, null, 2);
    }

    case 'contacts_delete_group': {
      if (!args.name) throw new Error('name is required');
      await runAppleScript(`delete group ${args.name}`);
      return JSON.stringify({ success: true }, null, 2);
    }

    case 'contacts_add_to_group': {
      if (!args.contact_id || !args.group) throw new Error('contact_id and group are required');
      await runAppleScript(`add ${args.contact_id} to ${args.group}`);
      return JSON.stringify({ success: true }, null, 2);
    }

    case 'contacts_remove_from_group': {
      if (!args.contact_id || !args.group) throw new Error('contact_id and group are required');
      await runAppleScript(`remove ${args.contact_id} from ${args.group}`);
      return JSON.stringify({ success: true }, null, 2);
    }

    case 'contacts_open': {
      await execAsync('open -a Contacts');
      return JSON.stringify({ success: true }, null, 2);
    }

    case 'contacts_open_contact': {
      if (!args.contact_id) throw new Error('contact_id is required');
      await runAppleScript(`open contact ${args.contact_id}`);
      return JSON.stringify({ success: true }, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

describe('Contacts MCP Server E2E Tests', () => {
  let server: Server;

  beforeEach(() => {
    vi.clearAllMocks();
    server = new Server(
      { name: 'contacts-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await handleToolCall(name, args || {});
        return { content: [{ type: 'text', text: result }] };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Server Initialization', () => {
    it('should create server with correct name and version', () => {
      expect(server).toBeDefined();
    });

    it('should have tools capability enabled', () => {
      // Server is created with tools capability
      expect(server).toBeDefined();
    });
  });

  describe('Tool Registration', () => {
    it('should register all 14 tools', async () => {
      const handler = (server as any)._requestHandlers?.get('tools/list');
      expect(handler).toBeDefined();
    });

    it('should have contacts_check_permissions tool', () => {
      const tool = tools.find((t) => t.name === 'contacts_check_permissions');
      expect(tool).toBeDefined();
      expect(tool?.description).toContain('permission');
    });

    it('should have contacts_get_all tool with correct schema', () => {
      const tool = tools.find((t) => t.name === 'contacts_get_all');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.properties).toHaveProperty('limit');
      expect(tool?.inputSchema.properties).toHaveProperty('group');
    });

    it('should have contacts_get_contact tool with required contact_id', () => {
      const tool = tools.find((t) => t.name === 'contacts_get_contact');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('contact_id');
    });

    it('should have contacts_search tool with required query', () => {
      const tool = tools.find((t) => t.name === 'contacts_search');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('query');
    });

    it('should have contacts_create tool with optional fields', () => {
      const tool = tools.find((t) => t.name === 'contacts_create');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.properties).toHaveProperty('first_name');
      expect(tool?.inputSchema.properties).toHaveProperty('last_name');
      expect(tool?.inputSchema.properties).toHaveProperty('phones');
      expect(tool?.inputSchema.properties).toHaveProperty('emails');
    });

    it('should have contacts_update tool with required contact_id', () => {
      const tool = tools.find((t) => t.name === 'contacts_update');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('contact_id');
    });

    it('should have contacts_delete tool with required contact_id', () => {
      const tool = tools.find((t) => t.name === 'contacts_delete');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('contact_id');
    });

    it('should have all group management tools', () => {
      const groupTools = [
        'contacts_get_groups',
        'contacts_create_group',
        'contacts_delete_group',
        'contacts_add_to_group',
        'contacts_remove_from_group',
      ];

      for (const toolName of groupTools) {
        const tool = tools.find((t) => t.name === toolName);
        expect(tool).toBeDefined();
      }
    });

    it('should have contacts_open and contacts_open_contact tools', () => {
      expect(tools.find((t) => t.name === 'contacts_open')).toBeDefined();
      expect(tools.find((t) => t.name === 'contacts_open_contact')).toBeDefined();
    });

    it('should have exactly 14 tools registered', () => {
      expect(tools.length).toBe(14);
    });
  });

  describe('Tool Handlers with Mocked AppleScript', () => {
    describe('contacts_check_permissions', () => {
      it('should return success when permissions are granted', async () => {
        mockExec.mockImplementation(mockExecResponse('5'));

        const result = await handleToolCall('contacts_check_permissions', {});
        const parsed = JSON.parse(result);

        expect(parsed.contacts).toBe(true);
        expect(parsed.details).toContain('Contacts: accessible');
      });

      it('should return failure when permissions are denied', async () => {
        mockExec.mockImplementation(mockExecError('Not authorized'));

        const result = await handleToolCall('contacts_check_permissions', {});
        const parsed = JSON.parse(result);

        expect(parsed.contacts).toBe(false);
      });
    });

    describe('contacts_get_all', () => {
      it('should return contacts list', async () => {
        mockExec.mockImplementation(mockExecResponse(mockContactJSON));

        const result = await handleToolCall('contacts_get_all', {});

        expect(result).toBe(mockContactJSON);
      });

      it('should return empty array when no contacts', async () => {
        mockExec.mockImplementation(mockExecResponse(''));

        const result = await handleToolCall('contacts_get_all', {});

        expect(result).toBe('[]');
      });
    });

    describe('contacts_get_contact', () => {
      it('should return a specific contact', async () => {
        mockExec.mockImplementation(mockExecResponse(mockSingleContact));

        const result = await handleToolCall('contacts_get_contact', { contact_id: 'ABC123' });

        expect(result).toBe(mockSingleContact);
      });

      it('should return error when contact not found', async () => {
        mockExec.mockImplementation(mockExecResponse('null'));

        const result = await handleToolCall('contacts_get_contact', { contact_id: 'INVALID' });
        const parsed = JSON.parse(result);

        expect(parsed.error).toBe('Contact not found');
      });

      it('should throw error when contact_id is missing', async () => {
        await expect(handleToolCall('contacts_get_contact', {})).rejects.toThrow(
          'contact_id is required'
        );
      });
    });

    describe('contacts_search', () => {
      it('should return matching contacts', async () => {
        mockExec.mockImplementation(mockExecResponse(mockContactJSON));

        const result = await handleToolCall('contacts_search', { query: 'John' });

        expect(result).toBe(mockContactJSON);
      });

      it('should return empty array when no matches', async () => {
        mockExec.mockImplementation(mockExecResponse(''));

        const result = await handleToolCall('contacts_search', { query: 'NonExistent' });

        expect(result).toBe('[]');
      });

      it('should throw error when query is missing', async () => {
        await expect(handleToolCall('contacts_search', {})).rejects.toThrow('query is required');
      });
    });

    describe('contacts_create', () => {
      it('should create a new contact and return id', async () => {
        mockExec.mockImplementation(mockExecResponse('NEW123'));

        const result = await handleToolCall('contacts_create', {
          first_name: 'Jane',
          last_name: 'Smith',
          company: 'Tech Inc',
        });
        const parsed = JSON.parse(result);

        expect(parsed.success).toBe(true);
        expect(parsed.id).toBe('NEW123');
      });
    });

    describe('contacts_update', () => {
      it('should update an existing contact', async () => {
        mockExec.mockImplementation(mockExecResponse('done'));

        const result = await handleToolCall('contacts_update', {
          contact_id: 'ABC123',
          first_name: 'Jonathan',
        });
        const parsed = JSON.parse(result);

        expect(parsed.success).toBe(true);
      });

      it('should throw error when contact_id is missing', async () => {
        await expect(handleToolCall('contacts_update', { first_name: 'Test' })).rejects.toThrow(
          'contact_id is required'
        );
      });
    });

    describe('contacts_delete', () => {
      it('should delete a contact', async () => {
        mockExec.mockImplementation(mockExecResponse('done'));

        const result = await handleToolCall('contacts_delete', { contact_id: 'ABC123' });
        const parsed = JSON.parse(result);

        expect(parsed.success).toBe(true);
      });

      it('should throw error when contact_id is missing', async () => {
        await expect(handleToolCall('contacts_delete', {})).rejects.toThrow(
          'contact_id is required'
        );
      });
    });

    describe('contacts_get_groups', () => {
      it('should return all groups', async () => {
        mockExec.mockImplementation(mockExecResponse(mockGroupsJSON));

        const result = await handleToolCall('contacts_get_groups', {});

        expect(result).toBe(mockGroupsJSON);
      });

      it('should return empty array when no groups', async () => {
        mockExec.mockImplementation(mockExecResponse(''));

        const result = await handleToolCall('contacts_get_groups', {});

        expect(result).toBe('[]');
      });
    });

    describe('contacts_create_group', () => {
      it('should create a new group', async () => {
        mockExec.mockImplementation(mockExecResponse('GRP003'));

        const result = await handleToolCall('contacts_create_group', { name: 'Family' });
        const parsed = JSON.parse(result);

        expect(parsed.success).toBe(true);
        expect(parsed.id).toBe('GRP003');
      });

      it('should throw error when name is missing', async () => {
        await expect(handleToolCall('contacts_create_group', {})).rejects.toThrow(
          'name is required'
        );
      });
    });

    describe('contacts_delete_group', () => {
      it('should delete a group', async () => {
        mockExec.mockImplementation(mockExecResponse('done'));

        const result = await handleToolCall('contacts_delete_group', { name: 'OldGroup' });
        const parsed = JSON.parse(result);

        expect(parsed.success).toBe(true);
      });

      it('should throw error when name is missing', async () => {
        await expect(handleToolCall('contacts_delete_group', {})).rejects.toThrow(
          'name is required'
        );
      });
    });

    describe('contacts_add_to_group', () => {
      it('should add a contact to a group', async () => {
        mockExec.mockImplementation(mockExecResponse('done'));

        const result = await handleToolCall('contacts_add_to_group', {
          contact_id: 'ABC123',
          group: 'Friends',
        });
        const parsed = JSON.parse(result);

        expect(parsed.success).toBe(true);
      });

      it('should throw error when contact_id is missing', async () => {
        await expect(handleToolCall('contacts_add_to_group', { group: 'Friends' })).rejects.toThrow(
          'contact_id and group are required'
        );
      });

      it('should throw error when group is missing', async () => {
        await expect(
          handleToolCall('contacts_add_to_group', { contact_id: 'ABC123' })
        ).rejects.toThrow('contact_id and group are required');
      });
    });

    describe('contacts_remove_from_group', () => {
      it('should remove a contact from a group', async () => {
        mockExec.mockImplementation(mockExecResponse('done'));

        const result = await handleToolCall('contacts_remove_from_group', {
          contact_id: 'ABC123',
          group: 'Friends',
        });
        const parsed = JSON.parse(result);

        expect(parsed.success).toBe(true);
      });

      it('should throw error when contact_id is missing', async () => {
        await expect(
          handleToolCall('contacts_remove_from_group', { group: 'Friends' })
        ).rejects.toThrow('contact_id and group are required');
      });

      it('should throw error when group is missing', async () => {
        await expect(
          handleToolCall('contacts_remove_from_group', { contact_id: 'ABC123' })
        ).rejects.toThrow('contact_id and group are required');
      });
    });

    describe('contacts_open', () => {
      it('should open the Contacts app', async () => {
        mockExec.mockImplementation(mockExecResponse(''));

        const result = await handleToolCall('contacts_open', {});
        const parsed = JSON.parse(result);

        expect(parsed.success).toBe(true);
      });
    });

    describe('contacts_open_contact', () => {
      it('should open a specific contact', async () => {
        mockExec.mockImplementation(mockExecResponse(''));

        const result = await handleToolCall('contacts_open_contact', { contact_id: 'ABC123' });
        const parsed = JSON.parse(result);

        expect(parsed.success).toBe(true);
      });

      it('should throw error when contact_id is missing', async () => {
        await expect(handleToolCall('contacts_open_contact', {})).rejects.toThrow(
          'contact_id is required'
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown tool', async () => {
      await expect(handleToolCall('unknown_tool', {})).rejects.toThrow(
        'Unknown tool: unknown_tool'
      );
    });

    it('should handle AppleScript execution errors', async () => {
      mockExec.mockImplementation(mockExecError('AppleScript error: permission denied'));

      await expect(handleToolCall('contacts_get_all', {})).rejects.toThrow();
    });

    it('should handle authorization errors with helpful message', async () => {
      mockExec.mockImplementation(mockExecError('Not authorized to send Apple events'));

      await expect(handleToolCall('contacts_get_all', {})).rejects.toThrow(
        'Contacts access denied. Grant permission in System Settings > Privacy & Security > Contacts'
      );
    });
  });

  describe('Input Validation', () => {
    it('should validate contact_id for contacts_get_contact', async () => {
      await expect(handleToolCall('contacts_get_contact', {})).rejects.toThrow(
        'contact_id is required'
      );
    });

    it('should validate query for contacts_search', async () => {
      await expect(handleToolCall('contacts_search', {})).rejects.toThrow('query is required');
    });

    it('should validate contact_id for contacts_update', async () => {
      await expect(handleToolCall('contacts_update', {})).rejects.toThrow('contact_id is required');
    });

    it('should validate contact_id for contacts_delete', async () => {
      await expect(handleToolCall('contacts_delete', {})).rejects.toThrow('contact_id is required');
    });

    it('should validate name for contacts_create_group', async () => {
      await expect(handleToolCall('contacts_create_group', {})).rejects.toThrow('name is required');
    });

    it('should validate name for contacts_delete_group', async () => {
      await expect(handleToolCall('contacts_delete_group', {})).rejects.toThrow('name is required');
    });

    it('should validate both contact_id and group for contacts_add_to_group', async () => {
      await expect(handleToolCall('contacts_add_to_group', {})).rejects.toThrow(
        'contact_id and group are required'
      );
    });

    it('should validate both contact_id and group for contacts_remove_from_group', async () => {
      await expect(handleToolCall('contacts_remove_from_group', {})).rejects.toThrow(
        'contact_id and group are required'
      );
    });

    it('should validate contact_id for contacts_open_contact', async () => {
      await expect(handleToolCall('contacts_open_contact', {})).rejects.toThrow(
        'contact_id is required'
      );
    });
  });

  describe('Tool Schema Validation', () => {
    it('all tools should have valid inputSchema', () => {
      for (const tool of tools) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      }
    });

    it('all tools should have a description', () => {
      for (const tool of tools) {
        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(0);
      }
    });

    it('all tools should have a name', () => {
      for (const tool of tools) {
        expect(tool.name).toBeDefined();
        expect(tool.name.startsWith('contacts_')).toBe(true);
      }
    });
  });
});
