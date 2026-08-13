# Obsidian Memory Auto-Save Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relocate the Obsidian vault out of the repo to `~/ObsidianVault` and create a global `obsidian-memory` skill that instructs agents to auto-save daily notes and durable facts into that vault via the existing Obsidian MCP server.

**Architecture:** Two independent deliverables. (1) Vault relocation: move `vault/` → `~/ObsidianVault`, remove it from git, reopen in Obsidian (MCP config unchanged — it talks to REST API port 27123). (2) A global instruction-only skill `~/.config/opencode/skills/obsidian-memory/SKILL.md` that tells agents when to save, where to write (PARA + daily notes), how to dedup, and which MCP tools to call. Verification simulates an agent "remembering" a fact and a daily-note append.

**Tech Stack:** Obsidian Desktop + Local REST API plugin v5.1.0 (HTTP 27123), `cyanheads/obsidian-mcp-server` (MCP tools: `obsidian_write_note`, `obsidian_append_to_note`, `obsidian_get_note`, `obsidian_manage_frontmatter`, `obsidian_manage_tags`, `obsidian_search_notes`, `obsidian_list_notes`), git, bash.

## Global Constraints

- Vault final location: `~/ObsidianVault` (outside repo, no git versioning).
- Repo must no longer track anything under `vault/` after Task 1.
- MCP config (opencode.json / claude settings.json / ~/.codex/config.toml) must NOT change — it connects via REST API port 27123.
- Obsidian app must be running for MCP tools to work; skill includes a fallback.
- Skill lives at `~/.config/opencode/skills/obsidian-memory/SKILL.md` (global, opencode).
- Tags must be consistent: `daily`, `people`, `company`, `project/ahha-voucher-engine`.
- Skill is instruction-only (no helper scripts).
- Node binaries at `/opt/homebrew/bin` (export PATH if needed). No repo commits for machine-level config.

---

## File Structure (map)

| File                                                                     | Responsibility                                                                           |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `~/ObsidianVault/`                                                       | Relocated vault (inbox, Projects, Areas, Resources, Archive, daily, index.md, .obsidian) |
| `~/ObsidianVault/index.md`                                               | Map of Content (existing, moves as-is)                                                   |
| `~/.config/opencode/skills/obsidian-memory/SKILL.md`                     | The agent instruction skill (daily notes + durable facts + dedup)                        |
| repo `docs/superpowers/plans/2026-08-13-obsidian-memory-skill.md`        | This plan                                                                                |
| repo `docs/superpowers/specs/2026-08-13-obsidian-memory-skill-design.md` | Design spec (already committed)                                                          |

---

### Task 1: Relocate the vault to ~/ObsidianVault and remove from git

**Files:**

- Move: `<repo>/vault/` → `~/ObsidianVault/`
- Delete (from git): all files under `vault/`

**Interfaces:**

- Consumes: existing vault at `<repo>/vault/` with `.obsidian/` config + Local REST API plugin.
- Produces: `~/ObsidianVault/` complete vault; repo no longer tracks `vault/`.

- [ ] **Step 1: Move the entire vault directory**

Run:

```bash
mv /Users/adityahas/Projects/NodeJS/ahha-voucher-engine/vault /Users/adityahas/ObsidianVault
```

Verify:

```bash
ls /Users/adityahas/ObsidianVault/
```

Expected: shows `inbox/ Projects/ Areas/ Resources/ Archive/ daily/ index.md .obsidian/`.

- [ ] **Step 2: Remove vault from git tracking**

Run:

```bash
git rm -r --cached vault/
git commit -m "chore: move Obsidian vault out of repo (now at ~/ObsidianVault)"
```

Expected: commit succeeds; `git status` shows no `vault/` entries.

- [ ] **Step 3: Remove any leftover empty vault dir in repo**

Run:

```bash
rm -rf /Users/adityahas/Projects/NodeJS/ahha-voucher-engine/vault
git status --short | grep -c vault
```

Expected: prints `0`.

- [ ] **Step 4: User step — reopen vault in Obsidian**

Open Obsidian → click the vault picker (icon bottom-left) → **Open folder as vault** → select `~/ObsidianVault`. Confirm the tree shows index.md + PARA folders.

- [ ] **Step 5: Verify MCP still works after relocation**

Run:

```bash
curl -s http://127.0.0.1:27123/ -H "Authorization: Bearer <OBSIDIAN_API_KEY>"
```

Expected: `"authenticated": true`. (The plugin config + API key moved with `.obsidian/`.)

---

### Task 2: Create the global `obsidian-memory` skill

**Files:**

- Create: `~/.config/opencode/skills/obsidian-memory/SKILL.md`

**Interfaces:**

- Consumes: Obsidian MCP server (tools listed in Global Constraints), vault at `~/ObsidianVault`.
- Produces: `obsidian-memory` skill registered in opencode; agent instructions for saving memory.

- [ ] **Step 1: Create the skill directory**

Run:

```bash
mkdir -p ~/.config/opencode/skills/obsidian-memory
```

Expected: directory exists.

- [ ] **Step 2: Write the SKILL.md**

Create file `~/.config/opencode/skills/obsidian-memory/SKILL.md` with EXACTLY this content:

```markdown
---
name: obsidian-memory
description: "Persistent AI memory via the Obsidian vault at ~/ObsidianVault. Use when the user says 'remember this' / 'simpan ke memory' / 'catat ini', when a durable fact emerges during the session (people, companies, projects, tech stack, decisions), or at the end of a session to summarize what changed. Saves daily notes and durable facts through the Obsidian MCP server."
---

# obsidian-memory

Persistent memory through the Obsidian vault at `~/ObsidianVault`. All writes go through the
Obsidian MCP server tools — never write vault files directly with shell tools.

## When to invoke

1. User says "remember this", "simpan ke memory", "catat ini", or similar.
2. A durable fact emerges mid-session: people, companies, active projects, tech stack,
   architectural/technical decisions, preferences, lessons learned.
3. End of a significant session: save a summary of what was done, decisions, and blockers.

## Vault structure (PARA)
```

~/ObsidianVault/
inbox/ quick capture; triage later
Projects/ active work with goals/deadlines → <name>.md
Areas/ ongoing responsibilities
people/ → <name>.md
companies/ → <name>.md
Resources/ reference material & topics → <topic>.md
Archive/ inactive items
daily/ → YYYY-MM-DD.md
index.md Map of Content

````

## Save rules

### Daily note (`daily/YYYY-MM-DD.md`)

- Append, do not overwrite. Use `obsidian_append_to_note` with `section` omitted (append to
  file end), target `{ type: "path", path: "daily/YYYY-MM-DD.md" }`.
- First creation: use `obsidian_write_note` with content that includes frontmatter:
  ```markdown
  ---
  date: YYYY-MM-DD
  tags: [daily]
  ---

  ## Summary
````

- Content style: bullet list — what was done, decisions taken, blockers, next actions.
- If the note already exists (check with `obsidian_get_note`), append a new section under the
  current session heading.

### Durable facts (PARA folders)

- **Person** → `Areas/people/<first-last>.md`
- **Company** → `Areas/companies/<name>.md`
- **Active project** → `Projects/<name>.md`
- **Reference topic** → `Resources/<topic>.md`
- Frontmatter (create/merge via `obsidian_manage_frontmatter`):
  ```yaml
  tags: [people] # or company / project/ahha-voucher-engine
  created: YYYY-MM-DD
  project: ahha-voucher-engine # only when project-specific
  ```
- Body: concise fact bullets, present tense, one fact per bullet. Example:
  ```markdown
  ## Facts

  - Works at Akarinti Teknologi (software engineer).
  - Prefers Indonesian for conversation, English for docs.
  ```

### Dedup — read before write

1. `obsidian_get_note` with the target path.
2. If it exists → append new facts (or merge into existing bullets); never create a duplicate note.
3. If missing → `obsidian_write_note` to create it.
4. Never create the same entity twice under two different paths — search first with
   `obsidian_search_notes` (mode `text`) if unsure of an existing filename.

### Update index.md when adding a new active project

After creating `Projects/<name>.md`, update the "Active projects" section of `index.md` via
`obsidian_patch_note` (heading `Active projects`) so the MOC links the new project.

## Error handling

- **Obsidian app not running / MCP connection refused**: write the content to a local scratch
  file at `/tmp/obsidian-memory-pending.md` (append), and tell the user to open Obsidian so the
  note can be saved later. Do NOT silently drop the memory.
- **Path/folder missing**: `obsidian_write_note` creates parent paths automatically; no manual
  folder creation needed.
- **Duplicate facts**: if a fact already exists in a note, do not re-add it.

## Verification (for the agent after writing)

1. The file exists: `obsidian_get_note` on the written path returns content.
2. Frontmatter tags are present and correct.
3. Same fact written twice → still one file, no duplicated bullets.

````

- [ ] **Step 3: Verify the skill is discoverable**

Run:
```bash
ls ~/.config/opencode/skills/obsidian-memory/SKILL.md
head -5 ~/.config/opencode/skills/obsidian-memory/SKILL.md
````

Expected: file exists; head shows frontmatter (`name: obsidian-memory`).

- [ ] **Step 4: Note opencode reload**

opencode picks up new skills on restart or `/skills` refresh. Record: reload the session before
Task 3 testing.

---

### Task 3: End-to-end verification of the skill

**Files:** none (writes then cleans up test notes in `~/ObsidianVault`)

**Interfaces:**

- Consumes: `obsidian-memory` skill (Task 2), MCP server, vault at `~/ObsidianVault`.

> Prereqs: Obsidian app open, MCP connected, opencode reloaded (Task 2 Step 4).

- [ ] **Step 1: Confirm the skill is registered**

In an opencode session run `/skills` (or equivalent) and confirm `obsidian-memory` appears.

- [ ] **Step 2: Simulate "remember this" — durable fact**

Call the MCP tools exactly as the skill instructs:

1. `obsidian_search_notes` mode `text`, query `"Akarinti"` → expect no existing note.
2. `obsidian_write_note` target path `Areas/companies/akarinti.md` with content:
   ```markdown
   ---
   tags: [company]
   created: 2026-08-13
   project: ahha-voucher-engine
   ---

   ## Facts

   - Client for the Ahha Voucher Engine (multi-tenant loyalty/voucher SaaS).
   ```
   Expected: success.
3. `obsidian_get_note` on `Areas/companies/akarinti.md` → content matches.

- [ ] **Step 3: Test dedup**

Repeat the write of the SAME fact:

1. `obsidian_get_note` on `Areas/companies/akarinti.md` → exists.
2. Append a second fact bullet via `obsidian_append_to_note` (target same path, section heading `Facts`).
   Expected: note still one file; no duplicate company note created.

- [ ] **Step 4: Simulate daily note append**

1. `obsidian_get_note` on `daily/2026-08-13.md` → likely missing.
2. `obsidian_write_note` on `daily/2026-08-13.md` with:
   ```markdown
   ---
   date: 2026-08-13
   tags: [daily]
   ---

   ## Summary

   - Verified obsidian-memory skill end-to-end.
   ```
   Expected: success.
3. Append one more line via `obsidian_append_to_note` on the same path.
   Expected: file has both lines; not overwritten.

- [ ] **Step 5: Verify on-disk files exist**

Run:

```bash
ls /Users/adityahas/ObsidianVault/Areas/companies/
ls /Users/adityahas/ObsidianVault/daily/
```

Expected: `akarinti.md` and `2026-08-13.md` present.

- [ ] **Step 6: Clean up test notes**

Delete the two test notes via `obsidian_delete_note` (paths `Areas/companies/akarinti.md`,
`daily/2026-08-13.md`).

Run:

```bash
ls /Users/adityahas/ObsidianVault/Areas/companies/ 2>/dev/null
ls /Users/adityahas/ObsidianVault/daily/
```

Expected: `companies/` empty (or only pre-existing files); `daily/` has no `2026-08-13.md`.

- [ ] **Step 7: Confirm repo has no vault leftovers**

Run:

```bash
git status --short | grep -c vault
```

Expected: `0`.

---

## Self-Review Notes

- Spec coverage: relocation (Task 1) ✓, skill global location (Task 2) ✓, triggers (Task 2
  "When to invoke") ✓, daily note format + frontmatter (Task 2) ✓, durable fact PARA mapping
  (Task 2) ✓, dedup read-before-write (Task 2 + Task 3 Step 3) ✓, consistent tags (Task 2,
  Global Constraints) ✓, index.md update (Task 2) ✓, error fallback to /tmp (Task 2) ✓,
  verification incl. dedup + daily append (Task 3) ✓, out-of-scope items not planned ✓.
- No placeholders: every step has exact commands/content; the MCP API key is real and verified.
- Consistency: tool names `obsidian_write_note` / `obsidian_get_note` / `obsidian_append_to_note`
  / `obsidian_search_notes` / `obsidian_delete_note` / `obsidian_manage_frontmatter` /
  `obsidian_patch_note` are identical in Task 2 and Task 3; vault path `~/ObsidianVault` and tag
  names match the spec everywhere.
