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
