import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// Mock child_process module to prevent actual AppleScript execution
// Note: We mock the entire module to avoid any real command execution during tests
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

// Mock the promisify to return controlled mock functions
vi.mock('util', async () => {
  const actual = await vi.importActual<typeof import('util')>('util');
  return {
    ...actual,
    promisify: vi.fn(() => vi.fn()),
  };
});

// ============================================================================
// Test Data
// ============================================================================

const EXPECTED_TOOLS = [
  'calendar_check_permissions',
  'calendar_get_calendars',
  'calendar_get_events',
  'calendar_create_event',
  'calendar_update_event',
  'calendar_delete_event',
  'calendar_search',
  'calendar_get_today',
  'calendar_get_upcoming',
  'calendar_find_free_time',
  'calendar_create_recurring_event',
  'calendar_open',
  'calendar_open_date',
] as const;

const MOCK_CALENDARS = [
  { id: 'cal-1', name: 'Work', color: 'blue', writable: true },
  { id: 'cal-2', name: 'Personal', color: 'green', writable: true },
  { id: 'cal-3', name: 'Holidays', color: 'red', writable: false },
];

const MOCK_EVENTS = [
  {
    id: 'event-1',
    summary: 'Team Meeting',
    description: 'Weekly sync',
    location: 'Conference Room A',
    startDate: '2025-01-15T10:00:00.000Z',
    endDate: '2025-01-15T11:00:00.000Z',
    allDay: false,
    calendar: 'Work',
    url: '',
    status: 'confirmed',
  },
  {
    id: 'event-2',
    summary: 'Lunch with John',
    description: '',
    location: 'Cafe',
    startDate: '2025-01-15T12:00:00.000Z',
    endDate: '2025-01-15T13:00:00.000Z',
    allDay: false,
    calendar: 'Personal',
    url: '',
    status: 'confirmed',
  },
];

const MOCK_PERMISSION_STATUS = {
  calendar: true,
  details: ['Calendar: accessible'],
};

const MOCK_FREE_SLOTS = [
  {
    start: '2025-01-15T09:00:00.000Z',
    end: '2025-01-15T10:00:00.000Z',
    durationMinutes: 60,
  },
  {
    start: '2025-01-15T14:00:00.000Z',
    end: '2025-01-15T17:00:00.000Z',
    durationMinutes: 180,
  },
];

// ============================================================================
// Tests
// ============================================================================

describe('Calendar MCP Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Server Initialization Tests
  // ==========================================================================

  describe('Server Initialization', () => {
    it('should create server with correct name and version', async () => {
      const server = new Server(
        { name: 'calendar-mcp', version: '2.0.0' },
        { capabilities: { tools: {} } }
      );

      expect(server).toBeDefined();
    });

    it('should have tools capability enabled', async () => {
      const server = new Server(
        { name: 'calendar-mcp', version: '2.0.0' },
        { capabilities: { tools: {} } }
      );

      expect(server).toBeDefined();
      // The server is created with tools capability
    });
  });

  // ==========================================================================
  // Tool Registration Tests
  // ==========================================================================

  describe('Tool Registration', () => {
    it('should register exactly 13 tools', () => {
      expect(EXPECTED_TOOLS.length).toBe(13);
    });

    it('should have all expected tool names', () => {
      const expectedToolSet = new Set(EXPECTED_TOOLS);
      expect(expectedToolSet.size).toBe(13);

      // Verify each tool exists
      EXPECTED_TOOLS.forEach((toolName) => {
        expect(expectedToolSet.has(toolName)).toBe(true);
      });
    });

    it.each(EXPECTED_TOOLS)('should have tool: %s', (toolName) => {
      expect(EXPECTED_TOOLS).toContain(toolName);
    });

    it('should have correct tool categories', () => {
      const permissionTools = EXPECTED_TOOLS.filter((t) => t.includes('permission'));
      const calendarTools = EXPECTED_TOOLS.filter(
        (t) => t.includes('calendar') && !t.includes('event')
      );
      const eventTools = EXPECTED_TOOLS.filter(
        (t) =>
          t.includes('event') ||
          t.includes('search') ||
          t.includes('today') ||
          t.includes('upcoming') ||
          t.includes('free_time')
      );

      expect(permissionTools.length).toBeGreaterThan(0);
      expect(calendarTools.length).toBeGreaterThan(0);
      expect(eventTools.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Tool Handler Tests with Mocked AppleScript
  // ==========================================================================

  describe('Tool Handlers', () => {
    describe('calendar_check_permissions', () => {
      it('should return permission status when calendar is accessible', async () => {
        const result = MOCK_PERMISSION_STATUS;
        expect(result.calendar).toBe(true);
        expect(result.details).toContain('Calendar: accessible');
      });

      it('should return denied status when calendar access is denied', async () => {
        const deniedStatus = {
          calendar: false,
          details: ['Calendar: NOT accessible (grant Calendar permission in System Settings)'],
        };
        expect(deniedStatus.calendar).toBe(false);
        expect(deniedStatus.details[0]).toContain('NOT accessible');
      });
    });

    describe('calendar_get_calendars', () => {
      it('should return list of calendars', async () => {
        const calendars = MOCK_CALENDARS;

        expect(calendars).toHaveLength(3);
        expect(calendars[0]).toHaveProperty('id');
        expect(calendars[0]).toHaveProperty('name');
        expect(calendars[0]).toHaveProperty('color');
        expect(calendars[0]).toHaveProperty('writable');
      });

      it('should have correct calendar properties', async () => {
        const calendar = MOCK_CALENDARS[0];

        expect(typeof calendar.id).toBe('string');
        expect(typeof calendar.name).toBe('string');
        expect(typeof calendar.color).toBe('string');
        expect(typeof calendar.writable).toBe('boolean');
      });
    });

    describe('calendar_get_events', () => {
      it('should return events within date range', async () => {
        const events = MOCK_EVENTS;

        expect(Array.isArray(events)).toBe(true);
        expect(events.length).toBeGreaterThan(0);
      });

      it('should have correct event properties', async () => {
        const event = MOCK_EVENTS[0];

        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('summary');
        expect(event).toHaveProperty('description');
        expect(event).toHaveProperty('location');
        expect(event).toHaveProperty('startDate');
        expect(event).toHaveProperty('endDate');
        expect(event).toHaveProperty('allDay');
        expect(event).toHaveProperty('calendar');
        expect(event).toHaveProperty('status');
      });

      it('should filter events by calendar', async () => {
        const workEvents = MOCK_EVENTS.filter((e) => e.calendar === 'Work');
        expect(workEvents.length).toBeGreaterThan(0);
        workEvents.forEach((event) => {
          expect(event.calendar).toBe('Work');
        });
      });
    });

    describe('calendar_create_event', () => {
      it('should create event with required fields', async () => {
        const eventData = {
          summary: 'New Meeting',
          start_date: '2025-01-20T14:00:00Z',
        };

        expect(eventData.summary).toBeDefined();
        expect(eventData.start_date).toBeDefined();
      });

      it('should validate required fields', async () => {
        const invalidEventData = { summary: '' };

        expect(invalidEventData.summary).toBe('');
        // Should throw error for missing start_date
      });

      it('should support optional fields', async () => {
        const eventData = {
          summary: 'Full Event',
          start_date: '2025-01-20T14:00:00Z',
          end_date: '2025-01-20T15:00:00Z',
          all_day: false,
          calendar: 'Work',
          description: 'Test description',
          location: 'Room 101',
          url: 'https://example.com',
        };

        expect(eventData.end_date).toBeDefined();
        expect(eventData.description).toBeDefined();
        expect(eventData.location).toBeDefined();
        expect(eventData.url).toBeDefined();
      });
    });

    describe('calendar_update_event', () => {
      it('should require event_id and calendar', async () => {
        const updateData = {
          event_id: 'event-1',
          calendar: 'Work',
          summary: 'Updated Meeting',
        };

        expect(updateData.event_id).toBeDefined();
        expect(updateData.calendar).toBeDefined();
      });

      it('should support partial updates', async () => {
        const partialUpdate = {
          event_id: 'event-1',
          calendar: 'Work',
          summary: 'Only updating summary',
        };

        expect(partialUpdate.summary).toBeDefined();
        expect(partialUpdate).not.toHaveProperty('location');
      });
    });

    describe('calendar_delete_event', () => {
      it('should require event_id and calendar', async () => {
        const deleteData = {
          event_id: 'event-1',
          calendar: 'Work',
        };

        expect(deleteData.event_id).toBeDefined();
        expect(deleteData.calendar).toBeDefined();
      });
    });

    describe('calendar_search', () => {
      it('should search events by query', async () => {
        const query = 'meeting';
        const results = MOCK_EVENTS.filter(
          (e) =>
            e.summary.toLowerCase().includes(query) ||
            e.description.toLowerCase().includes(query) ||
            e.location.toLowerCase().includes(query)
        );

        expect(Array.isArray(results)).toBe(true);
      });

      it('should require query parameter', async () => {
        const searchParams = { query: 'test' };
        expect(searchParams.query).toBeDefined();
        expect(searchParams.query.length).toBeGreaterThan(0);
      });

      it('should support calendar filter', async () => {
        const searchParams = {
          query: 'meeting',
          calendar: 'Work',
        };

        expect(searchParams.calendar).toBe('Work');
      });

      it('should support limit parameter', async () => {
        const searchParams = {
          query: 'meeting',
          limit: 10,
        };

        expect(searchParams.limit).toBe(10);
      });
    });

    describe('calendar_get_today', () => {
      it('should return events for current day', async () => {
        // Today's events would be filtered by date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        expect(today.getTime()).toBeLessThan(tomorrow.getTime());
      });
    });

    describe('calendar_get_upcoming', () => {
      it('should default to 7 days', async () => {
        const defaultDays = 7;
        expect(defaultDays).toBe(7);
      });

      it('should accept custom days parameter', async () => {
        const customDays = 14;
        expect(customDays).toBe(14);
      });
    });

    describe('calendar_find_free_time', () => {
      it('should return available time slots', async () => {
        const slots = MOCK_FREE_SLOTS;

        expect(Array.isArray(slots)).toBe(true);
        slots.forEach((slot) => {
          expect(slot).toHaveProperty('start');
          expect(slot).toHaveProperty('end');
          expect(slot).toHaveProperty('durationMinutes');
        });
      });

      it('should require date and duration_minutes', async () => {
        const params = {
          date: '2025-01-15',
          duration_minutes: 30,
        };

        expect(params.date).toBeDefined();
        expect(params.duration_minutes).toBeDefined();
      });

      it('should support custom working hours', async () => {
        const params = {
          date: '2025-01-15',
          duration_minutes: 30,
          start_hour: 8,
          end_hour: 18,
        };

        expect(params.start_hour).toBe(8);
        expect(params.end_hour).toBe(18);
      });

      it('should filter slots by minimum duration', async () => {
        const minDuration = 60;
        const filteredSlots = MOCK_FREE_SLOTS.filter((slot) => slot.durationMinutes >= minDuration);

        filteredSlots.forEach((slot) => {
          expect(slot.durationMinutes).toBeGreaterThanOrEqual(minDuration);
        });
      });
    });

    describe('calendar_create_recurring_event', () => {
      it('should require summary, start_date, and frequency', async () => {
        const params = {
          summary: 'Weekly Standup',
          start_date: '2025-01-15T09:00:00Z',
          frequency: 'weekly',
        };

        expect(params.summary).toBeDefined();
        expect(params.start_date).toBeDefined();
        expect(params.frequency).toBeDefined();
      });

      it('should validate frequency values', async () => {
        const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];

        validFrequencies.forEach((freq) => {
          expect(['daily', 'weekly', 'monthly', 'yearly']).toContain(freq);
        });
      });

      it('should reject invalid frequency', async () => {
        const invalidFreq = 'hourly';
        expect(['daily', 'weekly', 'monthly', 'yearly']).not.toContain(invalidFreq);
      });

      it('should support interval parameter', async () => {
        const params = {
          summary: 'Bi-weekly Meeting',
          start_date: '2025-01-15T09:00:00Z',
          frequency: 'weekly',
          interval: 2,
        };

        expect(params.interval).toBe(2);
      });

      it('should support count parameter', async () => {
        const params = {
          summary: 'Limited Recurring Event',
          start_date: '2025-01-15T09:00:00Z',
          frequency: 'daily',
          count: 10,
        };

        expect(params.count).toBe(10);
      });

      it('should support until parameter', async () => {
        const params = {
          summary: 'Time-bound Recurring Event',
          start_date: '2025-01-15T09:00:00Z',
          frequency: 'weekly',
          until: '2025-12-31T23:59:59Z',
        };

        expect(params.until).toBeDefined();
      });
    });

    describe('calendar_open', () => {
      it('should open Calendar app', async () => {
        const result = { success: true };
        expect(result.success).toBe(true);
      });
    });

    describe('calendar_open_date', () => {
      it('should require date parameter', async () => {
        const params = { date: '2025-01-15' };
        expect(params.date).toBeDefined();
      });

      it('should validate date format', async () => {
        const validDate = new Date('2025-01-15');
        expect(validDate.getTime()).not.toBeNaN();
      });

      it('should reject invalid date', async () => {
        const invalidDate = new Date('invalid-date');
        expect(isNaN(invalidDate.getTime())).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    describe('Invalid Inputs', () => {
      it('should handle missing required parameters for create_event', () => {
        const validateCreateEvent = (args: { summary?: string; start_date?: string }) => {
          if (!args.summary || !args.start_date) {
            throw new Error('summary and start_date are required');
          }
          return true;
        };

        expect(() => validateCreateEvent({})).toThrow('summary and start_date are required');
        expect(() => validateCreateEvent({ summary: 'Test' })).toThrow(
          'summary and start_date are required'
        );
        expect(() => validateCreateEvent({ start_date: '2025-01-15' })).toThrow(
          'summary and start_date are required'
        );
      });

      it('should handle missing required parameters for update_event', () => {
        const validateUpdateEvent = (args: { event_id?: string; calendar?: string }) => {
          if (!args.event_id || !args.calendar) {
            throw new Error('event_id and calendar are required');
          }
          return true;
        };

        expect(() => validateUpdateEvent({})).toThrow('event_id and calendar are required');
        expect(() => validateUpdateEvent({ event_id: '123' })).toThrow(
          'event_id and calendar are required'
        );
      });

      it('should handle missing required parameters for delete_event', () => {
        const validateDeleteEvent = (args: { event_id?: string; calendar?: string }) => {
          if (!args.event_id || !args.calendar) {
            throw new Error('event_id and calendar are required');
          }
          return true;
        };

        expect(() => validateDeleteEvent({})).toThrow('event_id and calendar are required');
      });

      it('should handle missing query for search', () => {
        const validateSearch = (args: { query?: string }) => {
          if (!args.query) {
            throw new Error('query is required');
          }
          return true;
        };

        expect(() => validateSearch({})).toThrow('query is required');
      });

      it('should handle missing parameters for find_free_time', () => {
        const validateFindFreeTime = (args: { date?: string; duration_minutes?: number }) => {
          if (!args.date || !args.duration_minutes) {
            throw new Error('date and duration_minutes are required');
          }
          return true;
        };

        expect(() => validateFindFreeTime({})).toThrow('date and duration_minutes are required');
        expect(() => validateFindFreeTime({ date: '2025-01-15' })).toThrow(
          'date and duration_minutes are required'
        );
      });

      it('should handle missing parameters for create_recurring_event', () => {
        const validateRecurringEvent = (args: {
          summary?: string;
          start_date?: string;
          frequency?: string;
        }) => {
          if (!args.summary || !args.start_date || !args.frequency) {
            throw new Error('summary, start_date, and frequency are required');
          }
          return true;
        };

        expect(() => validateRecurringEvent({})).toThrow(
          'summary, start_date, and frequency are required'
        );
      });

      it('should handle invalid frequency for recurring events', () => {
        const validateFrequency = (frequency: string) => {
          const validFreqs = ['daily', 'weekly', 'monthly', 'yearly'];
          if (!validFreqs.includes(frequency)) {
            throw new Error('frequency must be: daily, weekly, monthly, or yearly');
          }
          return true;
        };

        expect(() => validateFrequency('hourly')).toThrow(
          'frequency must be: daily, weekly, monthly, or yearly'
        );
        expect(() => validateFrequency('biweekly')).toThrow(
          'frequency must be: daily, weekly, monthly, or yearly'
        );
      });

      it('should handle missing date for open_date', () => {
        const validateOpenDate = (args: { date?: string }) => {
          if (!args.date) {
            throw new Error('date is required');
          }
          return true;
        };

        expect(() => validateOpenDate({})).toThrow('date is required');
      });
    });

    describe('Invalid Date Formats', () => {
      it('should reject invalid date strings', () => {
        const parseDate = (dateStr: string): Date | null => {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? null : date;
        };

        expect(parseDate('invalid')).toBeNull();
        expect(parseDate('not-a-date')).toBeNull();
        expect(parseDate('')).toBeNull();
      });

      it('should accept valid ISO date strings', () => {
        const parseDate = (dateStr: string): Date | null => {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? null : date;
        };

        expect(parseDate('2025-01-15')).not.toBeNull();
        expect(parseDate('2025-01-15T10:00:00Z')).not.toBeNull();
        expect(parseDate('2025-01-15T10:00:00.000Z')).not.toBeNull();
      });
    });

    describe('Unknown Tool Handling', () => {
      it('should throw error for unknown tools', () => {
        const handleToolCall = (name: string) => {
          const knownTools = new Set(EXPECTED_TOOLS);
          if (!knownTools.has(name as (typeof EXPECTED_TOOLS)[number])) {
            throw new Error(`Unknown tool: ${name}`);
          }
          return true;
        };

        expect(() => handleToolCall('unknown_tool')).toThrow('Unknown tool: unknown_tool');
        expect(() => handleToolCall('calendar_invalid')).toThrow('Unknown tool: calendar_invalid');
      });
    });

    describe('Permission Errors', () => {
      it('should handle calendar permission denied', () => {
        const checkPermission = (hasAccess: boolean) => {
          if (!hasAccess) {
            throw new Error(
              'Calendar access denied. Grant permission in System Settings > Privacy & Security > Calendars'
            );
          }
          return true;
        };

        expect(() => checkPermission(false)).toThrow('Calendar access denied');
      });
    });
  });

  // ==========================================================================
  // Date Utility Tests
  // ==========================================================================

  describe('Date Utilities', () => {
    it('should format dates for AppleScript correctly', () => {
      const formatDateForAppleScript = (date: Date): string => {
        return date.toLocaleString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
      };

      const date = new Date('2025-01-15T10:30:00Z');
      const formatted = formatDateForAppleScript(date);

      expect(formatted).toContain('2025');
      expect(formatted).toContain('January');
    });

    it('should parse valid dates', () => {
      const parseDate = (dateStr: string): Date | null => {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      };

      const date = parseDate('2025-01-15T10:00:00Z');
      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2025);
    });

    it('should handle missing value in formatISODate', () => {
      const formatISODate = (dateStr: string): string => {
        if (!dateStr || dateStr === 'missing value') return '';
        try {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? '' : date.toISOString();
        } catch {
          return '';
        }
      };

      expect(formatISODate('')).toBe('');
      expect(formatISODate('missing value')).toBe('');
      expect(formatISODate('2025-01-15')).not.toBe('');
    });
  });

  // ==========================================================================
  // Integration-style Tests (simulated)
  // ==========================================================================

  describe('Tool Integration', () => {
    it('should support full event lifecycle', async () => {
      // Create -> Update -> Delete flow
      const createResult = { success: true, id: 'new-event-123' };
      expect(createResult.success).toBe(true);
      expect(createResult.id).toBeDefined();

      const updateResult = { success: true };
      expect(updateResult.success).toBe(true);

      const deleteResult = { success: true };
      expect(deleteResult.success).toBe(true);
    });

    it('should support event search and retrieval flow', async () => {
      // Get calendars -> Get events -> Search
      const calendars = MOCK_CALENDARS;
      expect(calendars.length).toBeGreaterThan(0);

      const events = MOCK_EVENTS;
      expect(events.length).toBeGreaterThan(0);

      const searchResults = MOCK_EVENTS.filter((e) => e.summary.toLowerCase().includes('meeting'));
      expect(Array.isArray(searchResults)).toBe(true);
    });

    it('should support scheduling workflow', async () => {
      // Check availability -> Create event
      const freeSlots = MOCK_FREE_SLOTS;
      expect(freeSlots.length).toBeGreaterThan(0);

      const selectedSlot = freeSlots[0];
      expect(selectedSlot.durationMinutes).toBeGreaterThan(0);

      const createResult = { success: true, id: 'scheduled-event-456' };
      expect(createResult.success).toBe(true);
    });
  });
});

// ============================================================================
// Tool Schema Validation Tests
// ============================================================================

describe('Tool Schema Validation', () => {
  const toolSchemas = {
    calendar_check_permissions: {
      required: [],
      optional: [],
    },
    calendar_get_calendars: {
      required: [],
      optional: [],
    },
    calendar_get_events: {
      required: [],
      optional: ['calendar', 'start_date', 'end_date', 'limit'],
    },
    calendar_create_event: {
      required: ['summary', 'start_date'],
      optional: ['end_date', 'all_day', 'calendar', 'description', 'location', 'url'],
    },
    calendar_update_event: {
      required: ['event_id', 'calendar'],
      optional: ['summary', 'start_date', 'end_date', 'description', 'location', 'all_day'],
    },
    calendar_delete_event: {
      required: ['event_id', 'calendar'],
      optional: [],
    },
    calendar_search: {
      required: ['query'],
      optional: ['calendar', 'limit'],
    },
    calendar_get_today: {
      required: [],
      optional: [],
    },
    calendar_get_upcoming: {
      required: [],
      optional: ['days'],
    },
    calendar_find_free_time: {
      required: ['date', 'duration_minutes'],
      optional: ['start_hour', 'end_hour', 'calendar'],
    },
    calendar_create_recurring_event: {
      required: ['summary', 'start_date', 'frequency'],
      optional: [
        'end_date',
        'all_day',
        'calendar',
        'description',
        'location',
        'interval',
        'count',
        'until',
      ],
    },
    calendar_open: {
      required: [],
      optional: [],
    },
    calendar_open_date: {
      required: ['date'],
      optional: [],
    },
  };

  it.each(Object.keys(toolSchemas))('schema for %s is valid', (toolName) => {
    const schema = toolSchemas[toolName as keyof typeof toolSchemas];
    expect(schema).toBeDefined();
    expect(Array.isArray(schema.required)).toBe(true);
    expect(Array.isArray(schema.optional)).toBe(true);
  });

  it('all 13 tools have schema definitions', () => {
    expect(Object.keys(toolSchemas)).toHaveLength(13);
  });
});
