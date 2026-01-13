# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-01-12

### Added

- Initial release of Screen Time MCP server
- MCP server implementation using the Model Context Protocol SDK
- Tools to open various Screen Time settings panels:
  - `screentime_open` - Open main Screen Time settings
  - `screentime_open_app_limits` - Open App Limits settings
  - `screentime_open_downtime` - Open Downtime settings
  - `screentime_open_communication_limits` - Open Communication Limits settings
  - `screentime_open_always_allowed` - Open Always Allowed settings
  - `screentime_open_content_privacy` - Open Content & Privacy Restrictions settings
  - `screentime_get_info` - Get information about Screen Time capabilities and limitations
- AppleScript integration for macOS System Preferences/Settings navigation
- TypeScript support with full type definitions
- Vitest test configuration
- MIT License

[Unreleased]: https://github.com/thomasvincent/screen-time-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/thomasvincent/screen-time-mcp/releases/tag/v1.0.0
