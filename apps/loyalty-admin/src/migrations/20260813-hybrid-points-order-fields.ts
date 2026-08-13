import { MigrationInterface, QueryRunner } from 'typeorm';

export class HybridPointsOrderFields1786641866502 implements MigrationInterface {
  name = 'HybridPointsOrderFields1786641866502';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE client_settings ADD COLUMN IF NOT EXISTS "point_to_currency_rate" numeric(12,4) NOT NULL DEFAULT 1',
    );
    await queryRunner.query(
      "CREATE TYPE \"orders_payment_status_enum\" AS ENUM ('PAID', 'PENDING_PAYMENT')",
    );
    await queryRunner.query(
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS "voucher_discount_amount" numeric(12,2) NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "points_used" numeric(12,2) NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "point_discount_amount" numeric(12,2) NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "cash_amount" numeric(12,2) NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "payment_status" "orders_payment_status_enum" NOT NULL DEFAULT \'PENDING_PAYMENT\'',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE orders DROP COLUMN IF EXISTS "payment_status", DROP COLUMN IF EXISTS "cash_amount", DROP COLUMN IF EXISTS "point_discount_amount", DROP COLUMN IF EXISTS "points_used", DROP COLUMN IF EXISTS "voucher_discount_amount"',
    );
    await queryRunner.query('DROP TYPE IF EXISTS "orders_payment_status_enum"');
    await queryRunner.query(
      'ALTER TABLE client_settings DROP COLUMN IF EXISTS "point_to_currency_rate"',
    );
  }
}
