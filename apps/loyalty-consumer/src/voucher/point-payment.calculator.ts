import { BadRequestException } from '@nestjs/common';

export interface HybridPaymentInput {
  subtotal: number;
  voucher_discount_amount: number;
  user_balance_points: number;
  point_to_currency_rate?: number;
  points_to_use?: number;
}

export interface HybridPaymentBreakdown {
  subtotal: number;
  voucher_discount_amount: number;
  points_used: number;
  point_discount_amount: number;
  cash_amount: number;
  final_price: number;
}

/**
 * Rounds a monetary value to 2 decimal places (minor units).
 * All money values use decimal(12,2) in the database; rounding here keeps the
 * shared calculation free of floating-point drift (e.g. fractional rates).
 */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function assertFiniteNonNegative(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new BadRequestException(
      `${label} must be a finite non-negative number`,
    );
  }
}

export function calculateHybridPayment(
  input: HybridPaymentInput,
): HybridPaymentBreakdown {
  const points = input.points_to_use ?? 0;
  const rate = input.point_to_currency_rate ?? 1;

  assertFiniteNonNegative(input.subtotal, 'subtotal');
  assertFiniteNonNegative(
    input.voucher_discount_amount,
    'voucher_discount_amount',
  );
  assertFiniteNonNegative(input.user_balance_points, 'user_balance_points');
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new BadRequestException(
      'point_to_currency_rate must be a finite positive number',
    );
  }
  if (typeof points !== 'number' || !Number.isInteger(points) || points < 0) {
    throw new BadRequestException(
      'points_to_use must be a non-negative integer',
    );
  }
  if (points > input.user_balance_points) {
    throw new BadRequestException('points_to_use exceeds point balance');
  }

  const afterVoucher = roundMoney(
    input.subtotal - input.voucher_discount_amount,
  );
  const pointDiscount = roundMoney(points * rate);
  if (pointDiscount > afterVoucher) {
    throw new BadRequestException(
      'points_to_use exceeds the post-voucher subtotal',
    );
  }

  const cashAmount = roundMoney(afterVoucher - pointDiscount);
  return {
    subtotal: roundMoney(input.subtotal),
    voucher_discount_amount: roundMoney(input.voucher_discount_amount),
    points_used: points,
    point_discount_amount: pointDiscount,
    cash_amount: cashAmount,
    final_price: cashAmount,
  };
}
