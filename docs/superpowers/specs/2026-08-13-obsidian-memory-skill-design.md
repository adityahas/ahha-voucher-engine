# Obsidian Memory Auto-Save Skill — Design Spec

**Date:** 2026-08-13
**Status:** Approved (design)

## Purpose

Add an automatic memory layer to the Obsidian vault: a global `obsidian-memory` skill for
opencode that instructs agents to save daily notes and durable facts into the vault via the
existing Obsidian MCP server. The vault is relocated out of the repo so memory is global and
reusable across projects.

## Decisions (from brainstorming)

| Question              | Decision                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Scope of what to save | Daily notes (session summaries + decisions) + durable facts (people, companies, projects, technical decisions) |
| Trigger               | Called by the agent: on "remember this", on durable facts during a session, at end of session                  |
| Skill location        | Global — `~/.config/opencode/skills/obsidian-memory/`                                                          |
| Vault location        | Moved out of the repo to `~/ObsidianVault` (no git versioning; not per-project)                                |
| Approach              | Instruction-only SKILL.md (no helper scripts)                                                                  |

## Part 1 — Vault Relocation

Move the existing `vault/` directory from the repo root to `~/ObsidianVault`:

```
Before:  <repo>/vault/            (git-tracked)
After:   ~/ObsidianVault/         (outside repo)
           ├── inbox/
           ├── Projects/
           ├── Areas/
           ├── Resources/
           ├── Archive/
           ├── daily/
           ├── index.md
           └── .obsidian/         (app + plugin config moves along)
```

- PARA structure, daily notes, and `index.md` remain unchanged.
- `.obsidian/` config (including the installed Local REST API plugin and its API key) moves
  with the directory — no plugin re-setup or new API key required.
- Repo: `git rm -r vault/` and commit the removal.
- Obsidian app: reopen the vault at the new location once via the UI.
- MCP server config unchanged — it connects via REST API port `27123`, not a file path.

## Part 2 — `obsidian-memory` Skill

File: `~/.config/opencode/skills/obsidian-memory/SKILL.md`

### Triggers (when the agent should invoke the skill)

1. User says "remember this" / "simpan ke memory" / "catat ini".
2. A durable fact emerges during the session (people, companies, projects, tech stack,
   architectural decisions, etc.).
3. End of session — save a summary when there were significant changes.

### Behavior

- **Daily note** → `~/ObsidianVault/daily/YYYY-MM-DD.md`
  - Session summary (what was done, decisions, blockers).
  - Append via `obsidian_append_to_note`; frontmatter `date` + `tags: [daily]`.
- **Durable facts** → PARA folders by kind:
  - People → `Areas/people/<name>.md`
  - Companies → `Areas/companies/<name>.md`
  - Active projects → `Projects/<name>.md`
  - Reference topics → `Resources/<topic>.md`
  - Each fact file: frontmatter (`tags`, `created`, `project` when relevant) + concise fact
    bullets.
- **Dedup**: before writing to an existing note, read it first via `obsidian_get_note`;
  append if present, create if missing — never duplicate.
- **Consistent tags**: `daily`, `project/ahha-voucher-engine`, `people`, `company`
  (future-proof for multi-project even though the vault is single).
- **index.md**: after writing, update the Map of Content when adding a new active project.

### Error Handling

| Scenario                 | Behavior                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------ |
| Obsidian app not running | MCP tools fail; fall back to a local scratch note and tell the user to open Obsidian |
| Path/folder missing      | Create it via MCP write (paths auto-created)                                         |

### Verification

- Simulate: user asks "remember X" → file appears in `~/ObsidianVault`.
- Check frontmatter and tags are correct.
- Check dedup: calling the same fact twice → one file, no duplicate.
- Check daily note appends to the correct date.

## Out of Scope

- Git versioning of the vault (deliberately removed).
- Semantic/vector RAG over the vault (future, optional).
- Auto-trigger via opencode hooks/plugins (agent-called only).
