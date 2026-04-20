# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-01-12

### Added

- Initial release of contacts-mcp
- MCP server for Apple Contacts on macOS via Model Context Protocol
- Full CRUD operations for contacts:
  - `contacts_get_all` - Retrieve all contacts or filter by group
  - `contacts_get_contact` - Get a specific contact by ID
  - `contacts_search` - Search contacts by name, phone, email, or company
  - `contacts_create` - Create new contacts with phones, emails, and notes
  - `contacts_update` - Update existing contact information
  - `contacts_delete` - Delete contacts
- Group management:
  - `contacts_get_groups` - List all contact groups
  - `contacts_create_group` - Create new groups
  - `contacts_delete_group` - Delete groups
  - `contacts_add_to_group` - Add contacts to groups
  - `contacts_remove_from_group` - Remove contacts from groups
- Utility tools:
  - `contacts_check_permissions` - Verify Contacts app access permissions
  - `contacts_open` - Open the Contacts app
  - `contacts_open_contact` - Open a specific contact in the app
- AppleScript integration for native macOS Contacts access
- JSON output for all contact data
- TypeScript implementation with full type definitions

[Unreleased]: https://github.com/thomasvincent/contacts-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/thomasvincent/contacts-mcp/releases/tag/v1.0.0
