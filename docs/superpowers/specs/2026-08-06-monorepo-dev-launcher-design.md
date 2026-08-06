# Monorepo Development Launcher Design Spec

**Date**: 2026-08-06  
**Status**: Approved  
**Target**: Ahha Voucher Engine Monorepo

---

## 📌 Executive Summary

The **Ahha Voucher Engine** monorepo consists of 8 NestJS backend microservices (`admin`, `loyalty-admin`, `user-admin`, `loyalty-consumer`, `user-consumer`, `product-admin`, `product-consumer`, `redistro`), 2 React/Vite frontend apps (`frontend-cms`, `frontend-consumer`), and infrastructure services (`postgres`, `redis`).

Currently, developers must launch each service manually in separate terminal windows or rely on production docker builds. This specification outlines a unified development orchestration mechanism using **Docker Compose Profiles**, source volume mounts for hot-reloading, and ergonomic CLI shortcuts via `Makefile` and `package.json`.

---

## 🏗️ Architecture & Profile Strategy

Services are grouped into logical development profiles to allow flexible execution based on developer needs and system resources:

| Profile Name   | Included Services                                                                                                            | Primary Use Case                                        |
| :------------- | :--------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| _(default)_    | `postgres`, `redis`                                                                                                          | Database & caching layer (always running)               |
| `infra`        | `postgres`, `redis`                                                                                                          | Standalone infrastructure for running services natively |
| `backend`      | `admin`, `loyalty-admin`, `user-admin`, `loyalty-consumer`, `user-consumer`, `product-admin`, `product-consumer`, `redistro` | All 8 NestJS microservices                              |
| `frontend`     | `frontend-cms`, `frontend-consumer`                                                                                          | Both React/Vite frontend applications                   |
| `admin`        | `admin`, `loyalty-admin`, `user-admin`, `product-admin`, `frontend-cms`                                                      | Full admin ecosystem                                    |
| `consumer`     | `loyalty-consumer`, `user-consumer`, `product-consumer`, `frontend-consumer`                                                 | Full consumer ecosystem                                 |
| `all` / `full` | All 10 application services + `postgres` + `redis`                                                                           | Complete monorepo stack                                 |

---

## 🛠️ Docker Compose Development Configuration (`docker-compose.dev.yml`)

### Key Components

1. **Hot-Reloading via Volume Mounts**:
   - `./apps:/app/apps`
   - `./libs:/app/libs`
   - `./package.json:/app/package.json`
   - `./nest-cli.json:/app/nest-cli.json`
   - `./tsconfig.json:/app/tsconfig.json`
   - Anonymous Volume: `/app/node_modules` (prevents host OS node_modules from overwriting container dependencies)

2. **Command Overrides for Development**:
   - NestJS Microservices: `yarn nest start <service-name> --watch`
   - Frontend CMS: `yarn --cwd apps/frontend-cms dev --host 0.0.0.0`
   - Frontend Consumer: `yarn --cwd apps/frontend-consumer dev --host 0.0.0.0`

3. **Port Mapping**:
   - Postgres: `5432`
   - Redis: `6379`
   - Admin API: `9002`
   - Loyalty Admin API: `9003`
   - User Admin API: `9004`
   - Loyalty Consumer API: `9005`
   - User Consumer API: `9006`
   - Product Admin API: `9007`
   - Product Consumer API: `9008`
   - Redistro API: `9009`
   - Frontend CMS: `5173`
   - Frontend Consumer: `5174`

---

## 🚀 CLI Commands & Ergonomics

### Root `package.json` Scripts

```json
"scripts": {
  "dev": "docker compose -f docker-compose.dev.yml --profile all up",
  "dev:infra": "docker compose -f docker-compose.dev.yml up -d postgres redis",
  "dev:backend": "docker compose -f docker-compose.dev.yml --profile backend up",
  "dev:frontend": "docker compose -f docker-compose.dev.yml --profile frontend up",
  "dev:admin": "docker compose -f docker-compose.dev.yml --profile admin up",
  "dev:consumer": "docker compose -f docker-compose.dev.yml --profile consumer up",
  "dev:down": "docker compose -f docker-compose.dev.yml down"
}
```

### `Makefile` Targets

```makefile
.PHONY: dev dev-infra dev-backend dev-frontend dev-admin dev-consumer dev-all dev-down

dev: dev-all

dev-infra:
	docker compose -f docker-compose.dev.yml up -d postgres redis

dev-backend:
	docker compose -f docker-compose.dev.yml --profile backend up

dev-frontend:
	docker compose -f docker-compose.dev.yml --profile frontend up

dev-admin:
	docker compose -f docker-compose.dev.yml --profile admin up

dev-consumer:
	docker compose -f docker-compose.dev.yml --profile consumer up

dev-all:
	docker compose -f docker-compose.dev.yml --profile all up

dev-down:
	docker compose -f docker-compose.dev.yml down
```

---

## 🧪 Verification Plan

1. Verify `docker-compose.dev.yml` syntax: `docker compose -f docker-compose.dev.yml config`
2. Test infrastructure startup: `make dev-infra` (confirm Postgres on 5432 & Redis on 6379)
3. Test backend startup: `make dev-backend` (confirm 8 microservices start and respond)
4. Test frontend startup: `make dev-frontend` (confirm Vite dev servers respond at 5173 & 5174)
5. Test file modification hot-reloading by editing a sample service file.
