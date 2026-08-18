import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { clientsSeeder } from './clients.seeder';
import { ProductCategoryEntity } from '@core/product/entities/product-category.entity';
import { ProductEntity } from '@core/product/entities/product.entity';
import { VoucherCategoryEntity } from '@core/loyalty/voucher/entities/voucher-category.entity';
import {
  ClaimPeriod,
  DiscountType,
  VoucherEntity,
  VoucherType,
} from '@core/loyalty/voucher/entities/voucher.entity';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import { QuestEntity } from '@core/loyalty/quest/entities/quest.entity';
import { RewardItemSourceEntity } from '@core/loyalty/reward-item-source/entities/reward-item-source.entity';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { WarehouseEntity } from '../../../redistro/src/warehouse/entities/warehouse.entity';
import { RetailerEntity } from '../../../redistro/src/retailer/entities/retailer.entity';

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
      entities: [
        ProductCategoryEntity,
        ProductEntity,
        VoucherCategoryEntity,
        VoucherEntity,
        LoyaltyTierEntity,
        QuestEntity,
        RewardItemSourceEntity,
        RewardItemEntity,
        WarehouseEntity,
        RetailerEntity,
      ],
      synchronize: true,
    });

    try {
      await tenantDataSource.initialize();

      // 1. Seed Product Categories
      const productCatRepo = tenantDataSource.getRepository(
        ProductCategoryEntity,
      );
      const catCoffee = await seedOne(
        productCatRepo,
        { name: 'Coffee' },
        {
          name: 'Coffee',
          description: 'Olahan kopi nikmat pilihan racikan barista',
          icon: '☕',
        },
      );
      const catBakery = await seedOne(
        productCatRepo,
        { name: 'Bakery & Pastry' },
        {
          name: 'Bakery & Pastry',
          description: 'Roti dan kue panggang segar setiap hari',
          icon: '🥐',
        },
      );
      const catNonCoffee = await seedOne(
        productCatRepo,
        { name: 'Non-Coffee' },
        {
          name: 'Non-Coffee',
          description: 'Minuman segar pilihan non-kopi',
          icon: '🧋',
        },
      );
      const catDessert = await seedOne(
        productCatRepo,
        { name: 'Dessert' },
        {
          name: 'Dessert',
          description: 'Makanan penutup manis dan lezat',
          icon: '🍰',
        },
      );

      // 2. Seed Products
      const productRepo = tenantDataSource.getRepository(ProductEntity);
      await seedOne(
        productRepo,
        { sku: 'SKU-KOP-001' },
        {
          sku: 'SKU-KOP-001',
          name: 'Kopi Susu Gula Aren',
          price: 22000,
          unit: 'cup',
          stock: 150,
          description:
            'Espresso dengan susu segar dan manisnya gula aren alami',
          image_url:
            'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop',
          is_active: true,
          categories: [catCoffee],
        },
      );
      await seedOne(
        productRepo,
        { sku: 'SKU-KOP-002' },
        {
          sku: 'SKU-KOP-002',
          name: 'Espresso Double Shot',
          price: 18000,
          unit: 'cup',
          stock: 200,
          description:
            'Ekstraksi biji kopi arabika pilihan dengan cita rasa mantap',
          image_url:
            'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=600&auto=format&fit=crop',
          is_active: true,
          categories: [catCoffee],
        },
      );
      await seedOne(
        productRepo,
        { sku: 'SKU-BAK-001' },
        {
          sku: 'SKU-BAK-001',
          name: 'Butter Croissant',
          price: 25000,
          unit: 'pcs',
          stock: 60,
          description:
            'Croissant renyah berkulit emas dengan mentega prancis berkualitas',
          image_url:
            'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600&auto=format&fit=crop',
          is_active: true,
          categories: [catBakery],
        },
      );
      await seedOne(
        productRepo,
        { sku: 'SKU-NON-001' },
        {
          sku: 'SKU-NON-001',
          name: 'Matcha Latte Ice',
          price: 28000,
          unit: 'cup',
          stock: 90,
          description:
            'Matcha Jepang asli dipadu dengan susu dingin yang lembut',
          image_url:
            'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=600&auto=format&fit=crop',
          is_active: true,
          categories: [catNonCoffee],
        },
      );
      await seedOne(
        productRepo,
        { sku: 'SKU-DES-001' },
        {
          sku: 'SKU-DES-001',
          name: 'Tiramisu Cake Slice',
          price: 32000,
          unit: 'slice',
          stock: 40,
          description:
            'Kue tiramisu klasik italia bersenandung aroma mascarpone dan espresso',
          image_url:
            'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=600&auto=format&fit=crop',
          is_active: true,
          categories: [catDessert],
        },
      );

      // 3. Seed Voucher Categories
      const vCatRepo = tenantDataSource.getRepository(VoucherCategoryEntity);
      const vCatKopi = await seedOne(
        vCatRepo,
        { slug: 'diskon-kopi' },
        {
          slug: 'diskon-kopi',
          name: 'Diskon Kopi',
          description: 'Voucher hemat untuk berbagai varian minuman kopi',
          image:
            'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300',
        },
      );
      const vCatBakery = await seedOne(
        vCatRepo,
        { slug: 'promo-bakery' },
        {
          slug: 'promo-bakery',
          name: 'Promo Bakery',
          description: 'Potongan harga khusus untuk roti dan kue pilihan',
          image:
            'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300',
        },
      );
      const vCatMember = await seedOne(
        vCatRepo,
        { slug: 'special-member' },
        {
          slug: 'special-member',
          name: 'Special Member',
          description: 'Voucher eksklusif apresiasi bagi member setia',
          image:
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300',
        },
      );

      // 4. Seed Vouchers
      const voucherRepo = tenantDataSource.getRepository(VoucherEntity);
      await seedOne(
        voucherRepo,
        { code: 'WELCOME20' },
        {
          code: 'WELCOME20',
          voucher_type: VoucherType.CLAIMABLE,
          claim_period: ClaimPeriod.FREE,
          discount_type: DiscountType.PERCENTAGE,
          discount_value: 20,
          quota: 500,
          description: 'Diskon 20% khusus pengguna baru',
          image:
            'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400',
          categories: [vCatMember],
        },
      );
      await seedOne(
        voucherRepo,
        { code: 'DISCOUNT50' },
        {
          code: 'DISCOUNT50',
          voucher_type: VoucherType.CLAIMABLE,
          claim_period: ClaimPeriod.MONTHLY,
          discount_type: DiscountType.PERCENTAGE,
          discount_value: 50,
          quota: 100,
          description: 'Diskon 50% bulanan hemat maksimal',
          image:
            'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
          categories: [vCatKopi, vCatBakery],
        },
      );
      await seedOne(
        voucherRepo,
        { code: 'KOPIFREE' },
        {
          code: 'KOPIFREE',
          voucher_type: VoucherType.CLAIMABLE,
          claim_period: ClaimPeriod.WEEKLY,
          discount_type: DiscountType.FIXED_AMOUNT,
          discount_value: 15000,
          quota: 200,
          description: 'Potongan langsung Rp 15.000 untuk olahan kopi favorit',
          image:
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
          categories: [vCatKopi],
        },
      );

      // 5. Seed Loyalty Tiers
      const tierRepo = tenantDataSource.getRepository(LoyaltyTierEntity);
      await seedOne(
        tierRepo,
        { level: 1 },
        {
          name: 'Bronze',
          level: 1,
          min_points: 0,
          point_multiplier: 1.0,
          extra_discount_percent: 0,
          is_active: true,
          exclusive_window_hours: 0,
          level_up_voucher_code: null,
        },
      );
      await seedOne(
        tierRepo,
        { level: 2 },
        {
          name: 'Silver',
          level: 2,
          min_points: 100,
          point_multiplier: 1.25,
          extra_discount_percent: 5,
          is_active: true,
          exclusive_window_hours: 24,
          level_up_voucher_code: 'WELCOME20',
        },
      );
      await seedOne(
        tierRepo,
        { level: 3 },
        {
          name: 'Gold',
          level: 3,
          min_points: 500,
          point_multiplier: 1.5,
          extra_discount_percent: 10,
          is_active: true,
          exclusive_window_hours: 48,
          level_up_voucher_code: 'DISCOUNT50',
        },
      );
      await seedOne(
        tierRepo,
        { level: 4 },
        {
          name: 'Platinum',
          level: 4,
          min_points: 2000,
          point_multiplier: 2.0,
          extra_discount_percent: 15,
          is_active: true,
          exclusive_window_hours: 72,
          level_up_voucher_code: 'KOPIFREE',
        },
      );

      // 6. Seed Quests
      const questRepo = tenantDataSource.getRepository(QuestEntity);
      await seedOne(
        questRepo,
        { name: 'Pembelian Pertama' },
        {
          name: 'Pembelian Pertama',
          description:
            'Selesaikan pemesanan produk apa saja pertama kali dan dapatkan 50 poin ekstra',
        },
      );
      await seedOne(
        questRepo,
        { name: 'Pencinta Kopi' },
        {
          name: 'Pencinta Kopi',
          description:
            'Beli 5 cangkir kopi dalam seminggu untuk klaim 200 poin bonus',
        },
      );
      await seedOne(
        questRepo,
        { name: 'Weekend Special' },
        {
          name: 'Weekend Special',
          description:
            'Lakukan transaksi di hari Sabtu atau Minggu dan raih 100 poin',
        },
      );

      // 7. Seed Reward Item Sources & Reward Items
      const sourceRepo = tenantDataSource.getRepository(RewardItemSourceEntity);
      const srcGopay = await seedOne(
        sourceRepo,
        { name: 'GoPay E-Wallet' },
        {
          name: 'GoPay E-Wallet',
          source_type: 'gopay',
          api_endpoint: 'https://api.gopay.co.id/v1/topup',
          apiKey: 'gopay-secret-key-dummy',
        },
      );
      const srcPulsa = await seedOne(
        sourceRepo,
        { name: 'Pulsa Telkomsel' },
        {
          name: 'Pulsa Telkomsel',
          source_type: 'pulsa',
          api_endpoint: 'https://api.telkomsel.com/v1/pulsa',
          apiKey: 'pulsa-secret-key-dummy',
        },
      );
      const srcVoucher = await seedOne(
        sourceRepo,
        { name: 'Voucher Toko Synthetic' },
        {
          name: 'Voucher Toko Synthetic',
          source_type: 'voucher',
          api_endpoint: null,
          apiKey: null,
        },
      );

      const rewardRepo = tenantDataSource.getRepository(RewardItemEntity);
      await seedOne(
        rewardRepo,
        { name: 'Saldo GoPay Rp 10.000' },
        {
          name: 'Saldo GoPay Rp 10.000',
          source: srcGopay,
          type: 'gopay',
          stock: 100,
          point_price: 100,
          exclusive_days: 0,
        },
      );
      await seedOne(
        rewardRepo,
        { name: 'Pulsa All Operator Rp 25.000' },
        {
          name: 'Pulsa All Operator Rp 25.000',
          source: srcPulsa,
          type: 'pulsa',
          stock: 50,
          point_price: 250,
          exclusive_days: 0,
        },
      );
      await seedOne(
        rewardRepo,
        { name: 'Voucher Gratis Kopi' },
        {
          name: 'Voucher Gratis Kopi',
          source: srcVoucher,
          type: 'voucher',
          stock: 200,
          point_price: 50,
          exclusive_days: 0,
        },
      );

      // 8. Seed Redistro (Warehouses & Retailers)
      const warehouseRepo = tenantDataSource.getRepository(WarehouseEntity);
      await seedOne(
        warehouseRepo,
        { code: 'WH-JKT-01' },
        {
          code: 'WH-JKT-01',
          name: 'Gudang Utama Jakarta',
          address: 'Jl. Sudirman No. 45, Jakarta Selatan',
          is_active: true,
        },
      );
      await seedOne(
        warehouseRepo,
        { code: 'WH-BDG-01' },
        {
          code: 'WH-BDG-01',
          name: 'Gudang Cabang Bandung',
          address: 'Jl. Asia Afrika No. 12, Bandung',
          is_active: true,
        },
      );

      const retailerRepo = tenantDataSource.getRepository(RetailerEntity);
      await seedOne(
        retailerRepo,
        { name: 'Outlet Kopi Sudirman' },
        {
          name: 'Outlet Kopi Sudirman',
          phone: '081299887766',
          address: 'Kawasan SCBD Lot 8, Jakarta',
          location: '-6.2253,106.8087',
          is_active: true,
        },
      );
      await seedOne(
        retailerRepo,
        { name: 'Outlet Kopi Senopati' },
        {
          name: 'Outlet Kopi Senopati',
          phone: '081299887755',
          address: 'Jl. Senopati No. 88, Jakarta',
          location: '-6.2345,106.8123',
          is_active: true,
        },
      );

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

async function seedOne<T>(
  repo: any,
  findWhere: object,
  data: object,
): Promise<T> {
  const existing = await repo.findOne({ where: findWhere });
  if (existing) {
    return existing;
  }
  const created = repo.create(data);
  return (await repo.save(created)) as T;
}
