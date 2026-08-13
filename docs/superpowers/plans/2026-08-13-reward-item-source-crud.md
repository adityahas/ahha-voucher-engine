# Reward Item Source CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure full CRUD management for Reward Item Sources and replace manual reward source UUID entry with a CMS source selector.

**Architecture:** Align the loyalty-admin DTO/entity/service response contract first, including nullable provider keys and masking at the service boundary. Add a focused CMS API client, source list/form pages, routes, and Loyalty navigation. Update RewardForm to load the source list and submit the selected UUID while preserving existing reward payloads.

**Tech Stack:** NestJS, TypeORM, class-validator, React 19, React Router, Vite, Vitest, Jest.

## Global Constraints

- `apiKey` is optional for synthetic sources.
- API responses never return the stored plaintext API key.
- API keys are masked in list/detail responses and CMS displays.
- Existing source and reward records are not modified unless explicitly edited or deleted.
- Delete operations wait for API success and are not optimistic.
- Use the existing tenant headers and authentication patterns.
- Do not add a new dependency when existing UI components and icons suffice.

---

### Task 1: Align Reward Item Source backend contract

**Files:**

- Modify: `apps/loyalty-admin/src/reward-item-source/dto/create-reward-item-source.dto.ts`
- Modify: `libs/loyalty/src/reward-item-source/entities/reward-item-source.entity.ts`
- Modify: `apps/loyalty-admin/src/reward-item-source/reward-item-source.controller.ts`
- Modify: `apps/loyalty-admin/src/reward-item-source/reward-item-source.service.ts`
- Create: `apps/loyalty-admin/src/migrations/20260813-reward-item-source-api-key-nullable.ts`
- Test: `apps/loyalty-admin/src/reward-item-source/reward-item-source.service.spec.ts`

**Interfaces:**

- Produces `CreateRewardItemSourceDto { name: string; source_type: string; api_endpoint?: string; apiKey?: string }`.
- Produces masked `RewardItemSourceEntity` response objects for all CRUD reads/writes.
- `remove(id: string): Promise<void>` accepts UUID strings.

- [ ] **Step 1: Add failing DTO validation tests**

Test the validation pipe with:

```ts
await expect(
  validate({ name: 'Synthetic', source_type: 'synthetic' }),
).resolves.toHaveLength(0);
await expect(
  validate({ name: '', source_type: 'synthetic' }),
).resolves.not.toHaveLength(0);
await expect(
  validate({ name: 'Synthetic', source_type: '' }),
).resolves.not.toHaveLength(0);
await expect(
  validate({
    name: 'Synthetic',
    source_type: 'synthetic',
    api_endpoint: 'not-a-url',
  }),
).resolves.not.toHaveLength(0);
```

Use `class-validator`'s `validate` helper and the DTO's actual decorators.

- [ ] **Step 2: Run the focused backend test and confirm it fails**

Run `yarn test --runInBand apps/loyalty-admin/src/reward-item-source/reward-item-source.service.spec.ts`. Expected: the new DTO assertions fail because the current DTO does not define `source_type` or the entity fields.

- [ ] **Step 3: Implement the aligned DTO and nullable entity field**

Use `@IsString()` and `@IsNotEmpty()` for `name` and `source_type`, `@IsUrl()` plus `@IsOptional()` for `api_endpoint`, and `@IsString()` plus `@IsOptional()` for `apiKey`. Normalize blank `apiKey` to null in the service before save. Mark the TypeORM `apiKey` column nullable.

- [ ] **Step 4: Add the tenant database migration**

Create a TypeORM migration that executes `ALTER TABLE reward_item_sources ALTER COLUMN "apiKey" DROP NOT NULL` in `up()` and restores `SET NOT NULL` in `down()`. Follow the repository's existing migration export/configuration pattern and ensure the migration is included in the loyalty-admin tenant migration path.

- [ ] **Step 5: Add a service masking helper and apply it to CRUD responses**

Implement a private `maskApiKey(value: string | null): string | null` with this behavior: null/empty returns null; values of length 6 or less return `***`; longer values return `${value.slice(0, 3)}***${value.slice(-3)}`. Clone saved/fetched entities before replacing `apiKey`, so the repository's plaintext value is never mutated.

- [ ] **Step 6: Fix UUID deletion and normalize create/update input**

Change the controller and service delete signatures from number to string. Before create/update, convert an empty API key to null and preserve the existing key on update when `apiKey` is omitted. Return masked entities from create, findOne, update, and findAll.

- [ ] **Step 7: Run focused tests, migration verification, and backend build**

Run `yarn test --runInBand apps/loyalty-admin/src/reward-item-source/reward-item-source.service.spec.ts`, the repository's migration test/compile command for the new migration, and `yarn nest build loyalty-admin`. Expected: tests pass, migration compiles, and the loyalty-admin build exits 0.

- [ ] **Step 8: Commit the backend contract**

```bash
git add apps/loyalty-admin/src/reward-item-source apps/loyalty-admin/src/migrations libs/loyalty/src/reward-item-source
git commit -m "fix(loyalty): align reward item source contract"
```

### Task 2: Add the CMS Reward Item Source API client

**Files:**

- Create: `apps/frontend-cms/src/api/reward-item-sources.ts`
- Test: `apps/frontend-cms/src/api/reward-item-sources.spec.ts`

**Interfaces:**

- `RewardItemSource { id: string; name: string; source_type: string; api_endpoint?: string; apiKey?: string | null }`.
- `RewardItemSourceInput { name: string; source_type: string; api_endpoint?: string; apiKey?: string }`.
- Exports `getRewardSources`, `getRewardSource`, `createRewardSource`, `updateRewardSource`, `deleteRewardSource`.

- [ ] **Step 1: Write request contract tests**

Mock `fetch` and assert list uses `GET /loyalty-admin/reward-item-source?page=0&size=100`, create uses `POST` with JSON input, update uses `PATCH /:id`, delete uses `DELETE /:id`, and every request includes `Authorization`, `x-api-key`, and `x-tenant-override` from the auth store.

- [ ] **Step 2: Run the API client tests and confirm they fail**

Run `cd apps/frontend-cms && npx vitest run src/api/reward-item-sources.spec.ts`. Expected: module/export failures because the client does not exist.

- [ ] **Step 3: Implement the client following existing API modules**

Use the configured API base URL, unwrap paginated `result.data ?? result`, throw a descriptive error for non-2xx responses, and JSON-encode create/update bodies. Do not add client-side unmasking logic.

- [ ] **Step 4: Run the client tests**

Run `cd apps/frontend-cms && npx vitest run src/api/reward-item-sources.spec.ts`. Expected: PASS.

- [ ] **Step 5: Commit the API client**

```bash
git add apps/frontend-cms/src/api/reward-item-sources.ts apps/frontend-cms/src/api/reward-item-sources.spec.ts
git commit -m "feat(cms): add reward source API client"
```

### Task 3: Build CMS source list and form pages

**Files:**

- Create: `apps/frontend-cms/src/components/RewardItemSourceForm.tsx`
- Create: `apps/frontend-cms/src/pages/RewardItemSourceList.tsx`
- Create: `apps/frontend-cms/src/pages/RewardItemSourceCreate.tsx`
- Create: `apps/frontend-cms/src/pages/RewardItemSourceEdit.tsx`
- Test: `apps/frontend-cms/src/components/RewardItemSourceForm.spec.tsx`
- Test: `apps/frontend-cms/src/pages/RewardItemSourceList.spec.tsx`

**Interfaces:**

- Form accepts optional `initial` and `onSubmit(input: RewardItemSourceInput): Promise<void>`.
- List consumes the API client and navigates to `/reward-sources/create` and `/reward-sources/:id/edit`.

- [ ] **Step 1: Write failing form/list tests**

Cover required name/type validation, optional endpoint, masked API key input by default, show/hide toggle for newly entered values, list rendering of masked keys, delete confirmation, and keeping a row visible when deletion rejects.

- [ ] **Step 2: Run focused CMS tests and confirm they fail**

Run `cd apps/frontend-cms && npx vitest run src/components/RewardItemSourceForm.spec.tsx src/pages/RewardItemSourceList.spec.tsx`. Expected: module failures because the pages/components do not exist.

- [ ] **Step 3: Implement the reusable form**

Use existing `Input`, `Button`, `Save`, and eye icon patterns. Send only non-empty optional fields. On edit, do not populate masked `apiKey` into the form's editable value; omit it from PATCH unless the user enters a replacement. Show validation/API errors inline. Keep the API key masked by default.

- [ ] **Step 4: Implement list/create/edit page behavior**

The list loads sources, renders name/type/endpoint/masked API key, and shows edit/delete controls. Delete calls `window.confirm`, awaits `deleteRewardSource`, then refreshes; on failure it displays the error and leaves the item. Create calls `createRewardSource` and navigates to `/reward-sources`; edit loads detail, calls `updateRewardSource`, and navigates back.

- [ ] **Step 5: Run focused CMS tests**

Run the same Vitest command. Expected: PASS.

- [ ] **Step 6: Commit source management UI**

```bash
git add apps/frontend-cms/src/components/RewardItemSourceForm.tsx apps/frontend-cms/src/pages/RewardItemSource*.tsx
git commit -m "feat(cms): add reward source CRUD pages"
```

### Task 4: Wire routes, navigation, and RewardForm source selection

**Files:**

- Modify: `apps/frontend-cms/src/router/index.tsx`
- Modify: `apps/frontend-cms/src/components/layout/MainLayout.tsx`
- Modify: `apps/frontend-cms/src/components/RewardForm.tsx`
- Modify: `apps/frontend-cms/src/components/RewardForm.spec.tsx`

**Interfaces:**

- Adds routes `/reward-sources`, `/reward-sources/create`, and `/reward-sources/:id/edit`.
- RewardForm loads `RewardItemSource[]` and submits `source_id` as the selected source UUID.

- [ ] **Step 1: Add failing RewardForm tests**

Mock `getRewardSources` with two sources and assert the form renders source names/types, does not render a free-text Source ID input, submits the selected UUID, and shows a link to `/reward-sources/create` when the source list is empty.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run `cd apps/frontend-cms && npx vitest run src/components/RewardForm.spec.tsx`. Expected: failures because the current form renders a manual Source ID input.

- [ ] **Step 3: Add authenticated routes and Loyalty sidebar link**

Import the three source pages and add them inside `MainLayout`'s route children. Add a `Reward Sources` `NavLink` under Loyalty using an existing icon, pointing to `/reward-sources`.

- [ ] **Step 4: Replace RewardForm Source ID with a source dropdown**

Load `getRewardSources()` in the existing effect, maintain loading/error state, render a required select with a no-selection option, and use the selected source ID for `source_id`. Preserve `initial.source_id` when editing. For an empty list, render a `Link` to `/reward-sources/create`; disable Save until a source is selected.

- [ ] **Step 5: Run focused tests and type-check**

Run `cd apps/frontend-cms && npx vitest run src/components/RewardForm.spec.tsx && npx tsc --noEmit`. Expected: PASS and exit 0.

- [ ] **Step 6: Commit integration changes**

```bash
git add apps/frontend-cms/src/router/index.tsx apps/frontend-cms/src/components/layout/MainLayout.tsx apps/frontend-cms/src/components/RewardForm.tsx apps/frontend-cms/src/components/RewardForm.spec.tsx
git commit -m "feat(cms): select reward sources in reward forms"
```

### Task 5: Full verification and runtime smoke test

**Files:**

- No source files created or modified.

- [ ] **Step 1: Run backend tests and build**

Run `yarn test --runInBand apps/loyalty-admin/src/reward-item-source` and `yarn nest build loyalty-admin`. Expected: all matching Jest tests pass and build exits 0.

- [ ] **Step 2: Run the full CMS test suite and type-check**

Run `cd apps/frontend-cms && npx vitest run && npx tsc --noEmit`. Expected: no new failures and type-check exits 0.

- [ ] **Step 3: Smoke-test source creation and reward selection**

Using the local CMS default login, create a source with `name= Synthetic Reward Provider`, `source_type=synthetic`, `api_endpoint=https://example.com/rewards`, and no API key. Confirm it appears in `/reward-sources` with a null/masked key, then open `/rewards/create` and confirm the new source is selectable. Do not create rewards in this task unless explicitly requested afterward.

- [ ] **Step 4: Inspect the final diff**

Run `git diff HEAD~4 --check` and `git status --short`. Expected: no whitespace errors, only intended source/test files changed, and no secrets or runtime artifacts staged.
