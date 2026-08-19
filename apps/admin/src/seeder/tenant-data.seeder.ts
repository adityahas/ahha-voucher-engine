import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { clientsSeeder } from './clients.seeder';

export async function seedTenantData() {
  for (const clientData of clientsSeeder) {
    console.log(`--- Seeding tenant data for ${clientData.database_name} ---`);
    const tenantDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'P4ssw0rd!',
      database: clientData.database_name,
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: false,
    });

    try {
      await tenantDataSource.initialize();
      await tenantDataSource.query(
        `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,
      );

      // 1. Product Categories
      await tenantDataSource.query(`
        CREATE TABLE IF NOT EXISTS product_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR UNIQUE NOT NULL,
          description TEXT,
          icon VARCHAR,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          deleted_at TIMESTAMPTZ
        );
      `);
      await tenantDataSource.query(`
        INSERT INTO product_categories (name, description, icon) VALUES
        ('Coffee', 'Olahan kopi nikmat pilihan racikan barista', '☕'),
        ('Bakery & Pastry', 'Roti dan kue panggang segar setiap hari', '🥐'),
        ('Non-Coffee', 'Minuman segar pilihan non-kopi', '🧋'),
        ('Dessert', 'Makanan penutup manis dan lezat', '🍰')
        ON CONFLICT (name) DO NOTHING;
      `);

      // 2. Products
      await tenantDataSource.query(`
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sku VARCHAR UNIQUE NOT NULL,
          name VARCHAR NOT NULL,
          price NUMERIC(12, 2) NOT NULL,
          unit VARCHAR NOT NULL,
          description TEXT,
          stock INT NOT NULL DEFAULT 0,
          image_url TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          deleted_at TIMESTAMPTZ
        );
      `);
      await tenantDataSource.query(`
        INSERT INTO products (sku, name, price, unit, stock, description, image_url, is_active) VALUES
        ('SKU-KOP-001', 'Kopi Susu Gula Aren', 22000.00, 'cup', 150, 'Espresso dengan susu segar dan manisnya gula aren alami', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop', true),
        ('SKU-KOP-002', 'Espresso Double Shot', 18000.00, 'cup', 200, 'Ekstraksi biji kopi arabika pilihan dengan cita rasa mantap', 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=600&auto=format&fit=crop', true),
        ('SKU-BAK-001', 'Butter Croissant', 25000.00, 'pcs', 60, 'Croissant renyah berkulit emas dengan mentega prancis berkualitas', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600&auto=format&fit=crop', true),
        ('SKU-NON-001', 'Matcha Latte Ice', 28000.00, 'cup', 90, 'Matcha Jepang asli dipadu dengan susu dingin yang lembut', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=600&auto=format&fit=crop', true),
        ('SKU-DES-001', 'Tiramisu Cake Slice', 32000.00, 'slice', 40, 'Kue tiramisu klasik italia bersenandung aroma mascarpone dan espresso', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=600&auto=format&fit=crop', true)
        ON CONFLICT (sku) DO NOTHING;
      `);

      // 3. Voucher Categories
      await tenantDataSource.query(`
        CREATE TABLE IF NOT EXISTS voucher_categories (
          slug VARCHAR PRIMARY KEY,
          name VARCHAR NOT NULL,
          description VARCHAR NOT NULL,
          image VARCHAR NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          deleted_at TIMESTAMPTZ
        );
      `);
      await tenantDataSource.query(`
        INSERT INTO voucher_categories (slug, name, description, image) VALUES
        ('diskon-kopi', 'Diskon Kopi', 'Voucher hemat untuk berbagai varian minuman kopi', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300'),
        ('promo-bakery', 'Promo Bakery', 'Potongan harga khusus untuk roti dan kue pilihan', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300'),
        ('special-member', 'Special Member', 'Voucher eksklusif apresiasi bagi member setia', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300')
        ON CONFLICT (slug) DO NOTHING;
      `);

      // 4. Vouchers
      await tenantDataSource.query(`
        DO $$ BEGIN
          CREATE TYPE "vouchers_voucher_type_enum" AS ENUM ('CLAIMABLE', 'UNIQUE_CODE');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
        DO $$ BEGIN
          CREATE TYPE "vouchers_claim_period_enum" AS ENUM ('FREE', 'DAILY', 'WEEKLY', 'MONTHLY', 'ONCE');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
        DO $$ BEGIN
          CREATE TYPE "vouchers_discount_type_enum" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `);
      await tenantDataSource.query(`
        CREATE TABLE IF NOT EXISTS vouchers (
          code VARCHAR PRIMARY KEY,
          voucher_type "vouchers_voucher_type_enum" NOT NULL DEFAULT 'CLAIMABLE',
          claim_period "vouchers_claim_period_enum" NOT NULL DEFAULT 'ONCE',
          description TEXT,
          quota INT NOT NULL DEFAULT 1,
          image TEXT,
          discount_type "vouchers_discount_type_enum" NOT NULL DEFAULT 'FIXED_AMOUNT',
          discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          deleted_at TIMESTAMPTZ
        );
      `);
      await tenantDataSource.query(`
        INSERT INTO vouchers (code, voucher_type, claim_period, description, quota, image, discount_type, discount_value) VALUES
        ('WELCOME20', 'CLAIMABLE', 'FREE', 'Diskon 20% khusus pengguna baru', 500, 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400', 'PERCENTAGE', 20.00),
        ('DISCOUNT50', 'CLAIMABLE', 'MONTHLY', 'Diskon 50% bulanan hemat maksimal', 100, 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400', 'PERCENTAGE', 50.00),
        ('KOPIFREE', 'CLAIMABLE', 'WEEKLY', 'Potongan langsung Rp 15.000 untuk olahan kopi favorit', 200, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'FIXED_AMOUNT', 15000.00)
        ON CONFLICT (code) DO NOTHING;
      `);

      // 5. Loyalty Tiers
      await tenantDataSource.query(`
        CREATE TABLE IF NOT EXISTS loyalty_tiers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR NOT NULL,
          level INT NOT NULL,
          min_points NUMERIC(12, 2) NOT NULL DEFAULT 0,
          point_multiplier NUMERIC(12, 2) NOT NULL DEFAULT 1,
          extra_discount_percent NUMERIC(12, 2) NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          exclusive_window_hours INT NOT NULL DEFAULT 0,
          level_up_voucher_code VARCHAR,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          deleted_at TIMESTAMPTZ
        );
      `);
      await tenantDataSource.query(`
        INSERT INTO loyalty_tiers (name, level, min_points, point_multiplier, extra_discount_percent, is_active, exclusive_window_hours, level_up_voucher_code) VALUES
        ('Bronze', 1, 0.00, 1.00, 0.00, true, 0, NULL),
        ('Silver', 2, 100.00, 1.25, 5.00, true, 24, 'WELCOME20'),
        ('Gold', 3, 500.00, 1.50, 10.00, true, 48, 'DISCOUNT50'),
        ('Platinum', 4, 2000.00, 2.00, 15.00, true, 72, 'KOPIFREE')
        ON CONFLICT DO NOTHING;
      `);

      // 6. Quests
      await tenantDataSource.query(`
        CREATE TABLE IF NOT EXISTS quests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR NOT NULL,
          description VARCHAR NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          deleted_at TIMESTAMPTZ
        );
      `);
      await tenantDataSource.query(`
        INSERT INTO quests (name, description) VALUES
        ('Pembelian Pertama', 'Selesaikan pemesanan produk apa saja pertama kali dan dapatkan 50 poin ekstra'),
        ('Pencinta Kopi', 'Beli 5 cangkir kopi dalam seminggu untuk klaim 200 poin bonus'),
        ('Weekend Special', 'Lakukan transaksi di hari Sabtu atau Minggu dan raih 100 poin')
        ON CONFLICT DO NOTHING;
      `);

      // 7. Reward Item Sources & Reward Items
      await tenantDataSource.query(`
        CREATE TABLE IF NOT EXISTS reward_item_sources (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR NOT NULL,
          source_type VARCHAR NOT NULL,
          api_endpoint VARCHAR,
          api_key VARCHAR
        );
      `);
      await tenantDataSource.query(`
        INSERT INTO reward_item_sources (name, source_type, api_endpoint, api_key) VALUES
        ('GoPay E-Wallet', 'gopay', 'https://api.gopay.co.id/v1/topup', 'gopay-secret-key-dummy'),
        ('Pulsa Telkomsel', 'pulsa', 'https://api.telkomsel.com/v1/pulsa', 'pulsa-secret-key-dummy'),
        ('Voucher Toko Synthetic', 'voucher', NULL, NULL)
        ON CONFLICT DO NOTHING;
      `);

      await tenantDataSource.query(`
        CREATE TABLE IF NOT EXISTS reward_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR NOT NULL,
          source_id UUID REFERENCES reward_item_sources(id),
          type VARCHAR NOT NULL,
          stock INT NOT NULL DEFAULT -1,
          point_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
          min_tier_id UUID REFERENCES loyalty_tiers(id),
          exclusive_days INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          deleted_at TIMESTAMPTZ
        );
      `);
      await tenantDataSource.query(`
        INSERT INTO reward_items (name, type, stock, point_price, exclusive_days) VALUES
        ('Saldo GoPay Rp 10.000', 'gopay', 100, 100.00, 0),
        ('Pulsa All Operator Rp 25.000', 'pulsa', 50, 250.00, 0),
        ('Voucher Gratis Kopi', 'voucher', 200, 50.00, 0)
        ON CONFLICT DO NOTHING;
      `);

      // 8. Redistro (Warehouses & Retailers)
      await tenantDataSource.query(`
        CREATE TABLE IF NOT EXISTS warehouses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR UNIQUE NOT NULL,
          name VARCHAR,
          address TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          deleted_at TIMESTAMPTZ
        );
      `);
      await tenantDataSource.query(`
        INSERT INTO warehouses (code, name, address, is_active) VALUES
        ('WH-JKT-01', 'Gudang Utama Jakarta', 'Jl. Sudirman No. 45, Jakarta Selatan', true),
        ('WH-BDG-01', 'Gudang Cabang Bandung', 'Jl. Asia Afrika No. 12, Bandung', true)
        ON CONFLICT (code) DO NOTHING;
      `);

      await tenantDataSource.query(`
        CREATE TABLE IF NOT EXISTS retailers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR,
          phone VARCHAR,
          address TEXT,
          location VARCHAR,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          deleted_at TIMESTAMPTZ
        );
      `);
      await tenantDataSource.query(`
        INSERT INTO retailers (name, phone, address, location, is_active) VALUES
        ('Outlet Kopi Sudirman', '081299887766', 'Kawasan SCBD Lot 8, Jakarta', '-6.2253,106.8087', true),
        ('Outlet Kopi Senopati', '081299887755', 'Jl. Senopati No. 88, Jakarta', '-6.2345,106.8123', true)
        ON CONFLICT DO NOTHING;
      `);

      console.log(
        `--- Tenant data for ${clientData.database_name} seeded successfully ---`,
      );
      await tenantDataSource.destroy();
    } catch (err) {
      console.error(
        `Failed to seed tenant data for ${clientData.database_name}`,
        err,
      );
    }
  }
}
