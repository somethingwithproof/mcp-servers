# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- GitHub Actions CI/CD workflows for automated testing and npm publishing
- ESLint with TypeScript support for code linting
- Prettier for code formatting
- Husky and lint-staged for pre-commit hooks

## [1.0.0] - 2024-01-12

### Added

- Initial release of Maps MCP server
- `maps_open` - Open the Apple Maps app
- `maps_search` - Search for locations in Apple Maps
- `maps_get_directions` - Get directions between two locations with support for driving, walking, and transit modes
- `maps_show_location` - Show a specific location on the map by address
- `maps_show_coordinates` - Show a location by latitude and longitude coordinates
- `maps_drop_pin` - Drop a pin at a specific location with optional label
- `maps_nearby` - Find nearby places of a specific type
- `maps_create_url` - Create shareable Apple Maps URLs (app and web)
- Full TypeScript support with ES2022 target
- MCP SDK integration for Model Context Protocol
- macOS AppleScript integration for native Maps app control

[Unreleased]: https://github.com/thomasvincent/maps-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/thomasvincent/maps-mcp/releases/tag/v1.0.0
