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

## 🎬 How to run

### ⚡ Quick Start (Docker Compose Dev Launcher)

Run all microservices, frontends, Postgres, and Redis with live hot-reloading:

```bash
yarn dev
# or
make dev
```

#### Selective Service Launching

| Environment / Profile  | Command (Yarn)      | Command (Make)      | Description                                            |
| :--------------------- | :------------------ | :------------------ | :----------------------------------------------------- |
| **Full Stack**         | `yarn dev`          | `make dev`          | Launches all 10 microservices & frontends + DB + Redis |
| **Backend Only**       | `yarn dev:backend`  | `make dev-backend`  | Launches all 8 NestJS microservices + DB + Redis       |
| **Frontends Only**     | `yarn dev:frontend` | `make dev-frontend` | Launches CMS (5173) and Storefront (5174)              |
| **Admin Ecosystem**    | `yarn dev:admin`    | `make dev-admin`    | Launches Admin APIs + CMS Admin Frontend               |
| **Consumer Ecosystem** | `yarn dev:consumer` | `make dev-consumer` | Launches Consumer APIs + Storefront Frontend           |
| **Infra Only**         | `yarn dev:infra`    | `make dev-infra`    | Launches Postgres (5432) and Redis (6379) only         |

#### Stop Dev Services

```bash
yarn dev:down
# or
make dev-down
```

---

### 🌐 Service Ports Summary

- **CMS Admin Panel**: `http://localhost:5173`
- **Consumer Storefront**: `http://localhost:5174`
- **Admin API**: `http://localhost:9002`
- **Loyalty Admin API**: `http://localhost:9003`
- **User Admin API**: `http://localhost:9004`
- **Loyalty Consumer API**: `http://localhost:9005`
- **User Consumer API**: `http://localhost:9006`
- **Product Admin API**: `http://localhost:9007`
- **Product Consumer API**: `http://localhost:9008`
- **Redistro API**: `http://localhost:9009`

---

### 🛠️ Manual / Native Setup (Optional)

1. Install dependencies: `yarn install`
2. Run database & redis: `make dev-infra`
3. Run seed: `yarn seed`
4. Run individual microservice natively:
   - `yarn start:admin --watch`
   - `yarn start:loyalty-admin --watch`
   - `yarn start:loyalty-consumer --watch`
   - `yarn nest start product-admin --watch`
   - `yarn nest start product-consumer --watch`
