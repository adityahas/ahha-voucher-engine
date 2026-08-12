# Obsidian as AI Memory — Design Spec

**Date:** 2026-08-12
**Status:** Approved (design)

## Purpose

Install Obsidian and integrate it as the persistent memory / note-taking layer for AI agents
(opencode, Claude Code, Paperclip). Agents read/write/search vault notes over MCP; the user
browses the same notes visually in the Obsidian app. The vault lives inside this repo so all
notes are versioned in git.

## Decisions (from brainstorming)

| Question         | Decision                                                                               |
| ---------------- | -------------------------------------------------------------------------------------- |
| Primary goal     | AI note-taking & memory (second brain)                                                 |
| Vault location   | Inside this repo: `vault/` at repo root                                                |
| Scope            | All agents: opencode + Claude Code + Paperclip                                         |
| Integration path | **Approach A**: Obsidian app + Local REST API plugin + `cyanheads/obsidian-mcp-server` |

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  AI Agents (opencode / Claude Code / Paperclip)          │
│  → MCP client: calls tools (read/write/search note)      │
└──────────────────────────┬───────────────────────────────┘
                           │ MCP over stdio (npx)
┌──────────────────────────▼───────────────────────────────┐
│  cyanheads/obsidian-mcp-server  (via npx, no build)      │
│  env: OBSIDIAN_API_KEY, OBSIDIAN_BASE_URL            │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTP 127.0.0.1:27123 (Local REST API)
┌──────────────────────────▼───────────────────────────────┐
│  Obsidian Desktop App (brew --cask) + Local REST API     │
│  plugin — must be running                                │
└──────────────────────────┬───────────────────────────────┘
                           │ filesystem
┌──────────────────────────▼───────────────────────────────┐
│  Vault: vault/ (git-tracked)                             │
│  vault/.obsidian/ → gitignored                           │
└──────────────────────────────────────────────────────────┘
```

## Components

1. **Obsidian Desktop App** — installed via `brew install --cask obsidian`; open the vault at
   `vault/` once via the UI.
2. **Local REST API plugin** — installed from Obsidian Community Plugins; generates an API key;
   default port `27123`.
3. **MCP server** (`cyanheads/obsidian-mcp-server`) — three config entries, all via npx:
   - `~/.config/opencode/opencode.json` (mcp block)
   - `~/.claude/settings.json` (Claude Code `mcpServers`)
   - Paperclip agent config (for agents that need memory access)
4. **Vault structure** (PARA + daily notes, AI-optimized):

   ```
   vault/
     .obsidian/          → gitignored (app + plugin config)
     inbox/              → quick capture area
     Projects/           → active work (goal/deadline)
     Areas/              → ongoing responsibilities (people, companies)
     Resources/          → reference material & topics
     Archive/            → inactive items
     daily/YYYY-MM-DD.md → daily notes (timeline)
     index.md            → Map of Content
   ```

5. **Security**: API key lives in env config only (never committed); `.gitignore` excludes
   `.obsidian/` and any secret files.

## Data Flow

1. Agent calls an MCP tool (e.g., `obsidian_write_note`, `obsidian_search_notes`).
2. `obsidian-mcp-server` (npx process, spawned per client) forwards the request to Local REST
   API `http://127.0.0.1:27123` with the API key header.
3. Obsidian app handles the request, reading/writing markdown files in `vault/`.
4. Changes persist to disk automatically; file-based memory skills (e.g., para-memory-files) can
   still access files directly as a fallback.
5. Git versioning: note changes show in `git status`; commits follow the normal workflow.

Example flow: user says "remember this fact" → agent calls `obsidian_write_note` into
`Areas/companies/akarinti.md` → persisted → a later session finds it via `obsidian_search_notes`.

## Error Handling

| Scenario                 | Behavior                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------- |
| Obsidian app not running | MCP tools fail (connection refused). Documented: app must be running.                 |
| Wrong API key            | `401` → clear error; re-check plugin settings.                                        |
| Path outside scope       | `path_forbidden` → server refuses (via `OBSIDIAN_READ_PATHS`/`WRITE_PATHS` policies). |
| Vault not opened yet     | Setup docs: open vault once via the UI first.                                         |
| Port 27123 conflict      | Changeable in plugin settings; adjust `OBSIDIAN_BASE_URL` accordingly.                |

## Testing / Verification

1. `brew install --cask obsidian` succeeds; vault opens.
2. Local REST API plugin active; `curl http://127.0.0.1:27123` responds.
3. MCP server runs: `npx -y obsidian-mcp-server` with no errors; tools registered.
4. **opencode**: create a test note via MCP tool → file appears in `vault/`.
5. **Claude Code**: `/mcp` shows server connected.
6. **Paperclip**: agents can call memory tools.
7. `git status` shows the new note; `.obsidian/` is untracked.
8. `obsidian_search_notes` returns the test note content.

## Out of Scope

- Semantic/vector RAG over the vault (can be added later if needed).
- Migrating existing para-memory-files content into the vault (future, optional).
- Headless/CI access without the Obsidian app (future, optional file-based path).
