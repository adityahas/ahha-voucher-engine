# Loyalty Consumer API

Consumer-facing API for loyalty program features including voucher discovery, claiming, and reward redemption.

---

## 🎯 Overview

This application provides consumer endpoints for interacting with the loyalty program. Users can discover eligible
vouchers, view their claimed vouchers, and claim rewards. It supports multi-tenant architecture with per-client database
isolation.

| Attribute      | Value                          |
| -------------- | ------------------------------ |
| **Port**       | 9005 (`PORT_LOYALTY_CONSUMER`) |
| **Base Path**  | `/loyalty`                     |
| **Swagger UI** | `http://localhost:9005/api`    |
| **Server URL** | `client1.localhost.dev:9005`   |

---

## 🏗️ Architecture

### Tech Stack

- **Framework**: NestJS
- **ORM**: TypeORM
- **Auth**: JWT (Consumer) + API Key
- **Database**: PostgreSQL (multi-tenant)

### Multi-Tenant Flow

```
Request → SubdomainMiddleware → CredentialMiddleware → Tenant DB
```

### Required Headers

```
Host: {subdomain}.ahha-be.local
x-api-key: {client.api_key}
Authorization: Bearer {jwt}  (for protected endpoints)
```

---

## 📦 Modules

### 1. Vouchers (`/loyalty/vouchers`)

Voucher discovery, claiming, discount calculation, and redemption for consumers.

| Method | Endpoint                               | Auth | Description                                   |
| ------ | -------------------------------------- | ---- | --------------------------------------------- |
| POST   | `/loyalty/vouchers/eligible`           | JWT  | Get eligible vouchers based on bindings       |
| GET    | `/loyalty/vouchers/my`                 | JWT  | Get user's claimed vouchers (paginated)       |
| POST   | `/loyalty/vouchers/:code/claim`        | JWT  | Claim an eligible voucher                     |
| POST   | `/loyalty/vouchers/calculate-discount` | JWT  | Validate a voucher and calculate the discount |
| POST   | `/loyalty/vouchers/:code/redeem`       | JWT  | Redeem a previously claimed voucher           |

**Get Eligible Vouchers:**

- Filters vouchers by user_id (target user matching)
- Filters by bindings (product, brand, store bindings)
- Returns simplified voucher info (code, description, image)

**Get Claimed Vouchers:**

- Returns user's claimed vouchers with pagination
- Includes voucher details and claim information

**Claim Voucher:**

- Creates a loyalty user record when needed
- Validates the voucher exists and has remaining quota
- Validates targeted-user restrictions
- Prevents duplicate claims
- Decrements the voucher quota atomically

**Calculate Discount:**

- Validates voucher quota, validity dates, targeted users, and product/category bindings
- Supports percentage and fixed-amount discounts
- Caps the discount at the order subtotal
- Returns validity, discount amount, final price, and a status message

**Redeem Voucher:**

- Requires the voucher to have been claimed by the current user
- Prevents a voucher from being redeemed more than once
- Records a `VoucherUsageEntity` entry

#### DTOs

**GetEligibleVoucherDto:**

```typescript
{
  user_id: string;           // User ID to check eligibility
  bindings: [                // Product/store/brand filters
    {
      bind_type: 'product' | 'brand' | 'store';
      bind_value: string;
    }
  ];
}
```

**VoucherResponseDto:**

```typescript
{
  code: string; // Voucher code
  description: string; // Voucher description
  image: string; // Voucher image URL
}
```

---

### 2. Reward (`/rewards`)

Reward discovery and claiming with strategy pattern for different reward types.

| Method | Endpoint                    | Auth | Description                |
| ------ | --------------------------- | ---- | -------------------------- |
| GET    | `/rewards`                  | JWT  | List all available rewards |
| POST   | `/rewards/claim/:reward_id` | JWT  | Claim a reward             |

**Reward Claim Flow:**

1. Validates reward item exists
2. Checks stock availability (`-1` = unlimited, `0` = out of stock)
3. Decrements stock (if limited)
4. Executes strategy based on `source.source_type`
5. Returns claim result

**Supported Reward Types:**

- `gopay` - GoPay voucher rewards

**ClaimResult:**

```typescript
{
  status: 'SUCCESS' | 'FAILED';
  code ? : string;           // Voucher/reward code (on success)
  externalRefId ? : string;  // External reference ID
  expiredAt ? : string;      // ISO 8601 expiration date
  errorMessage ? : string;   // Error message (on failure)
}
```

#### Strategy Pattern

The reward claim uses a strategy pattern to handle different reward types:

```
RewardClaimStrategyFactory
├── GoPayRewardClaimStrategy (for 'gopay' type)
└── (extensible for other types)
```

**GoPayRewardClaimStrategy:**

- Calls external API endpoint from `rewardItem.source.api_endpoint`
- Authenticates with `rewardItem.source.apiKey`
- Returns voucher code on success

---

## 🔐 Authentication & Authorization

### JWT Authentication (Consumer)

Protected endpoints require a valid consumer JWT token:

```
Authorization: Bearer <token>
```

The JWT should contain `userId` in the payload for user identification.

### API Key Authentication

All endpoints require the `x-api-key` header for client identification:

```
x-api-key: <client_api_key>
```

---

## 📁 Project Structure

```
apps/loyalty-consumer/src/
├── main.ts                               # Application entry point
├── loyalty-consumer.module.ts            # Root module
├── loyalty-consumer.controller.ts        # Root controller
├── loyalty-consumer.service.ts           # Root service
├── voucher/                              # Voucher module
│   ├── voucher.controller.ts
│   ├── voucher.service.ts
│   ├── voucher.module.ts
│   └── dto/
│       ├── get-eligible-voucher.dto.ts
│       ├── get-claimed-voucher-response.dto.ts
│       ├── voucher-binding.dto.ts
│       └── voucher-response.dto.ts
└── reward/                         # Reward module
    ├── reward.controller.ts
    ├── reward.service.ts
    ├── reward.module.ts
    ├── dto/
│       └── claim-result.dto.ts
    └── strategy/
        ├── reward-strategy.factory.ts
        ├── reward-claim-strategy.interface.ts
        └── gopay-reward.strategy.ts
```

---

## 🚀 Running the Application

### Development

```bash
yarn start:loyalty-consumer --watch
```

### Production

```bash
yarn build
node dist/apps/loyalty-consumer/main.js
```

---

## ⚙️ Environment Variables

| Variable                | Default | Description                 |
| ----------------------- | ------- | --------------------------- |
| `PORT_LOYALTY_CONSUMER` | `9005`  | Application port            |
| `DB_HOST`               | -       | Database host               |
| `DB_PORT`               | `5432`  | Database port               |
| `DB_USERNAME`           | -       | Database username           |
| `DB_PASSWORD`           | -       | Database password           |
| `DB_NAME`               | -       | Master database name        |
| `DB_SYNC`               | `false` | Auto-sync schema (dev only) |
| `DB_DROP_SCHEMA`        | `false` | Drop schema on start        |
| `DB_LOGGING`            | `true`  | Enable query logging        |

---

## 📝 Notes & Implementation Details

### Voucher Eligibility Logic

The `getEligibleVouchers` service method:

1. Joins with `target_users` if `user_id` is provided
2. Joins with `bindings` if binding filters are provided
3. Applies OR conditions for multiple bindings
4. Returns mapped `VoucherResponseDto`

### Stock Management

- `-1` = Unlimited stock (no decrement)
- `0` = Out of stock (claim rejected)
- `>0` = Limited stock (decremented on successful claim)

### Transaction Safety

Reward claims are wrapped in database transactions to ensure:

- Stock is atomically decremented
- No race conditions on limited stock items
- Consistent state on claim failures

### Strategy Extensibility

To add new reward types:

1. Create a new strategy implementing `RewardClaimStrategy`
2. Register it in `RewardClaimStrategyFactory`
3. Add the new case in `getStrategy()` method

---

## 🔗 Related Libraries

| Library            | Path              | Purpose                           |
| ------------------ | ----------------- | --------------------------------- |
| `@core/auth`       | `libs/auth`       | JWT guards (ConsumerJwtGuard)     |
| `@core/base`       | `libs/base`       | Base controller, pagination DTOs  |
| `@core/database`   | `libs/database`   | Database service, client entity   |
| `@core/loyalty`    | `libs/loyalty`    | Loyalty domain entities           |
| `@core/middleware` | `libs/middleware` | Subdomain & credential middleware |

---

## 📚 Domain Entities (from @core/loyalty)

### Voucher Domain

- `VoucherEntity` - Main voucher with categories, bindings, validities
- `VoucherCategoryEntity` - Voucher categorization
- `VoucherBindingEntity` - Product/store/brand bindings
- `VoucherValidityEntity` - Validity periods
- `VoucherClaimEntity` - User voucher claims

### Reward Domain

- `RewardItemEntity` - Redeemable rewards with stock management
- `RewardItemSourceEntity` - Reward source configuration (API endpoints, credentials)

### User Domain

- `LoyaltyUserEntity` - Loyalty program users

---

## 🔌 API Endpoints Summary

### Vouchers

```
POST   /loyalty/vouchers/eligible            # Get eligible vouchers
GET    /loyalty/vouchers/my                  # Get my claimed vouchers
POST   /loyalty/vouchers/:code/claim         # Claim a voucher
POST   /loyalty/vouchers/calculate-discount  # Calculate voucher discount
POST   /loyalty/vouchers/:code/redeem        # Redeem a voucher
```

### Rewards

```
GET    /rewards                    # List all rewards
POST   /rewards/claim/:reward_id   # Claim a reward
```

---

## 🚧 Future Enhancements

Potential improvements:

- Add more reward strategies (e.g., 'pulsa', 'ovo', 'dana')
- Add voucher usage history endpoint
- Add reward claim history endpoint
- Implement reward expiration notifications
- Add caching for eligible vouchers
