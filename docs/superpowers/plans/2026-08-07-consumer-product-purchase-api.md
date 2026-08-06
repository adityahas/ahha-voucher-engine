# Consumer Product Purchase API (`POST /product/purchase`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a new `POST /product/purchase` endpoint in `apps/product-consumer` microservice to proxy purchase requests to upstream `/loyalty/purchase` gateway while validating parameters and attaching purchase metadata (`payment_method`, `notes`).

**Architecture:** A NestJS controller (`PurchaseConsumerController`) handles `POST /product/purchase` guarded by `ConsumerJwtGuard`. The controller delegates HTTP forwarding to `PurchaseConsumerService`, which uses `@nestjs/axios` (`HttpService`) to call upstream `http://localhost:8080/loyalty/purchase`, passing headers (`Authorization`, `x-api-key`, `x-tenant-override`), handling errors, and returning the enriched order payload.

**Tech Stack:** NestJS 11.x, TypeScript, `@nestjs/axios`, `class-validator`, `ConsumerJwtGuard`, Jest / NestJS Testing module.

## Global Constraints

- Endpoints must be protected with `@UseGuards(ConsumerJwtGuard)`
- Base route for `PurchaseConsumerController` must be `@Controller('purchase')`
- HTTP client must use `HttpService` from `@nestjs/axios`
- Upstream base URL must fallback to `'http://localhost:8080'` via `process.env.LOYALTY_API_BASE_URL`

---

### Task 1: Create Purchase DTO & Service in `apps/product-consumer`

**Files:**

- Create: `apps/product-consumer/src/dto/consumer-product-purchase.dto.ts`
- Create: `apps/product-consumer/src/purchase-consumer.service.ts`
- Test: `apps/product-consumer/src/purchase-consumer.service.spec.ts`

**Interfaces:**

- Consumes: `@nestjs/axios` (`HttpService`), `class-validator`
- Produces: `PurchaseConsumerService.executePurchase(dto, req)` returning enriched order response.

- [ ] **Step 1: Write failing service unit test**

```typescript
// apps/product-consumer/src/purchase-consumer.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { BadRequestException } from '@nestjs/common';
import { PurchaseConsumerService } from './purchase-consumer.service';

describe('PurchaseConsumerService', () => {
  let service: PurchaseConsumerService;
  let httpService: HttpService;

  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseConsumerService,
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<PurchaseConsumerService>(PurchaseConsumerService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully proxy purchase request to upstream loyalty service', async () => {
    const mockDto = {
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 2,
      voucher_code: 'PROMO2025',
      payment_method: 'MANUAL_TRANSFER',
      notes: 'Please handle with care',
    };

    const mockReq = {
      headers: {
        authorization: 'Bearer mock-jwt-token',
        'x-api-key': 'client1-api-key',
        'x-tenant-override': 'client1',
      },
    };

    const mockUpstreamResponse: AxiosResponse = {
      data: {
        id: 'order-101',
        product_id: mockDto.product_id,
        quantity: mockDto.quantity,
        total_price: 100000,
      },
      status: 201,
      statusText: 'Created',
      headers: {},
      config: { headers: {} as any },
    };

    mockHttpService.post.mockReturnValue(of(mockUpstreamResponse));

    const result = await service.executePurchase(
      mockDto as any,
      mockReq as any,
    );

    expect(result).toEqual({
      ...mockUpstreamResponse.data,
      payment_method: 'MANUAL_TRANSFER',
      notes: 'Please handle with care',
    });
    expect(mockHttpService.post).toHaveBeenCalledWith(
      'http://localhost:8080/loyalty/purchase',
      {
        product_id: mockDto.product_id,
        quantity: mockDto.quantity,
        voucher_code: mockDto.voucher_code,
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-jwt-token',
          'x-api-key': 'client1-api-key',
          'x-tenant-override': 'client1',
        }),
      }),
    );
  });

  it('should handle axios error and throw BadRequestException', async () => {
    const mockDto = {
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 1,
    };

    const mockReq = { headers: {} };

    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: 'Voucher quota exhausted' },
      },
    } as AxiosError;

    mockHttpService.post.mockReturnValue(throwError(() => axiosError));

    await expect(
      service.executePurchase(mockDto as any, mockReq as any),
    ).rejects.toThrow(BadRequestException);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx jest apps/product-consumer/src/purchase-consumer.service.spec.ts`
Expected: FAIL ("Cannot find module './purchase-consumer.service'")

- [ ] **Step 3: Create Purchase DTO**

```typescript
// apps/product-consumer/src/dto/consumer-product-purchase.dto.ts
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from '@nestjs/class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConsumerProductPurchaseDto {
  @ApiProperty({ description: 'Target product UUID' })
  @IsNotEmpty()
  @IsUUID()
  product_id: string;

  @ApiProperty({ description: 'Purchase quantity', minimum: 1, default: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Optional voucher code' })
  @IsOptional()
  @IsString()
  voucher_code?: string;

  @ApiPropertyOptional({
    description: 'Preferred payment method',
    default: 'MANUAL_TRANSFER',
  })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiPropertyOptional({ description: 'Optional order notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
```

- [ ] **Step 4: Write PurchaseConsumerService implementation**

```typescript
// apps/product-consumer/src/purchase-consumer.service.ts
import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ConsumerProductPurchaseDto } from './dto/consumer-product-purchase.dto';

@Injectable()
export class PurchaseConsumerService {
  constructor(private readonly httpService: HttpService) {}

  async executePurchase(
    dto: ConsumerProductPurchaseDto,
    req: any,
  ): Promise<any> {
    const baseUrl = process.env.LOYALTY_API_BASE_URL || 'http://localhost:8080';
    const targetUrl = `${baseUrl}/loyalty/purchase`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: req.headers?.authorization || '',
      'x-api-key': req.headers?.['x-api-key'] || 'client1-api-key',
      'x-tenant-override': req.headers?.['x-tenant-override'] || 'client1',
    };

    const payload = {
      product_id: dto.product_id,
      quantity: dto.quantity,
      ...(dto.voucher_code && { voucher_code: dto.voucher_code }),
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(targetUrl, payload, { headers }),
      );

      return {
        ...response.data,
        payment_method: dto.payment_method || 'MANUAL_TRANSFER',
        notes: dto.notes || null,
      };
    } catch (error: any) {
      if (error?.response) {
        const status = error.response.status || HttpStatus.BAD_REQUEST;
        const message =
          error.response.data?.message || 'Failed to complete purchase';

        if (status === 404) {
          throw new NotFoundException(message);
        } else if (status === 401) {
          throw new UnauthorizedException(message);
        } else {
          throw new BadRequestException(message);
        }
      }

      throw new HttpException(
        error.message || 'Upstream service unreachable',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
```

- [ ] **Step 5: Run unit test to verify it passes**

Run: `npx jest apps/product-consumer/src/purchase-consumer.service.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit Task 1**

```bash
git add apps/product-consumer/src/dto/consumer-product-purchase.dto.ts apps/product-consumer/src/purchase-consumer.service.ts apps/product-consumer/src/purchase-consumer.service.spec.ts
git commit -m "feat(product-consumer): implement PurchaseConsumerService and Purchase DTO"
```

---

### Task 2: Create Controller & Module Integration in `apps/product-consumer`

**Files:**

- Create: `apps/product-consumer/src/purchase-consumer.controller.ts`
- Test: `apps/product-consumer/src/purchase-consumer.controller.spec.ts`
- Modify: `apps/product-consumer/src/product-consumer.module.ts`

**Interfaces:**

- Consumes: `PurchaseConsumerService`, `ConsumerJwtGuard`, `HttpModule`
- Produces: Endpoint `POST /product/purchase`

- [ ] **Step 1: Write failing controller unit test**

```typescript
// apps/product-consumer/src/purchase-consumer.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseConsumerController } from './purchase-consumer.controller';
import { PurchaseConsumerService } from './purchase-consumer.service';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';

describe('PurchaseConsumerController', () => {
  let controller: PurchaseConsumerController;
  let service: PurchaseConsumerService;

  const mockService = {
    executePurchase: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseConsumerController],
      providers: [{ provide: PurchaseConsumerService, useValue: mockService }],
    })
      .overrideGuard(ConsumerJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PurchaseConsumerController>(
      PurchaseConsumerController,
    );
    service = module.get<PurchaseConsumerService>(PurchaseConsumerService);
  });

  it('should call executePurchase on service and return order', async () => {
    const mockDto = {
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 1,
    };
    const mockReq = { user: { core_user_id: 'user-1' } };
    const mockResult = { id: 'order-1', total_price: 50000 };

    mockService.executePurchase.mockResolvedValue(mockResult);

    const response = await controller.purchase(mockReq, mockDto as any);

    expect(service.executePurchase).toHaveBeenCalledWith(mockDto, mockReq);
    expect(response).toEqual(mockResult);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx jest apps/product-consumer/src/purchase-consumer.controller.spec.ts`
Expected: FAIL ("Cannot find module './purchase-consumer.controller'")

- [ ] **Step 3: Write PurchaseConsumerController implementation**

```typescript
// apps/product-consumer/src/purchase-consumer.controller.ts
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';
import { PurchaseConsumerService } from './purchase-consumer.service';
import { ConsumerProductPurchaseDto } from './dto/consumer-product-purchase.dto';

@ApiTags('Purchase')
@ApiBearerAuth()
@Controller('purchase')
@UseGuards(ConsumerJwtGuard)
export class PurchaseConsumerController {
  constructor(private readonly purchaseService: PurchaseConsumerService) {}

  @Post()
  @ApiOperation({ summary: 'Execute product purchase transaction' })
  @ApiResponse({ status: 201, description: 'Purchase completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payload or voucher error' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async purchase(
    @Req() req: any,
    @Body() dto: ConsumerProductPurchaseDto,
  ): Promise<any> {
    return this.purchaseService.executePurchase(dto, req);
  }
}
```

- [ ] **Step 4: Update ProductConsumerModule**

```typescript
// apps/product-consumer/src/product-consumer.module.ts
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  Scope,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule, DatabaseService } from '@core/database';
import { AuthModule } from '@core/auth';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { CredentialMiddleware, SubdomainMiddleware } from '@core/middleware';
import { ClientEntity } from '@core/database/entities/client.entity';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
import { ProductConsumerController } from './product-consumer.controller';
import { PurchaseConsumerController } from './purchase-consumer.controller';
import { PurchaseConsumerService } from './purchase-consumer.service';
import { HealthController } from '@core/base';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: false,
      logging: process.env.DB_LOGGING != 'false',
      entities: [ClientEntity],
    }),
    DatabaseModule,
    AuthModule,
    HttpModule,
  ],
  providers: [
    PurchaseConsumerService,
    {
      provide: 'PRODUCT_CONSUMER_CONNECTION',
      scope: Scope.REQUEST,
      useFactory: async (
        request: Request,
        databaseService: DatabaseService,
      ): Promise<DataSource> => {
        const databaseName = request['client'].database_name;
        return await databaseService.getConnection(
          databaseName,
          __dirname + '/../../../**/*.entity{.ts,.js}',
        );
      },
      inject: [REQUEST, DatabaseService],
    },
  ],
  controllers: [
    ProductConsumerController,
    PurchaseConsumerController,
    HealthController,
  ],
  exports: ['PRODUCT_CONSUMER_CONNECTION'],
})
export class ProductConsumerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SubdomainMiddleware, CredentialMiddleware)
      .exclude({ path: 'health', method: RequestMethod.ALL })
      .forRoutes('*');
  }
}
```

- [ ] **Step 5: Run controller test to verify it passes**

Run: `npx jest apps/product-consumer/src/purchase-consumer.controller.spec.ts`
Expected: PASS

- [ ] **Step 6: Build application and run full suite**

Run: `yarn nest build product-consumer`
Expected: Build succeeds with 0 errors.

- [ ] **Step 7: Commit Task 2**

```bash
git add apps/product-consumer/src/purchase-consumer.controller.ts apps/product-consumer/src/purchase-consumer.controller.spec.ts apps/product-consumer/src/product-consumer.module.ts
git commit -m "feat(product-consumer): register PurchaseConsumerController and HttpModule in ProductConsumerModule"
```

---

## Plan Self-Review

1. **Spec Coverage Check**:
   - `POST /product/purchase` endpoint: Task 2 Step 3
   - `ConsumerProductPurchaseDto`: Task 1 Step 3
   - `PurchaseConsumerService` & `HttpService` proxying: Task 1 Step 4
   - Header forwarding & error mapping: Task 1 Step 4
   - `ProductConsumerModule` registration: Task 2 Step 4
2. **Placeholder Scan**: Zero TBDs, TODOs, or vague placeholders.
3. **Type Consistency**: `ConsumerProductPurchaseDto` and `PurchaseConsumerService` methods use consistent naming across controller, service, and tests.
