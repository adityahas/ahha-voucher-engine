## Summary

Implement and enhance the reward claim API for the loyalty-consumer application.

## Description

The goal is to enable users to claim available rewards through a dedicated API endpoint in the `loyalty-consumer`
application. This involves leveraging the existing `RewardClaimModule` and ensuring its `claimReward` functionality is
robust, handles various reward types, and integrates seamlessly with the overall application. The API should allow users
to initiate a reward claim, and the system should process the claim, updating relevant user and reward states.

## Acceptance Criteria

- A POST endpoint `/rewards/claim/:reward_id` exists in the `loyalty-consumer` application.
- The endpoint successfully processes reward claims for authenticated users.
- The `claimReward` logic in `RewardClaimService` correctly identifies the reward, applies the appropriate claiming
  strategy, and updates the reward status.
- Different reward types (e.g., GoPay) are handled correctly by their respective strategies.
- Error handling is implemented for scenarios like invalid reward IDs, insufficient stock, or ineligible users.
- The API returns a clear response indicating the success or failure of the claim.

## Proposed Sub-tasks

- [ ] Task 1: Review and confirm the functionality of the existing `RewardClaimController` and `RewardClaimService`.
- [ ] Task 2: Verify the integration of `RewardClaimModule` within `LoyaltyConsumerModule`.

- [ ] Task 3: Implement or enhance reward claiming strategies for different reward types (e.g., `GoPayRewardStrategy`).
- [ ] Task 4: Add logic for checking reward availability and user eligibility before claiming.
- [ ] Task 5: Implement transaction management to ensure atomicity of claim operations (e.g., deducting stock, assigning
  reward to user).
- [ ] Task 6: Define and implement DTOs for request and response payloads for the claim API.
- [ ] Task 7: Write unit and integration tests for the reward claim API and service.

## Anticipated Challenges & Considerations

- Ensuring proper transaction management for reward claims to prevent inconsistencies.
- Handling concurrency issues if multiple users attempt to claim the same limited reward.
- Defining clear and extensible strategies for different reward types.
- Integrating with external services for certain reward types (e.g., GoPay API).
- Comprehensive error handling and user feedback for various claim scenarios.
