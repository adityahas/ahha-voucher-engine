# Loyalty Admin API

Admin API for managing loyalty programs including vouchers, reward items, quests, and gamification features.

---

## 🎯 Overview

This application provides administrative endpoints for managing loyalty program entities. It supports multi-tenant
architecture with per-client database isolation.

| Attribute      | Value                        |
|----------------|------------------------------|
| **Port**       | 9003 (`PORT_LOYALTY_ADMIN`)  |
| **Base Path**  | `/loyalty-admin`             |
| **Swagger UI** | `http://localhost:9003/api`  |
| **Server URL** | `client1.localhost.dev:9003` |

---

## 🏗️ Architecture

### Tech Stack

- **Framework**: NestJS
- **ORM**: TypeORM
- **Auth**: JWT + API Key
- **Database**: PostgreSQL (multi-tenant)

### Multi-Tenant Flow

```
Request → SubdomainMiddleware → CredentialMiddleware → Tenant DB
```

### Required Headers

```
Host: {subdomain}.ahha-be.local
x-api-key: {client.api_key}
Authorization: Bearer {jwt}
```

---

## 📦 Modules

### ✅ Implemented Modules

#### 1. Vouchers (`/vouchers`)

CRUD operations for vouchers with full feature support.

| Method | Endpoint                      | Auth      | Permission       | Description               |
|--------|-------------------------------|-----------|------------------|---------------------------|
| POST   | `/loyalty-admin/vouchers`     | JWT + ACL | `write:vouchers` | Create voucher            |
| GET    | `/loyalty-admin/vouchers`     | JWT + ACL | `read:vouchers`  | List vouchers (paginated) |
| GET    | `/loyalty-admin/vouchers/:id` | JWT + ACL | `read:vouchers`  | Get voucher by code       |
| PATCH  | `/loyalty-admin/vouchers/:id` | JWT + ACL | `write:vouchers` | Update voucher            |
| DELETE | `/loyalty-admin/vouchers/:id` | JWT + ACL | `write:vouchers` | Delete voucher            |

**Voucher Features:**

- Categories (many-to-many)
- Allow combine categories
- Validity periods
- Product/store/brand bindings
- Target specific users

#### 2. Voucher Categories (`/voucher-categories`)

CRUD for voucher categorization.

| Method | Endpoint                                | Auth      | Permission                  | Description     |
|--------|-----------------------------------------|-----------|-----------------------------|-----------------|
| GET    | `/loyalty-admin/voucher-categories`     | JWT + ACL | `read:voucher-categories`   | List categories |
| GET    | `/loyalty-admin/voucher-categories/:id` | JWT + ACL | `read:voucher-categories`   | Get category    |
| POST   | `/loyalty-admin/voucher-categories`     | JWT + ACL | `create:voucher-categories` | Create category |
| PUT    | `/loyalty-admin/voucher-categories/:id` | JWT + ACL | `update:voucher-categories` | Update category |
| DELETE | `/loyalty-admin/voucher-categories/:id` | JWT + ACL | `delete:voucher-categories` | Delete category |

#### 3. Reward Items (`/reward-item`)

CRUD for reward items (e.g., gopay, pulsa rewards).

| Method | Endpoint                         | Auth | Description        |
|--------|----------------------------------|------|--------------------|
| POST   | `/loyalty-admin/reward-item`     | None | Create reward item |
| GET    | `/loyalty-admin/reward-item`     | None | List reward items  |
| GET    | `/loyalty-admin/reward-item/:id` | None | Get reward item    |
| PATCH  | `/loyalty-admin/reward-item/:id` | None | Update reward item |
| DELETE | `/loyalty-admin/reward-item/:id` | None | Delete reward item |

**Note**: This endpoint currently has no authentication guards.

#### 4. Reward Item Sources (`/reward-item-source`)

CRUD for reward item sources/strategies.

| Method | Endpoint                                | Auth | Description   |
|--------|-----------------------------------------|------|---------------|
| POST   | `/loyalty-admin/reward-item-source`     | None | Create source |
| GET    | `/loyalty-admin/reward-item-source`     | None | List sources  |
| GET    | `/loyalty-admin/reward-item-source/:id` | None | Get source    |
| PATCH  | `/loyalty-admin/reward-item-source/:id` | None | Update source |
| DELETE | `/loyalty-admin/reward-item-source/:id` | None | Delete source |

**Note**: This endpoint currently has no authentication guards.

#### 5. Quests (`/quest`)

Quest management for loyalty gamification.

| Method | Endpoint                   | Auth      | Permission     | Description  |
|--------|----------------------------|-----------|----------------|--------------|
| POST   | `/loyalty-admin/quest`     | JWT + ACL | `write:quests` | Create quest |
| GET    | `/loyalty-admin/quest`     | JWT + ACL | `read:quests`  | List quests  |
| GET    | `/loyalty-admin/quest/:id` | JWT + ACL | `read:quests`  | Get quest    |
| PATCH  | `/loyalty-admin/quest/:id` | JWT + ACL | `write:quests` | Update quest |
| DELETE | `/loyalty-admin/quest/:id` | JWT + ACL | `write:quests` | Delete quest |

### 🚧 Stub Modules (Not Implemented)

These modules are registered but contain no functionality:

- `collectible-items` - For collectible/redeemable items
- `gamification-daily-checkin` - Daily check-in feature
- `gamification-gacha` - Gacha/lottery system
- `tier` - User tier/level management
- `trading` - Trading/exchange feature

---

## 🔐 Authentication & Authorization

### JWT Authentication

Protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### API Key Authentication

All endpoints require the `x-api-key` header for client identification:

```
x-api-key: <client_api_key>
```

### ACL Permissions

Endpoints with guards require specific permissions:

| Resource           | Read Permission           | Write Permission                                                                      |
|--------------------|---------------------------|---------------------------------------------------------------------------------------|
| Vouchers           | `read:vouchers`           | `write:vouchers`                                                                      |
| Voucher Categories | `read:voucher-categories` | `create:voucher-categories`, `update:voucher-categories`, `delete:voucher-categories` |
| Quests             | `read:quests`             | `write:quests`                                                                        |

---

## 📁 Project Structure

```
apps/loyalty-admin/src/
├── main.ts                           # Application entry point
├── loyalty-admin.module.ts           # Root module
├── loyalty-admin.controller.ts       # Root controller
├── loyalty-admin.service.ts          # Root service
├── voucher/                          # Voucher module
│   ├── voucher.controller.ts
│   ├── voucher.service.ts
│   ├── voucher.module.ts
│   └── dto/
├── voucher-category/                 # Voucher category module
│   ├── voucher-category.controller.ts
│   ├── voucher-category.service.ts
│   └── dto/
├── reward-item/                      # Reward item module
│   ├── reward-item.controller.ts
│   ├── reward-item.service.ts
│   └── dto/
├── reward-item-source/               # Reward item source module
│   ├── reward-item-source.controller.ts
│   ├── reward-item-source.service.ts
│   └── dto/
├── quest/                            # Quest module
│   ├── quest.controller.ts
│   ├── quest.service.ts
│   └── dto/
├── collectible-items/                # Stub module
├── gamification-daily-checkin/       # Stub module
├── gamification-gacha/               # Stub module
├── tier/                             # Stub module
└── trading/                          # Stub module
```

---

## 🚀 Running the Application

### Development

```bash
yarn start:loyalty-admin --watch
```

### Production

```bash
yarn build
node dist/apps/loyalty-admin/main.js
```

---

## ⚙️ Environment Variables

| Variable             | Default | Description                 |
|----------------------|---------|-----------------------------|
| `PORT_LOYALTY_ADMIN` | `9003`  | Application port            |
| `DB_HOST`            | -       | Database host               |
| `DB_PORT`            | `5432`  | Database port               |
| `DB_USERNAME`        | -       | Database username           |
| `DB_PASSWORD`        | -       | Database password           |
| `DB_NAME`            | -       | Master database name        |
| `DB_SYNC`            | `false` | Auto-sync schema (dev only) |
| `DB_DROP_SCHEMA`     | `false` | Drop schema on start        |
| `DB_LOGGING`         | `true`  | Enable query logging        |

---

## 📝 Notes & Known Issues

1. **Inconsistent Auth**: `reward-item` and `reward-item-source` modules currently have no authentication guards, while
   other modules are protected with JWT + ACL.

2. **DTO/Entity Mismatch**: The `CreateRewardItemDto` has a `value` field that doesn't exist in the `RewardItemEntity` (
   which has `name`, `source_id`, `type`, `stock`).

3. **Stub Modules**: Gamification and tier modules are empty placeholders without implementation.

4. **Entity Paths**: The module uses dynamic entity path resolution via `DatabaseService` for multi-tenant support:
   ```typescript
   __dirname + '/../../../**/*.entity{.ts,.js}'
   ```

---

## 🔗 Related Libraries

| Library            | Path              | Purpose                           |
|--------------------|-------------------|-----------------------------------|
| `@core/auth`       | `libs/auth`       | JWT guards, ACL, decorators       |
| `@core/base`       | `libs/base`       | Base entity, pagination DTOs      |
| `@core/database`   | `libs/database`   | Database service, client entity   |
| `@core/loyalty`    | `libs/loyalty`    | Loyalty domain entities           |
| `@core/middleware` | `libs/middleware` | Subdomain & credential middleware |

---

## 📚 Domain Entities (from @core/loyalty)

- `VoucherEntity` - Main voucher entity
- `VoucherCategoryEntity` - Voucher categorization
- `VoucherValidityEntity` - Voucher validity periods
- `VoucherBindingEntity` - Product/store/brand bindings
- `VoucherClaimEntity` - User voucher claims
- `VoucherUsageEntity` - Voucher usage records
- `RewardItemEntity` - Redeemable rewards
- `RewardItemSourceEntity` - Reward source configuration
- `QuestEntity` - Gamification quests
- `LoyaltyUserEntity` - Loyalty program users
