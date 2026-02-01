# CLAUDE.md

## Project

MCP (Model Context Protocol) server providing CRUD operations for macOS Calendar via EventKit/PyObjC.

## Stack

- Python 3.12+
- MCP SDK (`mcp[cli]` >= 1.2.1)
- PyObjC >= 11.0 (macOS EventKit bridge)
- loguru (logging)
- hatchling (build system)
- uv (dependency management)
- pytest + pytest-mock (testing)

## Standards

- Strict mypy type checking
- ruff with `target-version = "py312"`, line-length 120
- Google-format docstrings
- `src/` layout (`src/mcp_ical/`)
- `pyproject.toml` only
- Test with pytest-mock for EventKit mocking
- pytest-random-order for test isolation

## Key Paths

- `src/mcp_ical/` - Server implementation
  - `server.py` - MCP server entry point
- `tests/` - Test suite

## Commands

```bash
uv sync                    # Install dependencies
uv sync --group dev        # Install with dev deps
pytest                     # Run tests
ruff check src/ tests/     # Lint
ruff format src/ tests/    # Format
mcp-ical                   # Run MCP server
```

## Conventions

- macOS-only (requires EventKit via PyObjC)
- Entry point: `mcp_ical.server:main`
- Calendar access requires macOS permissions grant
