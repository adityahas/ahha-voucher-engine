import { QueryRunner } from 'typeorm';
import { RewardItemSourceApiKeyNullable1786641866501 } from './20260813-reward-item-source-api-key-nullable';

describe('RewardItemSourceApiKeyNullable1786641866501', () => {
  it('changes apiKey nullability in both directions', async () => {
    const query = jest.fn();
    const migration = new RewardItemSourceApiKeyNullable1786641866501();
    const queryRunner = { query } as unknown as QueryRunner;

    await migration.up(queryRunner);
    await migration.down(queryRunner);

    expect(query).toHaveBeenNthCalledWith(
      1,
      'ALTER TABLE reward_item_sources ALTER COLUMN "api_key" DROP NOT NULL',
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      'UPDATE reward_item_sources SET "api_key" = \'synthetic-backfill\' WHERE "api_key" IS NULL',
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      'ALTER TABLE reward_item_sources ALTER COLUMN "api_key" SET NOT NULL',
    );
  });
});
