# Monorepo Development Service Launcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an easy, unified development launcher for all 10 microservices and frontends in the monorepo using Docker Compose Profiles and shortcuts.

**Architecture:** A standalone `docker-compose.dev.yml` definition using source code volume mounts (`./apps`, `./libs`) for hot-reloading, isolated node_modules volumes, service dependency healthchecks, and CLI profile triggers (`backend`, `frontend`, `admin`, `consumer`, `all`). CLI shortcuts are exposed via `package.json` and `Makefile`.

**Tech Stack:** Docker Compose v2, NestJS CLI watch mode, Vite dev server, Yarn, Makefile.

## Global Constraints

- Preserve all existing production files (`docker-compose.yml`, `docker-compose.prod.yml`).
- Keep ports identical to existing configuration (`postgres`: 5432, `redis`: 6379, `admin`: 9002, `loyalty-admin`: 9003, `user-admin`: 9004, `loyalty-consumer`: 9005, `user-consumer`: 9006, `product-admin`: 9007, `product-consumer`: 9008, `redistro`: 9009, `frontend-cms`: 5173, `frontend-consumer`: 5174).
- Do not run `git commit` automatically per user rules.

---

### Task 1: Create `docker-compose.dev.yml`

**Files:**

- Create: `docker-compose.dev.yml`

**Interfaces:**

- Consumes: Existing `Dockerfile`, `Dockerfile.cms`, `Dockerfile.consumer`, `.env`
- Produces: Docker Compose configuration file with profiles `infra`, `backend`, `frontend`, `admin`, `consumer`, `all`

- [ ] **Step 1: Write `docker-compose.dev.yml`**

Create `docker-compose.dev.yml` with all microservices, volume mounts, dev commands, and profiles.

- [ ] **Step 2: Validate compose file syntax**

Run: `docker compose -f docker-compose.dev.yml config`  
Expected: Valid YAML output listing services and profiles without syntax errors.

---

### Task 2: Update `package.json` Scripts

**Files:**

- Modify: `package.json`

**Interfaces:**

- Consumes: `docker-compose.dev.yml`
- Produces: `yarn dev`, `yarn dev:infra`, `yarn dev:backend`, `yarn dev:frontend`, `yarn dev:admin`, `yarn dev:consumer`, `yarn dev:down`

- [ ] **Step 1: Add dev scripts to `package.json`**

Add scripts mapping to `docker compose -f docker-compose.dev.yml`.

- [ ] **Step 2: Verify `package.json` validity**

Run: `yarn format:check` or `yarn lint`  
Expected: `package.json` is valid JSON and formatted.

---

### Task 3: Update `Makefile` Targets

**Files:**

- Modify: `Makefile`

**Interfaces:**

- Consumes: `package.json` scripts or `docker compose -f docker-compose.dev.yml`
- Produces: `make dev`, `make dev-infra`, `make dev-backend`, `make dev-frontend`, `make dev-admin`, `make dev-consumer`, `make dev-all`, `make dev-down`

- [ ] **Step 1: Add dev targets to `Makefile`**

Add `.PHONY` targets for dev workflows.

- [ ] **Step 2: Test `make` target dry run**

Run: `make -n dev-infra`  
Expected: Prints `docker compose -f docker-compose.dev.yml up -d postgres redis`

---

### Task 4: Verification & Execution Handoff

**Files:**

- Test: Infrastructure and profile startup

- [ ] **Step 1: Run `make dev-infra` to test container startup**

Run: `make dev-infra`  
Expected: Postgres and Redis containers start and report healthy status.

- [ ] **Step 2: Clean up test containers**

Run: `make dev-down`  
Expected: Containers stopped cleanly.
