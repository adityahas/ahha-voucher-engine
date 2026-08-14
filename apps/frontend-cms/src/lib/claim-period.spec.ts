import { describe, it, expect } from 'vitest';
import { CLAIM_PERIOD_MAP, formatClaimPeriod } from './claim-period';

describe('claim-period', () => {
  it('maps every period to an id and en label', () => {
    expect(Object.keys(CLAIM_PERIOD_MAP).sort()).toEqual([
      'DAILY',
      'FREE',
      'MONTHLY',
      'ONCE',
      'WEEKLY',
    ]);
    expect(CLAIM_PERIOD_MAP.DAILY.label.id).toContain('Harian');
  });

  it('formats a period or falls back for unknown values', () => {
    expect(formatClaimPeriod('ONCE', 'en')).toBe('Once');
    expect(formatClaimPeriod('BOGUS')).toBe('BOGUS');
    expect(formatClaimPeriod(undefined)).toBe('NOT CONFIGURED');
  });
});
