import { MigrationInterface, QueryRunner } from 'typeorm';

export class VoucherClaimPeriod1786745960244 implements MigrationInterface {
  name = 'VoucherClaimPeriod1786745960244';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "vouchers_claim_period_enum" AS ENUM ('FREE', 'DAILY', 'WEEKLY', 'MONTHLY', 'ONCE');
       EXCEPTION
         WHEN duplicate_object THEN null;
       END $$;`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD COLUMN IF NOT EXISTS "claim_period" "vouchers_claim_period_enum" NOT NULL DEFAULT 'ONCE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_users" ADD COLUMN IF NOT EXISTS "timezone" character varying DEFAULT 'Asia/Jakarta'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loyalty_users" DROP COLUMN IF EXISTS "timezone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP COLUMN IF EXISTS "claim_period"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "vouchers_claim_period_enum"`);
  }
}
