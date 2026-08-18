import { MigrationInterface, QueryRunner } from 'typeorm';

export class TierLevelUpVoucher1786840000000 implements MigrationInterface {
  name = 'TierLevelUpVoucher1786840000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loyalty_tiers" ADD COLUMN IF NOT EXISTS "level_up_voucher_code" character varying`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loyalty_tiers" DROP COLUMN IF EXISTS "level_up_voucher_code"`,
    );
  }
}
