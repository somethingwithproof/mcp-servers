# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-01-12

### Added

- Initial release of music-mcp
- MCP server for Apple Music on macOS via Model Context Protocol
- **Playback Control**: play, pause, stop, next, previous, toggle playback
- **Current Track**: get current track info and player state
- **Volume Control**: get and set volume level (0-100)
- **Position Control**: get and set playback position in seconds
- **Shuffle & Repeat**: get/set shuffle state and repeat mode (off/one/all)
- **Library Access**: browse playlists, get playlist tracks, play playlists
- **Search & Play**: search library, play specific songs/albums/artists, add to queue
- **Favorites**: love or dislike the current track
- **Application Control**: open and quit the Music app
- Full AppleScript integration for native macOS Music.app control
- TypeScript implementation with full type safety
- Comprehensive test suite with Vitest
- MIT License
