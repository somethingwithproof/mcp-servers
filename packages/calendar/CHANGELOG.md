# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- GitHub Actions CI/CD workflows for testing and publishing
- ESLint with TypeScript support for code linting
- Prettier for consistent code formatting
- Husky and lint-staged for pre-commit hooks

## [2.0.0] - 2024-01-12

### Added

- Full MCP server implementation for Apple Calendar on macOS
- Core calendar operations:
  - `calendar_get_calendars` - List all calendars with colors and write status
  - `calendar_get_events` - Fetch events with date range filtering
  - `calendar_create_event` - Add new events with all properties
  - `calendar_update_event` - Modify existing event details
  - `calendar_delete_event` - Remove events from calendars
- Smart query tools:
  - `calendar_search` - Find events by text in title, description, or location
  - `calendar_get_today` - Get all events for today
  - `calendar_get_upcoming` - Get events for the next N days
- Utility tools:
  - `calendar_check_permissions` - Check Calendar access permission
- Support for event properties: summary, start/end dates, all-day events, calendar selection, description, location, and URL
- ISO 8601 date format support
- Local-only operation via AppleScript for privacy and security
- TypeScript implementation with full type safety
- Vitest test suite
- npm package distribution

### Requirements

- macOS 12 or later
- Node.js 18+
- Calendar permission (granted on first use)

[Unreleased]: https://github.com/thomasvincent/calendar-mcp/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/thomasvincent/calendar-mcp/releases/tag/v2.0.0
