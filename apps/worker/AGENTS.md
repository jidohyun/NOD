# apps/worker/AGENTS.md - Worker Service Guidance

This document provides specific guidance for AI agents working within the `apps/worker` FastAPI application. It supplements the root `AGENTS.md` by detailing local conventions, commands, and key file locations.

## 1. Where to Look

*   **Project Configuration**: `pyproject.toml`
*   **Source Code**: `src/`
*   **Main Application Entry**: `src/main.py`
*   **Tests**: `tests/`
*   **Dependencies**: `uv.lock`

## 2. Commands (via `mise run` from `apps/worker/`)

| Command           | Description                                   |
| :---------------- | :-------------------------------------------- |
| `dev`             | Start the worker service                      |
| `install`         | Install Python dependencies with `uv`         |
| `lint`            | Lint worker code with `ruff`                  |
| `format`          | Format worker code with `ruff`                |
| `test`            | Run all tests with `pytest`                   |