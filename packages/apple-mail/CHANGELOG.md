# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-01-12

### Added

- Initial release of Apple Mail MCP server
- MCP server implementation using @modelcontextprotocol/sdk
- Full Apple Mail integration via AppleScript on macOS
- Email account management (`mail_get_accounts`)
- Mailbox listing and browsing (`mail_get_mailboxes`)
- Unread email retrieval (`mail_get_unread`)
- Recent email listing (`mail_get_recent`)
- Full email content retrieval by ID (`mail_get_email`)
- Email search functionality across subject, sender, and content (`mail_search`)
- Email composition and sending (`mail_send`)
- Reply to emails with optional reply-all (`mail_reply`)
- Mark emails as read/unread (`mail_mark_read`, `mail_mark_unread`)
- Delete emails (`mail_delete`)
- Move emails between mailboxes (`mail_move`)
- Unread count statistics (`mail_unread_count`)
- Open Mail app (`mail_open`)
- Check for new mail (`mail_check`)
- Stdio transport for MCP communication
- TypeScript support with full type definitions
- Comprehensive README with installation and usage instructions

[Unreleased]: https://github.com/thomasvincent/apple-mail-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/thomasvincent/apple-mail-mcp/releases/tag/v1.0.0
