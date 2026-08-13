import { BadRequestException } from '@nestjs/common';
import { calculateHybridPayment, roundMoney } from './point-payment.calculator';

describe('calculateHybridPayment', () => {
  it('applies voucher discount before points at the default rate', () => {
    expect(
      calculateHybridPayment({
        subtotal: 50000,
        voucher_discount_amount: 5000,
        user_balance_points: 30000,
        points_to_use: 20000,
      }),
    ).toEqual({
      subtotal: 50000,
      voucher_discount_amount: 5000,
      points_used: 20000,
      point_discount_amount: 20000,
      cash_amount: 25000,
      final_price: 25000,
    });
  });

  it('uses a custom point rate and zero points', () => {
    expect(
      calculateHybridPayment({
        subtotal: 100,
        voucher_discount_amount: 10,
        user_balance_points: 50,
        point_to_currency_rate: 0.5,
        points_to_use: 0,
      }),
    ).toMatchObject({
      points_used: 0,
      point_discount_amount: 0,
      cash_amount: 90,
      final_price: 90,
    });
  });

  it('treats omitted points as zero (backward compatibility)', () => {
    expect(
      calculateHybridPayment({
        subtotal: 1000,
        voucher_discount_amount: 100,
        user_balance_points: 500,
      }),
    ).toEqual({
      subtotal: 1000,
      voucher_discount_amount: 100,
      points_used: 0,
      point_discount_amount: 0,
      cash_amount: 900,
      final_price: 900,
    });
  });

  it('rounds fractional rate arithmetic to minor units', () => {
    const result = calculateHybridPayment({
      subtotal: 10000,
      voucher_discount_amount: 0,
      user_balance_points: 100,
      point_to_currency_rate: 0.333,
      points_to_use: 7,
    });
    expect(result.point_discount_amount).toBe(2.33); // 7 * 0.333 = 2.331 -> 2.33
    expect(result.cash_amount).toBe(9997.67);
    expect(result.final_price).toBe(9997.67);
  });

  it.each([
    ['fractional', 1.5],
    ['negative', -1],
    ['over balance', 11],
    ['over subtotal value', 10],
  ])('rejects %s points', (_, points) => {
    expect(() =>
      calculateHybridPayment({
        subtotal: 10,
        voucher_discount_amount: 1,
        user_balance_points: 10,
        point_to_currency_rate: 1,
        points_to_use: points,
      }),
    ).toThrow(BadRequestException);
  });

  it.each([
    ['negative subtotal', -5, 0, 10],
    ['NaN subtotal', Number.NaN, 0, 10],
    ['negative voucher discount', 100, -1, 10],
    ['negative balance', 100, 0, -1],
  ] as const)(
    'rejects %s input',
    (_label, subtotal, voucherDiscount, balance) => {
      expect(() =>
        calculateHybridPayment({
          subtotal,
          voucher_discount_amount: voucherDiscount,
          user_balance_points: balance,
        }),
      ).toThrow(BadRequestException);
    },
  );

  it('rejects a zero or negative point rate', () => {
    expect(() =>
      calculateHybridPayment({
        subtotal: 100,
        voucher_discount_amount: 0,
        user_balance_points: 10,
        point_to_currency_rate: 0,
      }),
    ).toThrow(BadRequestException);
  });

  it('allows the maximum valid points', () => {
    expect(
      calculateHybridPayment({
        subtotal: 100,
        voucher_discount_amount: 20,
        user_balance_points: 80,
        points_to_use: 80,
      }).cash_amount,
    ).toBe(0);
  });

  it('rounds money to 2 decimal places', () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(10.333)).toBe(10.33);
    expect(roundMoney(0)).toBe(0);
  });
});
