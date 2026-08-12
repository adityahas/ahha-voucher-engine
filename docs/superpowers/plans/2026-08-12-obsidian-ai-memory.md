# Obsidian AI Memory Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install Obsidian and integrate it as the persistent AI memory/note-taking layer for all agents (opencode, Claude Code, Paperclip) via the Local REST API plugin and `cyanheads/obsidian-mcp-server`, with the vault git-tracked inside this repo.

**Architecture:** Obsidian Desktop app (brew cask) hosts the vault at `vault/` in the repo root. The Local REST API plugin (v4.0.0+) exposes HTTP on `127.0.0.1:27123`. `cyanheads/obsidian-mcp-server` runs via `npx` as a stdio MCP server and is registered in each agent's MCP config (opencode `opencode.json`, Claude Code `settings.json`, Paperclip agent config). Agents call MCP tools; the server proxies to the plugin; plugin reads/writes markdown files in the vault. The vault `.obsidian/` folder is gitignored so app/plugin config never lands in git.

**Tech Stack:** Obsidian (brew cask), Local REST API plugin, `cyanheads/obsidian-mcp-server` (Node 24+ required — machine has Node v26.2.0, OK), git.

## Global Constraints

- Obsidian app must be running for MCP tools to work (Local REST API only serves while the app is open).
- Local REST API plugin version must be >= 4.0.0.
- HTTP (non-encrypted) server on port `27123` must be enabled in the plugin.
- API key must never be committed to git (lives only in agent config files; config files are outside the repo).
- `vault/.obsidian/` must stay untracked (`.gitignore` in vault dir).
- All agent config edits: `~/.config/opencode/opencode.json`, `~/.claude/settings.json`, Paperclip agent config under `~/.paperclip/instances/default/`.
- Node binaries at `/opt/homebrew/bin` (export PATH if needed).

---

## File Structure (map)

| File                                                                                                    | Responsibility                             |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `vault/.gitignore`                                                                                      | Excludes `.obsidian/` and secrets from git |
| `vault/index.md`                                                                                        | Map of Content (MOC) for the vault         |
| `vault/inbox/`, `vault/Projects/`, `vault/Areas/`, `vault/Resources/`, `vault/Archive/`, `vault/daily/` | PARA + daily-notes folder structure        |
| `~/.config/opencode/opencode.json`                                                                      | Add `mcp.obsidian` entry                   |
| `~/.claude/settings.json`                                                                               | Add `mcpServers.obsidian` entry            |
| Paperclip agent config (location discovered in Task 6)                                                  | Add MCP server entry                       |

---

### Task 1: Install Obsidian Desktop App

**Files:** none (system install)

- [ ] **Step 1: Install via Homebrew**

Run:

```bash
brew install --cask obsidian
```

Expected: completes without error; `Obsidian` appears in `/Applications`.

- [ ] **Step 2: Verify installation**

Run:

```bash
ls -d /Applications/Obsidian.app
```

Expected: `/Applications/Obsidian.app` exists.

- [ ] **Step 3: Commit placeholder note (repo hygiene)**

The vault does not exist yet — nothing to commit in this task.

---

### Task 2: Create the git-tracked vault structure in the repo

**Files:**

- Create: `vault/.gitignore`
- Create: `vault/index.md`
- Create (empty dirs, tracked via `.gitkeep`): `vault/inbox/`, `vault/Projects/`, `vault/Areas/`, `vault/Resources/`, `vault/Archive/`, `vault/daily/`

- [ ] **Step 1: Create vault directory skeleton**

Run:

```bash
mkdir -p vault/inbox vault/Projects vault/Areas vault/Resources vault/Archive vault/daily
touch vault/inbox/.gitkeep vault/Projects/.gitkeep vault/Areas/.gitkeep vault/Resources/.gitkeep vault/Archive/.gitkeep vault/daily/.gitkeep
```

Expected: no errors; `ls vault` shows the six folders.

- [ ] **Step 2: Write `vault/.gitignore`**

Create file `vault/.gitignore` with content:

```gitignore
# Obsidian app + plugin config — never commit
.obsidian/

# Secrets
*.key
*.pem
.env
```

- [ ] **Step 3: Write `vault/index.md` (Map of Content)**

Create file `vault/index.md` with content:

```markdown
# Memory Vault — Map of Content

Git-tracked AI memory for this repo. Structure follows PARA:

- `inbox/` — quick capture; triage later
- `Projects/` — active work with goals/deadlines
- `Areas/` — ongoing responsibilities (people, companies)
- `Resources/` — reference material & topics
- `Archive/` — inactive items
- `daily/` — daily notes `YYYY-MM-DD.md` (timeline)

## Recent daily notes

<!-- search results go here, or link daily notes as they are created -->

## Active projects

<!-- one link per active project folder/note -->
```

- [ ] **Step 4: Commit the vault skeleton**

Run:

```bash
git add vault/
git commit -m "feat: add Obsidian vault skeleton (PARA structure, gitignored .obsidian)"
```

Expected: commit succeeds; `git status` shows no `.obsidian/` anywhere.

- [ ] **Step 5: Verify gitignore works**

Run:

```bash
mkdir -p vault/.obsidian && echo x > vault/.obsidian/test && git status --short
```

Expected: `vault/.obsidian/test` does NOT appear in `git status`. Clean up:

```bash
rm -rf vault/.obsidian
```

---

### Task 3: Open vault in Obsidian + install & configure Local REST API plugin

**Files:** none (GUI steps; the plugin generates an API key the user must copy)

> GUI steps must be performed by the human. This task cannot be fully automated.

- [ ] **Step 1: Open the vault in Obsidian**

Launch Obsidian (open `/Applications/Obsidian.app`), click **"Open folder as vault"**, select the repo's `vault/` directory, and confirm.

Expected: Obsidian shows the folder tree with `index.md` and the six PARA folders.

- [ ] **Step 2: Enable community plugins**

Settings → **Community plugins** → turn ON **"Restricted mode"** off / enable community plugins → accept the warning.

- [ ] **Step 3: Install Local REST API plugin**

Settings → Community plugins → **Browse** → search **"Local REST API"** (by coddingtonbear, version >= 4.0.0) → **Install** → **Enable**.

- [ ] **Step 4: Configure the plugin**

Plugin settings (Settings → Local REST API):

- Under **API Settings**: click **"Generate API Key"** → copy the key. Keep it safe — it goes into agent configs in Tasks 4–6.
- Under **Advanced Settings**: enable **"Non-encrypted (HTTP) Server"** (port `27123`).
- Optionally test: click **"Test the API"** in plugin settings — expected OK.

- [ ] **Step 5: Verify the API responds**

Run (replace `<API_KEY>` with the copied key):

```bash
curl -s http://127.0.0.1:27123/ -H "Authorization: Bearer <API_KEY>"
```

Expected: HTTP 200 JSON like `{"authenticated":true,...}`. (App must stay open.)

- [ ] **Step 6: Export the API key for later tasks**

Save the key to a shell var for this session (NOT committed anywhere):

```bash
export OBSIDIAN_API_KEY="<API_KEY>"
echo $OBSIDIAN_API_KEY | wc -c
```

Expected: prints key length (> 10).

---

### Task 4: Register MCP server in opencode

**Files:**

- Modify: `~/.config/opencode/opencode.json` (add `mcp.obsidian` entry)

- [ ] **Step 1: Read current opencode config**

Run:

```bash
cat ~/.config/opencode/opencode.json
```

Confirm the `mcp` block currently contains only `jira`.

- [ ] **Step 2: Add the obsidian MCP entry**

Edit `~/.config/opencode/opencode.json` so the `mcp` block reads:

```json
"mcp": {
  "jira": {
    "type": "local",
    "command": ["npx", "-y", "mcp-jira-cloud"],
    "environment": {
      "JIRA_HOST": "https://akarintiteknologi.atlassian.net",
      "JIRA_EMAIL": "aditya.hadi@akarinti.tech",
      "JIRA_API_TOKEN": "<JIRA_API_TOKEN>"
    },
    "enabled": true
  },
  "obsidian": {
    "type": "local",
    "command": ["npx", "-y", "obsidian-mcp-server"],
    "environment": {
      "MCP_TRANSPORT_TYPE": "stdio",
      "OBSIDIAN_API_KEY": "<API_KEY>",
      "OBSIDIAN_BASE_URL": "http://127.0.0.1:27123"
    },
    "enabled": true
  }
}
```

Replace `<API_KEY>` with the key from Task 3.

- [ ] **Step 3: Verify JSON is valid**

Run:

```bash
python3 -m json.tool ~/.config/opencode/opencode.json > /dev/null && echo VALID
```

Expected: prints `VALID`.

- [ ] **Step 4: Verify the MCP server starts (dry-run, standalone)**

Run (uses the same env as opencode would):

```bash
OBSIDIAN_API_KEY="<API_KEY>" OBSIDIAN_BASE_URL="http://127.0.0.1:27123" timeout 15 npx -y obsidian-mcp-server < /dev/null 2>&1 | head -5
```

Expected: MCP stdio startup output (JSON-RPC handshake / no stack trace). With no input it may wait — the key check is: no crash within 15s.

- [ ] **Step 5: Note restart requirement**

opencode picks up config changes on restart. Record: restart the opencode session before testing in Task 7.

---

### Task 5: Register MCP server in Claude Code

**Files:**

- Modify: `~/.claude/settings.json` (add `mcpServers.obsidian`)

- [ ] **Step 1: Read current Claude Code settings**

Run:

```bash
cat ~/.claude/settings.json
```

If the file does not exist, create it with `{}`.

- [ ] **Step 2: Add the obsidian MCP entry**

Edit `~/.claude/settings.json` so it contains:

```json
{
  "mcpServers": {
    "obsidian": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "obsidian-mcp-server"],
      "env": {
        "MCP_TRANSPORT_TYPE": "stdio",
        "OBSIDIAN_API_KEY": "<API_KEY>",
        "OBSIDIAN_BASE_URL": "http://127.0.0.1:27123"
      }
    }
  }
}
```

Replace `<API_KEY>` with the key from Task 3.

- [ ] **Step 3: Verify JSON is valid**

Run:

```bash
python3 -m json.tool ~/.claude/settings.json > /dev/null && echo VALID
```

Expected: prints `VALID`.

- [ ] **Step 4: Verify Claude Code sees the server**

Run `claude` (if installed), then in the session:

```
/mcp
```

Expected: `obsidian` listed as an MCP server.

---

### Task 6: Register MCP server for Paperclip agents

**Files:** Paperclip agent config (path discovered in this task)

- [ ] **Step 1: Locate Paperclip agent configs**

Run:

```bash
ls ~/.paperclip/instances/default/
```

Expected: shows config directories (e.g., `agents/`, `skills/`, `config/`). Note the agents config location (e.g., `~/.paperclip/instances/default/agents/` or a per-agent JSON).

- [ ] **Step 2: Identify the agent(s) to enable**

Run:

```bash
ls ~/.paperclip/instances/default/agents/ 2>/dev/null || ls ~/.paperclip/instances/default/config/ 2>/dev/null
```

Pick the agent(s) that need memory access (ask the user if ambiguous).

- [ ] **Step 3: Add the MCP entry to the agent config**

Edit the chosen agent config file, adding the server to its MCP list:

```json
{
  "mcpServers": {
    "obsidian": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "obsidian-mcp-server"],
      "env": {
        "MCP_TRANSPORT_TYPE": "stdio",
        "OBSIDIAN_API_KEY": "<API_KEY>",
        "OBSIDIAN_BASE_URL": "http://127.0.0.1:27123"
      }
    }
  }
}
```

Replace `<API_KEY>` with the key from Task 3. (Exact key names follow whatever schema that config uses; verify against an existing entry in the same file.)

- [ ] **Step 4: Verify JSON validity**

Run:

```bash
python3 -m json.tool <paperclip-config-file> > /dev/null && echo VALID
```

Expected: prints `VALID`.

- [ ] **Step 5: Restart Paperclip**

Restart the Paperclip service/instance so the new MCP config loads (per Paperclip docs).

---

### Task 7: End-to-end verification

**Files:** none (creates then removes a test note via MCP)

> Prereqs: Obsidian app open, plugin running, opencode restarted (Task 4 Step 5).

- [ ] **Step 1: Verify opencode sees the server**

In an opencode session, run `/mcp` (or check the MCP connection list).
Expected: `obsidian` listed and connected.

- [ ] **Step 2: Write a test note via MCP**

Call the MCP tool `obsidian_write_note` with `path: "inbox/mcp-test.md"` and content `# MCP Test\n\nCreated by integration verification.`.
Expected: tool returns success; no error.

- [ ] **Step 3: Verify the file exists on disk**

Run:

```bash
git status --short vault/inbox/
cat vault/inbox/mcp-test.md
```

Expected: `vault/inbox/mcp-test.md` is untracked/modified in git status; file content matches.

- [ ] **Step 4: Search for the note via MCP**

Call `obsidian_search_notes` with `mode: "text"`, `query: "integration verification"`.
Expected: hits include `inbox/mcp-test.md`.

- [ ] **Step 5: Verify Claude Code + Paperclip paths**

- Claude Code `/mcp` shows `obsidian` connected (from Task 5).
- Paperclip agent can call the same search tool (from Task 6).

- [ ] **Step 6: Confirm `.obsidian/` stays untracked**

Run:

```bash
git status --short | grep -c ".obsidian"
```

Expected: `0`.

- [ ] **Step 7: Clean up the test note**

Call `obsidian_delete_note` with `path: "inbox/mcp-test.md"` (or `rm vault/inbox/mcp-test.md` if the delete tool is unavailable).

Run:

```bash
git status --short vault/inbox/
```

Expected: no changes; working tree clean for `vault/inbox/`.

- [ ] **Step 8: Commit any remaining vault docs**

If `index.md` or `.gitkeep` files were not yet committed (Task 2 missed anything), commit them now.

---

## Self-Review Notes

- Spec coverage: install app (T1) ✓, vault in repo (T2) ✓, plugin + API key (T3) ✓, MCP config opencode (T4) ✓, Claude Code (T5) ✓, Paperclip (T6) ✓, verification incl. search + gitignore (T7) ✓, error handling (documented in T3/T4/T7) ✓.
- No placeholders: every step has real commands/config; `<API_KEY>` is the only variable, populated by the user in Task 3.
- Type consistency: env var names `MCP_TRANSPORT_TYPE`, `OBSIDIAN_API_KEY`, `OBSIDIAN_BASE_URL` identical across Tasks 4–6; tool names `obsidian_write_note`, `obsidian_search_notes`, `obsidian_delete_note` consistent within Task 7.
