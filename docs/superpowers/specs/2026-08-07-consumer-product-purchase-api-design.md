# Design Specification: Consumer Product Purchase API (`POST /product/purchase`)

**Date**: 2026-08-07  
**Status**: APPROVED  
**Target Module**: `apps/product-consumer`

---

## 🎯 Overview & Goal

The **Consumer Product Purchase API** adds a purchase transaction endpoint (`POST /product/purchase`) to the `product-consumer` microservice. This endpoint allows storefront consumers to purchase products with optional voucher application, extended e-commerce metadata (`payment_method`, `notes`), and automatic proxy forwarding to the underlying loyalty purchase engine (`http://localhost:8080/loyalty/purchase`).

---

## 🏛️ Architecture & Component Design

### 1. New Components in `apps/product-consumer`

#### A. DTO (`apps/product-consumer/src/dto/consumer-product-purchase.dto.ts`)

- **`product_id`** (`string`, UUID, Required): Target product ID.
- **`quantity`** (`number`, Integer, Min 1, Required): Purchase quantity.
- **`voucher_code`** (`string`, Optional): Optional voucher code to apply.
- **`payment_method`** (`string`, Optional, Default: `"MANUAL_TRANSFER"`): Preferred payment method.
- **`notes`** (`string`, Optional): Additional order notes.

#### B. Controller (`apps/product-consumer/src/purchase-consumer.controller.ts`)

- **Route**: `@Controller('purchase')` -> Exposed as `POST /product/purchase` via global prefix `/product`.
- **Guards**: `@UseGuards(ConsumerJwtGuard)` for authenticated consumer user access.
- **Swagger/OpenAPI**: Fully documented with `@ApiTags('Purchase')`, `@ApiOperation()`, and `@ApiResponse()`.

#### C. Service (`apps/product-consumer/src/purchase-consumer.service.ts`)

- **Dependency**: `@nestjs/axios` (`HttpService`).
- **Target Endpoint**: Configurable via `process.env.LOYALTY_API_BASE_URL || 'http://localhost:8080'` -> `${LOYALTY_API_BASE_URL}/loyalty/purchase`.
- **Header Forwarding**:
  - `Authorization` (`Bearer <token>`)
  - `x-api-key` (from request or fallback `client1-api-key`)
  - `x-tenant-override` (from request or fallback `client1`)
- **Error Handling**: Catches `AxiosError` from upstream gateway calls and re-throws appropriate NestJS `HttpException` (`BadRequestException`, `NotFoundException`, `UnauthorizedException`) with the original error message.

#### D. Module Updates (`apps/product-consumer/src/product-consumer.module.ts`)

- Imports `HttpModule` from `@nestjs/axios`.
- Registers `PurchaseConsumerController` and `PurchaseConsumerService`.

---

## 🔄 Data Flow

```text
[ Client (Consumer App) ]
         │
         │ POST /product/purchase
         │ Headers: Authorization, x-api-key, x-tenant-override
         │ Body: { product_id, quantity, voucher_code, payment_method, notes }
         ▼
[ PurchaseConsumerController ] (@UseGuards(ConsumerJwtGuard))
         │
         ▼
[ PurchaseConsumerService ]
         │
         │ Extract Headers & Build Payload: { product_id, quantity, voucher_code }
         │ Call Upstream via HttpService.post():
         │ URL: http://localhost:8080/loyalty/purchase
         ▼
[ Nginx API Gateway (8080) ] ────► [ loyalty-consumer (/loyalty/purchase) ]
                                             │
                                             ▼
                                  [ DB Pessimistic Transaction ]
                                  - Validate product & calculated price
                                  - Validate & apply voucher discount
                                  - Create Order record
         ┌───────────────────────────────────┘
         ▼
[ PurchaseConsumerService ] (Receives Order Entity)
         │
         │ Attach payment_method & notes metadata
         ▼
[ Client (Consumer App) ] (HTTP 201 Created Response)
```

---

## 🧪 Testing Strategy

1. **Unit Tests**:
   - `PurchaseConsumerController`: Test request validation and service invocation.
   - `PurchaseConsumerService`: Test successful HTTP forwarding, header extraction, and Axios error handling.
2. **Integration / E2E Verification**:
   - Verify `POST /product/purchase` via `curl` against live Docker containers (`http://localhost:8080/product/purchase`).
