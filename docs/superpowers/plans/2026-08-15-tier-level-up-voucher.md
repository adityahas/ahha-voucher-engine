# Tier Level-Up Free Voucher — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-grant a configured voucher to a loyalty user the moment they reach a tier, on both the purchase-driven level-up path and a new manual admin tier-assign path, with consumer feedback in the checkout UI.

**Architecture:** A new nullable `level_up_voucher_code` column on `loyalty_tiers` lets each tier optionally carry a free voucher. A new `TierService.grantLevelUpVoucher(...)` method does the grant directly against a caller-supplied `EntityManager` (claim insert + quota decrement, idempotent by voucher code per user) with no `VoucherService` seam. Two triggers call it inside their existing transaction: the purchase flow's `maybeLevelUp`, and a new `POST /loyalty-admin/users/:coreUserId/tier`. CMS gets a tier-form field and an assign-tier control on the user detail page; the consumer checkout shows a success message with the granted voucher code.

**Tech Stack:** NestJS 11, TypeORM 0.3, PostgreSQL (master + per-tenant), React 18 + Vite (Vitest + RTL), Jest.

Design doc: `docs/superpowers/specs/2026-08-15-tier-level-up-voucher-design.md`

## Global Constraints

- Node/PATH: prepend `export PATH="/opt/homebrew/bin:$PATH"` to every shell that runs `yarn`.
- No new runtime dependencies.
- Money/quota: `voucher.quota` is `int`; decrement with `voucher.quota -= 1` (never floats).
- DB access: always use the `DataSource`/`EntityManager` from the request context (tenant), never a global repository.
- Migration naming: every migration class `name` must end with a 13-digit epoch-ms timestamp, unique and larger than all existing (`VoucherUsageClaim1786747256750` is the latest). New file: `apps/loyalty-admin/src/migrations/20260815-tier-level-up-voucher.ts`.
- Code style: single quotes, trailing comma all, no added comments unless required, entities/DTOs keep `Entity`/`Dto` suffixes.
- `TierChangeReason.MANUAL` already exists — reuse it, do not create new enum values.
- Frontend apps are standalone: `cd apps/frontend-cms` / `cd apps/frontend-consumer` before running their commands.
- Commit hooks run lint-staged `prettier` + `eslint --fix`; they auto-fix on commit.
- After completing the whole plan (or each task/prompt), run `graphify update .` to refresh the knowledge graph.
- ACL: admin endpoints use `@Permissions('manage:points')` on `UserPointsController` (already granted to ADMIN in ACL).

## Open decisions (pinned here)

1. Purchase response always includes `level_up_grant`; `null` when no level-up-with-grant occurred, otherwise the grant result object.
2. Idempotency key: voucher code per loyalty user (one `voucher_claims` row). Codes are unique per voucher; re-scoping to tier id is not needed.
3. Toast wording: `You reached {tierName} tier! Here's your free voucher: {code}` (appended to the existing purchase-success message).
4. Admin `level_up_grant` can include the extra `'quota-exhausted'` message (not in the original spec union) — surfaced in the CMS assign-tier feedback.

---

### Task 1: Data model — `level_up_voucher_code` column + migration

**Files:**

- Modify: `libs/loyalty/src/tier/entities/loyalty-tier.entity.ts`
- Modify: `apps/loyalty-admin/src/tier/dto/create-tier.dto.ts` (UpdateTierDto extends it via `PartialType`, so no separate change needed)
- Create: `apps/loyalty-admin/src/migrations/20260815-tier-level-up-voucher.ts`
- Test: `apps/loyalty-admin/src/migrations/20260815-tier-level-up-voucher.spec.ts`

**Interfaces:**

- Produces: `LoyaltyTierEntity.level_up_voucher_code: string | null` (nullable varchar). `CreateTierDto.level_up_voucher_code?: string`. Used by Task 2 (`grantLevelUpVoucher`), Task 3 (purchase), Task 4 (admin tier assign), Task 5 (CMS).

- [ ] **Step 1: Add the entity column**

In `libs/loyalty/src/tier/entities/loyalty-tier.entity.ts`, after the `exclusive_window_hours` field:

```ts
  @Column({ type: 'int', default: 0 })
  exclusive_window_hours: number;

  @Column({ type: 'varchar', nullable: true })
  level_up_voucher_code: string | null;

  @OneToMany(() => TierCategoryOverrideEntity, (o) => o.tier, {
    cascade: true,
  })
```

- [ ] **Step 2: Add the CreateTierDto field**

In `apps/loyalty-admin/src/tier/dto/create-tier.dto.ts`, after the `exclusive_window_hours` field:

```ts
  @IsOptional()
  @IsInt()
  @Min(0)
  exclusive_window_hours?: number;

  @IsOptional()
  @IsString()
  level_up_voucher_code?: string;
```

- [ ] **Step 3: Write the failing migration spec**

Create `apps/loyalty-admin/src/migrations/20260815-tier-level-up-voucher.spec.ts`:

```ts
import { QueryRunner } from 'typeorm';
import { TierLevelUpVoucher1786840000000 } from './20260815-tier-level-up-voucher';

describe('TierLevelUpVoucher1786840000000', () => {
  it('adds the level_up_voucher_code column and drops it on down', async () => {
    const query = jest.fn();
    const migration = new TierLevelUpVoucher1786840000000();
    const runner = { query } as unknown as QueryRunner;

    await migration.up(runner);
    await migration.down(runner);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('"level_up_voucher_code"'),
    );
    expect(query).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 4: Run spec to verify it fails**

Run: `yarn test --testPathPattern=20260815-tier-level-up-voucher`
Expected: FAIL — "Cannot find module './20260815-tier-level-up-voucher'"

- [ ] **Step 5: Create the migration**

Create `apps/loyalty-admin/src/migrations/20260815-tier-level-up-voucher.ts`:

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class TierLevelUpVoucher1786840000000 implements MigrationInterface {
  name = 'TierLevelUpVoucher1786840000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loyalty_tiers" ADD "level_up_voucher_code" character varying`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loyalty_tiers" DROP COLUMN "level_up_voucher_code"`,
    );
  }
}
```

- [ ] **Step 6: Run specs to verify they pass (incl. conventions guard)**

Run: `yarn test --testPathPattern=migrations`
Expected: PASS (all `migrations/*.spec.ts`, including `migrations-conventions.spec.ts` which validates the 13-digit timestamp, uniqueness, and run order).

- [ ] **Step 7: Build the backend**

Run: `yarn nest build loyalty-admin`
Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add libs/loyalty/src/tier/entities/loyalty-tier.entity.ts apps/loyalty-admin/src/tier/dto/create-tier.dto.ts apps/loyalty-admin/src/migrations/20260815-tier-level-up-voucher.ts apps/loyalty-admin/src/migrations/20260815-tier-level-up-voucher.spec.ts
git commit -m "feat(loyalty): add level_up_voucher_code to tiers"
```

---

### Task 2: `TierService.grantLevelUpVoucher` + unit tests

**Files:**

- Modify: `libs/loyalty/src/tier/tier.service.ts`
- Test: `libs/loyalty/src/tier/tier.service.spec.ts`

**Interfaces:**

- Produces (consumed by Task 3 purchase and Task 4 admin assign):
  ```ts
  type LevelUpGrantResult = {
    granted: boolean;
    voucherCode?: string;
    message:
      | 'no-voucher-configured'
      | 'already-claimed'
      | 'voucher-missing'
      | 'quota-exhausted'
      | 'granted';
  };
  async grantLevelUpVoucher(
    user: LoyaltyUserEntity,
    targetTier: LoyaltyTierEntity,
    manager: EntityManager,
  ): Promise<LevelUpGrantResult>
  ```
- Consumes: `LoyaltyTierEntity.level_up_voucher_code` (Task 1).

- [ ] **Step 1: Write the failing unit tests**

Append to `libs/loyalty/src/tier/tier.service.spec.ts` (add imports for `LoyaltyUserEntity`, `VoucherEntity`, `VoucherClaimEntity` at the top):

```ts
import { LoyaltyUserEntity } from '../entities/loyalty-user.entity';
import { VoucherEntity } from '../voucher/entities/voucher.entity';
import { VoucherClaimEntity } from '../voucher/entities/voucher-claim.entity';
```

Append a new describe block:

```ts
describe('TierService.grantLevelUpVoucher', () => {
  const user = new LoyaltyUserEntity();
  user.id = 'u1';

  function makeService(voucherRepo: any, claimRepo: any) {
    const manager = {
      getRepository: jest.fn((entity: any) => {
        if (entity === VoucherClaimEntity) return claimRepo;
        return voucherRepo;
      }),
    };
    return { service: new TierService(), manager };
  }

  it('returns no-voucher-configured when the tier has no voucher code', async () => {
    const { service, manager } = makeService({}, {});
    const tier = new LoyaltyTierEntity();
    tier.id = 't1';
    tier.level_up_voucher_code = null;

    const result = await service.grantLevelUpVoucher(user, tier, manager);

    expect(result).toEqual({
      granted: false,
      message: 'no-voucher-configured',
    });
  });

  it('returns already-claimed when a claim row already exists for the code', async () => {
    const claimRepo = { findOne: jest.fn().mockResolvedValue({ id: 9 }) };
    const { service, manager } = makeService({}, claimRepo);
    const tier = new LoyaltyTierEntity();
    tier.level_up_voucher_code = 'GOLD2030';

    const result = await service.grantLevelUpVoucher(
      user,
      tier,
      manager as any,
    );

    expect(claimRepo.findOne).toHaveBeenCalledWith({
      where: { voucher: { code: 'GOLD2030' }, user: { id: 'u1' } },
    });
    expect(result).toEqual({ granted: false, message: 'already-claimed' });
  });

  it('returns voucher-missing when the configured code no longer exists', async () => {
    const voucherRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const claimRepo = { findOne: jest.fn().mockResolvedValue(null) };
    const { service, manager } = makeService(voucherRepo, claimRepo);
    const tier = new LoyaltyTierEntity();
    tier.level_up_voucher_code = 'DELETE ME';

    const result = await service.grantLevelUpVoucher(
      user,
      tier,
      manager as any,
    );

    expect(result).toEqual({ granted: false, message: 'voucher-missing' });
  });

  it('returns quota-exhausted without saving when quota is zero', async () => {
    const voucherRepo = {
      findOne: jest.fn().mockResolvedValue({ code: 'X', quota: 0 }),
    };
    const claimRepo = { findOne: jest.fn().mockResolvedValue(null) };
    const { service, manager } = makeService(voucherRepo, claimRepo);
    const tier = new LoyaltyTierEntity();
    tier.level_up_voucher_code = 'X';

    const result = await service.grantLevelUpVoucher(
      user,
      tier,
      manager as any,
    );

    expect(result).toEqual({ granted: false, message: 'quota-exhausted' });
  });

  it('creates a claim, decrements quota, and reports granted', async () => {
    const voucher = { code: 'GOLD2030', quota: 5 };
    const voucherRepo = {
      findOne: jest.fn().mockResolvedValue(voucher),
      save: jest.fn().mockResolvedValue(voucher),
    };
    const claimRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((partial: any) => partial),
      save: jest.fn().mockResolvedValue({}),
    };
    const { service, manager } = makeService(voucherRepo, claimRepo);
    const tier = new LoyaltyTierEntity();
    tier.level_up_voucher_code = 'GOLD2030';

    const result = await service.grantLevelUpVoucher(
      user,
      tier,
      manager as any,
    );

    expect(claimRepo.create).toHaveBeenCalledWith({
      voucher: { code: 'GOLD2030' },
      user: expect.objectContaining({ id: 'u1' }),
    });
    expect(claimRepo.save).toHaveBeenCalled();
    expect(voucherRepo.save).toHaveBeenCalled();
    expect(voucher.quota).toBe(4);
    expect(result).toEqual({
      granted: true,
      voucherCode: 'GOLD2030',
      message: 'granted',
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test --testPathPattern=libs/loyalty/src/tier/tier.service.spec.ts`
Expected: FAIL — "grantLevelUpVoucher is not a function".

- [ ] **Step 3: Implement `grantLevelUpVoucher`**

In `libs/loyalty/src/tier/tier.service.ts`, add imports:

```ts
import { LoyaltyUserEntity } from '../entities/loyalty-user.entity';
import { VoucherEntity } from '../voucher/entities/voucher.entity';
import { VoucherClaimEntity } from '../voucher/entities/voucher-claim.entity';
```

Add the method (and exported type) to the class:

```ts
  async grantLevelUpVoucher(
    user: LoyaltyUserEntity,
    targetTier: LoyaltyTierEntity,
    manager: EntityManager,
  ): Promise<LevelUpGrantResult> {
    const code = targetTier.level_up_voucher_code;
    if (!code) {
      return { granted: false, message: 'no-voucher-configured' };
    }

    const voucherRepo = manager.getRepository(VoucherEntity);
    const claimRepo = manager.getRepository(VoucherClaimEntity);

    const existing = await claimRepo.findOne({
      where: { voucher: { code }, user: { id: user.id } },
    });
    if (existing) {
      return { granted: false, message: 'already-claimed' };
    }

    const voucher = await voucherRepo.findOne({
      where: { code },
      lock: { mode: 'pessimistic_write' },
    });
    if (!voucher) {
      return { granted: false, message: 'voucher-missing' };
    }
    if (voucher.quota <= 0) {
      return { granted: false, message: 'quota-exhausted' };
    }

    const claim = claimRepo.create({ voucher: { code }, user });
    voucher.quota -= 1;

    await claimRepo.save(claim);
    await voucherRepo.save(voucher);

    return { granted: true, voucherCode: code, message: 'granted' };
  }
```

Add the exported type at the bottom of the file (module scope):

```ts
export type LevelUpGrantResult = {
  granted: boolean;
  voucherCode?: string;
  message:
    | 'no-voucher-configured'
    | 'already-claimed'
    | 'voucher-missing'
    | 'quota-exhausted'
    | 'granted';
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test --testPathPattern=libs/loyalty/src/tier/tier.service`
Expected: PASS (all 5 new cases + existing 3).

- [ ] **Step 5: Commit**

```bash
git add libs/loyalty/src/tier/tier.service.ts libs/loyalty/src/tier/tier.service.spec.ts
git commit -m "feat(loyalty): grantLevelUpVoucher in TierService"
```

---

### Task 3: Wire purchase level-up → grant + response field

**Files:**

- Modify: `apps/loyalty-consumer/src/voucher/purchase.controller.ts`
- Test: `apps/loyalty-consumer/src/voucher/purchase.controller.spec.ts`

**Interfaces:**

- Consumes: `TierService.grantLevelUpVoucher(user, tier, manager): Promise<LevelUpGrantResult>` (Task 2); `LevelUpGrantResult` type.
- Produces: purchase response includes `level_up_grant: LevelUpGrantResult | null`.

- [ ] **Step 1: Add the level-up-grant tests**

In `apps/loyalty-consumer/src/voucher/purchase.controller.spec.ts`:

- add `grantLevelUpVoucher: jest.fn(),` to `mockTierService` (near `findHighestTierAtOrBelow`).
- in `beforeEach`, after `mockTierService.findHighestTierAtOrBelow.mockResolvedValue(null);` add:
  ```ts
  mockTierService.grantLevelUpVoucher.mockResolvedValue({
    granted: true,
    voucherCode: 'GOLD2030',
    message: 'granted',
  });
  ```
- add a new test to the `describe('purchase')` block:

```ts
it('grants the tier level-up voucher and returns level_up_grant', async () => {
  mockTierService.findHighestTierAtOrBelow.mockResolvedValue({
    id: 'gold',
    name: 'Gold',
    level_up_voucher_code: 'GOLD2030',
  });
  mockVoucherService.validateAndCalculateDiscount.mockResolvedValue({
    isValid: true,
    discountAmount: 0,
    finalPrice: 1000,
  });

  const result = await controller.purchase(mockReq, {
    product_id: 'prod-id',
    quantity: 1,
  });

  expect(mockPointService.recordTierChange).toHaveBeenCalledWith(
    expect.anything(),
    null,
    expect.objectContaining({ id: 'gold' }),
    TierChangeReason.POINTS_THRESHOLD,
    mockEntityManager,
  );
  expect(mockTierService.grantLevelUpVoucher).toHaveBeenCalled();
  expect(result.level_up_grant).toEqual({
    granted: true,
    voucherCode: 'GOLD2030',
    message: 'granted',
  });
});

it('returns level_up_grant: null when no level-up occurs', async () => {
  const result = await controller.purchase(mockReq, {
    product_id: 'prod-id',
    quantity: 1,
  });
  expect(mockTierService.grantLevelUpVoucher).not.toHaveBeenCalled();
  expect(result.level_up_grant).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test --testPathPattern=purchase.controller.spec.ts`
Expected: FAIL — `result.level_up_grant` is undefined.

- [ ] **Step 3: Implement the wiring**

In `apps/loyalty-consumer/src/voucher/purchase.controller.ts`:

- import the type: `import { LevelUpGrantResult } from '@core/loyalty/tier/tier.service';`
- add `let levelUpGrant: LevelUpGrantResult | null = null;` before the `pointsEarned` block (the `// Points are earned...` comment).
- change the `maybeLevelUp` call site from a bare call to capture its return:
  ```ts
  if (pointsEarned > 0) {
    await this.pointService.earn(
      user,
      pointsEarned,
      'ORDER',
      order.id,
      manager,
    );
    levelUpGrant = await this.maybeLevelUp(user, manager);
  }
  ```
- update the `maybeLevelUp` method to return the grant result and delegate to `grantLevelUpVoucher`:

```ts
  private async maybeLevelUp(
    user: LoyaltyUserEntity,
    manager: EntityManager,
  ): Promise<LevelUpGrantResult | null> {
    const target = await this.tierService.findHighestTierAtOrBelow(
      Number(user.lifetime_points),
      manager,
    );
    if (target && (!user.tier || target.id !== user.tier.id)) {
      const from = user.tier;
      user.tier = target;
      await manager.getRepository(LoyaltyUserEntity).save(user);
      await this.pointService.recordTierChange(
        user,
        from,
        target,
        TierChangeReason.POINTS_THRESHOLD,
        manager,
      );
      return this.tierService.grantLevelUpVoucher(user, target, manager);
    }
    return null;
  }
```

- add `level_up_grant` to the purchase return object:

```ts
return {
  ...order,
  points_earned: pointsEarned,
  tier: tier ? { id: tier.id, name: tier.name } : null,
  level_up_grant: levelUpGrant,
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test --testPathPattern=purchase.controller.spec.ts`
Expected: PASS (new 2 + existing).

- [ ] **Step 5: Build + commit**

Run: `yarn nest build loyalty-consumer`
Expected: build succeeds.

```bash
git add apps/loyalty-consumer/src/voucher/purchase.controller.ts apps/loyalty-consumer/src/voucher/purchase.controller.spec.ts
git commit -m "feat(loyalty): grant level-up voucher on purchase"
```

---

### Task 4: Admin tier-assign endpoint

**Files:**

- Create: `apps/loyalty-admin/src/user-points/dto/assign-tier.dto.ts`
- Modify: `apps/loyalty-admin/src/user-points/user-points.controller.ts`
- Modify: `apps/loyalty-admin/src/user-points/user-points.service.ts`
- Modify: `apps/loyalty-admin/src/user-points/user-points.module.ts` (provider factory: add `TierService`)
- Test: `apps/loyalty-admin/src/user-points/user-points.service.spec.ts`

**Interfaces:**

- Consumes: `TierService.grantLevelUpVoucher` + `LevelUpGrantResult` (Task 2); `PointService.recordTierChange`.
- Produces: `UserPointsService.assignTier(coreUserId, tierId): Promise<LevelUpGrantResult>`; `POST /loyalty-admin/users/:coreUserId/tier` (body `{ tier_id: string }`, requires `manage:points`).

- [ ] **Step 1: Write the failing service tests**

Replace the content of `apps/loyalty-admin/src/user-points/user-points.service.spec.ts`:

```ts
import { UserPointsService } from './user-points.service';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import { TierChangeReason } from '@core/loyalty/point/entities/tier-history.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('UserPointsService', () => {
  describe('adjustPoints', () => {
    const pointServiceMock = { adjust: jest.fn() };
    const userRepoMock = { findOne: jest.fn() };
    const ledgerRepoMock = { findAndCount: jest.fn() };
    const dataSourceMock = {
      transaction: jest.fn(async (cb: any) => cb({})),
      getRepository: jest.fn((entity: any) => {
        const name = entity?.name || '';
        if (name.includes('PointLedger')) return ledgerRepoMock;
        return userRepoMock;
      }),
    } as any;
    const tierServiceMock = { grantLevelUpVoucher: jest.fn() };

    it('adjusts points via PointService', async () => {
      userRepoMock.findOne.mockResolvedValue({
        id: 'u1',
        core_user_id: 'c1',
      });
      pointServiceMock.adjust.mockResolvedValue(150);
      const service = new UserPointsService(
        dataSourceMock,
        pointServiceMock as any,
        tierServiceMock as any,
      );
      const result = await service.adjustPoints('c1', 50, 'compensation');
      expect(pointServiceMock.adjust).toHaveBeenCalled();
      expect(result.balance_points).toBe(150);
    });
  });

  describe('assignTier', () => {
    const userRepoMock = { findOne: jest.fn() };
    const tierRepoMock = { findOne: jest.fn() };
    const userSaveMock = { save: jest.fn((e: any) => Promise.resolve(e)) };
    const pointServiceMock = { recordTierChange: jest.fn() };
    const tierServiceMock = {
      grantLevelUpVoucher: jest.fn().mockReturnValue({
        granted: true,
        voucherCode: 'GOLD2030',
        message: 'granted',
      }),
    };
    let managerMock: any;

    const dataSourceMock = {
      getRepository: jest.fn((entity: any) => {
        if (entity === LoyaltyTierEntity) return tierRepoMock;
        return userRepoMock;
      }),
      transaction: jest.fn(async (cb: any) => cb(managerMock)),
    } as any;

    function makeService() {
      return new UserPointsService(
        dataSourceMock,
        pointServiceMock as any,
        tierServiceMock as any,
      );
    }

    beforeEach(() => {
      jest.clearAllMocks();
      managerMock = {
        getRepository: jest.fn().mockReturnValue(userSaveMock),
      };
    });

    it('throws NotFoundException when the loyalty user does not exist', async () => {
      userRepoMock.findOne.mockResolvedValue(null);
      await expect(makeService().assignTier('c1', 't1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when the tier does not exist', async () => {
      userRepoMock.findOne.mockResolvedValue({ id: 'u1', tier: null });
      tierRepoMock.findOne.mockResolvedValue(null);
      await expect(makeService().assignTier('c1', 't1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when user is already on the tier', async () => {
      userRepoMock.findOne.mockResolvedValue({
        id: 'u1',
        tier: { id: 't1' },
      });
      tierRepoMock.findOne.mockResolvedValue({ id: 't1' });
      await expect(makeService().assignTier('c1', 't1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('assigns tier, records MANUAL change, and grants the voucher', async () => {
      const user = { id: 'u1', tier: { id: 'bronze' } };
      userRepoMock.findOne.mockResolvedValue(user);
      tierRepoMock.findOne.mockResolvedValue({ id: 'gold' });
      tierServiceMock.grantLevelUpVoucher.mockResolvedValue({
        granted: true,
        voucherCode: 'GOLD2030',
        message: 'granted',
      });

      const result = await makeService().assignTier('c1', 'gold');

      expect(pointServiceMock.recordTierChange).toHaveBeenCalledWith(
        user,
        user.tier,
        { id: 'gold' },
        TierChangeReason.MANUAL,
        managerMock,
      );
      expect(tierServiceMock.grantLevelUpVoucher).toHaveBeenCalledWith(
        user,
        { id: 'gold' },
        managerMock,
      );
      expect(result).toEqual({
        granted: true,
        voucherCode: 'GOLD2030',
        message: 'granted',
      });
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test --testPathPattern=user-points.service.spec.ts`
Expected: FAIL — `assignTier is not a function`.

- [ ] **Step 3: Implement the DTO**

Create `apps/loyalty-admin/src/user-points/dto/assign-tier.dto.ts`:

```ts
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignTierDto {
  @IsUUID()
  @IsNotEmpty()
  tier_id: string;
}
```

- [ ] **Step 4: Implement the controller route**

In `apps/loyalty-admin/src/user-points/user-points.controller.ts`:

- import the DTO:
  ```ts
  import { AssignTierDto } from './dto/assign-tier.dto';
  ```
- add a route after `adjust`:

```ts
  @Post(':coreUserId/tier')
  @Permissions('manage:points')
  assignTier(
    @Param('coreUserId') coreUserId: string,
    @Body() dto: AssignTierDto,
  ) {
    return this.userPointsService.assignTier(coreUserId, dto.tier_id);
  }
```

- [ ] **Step 5: Implement the service method**

In `apps/loyalty-admin/src/user-points/user-points.service.ts`:

- update imports:
  ```ts
  import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
  import {
    TierService,
    LevelUpGrantResult,
  } from '@core/loyalty/tier/tier.service';
  import { TierChangeReason } from '@core/loyalty/point/entities/tier-history.entity';
  ```
- add the `TierService` constructor param:
  ```ts
  constructor(
    private dataSource: DataSource,
    private pointService: PointService,
    private tierService: TierService,
  ) {
  ```
- add the method:

```ts
  async assignTier(
    coreUserId: string,
    tierId: string,
  ): Promise<LevelUpGrantResult> {
    const user = await this.userRepository.findOne({
      where: { core_user_id: coreUserId },
      relations: ['tier'],
    });
    if (!user) throw new NotFoundException('User not found');

    const tier = await this.dataSource
      .getRepository(LoyaltyTierEntity)
      .findOne({ where: { id: tierId, is_active: true } });
    if (!tier) throw new NotFoundException('Tier not found');

    if (user.tier && user.tier.id === tier.id) {
      throw new BadRequestException(
        'User is already assigned to this tier',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const from = user.tier;
      user.tier = tier;
      await manager.getRepository(LoyaltyUserEntity).save(user);
      await this.pointService.recordTierChange(
        user,
        from,
        tier,
        TierChangeReason.MANUAL,
        manager,
      );
      return this.tierService.grantLevelUpVoucher(user, tier, manager);
    });
  }
```

(No new `LoyaltyUserEntity` import needed — it is already imported in `user-points.service.ts`.)

- [ ] **Step 6: Wire TierService into the module factory**

In `apps/loyalty-admin/src/user-points/user-points.module.ts`:

- import: `import { TierService } from '@core/loyalty/tier/tier.service';`
- change the factory line:

  ```ts
  useFactory: (dataSource: DataSource) =>
    new UserPointsService(dataSource, new PointService(), new TierService()),
  ```

- [ ] **Step 7: Run tests to verify they pass**

Run: `yarn test --testPathPattern=user-points`
Expected: PASS (adjustPoints + 4 assignTier cases).

- [ ] **Step 8: Build + commit**

Run: `yarn nest build loyalty-admin`
Expected: build succeeds.

```bash
git add apps/loyalty-admin/src/user-points
git commit -m "feat(loyalty-admin): assign tier endpoint with level-up voucher grant"
```

---

### Task 5: CMS — tier form `level_up_voucher_code` field

**Files:**

- Modify: `apps/frontend-cms/src/api/tiers.ts`
- Modify: `apps/frontend-cms/src/components/TierForm.tsx`
- Modify: `apps/frontend-cms/src/pages/TierList.tsx`
- Create: `apps/frontend-cms/src/components/TierForm.spec.tsx`

**Interfaces:**

- Consumes: `TierInput.level_up_voucher_code`, `Tier.level_up_voucher_code` (produced here).
- Produces: `createTier`/`updateTier` payloads include `level_up_voucher_code`.

- [ ] **Step 1: Write the failing component test**

Create `apps/frontend-cms/src/components/TierForm.spec.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TierForm from './TierForm';

describe('TierForm', () => {
  it('submits level_up_voucher_code with the tier', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<TierForm onSubmit={onSubmit} />);

    const field = screen.getByLabelText(
      'Level-Up Voucher Code',
    ) as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'GOLD2030' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.level_up_voucher_code).toBe('GOLD2030');
  });
});
```

> TierForm uses a plain text input for the voucher code (no autocomplete fetch), so no API module needs mocking in this spec.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend-cms && npx vitest run src/components/TierForm.spec.tsx`
Expected: FAIL — label/field not found.

- [ ] **Step 3: Update the CMS tier API types**

In `apps/frontend-cms/src/api/tiers.ts`, add `level_up_voucher_code?: string | null` to the `Tier` interface and `level_up_voucher_code?: string | null` to the `TierInput` interface.

- [ ] **Step 4: Add the field to TierForm**

In `apps/frontend-cms/src/components/TierForm.tsx`:

- add `level_up_voucher_code: initial?.level_up_voucher_code ?? ''` to the `form` state.
- add an `Input` after the "Exclusive Window" field:

```tsx
<Input
  label="Level-Up Voucher Code"
  value={form.level_up_voucher_code ?? ''}
  onChange={(e) => set('level_up_voucher_code', e.target.value)}
  placeholder="e.g. GOLD2030"
  helperText="Auto-granted free voucher when a user reaches this tier."
/>
```

(No autocomplete/datalist needed — a plain text input satisfies the design's "autocomplete/text input"; the implementer may add a `<datalist>` later if desired, but it is out of scope here.)

- [ ] **Step 5: Show the code in TierList**

In `apps/frontend-cms/src/pages/TierList.tsx`, add a new `<TableHead>` "Level-Up Voucher" between "Extra Disc %" and "Active", and a matching `<TableCell>`:

```tsx
<TableCell className="font-mono text-slate-300">
  {t.level_up_voucher_code || '—'}
</TableCell>
```

- [ ] **Step 6: Run tests to verify they pass + type-check**

Run: `cd apps/frontend-cms && npx vitest run src/components/TierForm.spec.tsx && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 7: Commit**

```bash
git add apps/frontend-cms/src/api/tiers.ts apps/frontend-cms/src/components/TierForm.tsx apps/frontend-cms/src/components/TierForm.spec.tsx apps/frontend-cms/src/pages/TierList.tsx
git commit -m "feat(cms): level-up voucher code on tier form"
```

---

### Task 6: CMS — UserDetail assign-tier control

**Files:**

- Create: `apps/frontend-cms/src/api/user-points.ts`
- Modify: `apps/frontend-cms/src/pages/UserDetail.tsx`
- Modify: `apps/frontend-cms/src/pages/UserDetail.spec.tsx`

**Interfaces:**

- Consumes: `getTiers()` from `../api/tiers`; new `assignUserTier(coreUserId, tierId)`.
- Produces: `assignUserTier(coreUserId, tierId): Promise<any>` → `POST /loyalty-admin/users/:coreUserId/tier` returning the grant result.

- [ ] **Step 1: Write the failing component test additions**

In `apps/frontend-cms/src/pages/UserDetail.spec.tsx`, add mocks at top:

```tsx
vi.mock('../api/user-points', () => ({ assignUserTier: vi.fn() }));
vi.mock('../api/tiers', () => ({ getTiers: vi.fn() }));
```

Add imports: `import { assignUserTier } from '../api/user-points'; import { getTiers } from '../api/tiers';`

Add a test to the describe block:

```tsx
it('assigns a tier and shows the grant email-style feedback', async () => {
  (getTiers as any).mockResolvedValue([
    { id: 'gold', name: 'Gold' },
    { id: 'bronze', name: 'Bronze' },
  ]);
  (assignUserTier as any).mockResolvedValue({
    granted: true,
    voucherCode: 'GOLD2030',
    message: 'granted',
  });

  renderWithRouter(<UserDetail />);

  const select = await screen.findByLabelText('Assign Tier');
  fireEvent.change(select, { target: { value: 'gold' } });
  fireEvent.click(screen.getByRole('button', { name: /assign tier/i }));

  expect(await screen.findByText(/GOLD2030/)).toBeTruthy();
  expect(assignUserTier).toHaveBeenCalledWith('test-uuid-123', 'gold');
});
```

Adjust the existing `mockUser` fixtures so `getUserById` resolves (the fixtures already do). Note the existing spec must keep `vi.mock('../api/users', ...)`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/frontend-cms && npx vitest run src/pages/UserDetail.spec.tsx`
Expected: FAIL — assign control not found.

- [ ] **Step 3: Create the API helper**

Create `apps/frontend-cms/src/api/user-points.ts`:

```ts
import { useAuthStore } from '../store/auth.store';

export const assignUserTier = async (
  coreUserId: string,
  tierId: string,
): Promise<any> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(
    `${baseUrl}/loyalty-admin/users/${coreUserId}/tier`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-tenant-override': tenant,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tier_id: tierId }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to assign tier');
  }

  return response.json();
};
```

- [ ] **Step 4: Add the assign-tier control to UserDetail**

In `apps/frontend-cms/src/pages/UserDetail.tsx`:

- imports: `import { getTiers, Tier } from '../api/tiers';` and `import { assignUserTier } from '../api/user-points';`
- state:
  ```ts
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [selectedTierId, setSelectedTierId] = useState('');
  const [assignStatus, setAssignStatus] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  ```
- load tiers on mount (add to the existing `useEffect` on `[id]` or a new effect):
  ```ts
  useEffect(() => {
    getTiers()
      .then(setTiers)
      .catch(() => setTiers([]));
  }, []);
  ```
- handler:
  ```ts
  const handleAssignTier = async () => {
    if (!id || !selectedTierId) return;
    setAssignError(null);
    setAssignStatus(null);
    try {
      const result = await assignUserTier(id, selectedTierId);
      const selected = tiers.find((t) => t.id === selectedTierId);
      setAssignStatus(
        result.granted
          ? `Assigned ${selected?.name}. Grants free voucher ${result.voucherCode}!`
          : `Assigned ${selected?.name}. No grant: ${result.message}.`,
      );
    } catch (err: any) {
      setAssignError(err.message || 'Failed to assign tier');
    }
  };
  ```
- render a control card (insert inside the grid, e.g. after the Profile details card):

```tsx
<Card className="border-slate-700/50">
  <CardHeader>
    <CardTitle className="text-xl flex items-center gap-2">
      <UserCog className="w-5 h-5 text-primary-400" />
      Loyalty Tier
    </CardTitle>
    <CardDescription>
      Assign a loyalty tier and auto-grant its level-up voucher.
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1 space-y-1.5">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">
          Assign Tier
        </span>
        <select
          className="w-full py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white px-4 focus:ring-2 focus:ring-primary-500"
          value={selectedTierId}
          onChange={(e) => setSelectedTierId(e.target.value)}
        >
          <option value="">Select tier...</option>
          {tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <Button
        variant="primary"
        size="sm"
        onClick={handleAssignTier}
        disabled={!selectedTierId}
        className="sm:w-40"
      >
        Assign Tier
      </Button>
    </div>
    {assignStatus && (
      <p className="text-sm font-semibold text-primary-300">{assignStatus}</p>
    )}
    {assignError && (
      <p className="text-sm font-semibold text-red-400">{assignError}</p>
    )}
  </CardContent>
</Card>
```

- [ ] **Step 5: Run tests to verify they pass + type-check + full CMS suite**

Run:
`cd apps/frontend-cms && npx vitest run src/pages/UserDetail.spec.tsx && npx tsc --noEmit`
Expected: PASS for UserDetail.

Then full suite:
`cd apps/frontend-cms && npx vitest run`
Expected: only the 3 known pre-existing failures (Login, VoucherBindingList, VoucherValidityList); no new failures. (If any new failure appears, fix it.)

- [ ] **Step 6: Commit**

```bash
git add apps/frontend-cms/src/api/user-points.ts apps/frontend-cms/src/pages/UserDetail.tsx apps/frontend-cms/src/pages/UserDetail.spec.tsx
git commit -m "feat(cms): assign loyalty tier from user detail"
```

---

### Task 7: Consumer — checkout level-up grant toast

**Files:**

- Modify: `apps/frontend-consumer/src/pages/CheckoutView.tsx`
- Modify: `apps/frontend-consumer/src/pages/CheckoutView.spec.tsx`

**Interfaces:**

- Consumes: purchase response `level_up_grant: { granted, voucher_code, message } | null` + `tier: { name }` (Task 3).

- [ ] **Step 1: Write the failing test**

In `apps/frontend-consumer/src/pages/CheckoutView.spec.tsx`, add a test (reuse the existing describe block's `beforeEach` fixtures; `executePurchase` is already mocked):

```tsx
it('shows a level-up grant message when the purchase grants a free voucher', async () => {
  (purchaseApi.executePurchase as any).mockResolvedValue({
    success: true,
    tier: { id: 'gold', name: 'Gold' },
    level_up_grant: {
      granted: true,
      voucherCode: 'GOLD2030',
      message: 'granted',
    },
  });

  render(
    <MemoryRouter initialEntries={['/checkout/prod-123']}>
      <CheckoutView />
    </MemoryRouter>,
  );

  const purchaseButton = await screen.findByText('Complete Purchase');
  fireEvent.click(purchaseButton);

  expect(
    await screen.findByText(
      /You reached Gold tier! Here's your free voucher: GOLD2030/,
    ),
  ).toBeTruthy();
});
```

Wrap with the same `MemoryRouter`-based render used by the existing tests (match the existing test's render helper exactly — the existing `beforeEach` already provides `getProductById`, `getPointsProfile`, etc.; adjust to that file's render pattern).

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend-consumer && npx vitest run src/pages/CheckoutView.spec.tsx`
Expected: at least the new test FAILS (message missing), others pass.

- [ ] **Step 3: Implement the toast in CheckoutView**

In `apps/frontend-consumer/src/pages/CheckoutView.tsx`, update `handlePurchase` to capture the response and append the grant message:

```tsx
const handlePurchase = async () => {
  if (!product) return;

  try {
    setTxnStatus('processing');
    const result = await executePurchase({
      product_id: product.id,
      quantity,
      voucher_code: voucherCode || undefined,
      points_to_use: pointsToUse > 0 ? pointsToUse : undefined,
    });
    setTxnStatus('success');
    let message = `You've successfully purchased ${quantity}x ${product.name}!`;
    if (result?.level_up_grant?.granted) {
      const tierName = result.tier?.name ?? 'new';
      message += ` You reached ${tierName} tier! Here's your free voucher: ${result.level_up_grant.voucherCode}`;
    }
    setTxnMessage(message);
  } catch (err: any) {
    setTxnStatus('error');
    setTxnMessage(
      err.message ||
        'Transaction failed. Please check your balance or voucher validity.',
    );
  }
};
```

- [ ] **Step 4: Run test to verify it passes + full consumer suite**

Run:
`cd apps/frontend-consumer && npx vitest run src/pages/CheckoutView.spec.tsx`
Expected: PASS.

Full suite:
`cd apps/frontend-consumer && npx vitest run && npx tsc --noEmit`
Expected: PASS + clean types.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend-consumer/src/pages/CheckoutView.tsx apps/frontend-consumer/src/pages/CheckoutView.spec.tsx
git commit -m "feat(consumer): level-up voucher grant message in checkout"
```

---

## Final verification (after Task 7)

1. Run the full backend suite: `yarn test`
2. Run backend builds: `yarn nest build loyalty-admin && yarn nest build loyalty-consumer`
3. Run CMS: `cd apps/frontend-cms && npx vitest run`
4. Run consumer: `cd apps/frontend-consumer && npx vitest run`
5. Lint from repo root: `yarn lint`
6. Update knowledge graph: `graphify update .`

Report any failures; fix before considering the plan complete.
