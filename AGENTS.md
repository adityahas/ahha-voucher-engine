# Ahha Voucher Engine - Agent Guide

> Comprehensive reference for AI agents working on this codebase.

---

## 🎯 Project Overview

**Ahha Voucher Engine** is a multi-tenant SaaS backend system built with NestJS for managing voucher distribution and
redemption. It supports multiple clients (tenants), each with their own isolated database.

### Key Features

- **Multi-tenant architecture**: Database-per-tenant with dynamic connection management
- **Voucher management**: Create, claim, and use vouchers with categories, validities, and bindings
- **Reward system**: Strategy-pattern based reward claiming (GoPay, etc.)
- **Quest & gamification**: Framework for loyalty program quests
- **JWT-based authentication**: Separate guards for admin and consumer endpoints
- **ACL (Access Control List)**: Role-based permissions for admin operations
- **AES encryption**: For sensitive database credentials

---

## 🤖 AI Agent Pipelines

When instructed to create a frontend feature or implementation, you MUST strict adhere to the following 5-step autonomous agent pipeline:

1. **Product Owner**: Translates user requests into UI specs and verifies backend API readiness.
2. **Frontend Planner**: Architects the React components, establishes data flows, and defines aesthetic "Vibe Coding" directives for Tailwind/Framer Motion.
3. **Frontend Implementer**: Writes the actual code according to the Planner's specs (max 3 iterations push-back allowed).
4. **Frontend Reviewer**: Audits the code for aesthetic compliance ("Vibes") and React best practices (max 3 iterations push-back allowed).
5. **Automation Engineer**: Creates Vitest/React Testing Library test cases to confirm logic and aesthetics.

---
## 🛠️ Tech Stack

| Category        | Technology                                      |
|-----------------|-------------------------------------------------|
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
│   ├── loyalty-admin/             # Voucher & loyalty admin API (port 9003)
│   │   ├── src/voucher/           # Voucher CRUD operations
│   │   ├── src/voucher-category/  # Voucher category management
│   │   ├── src/reward-item/       # Reward item management
│   │   ├── src/reward-item-source/# Reward source configuration
│   │   ├── src/quest/             # Quest management
│   │   └── src/...                # Stub modules (gamification, tier, trading)
│   ├── loyalty-consumer/          # Consumer-facing loyalty API (port 9005)
│   │   ├── src/voucher/           # Consumer voucher operations
│   │   └── src/reward/            # Reward claiming with strategies
│   ├── product-admin/             # Product management API
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
│   │   ├── voucher/entities/      # Voucher-related entities
│   │   ├── reward-item/entities/  # Reward item entities
│   │   ├── quest/entities/        # Quest entities
│   │   └── entities/loyalty-user.entity.ts
│   ├── middleware/                # Subdomain & credential middleware
│   │   ├── subdomain.middleware.ts
│   │   └── credential.middleware.ts
│   ├── product/                   # Product domain entities
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
|------------------------|--------------------------------------------------------------|-------|
| `SubdomainMiddleware`  | Extracts subdomain from Host header, validates client exists | 1st   |
| `CredentialMiddleware` | Validates `x-api-key` header against `client.api_key`        | 2nd   |

---

## 📦 Key Entities

### Master Database (Shared)

```typescript
// libs/database/src/entities/client.entity.ts
@Entity('clients', { synchronize: false })
export class ClientEntity extends BaseEntity {
  @Column({ unique: true })
  subdomain: string;           // Unique subdomain identifier (e.g., "client1")

  @Column()
  api_key: string;             // API key for credential validation

  @PrimaryColumn()
  database_name: string;       // Primary key, tenant database name

  @Column()
  database_username: string;   // Encrypted DB credentials

  @Column()
  database_password: string;   // Encrypted

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
  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', precision: 3 })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', precision: 3 })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true, precision: 3 })
  deleted_at: Date | null;     // Soft delete support
}
```

### Tenant Databases (Per Client)

```typescript
// Voucher Domain (libs/loyalty/src/voucher/entities/)
@Entity('vouchers')
export class VoucherEntity extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', unique: true })
  code: string;                // Voucher code (primary key)

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  quota: number;               // Max usage count

  @Column({ type: 'text', nullable: true })
  image: string;

  @ManyToMany(() => VoucherCategoryEntity, { cascade: true })
  @JoinTable({ name: 'vouchers_categories' })
  categories: VoucherCategoryEntity[];

  @ManyToMany(() => VoucherCategoryEntity, { cascade: true })
  @JoinTable({ name: 'vouchers_allow_combine_categories' })
  allow_combine_categories: VoucherCategoryEntity[];

  @OneToMany(() => VoucherValidityEntity, (v) => v.voucher, { cascade: true })
  validities: VoucherValidityEntity[];

  @OneToMany(() => VoucherBindingEntity, (b) => b.voucher, { cascade: true })
  bindings: VoucherBindingEntity[];  // Product/brand/store bindings

  @OneToMany(() => VoucherClaimEntity, (c) => c.voucher, { cascade: true })
  claims: VoucherClaimEntity[];

  @OneToMany(() => VoucherUsageEntity, (u) => u.voucher, { cascade: true })
  usages: VoucherUsageEntity[];

  @ManyToMany(() => LoyaltyUserEntity, { cascade: true })
  @JoinTable({ name: 'vouchers_target_users' })
  target_users: LoyaltyUserEntity[];  // Specific users allowed
}

// Reward Domain
@Entity('reward_items')
export class RewardItemEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  type: string;                // 'gopay', 'pulsa', etc.

  @Column({ type: 'int', default: -1 })
  stock: number;               // -1 = unlimited, 0 = out of stock

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
  async getConnection(databaseName: string, ...entityPath: string[]): Promise<DataSource>

  // Create new connection with decrypted credentials
  async createConnection(name: string, initFn: Function): Promise<DataSource>

  // Close and remove connection
  async closeConnection(name: string): Promise<void>
}
```

### EncryptionService (`libs/encryption/src/encryption.service.ts`)

```typescript

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey = process.env.CLIENT_DB_SECRET;

  encrypt(text: string): string      // Returns "iv:encrypted" format
  decrypt(text: string): string      // Decrypts AES format
  comparePassword(raw: string, hashed: string): Promise<boolean>  // bcrypt
}
```

### VoucherService (Admin)

CRUD operations for vouchers with category/user resolution:

```typescript

@Injectable()
export class VoucherService {
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(VoucherEntity);
  }

  create(createVoucherDto: CreateVoucherDto): Promise<VoucherEntity>

  findAll(paginationDto: BasePaginationDto): Promise<PaginatedResponse>

  findOne(id: string): Promise<VoucherEntity>

  update(id: string, updateVoucherDto: UpdateVoucherDto): Promise<VoucherEntity>

  remove(id: number): Promise<void>
}
```

### ACLService (`libs/auth/src/acl.service.ts`)

```typescript

@Injectable()
export class AclService {
  private readonly acl: Record<Role, string[]> = {
    [Role.USER]: ['read:profile'],
    [Role.ADMIN]: [
      'read:profile', 'write:profile', 'read:users', 'write:users',
      'read:vouchers', 'write:vouchers', 'read:quests', 'write:quests',
      'read:voucher-categories'
    ],
    [Role.SALES]: ['read:products', 'read:warehouses'],
    [Role.DRIVER]: ['read:orders', 'write:orders']
  };

  can(role: Role, permission: string): boolean
}
```

---

## 🚀 Applications

| App              | Port | Environment Variable    | Base Path        | Auth                 |
|------------------|------|-------------------------|------------------|----------------------|
| admin            | 9002 | `PORT_ADMIN`            | `/admin`         | JWT Bearer + API Key |
| loyalty-admin    | 9003 | `PORT_LOYALTY_ADMIN`    | `/loyalty-admin` | JWT Bearer + API Key |
| loyalty-consumer | 9005 | `PORT_LOYALTY_CONSUMER` | `/loyalty`       | JWT + API Key        |
| product-admin    | -    | -                       | -                | -                    |
| redistro         | -    | -                       | -                | -                    |
| user-admin       | 9004 | `PORT_USER_ADMIN`       | `/user-admin`    | JWT Bearer + API Key |
| user-consumer    | 9006 | `PORT_USER_CONSUMER`    | `/user`          | JWT + API Key        |

### Running Applications

```bash
# Development mode with watch
yarn start:admin --watch
yarn start:loyalty-admin --watch
yarn start:loyalty-consumer --watch
yarn start:user-admin --watch
yarn start:user-consumer --watch

# Production
yarn build
node dist/apps/admin/main.js
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
|--------------------|-----------------------------------|---------------------------------------|
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
  create(@Body() dto: CreateVoucherDto) {
  }

  @Get()
  @Permissions('read:vouchers')
  findAll(@Query() pagination: BasePaginationDto) {
  }
}
```

### Roles

```typescript
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  SALES = 'sales',
  DRIVER = 'driver'
}
```

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

# Application Ports
PORT_ADMIN=9002
PORT_USER_ADMIN=9004
PORT_USER_CONSUMER=9006
PORT_LOYALTY_ADMIN=9003
PORT_LOYALTY_CONSUMER=9005

# Internal URLs
URL_ADMIN_INTERNAL="http://localhost:9002"
URL_LOYAL_INTERNAL="http://localhost:9003"

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
yarn start:admin --watch          # Admin API on port 9002
yarn start:loyalty-admin --watch  # Loyalty Admin API on port 9003
yarn start:loyalty-consumer --watch # Consumer API on port 9005
yarn start:user-admin --watch     # User Admin API on port 9004
yarn start:user-consumer --watch  # User Consumer API on port 9006

# Database seeding (creates clients and admins)
yarn seed

# Linting and formatting
yarn lint                         # Run ESLint with auto-fix
yarn format                       # Run Prettier on all source files

# Testing
yarn test                         # Run unit tests
yarn test:watch                   # Run tests in watch mode
yarn test:cov                     # Run tests with coverage
yarn test:e2e                     # Run end-to-end tests
```

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

---

## 🧪 Testing Strategy

### Test Configuration (from `package.json`)

```json
{
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "testEnvironment": "node",
    "roots": [
      "<rootDir>/apps/",
      "<rootDir>/libs/"
    ],
    "moduleNameMapper": {
      "^@core/auth(|/.*)$": "<rootDir>/libs/auth/src/$1",
      "^@core/base(|/.*)$": "<rootDir>/libs/base/src/$1",
      "^@core/database(|/.*)$": "<rootDir>/libs/database/src/$1"
    }
  }
}
```

### Test Files Location

- Unit tests: `*.spec.ts` alongside source files
- E2E tests: `test/*.e2e-spec.ts` in app directories

### Running Tests

```bash
yarn test                         # All unit tests
yarn test --testPathPattern=voucher  # Specific pattern
yarn test:cov                     # With coverage report
```

---

## 🔒 Security Considerations

1. **Encryption Key**: `CLIENT_DB_SECRET` must be exactly 32 characters for AES-256-CBC
2. **API Keys**: Each client has a unique `api_key` validated on every request
3. **JWT Tokens**: Admin tokens expire in 1 week; consumer tokens have separate validation
4. **Database Credentials**: Stored encrypted in master database, decrypted at runtime
5. **Soft Deletes**: All entities extend `BaseEntity` with `deleted_at` for soft deletion
6. **CORS**: Enabled in production mode only (`app.enableCors()`)

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
  page: number;    // 0-indexed
  size: number;    // Items per page (default: 10)
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
6. **Middleware order matters**: SubdomainMiddleware → CredentialMiddleware
7. **Stock values**: `-1` = unlimited, `0` = out of stock, `>0` = limited

---

## 📚 Related Files Reference

| Concern           | Files                                                               |
|-------------------|---------------------------------------------------------------------|
| Tenant Resolution | `libs/middleware/src/middleware/subdomain.middleware.ts`            |
| Credential Check  | `libs/middleware/src/middleware/credential.middleware.ts`           |
| DB Connection     | `libs/database/src/database.service.ts`                             |
| Encryption        | `libs/encryption/src/encryption.service.ts`                         |
| JWT Strategy      | `libs/auth/src/jwt.strategy.ts`                                     |
| ACL System        | `libs/auth/src/acl.service.ts`, `libs/auth/src/guards/acl.guard.ts` |
| Voucher Domain    | `libs/loyalty/src/voucher/entities/*.entity.ts`                     |
| Voucher Admin     | `apps/loyalty-admin/src/voucher/*.ts`                               |
| Voucher Consumer  | `apps/loyalty-consumer/src/voucher/*.ts`                            |
| Reward Strategy   | `apps/loyalty-consumer/src/reward/strategy/*.ts`                    |
| Seeding           | `apps/admin/src/seeder/*.ts`                                        |
