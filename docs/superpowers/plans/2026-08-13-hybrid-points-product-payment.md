# Hybrid Points Product Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend product checkout so vouchers and loyalty points can reduce the recorded cash amount while preserving atomic order, stock, voucher, and point-ledger behavior.

**Architecture:** Build a shared backend calculator for preview and purchase, add the required order/payment fields and tenant point-rate configuration, then integrate the existing purchase transaction with point spending. Update the consumer checkout to preview and display the breakdown. Backend calculation, data model/ledger, and frontend API/UI tasks are independently testable; the final integration task resolves shared contract details and runs end-to-end verification.

**Tech Stack:** NestJS, TypeORM, PostgreSQL, React 19, Vite, Vitest, Jest, existing loyalty point ledger and voucher services.

## Global Constraints

- Tenant-configurable exchange rate with default `1 point = Rp1`.
- Voucher discount is applied before points.
- The frontend defaults `points_to_use` to the maximum valid amount, but the user can edit it.
- Requests send integer `points_to_use` only.
- The backend rejects negative, fractional, over-balance, and over-subtotal point requests; it does not silently clamp them.
- `cash_amount = 0` creates a `PAID` order.
- `cash_amount > 0` creates a `PENDING_PAYMENT` order.
- No cash gateway is called in this iteration.
- Point spending is recorded in the point ledger with purchase reference and a negative amount.
- Preview never mutates balance, ledger, voucher usage, stock, or orders.
- Existing purchases without points continue to work.

---

### Task 1: Implement shared hybrid payment calculation

**Files:**

- Create: `apps/loyalty-consumer/src/voucher/point-payment.calculator.ts`
- Create: `apps/loyalty-consumer/src/voucher/point-payment.calculator.spec.ts`
- Modify: `apps/loyalty-consumer/src/voucher/dto/create-purchase.dto.ts`
- Modify: `apps/loyalty-consumer/src/voucher/voucher.controller.ts`
- Modify: `apps/loyalty-consumer/src/voucher/voucher.service.ts`
- Test: `apps/loyalty-consumer/src/voucher/voucher.service.spec.ts`

**Interfaces:**

- `calculateHybridPayment(input): HybridPaymentBreakdown`.
- Input includes `subtotal`, `voucher_discount_amount`, `user_balance_points`, `point_to_currency_rate`, and `points_to_use`.
- Output includes `subtotal`, `voucher_discount_amount`, `points_used`, `point_discount_amount`, `cash_amount`, and `final_price`.
- Preview and purchase DTOs expose optional `points_to_use?: number`.

- [ ] **Step 1: Write failing calculator tests**

Cover default rate `1`, custom rate, voucher-before-points ordering, maximum valid points, zero points, fractional/negative points, points above balance, and points whose value exceeds post-voucher subtotal. Assert exact breakdown values.

- [ ] **Step 2: Run calculator tests and verify they fail**

Run `yarn test --runInBand apps/loyalty-consumer/src/voucher/point-payment.calculator.spec.ts`. Expected: module/function missing failures.

- [ ] **Step 3: Implement the pure calculator**

Use decimal-safe arithmetic consistent with the existing financial code. Reject invalid points with `BadRequestException`; never clamp. Treat omitted points as zero and rate `0`/missing as the configured default `1`.

- [ ] **Step 4: Run calculator tests**

Run the same command. Expected: PASS.

- [ ] **Step 5: Wire preview DTO/controller/service**

Accept `points_to_use` in the existing discount preview request, obtain the authenticated user's current points and tenant rate, call the shared calculator after voucher calculation, and return the complete breakdown. Ensure preview performs no writes.

- [ ] **Step 6: Add preview integration tests**

Assert voucher + points breakdown, zero-point backward compatibility, invalid point errors, and no calls to voucher usage, ledger, stock, or order repositories.

- [ ] **Step 7: Run focused backend tests and commit**

Run `yarn test --runInBand apps/loyalty-consumer/src/voucher/point-payment.calculator.spec.ts apps/loyalty-consumer/src/voucher/voucher.service.spec.ts`. Expected: all focused tests pass.

```bash
git add apps/loyalty-consumer/src/voucher
git commit -m "feat(loyalty): calculate hybrid points payments"
```

### Task 2: Add point-rate configuration and order payment fields

**Files:**

- Modify: `libs/database/src/client-settings/client-settings.types.ts`
- Modify: `libs/database/src/client-settings/client-settings.service.ts`
- Modify: `libs/product/src/entities/order.entity.ts`
- Create: `apps/loyalty-admin/src/migrations/20260813-hybrid-points-order-fields.ts`
- Test: `libs/database/src/client-settings/client-settings.service.spec.ts`

**Interfaces:**

- `point_to_currency_rate: number`, default `1`.
- Order stores `subtotal`, `voucher_discount_amount`, `points_used`, `point_discount_amount`, `cash_amount`, and `payment_status` (`PAID | PENDING_PAYMENT`), plus `voucher_code` if absent.

- [ ] **Step 1: Add failing model/config tests**

Assert tenant settings default to rate `1`, custom rate is returned, order accepts the payment fields, and payment status is restricted to `PAID` or `PENDING_PAYMENT`.

- [ ] **Step 2: Run focused tests and verify failure**

Run `yarn test --runInBand libs/database/src/client-settings/client-settings.service.spec.ts` and the order tests identified by `find libs apps -name '*order*.spec.ts'`. Expected: the new rate/order assertions fail before implementation.

- [ ] **Step 3: Implement entity/config fields and migration**

Use decimal-safe database types and nullable/default-compatible migration columns. Preserve existing rows with zero/default values and do not enable destructive synchronization.

- [ ] **Step 4: Run focused tests/build**

Run `yarn test --runInBand libs/database/src/client-settings/client-settings.service.spec.ts apps/loyalty-consumer/src/voucher/purchase.controller.spec.ts` and `yarn nest build loyalty-consumer`. Expected: PASS/build success.

- [ ] **Step 5: Commit the model/config work**

```bash
git add libs/database/src/client-settings libs/product/src/entities/order.entity.ts apps/loyalty-admin/src/migrations
git commit -m "feat(product): store hybrid payment breakdown"
```

### Task 3: Integrate purchase transaction with points and ledger

**Files:**

- Modify: `apps/loyalty-consumer/src/voucher/purchase.controller.ts`
- Modify: `apps/loyalty-consumer/src/voucher/dto/create-purchase.dto.ts`
- Modify: `apps/loyalty-consumer/src/voucher/discount-points.util.ts`
- Modify: `apps/loyalty-consumer/src/voucher/purchase.controller.spec.ts`

**Interfaces:**

- Purchase accepts `product_id`, `quantity`, optional `voucher_code`, and optional integer `points_to_use`.
- Purchase response includes all financial breakdown fields and `payment_status`.
- Ledger entry uses reason/reference `PRODUCT_PURCHASE`, negative amount, and order ID reference.

- [ ] **Step 1: Add failing purchase transaction tests**

Cover full-points `PAID`, hybrid `PENDING_PAYMENT`, voucher + points, zero-point backward compatibility, insufficient/over-limit rejection, ledger reference/negative amount, and rollback when order or ledger writes fail.

- [ ] **Step 2: Run purchase tests and verify failure**

Run `yarn test --runInBand apps/loyalty-consumer/src/voucher/purchase.controller.spec.ts`. Expected: new assertions fail because purchase ignores points and does not persist breakdown/status.

- [ ] **Step 3: Implement server-side recalculation inside the transaction**

Load the current product, user balance, tenant rate, and voucher state inside the transaction. Recalculate with the shared calculator; do not trust preview totals or frontend cash values. Create the order with the breakdown and status, decrement stock, apply voucher usage, then spend points through the transaction manager with `PRODUCT_PURCHASE` and the order ID.

- [ ] **Step 4: Preserve rollback and legacy behavior**

Ensure omitted/zero points follow the existing path and any order, voucher, stock, or ledger error aborts the entire transaction.

- [ ] **Step 5: Run backend purchase tests and commit**

Run `yarn test --runInBand apps/loyalty-consumer/src/voucher/purchase.controller.spec.ts apps/loyalty-consumer/src/voucher/voucher.service.spec.ts`. Expected: PASS.

```bash
git add apps/loyalty-consumer/src/voucher libs/product/src/entities/order.entity.ts
git commit -m "feat(loyalty): apply points during product purchase"
```

### Task 4: Update consumer checkout for editable points and breakdown

**Files:**

- Modify: `apps/frontend-consumer/src/api/purchase.ts`
- Modify: `apps/frontend-consumer/src/api/points.ts`
- Modify: `apps/frontend-consumer/src/pages/CheckoutView.tsx`
- Modify: `apps/frontend-consumer/src/pages/CheckoutView.spec.tsx`
- Test: relevant consumer API/page tests.

**Interfaces:**

- Preview request includes `points_to_use`.
- Preview response includes subtotal, voucher discount, points used, point discount, cash amount, and final price.
- Purchase request includes only product ID, quantity, voucher code, and points to use.

- [ ] **Step 1: Add failing frontend tests**

Cover maximum-point default after voucher, editable points, preview refresh on quantity/voucher/points changes, breakdown rendering, exact submit payload, and server error display.

- [ ] **Step 2: Run focused consumer tests and verify failure**

Run `cd apps/frontend-consumer && npx vitest run src/pages/CheckoutView.spec.tsx`. Expected: new points assertions fail.

- [ ] **Step 3: Implement API contract updates**

Send integer `points_to_use`; never send `cash_amount` or client-calculated totals. Parse and expose the backend breakdown and tenant rate.

- [ ] **Step 4: Implement checkout UI behavior**

Load points profile/rate, default the input to `min(balance, floor(after_voucher / rate))`, allow edits, call preview on every relevant change, display all breakdown lines, disable or show errors for invalid values, and submit the four approved fields.

- [ ] **Step 5: Run consumer tests/type-check and commit**

Run `cd apps/frontend-consumer && npx vitest run src/pages/CheckoutView.spec.tsx && npx tsc --noEmit`. Expected: PASS/type-check success.

```bash
git add apps/frontend-consumer/src/api apps/frontend-consumer/src/pages/CheckoutView.tsx
git commit -m "feat(consumer): add hybrid points checkout"
```

### Task 5: Integration verification and contract reconciliation

**Files:**

- Modify only files required to resolve compile/test contract mismatches discovered across Tasks 1-4.

- [ ] **Step 1: Run backend tests and builds**

Run `yarn test --runInBand apps/loyalty-consumer/src/voucher apps/product-consumer/src/purchase-consumer.service.spec.ts apps/product-consumer/src/purchase-consumer.controller.spec.ts` and `yarn nest build loyalty-consumer`. Expected: all relevant tests pass and build succeeds.

- [ ] **Step 2: Run consumer tests/type-check**

Run `cd apps/frontend-consumer && npx vitest run && npx tsc --noEmit`. Expected: no new failures beyond documented baseline failures.

- [ ] **Step 3: Verify preview is read-only**

Call preview with zero, partial, and maximum points and confirm balance, ledger, voucher usage, stock, and order counts remain unchanged.

- [ ] **Step 4: Verify runtime purchase scenarios**

Exercise: no points, full points (`PAID`), hybrid (`PENDING_PAYMENT`), voucher + points, insufficient points, and over-subtotal points. Confirm exact order breakdown, ledger negative amount/reference, and rollback behavior.

- [ ] **Step 5: Inspect final diff**

Run `git diff --check` and `git status --short`. Confirm no payment gateway calls, no frontend cash totals accepted by backend, no secrets, and no unrelated files modified.
