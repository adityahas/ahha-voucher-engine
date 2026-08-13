import { DataSource } from 'typeorm';
import { MigrationExecutor } from 'typeorm/migration/MigrationExecutor';
import { QueryRunner } from 'typeorm';
import { HybridPointsOrderFields1786641866502 } from './20260813-hybrid-points-order-fields';

describe('HybridPointsOrderFields1786641866502', () => {
  it('adds and removes point rate and payment columns', async () => {
    const query = jest.fn();
    const migration = new HybridPointsOrderFields1786641866502();
    const runner = { query } as unknown as QueryRunner;

    await migration.up(runner);
    await migration.down(runner);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('point_to_currency_rate'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('payment_status'),
    );
    expect(query).toHaveBeenCalledWith(expect.stringContaining('DROP TYPE'));
  });

  it('uses a TypeORM-compatible timestamp name', () => {
    const dataSource = new DataSource({
      type: 'postgres',
      migrations: [HybridPointsOrderFields1786641866502],
    });
    expect(() =>
      (new MigrationExecutor(dataSource) as any).getMigrations(),
    ).not.toThrow();
  });
});
