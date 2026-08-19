const API_BASE = process.env.API_BASE_URL || 'https://api.adityahadi.my.id';
const SUBDOMAIN = process.env.CLIENT_SUBDOMAIN || 'client1';
const API_KEY = process.env.CLIENT_API_KEY || 'client1-api-key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@client1.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function main() {
  console.log(
    `🚀 Starting API Seeder against ${API_BASE} for tenant '${SUBDOMAIN}'...`,
  );

  // 1. Admin Login
  const loginRes = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'x-tenant-override': SUBDOMAIN,
    },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!loginRes.ok) {
    const errText = await loginRes.text();
    throw new Error(`Login failed (HTTP ${loginRes.status}): ${errText}`);
  }

  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log(`✅ Logged in successfully as ${ADMIN_EMAIL}.`);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-api-key': API_KEY,
    'x-tenant-override': SUBDOMAIN,
  };

  // Helper for API posts
  async function postItem(path, payload, itemName) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const resText = await res.text();
      let resJson;
      try {
        resJson = JSON.parse(resText);
      } catch {}

      if (res.ok || res.status === 201 || res.status === 200) {
        console.log(`  ✅ Seeded ${itemName} (${path})`);
        return resJson;
      } else {
        console.log(
          `  ⚠️ Notice for ${itemName} (${path}) [HTTP ${res.status}]: ${resText.slice(0, 120)}`,
        );
        return null;
      }
    } catch (err) {
      console.error(`  ❌ Error seeding ${itemName}:`, err.message);
      return null;
    }
  }

  // 2. Seed Product Categories
  console.log('\n📦 Seeding Product Categories...');
  await postItem(
    '/product-admin/product-categories',
    {
      name: 'Coffee',
      description: 'Olahan kopi nikmat racikan barista',
      icon: '☕',
    },
    'Category Coffee',
  );
  await postItem(
    '/product-admin/product-categories',
    {
      name: 'Bakery & Pastry',
      description: 'Roti dan kue panggang segar setiap hari',
      icon: '🥐',
    },
    'Category Bakery',
  );
  await postItem(
    '/product-admin/product-categories',
    {
      name: 'Non-Coffee',
      description: 'Minuman segar pilihan non-kopi',
      icon: '🧋',
    },
    'Category Non-Coffee',
  );
  await postItem(
    '/product-admin/product-categories',
    {
      name: 'Dessert',
      description: 'Makanan penutup manis dan lezat',
      icon: '🍰',
    },
    'Category Dessert',
  );

  // 3. Seed Products
  console.log('\n☕ Seeding Products...');
  await postItem(
    '/product-admin/products',
    {
      sku: 'SKU-KOP-001',
      name: 'Kopi Susu Gula Aren',
      price: 22000,
      unit: 'cup',
      stock: 150,
      description: 'Espresso dengan susu segar dan manisnya gula aren alami',
      image_url:
        'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop',
      is_active: true,
    },
    'Kopi Susu Gula Aren',
  );

  await postItem(
    '/product-admin/products',
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
    },
    'Espresso Double Shot',
  );

  await postItem(
    '/product-admin/products',
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
    },
    'Butter Croissant',
  );

  await postItem(
    '/product-admin/products',
    {
      sku: 'SKU-NON-001',
      name: 'Matcha Latte Ice',
      price: 28000,
      unit: 'cup',
      stock: 90,
      description: 'Matcha Jepang asli dipadu dengan susu dingin yang lembut',
      image_url:
        'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=600&auto=format&fit=crop',
      is_active: true,
    },
    'Matcha Latte Ice',
  );

  await postItem(
    '/product-admin/products',
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
    },
    'Tiramisu Cake Slice',
  );

  // 4. Seed Voucher Categories
  console.log('\n🏷️ Seeding Voucher Categories...');
  await postItem(
    '/loyalty-admin/voucher-categories',
    {
      slug: 'diskon-kopi',
      name: 'Diskon Kopi',
      description: 'Voucher hemat untuk berbagai varian minuman kopi',
      image:
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300',
    },
    'Voucher Category Diskon Kopi',
  );

  await postItem(
    '/loyalty-admin/voucher-categories',
    {
      slug: 'promo-bakery',
      name: 'Promo Bakery',
      description: 'Potongan harga khusus untuk roti dan kue pilihan',
      image:
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300',
    },
    'Voucher Category Promo Bakery',
  );

  await postItem(
    '/loyalty-admin/voucher-categories',
    {
      slug: 'special-member',
      name: 'Special Member',
      description: 'Voucher eksklusif apresiasi bagi member setia',
      image:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300',
    },
    'Voucher Category Special Member',
  );

  // 5. Seed Vouchers
  console.log('\n🎟️ Seeding Vouchers...');
  await postItem(
    '/loyalty-admin/vouchers',
    {
      code: 'WELCOME20',
      voucher_type: 'CLAIMABLE',
      claim_period: 'FREE',
      discount_type: 'PERCENTAGE',
      discount_value: 20,
      quota: 500,
      description: 'Diskon 20% khusus pengguna baru',
      image:
        'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400',
    },
    'Voucher WELCOME20',
  );

  await postItem(
    '/loyalty-admin/vouchers',
    {
      code: 'DISCOUNT50',
      voucher_type: 'CLAIMABLE',
      claim_period: 'MONTHLY',
      discount_type: 'PERCENTAGE',
      discount_value: 50,
      quota: 100,
      description: 'Diskon 50% bulanan hemat maksimal',
      image:
        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
    },
    'Voucher DISCOUNT50',
  );

  await postItem(
    '/loyalty-admin/vouchers',
    {
      code: 'KOPIFREE',
      voucher_type: 'CLAIMABLE',
      claim_period: 'WEEKLY',
      discount_type: 'FIXED_AMOUNT',
      discount_value: 15000,
      quota: 200,
      description: 'Potongan langsung Rp 15.000 untuk olahan kopi favorit',
      image:
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    },
    'Voucher KOPIFREE',
  );

  // 6. Seed Loyalty Tiers
  console.log('\n👑 Seeding Loyalty Tiers...');
  await postItem(
    '/loyalty-admin/tiers',
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
    'Tier Silver',
  );

  await postItem(
    '/loyalty-admin/tiers',
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
    'Tier Gold',
  );

  await postItem(
    '/loyalty-admin/tiers',
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
    'Tier Platinum',
  );

  // 7. Seed Quests
  console.log('\n🎯 Seeding Quests...');
  await postItem(
    '/loyalty-admin/quest/',
    {
      name: 'Pembelian Pertama',
      description:
        'Selesaikan pemesanan produk apa saja pertama kali dan dapatkan 50 poin ekstra',
    },
    'Quest Pembelian Pertama',
  );

  await postItem(
    '/loyalty-admin/quest/',
    {
      name: 'Pencinta Kopi',
      description:
        'Beli 5 cangkir kopi dalam seminggu untuk klaim 200 poin bonus',
    },
    'Quest Pencinta Kopi',
  );

  await postItem(
    '/loyalty-admin/quest/',
    {
      name: 'Weekend Special',
      description:
        'Lakukan transaksi di hari Sabtu atau Minggu dan raih 100 poin',
    },
    'Quest Weekend Special',
  );

  // 8. Seed Reward Item Sources & Reward Items
  console.log('\n🎁 Seeding Reward Item Sources & Items...');
  const srcGopay = await postItem(
    '/loyalty-admin/reward-item-source',
    {
      name: 'GoPay E-Wallet',
      source_type: 'gopay',
      api_endpoint: 'https://api.gopay.co.id/v1/topup',
      apiKey: 'gopay-secret-key-dummy',
    },
    'Reward Source GoPay',
  );

  const srcPulsa = await postItem(
    '/loyalty-admin/reward-item-source',
    {
      name: 'Pulsa Telkomsel',
      source_type: 'pulsa',
      api_endpoint: 'https://api.telkomsel.com/v1/pulsa',
      apiKey: 'pulsa-secret-key-dummy',
    },
    'Reward Source Pulsa',
  );

  const srcVoucher = await postItem(
    '/loyalty-admin/reward-item-source',
    {
      name: 'Voucher Toko Synthetic',
      source_type: 'voucher',
      api_endpoint: null,
      apiKey: null,
    },
    'Reward Source Voucher',
  );

  if (srcGopay?.id) {
    await postItem(
      '/loyalty-admin/reward-item',
      {
        name: 'Saldo GoPay Rp 10.000',
        source_id: srcGopay.id,
        type: 'gopay',
        stock: 100,
        point_price: 100,
        exclusive_days: 0,
      },
      'Reward Item GoPay',
    );
  }

  if (srcPulsa?.id) {
    await postItem(
      '/loyalty-admin/reward-item',
      {
        name: 'Pulsa All Operator Rp 25.000',
        source_id: srcPulsa.id,
        type: 'pulsa',
        stock: 50,
        point_price: 250,
        exclusive_days: 0,
      },
      'Reward Item Pulsa',
    );
  }

  if (srcVoucher?.id) {
    await postItem(
      '/loyalty-admin/reward-item',
      {
        name: 'Voucher Gratis Kopi',
        source_id: srcVoucher.id,
        type: 'voucher',
        stock: 200,
        point_price: 50,
        exclusive_days: 0,
      },
      'Reward Item Voucher',
    );
  }

  // 9. Seed Redistro
  console.log('\n🏬 Seeding Redistro Warehouses & Retailers...');
  await postItem(
    '/redistro/warehouses',
    {
      name: 'Gudang Utama Jakarta',
      location: 'Jakarta',
    },
    'Warehouse Jakarta',
  );

  await postItem(
    '/redistro/warehouses',
    {
      name: 'Gudang Cabang Bandung',
      location: 'Bandung',
    },
    'Warehouse Bandung',
  );

  await postItem(
    '/redistro/retailers',
    {
      name: 'Outlet Kopi Sudirman',
      phone: '081299887766',
      address: 'Kawasan SCBD Lot 8, Jakarta',
      location: '-6.2253,106.8087',
      is_active: true,
    },
    'Retailer Sudirman',
  );

  await postItem(
    '/redistro/retailers',
    {
      name: 'Outlet Kopi Senopati',
      phone: '081299887755',
      address: 'Jl. Senopati No. 88, Jakarta',
      location: '-6.2345,106.8123',
      is_active: true,
    },
    'Retailer Senopati',
  );

  console.log('\n✨ API Seeding completed successfully!');
}

main().catch((err) => {
  console.error('API Seeder error:', err);
  process.exit(1);
});
