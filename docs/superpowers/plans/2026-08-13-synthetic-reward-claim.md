# Synthetic Reward Claim Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow rewards using `source_type: "synthetic"` to be claimed without an external provider and return a deterministic traceable code.

**Architecture:** Add a dedicated strategy implementing the existing `RewardClaimStrategy` interface, inject it into the factory, and register it in the reward module. Leave `RewardService` transaction, tier, stock, and points behavior unchanged; only strategy selection and synthetic claim output change.

**Tech Stack:** NestJS, TypeScript, Jest, TypeORM transaction service.

## Global Constraints

- `synthetic` uses `SyntheticRewardStrategy`.
- Synthetic claims return `SYNTHETIC-<rewardId>-<userId>`.
- Synthetic claims do not use `api_endpoint`, `apiKey`, axios, or external network.
- `gopay` continues using `GoPayRewardStrategy`.
- Unknown source types continue to fail as configuration errors.
- Existing stock, tier, exclusive-window, point deduction, and rollback behavior remains unchanged.
- No database schema or frontend changes are required.

---

### Task 1: Implement and register SyntheticRewardStrategy

**Files:**

- Create: `apps/loyalty-consumer/src/reward/strategy/synthetic-reward.strategy.ts`
- Create: `apps/loyalty-consumer/src/reward/strategy/synthetic-reward.strategy.spec.ts`
- Modify: `apps/loyalty-consumer/src/reward/strategy/reward-claim-strategy-factory.service.ts`
- Modify: `apps/loyalty-consumer/src/reward/reward.module.ts`
- Test: `apps/loyalty-consumer/src/reward/strategy/reward-claim-strategy-factory.service.spec.ts`

**Interfaces:**

- `SyntheticRewardStrategy implements RewardClaimStrategy`.
- `claim(userId: string, rewardItem: RewardItemEntity): Promise<ClaimResult>` returns `{ status: 'SUCCESS', code: string }`.
- `RewardClaimStrategyFactory.getStrategy(sourceType: string): RewardClaimStrategy` maps `gopay` and `synthetic` explicitly.

- [ ] **Step 1: Write the failing strategy test**

Add a test using a reward fixture `{ id: 'reward-123' }` and user ID `user-456`:

```ts
it('returns a deterministic synthetic claim code without network access', async () => {
  const strategy = new SyntheticRewardStrategy();
  await expect(
    strategy.claim('user-456', { id: 'reward-123' } as RewardItemEntity),
  ).resolves.toEqual({
    status: 'SUCCESS',
    code: 'SYNTHETIC-reward-123-user-456',
  });
});
```

- [ ] **Step 2: Run the strategy test and verify the expected failure**

Run `yarn test --runInBand apps/loyalty-consumer/src/reward/strategy/synthetic-reward.strategy.spec.ts`. Expected: FAIL because the strategy module does not exist.

- [ ] **Step 3: Implement the minimal synthetic strategy**

Create the injectable strategy with no axios import and return:

```ts
return {
  status: 'SUCCESS',
  code: `SYNTHETIC-${rewardItem.id}-${userId}`,
};
```

- [ ] **Step 4: Run the strategy test**

Run the same focused Jest command. Expected: PASS.

- [ ] **Step 5: Add factory routing tests before changing the factory**

Test that `getStrategy('synthetic')` returns the synthetic strategy, `getStrategy('gopay')` returns the GoPay strategy, and an unsupported type throws `No strategy for type unknown`.

- [ ] **Step 6: Implement factory/module wiring**

Inject both strategies into `RewardClaimStrategyFactory`, add a `case 'synthetic'`, retain the existing `gopay` case and default error, and add `SyntheticRewardStrategy` to the reward module providers.

- [ ] **Step 7: Run strategy/factory tests and consumer build**

Run `yarn test --runInBand apps/loyalty-consumer/src/reward/strategy` and `yarn nest build loyalty-consumer`. Expected: all focused tests pass and the build exits 0.

- [ ] **Step 8: Commit strategy implementation**

```bash
git add apps/loyalty-consumer/src/reward/strategy apps/loyalty-consumer/src/reward/reward.module.ts
git commit -m "feat(loyalty): support synthetic reward claims"
```

### Task 2: Verify the claim flow preserves transaction behavior

**Files:**

- Modify: `apps/loyalty-consumer/src/reward/reward.service.spec.ts`
- No production files should be modified unless required to correct a failing integration discovered by the test.

**Interfaces:**

- Consumes `SyntheticRewardStrategy` through `RewardClaimStrategyFactory`.
- Produces a successful `ClaimResult` with the deterministic code while using existing stock and point logic.

- [ ] **Step 1: Add a failing synthetic claim-flow test**

Extend the existing reward fixture with `source.source_type = 'synthetic'`, finite stock, and a point price. Assert `claimReward('user-456', 'reward-123')` returns `SUCCESS` with `SYNTHETIC-reward-123-user-456`, decrements finite stock, calls point spending with the transaction manager, and makes no axios/provider call.

- [ ] **Step 2: Run the focused reward service test and verify it fails before wiring is present**

Run `yarn test --runInBand apps/loyalty-consumer/src/reward/reward.service.spec.ts`. Expected: the new synthetic claim assertion fails until the factory/module strategy is active in the test setup.

- [ ] **Step 3: Run the full loyalty-consumer reward tests**

Run `yarn test --runInBand apps/loyalty-consumer/src/reward`. Expected: all reward service and strategy tests pass, including existing gopay, tier, stock, points, and rollback coverage.

- [ ] **Step 4: Commit claim-flow coverage**

```bash
git add apps/loyalty-consumer/src/reward/reward.service.spec.ts
git commit -m "test(loyalty): cover synthetic reward claim flow"
```

### Task 3: Runtime verification of the reported claim request

**Files:**

- No source files created or modified.

- [ ] **Step 1: Build and restart the loyalty-consumer runtime**

Run `yarn nest build loyalty-consumer` and restart the local loyalty-consumer service using the repository's existing development command/container workflow so the new strategy is loaded.

- [ ] **Step 2: Replay the authenticated claim request**

Replay the supplied POST request for reward `1b4262af-63a8-498d-a5b4-3fa20ce88fa7` using the authenticated consumer token and `x-api-key: client1-api-key`.

Expected response: HTTP 200 with `status: "SUCCESS"` and code:

```text
SYNTHETIC-1b4262af-63a8-498d-a5b4-3fa20ce88fa7-fc19febd-dff7-446d-a7dd-401f190338ae
```

- [ ] **Step 3: Confirm no external provider call occurred**

Inspect loyalty-consumer logs/network evidence. Expected: no request to `https://example.com/rewards`; the synthetic strategy returns locally.

- [ ] **Step 4: Run final verification**

Run `yarn test --runInBand apps/loyalty-consumer/src/reward && yarn nest build loyalty-consumer && git diff --check`. Expected: all reward tests pass, build succeeds, and no whitespace errors occur.
