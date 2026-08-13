# Task 5 Verification Report

## Status

BLOCKED: backend focused verification and build pass, but the full CMS suite has baseline unrelated failures and the local runtime smoke test is blocked by the running container migration error. No source files were modified and no reward was created.

## Commands and Results

- `yarn test --runInBand apps/loyalty-admin/src/reward-item-source`: PASS. 1 suite, 14 tests passed.
- `yarn nest build loyalty-admin`: PASS. Exit code 0.
- `cd apps/frontend-cms && npx vitest run`: BASELINE FAILURES. 22 suites passed and 3 failed; 111 tests passed and 2 failed out of 113. Failures:
  - `src/pages/Login.spec.tsx`: `localStorage` is undefined in `auth.store.ts`.
  - `src/components/VoucherBindingList.spec.tsx`: existing delete-confirmation assertion did not observe `window.confirm`.
  - `src/components/VoucherValidityList.spec.tsx`: existing delete-confirmation assertion did not observe `window.confirm`.
- `cd apps/frontend-cms && npx tsc --noEmit`: PASS. No output; exit code 0.
- `git diff HEAD~4 --check`: PASS. No whitespace errors.
- `git status --short`: only pre-existing untracked files plus the report being written; no runtime artifacts were added.

## Smoke-Test Evidence

- `docker compose ps`: local stack was running, including CMS on `localhost:5173`, gateway on `localhost:8080`, admin, loyalty-admin, and PostgreSQL containers.
- `curl -I http://localhost:5173/`: HTTP 200.
- Default login request for `client1` / `admin@client1.com` / `admin123` with `client1-api-key`: HTTP 201 and a JWT token returned.
- Attempted source creation with exactly:
  - `name`: `Synthetic Reward Provider`
  - `source_type`: `synthetic`
  - `api_endpoint`: `https://example.com/rewards`
  - no API key
- Creation response: HTTP 404, `Failed to connect to database ahha_client1_db: RewardItemSourceApiKeyNullable20260813 migration name is wrong. Migration class name should have a JavaScript timestamp appended.`
- Because creation failed, list verification could not find the synthetic source, masked/null API key verification could not be performed, and `/rewards/create` source selection could not be verified.
- No reward creation request was made.
- The `agent-browser` executable and the Playwright package were unavailable, so the local smoke attempt used authenticated HTTP requests instead.

## Diff Scope

`git diff HEAD~4` contains the intended Task 3/4 source and test changes, plus prior task reports. No source files were changed during Task 5.

## Task 5 Blocker Fix Verification

- Renamed migration class/export from `RewardItemSourceApiKeyNullable20260813` to `RewardItemSourceApiKeyNullable1786641866501`; the existing file date `20260813` and both SQL statements were preserved.
- `yarn test --runInBand apps/loyalty-admin/src/migrations/20260813-reward-item-source-api-key-nullable.spec.ts`: PASS. 1 suite, 2 tests passed. Includes TypeORM `MigrationExecutor` loader validation and up/down SQL assertions.
- `yarn test --runInBand apps/loyalty-admin/src/reward-item-source/reward-item-source.service.spec.ts`: PASS. 1 suite, 14 tests passed.
- `yarn nest build loyalty-admin`: PASS. Exit code 0.
- Migration verification: PASS via the focused migration spec; TypeORM accepted the 13-digit JavaScript timestamp suffix.

## Post-fix Smoke Verification

- After migration rename commit `7466f42`, authenticated runtime smoke passed.
- Created `Synthetic Reward Provider 1786642058950` with no API key: HTTP 201.
- List returned HTTP 200 with `apiKey: null` and source id `3e90601f-0cc9-4d1b-9f37-f7d2bf80d107`.
- CMS `/rewards/create` displayed `Synthetic Reward Provider 1786642058950 (synthetic)` in the source dropdown.
- No reward was created.

## Final Review Fix Wave

Status: FIXED

### Changes

- Made tenant connection options mutually exclusive: `DB_SYNC=true` disables migration execution and tenant migrations disable synchronization.
- Made migration rollback safe for existing NULL keys by backfilling `synthetic-backfill` before restoring `api_key NOT NULL`; the migration spec asserts the complete SQL sequence.
- Added consistent `NotFoundException` failures when source update/delete affects zero rows.
- Whitelisted source list sort fields to prevent arbitrary query-column injection.
- Added masked API-key response typing and concrete CMS auth/error/source state types.
- Guarded RewardForm source/tier async updates after unmount and preserved retry behavior.
- Added source list loading and empty states.

### Verification

- `yarn test --runInBand apps/loyalty-admin/src/reward-item-source/reward-item-source.service.spec.ts apps/loyalty-admin/src/migrations/20260813-reward-item-source-api-key-nullable.spec.ts libs/database/src/database.service.spec.ts` — PASS, 3 suites and 21 tests.
- `yarn nest build loyalty-admin` — PASS.
- `cd apps/frontend-cms && npx vitest run src/api/reward-item-sources.spec.ts src/components/RewardForm.spec.tsx src/components/RewardItemSourceForm.spec.tsx src/pages/RewardItemSourceList.spec.tsx src/pages/RewardItemSourcePages.spec.tsx` — PASS, 5 files and 25 tests.
- `cd apps/frontend-cms && npx tsc --noEmit` — PASS.
- `graphify update .` — completed; existing warnings remain for empty `extensions.json` and `skills-lock.json`.
- `git diff --check` — PASS.

## Remaining Important Finding Fix

Status: FIXED

### Changes

- Configured tenant migrations now always run, regardless of `DB_SYNC`; `synchronize` remains false whenever migration paths are present. This prevents `DB_SYNC=true` from silently disabling both migration execution and schema synchronization.
- `RewardItemSourceService.findOne` and `update` now consistently throw `NotFoundException` when the entity is missing, including if it disappears after a successful update.

### Verification

- `yarn test --runInBand libs/database/src/database.service.spec.ts apps/loyalty-admin/src/reward-item-source/reward-item-source.service.spec.ts apps/loyalty-admin/src/migrations/20260813-reward-item-source-api-key-nullable.spec.ts` — PASS, 3 suites and 24 tests.
- `yarn test --runInBand libs/database/src/database.service.spec.ts apps/loyalty-admin/src/migrations/20260813-reward-item-source-api-key-nullable.spec.ts` — PASS, 2 suites and 5 tests.
- `yarn nest build loyalty-admin` — PASS.
- `graphify update .` — completed; existing warnings remain for empty `extensions.json` and `skills-lock.json`.
