# Checkout: Dropdown "My Vouchers" pada Field Voucher

Tanggal: 2026-08-07
Komponen: `apps/frontend-consumer/src/pages/CheckoutView.tsx`

## Ringkasan

Ketika pengguna meng-klik field input voucher di halaman Checkout (consumer frontend),
tampilkan dropdown berisi daftar "My Vouchers" (voucher yang sudah di-claim oleh user).
Memilih salah satu item mengisi field voucher dan langsung mengaplikasikan diskon
secara otomatis (tanpa perlu mengklik tombol APPLY).

## Backend / API

Tidak ada perubahan backend. Memanfaatkan endpoint yang sudah ada:

- `GET /loyalty/vouchers/my?page=0&size=10` → `getClaimedVouchers()` dari
  `apps/frontend-consumer/src/api/vouchers.ts`.
- Tipe `ClaimedVoucherInfo { id, created_at, voucher }` dan `Voucher` sudah ada di
  `apps/frontend-consumer/src/types/voucher.ts`.

## Perilaku

1. Klik field voucher → **lazy fetch** `getClaimedVouchers()` → dropdown terbuka,
   dengan indikator "Loading…" selama request berjalan.
2. Setiap item menampilkan **kode voucher + nama + info diskon**
   (`discount_type` / `discount_value`, mis. `FIXED_AMOUNT 10000` → `−Rp 10.000`).
3. Memilih item → set `voucherCode` ke kode voucher + **auto-apply**:
   panggil `calculateDiscount` (logika sama dengan tombol APPLY) tanpa klik tambahan.
4. Dropdown tertutup pada salah satu kondisi berikut:
   - memilih sebuah item,
   - mengklik di luar field (outside click),
   - menekan tombol ESC,
   - setelah apply sukses.
5. Error ketika fetch gagal → tampilkan pesan singkat di dalam dropdown.

## Implementasi

File yang diubah: hanya `apps/frontend-consumer/src/pages/CheckoutView.tsx`
(dirga dengan spec test `CheckoutView.spec.tsx`).

### State baru

- `voucherDropdownOpen: boolean`
- `myVouchers: ClaimedVoucherInfo[] | null`
- `voucherLoading: boolean`
- `voucherFetchError: string | null`

### Handler baru

- `handleToggleVoucherDropdown()` — membuka/menutup dropdown; lazy fetch dijalankan
  sekali per buka (jika belum pernah diambil pada sesi).
- `handleSelectVoucher(claimed: ClaimedVoucherInfo)` — set
  `voucherCode = claimed.voucher.code.toUpperCase(); setCalculation(null);`
  tutup dropdown, lalu panggil logika apply (sama dengan `handleApplyVoucher`).

### Referensi & penutupan

- `dropdownRef` (ref field wrapper) + event listener global `pointerdown` untuk
  deteksi outside click.
- `onKeyDown` ESC untuk menutup dropdown.
- Dropdown dirender dalam `div.relative` yang sama dengan field, memakai
  `AnimatePresence` (Framer Motion) yang sudah tersedia, dengan gaya
  glass/backdrop yang konsisten dengan item saya.

## Anti-fitur (YAGNI)

- Tidak ada pencarian / filter di dalam dropdown.
- Tidak ada tombol refresh manual; data diambil sekali per sesi buka field.
- Tidak ada perubahan pada tipe `ClaimedVoucherInfo` / `Voucher`.

## Pengujian (Automation Engineer)

Tambahkan ke `apps/frontend-consumer/src/pages/CheckoutView.spec.tsx`:

1. Klik field → `getClaimedVouchers` dipanggil; kode voucher muncul di dropdown.
2. Klik item → `voucherCode` terisi dan `calculateDiscount` terpanggil otomatis.
3. Dropdown tertutup ketika mengklik di luar field.
4. Fetch gagal → pesan error ditampilkan di dalam dropdown.

Mock `getClaimedVouchers` perlu ditambahkan ke mock module `../api/vouchers` dan
pada test.
