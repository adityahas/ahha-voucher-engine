import { describe, expect, it } from 'vitest';
import { getExpiryDate, isVoucherExpired } from './voucher-validity';
import type { VoucherValidity } from '../types/voucher';

const validity = (
  start_date: string,
  end_date: string | null,
  type = 'daily',
): VoucherValidity => ({ type, start_date, end_date });

const now = new Date('2026-08-07T12:00:00.000Z');

describe('isVoucherExpired', () => {
  it('returns false for vouchers without validities', () => {
    expect(isVoucherExpired(undefined, now)).toBe(false);
    expect(isVoucherExpired([], now)).toBe(false);
  });

  it('returns false when a validity window is currently active', () => {
    const validities = [
      validity('2024-08-01T00:00:00.000Z', '2026-12-31T23:59:59.999Z'),
    ];
    expect(isVoucherExpired(validities, now)).toBe(false);
  });

  it('returns true when every validity window has ended', () => {
    const validities = [
      validity('2024-06-01T00:00:00.000Z', '2024-08-31T23:59:59.999Z'),
    ];
    expect(isVoucherExpired(validities, now)).toBe(true);
  });

  it('returns true when a future-active window has not started yet', () => {
    const validities = [
      validity('2027-01-01T00:00:00.000Z', '2027-12-31T23:59:59.999Z'),
    ];
    expect(isVoucherExpired(validities, now)).toBe(true);
  });

  it('returns false when at least one validity is active', () => {
    const validities = [
      validity('2024-06-01T00:00:00.000Z', '2024-08-31T23:59:59.999Z'),
      validity('2026-01-01T00:00:00.000Z', '2026-12-31T23:59:59.999Z'),
    ];
    expect(isVoucherExpired(validities, now)).toBe(false);
  });

  it('treats a null end_date as never-ending (not expired)', () => {
    const validities = [validity('2024-06-01T00:00:00.000Z', null)];
    expect(isVoucherExpired(validities, now)).toBe(false);
  });
});

describe('getExpiryDate', () => {
  it('returns null when there are no validities', () => {
    expect(getExpiryDate(undefined)).toBeNull();
    expect(getExpiryDate([])).toBeNull();
  });

  it('returns the earliest future end date', () => {
    const validities = [
      validity('2024-01-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z'),
      validity('2024-01-01T00:00:00.000Z', '2027-03-01T00:00:00.000Z'),
    ];
    expect(getExpiryDate(validities)).toBe('2026-09-01T00:00:00.000Z');
  });

  it('returns null when all windows have ended', () => {
    const validities = [
      validity('2024-01-01T00:00:00.000Z', '2024-08-31T00:00:00.000Z'),
    ];
    expect(getExpiryDate(validities)).toBeNull();
  });
});
