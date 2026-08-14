# Voucher Claim Period Configurable

## Context

Currently, `claimVoucher()` in `apps/loyalty-consumer/src/voucher/voucher.service.ts:153-162`
hard-codes a "1 claim per user, forever" rule:

```typescript
const existingClaim = await manager.findOne(VoucherClaimEntity, {
  where: { voucher: { code: voucherCode }, user: { id: user.id } },
});
if (existingClaim) {
  throw new BadRequestException('You have already claimed this voucher');
}
```

This check runs for every voucher regardless of `voucher_type`. The `VoucherType`
enum (`CLAIMABLE` / `UNIQUE_CODE`) is stored but never consulted in the claim path.
There is no way for an admin to issue a voucher that a user can claim multiple
times, or per calendar period.

## Goal

Make the claim frequency configurable per voucher via a new `claim_period` field:

- `FREE` — no claim restriction per user (quota still applies globally)
- `DAILY` — max 1 claim per user per calendar day
- `WEEKLY` — max 1 claim per user per calendar week (Mon–Sun)
- `MONTHLY` — max 1 claim per user per calendar month
- `ONCE` — max 1 claim per user, ever (current behavior)

Calendar boundaries are computed in the **user's timezone**, sourced from a new
`timezone` column on `LoyaltyUserEntity` (default `Asia/Jakarta`).

## Decision Summary

| Decision                          | Choice                                                              |
| --------------------------------- | ------------------------------------------------------------------- |
| Period options                    | FREE, DAILY, WEEKLY, MONTHLY, ONCE                                  |
| Default for existing/new vouchers | `ONCE` (preserves current behavior)                                 |
| Which voucher types get periods   | Only `CLAIMABLE`; `UNIQUE_CODE` stays 1x forever                    |
| Quota interaction                 | Each claim still decrements quota by 1 (no change)                  |
| Period basis                      | Calendar (day / Mon–Sun week / calendar month)                      |
| Timezone source                   | User timezone via `loyalty_users.timezone` (default `Asia/Jakarta`) |
| Integration approach              | Enum column `claim_period` on `VoucherEntity`                       |

## Architecture

### 1. Domain / Entities

`libs/loyalty/src/voucher/entities/voucher.entity.ts`:

```typescript
export enum ClaimPeriod {
  FREE = 'FREE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ONCE = 'ONCE',
}
```

Add to `VoucherEntity`:

```typescript
@Column({ type: 'enum', enum: ClaimPeriod, default: ClaimPeriod.ONCE })
claim_period: ClaimPeriod;
```

`libs/loyalty/src/entities/loyalty-user.entity.ts` — add:

```typescript
@Column({ type: 'varchar', nullable: true, default: 'Asia/Jakarta' })
timezone: string;
```

`VoucherClaimEntity` — no schema change; `created_at` (from `BaseEntity`) drives
period checks. No DB unique constraint changes; uniqueness is enforced in code
within the transaction (pessimistic lock on voucher rows already exists).

### 2. Consumer claim logic — `apps/loyalty-consumer/src/voucher/voucher.service.ts`

Replace the unconditional `existingClaim` check (lines 153–162) with a call to a
new private helper `assertCanClaim(manager, voucher, user)`.

Behavior:

- If `voucher.voucher_type === VoucherType.UNIQUE_CODE` → block if any claim
  exists (current behavior, unchanged).
- Else (CLAIMABLE), switch on `voucher.claim_period`:
  - `ONCE` → block if any claim exists.
  - `FREE` → allow (no claim-history check; only quota check already above).
  - `DAILY` / `WEEKLY` / `MONTHLY` → fetch the user's **most recent** claim for
    this voucher (`created_at DESC`); block only if that claim falls within the
    current calendar period (as seen in the user's timezone).

Period-boundary helper (e.g. `libs/loyalty` util or private method):

- Compute the current period start instant in user timezone:
  - DAILY: today at user timezone midnight
  - WEEKLY: this week's Monday at user timezone midnight
  - MONTHLY: first day of current month at user timezone midnight
- A previous claim blocks the new claim iff `claim.created_at >= periodStartUTC`.

Timezone resolution: `user.timezone ?? process.env.TZ ?? 'Asia/Jakarta'`.

**No dependency changes.** Use `Intl.DateTimeFormat` with the resolved timezone
to derive calendar components, or add `dayjs` + `utc`/`timezone` plugins to the
backend if simpler. `dayjs` is already resolvable in the workspace but is not a
declared root dependency — declare it explicitly if used.

### 3. Admin DTOs

- `apps/loyalty-admin/src/voucher/dto/create-voucher.dto.ts`:
  add `@IsOptional() @IsEnum(ClaimPeriod) claim_period?: ClaimPeriod`.
- `update-voucher.dto.ts` inherits via `PartialType` (no change).
- `apps/loyalty-admin/src/voucher/dto/response-voucher.dto.ts`:
  add `@Expose() claim_period: ClaimPeriod`.

### 4. Frontend CMS

- `apps/frontend-cms/src/api/vouchers.ts`: add `claim_period` to the voucher
  payload/type.
- `apps/frontend-cms/src/pages/VoucherCreate.tsx` and `VoucherEdit.tsx`:
  add a `Claim Period` dropdown (FREE / DAILY / WEEKLY / MONTHLY / ONCE).
  - Enabled/visible only when `voucher_type === 'CLAIMABLE'`.
  - When `voucher_type === 'UNIQUE_CODE'`, force `claim_period = 'ONCE'` and
    disable the control.
  - Default to `ONCE`.

### 5. Error handling

- Reuse existing `BadRequestException` with a message that conveys the period,
  e.g. `"You have already claimed this voucher within the current period"`.

## Data Flow

```
Admin CMS form → POST /loyalty-admin/vouchers { claim_period: 'DAILY', ... }
  → VoucherService.create stores claim_period column

Consumer: POST /loyalty/vouchers/:code/claim
  → claimVoucher()
    → quota check (unchanged)
    → target_users check (unchanged)
    → assertCanClaim()  // NEW: period-aware
      → UNIQUE_CODE / ONCE → block if any claim
      → FREE → allow
      → DAILY/WEEKLY/MONTHLY → block if latest claim in current calendar period (user tz)
    → create VoucherClaimEntity + quota -= 1 (unchanged)
```

## Testing

### Backend (Jest)

`apps/loyalty-consumer/src/voucher/voucher.service.spec.ts`:

- `claim_period = ONCE`: second claim blocked; result message preserved.
- `claim_period = FREE`: repeated claims allowed (quota permitting).
- `claim_period = DAILY`: claim today allowed; claim 1 minute after
  a previous claim on a different day allowed; claim on the same day blocked.
- `claim_period = WEEKLY`: Monday claim blocks Sunday claim (same week);
  next Monday claim allowed.
- `claim_period = MONTHLY`: claim in month N blocks a later claim in month N;
  claim in month N+1 allowed.
- Timezone boundary: a claim near 00:00 in user timezone (`Asia/Jakarta`)
  resolves to the correct calendar day (UTC ≠ local boundary).
- `voucher_type = UNIQUE_CODE` ignores `claim_period` and stays 1x forever.
- Quota is still decremented on every successful claim.

### Frontend (Vitest + RTL)

- `VoucherCreate.spec.tsx` / `VoucherEdit.spec.tsx`:
  - Claim period dropdown renders when `voucher_type = CLAIMABLE`.
  - Selecting `UNIQUE_CODE` disables/hides the dropdown and sets `ONCE`.
  - Defaults to `ONCE` on initial load / existing voucher without the field.

## Out of Scope

- No change to `useVoucher()` / redemption flow.
- No change to UNIQUE_CODE single-claim semantics.
- No per-user timezone authoring UI in CMS (field seeded/defaulted); admin
  cannot edit user timezone in this spec.
- No partial-period support (e.g. "every weekday"), no custom day counts.
- Quota semantics unchanged.
