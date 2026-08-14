# Design — Free Voucher Reward on Tier Level-Up

> Superpowers brainstorming output. Feature: when a loyalty user reaches a tier, auto-grant a
> configured voucher as a free (non point-buyable) reward.

Status: **approved — ready for plan**
Date: 2026-08-15
Skills: brainstorming (terminated)

---

## 1. Problem

Tiers exist (`loyalty_tiers`, `tier_history`) and grant nothing on level-up. We want each tier to
optionally carry a "free" reward (a voucher) that is **auto-granted** to the user the moment they
reach that tier — consuming normal voucher quota, not points. This makes tier progression tangible.

### Non-goals / decided scope

- Reward is **always a voucher** (not points, cash, or other reward-item types).
- Grant is **automatic** — no user action, no claim button.
- **Once per tier per user** (idempotent; reaching the same tier again does not re-grant).
- Grant consumes the voucher's **normal quota** (same as a manual claim) — checked inside the same
  transaction.
- Works on **both** level-up paths: automatic (purchase → points threshold) and **manual admin tier
  change** (new admin endpoint is required — none exists today).
- Consumer-facing feedback: **toast/notification** in the checkout UI when a grant happens.
- Voucher-as-point-buyable-reward idea was raised and **withdrawn by the user** (`nvm, I changed my
  mind`). Out of scope.

---

## 2. Data model

### 2.1 `loyalty_tiers` — new nullable column

```
level_up_voucher_code  varchar NULL
```

- `NULL` → tier grants nothing (default; existing rows unaffected).
- Non-null → the voucher code granted when a user reaches this tier.

Entity: `libs/loyalty/src/tier/entities/loyalty-tier.entity.ts`

### 2.2 Migration

`apps/loyalty-admin/src/migrations/<date-prefix>-tier-level-up-voucher.ts`

- `ALTER TABLE loyalty_tiers ADD COLUMN level_up_voucher_code varchar NULL` (+ down).
- Must satisfy the directory naming/convention guard (13-digit epoch-ms suffix).

---

## 3. Core grant logic

### 3.1 `TierService.grantLevelUpVoucher()` — new method

Location: `libs/loyalty/src/tier/tier.service.ts`

```ts
grantLevelUpVoucher(
  user: LoyaltyUserEntity,
  targetTier: LoyaltyTierEntity,
  manager: EntityManager,
): Promise<{
  granted: boolean;
  voucherCode?: string;
  message: 'no-voucher-configured' | 'already-claimed' | 'voucher-missing' | 'granted';
}>
```

Behavior (all inside the caller-supplied transaction manager):

1. No `level_up_voucher_code` → `{ granted: false, message: 'no-voucher-configured' }`.
2. Idempotency: if a `voucher_claims` row already exists targeting this user with this code
   (claim due to this tier), → `{ granted: false, message: 'already-claimed' }`.
3. Load the voucher by code (incl. its categories/relations only if needed). Missing → **logs, does
   not throw**, `{ granted: false, message: 'voucher-missing' }`; the purchase still succeeds.
4. Happy path: insert `VoucherClaimEntity` (user + voucher) **and** decrement `voucher.quota` by 1 —
   all directly against the `manager` EntityManager. → `{ granted: true, voucherCode, message:
   'granted' }`.

### 3.2 Self-contained (no `VoucherService` seam)

Implementation uses the `EntityManager.getRepository(...)` directly (~8 lines of claim creation +
quota decrement that already exist in the consumer `VoucherService`). **No** `VoucherService`
dependency is injected into `TierService` (avoids the research finding that loyalty-consumer's
`VoucherService` exposes `useVoucher(code, userId)` but the admin/domain layer cannot cleanly
reuse it). Duplication is acceptable and intentional for this scope.

---

## 4. Triggers

Both call sites wrap their tier swap in the same transaction so the grant is atomically
rolled-back with the tier change.

### 4.1 Automatic: purchase `maybeLevelUp`

Location: `apps/loyalty-consumer/src/voucher/purchase.controller.ts` (~line 188)

- On level-up detected, the controller calls `TierService.grantLevelUpVoucher(...)` inside the
  transaction (the controller already holds an injected `TierService` instance).
- Purchase response gains a new field:
  ```
  level_up_grant?: { granted: boolean; voucher_code?: string; message: string } | null
  ```
- Present only when a level-up + tier-with-voucher occurred; otherwise `null` (omitted or null —
  decide in plan; frontend treats both same).

### 4.2 Manual: new admin tier-assign endpoint

**New**: `POST /loyalty-admin/users/:coreUserId/tier`

- Service: extends `UserPointsService` (same module/pattern as existing `manage:points` admin
  routes, `@Permissions('manage:points')`).
- Body: `{ tier_id: string }`.
- Reads the core-user → loyalty user, looks up the tier, records `TierChangeReason.MANUAL`
  (already exists in the enum — **no new enum value needed**), calls the same
  `grantLevelUpVoucher`.
- Responses:
  - `404` — core user / tier not found.
  - `200` — ok, body includes the `level_up_grant` result (granted → consumer CMS shows the
    voucher).

### 4.3 Reason enum

`TierChangeReason.MANUAL` already exists and is reused — no schema change.

---

## 5. Frontend

### 5.1 CMS: Tier form

- `apps/frontend-cms/src/components/TierForm.tsx`: new field "Level-up voucher" —
  autocomplete/text input of existing voucher codes; value → `level_up_voucher_code`.
- `pages/TierCreate.tsx` / `TierEdit.tsx` / `TierList.tsx`: pass-through the new field on submit /
  listing (display as a chip/badge).

### 5.2 CMS: user tier assign

- `apps/frontend-cms/src/pages/UserDetail.tsx`: "Assign Tier" control → calls the new admin
  endpoint; shows grant result (e.g. "Grants VOUCHER-X on assignment" feedback).

### 5.3 Consumer: checkout toast

- `apps/frontend-consumer/src/pages/CheckoutView.tsx` (`handlePurchase` ~line 254, success message
  ~line 266): when purchase response includes `level_up_grant.granted === true`, show toast:
  `You reached {tier}! Here's your free voucher: {code}`.

---

## 6. Testing

### Backend (Jest)

- `libs/loyalty/src/tier/tier.service.spec.ts` — `grantLevelUpVoucher` branches:
  no-voucher-configured / already-claimed / voucher-missing / happy path (row created + quota
  decremented; all in one `manager`).
- `apps/loyalty-consumer/src/voucher/*.spec.ts` — purchase triggers grant on level-up; no grant
  without level-up; response carries `level_up_grant`.
- `apps/loyalty-admin/src/user-points/*.spec.ts` — assign-tier: happy, same-tier reject (400),
  missing ids (404).
- Migration naming guard picks up the new migration automatically.

### Frontend (Vitest + RTL)

- `TierForm.spec.tsx` — renders field, submits `level_up_voucher_code`.
- `CheckoutView.spec.tsx` — toast appears when granted, absent otherwise.

---

## 7. Open decisions to pin in plan

1. `level_up_grant` shape on the purchase response: omit vs `null` when no level-up.
2. Idempotency key: voucher code per loyalty user (single `voucher_claims` row). Scope to tier
   id too if a code is reused across tiers — pin in plan.
3. UX wording for the toast.
5. Whether admin grant feedback needs a UI surface beyond a toast/alert in `UserDetail`.

---

## 8. Files touched (summary)

| Layer       | File                                                          | Change                                  |
| ----------- | ------------------------------------------------------------- | --------------------------------------- |
| lib         | `libs/loyalty/src/tier/entities/loyalty-tier.entity.ts`       | add `level_up_voucher_code` column      |
| lib         | `libs/loyalty/src/tier/tier.service.ts`                       | add `grantLevelUpVoucher()`             |
| lib         | `libs/loyalty/src/tier/tier.service.spec.ts`                  | new unit tests                          |
| admin       | `apps/loyalty-admin/src/migrations/*-tier-level-up-voucher.ts`| ALTER TABLE (add column)                |
| admin       | `apps/loyalty-admin/src/user-points/user-points.controller.ts`| `POST /loyalty-admin/users/:id/tier`    |
| admin       | `apps/loyalty-admin/src/user-points/user-points.service.ts`   | assign-tier service logic               |
| consumer    | `apps/loyalty-consumer/src/voucher/purchase.controller.ts`    | `maybeLevelUp` → grant; response field  |
| cms         | `apps/frontend-cms/src/components/TierForm.tsx`               | `level_up_voucher_code` field           |
| cms         | `apps/frontend-cms/src/pages/TierCreate/Edit/List`            | pass-through / display                  |
| cms         | `apps/frontend-cms/src/pages/UserDetail.tsx`                  | Assign Tier control + grant feedback    |
| consumer fe | `apps/frontend-consumer/src/pages/CheckoutView.tsx`           | toast on `level_up_grant`               |
| tests       | spec files above                                              | unit + component coverage               |