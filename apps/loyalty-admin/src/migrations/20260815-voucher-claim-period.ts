import { MigrationInterface, QueryRunner } from 'typeorm';

export class VoucherClaimPeriod1786745960244 implements MigrationInterface {
  name = 'VoucherClaimPeriod1786745960244';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "vouchers_claim_period_enum" AS ENUM ('FREE', 'DAILY', 'WEEKLY', 'MONTHLY', 'ONCE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD "claim_period" "vouchers_claim_period_enum" NOT NULL DEFAULT 'ONCE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_users" ADD "timezone" character varying DEFAULT 'Asia/Jakarta'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loyalty_users" DROP COLUMN "timezone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP COLUMN "claim_period"`,
    );
    await queryRunner.query(`DROP TYPE "vouchers_claim_period_enum"`);
  }
}
