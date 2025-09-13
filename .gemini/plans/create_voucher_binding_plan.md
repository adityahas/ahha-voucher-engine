## Summary

Implement API for Voucher Binding Creation in Loyalty Admin

## Description

The goal is to add a new API endpoint to the `loyalty-admin` application, specifically within the `voucher-la` module,
to enable the creation of "voucher bindings". Voucher binding refers to associating a specific voucher with a user or a
set of users, effectively assigning the voucher for their use. This API will allow administrators to programmatically
bind vouchers, which is crucial for targeted campaigns, user-specific rewards, or managing voucher distribution. The
implementation will involve extending the existing `VoucherController` and `VoucherService` to handle the new
binding logic, leveraging the `create-voucher-binding.dto.ts` for request validation.

## Acceptance Criteria

* A new POST endpoint `/loyalty-admin/vouchers/bind` (or similar, to be decided) exists in `VoucherController`.
* The endpoint accepts a `CreateVoucherBindingDto` in the request body.
* The API successfully binds the specified voucher(s) to the target user(s) or groups.
* The binding operation is atomic and handles errors gracefully (e.g., invalid voucher ID, non-existent user).
* Appropriate permissions (`write:voucher_bindings` or similar) are enforced for the new endpoint.
* The service layer (`VoucherService`) contains the business logic for creating voucher bindings, interacting with the
  database to persist the relationships.
* Unit tests are added for the new controller endpoint and service method.
* Integration tests verify the end-to-end functionality of the voucher binding API.

## Proposed Sub-tasks

- [ ] Task 1: Define the `CreateVoucherBindingDto` structure in
  `apps/loyalty-admin/src/voucher-la/dto/create-voucher-binding.dto.ts` if not already complete, ensuring it includes
  fields for voucher identification (e.g., `voucherId` or `voucherCode`) and target user identification (e.g.,
  `userIds`).
- [ ] Task 2: Create a new entity or modify an existing one (e.g., `VoucherBindingEntity` or add a relationship in
  `VoucherEntity`) to represent the voucher-user binding in the database.
- [ ] Task 3: Add a new method `createVoucherBinding` to `VoucherService` that accepts `CreateVoucherBindingDto`,
  implements the binding logic, and persists the data. This method should handle validation and error cases.
- [ ] Task 4: Add a new POST endpoint (e.g., `/bind`) to `VoucherController` that calls the `createVoucherBinding`
  method in `VoucherService`.
- [ ] Task 5: Implement appropriate authentication and authorization (e.g., `AdminJwtGuard`, `AclGuard`, `Permissions`)
  for the new binding endpoint.
- [ ] Task 6: Write unit tests for the new `createVoucherBinding` method in `VoucherService`.
- [ ] Task 7: Write unit tests for the new endpoint in `VoucherController`.
- [ ] Task 8: Update API documentation (if any) to include the new endpoint.

## Anticipated Challenges & Considerations

* **Data Model for Binding**: Deciding whether to create a new `VoucherBinding` entity or to manage the binding
  relationship directly within the `VoucherEntity` (e.g., a many-to-many relationship with users). Given the existing
  `target_users` field in `VoucherEntity`, it might be an extension of that or a separate binding entity for more
  complex scenarios (e.g., tracking binding date, status).
* **Voucher Uniqueness and Availability**: How to handle cases where a voucher can only be bound once, or if it has a
  limited number of bindings.
* **Error Handling**: Robust error handling for invalid voucher IDs, non-existent users, or already bound vouchers.
* **Performance**: For bulk binding operations, consider performance implications and potential for batch processing.
* **Permissions**: Defining the exact permission required for this operation. `write:vouchers` might be too broad,
  `write:voucher_bindings` would be more specific.
