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

export function calculateHybridPayment(
  input: HybridPaymentInput,
): HybridPaymentBreakdown {
  const points = input.points_to_use ?? 0;
  const rate = input.point_to_currency_rate || 1;
  const afterVoucher = input.subtotal - input.voucher_discount_amount;

  if (!Number.isInteger(points) || points < 0) {
    throw new BadRequestException(
      'points_to_use must be a non-negative integer',
    );
  }
  if (points > input.user_balance_points) {
    throw new BadRequestException('points_to_use exceeds point balance');
  }
  if (points * rate > afterVoucher) {
    throw new BadRequestException(
      'points_to_use exceeds the post-voucher subtotal',
    );
  }

  const pointDiscount = points * rate;
  const cashAmount = afterVoucher - pointDiscount;
  return {
    subtotal: input.subtotal,
    voucher_discount_amount: input.voucher_discount_amount,
    points_used: points,
    point_discount_amount: pointDiscount,
    cash_amount: cashAmount,
    final_price: cashAmount,
  };
}
