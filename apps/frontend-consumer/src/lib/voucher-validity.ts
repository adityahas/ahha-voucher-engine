import type { VoucherValidity } from '../types/voucher';

export function isVoucherExpired(
  validities: VoucherValidity[] | undefined,
  now: Date = new Date(),
): boolean {
  if (!validities || validities.length === 0) {
    return false;
  }

  const hasActive = validities.some((validity) => {
    const start = new Date(validity.start_date);
    const end = validity.end_date ? new Date(validity.end_date) : null;
    return now >= start && (!end || now <= end);
  });

  return !hasActive;
}

export function getExpiryDate(
  validities: VoucherValidity[] | undefined,
): string | null {
  if (!validities || validities.length === 0) {
    return null;
  }

  const future = validities
    .filter(
      (validity) =>
        validity.end_date && new Date(validity.end_date) > new Date(),
    )
    .map((validity) => new Date(validity.end_date!));

  if (future.length === 0) {
    return null;
  }

  return new Date(
    Math.min(...future.map((date) => date.getTime())),
  ).toISOString();
}
