# Hybrid Points Product Payment Design

## Goal

Allow consumer product purchases to combine vouchers, loyalty points, and a
recorded cash remainder. The first iteration records `cash_amount` only; it
does not integrate a payment gateway.

## Chosen Approach

Extend the existing product purchase and discount-preview flow rather than
creating a parallel payment endpoint. Share one server-side calculation path
between preview and purchase, then re-run the calculation inside the purchase
transaction. This preserves existing voucher behavior and prevents the
frontend from controlling financial totals.

## Business Rules

- Tenant-configurable exchange rate with default `1 point = Rp1`.
- Voucher discount is applied before points.
- Products, vouchers, and points may be used together.
- The frontend defaults `points_to_use` to the maximum valid amount, but the
  user can edit it.
- Requests send integer `points_to_use` only.
- The backend calculates `point_discount_amount` and `cash_amount`.
- The backend rejects negative, fractional, over-balance, and over-subtotal
  point requests; it does not silently clamp them.
- `cash_amount = 0` creates a `PAID` order.
- `cash_amount > 0` creates a `PENDING_PAYMENT` order.
- No cash gateway is called in this iteration.
- Point spending is recorded in the point ledger with purchase reference and a
  negative amount.

## Calculation Contract

The shared calculation receives product, quantity, optional voucher code,
user balance, tenant point rate, and `points_to_use`:

```text
subtotal = unit_price * quantity
voucher_discount_amount = existing voucher calculation
after_voucher = subtotal - voucher_discount_amount
point_discount_amount = points_to_use * point_to_currency_rate
cash_amount = after_voucher - point_discount_amount
```

The result includes:

```json
{
  "subtotal": 50000,
  "voucher_discount_amount": 5000,
  "points_used": 20000,
  "point_discount_amount": 20000,
  "cash_amount": 25000,
  "final_price": 25000
}
```

`points_used` is an integer count of points. All monetary calculations use the
project's decimal/integer-safe conventions; no frontend-provided total is
trusted.

## Backend Changes

- Add `points_to_use?: number` to preview and purchase DTOs.
- Add or reuse tenant point-rate configuration with default `1`.
- Centralize voucher + point calculation so preview and purchase use identical
  rules.
- Extend `OrderEntity` with `subtotal`, `voucher_discount_amount`,
  `points_used`, `point_discount_amount`, `cash_amount`, `payment_status`, and
  `voucher_code` where absent.
- During purchase, recalculate inside the transaction, create the order, apply
  voucher usage, decrement applicable stock, and spend points through the
  transaction manager.
- Record point ledger reason/reference as `PRODUCT_PURCHASE` and reference the
  order ID.
- Roll back order, voucher usage, stock, and ledger changes on any failure.
- Preserve the existing purchase behavior when `points_to_use` is omitted or
  zero.

## Frontend Changes

- Load the user's point profile and tenant point rate.
- After voucher calculation, default points to
  `min(balance, floor(after_voucher / rate))`.
- Allow editing the point amount.
- Call the preview endpoint whenever quantity, voucher, or points change.
- Render subtotal, voucher discount, points used, point discount, and cash
  amount.
- Submit only `product_id`, `quantity`, `voucher_code`, and `points_to_use`.
- Display server validation errors without adjusting the user's input silently.

## Error Handling

- Invalid integer/non-negative point input returns `400`.
- Points above balance or the post-voucher subtotal return `400`.
- A changed balance between preview and purchase causes purchase rejection and
  rollback.
- Existing invalid/expired voucher errors remain unchanged.
- A cash remainder is recorded as pending and does not invoke a gateway.
- Preview never mutates balance, ledger, voucher usage, stock, or orders.

## Testing

Backend tests cover shared calculation, default/custom rate, integer and limit
validation, full-points and hybrid purchase statuses, voucher plus points,
ledger reference/negative amount, and rollback on order/ledger failure.

Frontend tests cover maximum-point defaults, editable points, preview refresh,
breakdown rendering, submit payload, and API error state.

## Success Criteria

- Existing purchases without points continue to work.
- Hybrid purchases persist the correct financial breakdown.
- Point balance and ledger remain consistent with successful purchases.
- `cash_amount` and order status are correct.
- No payment gateway is called.
