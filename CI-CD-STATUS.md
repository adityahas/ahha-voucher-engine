# CI/CD Deployment Status

**Status: DONE — all services operational**

This commit was pushed as a signal that the Ahha Voucher Engine CI/CD setup is complete and verified.

- **Last Triggered Deployment**: 2026-08-20 09:31:00 WIB

## Verified Working

| Service          | Port | Status  |
| ---------------- | ---- | ------- |
| Jenkins          | 8080 | Running |
| PostgreSQL       | 5432 | Running |
| Redis            | 6379 | Running |
| admin            | 9002 | Running |
| user-admin       | 9003 | Running |
| user-consumer    | 9004 | Running |
| loyalty-admin    | 9005 | Running |
| loyalty-consumer | 9006 | Running |
| product-admin    | 9007 | Running |
| product-consumer | 9008 | Running |
| redistro         | 9009 | Running |

## Login Credentials

| Role     | Endpoint                        | Email               | Password   |
| -------- | ------------------------------- | ------------------- | ---------- |
| Admin    | `POST /admin/login` (port 9002) | `admin@client1.com` | `admin123` |
| Consumer | `POST /user/login` (port 9004)  | `user@client1.com`  | `user123`  |

Headers required: `Host: client1.localhost:<port>`, `x-api-key: client1-api-key`

## CI/CD Behavior

- Jenkins job `ahha-voucher-engine` polls the repo every 15 minutes
- Any PR merged to `main` triggers: Clean → Checkout → Install → Build → Test (317 tests) → Deploy
- Deployment copies the fresh build to `C:\ahha-deploy` and restarts all apps detached
- Apps, PostgreSQL, Redis, and Jenkins all auto-start on reboot (Startup folder + Windows services)

## Credentials Note

All secrets (DB password, JWT, API keys) are in the local `.env` files only — never committed to git.
