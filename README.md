# 🧾 Ahha Voucher Engine

Ahha Voucher Engine adalah sistem backend berbasis NestJS dan TypeORM yang dirancang untuk mengelola distribusi dan penggunaan voucher dalam skenario multi-tenant (SaaS).

---

## 🔧 Teknologi

- **Backend Framework**: NestJS
- **ORM**: TypeORM
- **Database**: PostgreSQL
- **Auth**: JWT
- **Encryption**: AES (EncryptionService)
- **Multitenancy**: Per client memiliki konfigurasi database masing-masing

---

## 🧠 Arsitektur Utama

### 1. Multi-Tenant Architecture

Sistem ini mendukung model **database-per-tenant**. Setiap `Client` memiliki konfigurasi database sendiri (host, port, username, password, nama DB) yang disimpan dalam tabel `clients`. Saat request masuk, subdomain diekstrak dan dipakai untuk menentukan koneksi database aktif.

#### 🔁 Middleware:
- `SubdomainMiddleware` menangkap subdomain dan menyimpannya dalam objek request.
- `CredentialMiddleware` menyisipkan koneksi database yang sesuai.

### 2. Modul Utama

#### 📦 Voucher
Entitas utama yang mengatur:
- `code`, `description`, `quota`
- `categories`, `validities`, `bindings`, `target_users`

#### 🧷 Voucher Category
Kategori seperti `food`, `electronics`, dll. Dihubungkan via relasi ManyToMany ke voucher.

#### ⏳ Voucher Validity
Rentang tanggal dan waktu voucher berlaku.

#### 🔗 Voucher Binding
Binding voucher ke produk/brand/store tertentu menggunakan `bind_type` dan `bind_value`.

#### 👥 Target Users
Daftar user yang boleh menggunakan voucher.

#### 📤 Voucher Claim
Riwayat klaim voucher oleh user.

#### ✅ Voucher Usage
Riwayat pemakaian voucher dalam transaksi.

---

## 🔐 Autentikasi & Admin

### Admin
- Didaftarkan per client.
- Login menggunakan email dan password (bcrypt).
- Mendapatkan token JWT untuk autentikasi.

---

## 🚀 Endpoint Penting

- `POST /admin/login` – login admin
- `POST /vouchers` – membuat voucher baru
- `GET /vouchers` – mengambil semua voucher
- `POST /vouchers/claim` – klaim voucher
- `POST /vouchers/use` – gunakan voucher

> Semua endpoint berjalan dalam konteks tenant berdasarkan subdomain.

---

## 🌱 Seeder

Tersedia seeder untuk:
- `clients`: konfigurasi multitenant
- `admins`: akun login awal
- Seeder bisa dijalankan via `yarn seed`

---

## 🧪 Development Notes

- Gunakan domain seperti `client1.localhost.dev` untuk simulasi subdomain.
- Tambahkan entri di `/etc/hosts`:
  ```
  127.0.0.1 client1.localhost.dev
  ```
- Pastikan PostgreSQL berjalan dan `uuid-ossp` extension aktif.

---

## 📁 Struktur Folder

- `src/modules` – Domain logic seperti voucher
- `src/admin`, `src/client` – Manajemen admin & tenant
- `src/database` – Dynamic DB handler per tenant
- `src/encryption` – AES encryption helper
- `src/seeder` – Seeder client dan admin

---

## 📌 TODO (Pengembangan Selanjutnya)

- Fitur import voucher secara bulk
- Manajemen role-based access
- Webhook untuk notifikasi penggunaan voucher
- Dashboard analitik penggunaan voucher

---

