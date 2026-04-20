# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2025-01-12

### Added

- MCP server implementation for iMessage on macOS
- Support for reading messages from the Messages database
- Search functionality for finding messages by content, sender, or date
- Send message capability via AppleScript integration
- Full Model Context Protocol (MCP) compliance
- TypeScript implementation with type safety
- Vitest test suite for reliability
- GitHub Actions CI/CD pipeline
- ESLint and Prettier for code quality
- Husky pre-commit hooks with lint-staged

### Features

- **Read Messages**: Retrieve recent messages or messages from specific conversations
- **Search Messages**: Search through message history with flexible query options
- **Send Messages**: Send new iMessages to contacts via the Messages app
- **MCP Integration**: Seamless integration with Claude and other MCP-compatible AI assistants

[Unreleased]: https://github.com/thomasvincent/imessage-mcp/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/thomasvincent/imessage-mcp/releases/tag/v3.0.0
