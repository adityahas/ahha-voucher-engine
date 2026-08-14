import { QueryRunner } from 'typeorm';
import { HybridPointsOrderFields1786641866502 } from './20260813-hybrid-points-order-fields';

describe('HybridPointsOrderFields1786641866502', () => {
  it('adds and removes payment columns', async () => {
    const query = jest.fn();
    const migration = new HybridPointsOrderFields1786641866502();
    const runner = { query } as unknown as QueryRunner;

    await migration.up(runner);
    await migration.down(runner);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('payment_status'),
    );
    expect(query).toHaveBeenCalledWith(expect.stringContaining('DROP TYPE'));
    expect(
      query.mock.calls.some(([sql]) => String(sql).includes('client_settings')),
    ).toBe(false);
  });

  it('creates the payment status enum only if missing (retry-safe)', async () => {
    const query = jest.fn();
    const migration = new HybridPointsOrderFields1786641866502();
    const runner = { query } as unknown as QueryRunner;

    await migration.up(runner);

    const typeSql = query.mock.calls.find(([sql]) =>
      String(sql).includes('CREATE TYPE'),
    );
    expect(typeSql).toBeDefined();
    expect(String(typeSql[0])).toContain('IF NOT EXISTS');
    expect(String(typeSql[0])).toContain('orders_payment_status_enum');
  });

  it('stores points_used as an integer count', async () => {
    const query = jest.fn();
    const migration = new HybridPointsOrderFields1786641866502();
    const runner = { query } as unknown as QueryRunner;

    await migration.up(runner);

    const ordersSql = query.mock.calls.find(([sql]) =>
      String(sql).includes('ALTER TABLE orders'),
    );
    expect(String(ordersSql[0])).toContain('"points_used" integer');
  });
});
