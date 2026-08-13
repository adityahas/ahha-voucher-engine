import { MigrationInterface, QueryRunner } from 'typeorm';

export class RewardItemSourceApiKeyNullable1786641866501 implements MigrationInterface {
  name = 'RewardItemSourceApiKeyNullable1786641866501';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE reward_item_sources ALTER COLUMN "api_key" DROP NOT NULL',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Synthetic sources may intentionally omit a key. Preserve reversibility by
    // assigning a non-secret marker before restoring the legacy constraint.
    await queryRunner.query(
      'UPDATE reward_item_sources SET "api_key" = \'synthetic-backfill\' WHERE "api_key" IS NULL',
    );
    await queryRunner.query(
      'ALTER TABLE reward_item_sources ALTER COLUMN "api_key" SET NOT NULL',
    );
  }
}
