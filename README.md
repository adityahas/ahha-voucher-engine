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

1. Clone repo
2. Install dependencies: `yarn install`
3. Setup PostgreSQL dan buat database utama
4. Setup nginx untuk multi domain
5. Ini contoh konfigurasi nginx:
    ```
    worker_processes 1;
    
    events {
    worker_connections 1024;
    }
    
    http {
    include       mime.types;
    default_type  application/octet-stream;
    
        sendfile        on;
        keepalive_timeout  65;
    
        server {
            listen 80;
            server_name ~^(?<client>[^.]+)\.ahha-be\.local$;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    
            location /users {
                proxy_pass http://localhost:9004;
            }
            location /admin {
                proxy_pass http://localhost:9002;
            }
            location /loyalty-admin {
                proxy_pass http://localhost:9003;
            }
            location /loyalty {
                proxy_pass http://localhost:9005;
            }
    
            # Tambahkan CORS headers jika perlu
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Headers DNT,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,notif-token,fcm-id,Language,Channel;
        }
    } 
    ```
6. Load konfigurasi nginx: `sudo nginx -c /Users/adityahas/nginx-local/nginx.conf`
7. Reload nginx: `sudo nginx -s reload`
8. Run app admin: `yarn start:admin --watch`
9. Run app loyalty-admin: `yarn start:loyalty-admin --watch`
10. Run app loyalty-consumer: `yarn start:loyalty-consumer --watch`