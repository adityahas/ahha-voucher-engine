import { MigrationInterface, QueryRunner } from 'typeorm';

export class VoucherUsageClaim1786747256750 implements MigrationInterface {
  name = 'VoucherUsageClaim1786747256750';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE voucher_usages ADD COLUMN IF NOT EXISTS "claim_id" integer',
    );

    // Backfill legacy usages: link each usage to the oldest claim of the
    // same user+voucher that has not already been consumed. Enables the
    // "1 use per claim" model for data created before this migration.
    await queryRunner.query(`
      UPDATE voucher_usages u
      SET claim_id = sub.claim_id
      FROM (
        SELECT
          u2.id AS usage_id,
          min(c.id) AS claim_id
        FROM voucher_usages u2
        JOIN voucher_claims c
          ON c.voucher_id = u2.voucher_id
         AND c.user_id = u2.user_id
        WHERE u2.claim_id IS NULL
        GROUP BY u2.id
      ) sub
      WHERE u.id = sub.usage_id
      AND NOT EXISTS (
        SELECT 1 FROM voucher_usages u3
        WHERE u3.claim_id = sub.claim_id
      )
    `);

    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "uq_voucher_usages_claim_id" ON voucher_usages ("claim_id")',
    );
    await queryRunner.query(`
      ALTER TABLE voucher_usages
      ADD CONSTRAINT "fk_voucher_usages_claim_id"
      FOREIGN KEY ("claim_id") REFERENCES voucher_claims("id")
      ON DELETE SET NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE voucher_usages DROP CONSTRAINT IF EXISTS "fk_voucher_usages_claim_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "uq_voucher_usages_claim_id"',
    );
    await queryRunner.query(
      'ALTER TABLE voucher_usages DROP COLUMN IF EXISTS "claim_id"',
    );
  }
}
