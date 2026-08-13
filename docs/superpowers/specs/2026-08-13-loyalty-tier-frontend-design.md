# Loyalty Tier Frontend — Design

> **Date:** 2026-08-13
> **Status:** Approved (brainstorming session)
> **Scope:** Frontend only — zero backend changes. Re-use existing APIs/components.

## Goal

Complete the frontend for the already-shipped Loyalty Tier System backend. Two areas:

1. **Consumer storefront** (`apps/frontend-consumer`): a loyalty profile page (tier badge +
   balance + recent ledger) and a rewards page (grid of point-priced rewards with claim
   flow). This activates the `LoyaltyBadge` component (built in the tier plan but never
   rendered) and the `api/rewards.ts` consumer wrapper (built but unused).
2. **CMS admin** (`apps/frontend-cms`): add sidebar navigation entries for the already-built
   tier and reward management pages (pages exist; nav links don't).

## Decisions (from clarifying questions)

- Scope: **both** CMS nav + consumer profile + consumer rewards (option C).
- Consumer profile loyalty = `LoyaltyBadge` + balance + **5 most recent ledger entries**.
- Consumer rewards = **grid of cards** with a Claim button per card + inline feedback
  (success shows voucher code; failure shows backend error message).
- Rewards with unmet tier gate render **disabled with a hint** (e.g. "Requires Gold" /
  "Exclusive to Gold"); unmet balance renders disabled "Insufficient points"; stock 0
  renders disabled "Out of stock".
- CMS sidebar: **grouped** under a "Loyalty" section label with Tier + Reward links.
- Consumer nav: two separate pill links — "Loyalty" (`/loyalty`) and "Rewards" (`/rewards`).

## Architecture

Pure frontend. No API contract changes. All data comes from endpoints that already exist
(verified against backend code):

| Data                                                | Endpoint                                | Consumer wrapper                       |
| --------------------------------------------------- | --------------------------------------- | -------------------------------------- |
| Points profile (tier, lifetime, balance, next_tier) | `GET /loyalty/points/profile`           | `api/points.ts` → `getPointsProfile()` |
| Ledger history                                      | `GET /loyalty/points/history?page&size` | `api/points.ts` → `getPointsHistory()` |
| Rewards list (raw array, relations source+min_tier) | `GET /rewards`                          | `api/rewards.ts` → `getRewards()`      |
| Claim reward                                        | `POST /rewards/claim/:reward_id`        | `api/rewards.ts` → `claimReward()`     |

## Components

### Consumer — `apps/frontend-consumer`

**New: `src/pages/LoyaltyView.tsx`** (route `/loyalty`, inside `ProtectedRoute`)

- On mount: `Promise.all([getPointsProfile(), getPointsHistory(0, 5)])`.
- Renders `LoyaltyBadge` (existing component, `src/components/LoyaltyBadge.tsx`) with the
  profile; below it, the 5 latest ledger entries reusing the render pattern from
  `PointsHistoryView.tsx` (event_type, amount with `+`/color, balance_after, reference_id).
- Loading state (consistent with sibling pages); per-section error state with retry (one
  failed fetch does not blank the other section).

**New: `src/pages/RewardsView.tsx`** (route `/rewards`, inside `ProtectedRoute`)

- On mount: `Promise.all([getRewards(), getPointsProfile()])`.
- Grid of reward cards. Each card: name, `point_price`, stock (`∞` when `-1`), min-tier
  badge when present, Claim button.
- Disabled-hint logic (mirrors backend I1 window-conditional semantics):
  - `min_tier` present AND `exclusive_days > 0` AND window not elapsed AND user tier
    level < min_tier level → disabled, hint "Requires {tier name}" / "Exclusive to {tier}".
  - balance < point_price → disabled, hint "Insufficient points".
  - stock === 0 → disabled, hint "Out of stock".
  - otherwise enabled.
- Claim flow: click → button in-flight disabled → `claimReward(id)` → success: inline
  feedback showing `result.code` (voucher code) if present → failure: inline error from
  `Error.message` (backend messages are already user-facing). On success, re-fetch profile
  to refresh balance.
- Empty state: "No rewards available yet".

**Modified: `src/components/layout/ConsumerLayout.tsx`**

- Add pill NavLink "Loyalty" (`/loyalty`, lucide `Award`) and "Rewards" (`/rewards`, lucide
  `Gift`) to the desktop pill nav; mirror in the mobile bottom nav following the existing
  pattern (mobile uses `amber-400`/consistent active color — the D3 fix in the tier plan
  standardized this).

**Modified: `src/App.tsx`**

- Add routes `/loyalty` → `LoyaltyView`, `/rewards` → `RewardsView` inside `ProtectedRoute`,
  following the sibling route pattern.

### CMS — `apps/frontend-cms`

**Modified: `src/components/layout/MainLayout.tsx`**

- Add a "Loyalty" section label in the sidebar, with two NavLinks following the existing
  isActive border-gradient pattern:
  - "Tier Management" → `/tiers` (lucide `Layers`)
  - "Reward Management" → `/rewards` (lucide `Gift`)

Routes already exist in `src/router/index.tsx` (no router change needed).

## Data Flow

- All fetches use the existing `getHeaders()` auth pattern (token + apiKey from
  `useAuthStore`).
- Rewards list is a **raw array** (no envelope) — `getRewards()` returns `data` directly.
- Tier gating for disabled hints is computed client-side from the profile's `tier` object
  and the reward's `min_tier` relation; no server round-trip beyond the two existing calls.

## Error Handling

- Every fetch has loading + error + retry states (match sibling pages).
- Claim failure surfaces the backend message inline; claim success surfaces the voucher
  code inline.
- In-flight claim button prevents double-submit.

## Testing

Vitest + React Testing Library in each app dir (run with workdir `apps/frontend-consumer`
/ `apps/frontend-cms`, `npx vitest run`):

- `src/pages/LoyaltyView.spec.tsx` — renders badge + 5 ledger entries (mock `api/points`);
  error state renders retry.
- `src/pages/RewardsView.spec.tsx` — renders grid; claim success shows feedback; claim
  failure shows error; disabled hints for tier/balance/stock.
- Existing suites must stay green (baseline: consumer 57, CMS 87/2 pre-existing).

## Out of Scope (documented, not built)

- No backend changes (no server-side claimability flag — client computes hints).
- No advanced stats on the profile page (no such backend endpoint).
- No changes to existing pages beyond ConsumerLayout nav + App routes.
