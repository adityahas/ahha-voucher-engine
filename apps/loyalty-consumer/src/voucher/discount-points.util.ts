export interface TierDiscountResult {
  tier_discount: number;
  combined_discount: number;
  final_price: number;
  points_earned: number;
}

export function computeTierDiscountAndPoints(params: {
  subtotal: number;
  voucherDiscount: number;
  tierExtraPercent: number;
  maxCombinedPercent: number;
  pointBaseRate: number;
  multiplier: number;
}): TierDiscountResult {
  const tierDiscount = (params.subtotal * params.tierExtraPercent) / 100;
  const rawCombined = params.voucherDiscount + tierDiscount;
  const cap = (params.subtotal * params.maxCombinedPercent) / 100;
  const combinedDiscount = Math.min(rawCombined, cap);
  const finalPrice = Math.max(0, params.subtotal - combinedDiscount);
  const pointsEarned = (finalPrice / params.pointBaseRate) * params.multiplier;
  return {
    tier_discount: tierDiscount,
    combined_discount: combinedDiscount,
    final_price: finalPrice,
    points_earned: pointsEarned,
  };
}
