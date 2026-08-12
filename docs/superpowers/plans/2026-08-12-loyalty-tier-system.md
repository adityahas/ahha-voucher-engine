# Loyalty Tier System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a loyalty tier system — points earned per purchase (final price × tier multiplier), automatic real-time level-up, tier-benefit discounts stackable with vouchers under a combined cap, tier-targeted vouchers, and point-priced rewards with an exclusive claim window — across backend (`loyalty-admin`, `loyalty-consumer`) and both frontends.

**Architecture:** Follows existing patterns exactly: entities in `libs/loyalty`, per-request `DataSource` injected via `'LOYALTY_CONNECTION'` (admin) / `'LOYALTY_CONSUMER_CONNECTION'` (consumer), services constructed with `new Service(dataSource)` in request-scoped providers, `AdminJwtGuard + AclGuard` for admin endpoints, `ConsumerJwtGuard` for consumer endpoints. Points/level-up logic runs inside the existing purchase transaction; reward claim reuses the strategy pattern. Tenant config (`point_base_rate`, `max_combined_discount_percent`) lives in the existing master-DB `client_settings` table.

**Tech Stack:** NestJS 11, TypeORM 0.3, TypeScript 5, PostgreSQL, class-validator, React 18 + Vite + Tailwind, Vitest + React Testing Library, Jest.

## Global Constraints

- All money/points columns: `decimal(12,2)` — never float.
- `user_id` always derived from JWT; never from request body.
- Multi-tenant: always use per-request `DataSource`; never global repositories for tenant entities.
- Entities extend `BaseEntity` (soft delete); snake_case via `SnakeNamingStrategy`.
- New admin permissions must be added to `AclService` `Role.ADMIN` list: `manage:tiers`, `manage:points`.
- Point math: `points = (final_price / point_base_rate) * tier_multiplier`, decimal, never rounded.
- Combined discount (tier + voucher) capped at `max_combined_discount_percent` (default 50).
- Tier snapshot read at transaction start; level-up applies from the NEXT transaction.
- Ledger is append-only; ROLLBACK is a new ledger event, never an update.
- Tests: backend `*.spec.ts` (Jest, `yarn test`), frontend `*.spec.tsx` (Vitest in app dir).
- Run from repo root unless a task says otherwise. Node binaries at `/opt/homebrew/bin` (export PATH if needed).

---

## File Structure (map)

### Backend — new files

| File                                                                | Responsibility                                                                                  |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `libs/loyalty/src/tier/entities/loyalty-tier.entity.ts`             | Tier definition (name, level, min_points, multiplier, extra discount, active, exclusive window) |
| `libs/loyalty/src/tier/entities/tier-category-override.entity.ts`   | Per-tier × category multiplier override                                                         |
| `libs/loyalty/src/point/entities/point-ledger.entity.ts`            | Append-only point events                                                                        |
| `libs/loyalty/src/point/entities/tier-history.entity.ts`            | Tier change history                                                                             |
| `libs/loyalty/src/tier/tier.service.ts`                             | Tier domain logic (multiplier resolution, threshold lookup) — shared by admin/consumer          |
| `libs/loyalty/src/point/point.service.ts`                           | Point math (earn, spend, rollback, adjust, ledger writes, tier history) — shared                |
| `libs/loyalty/src/tier/index.ts`, `libs/loyalty/src/point/index.ts` | Barrel exports                                                                                  |
| `apps/loyalty-admin/src/tier/dto/create-tier.dto.ts`                | Create tier DTO (incl. category overrides)                                                      |
| `apps/loyalty-admin/src/tier/dto/update-tier.dto.ts`                | Update tier DTO                                                                                 |
| `apps/loyalty-admin/src/tier/tier-admin.service.ts`                 | Admin tier CRUD service                                                                         |
| `apps/loyalty-admin/src/tier/tier.controller.ts`                    | Admin tier CRUD controller                                                                      |
| `apps/loyalty-admin/src/user-points/dto/adjust-points.dto.ts`       | Manual adjustment DTO                                                                           |
| `apps/loyalty-admin/src/user-points/user-points.service.ts`         | Admin: view user points/history, adjust points                                                  |
| `apps/loyalty-admin/src/user-points/user-points.controller.ts`      | Admin points controller                                                                         |
| `apps/loyalty-admin/src/user-points/user-points.module.ts`          | Admin points module                                                                             |
| `apps/loyalty-consumer/src/points/points.service.ts`                | Consumer profile + point history                                                                |
| `apps/loyalty-consumer/src/points/points.controller.ts`             | Consumer points controller                                                                      |
| `apps/loyalty-consumer/src/points/points.module.ts`                 | Consumer points module                                                                          |
| `apps/loyalty-consumer/src/voucher/discount-points.util.ts`         | Pure functions: tier discount + cap + points calc                                               |

### Backend — modified files

| File                                                                                            | Change                                                                          |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `libs/loyalty/src/entities/loyalty-user.entity.ts`                                              | Add `tier`, `lifetime_points`, `balance_points`                                 |
| `libs/loyalty/src/reward-item/entities/reward-item.entity.ts`                                   | Add `point_price`, `min_tier`, `exclusive_days`                                 |
| `libs/database/src/entities/client-settings.entity.ts`                                          | Add `point_base_rate`, `max_combined_discount_percent` columns                  |
| `libs/database/src/client-settings/client-settings.types.ts`                                    | Add `LoyaltySettings` + defaults                                                |
| `libs/database/src/client-settings/client-settings.service.ts`                                  | Getter/setter for loyalty settings                                              |
| `libs/auth/src/acl.service.ts`                                                                  | Add `manage:tiers`, `manage:points` to ADMIN                                    |
| `libs/loyalty/src/index.ts`                                                                     | Export tier/point modules + entities                                            |
| `apps/loyalty-admin/src/loyalty-admin.module.ts`                                                | Register TierModule, UserPointsModule                                           |
| `apps/loyalty-admin/src/reward-item/dto/create-reward-item.dto.ts`, `update-reward-item.dto.ts` | Add `point_price`, `min_tier_id`, `exclusive_days`                              |
| `apps/loyalty-admin/src/reward-item/reward-item.service.ts`                                     | Resolve `min_tier` relation on create/update                                    |
| `apps/loyalty-admin/src/reward-item/reward-item.module.ts`                                      | Request-scoped provider with DataSource                                         |
| `apps/loyalty-admin/src/tier/tier.module.ts`                                                    | Replace empty stub                                                              |
| `apps/loyalty-consumer/src/loyalty-consumer.module.ts`                                          | Register PointsModule; ensure `ClientSettingsService` provider                  |
| `apps/loyalty-consumer/src/voucher/voucher.service.ts`                                          | Tier binding validation in `validateAndCalculateDiscount`; add `userRepository` |
| `apps/loyalty-consumer/src/voucher/purchase.controller.ts`                                      | Tier discount + combined cap + point earn + level-up                            |
| `apps/loyalty-consumer/src/reward/reward.service.ts`                                            | Point price check, min_tier, exclusive window, spend + ledger                   |
| `apps/loyalty-consumer/src/reward/reward.module.ts`                                             | Provide `PointService`, request-scoped `REWARD_SERVICE`                         |

### Frontend — new files

| File                                                                               | Responsibility                           |
| ---------------------------------------------------------------------------------- | ---------------------------------------- |
| `apps/frontend-cms/src/api/tiers.ts`                                               | Tier CRUD API wrapper                    |
| `apps/frontend-cms/src/pages/TierList.tsx`                                         | Tier list page                           |
| `apps/frontend-cms/src/pages/TierCreate.tsx`                                       | Tier create page                         |
| `apps/frontend-cms/src/pages/TierEdit.tsx`                                         | Tier edit page                           |
| `apps/frontend-cms/src/components/TierForm.tsx`                                    | Shared tier form                         |
| `apps/frontend-cms/src/api/rewards.ts`                                             | Reward CRUD wrapper w/ point fields      |
| `apps/frontend-cms/src/pages/RewardList.tsx`, `RewardCreate.tsx`, `RewardEdit.tsx` | Reward admin pages                       |
| `apps/frontend-consumer/src/api/points.ts`                                         | Profile + point history wrapper          |
| `apps/frontend-consumer/src/api/rewards.ts`                                        | Reward list/claim wrapper w/ point price |
| `apps/frontend-consumer/src/pages/PointsHistoryView.tsx`                           | Point history page                       |
| `apps/frontend-consumer/src/components/LoyaltyBadge.tsx`                           | Tier badge + progress                    |

### Frontend — modified files

| File                                                               | Change                           |
| ------------------------------------------------------------------ | -------------------------------- |
| `apps/frontend-cms/src/router/index.tsx`                           | Add tier + reward routes         |
| `apps/frontend-cms/src/api/vouchers.ts`                            | `bind_type` union add `'tier'`   |
| `apps/frontend-cms/src/pages/VoucherCreate.tsx`, `VoucherEdit.tsx` | Tier dropdown for `tier` binding |
| `apps/frontend-consumer/src/router.tsx` or `App.tsx`               | Add points history route         |

---

## Task 1: Domain entities (tier, override, ledger, history)

**Files:**

- Create: `libs/loyalty/src/tier/entities/loyalty-tier.entity.ts`
- Create: `libs/loyalty/src/tier/entities/tier-category-override.entity.ts`
- Create: `libs/loyalty/src/point/entities/point-ledger.entity.ts`
- Create: `libs/loyalty/src/point/entities/tier-history.entity.ts`
- Create: `libs/loyalty/src/tier/index.ts`
- Create: `libs/loyalty/src/point/index.ts`
- Modify: `libs/loyalty/src/entities/loyalty-user.entity.ts`
- Modify: `libs/loyalty/src/reward-item/entities/reward-item.entity.ts`
- Modify: `libs/loyalty/src/index.ts`

**Interfaces:**

- Consumes: `BaseEntity` from `@core/base/entities/base.entity`, `VoucherCategoryEntity` from `@core/loyalty/voucher/entities/voucher-category.entity`.
- Produces (used by later tasks):
  - `LoyaltyTierEntity` — fields: `id: string`, `name: string`, `level: number`, `min_points: number`, `point_multiplier: number`, `extra_discount_percent: number`, `is_active: boolean`, `exclusive_window_hours: number`, `category_overrides: TierCategoryOverrideEntity[]`
  - `TierCategoryOverrideEntity` — fields: `id: string`, `tier`, `category`, `point_multiplier: number`
  - `PointLedgerEntity` — fields: `id`, `user`, `event_type: 'EARN'|'SPEND'|'ROLLBACK'|'ADJUSTMENT'`, `amount`, `balance_after`, `reference_type`, `reference_id`, `occurred_at`
  - `TierHistoryEntity` — fields: `id`, `user`, `from_tier`, `to_tier`, `reason: 'POINTS_THRESHOLD'|'MANUAL'`, `changed_at`

- [ ] **Step 1: Write the failing test for loyalty-user entity changes**

Create `libs/loyalty/src/entities/loyalty-user.entity.spec.ts`:

```typescript
import { LoyaltyUserEntity } from './loyalty-user.entity';

describe('LoyaltyUserEntity', () => {
  it('defines points and tier snapshot columns', () => {
    const user = new LoyaltyUserEntity();
    user.core_user_id = 'c0b1e5a0-0000-4000-8000-000000000001';
    user.lifetime_points = 120.5;
    user.balance_points = 50;
    expect(user.lifetime_points).toBe(120.5);
    expect(user.balance_points).toBe(50);
    expect(user.tier).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test --testPathPattern="loyalty-user.entity" 2>&1 | tail -5`
Expected: FAIL — `Property 'lifetime_points' does not exist`.

- [ ] **Step 3: Modify the loyalty-user entity**

`libs/loyalty/src/entities/loyalty-user.entity.ts` — replace entire file:

```typescript
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LoyaltyTierEntity } from '../tier/entities/loyalty-tier.entity';

@Entity('loyalty_users')
export class LoyaltyUserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  core_user_id: string;

  @ManyToOne(() => LoyaltyTierEntity, { nullable: true })
  @JoinColumn({ name: 'tier_id' })
  tier: LoyaltyTierEntity | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  lifetime_points: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance_points: number;
}
```

- [ ] **Step 4: Create the tier entity**

`libs/loyalty/src/tier/entities/loyalty-tier.entity.ts`:

```typescript
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { TierCategoryOverrideEntity } from './tier-category-override.entity';

@Entity('loyalty_tiers')
export class LoyaltyTierEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'int' })
  level: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  min_points: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 1 })
  point_multiplier: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  extra_discount_percent: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  exclusive_window_hours: number;

  @OneToMany(() => TierCategoryOverrideEntity, (o) => o.tier, {
    cascade: true,
  })
  category_overrides: TierCategoryOverrideEntity[];
}
```

- [ ] **Step 5: Create the category override entity**

`libs/loyalty/src/tier/entities/tier-category-override.entity.ts`:

```typescript
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { LoyaltyTierEntity } from './loyalty-tier.entity';
import { VoucherCategoryEntity } from '@core/loyalty/voucher/entities/voucher-category.entity';

@Entity('loyalty_tier_category_overrides')
export class TierCategoryOverrideEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoyaltyTierEntity, (tier) => tier.category_overrides)
  @JoinColumn({ name: 'tier_id' })
  tier: LoyaltyTierEntity;

  @ManyToOne(() => VoucherCategoryEntity)
  @JoinColumn({ name: 'category_slug', referencedColumnName: 'slug' })
  category: VoucherCategoryEntity;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 1 })
  point_multiplier: number;
}
```

- [ ] **Step 6: Create the point ledger entity**

`libs/loyalty/src/point/entities/point-ledger.entity.ts`:

```typescript
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { LoyaltyUserEntity } from '../../entities/loyalty-user.entity';

export enum PointEventType {
  EARN = 'EARN',
  SPEND = 'SPEND',
  ROLLBACK = 'ROLLBACK',
  ADJUSTMENT = 'ADJUSTMENT',
}

@Entity('point_ledger')
export class PointLedgerEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoyaltyUserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: LoyaltyUserEntity;

  @Column({ type: 'varchar' })
  event_type: PointEventType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balance_after: number;

  @Column({ type: 'varchar', nullable: true })
  reference_type: string;

  @Column({ type: 'varchar', nullable: true })
  reference_id: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  occurred_at: Date;
}
```

- [ ] **Step 7: Create the tier history entity**

`libs/loyalty/src/point/entities/tier-history.entity.ts`:

```typescript
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { LoyaltyUserEntity } from '../../entities/loyalty-user.entity';
import { LoyaltyTierEntity } from '../../tier/entities/loyalty-tier.entity';

export enum TierChangeReason {
  POINTS_THRESHOLD = 'POINTS_THRESHOLD',
  MANUAL = 'MANUAL',
}

@Entity('tier_history')
export class TierHistoryEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoyaltyUserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: LoyaltyUserEntity;

  @ManyToOne(() => LoyaltyTierEntity, { nullable: true })
  @JoinColumn({ name: 'from_tier_id' })
  from_tier: LoyaltyTierEntity | null;

  @ManyToOne(() => LoyaltyTierEntity, { nullable: false })
  @JoinColumn({ name: 'to_tier_id' })
  to_tier: LoyaltyTierEntity;

  @Column({ type: 'varchar' })
  reason: TierChangeReason;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  changed_at: Date;
}
```

- [ ] **Step 8: Create barrel files**

`libs/loyalty/src/tier/index.ts`:

```typescript
export * from './entities/loyalty-tier.entity';
export * from './entities/tier-category-override.entity';
export * from './tier.service';
```

`libs/loyalty/src/point/index.ts`:

```typescript
export * from './entities/point-ledger.entity';
export * from './entities/tier-history.entity';
export * from './point.service';
```

- [ ] **Step 9: Modify reward item entity**

`libs/loyalty/src/reward-item/entities/reward-item.entity.ts` — replace entire file:

```typescript
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RewardItemSourceEntity } from '@core/loyalty/reward-item-source/entities/reward-item-source.entity';
import { LoyaltyTierEntity } from '../../tier/entities/loyalty-tier.entity';
import { BaseEntity } from '@core/base/entities/base.entity';

@Entity('reward_items')
export class RewardItemEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  source_id: string;

  @ManyToOne(() => RewardItemSourceEntity)
  @JoinColumn({ name: 'source_id' })
  source: RewardItemSourceEntity;

  @Column()
  type: string; // e.g. 'gopay', 'pulsa', etc.

  @Column({ default: -1 }) // -1 unlimited, 0 out, >0 limited
  stock: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  point_price: number;

  @ManyToOne(() => LoyaltyTierEntity, { nullable: true })
  @JoinColumn({ name: 'min_tier_id' })
  min_tier: LoyaltyTierEntity | null;

  @Column({ type: 'int', default: 0 })
  exclusive_days: number;
}
```

- [ ] **Step 10: Export new modules from lib barrel**

`libs/loyalty/src/index.ts` — replace entire file:

```typescript
export * from './loyalty.module';
export * from './loyalty.service';
export * from './tier';
export * from './point';
export * from './entities/loyalty-user.entity';
export * from './reward-item/entities/reward-item.entity';
export * from './reward-item-source/entities/reward-item-source.entity';
export * from './quest/entities/quest.entity';
export * from './voucher/entities/voucher.entity';
export * from './voucher/entities/voucher-claim.entity';
export * from './voucher/entities/voucher-usage.entity';
export * from './voucher/entities/voucher-validity.entity';
export * from './voucher/entities/voucher-binding.entity';
export * from './voucher/entities/voucher-category.entity';
```

- [ ] **Step 11: Run test to verify it passes**

Run: `yarn test --testPathPattern="loyalty-user.entity" 2>&1 | tail -5`
Expected: PASS.

- [ ] **Step 12: Type-check the lib**

Run: `yarn tsc --noEmit -p tsconfig.json 2>&1 | grep -E "tier|point|loyalty" | head -10`
Expected: no errors referencing new files.

- [ ] **Step 13: Commit**

```bash
git add libs/loyalty
git commit -m "feat(loyalty): add tier, point ledger, and tier history entities"
```

---

## Task 2: Tenant settings for loyalty config

**Files:**

- Modify: `libs/database/src/entities/client-settings.entity.ts`
- Modify: `libs/database/src/client-settings/client-settings.types.ts`
- Modify: `libs/database/src/client-settings/client-settings.service.ts`

**Interfaces:**

- Consumes: existing `ClientSettingsEntity`, `CurrencySettings` types.
- Produces:
  - `LoyaltySettings` interface: `{ point_base_rate: number; max_combined_discount_percent: number }`
  - `DEFAULT_LOYALTY_SETTINGS`: `{ point_base_rate: 1000, max_combined_discount_percent: 50 }`
  - `getLoyaltySettings(databaseName: string): Promise<LoyaltySettings>` on `ClientSettingsService`
  - `updateLoyaltySettings(databaseName: string, input: Partial<LoyaltySettings>): Promise<LoyaltySettings>`

- [ ] **Step 1: Write the failing test**

`libs/database/src/client-settings/client-settings.service.spec.ts` — read the existing file first; append this describe block:

```typescript
import { ClientSettingsService } from './client-settings.service';
import { DEFAULT_LOYALTY_SETTINGS } from './client-settings.types';

describe('ClientSettingsService loyalty settings', () => {
  let service: ClientSettingsService;
  const repoMock = {
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    create: jest.fn((d) => d),
  };

  beforeEach(() => {
    service = new ClientSettingsService(repoMock as any);
  });

  it('returns defaults when no row exists', async () => {
    const result = await service.getLoyaltySettings('client1_db');
    expect(result.point_base_rate).toBe(
      DEFAULT_LOYALTY_SETTINGS.point_base_rate,
    );
    expect(result.max_combined_discount_percent).toBe(
      DEFAULT_LOYALTY_SETTINGS.max_combined_discount_percent,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test --testPathPattern="client-settings.service" 2>&1 | tail -5`
Expected: FAIL — `getLoyaltySettings is not a function`.

- [ ] **Step 3: Add columns to the settings entity**

`libs/database/src/entities/client-settings.entity.ts` — add inside the class (after `number_format_options`):

```typescript
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 1000 })
  point_base_rate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 50 })
  max_combined_discount_percent: number;
```

- [ ] **Step 4: Add loyalty settings types**

`libs/database/src/client-settings/client-settings.types.ts` — append:

```typescript
export interface LoyaltySettings {
  point_base_rate: number;
  max_combined_discount_percent: number;
}

export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  point_base_rate: 1000,
  max_combined_discount_percent: 50,
};
```

- [ ] **Step 5: Add service methods**

`libs/database/src/client-settings/client-settings.service.ts` — update the import to add `LoyaltySettings, DEFAULT_LOYALTY_SETTINGS`, and append inside the class:

```typescript
  async getLoyaltySettings(databaseName: string): Promise<LoyaltySettings> {
    const row = await this.repository.findOne({
      where: { client_database_name: databaseName },
    });
    if (!row) return { ...DEFAULT_LOYALTY_SETTINGS };
    return {
      point_base_rate:
        Number(row.point_base_rate) ?? DEFAULT_LOYALTY_SETTINGS.point_base_rate,
      max_combined_discount_percent:
        Number(row.max_combined_discount_percent) ??
        DEFAULT_LOYALTY_SETTINGS.max_combined_discount_percent,
    };
  }

  async updateLoyaltySettings(
    databaseName: string,
    input: Partial<LoyaltySettings>,
  ): Promise<LoyaltySettings> {
    let row = await this.repository.findOne({
      where: { client_database_name: databaseName },
    });
    if (!row) {
      row = this.repository.create({ client_database_name: databaseName });
    }
    if (input.point_base_rate !== undefined) {
      row.point_base_rate = input.point_base_rate;
    }
    if (input.max_combined_discount_percent !== undefined) {
      row.max_combined_discount_percent = input.max_combined_discount_percent;
    }
    await this.repository.save(row);
    return this.getLoyaltySettings(databaseName);
  }
```

- [ ] **Step 6: Run test to verify it passes**

Run: `yarn test --testPathPattern="client-settings.service" 2>&1 | tail -5`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add libs/database
git commit -m "feat(database): add loyalty settings to client settings"
```

---

## Task 3: Shared tier/point domain services

**Files:**

- Create: `libs/loyalty/src/tier/tier.service.ts`
- Create: `libs/loyalty/src/point/point.service.ts`

**Interfaces:**

- Consumes: `LoyaltyTierEntity`, `TierCategoryOverrideEntity`, `PointLedgerEntity`, `TierHistoryEntity`, `LoyaltyUserEntity`.
- Produces:
  - `TierService.getMultiplierFor(tier, categoryNames: string[], manager): Promise<number>`
  - `TierService.findHighestTierAtOrBelow(lifetimePoints: number, manager): Promise<LoyaltyTierEntity | null>`
  - `TierService.findLowestActiveTier(manager): Promise<LoyaltyTierEntity | null>`
  - `PointService.earn(user, amount, referenceType, referenceId, manager): Promise<number>` (returns new balance)
  - `PointService.spend(user, amount, referenceType, referenceId, manager): Promise<number>` (throws `BadRequestException('Insufficient points')` if balance < amount)
  - `PointService.rollback(user, amount, referenceType, referenceId, manager): Promise<number>`
  - `PointService.adjust(user, delta, referenceId, manager): Promise<number>` (throws if resulting balance < 0)
  - `PointService.recordTierChange(user, fromTier, toTier, reason, manager): Promise<void>`

- [ ] **Step 1: Write failing tests**

`libs/loyalty/src/tier/tier.service.spec.ts`:

```typescript
import { TierService } from './tier.service';
import { LoyaltyTierEntity } from './entities/loyalty-tier.entity';
import { TierCategoryOverrideEntity } from './entities/tier-category-override.entity';

describe('TierService', () => {
  const tier = new LoyaltyTierEntity();
  tier.id = 't1';
  tier.name = 'Gold';
  tier.level = 3;
  tier.min_points = 50000;
  tier.point_multiplier = 2;

  const managerMock = {
    getRepository: jest.fn().mockReturnValue({}),
  } as any;

  it('returns tier multiplier when no category override matches', async () => {
    managerMock.getRepository.mockReturnValue({
      find: jest.fn().mockResolvedValue([]),
    });
    const service = new TierService();
    const result = await service.getMultiplierFor(tier, ['Food'], managerMock);
    expect(result).toBe(2);
  });

  it('returns category override multiplier when a category matches', async () => {
    const override = new TierCategoryOverrideEntity();
    override.category = { slug: 'food' } as any;
    override.point_multiplier = 3;
    managerMock.getRepository.mockReturnValue({
      find: jest.fn().mockResolvedValue([override]),
    });
    const service = new TierService();
    const result = await service.getMultiplierFor(
      tier,
      ['Food', 'Drinks'],
      managerMock,
    );
    expect(result).toBe(3);
  });

  it('finds highest active tier at or below lifetime points', async () => {
    const bronze = new LoyaltyTierEntity();
    bronze.id = 'b';
    bronze.level = 1;
    bronze.min_points = 0;
    bronze.is_active = true;
    const silver = new LoyaltyTierEntity();
    silver.id = 's';
    silver.level = 2;
    silver.min_points = 10000;
    silver.is_active = true;
    const gold = new LoyaltyTierEntity();
    gold.id = 'g';
    gold.level = 3;
    gold.min_points = 50000;
    gold.is_active = true;

    managerMock.getRepository.mockReturnValue({
      find: jest.fn().mockResolvedValue([bronze, silver, gold]),
    });
    const service = new TierService();
    const result = await service.findHighestTierAtOrBelow(15000, managerMock);
    expect(result?.id).toBe('s');
  });
});
```

`libs/loyalty/src/point/point.service.spec.ts`:

```typescript
import { PointService } from './point.service';
import { LoyaltyUserEntity } from '../entities/loyalty-user.entity';
import {
  PointLedgerEntity,
  PointEventType,
} from './entities/point-ledger.entity';
import {
  TierHistoryEntity,
  TierChangeReason,
} from './entities/tier-history.entity';
import { LoyaltyTierEntity } from '../tier/entities/loyalty-tier.entity';

describe('PointService', () => {
  let user: LoyaltyUserEntity;
  let ledgerSaves: any[];
  const managerMock = {
    getRepository: jest.fn(),
  } as any;

  beforeEach(() => {
    user = new LoyaltyUserEntity();
    user.id = 'u1';
    user.lifetime_points = 0;
    user.balance_points = 0;
    ledgerSaves = [];
    managerMock.getRepository.mockImplementation((entity: any) => ({
      create: (data: any) => Object.assign(new entity(), data),
      save: async (e: any) => {
        ledgerSaves.push(e);
        return e;
      },
    }));
  });

  it('earn adds to lifetime and balance and writes EARN ledger', async () => {
    const service = new PointService();
    const balance = await service.earn(
      user,
      150,
      'ORDER',
      'ord-1',
      managerMock,
    );
    expect(user.lifetime_points).toBe(150);
    expect(user.balance_points).toBe(150);
    expect(balance).toBe(150);
    expect(ledgerSaves[0].event_type).toBe(PointEventType.EARN);
    expect(ledgerSaves[0].balance_after).toBe(150);
    expect(ledgerSaves[0].reference_id).toBe('ord-1');
  });

  it('spend throws when balance is insufficient', async () => {
    const service = new PointService();
    await expect(
      service.spend(user, 10, 'REWARD_CLAIM', 'rw-1', managerMock),
    ).rejects.toThrow('Insufficient points');
  });

  it('spend deducts balance and writes SPEND ledger', async () => {
    user.lifetime_points = 150;
    user.balance_points = 150;
    const service = new PointService();
    const balance = await service.spend(
      user,
      50,
      'REWARD_CLAIM',
      'rw-1',
      managerMock,
    );
    expect(user.balance_points).toBe(100);
    expect(balance).toBe(100);
    expect(ledgerSaves[0].event_type).toBe(PointEventType.SPEND);
  });

  it('adjust rejects negative balance', async () => {
    const service = new PointService();
    await expect(
      service.adjust(user, -50, 'MANUAL', managerMock),
    ).rejects.toThrow('Insufficient points');
  });

  it('recordTierChange writes tier history', async () => {
    const to = new LoyaltyTierEntity();
    to.id = 'silver';
    const service = new PointService();
    await service.recordTierChange(
      user,
      null,
      to,
      TierChangeReason.POINTS_THRESHOLD,
      managerMock,
    );
    expect(ledgerSaves[0]).toBeInstanceOf(TierHistoryEntity);
    expect(ledgerSaves[0].to_tier.id).toBe('silver');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test --testPathPattern="tier.service|point.service" 2>&1 | tail -5`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement TierService**

`libs/loyalty/src/tier/tier.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { LoyaltyTierEntity } from './entities/loyalty-tier.entity';
import { TierCategoryOverrideEntity } from './entities/tier-category-override.entity';

@Injectable()
export class TierService {
  async getMultiplierFor(
    tier: LoyaltyTierEntity,
    categoryNames: string[],
    manager: EntityManager,
  ): Promise<number> {
    if (!categoryNames || categoryNames.length === 0) {
      return Number(tier.point_multiplier);
    }
    const overrides = await manager
      .getRepository(TierCategoryOverrideEntity)
      .find({
        where: { tier: { id: tier.id } },
        relations: ['category'],
      });
    const match = overrides.find((o) =>
      categoryNames.some(
        (name) => o.category.slug.toLowerCase() === name.toLowerCase(),
      ),
    );
    return match
      ? Number(match.point_multiplier)
      : Number(tier.point_multiplier);
  }

  async findHighestTierAtOrBelow(
    lifetimePoints: number,
    manager: EntityManager,
  ): Promise<LoyaltyTierEntity | null> {
    const tiers = await manager.getRepository(LoyaltyTierEntity).find({
      where: { is_active: true },
      order: { min_points: 'DESC' },
    });
    return tiers.find((t) => Number(t.min_points) <= lifetimePoints) || null;
  }

  async findLowestActiveTier(
    manager: EntityManager,
  ): Promise<LoyaltyTierEntity | null> {
    return manager.getRepository(LoyaltyTierEntity).findOne({
      where: { is_active: true },
      order: { min_points: 'ASC' },
    });
  }
}
```

- [ ] **Step 4: Implement PointService**

`libs/loyalty/src/point/point.service.ts`:

```typescript
import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { LoyaltyUserEntity } from '../entities/loyalty-user.entity';
import {
  PointLedgerEntity,
  PointEventType,
} from './entities/point-ledger.entity';
import {
  TierHistoryEntity,
  TierChangeReason,
} from './entities/tier-history.entity';
import { LoyaltyTierEntity } from '../tier/entities/loyalty-tier.entity';

@Injectable()
export class PointService {
  async earn(
    user: LoyaltyUserEntity,
    amount: number,
    referenceType: string,
    referenceId: string,
    manager: EntityManager,
  ): Promise<number> {
    const balance = Number(user.balance_points) + amount;
    user.lifetime_points = Number(user.lifetime_points) + amount;
    user.balance_points = balance;
    await manager.getRepository(LoyaltyUserEntity).save(user);
    await this.writeLedger(
      user,
      PointEventType.EARN,
      amount,
      balance,
      referenceType,
      referenceId,
      manager,
    );
    return balance;
  }

  async spend(
    user: LoyaltyUserEntity,
    amount: number,
    referenceType: string,
    referenceId: string,
    manager: EntityManager,
  ): Promise<number> {
    if (Number(user.balance_points) < amount) {
      throw new BadRequestException('Insufficient points');
    }
    const balance = Number(user.balance_points) - amount;
    user.balance_points = balance;
    await manager.getRepository(LoyaltyUserEntity).save(user);
    await this.writeLedger(
      user,
      PointEventType.SPEND,
      -amount,
      balance,
      referenceType,
      referenceId,
      manager,
    );
    return balance;
  }

  async rollback(
    user: LoyaltyUserEntity,
    amount: number,
    referenceType: string,
    referenceId: string,
    manager: EntityManager,
  ): Promise<number> {
    const balance = Number(user.balance_points);
    await this.writeLedger(
      user,
      PointEventType.ROLLBACK,
      amount,
      balance,
      referenceType,
      referenceId,
      manager,
    );
    return balance;
  }

  async adjust(
    user: LoyaltyUserEntity,
    delta: number,
    referenceId: string,
    manager: EntityManager,
  ): Promise<number> {
    const balance = Number(user.balance_points) + delta;
    if (balance < 0) {
      throw new BadRequestException('Insufficient points');
    }
    user.balance_points = balance;
    await manager.getRepository(LoyaltyUserEntity).save(user);
    await this.writeLedger(
      user,
      PointEventType.ADJUSTMENT,
      delta,
      balance,
      'MANUAL_ADJUSTMENT',
      referenceId,
      manager,
    );
    return balance;
  }

  async recordTierChange(
    user: LoyaltyUserEntity,
    fromTier: LoyaltyTierEntity | null,
    toTier: LoyaltyTierEntity,
    reason: TierChangeReason,
    manager: EntityManager,
  ): Promise<void> {
    const history = manager
      .getRepository(TierHistoryEntity)
      .create({ user, from_tier: fromTier, to_tier: toTier, reason });
    await manager.getRepository(TierHistoryEntity).save(history);
  }

  private async writeLedger(
    user: LoyaltyUserEntity,
    eventType: PointEventType,
    amount: number,
    balanceAfter: number,
    referenceType: string,
    referenceId: string,
    manager: EntityManager,
  ): Promise<void> {
    const entry = manager.getRepository(PointLedgerEntity).create({
      user,
      event_type: eventType,
      amount,
      balance_after: balanceAfter,
      reference_type: referenceType,
      reference_id: referenceId,
    });
    await manager.getRepository(PointLedgerEntity).save(entry);
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `yarn test --testPathPattern="tier.service|point.service" 2>&1 | tail -5`
Expected: PASS.

- [ ] **Step 6: Type-check**

Run: `yarn tsc --noEmit -p tsconfig.json 2>&1 | grep -E "tier|point|loyalty" | head -10`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add libs/loyalty
git commit -m "feat(loyalty): add shared tier and point domain services"
```

---

## Task 4: ACL permissions

**Files:**

- Modify: `libs/auth/src/acl.service.ts`
- Test: `libs/auth/src/acl.service.spec.ts` (create if missing; read existing first)

**Interfaces:**

- Produces: permissions `manage:tiers`, `manage:points` granted to `Role.ADMIN`.

- [ ] **Step 1: Write the failing test**

`libs/auth/src/acl.service.spec.ts`:

```typescript
import { AclService } from './acl.service';
import { Role } from './roles.enum';

describe('AclService loyalty permissions', () => {
  it('grants admin manage:tiers and manage:points', () => {
    const service = new AclService();
    expect(service.can(Role.ADMIN, 'manage:tiers')).toBe(true);
    expect(service.can(Role.ADMIN, 'manage:points')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test --testPathPattern="acl.service" 2>&1 | tail -5`
Expected: FAIL.

- [ ] **Step 3: Add permissions**

`libs/auth/src/acl.service.ts` — add to the `Role.ADMIN` array (after `'write:products'`):

```typescript
      'manage:tiers',
      'manage:points',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test --testPathPattern="acl.service" 2>&1 | tail -5`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add libs/auth/src/acl.service.ts libs/auth/src/acl.service.spec.ts
git commit -m "feat(auth): add manage:tiers and manage:points permissions"
```

---

## Task 5: Admin tier CRUD module

**Files:**

- Create: `apps/loyalty-admin/src/tier/dto/create-tier.dto.ts`
- Create: `apps/loyalty-admin/src/tier/dto/update-tier.dto.ts`
- Create: `apps/loyalty-admin/src/tier/tier-admin.service.ts`
- Create: `apps/loyalty-admin/src/tier/tier.controller.ts`
- Create: `apps/loyalty-admin/src/tier/tier-admin.service.spec.ts`
- Modify: `apps/loyalty-admin/src/tier/tier.module.ts` (replace empty stub)
- Modify: `apps/loyalty-admin/src/loyalty-admin.module.ts`

**Interfaces:**

- Consumes: `LoyaltyTierEntity`, `TierCategoryOverrideEntity`, `'LOYALTY_CONNECTION'` DataSource, `BasePaginationDto`, `VoucherCategoryEntity`.
- Produces:
  - `TierAdminService.create(dto: CreateTierDto): Promise<LoyaltyTierEntity>`
  - `TierAdminService.findAll(pagination: BasePaginationDto): Promise<BasePaginationResponseInterface<LoyaltyTierEntity>>`
  - `TierAdminService.findOne(id: string): Promise<LoyaltyTierEntity>`
  - `TierAdminService.update(id: string, dto: UpdateTierDto): Promise<LoyaltyTierEntity>`
  - `TierAdminService.remove(id: string): Promise<void>` (soft delete)
  - Routes: `POST/GET /loyalty-admin/tiers`, `GET/PATCH/DELETE /loyalty-admin/tiers/:id` — `AdminJwtGuard + AclGuard` + `@Permissions('manage:tiers')`
  - `CreateTierDto`: `{ name: string; level: number; min_points: number; point_multiplier: number; extra_discount_percent?: number; is_active?: boolean; exclusive_window_hours?: number; category_overrides?: { category_slug: string; point_multiplier: number }[] }`

- [ ] **Step 1: Write the failing tests**

`apps/loyalty-admin/src/tier/tier-admin.service.spec.ts`:

```typescript
import { TierAdminService } from './tier-admin.service';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import { CreateTierDto } from './dto/create-tier.dto';

describe('TierAdminService', () => {
  const repoMock = {
    create: jest.fn((d) => Object.assign(new LoyaltyTierEntity(), d)),
    save: jest.fn((e) => Promise.resolve(e)),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softDelete: jest.fn(),
  };
  const dataSourceMock = { getRepository: jest.fn(() => repoMock) } as any;

  it('creates a tier', async () => {
    const service = new TierAdminService(dataSourceMock);
    const dto: CreateTierDto = {
      name: 'Gold',
      level: 3,
      min_points: 50000,
      point_multiplier: 2,
      extra_discount_percent: 5,
      is_active: true,
      exclusive_window_hours: 24,
    };
    const result = await service.create(dto);
    expect(result.name).toBe('Gold');
    expect(result.level).toBe(3);
    expect(repoMock.create).toHaveBeenCalled();
  });
});
```

`apps/loyalty-admin/src/tier/tier.controller.spec.ts`:

```typescript
import { TierController } from './tier.controller';
import { TierAdminService } from './tier-admin.service';

describe('TierController', () => {
  const serviceMock = { findAll: jest.fn() } as any;
  const controller = new TierController(serviceMock);

  it('delegates findAll', async () => {
    serviceMock.findAll.mockResolvedValue({ data: [], pagination: {} });
    const result = await controller.findAll({ page: 0, size: 10 } as any);
    expect(serviceMock.findAll).toHaveBeenCalled();
    expect(result).toEqual({ data: [], pagination: {} });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test --testPathPattern="tier-admin|tier.controller" 2>&1 | tail -5`
Expected: FAIL — module not found.

- [ ] **Step 3: Create DTOs**

`apps/loyalty-admin/src/tier/dto/create-tier.dto.ts`:

```typescript
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateTierCategoryOverrideDto {
  @IsString()
  @IsNotEmpty()
  category_slug: string;

  @IsNumber()
  @Min(0)
  point_multiplier: number;
}

export class CreateTierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  level: number;

  @IsNumber()
  @Min(0)
  min_points: number;

  @IsNumber()
  @Min(0)
  point_multiplier: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  extra_discount_percent?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  exclusive_window_hours?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTierCategoryOverrideDto)
  category_overrides?: CreateTierCategoryOverrideDto[];
}
```

`apps/loyalty-admin/src/tier/dto/update-tier.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateTierDto } from './create-tier.dto';

export class UpdateTierDto extends PartialType(CreateTierDto) {}
```

- [ ] **Step 4: Implement the service**

`apps/loyalty-admin/src/tier/tier-admin.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import { TierCategoryOverrideEntity } from '@core/loyalty/tier/entities/tier-category-override.entity';
import { VoucherCategoryEntity } from '@core/loyalty/voucher/entities/voucher-category.entity';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { BasePaginationResponseInterface } from '@core/base/dto/base-response.interface';

@Injectable()
export class TierAdminService {
  private tierRepository: Repository<LoyaltyTierEntity>;
  private overrideRepository: Repository<TierCategoryOverrideEntity>;
  private categoryRepository: Repository<VoucherCategoryEntity>;

  constructor(dataSource: DataSource) {
    this.tierRepository = dataSource.getRepository(LoyaltyTierEntity);
    this.overrideRepository = dataSource.getRepository(
      TierCategoryOverrideEntity,
    );
    this.categoryRepository = dataSource.getRepository(VoucherCategoryEntity);
  }

  async create(dto: CreateTierDto): Promise<LoyaltyTierEntity> {
    const { category_overrides, ...tierData } = dto;
    const tier = this.tierRepository.create(tierData);
    await this.tierRepository.save(tier);

    if (category_overrides && category_overrides.length > 0) {
      for (const o of category_overrides) {
        const category = await this.categoryRepository.findOne({
          where: { slug: o.category_slug },
        });
        if (!category) continue;
        const override = this.overrideRepository.create({
          tier,
          category,
          point_multiplier: o.point_multiplier,
        });
        await this.overrideRepository.save(override);
      }
    }
    return this.findOne(tier.id);
  }

  async findAll(
    paginationDto: BasePaginationDto,
  ): Promise<BasePaginationResponseInterface<LoyaltyTierEntity>> {
    const { page, size, search, sort, order } = paginationDto;
    const skip = page * size;
    const qb = this.tierRepository
      .createQueryBuilder('tier')
      .leftJoinAndSelect('tier.category_overrides', 'override')
      .leftJoinAndSelect('override.category', 'category');

    if (search) {
      qb.where('tier.name ILIKE :search', { search: `%${search}%` });
    }
    if (sort && order) {
      qb.orderBy(`tier.${sort}`, order);
    }
    const [data, total] = await qb.skip(skip).take(size).getManyAndCount();
    return {
      code: 'SUCCESS',
      message: 'Tiers retrieved successfully',
      data,
      pagination: { page, size, total },
    };
  }

  async findOne(id: string): Promise<LoyaltyTierEntity> {
    const tier = await this.tierRepository.findOne({
      where: { id },
      relations: ['category_overrides', 'category_overrides.category'],
    });
    if (!tier) throw new NotFoundException(`Tier with id ${id} not found`);
    return tier;
  }

  async update(id: string, dto: UpdateTierDto): Promise<LoyaltyTierEntity> {
    const tier = await this.findOne(id);
    const { category_overrides, ...tierData } = dto;
    Object.assign(tier, tierData);
    await this.tierRepository.save(tier);

    if (category_overrides) {
      await this.overrideRepository.delete({ tier: { id } });
      for (const o of category_overrides) {
        const category = await this.categoryRepository.findOne({
          where: { slug: o.category_slug },
        });
        if (!category) continue;
        const override = this.overrideRepository.create({
          tier,
          category,
          point_multiplier: o.point_multiplier,
        });
        await this.overrideRepository.save(override);
      }
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.tierRepository.softDelete(id);
  }
}
```

- [ ] **Step 5: Implement the controller**

`apps/loyalty-admin/src/tier/tier.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TierAdminService } from './tier-admin.service';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';

@Controller('/loyalty-admin/tiers')
@UseGuards(AdminJwtGuard, AclGuard)
export class TierController {
  constructor(
    @Inject('TIER_ADMIN_SERVICE')
    private readonly tierService: TierAdminService,
  ) {}

  @Post()
  @Permissions('manage:tiers')
  create(@Body() dto: CreateTierDto) {
    return this.tierService.create(dto);
  }

  @Get()
  @Permissions('manage:tiers')
  findAll(@Query() paginationDto: BasePaginationDto) {
    return this.tierService.findAll(paginationDto);
  }

  @Get(':id')
  @Permissions('manage:tiers')
  findOne(@Param('id') id: string) {
    return this.tierService.findOne(id);
  }

  @Patch(':id')
  @Permissions('manage:tiers')
  update(@Param('id') id: string, @Body() dto: UpdateTierDto) {
    return this.tierService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('manage:tiers')
  remove(@Param('id') id: string) {
    return this.tierService.remove(id);
  }
}
```

- [ ] **Step 6: Wire the module**

`apps/loyalty-admin/src/tier/tier.module.ts` — replace the empty stub:

```typescript
import { Module, Scope } from '@nestjs/common';
import { TierController } from './tier.controller';
import { TierAdminService } from './tier-admin.service';
import { DataSource } from 'typeorm';

@Module({
  controllers: [TierController],
  providers: [
    {
      provide: 'TIER_ADMIN_SERVICE',
      scope: Scope.REQUEST,
      useFactory: (dataSource: DataSource) => new TierAdminService(dataSource),
      inject: ['LOYALTY_CONNECTION'],
    },
  ],
})
export class TierModule {}
```

`apps/loyalty-admin/src/loyalty-admin.module.ts` — add `import { TierModule } from './tier/tier.module';` and `TierModule,` to `imports` (after `RewardItemSourceModule`).

- [ ] **Step 7: Run tests to verify they pass**

Run: `yarn test --testPathPattern="tier-admin|tier.controller" 2>&1 | tail -5`
Expected: PASS.

- [ ] **Step 8: Build the admin app**

Run: `yarn nest build loyalty-admin 2>&1 | tail -10`
Expected: build succeeds.

- [ ] **Step 9: Commit**

```bash
git add apps/loyalty-admin/src/tier apps/loyalty-admin/src/loyalty-admin.module.ts
git commit -m "feat(loyalty-admin): tier CRUD with category overrides"
```

---

## Task 6: Admin reward item point pricing fields

**Files:**

- Modify: `apps/loyalty-admin/src/reward-item/dto/create-reward-item.dto.ts`
- Modify: `apps/loyalty-admin/src/reward-item/dto/update-reward-item.dto.ts`
- Modify: `apps/loyalty-admin/src/reward-item/reward-item.service.ts`
- Modify: `apps/loyalty-admin/src/reward-item/reward-item.module.ts`
- Test: `apps/loyalty-admin/src/reward-item/reward-item.service.spec.ts` (read existing, append)

**Interfaces:**

- Consumes: `RewardItemEntity` (new fields), `LoyaltyTierEntity`.
- Produces: `CreateRewardItemDto` with `point_price?: number`, `min_tier_id?: string`, `exclusive_days?: number`; service resolves `min_tier` relation on create/update.

- [ ] **Step 1: Write the failing test**

`apps/loyalty-admin/src/reward-item/reward-item.service.spec.ts` — append:

```typescript
import { RewardItemService } from './reward-item.service';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';

describe('RewardItemService point pricing', () => {
  const tierRepoMock = { findOne: jest.fn() };
  const rewardRepoMock = {
    create: jest.fn((d) => Object.assign(new RewardItemEntity(), d)),
    save: jest.fn((e) => Promise.resolve(e)),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const dataSourceMock = {
    getRepository: jest.fn((entity: any) => {
      if (entity === LoyaltyTierEntity) return tierRepoMock;
      return rewardRepoMock;
    }),
  } as any;

  it('resolves min_tier relation on create', async () => {
    tierRepoMock.findOne.mockResolvedValue({ id: 't1', name: 'Gold' });
    const service = new RewardItemService(dataSourceMock);
    const dto: any = {
      name: 'GoPay 10k',
      type: 'gopay',
      source_id: 's1',
      stock: 5,
      point_price: 1000,
      min_tier_id: 't1',
      exclusive_days: 1,
    };
    await service.create(dto);
    expect(tierRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 't1' } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test --testPathPattern="reward-item.service" 2>&1 | tail -5`
Expected: FAIL.

- [ ] **Step 3: Update DTOs**

`apps/loyalty-admin/src/reward-item/dto/create-reward-item.dto.ts` — replace entire file (read the current file first — it may have a different shape):

```typescript
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateRewardItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsInt()
  stock: number;

  @IsString()
  @IsNotEmpty()
  source_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  point_price?: number;

  @IsOptional()
  @IsUUID()
  min_tier_id?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  exclusive_days?: number;
}
```

`apps/loyalty-admin/src/reward-item/dto/update-reward-item.dto.ts` — ensure it is `PartialType(CreateRewardItemDto)` (read first; adjust if it has explicit fields).

- [ ] **Step 4: Update the service**

`apps/loyalty-admin/src/reward-item/reward-item.service.ts` — replace with:

```typescript
import { Injectable } from '@nestjs/common';
import { CreateRewardItemDto } from './dto/create-reward-item.dto';
import { UpdateRewardItemDto } from './dto/update-reward-item.dto';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import { DataSource, Repository } from 'typeorm';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { BasePaginationResponseInterface } from '@core/base/dto/base-response.interface';

@Injectable()
export class RewardItemService {
  private rewardItemRepository: Repository<RewardItemEntity>;
  private tierRepository: Repository<LoyaltyTierEntity>;

  constructor(dataSource: DataSource) {
    this.rewardItemRepository = dataSource.getRepository(RewardItemEntity);
    this.tierRepository = dataSource.getRepository(LoyaltyTierEntity);
  }

  async create(dto: CreateRewardItemDto): Promise<RewardItemEntity> {
    const { min_tier_id, ...rest } = dto;
    const min_tier = min_tier_id
      ? await this.tierRepository.findOne({ where: { id: min_tier_id } })
      : null;
    const newRewardItem = this.rewardItemRepository.create({
      ...rest,
      ...(min_tier ? { min_tier } : {}),
    });
    return this.rewardItemRepository.save(newRewardItem);
  }

  async findAll(
    paginationDto: BasePaginationDto,
  ): Promise<BasePaginationResponseInterface<RewardItemEntity>> {
    const { page, size, search, sort, order } = paginationDto;
    const skip = page * size;
    const queryBuilder =
      this.rewardItemRepository.createQueryBuilder('rewardItem');

    if (search) {
      queryBuilder.where('rewardItem.name ILIKE :search', {
        search: `%${search}%`,
      });
    }
    if (sort && order) {
      queryBuilder.orderBy(`rewardItem.${sort}`, order);
    }
    const [data, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .getManyAndCount();
    return {
      code: 'SUCCESS',
      message: 'Reward items retrieved successfully',
      data,
      pagination: { page, size, total },
    };
  }

  async findOne(id: string): Promise<RewardItemEntity> {
    return this.rewardItemRepository.findOne({
      where: { id },
      relations: ['source', 'min_tier'],
    });
  }

  async update(
    id: string,
    updateRewardItemDto: UpdateRewardItemDto,
  ): Promise<RewardItemEntity> {
    const { min_tier_id, ...rest } = updateRewardItemDto;
    const payload: Partial<RewardItemEntity> = { ...rest } as any;
    if (min_tier_id !== undefined) {
      payload.min_tier = min_tier_id
        ? await this.tierRepository.findOne({ where: { id: min_tier_id } })
        : null;
    }
    await this.rewardItemRepository.update(id, payload as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.rewardItemRepository.delete(id);
  }
}
```

- [ ] **Step 5: Update the module**

`apps/loyalty-admin/src/reward-item/reward-item.module.ts` — read it first; convert to request-scoped provider if needed:

```typescript
import { Module, Scope } from '@nestjs/common';
import { RewardItemService } from './reward-item.service';
import { RewardItemController } from './reward-item.controller';
import { DataSource } from 'typeorm';

@Module({
  controllers: [RewardItemController],
  providers: [
    {
      provide: RewardItemService,
      scope: Scope.REQUEST,
      useFactory: (dataSource: DataSource) => new RewardItemService(dataSource),
      inject: ['LOYALTY_CONNECTION'],
    },
  ],
})
export class RewardItemModule {}
```

(Keep the controller's injection token consistent — if it injects `RewardItemService` by class token, that is what this provides.)

- [ ] **Step 6: Run tests**

Run: `yarn test --testPathPattern="reward-item" 2>&1 | tail -5`
Expected: PASS (existing + new).

- [ ] **Step 7: Build admin app**

Run: `yarn nest build loyalty-admin 2>&1 | tail -10`
Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add apps/loyalty-admin/src/reward-item
git commit -m "feat(loyalty-admin): reward item point pricing and tier gating"
```

---

## Task 7: Admin user-points module (view + adjust + history)

**Files:**

- Create: `apps/loyalty-admin/src/user-points/dto/adjust-points.dto.ts`
- Create: `apps/loyalty-admin/src/user-points/user-points.service.ts`
- Create: `apps/loyalty-admin/src/user-points/user-points.controller.ts`
- Create: `apps/loyalty-admin/src/user-points/user-points.module.ts`
- Create: `apps/loyalty-admin/src/user-points/user-points.service.spec.ts`
- Modify: `apps/loyalty-admin/src/loyalty-admin.module.ts`

**Interfaces:**

- Consumes: `LoyaltyUserEntity`, `PointLedgerEntity`, `PointService`, `TierService`, `'LOYALTY_CONNECTION'`.
- Produces:
  - `UserPointsService.getProfile(coreUserId)` — returns user with tier relation
  - `UserPointsService.getLedger(coreUserId, page, size)` — paginated ledger
  - `UserPointsService.adjustPoints(coreUserId, delta, reason)` — runs `PointService.adjust` in a transaction
  - Routes: `GET /loyalty-admin/users/:coreUserId/points`, `GET /loyalty-admin/users/:coreUserId/points/history`, `POST /loyalty-admin/users/:coreUserId/points/adjust` — `@Permissions('manage:points')`

- [ ] **Step 1: Write the failing test**

`apps/loyalty-admin/src/user-points/user-points.service.spec.ts`:

```typescript
import { UserPointsService } from './user-points.service';

describe('UserPointsService', () => {
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

  it('adjusts points via PointService', async () => {
    userRepoMock.findOne.mockResolvedValue({
      id: 'u1',
      core_user_id: 'c1',
    });
    pointServiceMock.adjust.mockResolvedValue(150);
    const service = new UserPointsService(
      dataSourceMock,
      pointServiceMock as any,
    );
    const result = await service.adjustPoints('c1', 50, 'compensation');
    expect(pointServiceMock.adjust).toHaveBeenCalled();
    expect(result.balance_points).toBe(150);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test --testPathPattern="user-points" 2>&1 | tail -5`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement DTO**

`apps/loyalty-admin/src/user-points/dto/adjust-points.dto.ts`:

```typescript
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AdjustPointsDto {
  @IsNumber()
  delta: number; // positive = add, negative = subtract

  @IsString()
  @IsNotEmpty()
  reason: string;
}
```

- [ ] **Step 4: Implement service**

`apps/loyalty-admin/src/user-points/user-points.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { PointLedgerEntity } from '@core/loyalty/point/entities/point-ledger.entity';
import { PointService } from '@core/loyalty/point/point.service';

@Injectable()
export class UserPointsService {
  private userRepository: Repository<LoyaltyUserEntity>;
  private ledgerRepository: Repository<PointLedgerEntity>;

  constructor(
    private dataSource: DataSource,
    private pointService: PointService,
  ) {
    this.userRepository = dataSource.getRepository(LoyaltyUserEntity);
    this.ledgerRepository = dataSource.getRepository(PointLedgerEntity);
  }

  async getProfile(coreUserId: string) {
    const user = await this.userRepository.findOne({
      where: { core_user_id: coreUserId },
      relations: ['tier'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getLedger(coreUserId: string, page = 0, size = 10) {
    const user = await this.userRepository.findOne({
      where: { core_user_id: coreUserId },
    });
    if (!user) throw new NotFoundException('User not found');
    const [data, total] = await this.ledgerRepository.findAndCount({
      where: { user: { id: user.id } },
      order: { occurred_at: 'DESC' },
      skip: page * size,
      take: size,
    });
    return {
      code: 'SUCCESS',
      message: 'Point history retrieved successfully',
      data,
      pagination: { page, size, total },
    };
  }

  async adjustPoints(coreUserId: string, delta: number, reason: string) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(LoyaltyUserEntity).findOne({
        where: { core_user_id: coreUserId },
        relations: ['tier'],
      });
      if (!user) throw new NotFoundException('User not found');
      const balance = await this.pointService.adjust(
        user,
        delta,
        reason,
        manager,
      );
      return { balance_points: balance };
    });
  }
}
```

- [ ] **Step 5: Implement controller**

`apps/loyalty-admin/src/user-points/user-points.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserPointsService } from './user-points.service';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';

@Controller('/loyalty-admin/users')
@UseGuards(AdminJwtGuard, AclGuard)
export class UserPointsController {
  constructor(
    @Inject('USER_POINTS_SERVICE')
    private readonly userPointsService: UserPointsService,
  ) {}

  @Get(':coreUserId/points')
  @Permissions('manage:points')
  getProfile(@Param('coreUserId') coreUserId: string) {
    return this.userPointsService.getProfile(coreUserId);
  }

  @Get(':coreUserId/points/history')
  @Permissions('manage:points')
  getHistory(
    @Param('coreUserId') coreUserId: string,
    @Query('page') page = 0,
    @Query('size') size = 10,
  ) {
    return this.userPointsService.getLedger(
      coreUserId,
      Number(page),
      Number(size),
    );
  }

  @Post(':coreUserId/points/adjust')
  @Permissions('manage:points')
  adjust(
    @Param('coreUserId') coreUserId: string,
    @Body() dto: AdjustPointsDto,
  ) {
    return this.userPointsService.adjustPoints(
      coreUserId,
      dto.delta,
      dto.reason,
    );
  }
}
```

- [ ] **Step 6: Implement module**

`apps/loyalty-admin/src/user-points/user-points.module.ts`:

```typescript
import { Module, Scope } from '@nestjs/common';
import { UserPointsController } from './user-points.controller';
import { UserPointsService } from './user-points.service';
import { PointService } from '@core/loyalty/point/point.service';
import { DataSource } from 'typeorm';

@Module({
  controllers: [UserPointsController],
  providers: [
    PointService,
    {
      provide: 'USER_POINTS_SERVICE',
      scope: Scope.REQUEST,
      useFactory: (dataSource: DataSource) =>
        new UserPointsService(dataSource, new PointService()),
      inject: ['LOYALTY_CONNECTION'],
    },
  ],
})
export class UserPointsModule {}
```

`apps/loyalty-admin/src/loyalty-admin.module.ts` — add `import { UserPointsModule } from './user-points/user-points.module';` and `UserPointsModule,` to `imports`.

- [ ] **Step 7: Run tests**

Run: `yarn test --testPathPattern="user-points" 2>&1 | tail -5`
Expected: PASS.

- [ ] **Step 8: Build admin app**

Run: `yarn nest build loyalty-admin 2>&1 | tail -10`
Expected: build succeeds.

- [ ] **Step 9: Commit**

```bash
git add apps/loyalty-admin/src/user-points apps/loyalty-admin/src/loyalty-admin.module.ts
git commit -m "feat(loyalty-admin): user points view, history, and manual adjustment"
```

---

## Task 8: Consumer points module (profile + history)

**Files:**

- Create: `apps/loyalty-consumer/src/points/points.service.ts`
- Create: `apps/loyalty-consumer/src/points/points.controller.ts`
- Create: `apps/loyalty-consumer/src/points/points.module.ts`
- Create: `apps/loyalty-consumer/src/points/points.service.spec.ts`
- Modify: `apps/loyalty-consumer/src/loyalty-consumer.module.ts`

**Interfaces:**

- Consumes: `LoyaltyUserEntity`, `PointLedgerEntity`, `LoyaltyTierEntity`, `'LOYALTY_CONSUMER_CONNECTION'`.
- Produces:
  - `PointsService.getProfile(userId): Promise<{ tier, lifetime_points, balance_points, next_tier }>`
  - `PointsService.getHistory(userId, page, size): Promise<Paginated<PointLedgerEntity>>`
  - Routes: `GET /loyalty/points/profile`, `GET /loyalty/points/history` — `ConsumerJwtGuard`.

- [ ] **Step 1: Write the failing test**

`apps/loyalty-consumer/src/points/points.service.spec.ts`:

```typescript
import { PointsService } from './points.service';

describe('PointsService', () => {
  const userRepoMock = { findOne: jest.fn() };
  const ledgerRepoMock = { findAndCount: jest.fn() };
  const tierRepoMock = { find: jest.fn() };
  const dataSourceMock = {
    getRepository: jest.fn((entity: any) => {
      const name = entity?.name || '';
      if (name.includes('PointLedger')) return ledgerRepoMock;
      if (name.includes('LoyaltyTier')) return tierRepoMock;
      return userRepoMock;
    }),
  } as any;

  it('returns profile with next tier', async () => {
    userRepoMock.findOne.mockResolvedValue({
      id: 'u1',
      core_user_id: 'c1',
      lifetime_points: 120,
      balance_points: 50,
      tier: { id: 'b', level: 1, name: 'Bronze', min_points: 0 },
    });
    tierRepoMock.find.mockResolvedValue([
      { id: 'b', level: 1, name: 'Bronze', min_points: 0 },
      { id: 's', level: 2, name: 'Silver', min_points: 10000 },
    ]);
    const service = new PointsService(dataSourceMock);
    const profile = await service.getProfile('c1');
    expect(profile.next_tier?.name).toBe('Silver');
    expect(profile.lifetime_points).toBe(120);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test --testPathPattern="points.service" 2>&1 | tail -5`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement service**

`apps/loyalty-consumer/src/points/points.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { PointLedgerEntity } from '@core/loyalty/point/entities/point-ledger.entity';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';

@Injectable()
export class PointsService {
  private userRepository: Repository<LoyaltyUserEntity>;
  private ledgerRepository: Repository<PointLedgerEntity>;
  private tierRepository: Repository<LoyaltyTierEntity>;

  constructor(dataSource: DataSource) {
    this.userRepository = dataSource.getRepository(LoyaltyUserEntity);
    this.ledgerRepository = dataSource.getRepository(PointLedgerEntity);
    this.tierRepository = dataSource.getRepository(LoyaltyTierEntity);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { core_user_id: userId },
      relations: ['tier'],
    });
    if (!user) throw new NotFoundException('User not found');

    const tiers = await this.tierRepository.find({
      where: { is_active: true },
      order: { min_points: 'ASC' },
    });
    const nextTier =
      tiers.find((t) => Number(t.min_points) > Number(user.lifetime_points)) ||
      null;

    return {
      tier: user.tier,
      lifetime_points: user.lifetime_points,
      balance_points: user.balance_points,
      next_tier: nextTier,
    };
  }

  async getHistory(userId: string, page = 0, size = 10) {
    const user = await this.userRepository.findOne({
      where: { core_user_id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    const [data, total] = await this.ledgerRepository.findAndCount({
      where: { user: { id: user.id } },
      order: { occurred_at: 'DESC' },
      skip: page * size,
      take: size,
    });
    return {
      code: 'SUCCESS',
      message: 'Point history retrieved successfully',
      data,
      pagination: { page, size, total },
    };
  }
}
```

- [ ] **Step 4: Implement controller**

`apps/loyalty-consumer/src/points/points.controller.ts`:

```typescript
import { Controller, Get, Inject, Query, Req, UseGuards } from '@nestjs/common';
import { PointsService } from './points.service';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';
import { Request } from 'express';

@Controller('/loyalty/points')
export class PointsController {
  constructor(
    @Inject('POINTS_SERVICE') private readonly pointsService: PointsService,
  ) {}

  @Get('profile')
  @UseGuards(ConsumerJwtGuard)
  getProfile(@Req() req: Request) {
    return this.pointsService.getProfile(req.user['userId']);
  }

  @Get('history')
  @UseGuards(ConsumerJwtGuard)
  getHistory(
    @Req() req: Request,
    @Query('page') page = 0,
    @Query('size') size = 10,
  ) {
    return this.pointsService.getHistory(
      req.user['userId'],
      Number(page),
      Number(size),
    );
  }
}
```

- [ ] **Step 5: Implement module**

`apps/loyalty-consumer/src/points/points.module.ts`:

```typescript
import { Module, Scope, forwardRef } from '@nestjs/common';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { DataSource } from 'typeorm';
import { LoyaltyConsumerModule } from '../loyalty-consumer.module';

@Module({
  imports: [forwardRef(() => LoyaltyConsumerModule)],
  controllers: [PointsController],
  providers: [
    {
      provide: 'POINTS_SERVICE',
      scope: Scope.REQUEST,
      useFactory: (dataSource: DataSource) => new PointsService(dataSource),
      inject: ['LOYALTY_CONSUMER_CONNECTION'],
    },
  ],
})
export class PointsModule {}
```

`apps/loyalty-consumer/src/loyalty-consumer.module.ts` — add `import { PointsModule } from './points/points.module';` and `PointsModule,` to `imports`.

- [ ] **Step 6: Run tests**

Run: `yarn test --testPathPattern="points.service" 2>&1 | tail -5`
Expected: PASS.

- [ ] **Step 7: Build consumer app**

Run: `yarn nest build loyalty-consumer 2>&1 | tail -10`
Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add apps/loyalty-consumer/src/points apps/loyalty-consumer/src/loyalty-consumer.module.ts
git commit -m "feat(loyalty-consumer): points profile and history endpoints"
```

---

## Task 9: Tier binding validation in discount calculation

**Files:**

- Modify: `apps/loyalty-consumer/src/voucher/voucher.service.ts`
- Test: `apps/loyalty-consumer/src/voucher/voucher.service.spec.ts` (read existing, append)

**Interfaces:**

- Consumes: existing `VoucherService`; `LoyaltyUserEntity`.
- Produces: `validateAndCalculateDiscount` now rejects vouchers with a `tier` binding when the user's tier is not among the bound tier ids — `isValid: false, message: 'Voucher is not valid for this user'`. Adds private `userRepository` field.

- [ ] **Step 1: Write the failing test**

Read `apps/loyalty-consumer/src/voucher/voucher.service.spec.ts` first and match its mocking style. Append:

```typescript
it('rejects voucher bound to a tier the user does not have', async () => {
  const voucher = {
    code: 'GOLD_ONLY',
    quota: 10,
    discount_type: 'PERCENTAGE',
    discount_value: 20,
    validities: [],
    target_users: [],
    bindings: [{ bind_type: 'tier', bind_value: 'gold-tier-id' }],
    categories: [],
  };
  repositoryMock.findOne.mockResolvedValue(voucher);
  const userRepoMock = {
    findOne: jest.fn().mockResolvedValue({
      id: 'u1',
      core_user_id: 'c1',
      tier: { id: 'bronze-tier-id' },
    }),
  };
  const dsMock = { getRepository: jest.fn().mockReturnValue(userRepoMock) };
  (service as any).voucherRepository = repositoryMock;
  (service as any).userRepository = dsMock.getRepository();

  const result = await service.validateAndCalculateDiscount(
    'GOLD_ONLY',
    100000,
    'c1',
    'p1',
    ['Food'],
  );
  expect(result.isValid).toBe(false);
  expect(result.message).toBe('Voucher is not valid for this user');
});
```

(Adapt repository mock names to the existing spec's conventions.)

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test --testPathPattern="voucher.service" 2>&1 | tail -5`
Expected: FAIL — tier binding not checked.

- [ ] **Step 3: Add userRepository field**

In `apps/loyalty-consumer/src/voucher/voucher.service.ts` constructor, add after the existing repository assignments:

```typescript
this.userRepository = dataSource.getRepository(LoyaltyUserEntity);
```

and declare the field with the others:

```typescript
  private userRepository: Repository<LoyaltyUserEntity>;
```

(`LoyaltyUserEntity` and `Repository` are already imported in this file.)

- [ ] **Step 4: Add the tier binding check**

In `validateAndCalculateDiscount`, after the target-user check block and before the bindings check block, add:

```typescript
// 3b. Check Tier Bindings
const tierBindings = voucher.bindings.filter((b) => b.bind_type === 'tier');
if (tierBindings.length > 0) {
  const user = await this.userRepository.findOne({
    where: { core_user_id: userId },
    relations: ['tier'],
  });
  const userTierId = user?.tier?.id;
  const isTierBound = tierBindings.some((b) => b.bind_value === userTierId);
  if (!isTierBound) {
    return {
      isValid: false,
      discountAmount: 0,
      finalPrice: subtotal,
      message: 'Voucher is not valid for this user',
    };
  }
}
```

- [ ] **Step 5: Run tests**

Run: `yarn test --testPathPattern="voucher.service" 2>&1 | tail -5`
Expected: PASS (existing + new).

- [ ] **Step 6: Build consumer app**

Run: `yarn nest build loyalty-consumer 2>&1 | tail -10`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add apps/loyalty-consumer/src/voucher/voucher.service.ts
git commit -m "feat(loyalty-consumer): enforce tier binding in discount validation"
```

---

## Task 10: Purchase flow — tier discount, cap, points, level-up

**Files:**

- Create: `apps/loyalty-consumer/src/voucher/discount-points.util.ts`
- Create: `apps/loyalty-consumer/src/voucher/discount-points.util.spec.ts`
- Modify: `apps/loyalty-consumer/src/voucher/purchase.controller.ts`
- Modify: `apps/loyalty-consumer/src/voucher/purchase.controller.spec.ts` (read existing, adjust constructor)

**Interfaces:**

- Consumes: `VoucherService.validateAndCalculateDiscount`, `OrderService`, `'LOYALTY_CONSUMER_CONNECTION'`, `TierService`, `PointService`, `ClientSettingsService`, product entities.
- Produces:
  - `computeTierDiscountAndPoints(params: { subtotal, voucherDiscount, tierExtraPercent, maxCombinedPercent, pointBaseRate, multiplier }): { tier_discount, combined_discount, final_price, points_earned }` — pure function
  - Purchase response extended with `points_earned: number`, `tier: { id, name } | null`

- [ ] **Step 1: Write the failing tests**

`apps/loyalty-consumer/src/voucher/discount-points.util.spec.ts`:

```typescript
import { computeTierDiscountAndPoints } from './discount-points.util';

describe('computeTierDiscountAndPoints', () => {
  it('applies tier discount on top of voucher within cap', () => {
    const result = computeTierDiscountAndPoints({
      subtotal: 100000,
      voucherDiscount: 20000,
      tierExtraPercent: 5,
      maxCombinedPercent: 50,
      pointBaseRate: 1000,
      multiplier: 2,
    });
    expect(result.tier_discount).toBe(5000);
    expect(result.combined_discount).toBe(25000);
    expect(result.final_price).toBe(75000);
    expect(result.points_earned).toBe(150);
  });

  it('caps combined discount at maxCombinedPercent', () => {
    const result = computeTierDiscountAndPoints({
      subtotal: 100000,
      voucherDiscount: 50000,
      tierExtraPercent: 20,
      maxCombinedPercent: 50,
      pointBaseRate: 1000,
      multiplier: 1,
    });
    expect(result.combined_discount).toBe(50000);
    expect(result.final_price).toBe(50000);
  });

  it('never produces a negative final price', () => {
    const result = computeTierDiscountAndPoints({
      subtotal: 1000,
      voucherDiscount: 2000,
      tierExtraPercent: 50,
      maxCombinedPercent: 100,
      pointBaseRate: 1000,
      multiplier: 1,
    });
    expect(result.final_price).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test --testPathPattern="discount-points" 2>&1 | tail -5`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the util**

`apps/loyalty-consumer/src/voucher/discount-points.util.ts`:

```typescript
export interface TierDiscountResult {
  tier_discount: number;
  combined_discount: number;
  final_price: number;
  points_earned: number;
}

export function computeTierDiscountAndPoints(params: {
  subtotal: number;
  voucherDiscount: number;
  tierExtraPercent: number;
  maxCombinedPercent: number;
  pointBaseRate: number;
  multiplier: number;
}): TierDiscountResult {
  const tierDiscount = (params.subtotal * params.tierExtraPercent) / 100;
  const rawCombined = params.voucherDiscount + tierDiscount;
  const cap = (params.subtotal * params.maxCombinedPercent) / 100;
  const combinedDiscount = Math.min(rawCombined, cap);
  const finalPrice = Math.max(0, params.subtotal - combinedDiscount);
  const pointsEarned = (finalPrice / params.pointBaseRate) * params.multiplier;
  return {
    tier_discount: tierDiscount,
    combined_discount: combinedDiscount,
    final_price: finalPrice,
    points_earned: pointsEarned,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test --testPathPattern="discount-points" 2>&1 | tail -5`
Expected: PASS.

- [ ] **Step 5: Modify the purchase controller**

`apps/loyalty-consumer/src/voucher/purchase.controller.ts` — replace with:

```typescript
import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';
import { VoucherService } from './voucher.service';
import { OrderService } from '@core/product/order.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { DataSource, EntityManager } from 'typeorm';
import { ProductEntity } from '@core/product/entities/product.entity';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import { TierService } from '@core/loyalty/tier/tier.service';
import { PointService } from '@core/loyalty/point/point.service';
import { TierChangeReason } from '@core/loyalty/point/entities/tier-history.entity';
import { ClientSettingsService } from '@core/database/client-settings/client-settings.service';
import { computeTierDiscountAndPoints } from './discount-points.util';

@Controller('/loyalty/purchase')
@UseGuards(ConsumerJwtGuard)
export class PurchaseController {
  constructor(
    @Inject('VOUCHER_SERVICE') private readonly voucherService: VoucherService,
    private readonly orderService: OrderService,
    @Inject('LOYALTY_CONSUMER_CONNECTION')
    private readonly dataSource: DataSource,
    private readonly tierService: TierService,
    private readonly pointService: PointService,
    private readonly settingsService: ClientSettingsService,
  ) {}

  @Post()
  async purchase(
    @Req() req: any,
    @Body() dto: CreatePurchaseDto,
  ): Promise<any> {
    const userId = req.user['userId'];
    const databaseName = req['client'].database_name;

    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(ProductEntity, {
        where: { id: dto.product_id, is_active: true },
      });
      if (!product) {
        throw new NotFoundException('Product not found or inactive');
      }

      const subtotal = Number(product.price) * dto.quantity;
      let voucherDiscount = 0;

      if (dto.voucher_code) {
        const productWithCategories = await manager.findOne(ProductEntity, {
          where: { id: dto.product_id },
          relations: ['categories'],
        });
        const categoryNames =
          productWithCategories?.categories?.map((c) => c.name) || [];
        const calculation =
          await this.voucherService.validateAndCalculateDiscount(
            dto.voucher_code,
            subtotal,
            userId,
            product.id,
            categoryNames,
          );
        if (!calculation.isValid) {
          throw new BadRequestException(calculation.message);
        }
        voucherDiscount = calculation.discountAmount;
        await this.voucherService.useVoucher(userId, dto.voucher_code, manager);
      }

      let user = await manager.getRepository(LoyaltyUserEntity).findOne({
        where: { core_user_id: userId },
        relations: ['tier'],
      });
      if (!user) {
        user = manager
          .getRepository(LoyaltyUserEntity)
          .create({ core_user_id: userId });
        user.tier = await this.tierService.findLowestActiveTier(manager);
        user.lifetime_points = 0;
        user.balance_points = 0;
        user = await manager.getRepository(LoyaltyUserEntity).save(user);
      }

      const tier: LoyaltyTierEntity | null = user.tier || null;
      const tierExtraPercent = tier ? Number(tier.extra_discount_percent) : 0;

      const settings =
        await this.settingsService.getLoyaltySettings(databaseName);

      const productWithCategories = await manager.findOne(ProductEntity, {
        where: { id: dto.product_id },
        relations: ['categories'],
      });
      const categoryNames =
        productWithCategories?.categories?.map((c) => c.name) || [];

      const multiplier = tier
        ? await this.tierService.getMultiplierFor(tier, categoryNames, manager)
        : 1;

      const calc = computeTierDiscountAndPoints({
        subtotal,
        voucherDiscount,
        tierExtraPercent,
        maxCombinedPercent: Number(settings.max_combined_discount_percent),
        pointBaseRate: Number(settings.point_base_rate),
        multiplier,
      });

      const order = await this.orderService.create({
        user_id: userId,
        product_id: product.id,
        quantity: dto.quantity,
        subtotal: Number(subtotal),
        discount_amount: Number(calc.combined_discount),
        total_price: Number(calc.final_price),
        voucher_code: dto.voucher_code || null,
      });

      const pointsEarned = calc.points_earned;
      if (pointsEarned > 0) {
        await this.pointService.earn(
          user,
          pointsEarned,
          'ORDER',
          order.id,
          manager,
        );
        await this.maybeLevelUp(user, manager);
      }

      return {
        ...order,
        points_earned: pointsEarned,
        tier: tier ? { id: tier.id, name: tier.name } : null,
      };
    });
  }

  private async maybeLevelUp(
    user: LoyaltyUserEntity,
    manager: EntityManager,
  ): Promise<void> {
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
    }
  }
}
```

- [ ] **Step 6: Update purchase controller spec**

Read `apps/loyalty-consumer/src/voucher/purchase.controller.spec.ts` and update the constructor call:

```typescript
const controller = new PurchaseController(
  voucherServiceMock,
  orderServiceMock,
  dataSourceMock,
  tierServiceMock,
  pointServiceMock,
  settingsServiceMock,
);
```

with:

- `tierServiceMock = { getMultiplierFor: jest.fn().mockResolvedValue(1), findLowestActiveTier: jest.fn().mockResolvedValue(null), findHighestTierAtOrBelow: jest.fn().mockResolvedValue(null) }`
- `pointServiceMock = { earn: jest.fn().mockResolvedValue(0), recordTierChange: jest.fn() }`
- `settingsServiceMock = { getLoyaltySettings: jest.fn().mockResolvedValue({ point_base_rate: 1000, max_combined_discount_percent: 50 }) }`

- [ ] **Step 7: Run tests**

Run: `yarn test --testPathPattern="purchase|discount-points" 2>&1 | tail -5`
Expected: PASS.

- [ ] **Step 8: Wire VoucherModule providers**

`apps/loyalty-consumer/src/voucher/voucher.module.ts` — the `PurchaseController` now needs `TierService`, `PointService`, and `ClientSettingsService`. Update the module so those are injectable:

```typescript
import { Module, forwardRef, Scope } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { PurchaseController } from './purchase.controller';
import { OrderService } from '@core/product/order.service';
import { TierService } from '@core/loyalty/tier/tier.service';
import { PointService } from '@core/loyalty/point/point.service';
import { ClientSettingsService } from '@core/database/client-settings/client-settings.service';
import { DataSource } from 'typeorm';
import { LoyaltyConsumerModule } from '../loyalty-consumer.module';
import { AuthModule } from '@core/auth';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => LoyaltyConsumerModule),
  ],
  controllers: [VoucherController, PurchaseController],
  providers: [
    TierService,
    PointService,
    ClientSettingsService,
    {
      provide: OrderService,
      scope: Scope.REQUEST,
      useFactory: (dataSource: DataSource) => new OrderService(dataSource),
      inject: ['LOYALTY_CONSUMER_CONNECTION'],
    },
    {
      provide: 'VOUCHER_SERVICE',
      scope: Scope.REQUEST,
      useFactory: async (dataSource: DataSource) => {
        return new VoucherService(dataSource);
      },
      inject: ['LOYALTY_CONSUMER_CONNECTION'],
    },
  ],
})
export class VoucherModule {}
```

Note: `ClientSettingsService` constructor injects a `Repository<ClientSettingsEntity>` via `@InjectRepository` (TypeORM). The consumer app's `TypeOrmModule.forRoot` registers only `ClientEntity`. To make `ClientSettingsService` work in the consumer app, register `ClientSettingsEntity` in the master connection and the repository provider — mirror `apps/admin/src/admin.module.ts` / `apps/product-consumer/src/product-consumer.module.ts`, which already make `ClientSettingsService` injectable. Read those modules first and replicate the same registration in `apps/loyalty-consumer/src/loyalty-consumer.module.ts`.

- [ ] **Step 9: Build consumer app**

Run: `yarn nest build loyalty-consumer 2>&1 | tail -10`
Expected: build succeeds.

- [ ] **Step 10: Commit**

```bash
git add apps/loyalty-consumer/src/voucher apps/loyalty-consumer/src/loyalty-consumer.module.ts
git commit -m "feat(loyalty-consumer): tier discount, cap, points earn, and level-up in purchase flow"
```

---

## Task 11: Reward claim — point price, tier gate, exclusive window

**Files:**

- Modify: `apps/loyalty-consumer/src/reward/reward.service.ts`
- Modify: `apps/loyalty-consumer/src/reward/reward.module.ts`
- Test: `apps/loyalty-consumer/src/reward/reward.service.spec.ts` (read existing, append)

**Interfaces:**

- Consumes: `RewardItemEntity` (new fields), `LoyaltyUserEntity`, `PointService`, strategy factory.
- Produces: `claimReward(userId, rewardId)` now enforces: stock → min_tier → exclusive window → balance ≥ point_price → strategy claim → on success `PointService.spend`. Provider failure rolls back the transaction (stock restored, points never spent).

- [ ] **Step 1: Write the failing test**

Read `apps/loyalty-consumer/src/reward/reward.service.spec.ts` first and match its mock style. Append:

```typescript
it('rejects claim when balance is insufficient', async () => {
  const rewardItem = {
    id: 'r1',
    stock: 5,
    point_price: 1000,
    exclusive_days: 0,
    min_tier: null,
    source: { source_type: 'gopay' },
  };
  const user = { id: 'u1', balance_points: 100, tier: null };
  rewardRepoMock.findOne.mockResolvedValue(rewardItem);
  userRepoMock.findOne.mockResolvedValue(user);
  pointServiceMock.spend.mockRejectedValue(new Error('Insufficient points'));

  await expect(service.claimReward('c1', 'r1')).rejects.toThrow(
    'Insufficient points',
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test --testPathPattern="reward.service" 2>&1 | tail -5`
Expected: FAIL — spend logic not present.

- [ ] **Step 3: Implement reward service**

`apps/loyalty-consumer/src/reward/reward.service.ts` — replace with:

```typescript
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { PointService } from '@core/loyalty/point/point.service';
import { DataSource, Repository } from 'typeorm';
import { RewardClaimStrategyFactory } from './strategy/reward-claim-strategy-factory.service';

@Injectable()
export class RewardService {
  private rewardItemRepo: Repository<RewardItemEntity>;
  private userRepo: Repository<LoyaltyUserEntity>;

  constructor(
    private dataSource: DataSource,
    private readonly strategyFactory: RewardClaimStrategyFactory,
    private readonly pointService: PointService,
  ) {
    this.rewardItemRepo = dataSource.getRepository(RewardItemEntity);
    this.userRepo = dataSource.getRepository(LoyaltyUserEntity);
  }

  async claimReward(userId: string, rewardItemId: string) {
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        const rewardItem = await transactionalEntityManager
          .getRepository(RewardItemEntity)
          .findOne({
            where: { id: rewardItemId },
            relations: ['source', 'min_tier'],
          });

        if (!rewardItem) throw new NotFoundException('Reward item not found');
        if (rewardItem.stock === 0) {
          throw new BadRequestException('Reward item is out of stock');
        }

        const user = await transactionalEntityManager
          .getRepository(LoyaltyUserEntity)
          .findOne({
            where: { core_user_id: userId },
            relations: ['tier'],
          });
        if (!user) {
          throw new BadRequestException('User has no loyalty profile');
        }

        if (
          rewardItem.min_tier &&
          (!user.tier || user.tier.level < rewardItem.min_tier.level)
        ) {
          throw new ForbiddenException(
            `This reward requires tier ${rewardItem.min_tier.name}`,
          );
        }

        if (rewardItem.exclusive_days > 0 && rewardItem.min_tier) {
          const created = new Date(rewardItem.created_at || Date.now());
          const exclusiveUntil = new Date(
            created.getTime() + rewardItem.exclusive_days * 24 * 60 * 60 * 1000,
          );
          const now = new Date();
          if (
            now < exclusiveUntil &&
            (!user.tier || user.tier.level < rewardItem.min_tier.level)
          ) {
            throw new ForbiddenException(
              `This reward is exclusive to tier ${rewardItem.min_tier.name} for now`,
            );
          }
        }

        if (
          Number(rewardItem.point_price) > 0 &&
          Number(user.balance_points) < Number(rewardItem.point_price)
        ) {
          throw new BadRequestException('Insufficient points');
        }

        if (rewardItem.stock !== -1) {
          rewardItem.stock--;
          await transactionalEntityManager
            .getRepository(RewardItemEntity)
            .save(rewardItem);
        }

        const strategy = this.strategyFactory.getStrategy(
          rewardItem.source.source_type,
        );
        const claimResult = await strategy.claim(userId, rewardItem);

        if (claimResult.status === 'FAILED') {
          throw new BadRequestException(
            claimResult.errorMessage || 'Reward claim failed',
          );
        }

        if (Number(rewardItem.point_price) > 0) {
          await this.pointService.spend(
            user,
            Number(rewardItem.point_price),
            'REWARD_CLAIM',
            rewardItem.id,
            transactionalEntityManager,
          );
        }

        return claimResult;
      },
    );
  }

  findAllRewards() {
    return this.rewardItemRepo.find({
      relations: ['source', 'min_tier'],
    });
  }
}
```

Note: `RewardItemEntity` now needs `created_at` — it does NOT extend `BaseEntity` currently. Check `libs/loyalty/src/reward-item/entities/reward-item.entity.ts` (Task 1 already replaces it); add `extends BaseEntity` if needed for `created_at` (the exclusive-window check requires it). Update the entity in Task 1 accordingly: change `export class RewardItemEntity {` to `export class RewardItemEntity extends BaseEntity {` and add the import.

- [ ] **Step 4: Update the module**

`apps/loyalty-consumer/src/reward/reward.module.ts` — replace with:

```typescript
import { Module, Scope } from '@nestjs/common';
import { RewardController } from './reward.controller';
import { RewardService } from './reward.service';
import { RewardClaimStrategyFactory } from './strategy/reward-claim-strategy-factory.service';
import { GoPayRewardStrategy } from './strategy/gopay-reward.strategy';
import { PointService } from '@core/loyalty/point/point.service';
import { DataSource } from 'typeorm';

@Module({
  controllers: [RewardController],
  providers: [
    PointService,
    RewardClaimStrategyFactory,
    GoPayRewardStrategy,
    {
      provide: 'REWARD_SERVICE',
      scope: Scope.REQUEST,
      useFactory: (
        dataSource: DataSource,
        strategyFactory: RewardClaimStrategyFactory,
      ) => new RewardService(dataSource, strategyFactory, new PointService()),
      inject: ['LOYALTY_CONSUMER_CONNECTION', RewardClaimStrategyFactory],
    },
  ],
})
export class RewardModule {}
```

- [ ] **Step 5: Run tests**

Run: `yarn test --testPathPattern="reward" 2>&1 | tail -5`
Expected: PASS (existing + new).

- [ ] **Step 6: Build consumer app**

Run: `yarn nest build loyalty-consumer 2>&1 | tail -10`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add apps/loyalty-consumer/src/reward apps/loyalty-consumer/src/voucher
git commit -m "feat(loyalty-consumer): point-priced reward claims with tier gating"
```

---

## Task 12: CMS — tier admin pages

**Files:**

- Create: `apps/frontend-cms/src/api/tiers.ts`
- Create: `apps/frontend-cms/src/components/TierForm.tsx`
- Create: `apps/frontend-cms/src/pages/TierList.tsx`
- Create: `apps/frontend-cms/src/pages/TierCreate.tsx`
- Create: `apps/frontend-cms/src/pages/TierEdit.tsx`
- Create: `apps/frontend-cms/src/pages/TierList.spec.tsx`
- Modify: `apps/frontend-cms/src/router/index.tsx`

**Interfaces:**

- Consumes: CMS auth store pattern (`useAuthStore`), page conventions from `VoucherList.tsx`.
- Produces: `getTiers()`, `getTier(id)`, `createTier(input)`, `updateTier(id, input)`, `deleteTier(id)`; routes `/tiers`, `/tiers/create`, `/tiers/:id/edit`.

- [ ] **Step 1: Write the failing spec**

`apps/frontend-cms/src/pages/TierList.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TierList from './TierList';
import * as tiersApi from '../api/tiers';

vi.mock('../api/tiers', () => ({ getTiers: vi.fn() }));

describe('TierList', () => {
  beforeEach(() => {
    (tiersApi.getTiers as any).mockResolvedValue({
      code: 'SUCCESS',
      data: [
        {
          id: 't1',
          name: 'Bronze',
          level: 1,
          min_points: 0,
          point_multiplier: 1,
        },
        {
          id: 't2',
          name: 'Gold',
          level: 2,
          min_points: 50000,
          point_multiplier: 2,
        },
      ],
      pagination: { page: 0, size: 10, total: 2 },
    });
  });

  it('renders tiers from the API', async () => {
    render(<TierList />);
    expect(await screen.findByText('Bronze')).toBeTruthy();
    expect(await screen.findByText('Gold')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run spec to verify it fails**

Run: `cd apps/frontend-cms && npx vitest run src/pages/TierList.spec.tsx 2>&1 | tail -10`
Expected: FAIL — TierList not found.

- [ ] **Step 3: Implement the API wrapper**

`apps/frontend-cms/src/api/tiers.ts`:

```typescript
import { useAuthStore } from '../store/auth.store';

export interface Tier {
  id: string;
  name: string;
  level: number;
  min_points: number;
  point_multiplier: number;
  extra_discount_percent: number;
  is_active: boolean;
  exclusive_window_hours: number;
  category_overrides?: {
    id: string;
    category: { slug: string; name: string };
    point_multiplier: number;
  }[];
}

export interface TierInput {
  name: string;
  level: number;
  min_points: number;
  point_multiplier: number;
  extra_discount_percent?: number;
  is_active?: boolean;
  exclusive_window_hours?: number;
  category_overrides?: { category_slug: string; point_multiplier: number }[];
}

const getUrl = () =>
  `${
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080'
  }/loyalty-admin/tiers`;

const getHeaders = () => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-tenant-override': tenant,
    Authorization: `Bearer ${token}`,
  };
};

export const getTiers = async (): Promise<Tier[]> => {
  const response = await fetch(`${getUrl()}?page=0&size=100`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch tiers');
  const result = await response.json();
  return result.data ?? result;
};

export const getTier = async (id: string): Promise<Tier> => {
  const response = await fetch(`${getUrl()}/${id}`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch tier');
  return response.json();
};

export const createTier = async (input: TierInput): Promise<Tier> => {
  const response = await fetch(getUrl(), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to create tier');
  return response.json();
};

export const updateTier = async (
  id: string,
  input: TierInput,
): Promise<Tier> => {
  const response = await fetch(`${getUrl()}/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to update tier');
  return response.json();
};

export const deleteTier = async (id: string): Promise<void> => {
  const response = await fetch(`${getUrl()}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete tier');
};
```

- [ ] **Step 4: Implement TierList**

`apps/frontend-cms/src/pages/TierList.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTiers, deleteTier, Tier } from '../api/tiers';

export default function TierList() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setTiers(await getTiers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this tier?')) return;
    await deleteTier(id);
    load();
  };

  if (loading) return <div className="p-8">Loading tiers...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Loyalty Tiers</h1>
        <Link
          to="/tiers/create"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + New Tier
        </Link>
      </div>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Level</th>
            <th className="text-left p-3">Min Points</th>
            <th className="text-left p-3">Multiplier</th>
            <th className="text-left p-3">Extra Disc %</th>
            <th className="text-left p-3">Active</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-3">{t.name}</td>
              <td className="p-3">{t.level}</td>
              <td className="p-3">{t.min_points}</td>
              <td className="p-3">{t.point_multiplier}x</td>
              <td className="p-3">{t.extra_discount_percent}%</td>
              <td className="p-3">{t.is_active ? 'Yes' : 'No'}</td>
              <td className="p-3 space-x-2">
                <Link to={`/tiers/${t.id}/edit`} className="text-blue-600">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Implement TierForm**

`apps/frontend-cms/src/components/TierForm.tsx`:

```tsx
import { useState } from 'react';
import { TierInput } from '../api/tiers';

export default function TierForm({
  initial,
  onSubmit,
}: {
  initial?: Partial<TierInput>;
  onSubmit: (input: TierInput) => Promise<void>;
}) {
  const [form, setForm] = useState<TierInput>({
    name: initial?.name ?? '',
    level: initial?.level ?? 1,
    min_points: initial?.min_points ?? 0,
    point_multiplier: initial?.point_multiplier ?? 1,
    extra_discount_percent: initial?.extra_discount_percent ?? 0,
    exclusive_window_hours: initial?.exclusive_window_hours ?? 0,
    is_active: initial?.is_active ?? true,
    category_overrides: initial?.category_overrides ?? [],
  });

  const set = (key: keyof TierInput, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(form);
      }}
      className="max-w-xl space-y-4"
    >
      <label className="block">
        Name
        <input
          className="border p-2 w-full"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />
      </label>
      <label className="block">
        Level
        <input
          type="number"
          className="border p-2 w-full"
          value={form.level}
          onChange={(e) => set('level', Number(e.target.value))}
          required
        />
      </label>
      <label className="block">
        Min Points
        <input
          type="number"
          step="0.01"
          className="border p-2 w-full"
          value={form.min_points}
          onChange={(e) => set('min_points', Number(e.target.value))}
          required
        />
      </label>
      <label className="block">
        Point Multiplier
        <input
          type="number"
          step="0.01"
          className="border p-2 w-full"
          value={form.point_multiplier}
          onChange={(e) => set('point_multiplier', Number(e.target.value))}
          required
        />
      </label>
      <label className="block">
        Extra Discount %
        <input
          type="number"
          step="0.01"
          className="border p-2 w-full"
          value={form.extra_discount_percent}
          onChange={(e) =>
            set('extra_discount_percent', Number(e.target.value))
          }
        />
      </label>
      <label className="block">
        Exclusive Window (hours)
        <input
          type="number"
          className="border p-2 w-full"
          value={form.exclusive_window_hours}
          onChange={(e) =>
            set('exclusive_window_hours', Number(e.target.value))
          }
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_active ?? true}
          onChange={(e) => set('is_active', e.target.checked)}
        />
        Active
      </label>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Implement TierCreate and TierEdit**

`apps/frontend-cms/src/pages/TierCreate.tsx`:

```tsx
import { useNavigate } from 'react-router-dom';
import TierForm from '../components/TierForm';
import { createTier } from '../api/tiers';

export default function TierCreate() {
  const navigate = useNavigate();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Create Tier</h1>
      <TierForm
        onSubmit={async (input) => {
          await createTier(input);
          navigate('/tiers');
        }}
      />
    </div>
  );
}
```

`apps/frontend-cms/src/pages/TierEdit.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TierForm from '../components/TierForm';
import { getTier, updateTier } from '../api/tiers';

export default function TierEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<any>(undefined);

  useEffect(() => {
    if (id) getTier(id).then((t) => setInitial(t));
  }, [id]);

  if (!initial) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Tier</h1>
      <TierForm
        initial={initial}
        onSubmit={async (input) => {
          if (id) await updateTier(id, input);
          navigate('/tiers');
        }}
      />
    </div>
  );
}
```

- [ ] **Step 7: Add routes**

Read `apps/frontend-cms/src/router/index.tsx`, add imports and routes:

```tsx
import TierList from '../pages/TierList';
import TierCreate from '../pages/TierCreate';
import TierEdit from '../pages/TierEdit';
```

```tsx
<Route path="/tiers" element={<TierList />} />
<Route path="/tiers/create" element={<TierCreate />} />
<Route path="/tiers/:id/edit" element={<TierEdit />} />
```

- [ ] **Step 8: Run spec to verify it passes**

Run: `cd apps/frontend-cms && npx vitest run src/pages/TierList.spec.tsx 2>&1 | tail -10`
Expected: PASS.

- [ ] **Step 9: Type-check**

Run: `cd apps/frontend-cms && npx tsc --noEmit 2>&1 | tail -10`
Expected: no errors in new files.

- [ ] **Step 10: Commit**

```bash
git add apps/frontend-cms/src
git commit -m "feat(cms): tier management pages"
```

---

## Task 13: CMS — reward point fields + voucher tier dropdown

**Files:**

- Create: `apps/frontend-cms/src/api/rewards.ts`
- Create: `apps/frontend-cms/src/pages/RewardList.tsx`
- Create: `apps/frontend-cms/src/pages/RewardCreate.tsx`
- Create: `apps/frontend-cms/src/pages/RewardEdit.tsx`
- Create: `apps/frontend-cms/src/pages/RewardList.spec.tsx`
- Modify: `apps/frontend-cms/src/api/vouchers.ts` (bind_type union)
- Modify: `apps/frontend-cms/src/pages/VoucherCreate.tsx`, `VoucherEdit.tsx` (tier dropdown)
- Modify: `apps/frontend-cms/src/router/index.tsx`

**Interfaces:**

- Consumes: `getTiers()` from `../api/tiers`; existing voucher form conventions.
- Produces: `getRewards()`, `createReward(input)`, `updateReward(id, input)`, `deleteReward(id)`; reward form includes `point_price`, `min_tier_id` (tier dropdown), `exclusive_days`; voucher form allows a binding of `bind_type: 'tier'` picked from a tier dropdown; routes `/rewards`, `/rewards/create`, `/rewards/:id/edit`.

- [ ] **Step 1: Write the failing spec**

`apps/frontend-cms/src/pages/RewardList.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RewardList from './RewardList';
import * as rewardsApi from '../api/rewards';

vi.mock('../api/rewards', () => ({ getRewards: vi.fn() }));

describe('RewardList', () => {
  beforeEach(() => {
    (rewardsApi.getRewards as any).mockResolvedValue([
      { id: 'r1', name: 'GoPay 10k', point_price: 1000, stock: 5 },
    ]);
  });

  it('renders rewards with point price', async () => {
    render(<RewardList />);
    expect(await screen.findByText('GoPay 10k')).toBeTruthy();
    expect(await screen.findByText('1000')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run spec to verify it fails**

Run: `cd apps/frontend-cms && npx vitest run src/pages/RewardList.spec.tsx 2>&1 | tail -10`
Expected: FAIL — module not found.

- [ ] **Step 3: Update voucher bind_type union**

`apps/frontend-cms/src/api/vouchers.ts` — change the `bind_type` union to include `'tier'`:

```typescript
  bind_type:
    | 'ROLE'
    | 'PRODUCT_TYPE'
    | 'PRODUCT_SKU'
    | 'PRODUCT_VENDOR'
    | 'USER_GROUP'
    | 'PRODUCT'
    | 'CATEGORY'
    | 'tier'
    | string;
```

- [ ] **Step 4: Implement rewards API**

`apps/frontend-cms/src/api/rewards.ts`:

```typescript
import { useAuthStore } from '../store/auth.store';

export interface Reward {
  id: string;
  name: string;
  type: string;
  stock: number;
  point_price: number;
  exclusive_days: number;
  source_id: string;
  source?: { id: string; name: string; source_type: string };
  min_tier?: { id: string; name: string } | null;
}

export interface RewardInput {
  name: string;
  type: string;
  stock: number;
  source_id: string;
  point_price?: number;
  min_tier_id?: string;
  exclusive_days?: number;
}

const getUrl = () =>
  `${
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080'
  }/loyalty-admin/reward-item`;

const getHeaders = () => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-tenant-override': tenant,
    Authorization: `Bearer ${token}`,
  };
};

export const getRewards = async (): Promise<Reward[]> => {
  const response = await fetch(`${getUrl()}?page=0&size=100`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch rewards');
  const result = await response.json();
  return result.data ?? result;
};

export const createReward = async (input: RewardInput): Promise<Reward> => {
  const response = await fetch(getUrl(), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to create reward');
  return response.json();
};

export const updateReward = async (
  id: string,
  input: RewardInput,
): Promise<Reward> => {
  const response = await fetch(`${getUrl()}/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to update reward');
  return response.json();
};

export const deleteReward = async (id: string): Promise<void> => {
  const response = await fetch(`${getUrl()}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete reward');
};
```

- [ ] **Step 5: Implement reward pages**

`apps/frontend-cms/src/pages/RewardList.tsx` (mirror TierList):

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRewards, deleteReward, Reward } from '../api/rewards';

export default function RewardList() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRewards(await getRewards());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this reward?')) return;
    await deleteReward(id);
    load();
  };

  if (loading) return <div className="p-8">Loading rewards...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rewards</h1>
        <Link
          to="/rewards/create"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + New Reward
        </Link>
      </div>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Type</th>
            <th className="text-left p-3">Stock</th>
            <th className="text-left p-3">Point Price</th>
            <th className="text-left p-3">Min Tier</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rewards.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-3">{r.name}</td>
              <td className="p-3">{r.type}</td>
              <td className="p-3">{r.stock === -1 ? '∞' : r.stock}</td>
              <td className="p-3">{r.point_price}</td>
              <td className="p-3">{r.min_tier?.name ?? '-'}</td>
              <td className="p-3 space-x-2">
                <Link to={`/rewards/${r.id}/edit`} className="text-blue-600">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Create `RewardCreate.tsx` and `RewardEdit.tsx` mirroring `TierCreate.tsx`/`TierEdit.tsx`, with a form (inline in each page is acceptable) containing: name, type, stock, source_id, point_price, exclusive_days, and a `min_tier` dropdown populated from `getTiers()`:

```tsx
import { useEffect, useState } from 'react';
import { getTiers, Tier } from '../api/tiers';
// inside component:
const [tiers, setTiers] = useState<Tier[]>([]);
useEffect(() => {
  getTiers()
    .then(setTiers)
    .catch(() => setTiers([]));
}, []);
// render:
<select value={minTierId} onChange={(e) => setMinTierId(e.target.value)}>
  <option value="">No minimum tier</option>
  {tiers.map((t) => (
    <option key={t.id} value={t.id}>
      {t.name}
    </option>
  ))}
</select>;
```

- [ ] **Step 6: Add routes**

Add to `apps/frontend-cms/src/router/index.tsx`:

```tsx
<Route path="/rewards" element={<RewardList />} />
<Route path="/rewards/create" element={<RewardCreate />} />
<Route path="/rewards/:id/edit" element={<RewardEdit />} />
```

- [ ] **Step 7: Add tier dropdown to voucher form**

In `apps/frontend-cms/src/pages/VoucherCreate.tsx` and `VoucherEdit.tsx`, where bindings are managed, load tiers and render a select when `bind_type === 'tier'`:

```tsx
import { getTiers, Tier } from '../api/tiers';
// in component:
const [tiers, setTiers] = useState<Tier[]>([]);
useEffect(() => {
  getTiers()
    .then(setTiers)
    .catch(() => setTiers([]));
}, []);
// when bind_type === 'tier':
<select
  value={binding.bind_value}
  onChange={(e) =>
    updateBinding(index, { ...binding, bind_value: e.target.value })
  }
>
  <option value="">Select tier...</option>
  {tiers.map((t) => (
    <option key={t.id} value={t.id}>
      {t.name}
    </option>
  ))}
</select>;
```

(Adjust `updateBinding` to the existing binding-editing helper in the voucher form.)

- [ ] **Step 8: Run specs**

Run: `cd apps/frontend-cms && npx vitest run src/pages/RewardList.spec.tsx 2>&1 | tail -10`
Expected: PASS.

- [ ] **Step 9: Type-check**

Run: `cd apps/frontend-cms && npx tsc --noEmit 2>&1 | tail -10`
Expected: no errors in new files.

- [ ] **Step 10: Commit**

```bash
git add apps/frontend-cms/src
git commit -m "feat(cms): reward point pricing fields and tier voucher targeting"
```

---

## Task 14: Consumer storefront — points profile, history, rewards, checkout

**Files:**

- Create: `apps/frontend-consumer/src/api/points.ts`
- Create: `apps/frontend-consumer/src/components/LoyaltyBadge.tsx`
- Create: `apps/frontend-consumer/src/pages/PointsHistoryView.tsx`
- Create: `apps/frontend-consumer/src/pages/PointsHistoryView.spec.tsx`
- Create: `apps/frontend-consumer/src/api/rewards.ts` (if missing)
- Modify: `apps/frontend-consumer/src/pages/CheckoutView.tsx`
- Modify: `apps/frontend-consumer/src/router.tsx` or `App.tsx`

**Interfaces:**

- Consumes: `useAuthStore`, checkout conventions, `calculateDiscount` from `api/vouchers.ts`.
- Produces: `getPointsProfile()`, `getPointsHistory(page, size)`, `getRewards()`, `claimReward(rewardId)`, `LoyaltyBadge` component, points history page, checkout displays tier discount + points-to-earn.

- [ ] **Step 1: Write the failing spec**

`apps/frontend-consumer/src/pages/PointsHistoryView.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PointsHistoryView from './PointsHistoryView';
import * as pointsApi from '../api/points';

vi.mock('../api/points', () => ({ getPointsHistory: vi.fn() }));

describe('PointsHistoryView', () => {
  beforeEach(() => {
    (pointsApi.getPointsHistory as any).mockResolvedValue({
      code: 'SUCCESS',
      data: [
        {
          id: 'l1',
          event_type: 'EARN',
          amount: 150,
          balance_after: 150,
          occurred_at: '2026-08-01T00:00:00Z',
        },
      ],
      pagination: { page: 0, size: 10, total: 1 },
    });
  });

  it('renders ledger entries', async () => {
    render(<PointsHistoryView />);
    expect(await screen.findByText('EARN')).toBeTruthy();
    expect(await screen.findByText('150')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run spec to verify it fails**

Run: `cd apps/frontend-consumer && npx vitest run src/pages/PointsHistoryView.spec.tsx 2>&1 | tail -10`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement points API**

`apps/frontend-consumer/src/api/points.ts`:

```typescript
import { useAuthStore } from '../store/auth.store';

const LOYALTY_API_URL =
  import.meta.env.VITE_LOYALTY_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080';

const getHeaders = () => {
  const { token, apiKey } = useAuthStore.getState();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(apiKey ? { 'x-api-key': apiKey } : {}),
  };
};

export interface PointsProfile {
  tier: { id: string; name: string; min_points: number } | null;
  lifetime_points: number;
  balance_points: number;
  next_tier: { id: string; name: string; min_points: number } | null;
}

export const getPointsProfile = async (): Promise<PointsProfile> => {
  const response = await fetch(`${LOYALTY_API_URL}/loyalty/points/profile`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch points profile');
  return response.json();
};

export const getPointsHistory = async (page = 0, size = 10) => {
  const response = await fetch(
    `${LOYALTY_API_URL}/loyalty/points/history?page=${page}&size=${size}`,
    { headers: getHeaders() },
  );
  if (!response.ok) throw new Error('Failed to fetch points history');
  return response.json();
};
```

- [ ] **Step 4: Implement LoyaltyBadge**

`apps/frontend-consumer/src/components/LoyaltyBadge.tsx`:

```tsx
import { PointsProfile } from '../api/points';

export default function LoyaltyBadge({ profile }: { profile: PointsProfile }) {
  const tier = profile.tier;
  const next = profile.next_tier;
  const currentMin = tier ? Number(tier.min_points) || 0 : 0;
  const progress =
    next && next.min_points > currentMin
      ? Math.min(
          100,
          ((profile.lifetime_points - currentMin) /
            (next.min_points - currentMin)) *
            100,
        )
      : 100;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-lg">
          {tier ? `${tier.name} Member` : 'Member'}
        </span>
        <span className="text-sm text-gray-600">
          Balance: {profile.balance_points} pts
        </span>
      </div>
      {next ? (
        <>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {profile.lifetime_points} / {next.min_points} pts to {next.name}
          </p>
        </>
      ) : (
        <p className="text-xs text-gray-500 mt-1">Top tier reached!</p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Implement PointsHistoryView**

`apps/frontend-consumer/src/pages/PointsHistoryView.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { getPointsHistory } from '../api/points';

export default function PointsHistoryView() {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    getPointsHistory().then((r) => setEntries(r.data ?? []));
  }, []);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Point History</h1>
      <div className="bg-white rounded shadow divide-y">
        {entries.map((e) => (
          <div key={e.id} className="flex justify-between p-4">
            <div>
              <span className="font-semibold">{e.event_type}</span>
              {e.reference_id && (
                <span className="text-xs text-gray-500 ml-2">
                  ref: {e.reference_id}
                </span>
              )}
            </div>
            <div className="text-right">
              <span
                className={
                  Number(e.amount) < 0 ? 'text-red-600' : 'text-green-600'
                }
              >
                {Number(e.amount) > 0 ? '+' : ''}
                {e.amount}
              </span>
              <div className="text-xs text-gray-500">
                Balance: {e.balance_after}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Implement rewards API**

`apps/frontend-consumer/src/api/rewards.ts` (create if missing):

```typescript
import { useAuthStore } from '../store/auth.store';

const LOYALTY_API_URL =
  import.meta.env.VITE_LOYALTY_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080';

export const getRewards = async () => {
  const { token, apiKey } = useAuthStore.getState();
  const response = await fetch(`${LOYALTY_API_URL}/rewards`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
  });
  if (!response.ok) throw new Error('Failed to fetch rewards');
  return response.json();
};

export const claimReward = async (rewardId: string) => {
  const { token, apiKey } = useAuthStore.getState();
  const response = await fetch(`${LOYALTY_API_URL}/rewards/claim/${rewardId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to claim reward');
  }
  return data;
};
```

- [ ] **Step 7: Update checkout to show tier discount and points-to-earn**

Read `apps/frontend-consumer/src/pages/CheckoutView.tsx` first. After the discount preview (which calls `calculateDiscount`), add a call to `getPointsProfile()` to show the user's balance, and display an estimated points line based on the final price. Minimum viable change — add to the summary section:

```tsx
import { getPointsProfile } from '../api/points';
// inside component:
const [balancePoints, setBalancePoints] = useState(0);
useEffect(() => {
  getPointsProfile()
    .then((p) => setBalancePoints(p.balance_points))
    .catch(() => setBalancePoints(0));
}, []);
// in the summary area (when finalPrice is known and pointBaseRate is assumed 1000):
{
  finalPrice > 0 && (
    <p className="text-xs text-gray-500">
      You will earn ~{Math.floor(finalPrice / 1000)} pts with this purchase
    </p>
  );
}
```

(Note: the exact points use the tenant `point_base_rate` and tier multiplier, computed server-side on purchase. The client shows an estimate; the authoritative value is in the purchase response `points_earned`.)

- [ ] **Step 8: Add points history route**

Read `apps/frontend-consumer/src/App.tsx` or `src/router.tsx` and add:

```tsx
import PointsHistoryView from './pages/PointsHistoryView';
// ...
<Route path="/points-history" element={<PointsHistoryView />} />;
```

Also add a navigation link (e.g., in the header or profile area): "Point History".

- [ ] **Step 9: Run specs**

Run: `cd apps/frontend-consumer && npx vitest run src/pages/PointsHistoryView.spec.tsx 2>&1 | tail -10`
Expected: PASS.

- [ ] **Step 10: Type-check**

Run: `cd apps/frontend-consumer && npx tsc --noEmit 2>&1 | tail -10`
Expected: no errors in new files.

- [ ] **Step 11: Commit**

```bash
git add apps/frontend-consumer/src
git commit -m "feat(consumer): points profile, history, rewards, and checkout display"
```

---

## Task 15: Full test pass and release checks

**Files:**

- None (verification only)

**Interfaces:**

- Consumes: all tasks above.

- [ ] **Step 1: Run backend unit tests**

Run: `yarn test 2>&1 | tail -20`
Expected: all suites pass (including new tier/point/user-points/points/purchase/reward specs).

- [ ] **Step 2: Build both backend apps**

Run: `yarn nest build loyalty-admin 2>&1 | tail -5 && yarn nest build loyalty-consumer 2>&1 | tail -5`
Expected: both builds succeed.

- [ ] **Step 3: Run frontend test suites**

Run:

```bash
cd apps/frontend-cms && npx vitest run 2>&1 | tail -10
cd apps/frontend-consumer && npx vitest run 2>&1 | tail -10
```

Expected: all specs pass, no regressions.

- [ ] **Step 4: Type-check both frontends**

Run:

```bash
cd apps/frontend-cms && npx tsc --noEmit 2>&1 | tail -5
cd apps/frontend-consumer && npx tsc --noEmit 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 5: Lint**

Run: `yarn lint 2>&1 | tail -10`
Expected: passes (auto-fix applied).

- [ ] **Step 6: Document verification in commit**

Run:

```bash
git add -A
git commit -m "chore: verify loyalty tier system build and tests"
```

Expected: commit succeeds (may be empty if nothing changed — in that case, skip).

---

## Appendix: Cross-references

| Spec requirement                                                        | Task(s) |
| ----------------------------------------------------------------------- | ------- |
| Entities: loyalty_tiers, category overrides, point_ledger, tier_history | Task 1  |
| loyalty_users snapshot + balances                                       | Task 1  |
| reward_items point_price/min_tier/exclusive_days                        | Task 1  |
| Tenant config point_base_rate + discount cap                            | Task 2  |
| Tier/Point shared services                                              | Task 3  |
| ACL manage:tiers / manage:points                                        | Task 4  |
| Admin tier CRUD + category overrides                                    | Task 5  |
| Admin reward pricing fields                                             | Task 6  |
| Admin user points view/history/adjust                                   | Task 7  |
| Consumer profile + history endpoints                                    | Task 8  |
| Voucher tier binding validation                                         | Task 9  |
| Purchase: tier discount + cap + points + level-up                       | Task 10 |
| Reward claim: point price + tier gate + exclusive window                | Task 11 |
| CMS tier pages                                                          | Task 12 |
| CMS reward fields + voucher tier dropdown                               | Task 13 |
| Storefront profile/history/rewards/checkout                             | Task 14 |
| Final verification                                                      | Task 15 |
