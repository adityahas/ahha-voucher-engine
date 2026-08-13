# Synthetic Reward Claim Design

## Goal

Allow locally configured rewards with `source_type: "synthetic"` to be
claimed successfully without calling an external provider. This supports
development and test rewards while preserving the existing production
provider strategy behavior.

## Chosen Approach

Add a dedicated `SyntheticRewardStrategy` and register it explicitly in
`RewardClaimStrategyFactory`:

- `gopay` continues using `GoPayRewardStrategy`.
- `synthetic` uses `SyntheticRewardStrategy`.
- Unknown source types continue to fail as configuration errors rather than
  silently falling back to synthetic behavior.

## Claim Behavior

`SyntheticRewardStrategy.claim(userId, rewardItem)` returns immediately:

```ts
{
  status: 'SUCCESS',
  code: `SYNTHETIC-${rewardItem.id}-${userId}`,
}
```

The code is deterministic and traceable to both the reward and user. Synthetic
claims do not use `api_endpoint`, `apiKey`, axios, or any external network.

All existing `RewardService` behavior remains unchanged:

- reward existence and stock checks;
- loyalty profile lookup;
- tier and exclusive-window eligibility;
- stock decrement for finite rewards;
- point deduction through the transaction manager;
- rollback when claim or point deduction fails.

## Components

- Create `SyntheticRewardStrategy` implementing the existing
  `RewardClaimStrategy` interface.
- Inject it into `RewardClaimStrategyFactory` alongside the GoPay strategy.
- Add the strategy provider to the reward module.
- Add unit tests for deterministic output and factory routing.
- Add claim-flow coverage proving a synthetic reward succeeds without an HTTP
  provider call while stock and points are processed normally.

## Error Handling

Synthetic strategy itself has no expected provider failure path. Unknown source
types still throw the existing factory error. RewardService continues converting
failed strategy results into `BadRequestException` and keeps the transaction
boundary unchanged.

## Security and Scope

- No provider credential is required for synthetic claims.
- No API key or endpoint is logged or exposed by this strategy.
- No fallback is added for unknown provider types.
- No database schema change is required.
- No frontend change is required for this backend behavior.

## Testing and Success Criteria

- Strategy test returns the exact deterministic code.
- Factory test maps `synthetic` to the synthetic strategy and retains `gopay`
  mapping.
- Claim service test verifies synthetic claim success, stock/point behavior,
  and no external HTTP call.
- Loyalty-consumer tests and build pass.
- The reported claim request returns HTTP 200 with a `SUCCESS` result and the
  deterministic synthetic code.
