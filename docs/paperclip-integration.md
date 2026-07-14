# Paperclip Integration Guide

> Setup and configuration guide for Paperclip.ing integration with the Ahha Voucher Engine engineering workflow.

---

## Overview

Paperclip.ing orchestrates AI agent work for the Ahha Voucher Engine codebase. This guide covers:

1. **GitHub PR Review** — PRs are synced to Paperclip issues; CTO agent reviews automatically
2. **Local Deploy on Merge** — Approved and merged PRs trigger staging deployment
3. **Plugin Setup** — GitHub Issues sync plugin for bidirectional sync

---

## Prerequisites

- Paperclip.ing instance running (local or hosted)
- Paperclip API key (board or agent token)
- GitHub personal access token with `repo` scope (for plugin)

---

## 1. Paperclip Instance Setup

### Start the server

```bash
npx paperclipai run
```

The server starts on `http://localhost:3100` by default. Verify:

```bash
curl http://localhost:3100/api/health
```

### Generate an API key

```bash
# Board API key (full access)
npx paperclipai token board create --name "github-actions"

# Or agent API key (limited scope)
npx paperclipai token agent create --name "pr-review-bot"
```

Save the generated key as a GitHub secret `PAPERCLIP_API_KEY` and set the variable `PAPERCLIP_API_URL` to your Paperclip instance URL.

---

## 2. GitHub Issues Sync Plugin

The `paperclip-plugin-github-issues` plugin provides bidirectional sync between GitHub Issues/PRs and Paperclip issues.

### Install

```bash
npx paperclipai plugin install paperclip-plugin-github-issues --api-base http://localhost:3100
```

### Configure

1. In Paperclip Settings → GitHub Issues Sync:
   - **GitHub Token:** Create a PAT secret in Paperclip Secrets with `repo` scope
   - **Default Repository:** `<owner>/ahha-voucher-engine`
   - **Sync Comments:** Enabled
   - **Sync Direction:** Bidirectional

2. Set up a GitHub webhook (optional, for real-time sync):
   - **Webhook URL:** `https://<your-instance>/api/plugins/paperclip-plugin-github-issues/webhooks/github-events`
   - **Events:** Issues, Issue comments, Pull requests

### Link a PR to Paperclip

Use the agent tool during a Paperclip run:

```
github:link <owner>/<repo> <issue-number>
```

---

## 3. GitHub Actions Workflows

### PR Review (`pr-review.yml`)

Triggers on PR opened/reopened/synchronize to `main` or `staging`:

1. Creates a Paperclip issue for the PR
2. Posts a comment on the PR with the Paperclip link
3. CTO agent picks up the review task

**Required secrets/vars:**

- `PAPERCLIP_API_KEY` — API key for Paperclip
- `PAPERCLIP_API_URL` — Base URL of Paperclip instance

### Local Deploy (`pr-local-deploy.yml`)

Triggers on PR merged to `main` or `staging`:

1. Deploys to staging environment via SSH
2. Reports deployment status to Paperclip issue
3. Posts PR comment with deploy confirmation

**Required secrets/vars:**

- `DEPLOY_HOST` / `STAGING_HOST` — Staging server hostname
- `DEPLOY_USER` — SSH user
- `DEPLOY_SSH_KEY` — SSH private key
- `DEPLOY_PATH` — Deployment directory (default: `/opt/ahha-staging`)

---

## 4. PR Review Workflow

End-to-end flow:

```
Developer opens PR
    │
    ▼
GitHub Action triggers pr-review.yml
    │
    ▼
Paperclip issue created (synced via plugin or API)
    │
    ▼
CTO agent reviews PR (code, architecture, security)
    │
    ├─► Requests changes → Developer updates PR → Cycle repeats
    │
    └─► Approves → PR merged
                    │
                    ▼
            GitHub Action triggers pr-local-deploy.yml
                    │
                    ▼
            Deploy to staging + notify Paperclip
```

---

## 5. Agent Configuration

The CTO agent is configured at:
`~/.paperclip/instances/default/companies/<id>/agents/<id>/instructions/AGENTS.md`

To create a dedicated PR reviewer agent:

```bash
npx paperclipai agent create \
  --name "PR Reviewer" \
  --role "Reviews pull requests for code quality, architecture, and security" \
  --api-base http://localhost:3100
```

---

## 6. Environment Variables Reference

| Variable             | Scope          | Description                        |
| -------------------- | -------------- | ---------------------------------- |
| `PAPERCLIP_API_URL`  | GitHub Actions | Paperclip instance base URL        |
| `PAPERCLIP_API_KEY`  | GitHub Secrets | Paperclip API token                |
| `STAGING_HOST`       | GitHub Actions | Staging server hostname            |
| `DEPLOY_USER`        | GitHub Actions | SSH username for deploy            |
| `DEPLOY_SSH_KEY`     | GitHub Secrets | SSH private key for deploy         |
| `DEPLOY_PATH`        | GitHub Actions | Deployment directory on server     |
| `CONTAINER_REGISTRY` | GitHub Actions | Docker registry (default: ghcr.io) |

---

## 7. Troubleshooting

### Paperclip server not reachable

```bash
# Check if server is running
curl http://localhost:3100/api/health

# Restart if needed
npx paperclipai run
```

### Plugin installation fails with 403

The instance requires board authentication. Either:

- Complete the board claim (visit the URL shown during `paperclipai run`)
- Or generate a board API key with `npx paperclipai token board create`

### GitHub webhook not delivering

- Verify the webhook URL is publicly accessible (use ngrok for local instances)
- Check the webhook delivery log in GitHub repo settings
- Ensure the plugin is installed and running
