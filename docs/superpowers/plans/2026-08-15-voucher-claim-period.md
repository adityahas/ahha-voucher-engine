# Voucher Claim Period Configurable — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a configurable `claim_period` (FREE/DAILY/WEEKLY/MONTHLY/ONCE) to vouchers so claim frequency per user is calendar-based in the user's timezone.

**Architecture:** Add a `claim_period` enum column on `VoucherEntity` and a `timezone` column on `LoyaltyUserEntity`. Rewrite the unconditional "already claimed" check in `claimVoucher()` into an `assertCanClaim()` helper that branches by `voucher_type` (UNIQUE_CODE stays 1x-forever) and `claim_period` (periodic windows computed in the user's timezone via a pure `Intl.DateTimeFormat` util — no new dependencies). Expose `claim_period` through admin DTOs and CMS create/edit forms, where it is forced to `ONCE` when `voucher_type === UNIQUE_CODE`.

**Tech Stack:** NestJS 11, TypeORM 0.3 (PostgreSQL, SnakeNamingStrategy), Jest, React 18 + Vite + Vitest.

## Global Constraints

- Default `claim_period` is `ONCE` for all existing and new vouchers (no behavior change until configured).
- `claim_period` only applies to `VoucherType.CLAIMABLE`; `VoucherType.UNIQUE_CODE` always behaves as 1 claim per user, ever.
- `quota` still decrements by 1 on every successful claim (unchanged).
- Calendar periods: DAILY = calendar day, WEEKLY = Monday–Sunday, MONTHLY = calendar month, all in the user's timezone.
- User timezone comes from `loyalty_users.timezone` (new column, default `Asia/Jakarta`); fallback `Asia/Jakarta`.
- No new runtime dependencies — timezone math uses `Intl.DateTimeFormat`.
- Monetary/quota values unchanged; all existing tests must keep passing.
- Enum values are exactly `FREE`, `DAILY`, `WEEKLY`, `MONTHLY`, `ONCE`.

---

### Task 1: Entity columns — `claim_period` + `timezone` + migration

**Files:**

- Modify: `libs/loyalty/src/voucher/entities/voucher.entity.ts`
- Modify: `libs/loyalty/src/entities/loyalty-user.entity.ts`
- Create: `apps/loyalty-admin/src/migrations/20260815-voucher-claim-period.ts`

**Interfaces:**

- Consumes: nothing
- Produces: `ClaimPeriod` enum exported from `@core/loyalty/voucher/entities/voucher.entity`; `VoucherEntity.claim_period: ClaimPeriod` (default `ONCE`); `LoyaltyUserEntity.timezone: string` (default `'Asia/Jakarta'`). Migration adds both columns.

- [ ] **Step 1: Write the failing entity test**

Create `libs/loyalty/src/voucher/entities/voucher.entity.spec.ts`:

```typescript
import { ClaimPeriod, VoucherEntity } from './voucher.entity';

describe('VoucherEntity', () => {
  it('defines the five claim period options', () => {
    expect(ClaimPeriod).toEqual({
      FREE: 'FREE',
      DAILY: 'DAILY',
      WEEKLY: 'WEEKLY',
      MONTHLY: 'MONTHLY',
      ONCE: 'ONCE',
    });
  });
});
```

Note: we intentionally do NOT assert an instance-level default. TypeORM `@Column({ default })` applies at the database layer only; `new VoucherEntity().claim_period` is `undefined`. The `ONCE` default is enforced by (a) the migration `DEFAULT 'ONCE'`, and (b) the consumer `assertCanClaim` fallback `voucher.claim_period ?? ClaimPeriod.ONCE`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test --testPathPattern=voucher.entity`
Expected: FAIL — `ClaimPeriod` is not defined.

- [ ] **Step 3: Add the enum and column**

In `libs/loyalty/src/voucher/entities/voucher.entity.ts`, after the `DiscountType` enum (line 25), add:

```typescript
export enum ClaimPeriod {
  FREE = 'FREE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ONCE = 'ONCE',
}
```

On `VoucherEntity`, after `voucher_type` (line 41), add:

```typescript
@Column({
  type: 'enum',
  enum: ClaimPeriod,
  default: ClaimPeriod.ONCE,
})
claim_period: ClaimPeriod;
```

- [ ] **Step 4: Add `timezone` to `LoyaltyUserEntity`**

In `libs/loyalty/src/entities/loyalty-user.entity.ts`, add after `balance_points` (line 19):

```typescript
@Column({ type: 'varchar', nullable: true, default: 'Asia/Jakarta' })
timezone: string;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `yarn test --testPathPattern=voucher.entity`
Expected: PASS (1 test).

- [ ] **Step 6: Write the migration**

Create `apps/loyalty-admin/src/migrations/20260815-voucher-claim-period.ts`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class VoucherClaimPeriod20260815 implements MigrationInterface {
  name = 'VoucherClaimPeriod20260815';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "vouchers_claim_period_enum" AS ENUM ('FREE', 'DAILY', 'WEEKLY', 'MONTHLY', 'ONCE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD "claim_period" "vouchers_claim_period_enum" NOT NULL DEFAULT 'ONCE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_users" ADD "timezone" character varying DEFAULT 'Asia/Jakarta'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loyalty_users" DROP COLUMN "timezone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP COLUMN "claim_period"`,
    );
    await queryRunner.query(`DROP TYPE "vouchers_claim_period_enum"`);
  }
}
```

- [ ] **Step 7: Verify build + full entity tests**

Run: `yarn build`
Expected: compiles without errors (entity glob `__dirname + '/../../../**/*.entity{.ts,.js}'` picks up the migration-free entities; `migrationsRun` is already true for the loyalty-admin connection path).

Run: `yarn test --testPathPattern=voucher.entity`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add libs/loyalty/src/voucher/entities/voucher.entity.ts libs/loyalty/src/voucher/entities/voucher.entity.spec.ts libs/loyalty/src/entities/loyalty-user.entity.ts apps/loyalty-admin/src/migrations/20260815-voucher-claim-period.ts
git commit -m "feat(loyalty): add claim_period and user timezone columns"
```

---

### Task 2: Timezone-aware claim period util (pure, testable)

**Files:**

- Create: `apps/loyalty-consumer/src/voucher/claim-period.util.ts`
- Create: `apps/loyalty-consumer/src/voucher/claim-period.util.spec.ts`

**Interfaces:**

- Consumes: `ClaimPeriod` from `@core/loyalty/voucher/entities/voucher.entity` (Task 1).
- Produces:
  - `DEFAULT_TIMEZONE: string` (const `'Asia/Jakarta'`)
  - `resolveTimezone(timezone?: string | null): string`
  - `getCurrentPeriodStartUtc(period: ClaimPeriod, now: Date, tz: string): Date` (throws for `FREE`/`ONCE`)
  - `isWithinCurrentPeriod(period: ClaimPeriod, claimDate: Date, now: Date, tz: string): boolean`

- [ ] **Step 1: Write the failing tests**

Create `apps/loyalty-consumer/src/voucher/claim-period.util.spec.ts`:

```typescript
import { ClaimPeriod } from '@core/loyalty/voucher/entities/voucher.entity';
import {
  DEFAULT_TIMEZONE,
  resolveTimezone,
  getCurrentPeriodStartUtc,
  isWithinCurrentPeriod,
} from './claim-period.util';

describe('claim-period.util', () => {
  it('exposes a default timezone', () => {
    expect(DEFAULT_TIMEZONE).toBe('Asia/Jakarta');
  });

  it('resolveTimezone falls back to default when missing or blank', () => {
    expect(resolveTimezone(undefined)).toBe('Asia/Jakarta');
    expect(resolveTimezone(null)).toBe('Asia/Jakarta');
    expect(resolveTimezone('  ')).toBe('Asia/Jakarta');
    expect(resolveTimezone('UTC')).toBe('UTC');
  });

  describe('getCurrentPeriodStartUtc', () => {
    // 2026-08-15 17:00 UTC = 2026-08-16 00:00 WIB (UTC+7)
    const saturdayNightUtc = new Date('2026-08-15T17:00:00.000Z');

    it('returns UTC start of the current calendar day', () => {
      const start = getCurrentPeriodStartUtc(
        ClaimPeriod.DAILY,
        saturdayNightUtc,
        'Asia/Jakarta',
      );
      expect(start.toISOString()).toBe('2026-08-15T17:00:00.000Z');
    });

    it('returns UTC start of Monday for the current week', () => {
      // Sunday 2026-08-16 WIB; week started Monday 2026-08-10 (00:00 WIB)
      const start = getCurrentPeriodStartUtc(
        ClaimPeriod.WEEKLY,
        saturdayNightUtc,
        'Asia/Jakarta',
      );
      expect(start.toISOString()).toBe('2026-08-09T17:00:00.000Z');
    });

    it('returns UTC start of the current month', () => {
      const start = getCurrentPeriodStartUtc(
        ClaimPeriod.MONTHLY,
        saturdayNightUtc,
        'Asia/Jakarta',
      );
      expect(start.toISOString()).toBe('2026-07-31T17:00:00.000Z');
    });

    it('throws for FREE and ONCE', () => {
      expect(() =>
        getCurrentPeriodStartUtc(ClaimPeriod.FREE, saturdayNightUtc, 'UTC'),
      ).toThrow();
      expect(() =>
        getCurrentPeriodStartUtc(ClaimPeriod.ONCE, saturdayNightUtc, 'UTC'),
      ).toThrow();
    });
  });

  describe('isWithinCurrentPeriod', () => {
    const now = new Date('2026-08-15T17:00:00.000Z'); // 00:00 WIB Aug 16
    const prevDayWib = new Date('2026-08-15T16:59:59.999Z'); // 23:59:59 WIB Aug 15
    const currentDayWib = new Date('2026-08-15T17:00:00.000Z'); // 00:00:00 WIB Aug 16

    it('daily: previous local day is outside, current local day is inside', () => {
      expect(
        isWithinCurrentPeriod(
          ClaimPeriod.DAILY,
          prevDayWib,
          now,
          'Asia/Jakarta',
        ),
      ).toBe(false);
      expect(
        isWithinCurrentPeriod(
          ClaimPeriod.DAILY,
          currentDayWib,
          now,
          'Asia/Jakarta',
        ),
      ).toBe(true);
    });

    it('monthly: prior month is outside, same month is inside', () => {
      const lastMonth = new Date('2026-07-31T16:59:59.999Z');
      const thisMonth = new Date('2026-08-01T00:00:00.000Z');
      expect(
        isWithinCurrentPeriod(
          ClaimPeriod.MONTHLY,
          lastMonth,
          now,
          'Asia/Jakarta',
        ),
      ).toBe(false);
      expect(
        isWithinCurrentPeriod(
          ClaimPeriod.MONTHLY,
          thisMonth,
          now,
          'Asia/Jakarta',
        ),
      ).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test --testPathPattern=claim-period.util`
Expected: FAIL — module `claim-period.util` does not exist / functions undefined.

- [ ] **Step 3: Write the implementation**

Create `apps/loyalty-consumer/src/voucher/claim-period.util.ts`:

```typescript
import { ClaimPeriod } from '@core/loyalty/voucher/entities/voucher.entity';

export const DEFAULT_TIMEZONE = 'Asia/Jakarta';

export function resolveTimezone(timezone?: string | null): string {
  return timezone && timezone.trim() ? timezone : DEFAULT_TIMEZONE;
}

interface LocalParts {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 0 = Sunday .. 6 = Saturday
}

function getLocalParts(date: Date, tz: string): LocalParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = dtf.formatToParts(date);
  const value = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? '';
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    weekday: weekdayMap[value('weekday')] ?? 0,
  };
}

function getOffsetMs(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const value = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour') % 24,
    value('minute'),
    value('second'),
  );
  return asUtc - date.getTime();
}

function localToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  s: number,
  tz: string,
): Date {
  const base = Date.UTC(y, mo - 1, d, h, mi, s);
  let utc = base;
  for (let i = 0; i < 2; i += 1) {
    const offset = getOffsetMs(new Date(utc), tz);
    utc = base - offset;
  }
  return new Date(utc);
}

export function getCurrentPeriodStartUtc(
  period: ClaimPeriod,
  now: Date,
  tz: string,
): Date {
  const local = getLocalParts(now, tz);
  switch (period) {
    case ClaimPeriod.DAILY:
      return localToUtc(local.year, local.month, local.day, 0, 0, 0, tz);
    case ClaimPeriod.WEEKLY: {
      const daysSinceMonday = (local.weekday + 6) % 7;
      return localToUtc(
        local.year,
        local.month,
        local.day - daysSinceMonday,
        0,
        0,
        0,
        tz,
      );
    }
    case ClaimPeriod.MONTHLY:
      return localToUtc(local.year, local.month, 1, 0, 0, 0, tz);
    default:
      throw new Error(`claim_period ${period} has no calendar window`);
  }
}

export function isWithinCurrentPeriod(
  period: ClaimPeriod,
  claimDate: Date,
  now: Date,
  tz: string,
): boolean {
  const start = getCurrentPeriodStartUtc(period, now, tz);
  return claimDate.getTime() >= start.getTime();
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test --testPathPattern=claim-period.util`
Expected: PASS (all describe blocks).

- [ ] **Step 5: Commit**

```bash
git add apps/loyalty-consumer/src/voucher/claim-period.util.ts apps/loyalty-consumer/src/voucher/claim-period.util.spec.ts
git commit -m "feat(consumer): timezone-aware claim period helper"
```

---

### Task 3: Period-aware `claimVoucher` via `assertCanClaim`

**Files:**

- Modify: `apps/loyalty-consumer/src/voucher/voucher.service.ts:153-162`
- Modify: `apps/loyalty-consumer/src/voucher/voucher.service.spec.ts`

**Interfaces:**

- Consumes: `ClaimPeriod`, `VoucherType` from Task 1; `isWithinCurrentPeriod`, `resolveTimezone` from Task 2; existing `manager.findOne(VoucherClaimEntity, ...)` pattern.
- Produces: private method `assertCanClaim(manager: EntityManager, voucher: VoucherEntity, user: LoyaltyUserEntity): Promise<void>`.

- [ ] **Step 1: Write the failing tests**

In `apps/loyalty-consumer/src/voucher/voucher.service.spec.ts`:

- Add `ClaimPeriod` to the import from `@core/loyalty/voucher/entities/voucher.entity` (line 4-8).
- Add `claim_period: ClaimPeriod.ONCE` to the `makeVoucher` factory (after line 30 `voucher_type`).
- Add an `afterEach` that resets fake timers inside `describe('claimVoucher')` so a failing assertion can't leak fake timers into later tests (insert after the `beforeEach` that ends at line ~327):

```typescript
afterEach(() => {
  jest.useRealTimers();
});
```

- In `describe('claimVoucher')` (starts line 295), replace the `it('throws BadRequestException when voucher already claimed', ...)` test (lines 364-372) and add these new cases before the success test:

```typescript
it('throws BadRequestException when voucher already claimed (ONCE)', async () => {
  const voucher = makeVoucher();
  txManager.findOne.mockResolvedValueOnce(voucher);
  txManager.findOne.mockResolvedValueOnce({ id: 9 }); // existing claim
  await expect(service.claimVoucher('user-id', 'VOU-10')).rejects.toThrow(
    'You have already claimed this voucher',
  );
});

it('allows re-claiming a FREE voucher even when a claim exists', async () => {
  const voucher = makeVoucher({ claim_period: ClaimPeriod.FREE, quota: 5 });
  txManager.findOne.mockResolvedValueOnce(voucher);
  txManager.findOne.mockResolvedValueOnce({ id: 9 }); // existing claim exists
  txManager.create.mockImplementation((_, data) => data);
  txManager.save.mockImplementation((_, data) => Promise.resolve(data));

  const result = await service.claimVoucher('user-id', 'VOU-10');

  expect(result).toEqual({
    success: true,
    message: 'Voucher claimed successfully!',
  });
  expect(voucher.quota).toBe(4);
});

it('blocks DAILY re-claim within the current local day', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-08-15T17:00:00.000Z'));
  const voucher = makeVoucher({ claim_period: ClaimPeriod.DAILY, quota: 5 });
  const todayWibClaim = new Date('2026-08-15T17:00:00.000Z'); // 00:00 WIB
  txManager.findOne.mockResolvedValueOnce(voucher);
  txManager.findOne.mockResolvedValueOnce({
    id: 9,
    created_at: todayWibClaim,
  });
  await expect(service.claimVoucher('user-id', 'VOU-10')).rejects.toThrow(
    'You have already claimed this voucher within the current period',
  );
});

it('allows DAILY re-claim on a new local day', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-08-15T17:00:00.000Z'));
  const voucher = makeVoucher({ claim_period: ClaimPeriod.DAILY, quota: 5 });
  const yesterdayWib = new Date('2026-08-15T16:59:59.999Z');
  txManager.findOne.mockResolvedValueOnce(voucher);
  txManager.findOne.mockResolvedValueOnce({
    id: 9,
    created_at: yesterdayWib,
  });
  txManager.create.mockImplementation((_, data) => data);
  txManager.save.mockImplementation((_, data) => Promise.resolve(data));

  const result = await service.claimVoucher('user-id', 'VOU-10');
  expect(result.success).toBe(true);
  expect(voucher.quota).toBe(4);
});

it('blocks WEEKLY re-claim within the same Monday-Sunday week', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-08-15T17:00:00.000Z'));
  const voucher = makeVoucher({ claim_period: ClaimPeriod.WEEKLY, quota: 5 });
  const mondayWib = new Date('2026-08-09T17:00:00.000Z'); // Mon 00:00 WIB
  txManager.findOne.mockResolvedValueOnce(voucher);
  txManager.findOne.mockResolvedValueOnce({ id: 9, created_at: mondayWib });
  await expect(service.claimVoucher('user-id', 'VOU-10')).rejects.toThrow(
    'You have already claimed this voucher within the current period',
  );
});

it('allows WEEKLY re-claim the following Monday', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-08-16T17:00:00.000Z'));
  const voucher = makeVoucher({ claim_period: ClaimPeriod.WEEKLY, quota: 5 });
  const lastMonday = new Date('2026-08-09T17:00:00.000Z');
  txManager.findOne.mockResolvedValueOnce(voucher);
  txManager.findOne.mockResolvedValueOnce({ id: 9, created_at: lastMonday });
  txManager.create.mockImplementation((_, data) => data);
  txManager.save.mockImplementation((_, data) => Promise.resolve(data));

  const result = await service.claimVoucher('user-id', 'VOU-10');
  expect(result.success).toBe(true);
});

it('blocks MONTHLY re-claim within the same month', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-08-15T17:00:00.000Z'));
  const voucher = makeVoucher({ claim_period: ClaimPeriod.MONTHLY, quota: 5 });
  const aug1Wib = new Date('2026-07-31T17:00:00.000Z'); // Aug 1 00:00 WIB
  txManager.findOne.mockResolvedValueOnce(voucher);
  txManager.findOne.mockResolvedValueOnce({ id: 9, created_at: aug1Wib });
  await expect(service.claimVoucher('user-id', 'VOU-10')).rejects.toThrow(
    'You have already claimed this voucher within the current period',
  );
});

it('keeps UNIQUE_CODE as 1x-forever regardless of claim_period', async () => {
  const voucher = makeVoucher({
    voucher_type: VoucherType.UNIQUE_CODE,
    claim_period: ClaimPeriod.FREE,
  });
  txManager.findOne.mockResolvedValueOnce(voucher);
  txManager.findOne.mockResolvedValueOnce({ id: 9 }); // existing claim
  await expect(service.claimVoucher('user-id', 'VOU-10')).rejects.toThrow(
    'You have already claimed this voucher',
  );
});
```

Note: the existing success test (`claims successfully, decrements quota and persists claim`, line 374) must still pass — it mocks `findOne` returning the voucher then `null`.

- [ ] **Step 2: Run the tests to verify the new cases fail**

Run: `yarn test --testPathPattern=voucher.service.spec`
Expected: the new period tests FAIL (still hitting the unconditional "already claimed" path); the ONCE/UNIQUE_CODE cases may pass.

- [ ] **Step 3: Implement `assertCanClaim` and wire it in**

In `apps/loyalty-consumer/src/voucher/voucher.service.ts`:

- Update imports (line 7-10) to include the new symbols and util:

```typescript
import {
  VoucherEntity,
  DiscountType,
  VoucherType,
  ClaimPeriod,
} from '@core/loyalty/voucher/entities/voucher.entity';
import { isWithinCurrentPeriod, resolveTimezone } from './claim-period.util';
```

- Replace the existing claim-existence block (lines 153-162):

```typescript
await this.assertCanClaim(manager, voucher, user);
```

- Add the private method after `claimVoucher` (after line 179):

```typescript
  private async assertCanClaim(
    manager: EntityManager,
    voucher: VoucherEntity,
    user: LoyaltyUserEntity,
  ): Promise<void> {
    if (voucher.voucher_type === VoucherType.UNIQUE_CODE) {
      const existingClaim = await manager.findOne(VoucherClaimEntity, {
        where: {
          voucher: { code: voucher.code },
          user: { id: user.id },
        },
      });
      if (existingClaim) {
        throw new BadRequestException('You have already claimed this voucher');
      }
      return;
    }

    const period = voucher.claim_period ?? ClaimPeriod.ONCE;

    if (period === ClaimPeriod.FREE) {
      return;
    }

    if (period === ClaimPeriod.ONCE) {
      const existingClaim = await manager.findOne(VoucherClaimEntity, {
        where: {
          voucher: { code: voucher.code },
          user: { id: user.id },
        },
      });
      if (existingClaim) {
        throw new BadRequestException('You have already claimed this voucher');
      }
      return;
    }

    const latestClaim = await manager.findOne(VoucherClaimEntity, {
      where: {
        voucher: { code: voucher.code },
        user: { id: user.id },
      },
      order: { created_at: 'DESC' },
    });

    if (
      latestClaim &&
      isWithinCurrentPeriod(
        period,
        latestClaim.created_at,
        new Date(),
        resolveTimezone(user.timezone),
      )
    ) {
      throw new BadRequestException(
        'You have already claimed this voucher within the current period',
      );
    }
  }
```

- [ ] **Step 4: Run the full consumer voucher spec**

Run: `yarn test --testPathPattern=voucher.service.spec`
Expected: PASS — all claimVoucher, useVoucher, calculateDiscount, validateAndCalculateDiscount cases pass.

- [ ] **Step 5: Run the util spec once more**

Run: `yarn test --testPathPattern=claim-period.util`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/loyalty-consumer/src/voucher/voucher.service.ts apps/loyalty-consumer/src/voucher/voucher.service.spec.ts
git commit -m "feat(consumer): period-aware voucher claim validation"
```

---

### Task 4: Admin DTOs — `claim_period` create/update/response

**Files:**

- Modify: `apps/loyalty-admin/src/voucher/dto/create-voucher.dto.ts`
- Modify: `apps/loyalty-admin/src/voucher/dto/response-voucher.dto.ts`
- Modify: `apps/loyalty-admin/src/voucher/voucher.service.spec.ts` (create tests)

**Interfaces:**

- Consumes: `ClaimPeriod` from Task 1.
- Produces: `CreateVoucherDto.claim_period?: ClaimPeriod`; `ResponseVoucherDto.claim_period: ClaimPeriod`. Admin `VoucherService.create` already assigns scalars via `Object.assign`, so `claim_period` flows through automatically.

- [ ] **Step 1: Write the failing test**

In `apps/loyalty-admin/src/voucher/voucher.service.spec.ts`, add `ClaimPeriod` to the `VoucherEntity` import (line 4), then add a case in `describe('create', ...)` (starts line 223):

```typescript
it('persists claim_period from the DTO', async () => {
  mockVoucherRepository.save.mockImplementation((v) => Promise.resolve(v));

  const result = await service.create({
    code: 'DAILYV',
    claim_period: ClaimPeriod.DAILY,
  } as any);

  expect(result.claim_period).toBe(ClaimPeriod.DAILY);
  expect(mockVoucherRepository.save).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test --testPathPattern=voucher.service.spec --runInBand`
Expected: FAIL — `claim_period` is not a known property of `CreateVoucherDto` (class-validator ignores it; `result.claim_period` is `undefined`).

- [ ] **Step 3: Add `claim_period` to `CreateVoucherDto`**

In `apps/loyalty-admin/src/voucher/dto/create-voucher.dto.ts`:

- Extend the import from `@core/loyalty/voucher/entities/voucher.entity` (line 15-18) to include `ClaimPeriod`.
- After `voucher_type` (line 23), add:

```typescript
  @IsEnum(ClaimPeriod)
  @IsOptional()
  claim_period?: ClaimPeriod;
```

- [ ] **Step 4: Add `claim_period` to `ResponseVoucherDto`**

In `apps/loyalty-admin/src/voucher/dto/response-voucher.dto.ts`:

- Add `ClaimPeriod` to the import from `@core/loyalty/voucher/entities/voucher.entity` (lines 13-17).
- After `voucher_type` (line 8), add:

```typescript
  @Expose()
  claim_period: ClaimPeriod;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `yarn test --testPathPattern=voucher.service.spec --runInBand`
Expected: PASS — new test plus all existing admin voucher service tests.

- [ ] **Step 6: Commit**

```bash
git add apps/loyalty-admin/src/voucher/dto/create-voucher.dto.ts apps/loyalty-admin/src/voucher/dto/response-voucher.dto.ts apps/loyalty-admin/src/voucher/voucher.service.spec.ts
git commit -m "feat(admin): expose claim_period in voucher DTOs"
```

---

### Task 5: CMS API types + claim period label map

**Files:**

- Modify: `apps/frontend-cms/src/api/vouchers.ts`
- Create: `apps/frontend-cms/src/lib/claim-period.ts`
- Create: `apps/frontend-cms/src/lib/claim-period.spec.ts`

**Interfaces:**

- Consumes: nothing (frontend-local).
- Produces: `export type ClaimPeriod = 'FREE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE'` in `api/vouchers.ts`; `Voucher.claim_period: ClaimPeriod`; `CLAIM_PERIOD_MAP` + `formatClaimPeriod` in `lib/claim-period.ts`.

- [ ] **Step 1: Write the failing tests**

Create `apps/frontend-cms/src/lib/claim-period.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { CLAIM_PERIOD_MAP, formatClaimPeriod } from './claim-period';

describe('claim-period', () => {
  it('maps every period to an id and en label', () => {
    expect(Object.keys(CLAIM_PERIOD_MAP).sort()).toEqual([
      'DAILY',
      'FREE',
      'MONTHLY',
      'ONCE',
      'WEEKLY',
    ]);
    expect(CLAIM_PERIOD_MAP.DAILY.label.id).toContain('harian');
  });

  it('formats a period or falls back for unknown values', () => {
    expect(formatClaimPeriod('ONCE')).toBe('ONCE');
    expect(formatClaimPeriod(undefined)).toBe('NOT CONFIGURED');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd apps/frontend-cms && npx vitest run src/lib/claim-period.spec.ts`
Expected: FAIL — `claim-period` module not found.

- [ ] **Step 3: Implement the label map**

Create `apps/frontend-cms/src/lib/claim-period.ts` (mirror `discount-type.ts` structure):

```typescript
export type ClaimPeriod = 'FREE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE';

export type Language = 'id' | 'en';

export interface ClaimPeriodInfo {
  label: Record<Language, string>;
}

export const CLAIM_PERIOD_MAP: Record<ClaimPeriod, ClaimPeriodInfo> = {
  FREE: {
    label: { id: 'Bebas (Unlimited)', en: 'Free (Unlimited)' },
  },
  DAILY: {
    label: { id: 'Harian', en: 'Daily' },
  },
  WEEKLY: {
    label: { id: 'Mingguan', en: 'Weekly' },
  },
  MONTHLY: {
    label: { id: 'Bulanan', en: 'Monthly' },
  },
  ONCE: {
    label: { id: 'Sekali Saja', en: 'Once' },
  },
};

export const formatClaimPeriod = (
  period?: ClaimPeriod | string | null,
  lang: Language = 'id',
): string => {
  if (!period) return 'NOT CONFIGURED';
  const info = CLAIM_PERIOD_MAP[period as ClaimPeriod];
  return info ? info.label[lang] : String(period);
};
```

- [ ] **Step 4: Update the CMS API types**

In `apps/frontend-cms/src/api/vouchers.ts`:

- After `export type VoucherType = 'CLAIMABLE' | 'UNIQUE_CODE';` (line 7) add:

```typescript
export type ClaimPeriod = 'FREE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE';
```

- In the `Voucher` interface, after `voucher_type` (line 10) add:

```typescript
claim_period: ClaimPeriod;
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd apps/frontend-cms && npx vitest run src/lib/claim-period.spec.ts`
Expected: PASS.

Run: `cd apps/frontend-cms && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend-cms/src/api/vouchers.ts apps/frontend-cms/src/lib/claim-period.ts apps/frontend-cms/src/lib/claim-period.spec.ts
git commit -m "feat(cms): claim period types and labels"
```

---

### Task 6: CMS VoucherCreate claim period dropdown

**Files:**

- Modify: `apps/frontend-cms/src/pages/VoucherCreate.tsx`
- Create: `apps/frontend-cms/src/pages/VoucherCreate.spec.tsx`

**Interfaces:**

- Consumes: `ClaimPeriod` type + `CLAIM_PERIOD_MAP` from Task 5; `createVoucher` from `../api/vouchers`.
- Produces: form state field `claim_period: ClaimPeriod` (default `'ONCE'`); dropdown in General Parameters, disabled when `voucher_type === 'UNIQUE_CODE'`; on submit, `claim_period` is always `'ONCE'` when `voucher_type === 'UNIQUE_CODE'`.

- [ ] **Step 1: Write the failing tests**

Create `apps/frontend-cms/src/pages/VoucherCreate.spec.tsx` (mirror `VoucherCategoryCreate.spec.tsx` setup):

```typescript
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoucherCreate } from './VoucherCreate';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

vi.mock('../api/vouchers', () => ({
  createVoucher: vi.fn(),
}));

vi.mock('../api/voucher-categories', () => ({
  getVoucherCategories: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/users', () => ({
  getUsers: vi.fn().mockResolvedValue([]),
}));

describe('VoucherCreate claim period', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to ONCE', async () => {
    render(<VoucherCreate />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Claim Period/i)).toHaveValue('ONCE');
    });
  });

  it('is enabled when voucher_type is CLAIMABLE', async () => {
    render(<VoucherCreate />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Claim Period/i)).not.toBeDisabled();
    });
  });

  it('is disabled and forced to ONCE when voucher_type is UNIQUE_CODE', async () => {
    render(<VoucherCreate />);
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/Voucher Type/i), {
        target: { value: 'UNIQUE_CODE' },
      });
    });
    expect(screen.getByLabelText(/Claim Period/i)).toBeDisabled();
    expect(screen.getByLabelText(/Claim Period/i)).toHaveValue('ONCE');
  });

  it('submits the selected claim_period', async () => {
    const { createVoucher } = await import('../api/vouchers');
    (createVoucher as any).mockResolvedValue({ code: 'X' });

    render(<VoucherCreate />);
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/Voucher Type/i), {
        target: { value: 'CLAIMABLE' },
      });
      fireEvent.change(screen.getByLabelText(/Claim Period/i), {
        target: { value: 'DAILY' },
      });
      fireEvent.change(screen.getByLabelText(/Voucher Code/i), {
        target: { value: 'PROMO-1' },
      });
    });
    fireEvent.click(screen.getByRole('button', { name: /Initialize Campaign/i }));

    await waitFor(() => {
      expect(createVoucher).toHaveBeenCalledWith(
        expect.objectContaining({ claim_period: 'DAILY' }),
      );
    });
  });
});
```

Note: `getByLabelText(/Voucher Type/i)` must match an accessible label. If the existing `<label>` uses a `<select>` without a proper `htmlFor`/`id` pairing, add `id="claim_period"` and `htmlFor="claim_period"` (the surrounding markup pattern already pairs `id`/`htmlFor`, see lines 200-229).

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd apps/frontend-cms && npx vitest run src/pages/VoucherCreate.spec.tsx`
Expected: FAIL — `Claim Period` label/field not found; no dropdown rendered.

- [ ] **Step 3: Add the form field + dropdown**

In `apps/frontend-cms/src/pages/VoucherCreate.tsx`:

- Update import (line 12) to include `ClaimPeriod`:
  `import { createVoucher, VoucherType, ClaimPeriod } from '../api/vouchers';`
- Add import of the label map (after line 17):
  `import { CLAIM_PERIOD_MAP } from '../lib/claim-period';`
- In `formData` state (line 41), add after `voucher_type`:
  `claim_period: 'ONCE' as ClaimPeriod,`
- In `handleChange` (line 79) the generic input handler already stores scalars; the `claim_period` select will use its own `onChange` (below) so no change needed here.
- Update the `voucher_type` select `onChange` (lines 214-219) to force `ONCE` for UNIQUE_CODE:

```typescript
                        onChange={(e) => {
                          const nextType = e.target.value as VoucherType;
                          setFormData((prev) => ({
                            ...prev,
                            voucher_type: nextType,
                            claim_period:
                              nextType === 'UNIQUE_CODE'
                                ? 'ONCE'
                                : prev.claim_period,
                          }));
                        }}
```

- Add a new grid cell next to the Voucher Type cell (inside the `grid grid-cols-1 md:grid-cols-2 gap-6` div, after line 229), mirroring the existing select styling:

```typescript
                  <div className="space-y-2">
                    <label
                      htmlFor="claim_period"
                      className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
                    >
                      Claim Period
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Repeat className="h-4 w-4 text-slate-500" />
                      </div>
                      <select
                        id="claim_period"
                        name="claim_period"
                        value={formData.claim_period}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            claim_period: e.target.value as ClaimPeriod,
                          }))
                        }
                        disabled={formData.voucher_type === 'UNIQUE_CODE'}
                        className="w-full h-10 rounded-md bg-slate-800/50 border border-slate-700/50 focus:border-primary-500/50 transition-all duration-300 pl-10 pr-4 text-sm text-slate-100 appearance-none focus:outline-none focus:ring-1 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {Object.entries(CLAIM_PERIOD_MAP).map(
                          ([value, info]) => (
                            <option key={value} value={value}>
                              {value} — {info.label.id}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>
```

- Add `Repeat` to the lucide-react import (line 23-36).
- The submit payload (line 116-124) spreads `formData`, so `claim_period` is already included. Because the dropdown is disabled for UNIQUE_CODE but the `onChange` above already forces `ONCE`, no extra submit logic is needed.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/frontend-cms && npx vitest run src/pages/VoucherCreate.spec.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Verify no regressions**

Run: `cd apps/frontend-cms && npx tsc --noEmit && npx vitest run`
Expected: no type errors; all CMS tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend-cms/src/pages/VoucherCreate.tsx apps/frontend-cms/src/pages/VoucherCreate.spec.tsx
git commit -m "feat(cms): claim period dropdown on voucher create"
```

---

### Task 7: CMS VoucherEdit claim period dropdown

**Files:**

- Modify: `apps/frontend-cms/src/pages/VoucherEdit.tsx`
- Create: `apps/frontend-cms/src/pages/VoucherEdit.spec.tsx`

**Interfaces:**

- Consumes: `ClaimPeriod` type + `CLAIM_PERIOD_MAP` from Task 5; `getVoucherByCode`, `updateVoucher` from `../api/vouchers`.
- Produces: form state `claim_period` loaded from existing voucher (fallback `'ONCE'`); dropdown disabled when `voucher_type === 'UNIQUE_CODE'`.

- [ ] **Step 1: Write the failing tests**

Create `apps/frontend-cms/src/pages/VoucherEdit.spec.tsx`:

```typescript
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoucherEdit } from './VoucherEdit';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ code: 'VOU-10' }),
}));

vi.mock('../api/vouchers', () => ({
  getVoucherByCode: vi.fn(),
  updateVoucher: vi.fn(),
}));

vi.mock('../api/voucher-categories', () => ({
  getVoucherCategories: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/users', () => ({
  getUsers: vi.fn().mockResolvedValue([]),
}));

describe('VoucherEdit claim period', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the existing claim_period from the voucher', async () => {
    const { getVoucherByCode } = await import('../api/vouchers');
    (getVoucherByCode as any).mockResolvedValue({
      code: 'VOU-10',
      voucher_type: 'CLAIMABLE',
      claim_period: 'WEEKLY',
      description: 'x',
      quota: 5,
      image: null,
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      categories: [],
      allow_combine_categories: [],
      target_users: [],
    });

    render(<VoucherEdit />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Claim Period/i)).toHaveValue('WEEKLY');
    });
  });

  it('falls back to ONCE when the voucher has no claim_period', async () => {
    const { getVoucherByCode } = await import('../api/vouchers');
    (getVoucherByCode as any).mockResolvedValue({
      code: 'VOU-10',
      voucher_type: 'UNIQUE_CODE',
      description: 'x',
      quota: 5,
      image: null,
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      categories: [],
      allow_combine_categories: [],
      target_users: [],
    });

    render(<VoucherEdit />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Claim Period/i)).toHaveValue('ONCE');
    });
    expect(screen.getByLabelText(/Claim Period/i)).toBeDisabled();
  });

  it('submits claim_period with updates', async () => {
    const { getVoucherByCode, updateVoucher } = await import('../api/vouchers');
    (getVoucherByCode as any).mockResolvedValue({
      code: 'VOU-10',
      voucher_type: 'CLAIMABLE',
      claim_period: 'ONCE',
      description: 'x',
      quota: 5,
      image: null,
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      categories: [],
      allow_combine_categories: [],
      target_users: [],
    });
    (updateVoucher as any).mockResolvedValue({ code: 'VOU-10' });

    render(<VoucherEdit />);
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/Claim Period/i), {
        target: { value: 'MONTHLY' },
      });
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(updateVoucher).toHaveBeenCalledWith(
        'VOU-10',
        expect.objectContaining({ claim_period: 'MONTHLY' }),
      );
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd apps/frontend-cms && npx vitest run src/pages/VoucherEdit.spec.tsx`
Expected: FAIL — `Claim Period` field not found.

- [ ] **Step 3: Add the field + dropdown + load logic**

In `apps/frontend-cms/src/pages/VoucherEdit.tsx`:

- Update import (line 12): `import { getVoucherByCode, updateVoucher, VoucherType, ClaimPeriod } from '../api/vouchers';`
- Add import after line 17: `import { CLAIM_PERIOD_MAP } from '../lib/claim-period';`
- In `formData` state (line 42), after `voucher_type` add: `claim_period: 'ONCE' as ClaimPeriod,`
- In the `setFormData` call inside `loadInitialData` (lines 74-86), after `voucher_type` add:
  `claim_period: voucherData.claim_period || 'ONCE',`
- Update the `voucher_type` select `onChange` (lines 238-243) to force `ONCE` for UNIQUE_CODE (same snippet as Task 6).
- Add the Claim Period dropdown cell next to the Voucher Type cell (after the Voucher Type grid cell, following the same markup as Task 6) with `disabled={formData.voucher_type === 'UNIQUE_CODE'}`.
- Add `Repeat` to the lucide-react import (lines 23-37).
- The submit payload (lines 133-141) spreads `formData`, so `claim_period` is included.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/frontend-cms && npx vitest run src/pages/VoucherEdit.spec.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Verify no regressions**

Run: `cd apps/frontend-cms && npx tsc --noEmit && npx vitest run`
Expected: no type errors; all CMS tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend-cms/src/pages/VoucherEdit.tsx apps/frontend-cms/src/pages/VoucherEdit.spec.tsx
git commit -m "feat(cms): claim period dropdown on voucher edit"
```

---

### Task 8: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Build all apps**

Run: `yarn build`
Expected: no errors.

- [ ] **Step 2: Run backend tests**

Run: `yarn test`
Expected: all backend unit tests pass (including new voucher.entity, claim-period.util, consumer voucher.service, admin voucher.service specs).

- [ ] **Step 3: Run frontend tests**

Run: `cd apps/frontend-cms && npx vitest run && npx tsc --noEmit`
Expected: all CMS tests pass; no type errors.

- [ ] **Step 4: Run lint + format check**

Run: `yarn lint && yarn format:check`
Expected: clean.

- [ ] **Step 5: Update the knowledge graph (if graphify is in use)**

Run: `graphify update .`
Expected: graph updated (AST-only).
