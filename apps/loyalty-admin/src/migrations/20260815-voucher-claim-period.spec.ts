import { QueryRunner } from 'typeorm';
import { VoucherClaimPeriod1786745960244 } from './20260815-voucher-claim-period';

describe('VoucherClaimPeriod1786745960244', () => {
  it('adds and removes claim period and timezone columns', async () => {
    const query = jest.fn();
    const migration = new VoucherClaimPeriod1786745960244();
    const runner = { query } as unknown as QueryRunner;

    await migration.up(runner);
    await migration.down(runner);

    expect(query).toHaveBeenCalledWith(expect.stringContaining('CREATE TYPE'));
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('"claim_period"'),
    );
    expect(query).toHaveBeenCalledWith(expect.stringContaining('"timezone"'));
  });
});
