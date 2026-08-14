import { ClaimPeriod } from '@core/loyalty/voucher/entities/voucher.entity';
import {
  DEFAULT_TIMEZONE,
  resolveTimezone,
  getCurrentPeriodStartUtc,
  isWithinCurrentPeriod,
} from './claim-period.util';

describe('claim-period.util', () => {
  it('exposes a default timezone', () => {
    expect(DEFAULT_TIMEZONE).toBe('Asia/Jakarta');
  });

  it('resolveTimezone falls back to default when missing or blank', () => {
    expect(resolveTimezone(undefined)).toBe('Asia/Jakarta');
    expect(resolveTimezone(null)).toBe('Asia/Jakarta');
    expect(resolveTimezone('  ')).toBe('Asia/Jakarta');
    expect(resolveTimezone('UTC')).toBe('UTC');
  });

  describe('getCurrentPeriodStartUtc', () => {
    // 2026-08-15 17:00 UTC = 2026-08-16 00:00 WIB (UTC+7)
    const saturdayNightUtc = new Date('2026-08-15T17:00:00.000Z');

    it('returns UTC start of the current calendar day', () => {
      const start = getCurrentPeriodStartUtc(
        ClaimPeriod.DAILY,
        saturdayNightUtc,
        'Asia/Jakarta',
      );
      expect(start.toISOString()).toBe('2026-08-15T17:00:00.000Z');
    });

    it('returns UTC start of Monday for the current week', () => {
      // Sunday 2026-08-16 WIB; week started Monday 2026-08-10 (00:00 WIB)
      const start = getCurrentPeriodStartUtc(
        ClaimPeriod.WEEKLY,
        saturdayNightUtc,
        'Asia/Jakarta',
      );
      expect(start.toISOString()).toBe('2026-08-09T17:00:00.000Z');
    });

    it('returns UTC start of the current month', () => {
      const start = getCurrentPeriodStartUtc(
        ClaimPeriod.MONTHLY,
        saturdayNightUtc,
        'Asia/Jakarta',
      );
      expect(start.toISOString()).toBe('2026-07-31T17:00:00.000Z');
    });

    it('throws for FREE and ONCE', () => {
      expect(() =>
        getCurrentPeriodStartUtc(ClaimPeriod.FREE, saturdayNightUtc, 'UTC'),
      ).toThrow();
      expect(() =>
        getCurrentPeriodStartUtc(ClaimPeriod.ONCE, saturdayNightUtc, 'UTC'),
      ).toThrow();
    });
  });

  describe('isWithinCurrentPeriod', () => {
    const now = new Date('2026-08-15T17:00:00.000Z'); // 00:00 WIB Aug 16
    const prevDayWib = new Date('2026-08-15T16:59:59.999Z'); // 23:59:59 WIB Aug 15
    const currentDayWib = new Date('2026-08-15T17:00:00.000Z'); // 00:00:00 WIB Aug 16

    it('daily: previous local day is outside, current local day is inside', () => {
      expect(
        isWithinCurrentPeriod(
          ClaimPeriod.DAILY,
          prevDayWib,
          now,
          'Asia/Jakarta',
        ),
      ).toBe(false);
      expect(
        isWithinCurrentPeriod(
          ClaimPeriod.DAILY,
          currentDayWib,
          now,
          'Asia/Jakarta',
        ),
      ).toBe(true);
    });

    it('monthly: prior month is outside, same month is inside', () => {
      const lastMonth = new Date('2026-07-31T16:59:59.999Z');
      const thisMonth = new Date('2026-08-01T00:00:00.000Z');
      expect(
        isWithinCurrentPeriod(
          ClaimPeriod.MONTHLY,
          lastMonth,
          now,
          'Asia/Jakarta',
        ),
      ).toBe(false);
      expect(
        isWithinCurrentPeriod(
          ClaimPeriod.MONTHLY,
          thisMonth,
          now,
          'Asia/Jakarta',
        ),
      ).toBe(true);
    });
  });
});
