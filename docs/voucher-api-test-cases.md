# Voucher API Test Cases

## Scope

These test cases cover the voucher API and its backend application logic. Frontend tests are intentionally excluded.

Automated coverage: **116 tests passing across 11 backend voucher test suites**.

## Consumer Voucher Service

### Eligible Vouchers

- Return all vouchers when no user or binding filters are provided.
- Join target users when `user_id` is provided.
- Do not join target users when `user_id` is absent.
- Filter by a single product or category binding.
- Combine multiple binding filters with `OR` conditions.
- Skip binding filtering when the bindings array is empty.
- Map voucher entities to response DTOs.
- Return an empty list when no vouchers match.

### Claimed Vouchers

- Reject requests without a user ID.
- Return claimed vouchers with pagination metadata.
- Apply the correct `skip` and `take` values from page and size.
- Return an empty data array when the user has no claims.

### Claim Voucher

- Claim an available voucher successfully.
- Decrement voucher quota after a successful claim.
- Persist the voucher claim inside a transaction.
- Reject an unknown voucher.
- Reject a voucher with exhausted quota.
- Reject a voucher when the user is not in the target-user list.
- Allow a voucher with no target-user restriction.
- Reject duplicate claims by the same user.

### Redeem Voucher

- Record usage when the user has claimed the voucher.
- Reject redemption when the voucher has not been claimed.
- Reject redemption when the voucher was already used.
- Persist usage using the supplied transaction manager.

## Discount Validation

### Voucher Availability

- Return `Voucher not found` for an unknown code.
- Return `Voucher quota exhausted` when quota is zero or below.
- Accept a voucher with no validity windows.
- Accept a voucher inside an active validity window.
- Reject an expired validity window.
- Reject a future validity window that has not started.
- Accept a voucher when at least one of multiple validity windows is active.

### User Restrictions

- Accept a voucher with no target-user restriction.
- Accept a voucher when the current user is targeted.
- Reject a voucher when the current user is not targeted.

### Product and Category Bindings

- Accept an unbound voucher.
- Accept a matching product binding.
- Reject a non-matching product binding.
- Accept a matching category binding.
- Reject a non-matching category binding.
- Reject unsupported or non-matching binding types.

### Discount Calculations

- Calculate percentage discounts correctly.
- Calculate fixed-amount discounts correctly.
- Cap a discount at the subtotal.
- Return a zero discount for a zero-value voucher.
- Validate a voucher with simultaneous validity, target-user, and product restrictions.
- Calculate subtotal as product price multiplied by quantity.
- Pass product category names into binding validation.
- Throw `Product not found` for missing or inactive products.

## Consumer Voucher Controller

- Pass the authenticated user ID into eligible-voucher searches.
- Pass the authenticated user ID into claimed-voucher queries.
- Claim a voucher for the authenticated user.
- Calculate a discount for the authenticated user.
- Redeem a voucher for the authenticated user.

## Purchase API

- Complete a purchase without a voucher.
- Complete a purchase with a valid voucher.
- Calculate and persist subtotal, discount, and final price.
- Mark the voucher as used inside the purchase transaction.
- Reject purchases for missing products.
- Reject purchases for inactive products.
- Reject purchases when voucher validation fails.
- Do not create an order when voucher validation fails.

## Admin Voucher API

### Create

- Create a voucher with existing or new target users.
- Create a voucher without optional relations.
- Resolve voucher categories before saving.
- Resolve allow-combine categories before saving.

### Read

- Return paginated vouchers.
- Apply search filtering.
- Apply sorting and ordering.
- Handle empty search and sort parameters.
- Load a voucher by code with categories, combine categories, and target users.

### Update

- Update scalar voucher fields.
- Replace target users with resolved loyalty-user entities.
- Create missing loyalty users during update.
- Replace voucher categories with resolved entities.
- Reject updates for an unknown voucher.

### Delete

- Soft-delete a voucher by code.

## DTO Validation

- Accept valid voucher creation payloads.
- Reject missing voucher codes.
- Reject invalid voucher and discount enum values.
- Reject non-integer quotas.
- Reject non-numeric discount values.
- Reject invalid target-user UUIDs.
- Accept valid discount calculation requests.
- Reject empty voucher codes, invalid product UUIDs, and quantities below one.
- Accept purchases with and without voucher codes.
- Reject invalid purchase product UUIDs and quantities.
- Accept valid voucher bindings.
- Reject unknown binding types and empty binding values.
- Accept complete voucher categories.
- Reject incomplete voucher categories.
- Accept valid validity windows and valid days.
- Reject invalid validity types and dates.

## Verification Commands

```bash
yarn test --testPathPatterns="(loyalty-consumer/src/voucher|loyalty-admin/src/voucher)"
```

```bash
cd apps/frontend-consumer && npx vitest run
```

The frontend command is listed for reference only and is outside the current API test scope.
