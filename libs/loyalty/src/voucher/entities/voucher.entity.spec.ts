import { ClaimPeriod, VoucherEntity } from './voucher.entity';

describe('VoucherEntity', () => {
  it('is an entity class', () => {
    expect(typeof VoucherEntity).toBe('function');
  });

  it('defines the five claim period options', () => {
    expect(ClaimPeriod).toEqual({
      FREE: 'FREE',
      DAILY: 'DAILY',
      WEEKLY: 'WEEKLY',
      MONTHLY: 'MONTHLY',
      ONCE: 'ONCE',
    });
  });
});
