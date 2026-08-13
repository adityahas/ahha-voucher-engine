import { MigrationInterface, QueryRunner } from 'typeorm';

export class RewardItemSourceApiKeyNullable20260813 implements MigrationInterface {
  name = 'RewardItemSourceApiKeyNullable20260813';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE reward_item_sources ALTER COLUMN "apiKey" DROP NOT NULL',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE reward_item_sources ALTER COLUMN "apiKey" SET NOT NULL',
    );
  }
}
