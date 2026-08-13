import { QueryRunner } from 'typeorm';
import { RewardItemSourceApiKeyNullable20260813 } from './20260813-reward-item-source-api-key-nullable';

describe('RewardItemSourceApiKeyNullable20260813', () => {
  it('changes apiKey nullability in both directions', async () => {
    const query = jest.fn();
    const migration = new RewardItemSourceApiKeyNullable20260813();
    const queryRunner = { query } as unknown as QueryRunner;

    await migration.up(queryRunner);
    await migration.down(queryRunner);

    expect(query).toHaveBeenNthCalledWith(
      1,
      'ALTER TABLE reward_item_sources ALTER COLUMN "api_key" DROP NOT NULL',
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      'ALTER TABLE reward_item_sources ALTER COLUMN "api_key" SET NOT NULL',
    );
  });
});
