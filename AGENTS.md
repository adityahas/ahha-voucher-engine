# Ahha Voucher Engine - Agent Guide

> Quick reference for AI agents working on this codebase.

---

## 🎯 Project Overview

**Ahha Voucher Engine** is a multi-tenant SaaS backend system for managing voucher distribution and redemption. Built
with NestJS and TypeORM, it supports multiple clients (tenants) each with their own isolated database.

### Key Features

- Multi-tenant architecture (database-per-tenant)
- Voucher management (create, claim, use)
- Reward item management with strategy pattern for different reward types
- JWT-based authentication for admins and consumers
- AES encryption for sensitive database credentials

---

## 🛠️ Tech Stack

| Category        | Technology                                      |
|-----------------|-------------------------------------------------|
| Framework       | NestJS 11.x                                     |
| Language        | TypeScript 5.x                                  |
| ORM             | TypeORM 0.3.x                                   |
| Database        | PostgreSQL                                      |
| Auth            | JWT (passport-jwt)                              |
| Encryption      | AES-256-CBC (crypto) + bcrypt                   |
| Validation      | class-validator + class-transformer             |
| Documentation   | Swagger/OpenAPI                                 |
| Naming Strategy | SnakeNamingStrategy (typeorm-naming-strategies) |

---

## 🏗️ Architecture

### Monorepo Structure (NestJS Workspace)

```
├── apps/                          # Applications (deployable units)
│   ├── admin/                     # Admin management API (port 9002)
│   ├── loyalty-admin/             # Voucher & loyalty admin API (port 9003)
│   ├── loyalty-consumer/          # Consumer-facing loyalty API (port 9005)
│   ├── product-admin/             # Product management API
│   ├── redistro/                  # Redistribution/inventory API
│   └── user/                      # User management API
│
├── libs/                          # Shared libraries
│   ├── auth/                      # JWT guards, ACL, decorators
│   ├── base/                      # Base entity, pagination DTOs, base service
│   ├── client/                    # Client-related utilities
│   ├── database/                  # Database service, client entity
│   ├── encryption/                # AES encryption service
│   ├── loyalty/                   # Loyalty domain entities (vouchers, rewards)
│   ├── middleware/                # Subdomain & credential middleware
│   └── product/                   # Product domain entities
│
└── dist/                          # Build output
```

### Multi-Tenant Flow

```
Request → Nginx → Extract Subdomain → SubdomainMiddleware → CredentialMiddleware → Controller
                                              ↓
                                    Lookup Client in Master DB
                                              ↓
                                    Get Connection from DatabaseService
                                              ↓
                                    Execute Query on Tenant DB
```

### Key Middleware

| Middleware             | Purpose                                             | Order |
|------------------------|-----------------------------------------------------|-------|
| `SubdomainMiddleware`  | Extracts subdomain from host, validates client      | 1st   |
| `CredentialMiddleware` | Validates `x-api-key` header against client.api_key | 2nd   |

---

## 📦 Key Entities

### Master Database (Shared)

```typescript
// libs/database/src/entities/client.entity.ts
ClientEntity
{
  subdomain: string;           // Unique subdomain identifier
  api_key: string;             // API key for credential validation
  database_name: string;       // Primary key
  database_username: string;   // Encrypted DB credentials
  database_password: string;   // Encrypted
  database_port: string;
  database_host: string;
}
```

### Tenant Databases (Per Client)

```typescript
// Voucher Domain (libs/loyalty/src/voucher/entities/)
VoucherEntity
{
  code: string;                // Primary key
  description: string;
  quota: number;               // Max usage count
  image: string;
  categories: VoucherCategoryEntity[];           // Many-to-many
  allow_combine_categories: VoucherCategoryEntity[];
  validities: VoucherValidityEntity[];           // One-to-many
  bindings: VoucherBindingEntity[];              // Product/brand/store bindings
  claims: VoucherClaimEntity[];
  usages: VoucherUsageEntity[];
  target_users: LoyaltyUserEntity[];             // Specific users allowed
}

VoucherClaimEntity
{
  voucher: VoucherEntity;
  user: LoyaltyUserEntity;
  claimed_at: Date;
}

VoucherBindingEntity
{
  bind_type: string;           // 'product', 'brand', 'store', etc.
  bind_value: string;          // ID or identifier
}

// Reward Domain
RewardItemEntity
{
  name: string;
  type: string;                // 'gopay', 'pulsa', etc.
  stock: number;               // -1 = unlimited, 0 = out of stock
  source: RewardItemSourceEntity;
}
```

---

## 🔧 Key Services

### DatabaseService (`libs/database/src/database.service.ts`)

Manages dynamic database connections per tenant:

- `getConnection(databaseName, ...entityPaths)` - Get or create DataSource
- `createConnection(name, initFn)` - Create new connection with decrypted credentials
- Caches connections in `_dataSources: Map<string, DataSource>`

### EncryptionService (`libs/encryption/src/encryption.service.ts`)

- `encrypt(text)` - AES-256-CBC encryption, returns `iv:encrypted`
- `decrypt(text)` - Decrypts AES format
- `comparePassword(raw, hashed)` - bcrypt password comparison

### VoucherService (Admin)

CRUD operations for vouchers with category/user resolution.

### VoucherService (Consumer)

- `getEligibleVouchers(searchCriteria)` - Filter by user_id and bindings
- `getClaimedVouchers(userId, pagination)` - Get user's claimed vouchers

### RewardClaimService

Uses Strategy Pattern for different reward types:

- `claimReward(userId, rewardItemId)` - Transactional reward claiming
- Strategy factory resolves implementation by `source.source_type`

---

## 🚀 Applications

| App              | Port | Purpose                         | Auth                 |
|------------------|------|---------------------------------|----------------------|
| admin            | 9002 | Client & admin management       | JWT Bearer + API Key |
| loyalty-admin    | 9003 | Voucher CRUD, reward management | JWT Bearer + API Key |
| loyalty-consumer | 9005 | Consumer voucher claim/use      | API Key              |
| product-admin    | -    | Product catalog management      | -                    |
| redistro         | -    | Inventory & distribution        | -                    |
| user             | -    | User management                 | -                    |

---

## 🔐 Authentication & Security

### Required Headers

```
Host: {subdomain}.ahha-be.local    # For tenant identification
x-api-key: {client.api_key}        # For credential validation
Authorization: Bearer {jwt}        # For admin endpoints (optional for consumer)
```

### Guards

- `AdminJwtGuard` - Validates JWT for admin endpoints
- `ConsumerJwtGuard` - Validates JWT for consumer endpoints
- `AclGuard` - Permission-based access control

---

## 📝 Environment Variables

```bash
# Database (Master)
DB_USERNAME="postgres"
DB_PASSWORD="password"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="ahha_master"
DB_SYNC="false"                    # Set true only for dev

# Encryption
CLIENT_DB_SECRET="32-char-secret-for-aes-256"  # Must be 32 chars for AES-256

# Redis (optional/future)
REDIS_HOST=localhost
REDIS_PORT=6379

# Application Ports
PORT_ADMIN=9002
PORT_LOYALTY_ADMIN=9003
PORT_LOYALTY_CONSUMER=9005
```

---

## 🎮 Common Commands

```bash
# Install dependencies
yarn install

# Run applications (development)
yarn start:admin --watch          # Admin API
yarn start:loyalty-admin --watch  # Loyalty Admin API
yarn start:loyalty-consumer --watch # Consumer API

# Database seeding (creates clients and admins)
yarn seed

# Build
yarn build

# Lint & format
yarn lint
yarn format
```

---

## 🔗 Path Aliases (TypeScript)

```typescript
// tsconfig.json paths mapping
@core/
auth/*       → libs/auth/src/*
@core/base/*       → libs/base/src/*
@core/database/*   → libs/database/src/*
@core/encryption/* → libs/encryption/src/*
@core/loyalty/*    → libs/loyalty/src/*
@core/middleware/* → libs/middleware/src/*
@core/product/*    → libs/product/src/ *
```

---

## 🌱 Seeding

Run `yarn seed` to populate master database:

- Creates clients with encrypted DB credentials
- Creates admin users per client

See: `apps/admin/src/seeder/`

---

## 🧪 Development Setup

### 1. Nginx Configuration

```nginx
server {
    listen 80;
    server_name ~^(?<client>[^.]+)\.ahha-be\.local$;
    
    location /admin {
        proxy_pass http://localhost:9002;
    }
    location /loyalty-admin {
        proxy_pass http://localhost:9003;
    }
    location /loyalty {
        proxy_pass http://localhost:9005;
    }
}
```

### 2. Local DNS

```bash
# /etc/hosts
127.0.0.1 client1.ahha-be.local
127.0.0.1 client2.ahha-be.local
```

### 3. PostgreSQL Requirements

- Create master database
- Enable `uuid-ossp` extension
- Create tenant databases per client

---

## 💡 Common Patterns

### Repository Pattern in Services

```typescript

@Injectable()
export class MyService {
  private repository: Repository<MyEntity>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(MyEntity);
  }
}
```

### Pagination DTO

```typescript
// Extends BasePaginationDto
class ListVouchersDto extends BasePaginationDto {
  page: number;    // 0-indexed
  size: number;    // Items per page
  search?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}
```

### Response Format

```typescript
{
  code: 'SUCCESS' | 'ERROR_CODE',
    message
:
  'Human readable message',
    data
:
  T,
    pagination ? : { page, size, total }
}
```

---

## ⚠️ Important Notes

1. **Always use DataSource from request context** for tenant queries - never inject global repositories for tenant
   entities
2. **Encryption key must be 32 characters** for AES-256-CBC
3. **Subdomain extraction** relies on the first segment of the hostname
4. **Snake naming strategy** is applied globally - DB columns use snake_case
5. **BaseEntity** provides `created_at`, `updated_at`, `deleted_at` (soft delete)

---

## 📚 Related Files

| Concern           | Files                                                    |
|-------------------|----------------------------------------------------------|
| Tenant Resolution | `libs/middleware/src/middleware/subdomain.middleware.ts` |
| DB Connection     | `libs/database/src/database.service.ts`                  |
| Encryption        | `libs/encryption/src/encryption.service.ts`              |
| Voucher Domain    | `libs/loyalty/src/voucher/entities/*.entity.ts`          |
| Voucher Admin     | `apps/loyalty-admin/src/voucher/*.ts`                    |
| Voucher Consumer  | `apps/loyalty-consumer/src/voucher/*.ts`                 |
| Seeding           | `apps/admin/src/seeder/*.ts`                             |
