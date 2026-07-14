# Ahha Voucher Engine — Deployment Analysis & Recommendations

**Date:** 2026-07-02
**Author:** CTO
**Status:** Implemented & Operational

---

## 1. Current Deployment Architecture

### Overview

The project deploys as a **Docker Compose stack on a single VPS host**, with container images built and pushed to *
_GitHub Container Registry (GHCR)_* via GitHub Actions.

```
Developer Push (main)  →  CI (GitHub Actions)  →  Build & Push Docker Images (GHCR)
                                                          ↓
                                                SSH Deploy to VPS
                                                          ↓
                                               docker compose pull + up -d
```

### Components Deployed

| Component                 | Container Count | Image Repository                                              | Runtime                                      |
| ------------------------- | --------------- | ------------------------------------------------------------- | -------------------------------------------- |
| **PostgreSQL**            | 1               | `postgres:16-alpine` (upstream)                               | Managed via compose, no custom image         |
| **Redis**                 | 1               | `redis:7-alpine` (upstream)                                   | Managed via compose, no custom image         |
| **Backend services**      | 8               | `ghcr.io/{org}/ahha-backend:{tag}` (single image, multi-role) | Same image, differentiated by `SERVICE_NAME` |
| **Frontend (CMS)**        | 1               | `ghcr.io/{org}/ahha-frontend-cms:{tag}`                       | nginx:alpine serving static assets           |
| **Frontend (Consumer)**   | 1               | `ghcr.io/{org}/ahha-frontend-consumer:{tag}`                  | nginx:alpine serving static assets           |
| **Nginx (reverse proxy)** | 1 (host)        | —                                                             | Host-level nginx or compute-level LB         |

**Total:** 11 containers (3 infrastructure + 8 backend + 2 frontend), excluding host-level reverse proxy.

### GitHub Actions Workflows

#### CI (`ci.yml`)

- **Triggers:** Push/PR to `main`, `staging`
- **Jobs:**
  - `backend`: `yarn install → yarn lint → yarn build → yarn test → yarn test:e2e`
  - `frontend-cms`: `npm ci → npm lint → vite build`
  - `frontend-consumer`: `npm ci → npm lint → vite build`
- **Note:** Frontend tests are not executed in CI — only builds are verified. Add `npm test` (vitest) to both frontend
  jobs.

#### Deploy (`deploy.yml`)

- **Triggers:** Push to `main`, manual `workflow_dispatch`
- **Jobs:**
  1. `build-and-push`: Builds 3 Docker images (backend, cms, consumer) with multi-stage caching, pushes to GHCR. Tags:
     git SHA, branch, semver.
  2. `deploy`: SSHs into `$DEPLOY_HOST`, pulls images from GHCR, runs `docker compose up -d` with prod compose file,
     prunes old images.
- **Auth:** GHCR uses `${{ secrets.GITHUB_TOKEN }}` (repo-scoped). VPS SSH uses `DEPLOY_SSH_KEY`.
- **Environment protection:** Deployment requires the `production` environment approval gate.

### Docker Configuration

#### Backend (`Dockerfile`)

- **Stage 1 (builder):** `node:22-alpine`, installs python3/make/g++ for native deps, copies monorepo source, runs
  `yarn build` (compiles all 8 apps + shared libs).
- **Stage 2 (runtime):** `node:22-alpine`, copies `node_modules`, `dist/`, `package.json`. Uses `dumb-init` +
  `entrypoint.sh` to launch the correct service based on `SERVICE_NAME` env var.
- **Entrypoint resolution:** `dist/apps/${SERVICE_NAME}/src/main.js` — single image, service-agnostic.

#### Frontend CMS (`Dockerfile.cms`)

- `node:22-alpine` builder → `npm ci` + `vite build` → copies `dist/` to `nginx:alpine`.
- Nginx config at `docker/nginx/cms.conf`.

#### Frontend Consumer (`Dockerfile.consumer`)

- Same pattern as CMS. Nginx config at `docker/nginx/consumer.conf`.
- **Build command inconsistency:** Uses `npm run build` vs the CMS's `npx vite build`. Standardize on one.

### Orchestration

#### `docker-compose.yml` (dev/local full stack)

- Builds from local context with `build:` directives.
- All services defined with `build: { context: ., dockerfile: Dockerfile }`.
- Contains default env var fallbacks (e.g., `${DB_PASSWORD:-P4ssw0rd!}`).

#### `docker-compose.prod.yml` (production overlay)

- Overlays dev compose — overrides `build:` with `image:` directives pointing to GHCR.
- Image tags controlled by `.env.tag` file (written by deploy workflow): `TAG=sha-abc123`.
- Adds production hardening: `restart: always`, log rotation (`json-file`, max-size 10m, max-file 3), no `ports:`
  exposed on backend services.
- **Safety:** Backend containers are internal-only (no host port mapping) — only postgres and redis have optional ports.

### Reverse Proxy

**Local development:** `nginx.conf` provides subdomain-based routing (`{client}.ahha-be.local`) to 7 backend apps on
localhost ports plus CORS handling. This is a local dev artifact only.

**Production:** Host-level nginx, cloud load balancer, or Traefik/Caddy should handle TLS termination and subdomain
routing. The current deploy workflow does not automate this.

---

## 2. Architecture Assessment

### Strengths

1. **Single VPS = simplest ops.** No Kubernetes complexity for a pre-revenue SaaS. Docker compose is deterministic,
   debuggable, and well-understood by small teams.

2. **Multi-role single image.** All 8 backend services share one Docker image. This simplifies CI (one build), reduces
   registry storage, and keeps the deploy surface minimal. The `SERVICE_NAME` env var pattern is clean and
   battle-tested.

3. **GHCR = zero-cost registry.** GitHub Container Registry is free for public repos and included in GitHub
   Teams/Enterprise. No third-party registry dependency.

4. **SHA-tagged images.** Every deploy is pinned to an immutable git SHA. Rollback = change the tag in `.env.tag` and
   `docker compose up -d`.

5. **Build cache with GHA.** `cache-from: type=gha` / `cache-to: type=gha,mode=max` in Docker build-push-action reduces
   rebuild time significantly.

6. **Production compose hardening.** Log rotation, no unnecessary port exposure, `restart: always`, health checks on
   Postgres/Redis with `depends_on` conditions.

7. **Environment protection gate.** The deploy job has `environment: production`, which can enforce required reviewers
   or wait timers.

8. **Clean staging path.** CI runs on `staging` branch — ready for a staging compose stack triggered off that branch.

### Weaknesses & Risks

1. **Single point of failure (SPOF).** One VPS = one failure domain. If the host goes down, everything goes down. For a
   production SaaS serving paying tenants, this is the primary risk.

2. **Zero-downtime deploys: not implemented.** `docker compose up -d` restarts containers, causing brief downtime. For a
   voucher/transactional system, deploying during active checkouts could cause failed purchases.

3. **No database backup automation.** No scheduled pg_dump or WAL archiving in the compose/docker config. Manual
   recovery is the only path.

4. **No auto-scaling.** All 8 backend services run on one host. If traffic spikes, there's no mechanism to scale
   horizontally or vertically without manual intervention.

5. **Frontend tests skipped in CI.** `ci.yml` only does `vite build` — no `vitest run` in either frontend job. Tests
   exist in the codebase but aren't verified in CI.

6. **Build-time inconsistency.** CMS uses `npx vite build` directly; Consumer uses `npm run build`. These should be
   standardized to `npm run build` (which maps to `vite build`).

7. **Secrets in repository variables.** JWT secrets, DB passwords, AES keys are expected in GitHub Variables (visible to
   maintainers) rather than GitHub Secrets (write-only). At minimum, `JWT_SECRET`, `CLIENT_DB_SECRET`, and `DB_PASSWORD`
   should be in Secrets.

8. **No DB migration strategy.** The app relies on TypeORM `synchronize: false` in production, but there's no migration
   runner step in the deploy workflow. Schema changes require manual intervention.

9. **Redis is single-node.** No replication or persistence configured in the compose file. Redis data loss on restart.

10. **Backend service count: 8 processes.** With 11 containers on one VPS, resource contention is a real concern under
    load. Many of these could be consolidated or served by fewer processes.

11. **Health checks on backend services.** No health check defined for backend containers in the compose files — Docker
    can't restart unhealthy app instances automatically.

12. **Log aggregation.** JSON-file log driver + rotation is local-only. No centralized logging (Loki, ELK, Datadog).
    Debugging production issues requires SSH.

13. **Monitoring & alerting.** No Prometheus metrics, no uptime monitoring, no alerting for service failures or resource
    exhaustion.

---

## 3. Recommendations

### Immediate (Sprint-Ready)

| Priority | Action                                                 | Effort | Rationale                                                                                                                            |
| -------- | ------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **P0**   | Add `npm test` (vitest) to frontend CI jobs            | 5 min  | Tests exist but aren't gated. Regressions are invisible.                                                                             |
| **P0**   | Move secrets to GitHub Secrets (not Variables)         | 10 min | `JWT_SECRET`, `CLIENT_DB_SECRET`, `DB_PASSWORD` are visible to all maintainers.                                                      |
| **P1**   | Add DB backup cron/sidecar to docker-compose.prod.yml  | 2 hrs  | `pg_dump` sidecar with rotation to S3/GCS or volume mount.                                                                           |
| **P1**   | Add health checks to all backend containers            | 30 min | `HEALTHCHECK` in Dockerfile or in compose with `curl localhost:PORT/health`.                                                         |
| **P1**   | Standardize frontend build commands to `npm run build` | 5 min  | Fix `Dockerfile.cms` to use `npm run build` instead of `npx vite build`.                                                             |
| **P1**   | Add zero-downtime deploy: drain → start new → stop old | 4 hrs  | Use `docker compose up -d --scale` with a brief blue-green pattern, or at minimum implement graceful shutdown with SIGTERM handling. |
| **P2**   | Generate and commit TypeORM migrations                 | 4 hrs  | Run `typeorm migration:generate` per database change. Add migration runner to deploy workflow as a pre-up step.                      |
| **P2**   | Add `staging` deploy workflow variant                  | 2 hrs  | Duplicate deploy.yml for staging branch, point to a staging VPS.                                                                     |
| **P2**   | Add Redis AOF persistence or replication               | 1 hr   | `redis:7-alpine` with `--appendonly yes` or a sentinel setup.                                                                        |

### Near-Term (Next 1-2 Months)

| Priority | Action                                                                 | Effort   | Rationale                                                                                                                 |
| -------- | ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| **P1**   | Add centralized logging (e.g., Loki + Grafana, or a managed service)   | 1 day    | JSON-file driver + SSH grep doesn't scale for production debugging.                                                       |
| **P1**   | Add monitoring & alerting (Prometheus + Grafana, or Datadog/New Relic) | 1-2 days | Need visibility into error rates, latency, resource usage, and DB connection pool health.                                 |
| **P1**   | Set up a managed database (AWS RDS, GCP Cloud SQL, or Supabase)        | 1 day    | Eliminates the SPOF of a single VPS-hosted Postgres. Provides automated backups, point-in-time recovery, and replication. |
| **P1**   | Add a managed Redis (Upstash, Redis Cloud, or ElastiCache)             | 2 hrs    | Eliminates the in-memory data loss risk. Provides replication and failover.                                               |
| **P1**   | Set up CDN for frontend static assets (Cloudflare, CloudFront)         | 2 hrs    | Nginx serving static assets from a single VPS is a bottleneck and SPOF. Build-time push to S3 + CDN is standard.          |
| **P2**   | Add automated DB backups to the deploy workflow as a pre-deploy step   | 1 hr     | `pg_dump` before any deploy that could affect schema.                                                                     |

### Mid-Term (3-6 Months)

| Priority                             | Action                                        | Rationale                                                                                                                                                               |
| ------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1**                               | Migrate to a container orchestration platform | When revenue and reliability demands exceed what a single VPS can provide.                                                                                              |
| **Option A: Docker Swarm**           | 2-3 days                                      | Smallest incremental step from compose. Same compose files, adds rolling updates, service replication, overlay networking. Good for 2-5 nodes.                          |
| **Option B: Kamal**                  | 1-2 days                                      | 37signals' deploy tool. Traefik + Docker on any VPS. Zero-downtime, rolling deploys, built-in health checks, SSHKit-based. Fits the current "bare VPS" model perfectly. |
| **Option C: Kubernetes (k3s / EKS)** | 1-2 weeks                                     | Industry standard but significant complexity. Only justified when: multi-region, auto-scaling, service mesh, or compliance (SOC2/HIPAA) requirements exist.             |

### Recommendation Matrix

```
                       Single VPS +    Kamal /        K8s
                       Compose         Docker Swarm
─────────────────────────────────────────────────────────────
Setup complexity       Low             Low-Medium     High
Zero-downtime deploy   Manual          Built-in       Built-in
Auto-scaling           None            Limited        Full
Multi-region           No              No             Yes
Operational cost       $20-50/mo       $30-80/mo      $200-500+/mo
Team size fit          1-3            2-5            5+
Production readiness   MVP/Early       Growth         Scale
```

---

## 4. Recommended Deployment Path

### Current Stage: Compose on VPS (implemented)

This is the right choice for the project's current stage (pre-revenue, small team, defined multi-tenancy but unknown
traffic patterns).

### Next Step: Kamal (2-4 week transition, when needed)

**Why Kamal over Swarm or K8s:**

- Kamal is purpose-built for Rails/Docker apps on bare VPS — the exact architecture we have.
- Zero-downtime rolling deploys with health checks out of the box.
- Traefik for automatic TLS (Let's Encrypt) and request routing.
- Multi-host support via SSHKit (run on 2-3 VPS for HA).
- Uses the same Docker images we already build — no new artifact pipeline.
- Accessory support for sidecars (backup cron, monitoring agents).
- Dramatically less operational overhead than K8s.

**Trigger for migration:** When any of these become true:

1. Revenue-bearing tenants require an uptime SLA (>99.5%).
2. A single VPS can't handle peak load (CPU >70% sustained, memory pressure).
3. Zero-downtime deploys become mandatory for the business.
4. The team grows beyond 3 engineers and needs environment parity (staging/prod separation).

---

## 5. Security Review

| Concern                  | Status                                                                     | Action                                                                            |
| ------------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| GHCR image scanning      | Not configured                                                             | Enable GitHub's built-in dependency scanning and CodeQL                           |
| Secrets in images        | None (env vars injected at runtime)                                        | OK                                                                                |
| Secrets in GHA Variables | `JWT_SECRET`, `DB_PASSWORD`, `CLIENT_DB_SECRET` are in Variables (visible) | Migrate to Secrets                                                                |
| Network segmentation     | All services on same compose network                                       | Acceptable for VPS model. When moving to multi-host, use overlay/private networks |
| TLS termination          | Not automated in current deploy                                            | Add Traefik/Caddy sidecar or use Cloudflare Tunnel for TLS                        |
| Database exposure        | Port 5432 only to localhost in prod compose                                | OK, no host port mapping in prod compose                                          |
| SSH deploy key           | Single key with shell access                                               | OK for single VPS. Consider deploy-specific key with command restrictions         |

---

## 6. Summary

The current deployment mechanism (**Docker Compose on VPS, deployed via GitHub Actions, images on GHCR**) is:

- **Correct for the project's current stage.** It's simple, fast, cheap, and debuggable.
- **Well-structured.** Multi-role backend image, SHA-pinned deploys, production compose hardening, cache-optimized CI.
- **Missing critical operational safeguards.** No backups, no zero-downtime deploys, no frontend CI tests, no
  monitoring.

**Immediate priority:** Close the P0/P1 gaps in the "Immediate" recommendations table above — these are all under 1 day
of work and prevent avoidable production incidents.

**Next evolutionary step:** When the business needs it, migrate to **Kamal** (same VPS model, better deploy semantics,
built-in TLS and zero-downtime) before considering Kubernetes. Do not skip to K8s prematurely.
