# Ahha Voucher Engine - Agent Guide

> Comprehensive reference for AI agents working on this codebase.

---

## 🎯 Project Overview

**Ahha Voucher Engine** is a multi-tenant SaaS backend system built with NestJS for managing voucher distribution and
redemption. It supports multiple clients (tenants), each with their own isolated database. The platform also includes
two frontend React/Vite applications: a consumer storefront and a CMS admin panel.

### Key Features

- **Multi-tenant architecture**: Database-per-tenant with dynamic connection management
- **Voucher management**: Create, claim, and use vouchers with categories, validities, bindings, and discount pricing
- **Discount system**: Percentage and fixed-amount discounts calculated in real-time via
  `POST /loyalty/vouchers/calculate-discount`
- **Product catalog**: Product management (admin) and consumer-facing product listing APIs
- **Reward system**: Strategy-pattern based reward claiming (GoPay, etc.)
- **Quest & gamification**: Framework for loyalty program quests
- **JWT-based authentication**: Separate guards for admin and consumer endpoints
- **ACL (Access Control List)**: Role-based permissions for admin operations
- **AES encryption**: For sensitive database credentials
- **Frontend CMS**: React/Vite admin panel (`apps/frontend-cms`) for voucher, user, and product management
- **Frontend Consumer**: React/Vite storefront (`apps/frontend-consumer`) for product browsing, voucher claiming, and
  checkout

---

## 🤖 AI Agent Pipelines

When instructed to create a frontend feature or implementation, you MUST strictly adhere to the following 5-step
autonomous agent pipeline:

1. **Product Owner**: Translates user requests into UI specs and verifies backend API readiness.
2. **Frontend Planner**: Architects the React components, establishes data flows, and defines aesthetic "Vibe Coding" directives for Tailwind/Framer Motion.
3. **Frontend Implementer**: Writes the actual code according to the Planner's specs (max 3 iterations push-back allowed).
4. **Frontend Reviewer**: Audits the code for aesthetic compliance ("Vibes") and React best practices (max 3 iterations push-back allowed).
5. **Automation Engineer**: Creates Vitest/React Testing Library test cases to confirm logic and aesthetics.

When instructed to create a backend feature, use the corresponding backend pipeline:

1. **Backend Planner**: Analyzes user requests and produces a precise execution plan.
2. **Backend Implementer**: Implements the plan into the monorepo architecture.
3. **Backend Reviewer**: Audits the implementation for architectural standards compliance.
4. **Automation Engineer**: Creates NestJS unit/integration tests to confirm behavior.

---

## 🛠️ Tech Stack

| Category        | Technology                                      |
| --------------- | ----------------------------------------------- |
| Framework       | NestJS 11.x                                     |
| Language        | TypeScript 5.x                                  |
| ORM             | TypeORM 0.3.x                                   |
| Database        | PostgreSQL                                      |
| Auth            | JWT (passport-jwt) + API Key                    |
| Encryption      | AES-256-CBC (crypto) + bcrypt                   |
| Validation      | class-validator + class-transformer             |
| Documentation   | Swagger/OpenAPI                                 |
| Naming Strategy | SnakeNamingStrategy (typeorm-naming-strategies) |
| Package Manager | Yarn 1.22.22                                    |
| Frontend        | React 18 + Vite + TypeScript                    |
| Frontend UI     | Tailwind CSS + Framer Motion                    |
| Frontend Tests  | Vitest + React Testing Library                  |

---

## 🏗️ Architecture

### Monorepo Structure (NestJS Workspace)

```
├── apps/                          # Applications (deployable units)
│   ├── admin/                     # Admin management API (port 9002)
│   │   ├── src/admin.module.ts
│   │   ├── src/admin.controller.ts
│   │   ├── src/admin.service.ts
│   │   ├── src/entities/admin.entity.ts
│   │   └── src/seeder/            # Database seeders
│   ├── frontend-cms/              # CMS Admin React/Vite App (port 5173 dev)
│   │   ├── src/pages/             # Voucher, User, Product, Category pages
│   │   ├── src/components/        # Shared UI components
│   │   ├── src/router/index.tsx   # React Router v6 config
│   │   ├── src/store/             # Zustand state management
│   │   ├── src/api/               # Axios API client wrappers
│   │   └── src/lib/               # Utilities
│   ├── frontend-consumer/         # Consumer React/Vite App (port 5174 dev)
│   │   ├── src/pages/             # CheckoutView, ProductShowcaseView, VoucherDashboardView, etc.
│   │   ├── src/components/        # Shared UI components + spec files
│   │   ├── src/store/             # Zustand state management
│   │   ├── src/api/               # Axios API client wrappers
│   │   └── src/lib/               # Utilities
│   ├── loyalty-admin/             # Voucher & loyalty admin API (port 9003)
│   │   ├── src/voucher/           # Voucher CRUD operations
│   │   ├── src/voucher-category/  # Voucher category management
│   │   ├── src/reward-item/       # Reward item management
│   │   ├── src/reward-item-source/# Reward source configuration
│   │   ├── src/quest/             # Quest management
│   │   └── src/...                # Stub modules (gamification, tier, trading)
│   ├── loyalty-consumer/          # Consumer-facing loyalty API (port 9005)
│   │   ├── src/voucher/           # Consumer voucher ops + purchase controller
│   │   │   ├── voucher.controller.ts
│   │   │   ├── voucher.service.ts       # validateAndCalculateDiscount, useVoucher
│   │   │   ├── purchase.controller.ts   # POST /loyalty/purchase (JWT-protected)
│   │   │   └── dto/
│   │   └── src/reward/            # Reward claiming with strategies
│   ├── product-admin/             # Product management API (port 9007)
│   │   └── src/product/           # CRUD for ProductEntity
│   ├── product-consumer/          # Consumer product listing API (port 9008)
│   │   └── src/                   # GET /products, GET /products/:id
│   ├── redistro/                  # Redistribution/inventory API
│   ├── user-admin/                # User management admin API (port 9004)
│   └── user-consumer/             # User-facing API (port 9006)
│
├── libs/                          # Shared libraries
│   ├── auth/                      # JWT guards, ACL, decorators
│   │   ├── guards/
│   │   │   ├── admin-jwt.guard.ts
│   │   │   ├── consumer-jwt.guard.ts
│   │   │   └── acl.guard.ts
│   │   ├── decorators/permissions.decorator.ts
│   │   ├── acl.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── roles.enum.ts
│   ├── base/                      # Base entity, pagination DTOs, base service
│   │   ├── entities/base.entity.ts
│   │   └── dto/base-pagination.dto.ts
│   ├── database/                  # Database service, client entity
│   │   ├── database.service.ts    # Dynamic connection management
│   │   └── entities/client.entity.ts
│   ├── encryption/                # AES encryption service
│   │   └── encryption.service.ts
│   ├── loyalty/                   # Loyalty domain entities
│   │   ├── voucher/entities/      # Voucher-related entities (inc. discount_type, discount_value)
│   │   ├── reward-item/entities/  # Reward item entities
│   │   ├── quest/entities/        # Quest entities
│   │   └── entities/loyalty-user.entity.ts
│   ├── middleware/                # Subdomain & credential middleware
│   │   ├── subdomain.middleware.ts  # Skips OPTIONS (CORS preflight)
│   │   └── credential.middleware.ts # Skips OPTIONS (CORS preflight)
│   ├── product/                   # Product domain entities (ProductEntity)
│   └── user/                      # User domain entities
│
├── nginx.conf                     # Nginx reverse proxy configuration
├── package.json                   # Root package configuration
├── nest-cli.json                  # NestJS monorepo configuration
└── tsconfig.json                  # TypeScript configuration with path aliases
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

| Middleware             | Purpose                                                      | Order |
| ---------------------- | ------------------------------------------------------------ | ----- |
| `SubdomainMiddleware`  | Extracts subdomain from Host header, validates client exists | 1st   |
| `CredentialMiddleware` | Validates `x-api-key` header against `client.api_key`        | 2nd   |

> **Note**: Both middlewares skip validation for `OPTIONS` requests to enable proper CORS preflight handling.

---

## 📦 Key Entities

### Master Database (Shared)

```typescript
// libs/database/src/entities/client.entity.ts
@Entity('clients', { synchronize: false })
export class ClientEntity extends BaseEntity {
  @Column({ unique: true })
  subdomain: string; // Unique subdomain identifier (e.g., "client1")

  @Column()
  api_key: string; // API key for credential validation

  @PrimaryColumn()
  database_name: string; // Primary key, tenant database name

  @Column()
  database_username: string; // Encrypted DB credentials

  @Column()
  database_password: string; // Encrypted

  @Column()
  database_port: string;

  @Column()
  database_host: string;
}
```

### Base Entity

```typescript
// libs/base/src/entities/base.entity.ts
export class BaseEntity {
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    precision: 3,
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    precision: 3,
  })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true, precision: 3 })
  deleted_at: Date | null; // Soft delete support
}
```

### Tenant Databases (Per Client)

```typescript
// Voucher Domain (libs/loyalty/src/voucher/entities/)
@Entity('vouchers')
export class VoucherEntity extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', unique: true })
  code: string; // Voucher code (primary key)

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  quota: number; // Max usage count

  @Column({ type: 'text', nullable: true })
  image: string;

  // Discount pricing fields
  @Column({ type: 'varchar', default: 'percentage' })
  discount_type: string; // 'percentage' | 'fixed'

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount_value: number; // Amount or percentage (e.g. 25 = 25%)

  @ManyToMany(() => VoucherCategoryEntity, { cascade: true })
  @JoinTable({ name: 'vouchers_categories' })
  categories: VoucherCategoryEntity[];

  @ManyToMany(() => VoucherCategoryEntity, { cascade: true })
  @JoinTable({ name: 'vouchers_allow_combine_categories' })
  allow_combine_categories: VoucherCategoryEntity[];

  @OneToMany(() => VoucherValidityEntity, (v) => v.voucher, { cascade: true })
  validities: VoucherValidityEntity[];

  @OneToMany(() => VoucherBindingEntity, (b) => b.voucher, { cascade: true })
  bindings: VoucherBindingEntity[]; // Product/brand/store bindings

  @OneToMany(() => VoucherClaimEntity, (c) => c.voucher, { cascade: true })
  claims: VoucherClaimEntity[];

  @OneToMany(() => VoucherUsageEntity, (u) => u.voucher, { cascade: true })
  usages: VoucherUsageEntity[];

  @ManyToMany(() => LoyaltyUserEntity, { cascade: true })
  @JoinTable({ name: 'vouchers_target_users' })
  target_users: LoyaltyUserEntity[]; // Specific users allowed
}

// Product Domain (libs/product/src/entities/)
@Entity('products')
export class ProductEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}

// Reward Domain
@Entity('reward_items')
export class RewardItemEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  type: string; // 'gopay', 'pulsa', etc.

  @Column({ type: 'int', default: -1 })
  stock: number; // -1 = unlimited, 0 = out of stock

  @ManyToOne(() => RewardItemSourceEntity)
  source: RewardItemSourceEntity;
}
```

---

## 🔧 Key Services

### DatabaseService (`libs/database/src/database.service.ts`)

Manages dynamic database connections per tenant:

```typescript
@Injectable()
export class DatabaseService {
  private _dataSources: Map<string, DataSource> = new Map();

  // Get or create DataSource for tenant
  async getConnection(
    databaseName: string,
    ...entityPath: string[]
  ): Promise<DataSource>;

  // Create new connection with decrypted credentials
  async createConnection(name: string, initFn: Function): Promise<DataSource>;

  // Close and remove connection
  async closeConnection(name: string): Promise<void>;
}
```

### EncryptionService (`libs/encryption/src/encryption.service.ts`)

```typescript
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey = process.env.CLIENT_DB_SECRET;

  encrypt(text: string): string; // Returns "iv:encrypted" format
  decrypt(text: string): string; // Decrypts AES format
  comparePassword(raw: string, hashed: string): Promise<boolean>; // bcrypt
}
```

### VoucherService (Consumer — `apps/loyalty-consumer/src/voucher/voucher.service.ts`)

Key methods for the consumer-facing purchase flow:

```typescript
@Injectable()
export class VoucherService {
  // Validates voucher and returns discount breakdown
  async validateAndCalculateDiscount(
    code: string,
    productId: string,
    subtotal: number,
  ): Promise<{ discount_amount: number; final_price: number }>;

  // Marks voucher as used (called inside a DB transaction during purchase)
  async useVoucher(code: string, userId: string): Promise<void>;
}
```

### PurchaseController (Consumer — `apps/loyalty-consumer/src/voucher/purchase.controller.ts`)

```
POST /loyalty/purchase
Auth: ConsumerJwtGuard
Body: { product_id, quantity, voucher_code? }
```

### VoucherService (Admin)

CRUD operations for vouchers with category/user resolution:

```typescript
@Injectable()
export class VoucherService {
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(VoucherEntity);
  }

  create(createVoucherDto: CreateVoucherDto): Promise<VoucherEntity>;
  findAll(paginationDto: BasePaginationDto): Promise<PaginatedResponse>;
  findOne(id: string): Promise<VoucherEntity>;
  update(
    id: string,
    updateVoucherDto: UpdateVoucherDto,
  ): Promise<VoucherEntity>;
  remove(id: number): Promise<void>;
}
```

### ACLService (`libs/auth/src/acl.service.ts`)

```typescript
@Injectable()
export class AclService {
  private readonly acl: Record<Role, string[]> = {
    [Role.USER]: ['read:profile'],
    [Role.ADMIN]: [
      'read:profile',
      'write:profile',
      'read:users',
      'write:users',
      'read:vouchers',
      'write:vouchers',
      'read:quests',
      'write:quests',
      'read:voucher-categories',
    ],
    [Role.SALES]: ['read:products', 'read:warehouses'],
    [Role.DRIVER]: ['read:orders', 'write:orders'],
  };

  can(role: Role, permission: string): boolean;
}
```

---

## 🚀 Applications

### Backend Applications

| App              | Port | Environment Variable    | Base Path        | Auth                 |
| ---------------- | ---- | ----------------------- | ---------------- | -------------------- |
| admin            | 9002 | `PORT_ADMIN`            | `/admin`         | JWT Bearer + API Key |
| loyalty-admin    | 9003 | `PORT_LOYALTY_ADMIN`    | `/loyalty-admin` | JWT Bearer + API Key |
| loyalty-consumer | 9005 | `PORT_LOYALTY_CONSUMER` | `/loyalty`       | JWT + API Key        |
| product-admin    | 9007 | `PORT_PRODUCT_ADMIN`    | `/product-admin` | JWT Bearer + API Key |
| product-consumer | 9008 | `PORT_PRODUCT_CONSUMER` | `/products`      | API Key              |
| redistro         | -    | -                       | -                | -                    |
| user-admin       | 9004 | `PORT_USER_ADMIN`       | `/user-admin`    | JWT Bearer + API Key |
| user-consumer    | 9006 | `PORT_USER_CONSUMER`    | `/user`          | JWT + API Key        |

### Frontend Applications

| App               | Dev Port | Build Command                           | Description         |
| ----------------- | -------- | --------------------------------------- | ------------------- |
| frontend-cms      | 5173     | `cd apps/frontend-cms && yarn dev`      | Admin/CMS panel     |
| frontend-consumer | 5174     | `cd apps/frontend-consumer && yarn dev` | Consumer storefront |

### Running Backend Applications

```bash
# Development mode with watch
yarn start:admin --watch
yarn start:loyalty-admin --watch
yarn start:loyalty-consumer --watch
yarn start:user-admin --watch
yarn start:user-consumer --watch
yarn nest start product-admin --watch
yarn nest start product-consumer --watch

# Production
yarn build
node dist/apps/admin/main.js
```

### Running Frontend Applications

```bash
# Consumer storefront
cd apps/frontend-consumer && yarn dev

# CMS Admin panel
cd apps/frontend-cms && yarn dev

# Run frontend tests (Vitest)
cd apps/frontend-consumer && yarn test   # or npx vitest run
cd apps/frontend-cms && yarn test
```

---

## 🔐 Authentication & Security

### Required Headers

```
Host: {subdomain}.ahha-be.local        # For tenant identification (e.g., client1.ahha-be.local)
x-api-key: {client.api_key}            # For credential validation
Authorization: Bearer {jwt}            # For protected endpoints
```

### Guards

| Guard              | Purpose                           | Usage                                 |
| ------------------ | --------------------------------- | ------------------------------------- |
| `AdminJwtGuard`    | Validates JWT for admin endpoints | `@UseGuards(AdminJwtGuard)`           |
| `ConsumerJwtGuard` | Validates JWT for consumer        | `@UseGuards(ConsumerJwtGuard)`        |
| `AclGuard`         | Permission-based access control   | `@UseGuards(AdminJwtGuard, AclGuard)` |

### Permissions Decorator

```typescript
@Controller('vouchers')
@UseGuards(AdminJwtGuard, AclGuard)
export class VoucherController {
  @Post()
  @Permissions('write:vouchers')
  create(@Body() dto: CreateVoucherDto) {}

  @Get()
  @Permissions('read:vouchers')
  findAll(@Query() pagination: BasePaginationDto) {}
}
```

### Roles

```typescript
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  SALES = 'sales',
  DRIVER = 'driver',
}
```

### CORS Preflight

Both `SubdomainMiddleware` and `CredentialMiddleware` are configured to short-circuit on `OPTIONS` requests, allowing
CORS preflight to pass through without tenant/API key validation.

---

## 📝 Environment Variables

```bash
# Database (Master)
DB_USERNAME="postgres"             # Master DB username
DB_PASSWORD="password"             # Master DB password
DB_HOST="localhost"                # Database host
DB_PORT="5432"                     # Database port
DB_NAME="ahha_admin_db"            # Master database name
DB_SYNC="false"                    # Auto-sync schema (dev only)
DB_DROP_SCHEMA="false"             # Drop schema on start (dangerous!)
DB_LOGGING="true"                  # Enable SQL logging

# Encryption (MUST be 32 characters for AES-256)
CLIENT_DB_SECRET="9cc4da5ba5f1313590b00dabecdb4299"

# JWT
JWT_SECRET="your-jwt-secret"       # JWT signing secret

# Redis (optional/future)
REDIS_HOST=localhost
REDIS_PORT=6379

# AI Model (for analysis features)
GEMINI_MODEL="gemini-2.5-flash"
```

---

## 🧪 Build, Test & Development Commands

```bash
# Install dependencies
yarn install

# Build all applications
yarn build

# Run applications (development)
yarn start:admin --watch             # Admin API on port 9002
yarn start:loyalty-admin --watch     # Loyalty Admin API on port 9003
yarn start:loyalty-consumer --watch  # Consumer API on port 9005
yarn start:user-admin --watch        # User Admin API on port 9004
yarn start:user-consumer --watch     # User Consumer API on port 9006
yarn nest start product-admin --watch       # Product Admin API on port 9007
yarn nest start product-consumer --watch    # Product Consumer API on port 9008

# Database seeding (creates clients and admins)
yarn seed

# Linting and formatting
yarn lint                         # Run ESLint with auto-fix
yarn format                       # Run Prettier on all source files

# Backend Testing (Jest)
yarn test                         # Run unit tests
yarn test:watch                   # Run tests in watch mode
yarn test:cov                     # Run tests with coverage
yarn test:ci                      # Run tests with JUnit reporter (CI)
yarn test:e2e                     # Run end-to-end tests

# Frontend Testing (Vitest)
cd apps/frontend-consumer && npx vitest run    # Run consumer frontend tests
cd apps/frontend-cms && npx vitest run         # Run CMS admin frontend tests
```

## 🛠️ Execution & Environment Guidelines (AI Agents)

To ensure smooth command execution and avoid trial-and-error, follow these environment-specific rules:

### 1. macOS Path Configuration

On this system, Node extensions (yarn, npm, node) are typically located in `/opt/homebrew/bin`. Always ensure this is in your `PATH` or use absolute paths for terminal commands.

- **Recommended**: `export PATH="/opt/homebrew/bin:$PATH"` at the start of persistent sessions.

### 2. Command Execution

- **Persistent Terminals**: Use a `RequestedTerminalID` (e.g., `main_terminal`) with `RunPersistent: true` to preserve path exports.
- **Builds**: Use `yarn nest build <app>` or `npm run build` from the relevant directory.
- **Nginx & Ports**: Ensure you map internal ports correctly (e.g., `product-consumer` → 9008).

### 3. Verification Workflow

- Always run a build of the modified backend application before declaring a task done.
- For frontend changes, run `vitest` inside the relevant `apps/frontend-*` directory to ensure zero regressions.
- Use `tsc --noEmit` inside the frontend app directory for quick type-safety checks without a full build.

---

## 💅 Code Style Guidelines

### ESLint Configuration (`.eslintrc.js`)

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
```

### Prettier Configuration (`.prettierrc`)

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "endOfLine": "auto"
}
```

### TypeScript Configuration

- **Target**: ES2021
- **Module**: CommonJS
- **Strict null checks**: Disabled
- **Decorators**: Enabled (experimental)
- **Path aliases**: Configured for all `@core/*` imports

### Naming Conventions

- **Files**: kebab-case (e.g., `voucher.service.ts`)
- **Classes**: PascalCase with suffix (e.g., `VoucherService`)
- **Database columns**: snake_case (via SnakeNamingStrategy)
- **Entities**: Suffix with `Entity` (e.g., `VoucherEntity`)
- **DTOs**: Suffix with `Dto` (e.g., `CreateVoucherDto`)
- **Frontend components**: PascalCase with descriptive suffix (e.g., `CheckoutView.tsx`, `ProductCard.tsx`)
- **Frontend pages**: PascalCase `*View.tsx` for full-page components, `*.tsx` otherwise

---

## 🧪 Testing Strategy

### Backend (Jest)

#### Test Configuration (from `package.json`)

```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "testEnvironment": "node",
    "roots": ["<rootDir>/apps/", "<rootDir>/libs/"],
    "moduleNameMapper": {
      "^@core/auth(|/.*)$": "<rootDir>/libs/auth/src/$1",
      "^@core/base(|/.*)$": "<rootDir>/libs/base/src/$1",
      "^@core/database(|/.*)$": "<rootDir>/libs/database/src/$1",
      "^@core/encryption(|/.*)$": "<rootDir>/libs/encryption/src/$1",
      "^@core/loyalty(|/.*)$": "<rootDir>/libs/loyalty/src/$1",
      "^@core/middleware(|/.*)$": "<rootDir>/libs/middleware/src/$1",
      "^@core/product(|/.*)$": "<rootDir>/libs/product/src/$1"
    }
  }
}
```

#### Test Files Location

- Unit tests: `*.spec.ts` alongside source files
- E2E tests: `test/*.e2e-spec.ts` in app directories

```bash
yarn test                         # All unit tests
yarn test --testPathPattern=voucher  # Specific pattern
yarn test:cov                     # With coverage report
```

### Frontend (Vitest + React Testing Library)

- Test files: `*.spec.tsx` alongside component/page files
- Config: `vitest.config.ts` in each frontend app directory
- Mocking: `vi.mock(...)` for API modules, `msw` for HTTP mocking if needed

```bash
cd apps/frontend-consumer && npx vitest run
cd apps/frontend-cms && npx vitest run
```

---

## 🔒 Security Considerations

1. **Encryption Key**: `CLIENT_DB_SECRET` must be exactly 32 characters for AES-256-CBC
2. **API Keys**: Each client has a unique `api_key` validated on every request
3. **JWT Tokens**: Admin tokens expire in 1 week; consumer tokens have separate validation
4. **Database Credentials**: Stored encrypted in master database, decrypted at runtime
5. **Soft Deletes**: All entities extend `BaseEntity` with `deleted_at` for soft deletion
6. **CORS**: Enabled in production mode only (`app.enableCors()`); OPTIONS middleware bypass is required for preflight
7. **Financial Precision**: All monetary values use `decimal(12,2)` to avoid floating-point inaccuracies

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
@core/product/*    → libs/product/src/*
@core/user/*       → libs/user/src/ *
```

---

## 🌱 Database Seeding

Run `yarn seed` to populate master database:

```typescript
// apps/admin/src/seeder/main.seeder.ts
- Creates clients with encrypted DB credentials
- Creates admin users per client
```

---

## 🌐 Nginx Configuration

Required for subdomain-based multi-tenancy:

```nginx
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name ~^(?<client>[^.]+)\.ahha-be\.local$;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        location /admin {
            proxy_pass http://localhost:9002;
        }
        location /user-admin {
            proxy_pass http://localhost:9004;
        }
        location /user {
            proxy_pass http://localhost:9006;
        }
        location /loyalty-admin {
            proxy_pass http://localhost:9003;
        }
        location /loyalty {
            proxy_pass http://localhost:9005;
        }
        location /product-admin {
            proxy_pass http://localhost:9007;
        }
        location /products {
            proxy_pass http://localhost:9008;
        }

        # CORS headers
        add_header 'Access-Control-Allow-Origin' * always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' * always;
    }
}
```

### Local DNS Setup

```bash
# /etc/hosts
127.0.0.1 client1.ahha-be.local
127.0.0.1 client2.ahha-be.local
```

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

### Request-Scoped Database Connection

```typescript
// In module providers
{
  provide: 'LOYALTY_CONNECTION',
    scope
:
  Scope.REQUEST,
    useFactory
:
  async (request: Request, databaseService: DatabaseService): Promise<DataSource> => {
    const databaseName = request['client'].database_name;
    return await databaseService.getConnection(databaseName, __dirname + '/**/*.entity{.ts,.js}');
  },
    inject
:
  [REQUEST, DatabaseService],
}
```

### Pagination DTO

```typescript
class ListVouchersDto extends BasePaginationDto {
  page: number; // 0-indexed
  size: number; // Items per page (default: 10)
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

### Discount Calculation (Consumer Checkout)

```typescript
// Real-time discount preview (unauthenticated)
POST / loyalty / vouchers / calculate - discount
Body: {
  voucher_code: string, product_id
:
  string, quantity
:
  number
}
Response: {
  subtotal, discount_amount, final_price
}

// Full purchase (JWT-protected)
POST / loyalty / purchase
Headers: Authorization: Bearer <consumer_jwt>
Body: {
  product_id: string, quantity
:
  number, voucher_code ? : string
}
Response: {
  order_id, subtotal, discount_amount, final_price
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
6. **Middleware order matters**: SubdomainMiddleware → CredentialMiddleware
7. **Stock values**: `-1` = unlimited, `0` = out of stock, `>0` = limited
8. **Monetary values**: Always use `decimal(12,2)` — never `float` — to prevent floating-point drift in financial
   calculations
9. **CORS preflight**: Both middlewares skip validation for `OPTIONS` method; ensure this remains in place
10. **Frontend apps are standalone**: `apps/frontend-cms` and `apps/frontend-consumer` have their own `package.json`,
    `node_modules`, and Vite configs — always `cd` into them before running their commands
11. **Voucher usage is transactional**: `useVoucher()` must always be called inside a TypeORM transaction together with
    order creation to ensure atomic rollback on failure

---

## 🔄 PR Review Workflow (Paperclip)

When reviewing pull requests as the CTO agent, follow this workflow:

### Trigger

PRs opened against `main` or `staging` automatically create a Paperclip review issue via the `pr-review.yml` GitHub
Actions workflow. The CTO agent is assigned for review.

### Review Checklist

1. **Architecture alignment** — Does the change follow the architecture principles?
   - Database-per-tenant isolation maintained?
   - Middleware ordering preserved? (SubdomainMiddleware → CredentialMiddleware)
   - Path aliases used correctly? (`@core/auth`, `@core/database`, etc.)

2. **Code quality**
   - Pre-commit hooks pass: `yarn format:check`, `yarn lint`, `yarn type-check`
   - No console.log or debug artifacts
   - DTOs use proper validation decorators
   - Repository pattern followed (DataSource from request context)

3. **Security**
   - JWT guards on admin and consumer endpoints
   - ACL permissions checked for admin operations
   - AES encryption for sensitive data
   - No secrets or credentials in code
   - CORS properly configured

4. **Financial correctness**
   - Monetary values use `decimal(12,2)` — never `float`
   - Voucher usage is transactional (within TypeORM transaction)
   - Discount calculations verified

5. **Testing**
   - New services/controllers have corresponding `.spec.ts` files
   - E2E tests for critical paths (voucher claiming, purchase)
   - Frontend changes have Vitest tests

### PR Review Commands

When reviewing via Paperclip:

```
# Link PR to review
github:link ahha-voucher-engine <pr-number>

# Review the PR diff
review-checkout-pr ahha-voucher-engine <pr-number>

# Post review result
@paperclip comment "Review complete. See findings in thread."
```

### Post-Merge

On merge to `main`, the `pr-local-deploy.yml` workflow triggers:

- Builds Docker images and deploys to staging
- Updates Paperclip issue with deployment status
- Posts confirmation comment on PR

---

## 📚 Related Files Reference

| Concern              | Files                                                               |
| -------------------- | ------------------------------------------------------------------- |
| Tenant Resolution    | `libs/middleware/src/middleware/subdomain.middleware.ts`            |
| Credential Check     | `libs/middleware/src/middleware/credential.middleware.ts`           |
| DB Connection        | `libs/database/src/database.service.ts`                             |
| Encryption           | `libs/encryption/src/encryption.service.ts`                         |
| JWT Strategy         | `libs/auth/src/jwt.strategy.ts`                                     |
| ACL System           | `libs/auth/src/acl.service.ts`, `libs/auth/src/guards/acl.guard.ts` |
| Voucher Domain       | `libs/loyalty/src/voucher/entities/*.entity.ts`                     |
| Voucher Admin        | `apps/loyalty-admin/src/voucher/*.ts`                               |
| Voucher Consumer     | `apps/loyalty-consumer/src/voucher/*.ts`                            |
| Purchase Endpoint    | `apps/loyalty-consumer/src/voucher/purchase.controller.ts`          |
| Discount Calculation | `apps/loyalty-consumer/src/voucher/voucher.service.ts`              |
| Product Domain       | `libs/product/src/entities/product.entity.ts`                       |
| Product Admin API    | `apps/product-admin/src/product/*.ts`                               |
| Product Consumer API | `apps/product-consumer/src/*.ts`                                    |
| Reward Strategy      | `apps/loyalty-consumer/src/reward/strategy/*.ts`                    |
| Seeding              | `apps/admin/src/seeder/*.ts`                                        |
| CMS Router           | `apps/frontend-cms/src/router/index.tsx`                            |
| Consumer Router      | `apps/frontend-consumer/src/App.tsx`                                |
| Checkout UI          | `apps/frontend-consumer/src/pages/CheckoutView.tsx`                 |
| CMS Voucher CRUD     | `apps/frontend-cms/src/pages/VoucherCreate.tsx`, `VoucherEdit.tsx`  |
| CI Pipeline          | `.github/workflows/ci.yml`                                          |
| PR Review Workflow   | `.github/workflows/pr-review.yml`                                   |
| Local Deploy         | `.github/workflows/pr-local-deploy.yml`                             |
| E2E Tests            | `e2e/` directory (Playwright)                                       |
| PR Template          | `.github/pull_request_template.md`                                  |
| Paperclip Setup      | `docs/paperclip-integration.md`                                     |

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Memory

Persistent AI memory lives in the Obsidian vault at `~/ObsidianVault` (MOC: `~/ObsidianVault/index.md`), written via the Obsidian MCP server (`obsidian_*` tools). Use the `obsidian-memory` skill for the full save rules (PARA paths, frontmatter, dedup).

- **Start of a session**: read `~/ObsidianVault/index.md`, then `obsidian_search_notes` for context relevant to this repo's work before doing anything.
- **During a session**: when a durable fact emerges (people, companies, active projects, tech stack, decisions, preferences, lessons), save it via `obsidian-memory` (people → `Areas/people/`, companies → `Areas/companies/`, projects → `Projects/`, topics → `Resources/`).
- **End of a significant session**: save a daily-note summary to `~/ObsidianVault/daily/YYYY-MM-DD.md` (append if it exists), covering what was done, decisions, blockers, next actions.
- Always read a note before writing (dedup); never create duplicates. If Obsidian is unreachable, stage the memory at `/tmp/obsidian-memory-pending.md` and tell the user.
