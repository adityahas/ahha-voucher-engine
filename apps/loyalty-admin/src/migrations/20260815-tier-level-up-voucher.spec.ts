import { QueryRunner } from 'typeorm';
import { TierLevelUpVoucher1786840000000 } from './20260815-tier-level-up-voucher';

describe('TierLevelUpVoucher1786840000000', () => {
  it('adds the level_up_voucher_code column and drops it on down', async () => {
    const query = jest.fn();
    const migration = new TierLevelUpVoucher1786840000000();
    const runner = { query } as unknown as QueryRunner;

    await migration.up(runner);
    await migration.down(runner);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('"level_up_voucher_code"'),
    );
    expect(query).toHaveBeenCalledTimes(2);
  });
});
