import { BadRequestException } from '@nestjs/common';
import { calculateHybridPayment } from './point-payment.calculator';

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
});
