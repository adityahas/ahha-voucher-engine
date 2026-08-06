# Tenant Currency Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tenant-specific currency and `Intl.NumberFormat` settings, editable from CMS and consumed by CMS and consumer price displays.

**Architecture:** Store one `client_settings` row per tenant in the master database. Expose authenticated admin read/update endpoints from the admin app and a read-only consumer endpoint from the product-consumer app, with tenant identity derived only from middleware request context. Add frontend API/formatter utilities and a CMS live-preview page using the existing dark glass layout.

**Tech Stack:** NestJS, TypeORM, PostgreSQL, class-validator, React 19, React Router, Zustand, Tailwind CSS, Vitest, React Testing Library, `Intl.NumberFormat`.

## Global Constraints

- Tenant identity must come from request context/middleware, never from a client-supplied tenant identifier.
- All monetary values remain decimal/string values from APIs and are formatted only at the UI boundary.
- Currency codes accept valid ISO 4217 codes and are normalized to uppercase.
- Locales must be valid BCP 47 locales supported by `Intl.NumberFormat`.
- Only allowlisted `Intl.NumberFormat` options may be persisted.
- Every admin tenant may edit only the active tenant's settings.
- Consumer responses must expose formatting fields only, never database credentials or unrelated client fields.
- Missing settings use `IDR`, `id-ID`, and `{}` without overwriting persisted settings.
- Existing middleware order and CORS preflight behavior must remain unchanged.
- Use `decimal(12,2)` for stored monetary values and never introduce floating-point persistence.

---

## File Map

### Backend files

- Create `libs/database/src/entities/client-settings.entity.ts`: master-database settings entity.
- Modify `libs/database/src/entities/client.entity.ts`: add the inverse one-to-one relation if useful for repository access.
- Modify `libs/database/src/index.ts`: export the new entity.
- Create `libs/database/src/client-settings/client-settings.types.ts`: shared backend settings contract and defaults.
- Create `libs/database/src/client-settings/client-settings.service.ts`: validation, defaults, tenant-scoped reads, and upserts.
- Create `libs/database/src/client-settings/client-settings.service.spec.ts`: service and isolation tests.
- Create `apps/admin/src/settings/settings.controller.ts`: authenticated admin GET/PUT endpoints.
- Create `apps/admin/src/settings/dto/update-currency-settings.dto.ts`: request DTO and nested override validation.
- Create `apps/admin/src/settings/settings.controller.spec.ts`: admin authorization and response tests.
- Modify `apps/admin/src/admin.module.ts`: register settings entity, service, and controller.
- Create `apps/product-consumer/src/settings/settings.controller.ts`: public tenant-scoped read endpoint.
- Create `apps/product-consumer/src/settings/settings.controller.spec.ts`: consumer response tests.
- Modify `apps/product-consumer/src/product-consumer.module.ts`: register master settings entity/service/controller.
- Create `database/migrations/20260807-create-client-settings.sql`: idempotent master-database table migration.

### CMS files

- Create `apps/frontend-cms/src/types/currency-settings.ts`: frontend contract and default values.
- Create `apps/frontend-cms/src/api/settings.ts`: GET/PUT client for admin settings endpoints.
- Create `apps/frontend-cms/src/lib/currency-format.ts`: deterministic formatter and preview helpers.
- Create `apps/frontend-cms/src/lib/currency-format.spec.ts`: formatter behavior tests.
- Create `apps/frontend-cms/src/pages/CurrencySettings.tsx`: two-column settings page and live preview.
- Create `apps/frontend-cms/src/pages/CurrencySettings.spec.tsx`: page state and interaction tests.
- Modify `apps/frontend-cms/src/router/index.tsx`: register `/settings/currency`.
- Modify `apps/frontend-cms/src/components/layout/MainLayout.tsx`: turn Settings placeholder into a `NavLink`.
- Modify `apps/frontend-cms/src/pages/ProductList.tsx`: replace hardcoded `USD` formatting with tenant formatter.

### Consumer files

- Create `apps/frontend-consumer/src/types/currency-settings.ts`: consumer settings contract/defaults.
- Create `apps/frontend-consumer/src/api/settings.ts`: read-only settings API client.
- Create `apps/frontend-consumer/src/lib/currency-format.ts`: settings-aware formatter.
- Create `apps/frontend-consumer/src/lib/currency-format.spec.ts`: consumer formatter tests.
- Modify price-rendering components/pages such as `ProductCard.tsx`, `CheckoutView.tsx`, and voucher price displays: use the settings-aware formatter.
- Modify `apps/frontend-consumer/src/App.tsx`: load tenant settings once and provide them to price-rendering views using the existing app state pattern.

---

### Task 1: Add Master Database Settings Schema and Contract

**Files:**

- Create: `database/migrations/20260807-create-client-settings.sql`
- Create: `libs/database/src/entities/client-settings.entity.ts`
- Modify: `libs/database/src/entities/client.entity.ts`
- Modify: `libs/database/src/index.ts`
- Create: `libs/database/src/client-settings/client-settings.types.ts`

**Interfaces:**

- Produces `ClientSettingsEntity` with `client_database_name`, `currency_code`, `locale`, `number_format_options`, and base timestamps.
- Produces `DEFAULT_CURRENCY_SETTINGS` and `CurrencySettings` for backend consumers.

- [ ] **Step 1: Write the schema migration**

Create an idempotent PostgreSQL migration with a unique foreign key to `clients(database_name)`, uppercase currency default `IDR`, locale default `id-ID`, and JSONB default `{}`. Use `timestamptz` columns consistent with the existing `BaseEntity`.

```sql
CREATE TABLE IF NOT EXISTS client_settings (
  client_database_name varchar PRIMARY KEY REFERENCES clients(database_name) ON DELETE CASCADE,
  currency_code varchar(3) NOT NULL DEFAULT 'IDR',
  locale varchar(35) NOT NULL DEFAULT 'id-ID',
  number_format_options jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

- [ ] **Step 2: Define the TypeORM entity and relation**

Map the table using `@Entity('client_settings', { synchronize: false })`. Use `@PrimaryColumn()` for `client_database_name`, `@Column({ type: 'varchar', length: 3, default: 'IDR' })` for the code, and a JSONB column for options. Do not add a runtime relation to `ClientEntity`; the settings service scopes queries by the client database name and this keeps the master entity from being included in tenant connection loading.

- [ ] **Step 3: Export the contract**

Export the entity from `libs/database/src/index.ts` and define:

```ts
export interface CurrencySettings {
  currency_code: string;
  locale: string;
  number_format_options: Intl.NumberFormatOptions;
}

export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  currency_code: 'IDR',
  locale: 'id-ID',
  number_format_options: {},
};
```

- [ ] **Step 4: Verify type/build impact**

Run `yarn nest build admin` and confirm the entity exports compile without changing tenant entity discovery.

- [ ] **Step 5: Commit**

```bash
git add database/migrations/20260807-create-client-settings.sql libs/database/src/entities/client-settings.entity.ts libs/database/src/entities/client.entity.ts libs/database/src/index.ts libs/database/src/client-settings/client-settings.types.ts
git commit -m "feat: add tenant currency settings schema"
```

### Task 2: Implement Shared Backend Settings Service and Admin API

**Files:**

- Create: `libs/database/src/client-settings/client-settings.service.ts`
- Create: `libs/database/src/client-settings/client-settings.service.spec.ts`
- Create: `apps/admin/src/settings/dto/update-currency-settings.dto.ts`
- Create: `apps/admin/src/settings/settings.controller.ts`
- Create: `apps/admin/src/settings/settings.controller.spec.ts`
- Modify: `apps/admin/src/admin.module.ts`

**Interfaces:**

- `ClientSettingsService.getForTenant(databaseName: string): Promise<CurrencySettings>`
- `ClientSettingsService.updateForTenant(databaseName: string, input: UpdateCurrencySettingsInput): Promise<CurrencySettings>`
- Admin routes `GET /admin/settings/currency` and `PUT /admin/settings/currency`.

- [ ] **Step 1: Write service tests first**

Cover missing-row defaults, uppercase normalization, valid locale acceptance, invalid currency rejection, invalid locale rejection, unsupported option rejection, and tenant isolation. Mock the master `Repository<ClientSettingsEntity>` and verify every query uses the supplied `databaseName`.

```ts
it('returns defaults when the tenant has no settings row', async () => {
  repository.findOne.mockResolvedValue(null);
  await expect(service.getForTenant('tenant_a')).resolves.toEqual(
    DEFAULT_CURRENCY_SETTINGS,
  );
  expect(repository.findOne).toHaveBeenCalledWith({
    where: { client_database_name: 'tenant_a' },
  });
});
```

- [ ] **Step 2: Run the focused service tests and confirm failure**

Run `yarn test --testPathPattern=client-settings.service.spec.ts --runInBand`. Expected: FAIL because the service and entity behavior are not implemented yet.

- [ ] **Step 3: Implement validation and upsert behavior**

Use `Intl.NumberFormat.supportedLocalesOf([locale])` to validate locales. Validate ISO 4217 by constructing `new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode })` and require a three-letter uppercase code. Validate each option against an allowlist with explicit primitive/enumeration checks, then call `repository.save` with the active tenant key.

- [ ] **Step 4: Make the service tests pass**

Run the same focused command. Expected: PASS for defaults, normalization, validation, and tenant scoping.

- [ ] **Step 5: Add DTO and admin controller tests**

Use `@IsString`, `@IsOptional`, `@IsObject`, and nested validation for override fields. The controller must use `@Req()` only to read the middleware-provided `request['client'].database_name`, plus `@UseGuards(AdminJwtGuard, AclGuard)` and `@Permissions('write:profile')`, which is already granted to the admin role in `AclService`. Add tests proving the controller never accepts a tenant id from the request body and calls the service with the active tenant database name.

- [ ] **Step 6: Register and verify the admin module**

Register `ClientSettingsEntity` with the master TypeORM connection, provide the service, and register the settings controller. Run `yarn nest build admin`; expected: successful build.

- [ ] **Step 7: Commit**

```bash
git add libs/database/src/client-settings apps/admin/src/settings apps/admin/src/admin.module.ts
git commit -m "feat: add admin currency settings API"
```

### Task 3: Add Consumer Read-Only Settings API

**Files:**

- Create: `apps/product-consumer/src/settings/settings.controller.ts`
- Create: `apps/product-consumer/src/settings/settings.controller.spec.ts`
- Modify: `apps/product-consumer/src/product-consumer.module.ts`

**Interfaces:**

- `GET /product/settings/currency` from the product-consumer app’s global `product` prefix.
- Returns the same `CurrencySettings` contract as the admin GET endpoint.

- [ ] **Step 1: Write controller tests**

Test that the route returns settings for the middleware-resolved tenant and that the response contains only `currency_code`, `locale`, and `number_format_options`.

- [ ] **Step 2: Implement the controller**

Inject `ClientSettingsService`, read `request['client'].database_name`, and call `getForTenant`. Do not accept a path, query, or body tenant identifier. Keep the endpoint protected by the existing API-key/subdomain middleware but not by an admin JWT guard.

- [ ] **Step 3: Register master entity and service**

Add `ClientSettingsEntity` to the master `TypeOrmModule.forRoot` entity list and provide the shared service in `ProductConsumerModule`. Do not add the entity to the request-scoped tenant `DataSource`.

- [ ] **Step 4: Run tests and build**

Run `yarn test --testPathPattern=product-consumer/src/settings --runInBand` and `yarn nest build product-consumer`. Expected: tests PASS and build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/product-consumer/src/settings apps/product-consumer/src/product-consumer.module.ts
git commit -m "feat: expose public tenant currency settings"
```

### Task 4: Add CMS Settings API, Formatter, and Page

**Files:**

- Create: `apps/frontend-cms/src/types/currency-settings.ts`
- Create: `apps/frontend-cms/src/api/settings.ts`
- Create: `apps/frontend-cms/src/lib/currency-format.ts`
- Create: `apps/frontend-cms/src/lib/currency-format.spec.ts`
- Create: `apps/frontend-cms/src/pages/CurrencySettings.tsx`
- Create: `apps/frontend-cms/src/pages/CurrencySettings.spec.tsx`
- Modify: `apps/frontend-cms/src/router/index.tsx`
- Modify: `apps/frontend-cms/src/components/layout/MainLayout.tsx`

**Interfaces:**

- `formatCurrency(value: number | string, settings: CurrencySettings): string`
- `getCurrencySettings(): Promise<CurrencySettings>`
- `updateCurrencySettings(input: CurrencySettings): Promise<CurrencySettings>`

- [ ] **Step 1: Write formatter tests**

Cover `IDR`/`id-ID`, `USD`/`en-US`, alternate locales, decimal overrides, grouping overrides, `currencyDisplay`, and decimal-string input. Assert formatting through `Intl.NumberFormat`, not hardcoded symbol strings.

- [ ] **Step 2: Implement the formatter**

Merge `locale`, `currency: currency_code`, and `style: 'currency'` with `number_format_options`. Convert decimal strings to finite numbers only for display; throw no UI-breaking error for invalid input and return a safe fallback string such as `-`.

- [ ] **Step 3: Add API wrapper and frontend types**

Use the existing Axios/request helper pattern in `apps/frontend-cms/src/api`. Keep the API response normalized to `CurrencySettings`, and use defaults only as initial fallback state when a GET fails; never PUT defaults after a failed GET.

- [ ] **Step 4: Write page tests before implementation**

Mock settings API calls and test: loading state, fields populated from API, live preview updates when draft values change, advanced option edits, reset overrides, save success, save failure preserving draft state, and unsaved changes guard.

- [ ] **Step 5: Implement the two-column page**

Use existing `Card`, `Input`, `Button`, and styling patterns. Render currency code and locale controls, an advanced options section for the allowlisted fields, reset/save/cancel actions, and preview examples for product, discount, subtotal, final price, and large/compact values. Stack the panels on small screens.

- [ ] **Step 6: Add route and navigation**

Register `/settings/currency` under `MainLayout` and replace the `href="#"` Settings anchor with a `NavLink` to that route.

- [ ] **Step 7: Replace CMS hardcoded currency display**

Update `ProductList.tsx` to load/use the tenant formatter rather than `currency: 'USD'`. Preserve existing loading and error behavior while settings load.

- [ ] **Step 8: Run CMS tests and type check**

Run `cd apps/frontend-cms && npx vitest run` and `cd apps/frontend-cms && npx tsc --noEmit`. Expected: all tests PASS and type checking succeeds.

- [ ] **Step 9: Commit**

```bash
git add apps/frontend-cms/src
git commit -m "feat: add CMS tenant currency settings"
```

### Task 5: Integrate Tenant Formatting Across Consumer UI

**Files:**

- Create: `apps/frontend-consumer/src/types/currency-settings.ts`
- Create: `apps/frontend-consumer/src/api/settings.ts`
- Create: `apps/frontend-consumer/src/lib/currency-format.ts`
- Create: `apps/frontend-consumer/src/lib/currency-format.spec.ts`
- Modify: `apps/frontend-consumer/src/App.tsx`
- Modify: price-rendering files including `ProductCard.tsx`, `CheckoutView.tsx`, and voucher display components.

**Interfaces:**

- `formatCurrency(value: number | string, settings: CurrencySettings): string`
- `getCurrencySettings(): Promise<CurrencySettings>`

- [ ] **Step 1: Write consumer formatter tests**

Reuse the same contract tests as CMS for defaults, alternate locale, and overrides, adapted to the consumer formatter module.

- [ ] **Step 2: Implement settings fetch and app-level state**

Fetch `GET /product/settings/currency` once in `App.tsx` before rendering the routed views. Keep `CurrencySettings` in app state and pass it through a small context/provider to product, voucher, and checkout views. Use documented defaults while loading and surface a non-blocking error if the fetch fails.

- [ ] **Step 3: Replace hardcoded price formatting**

Update product cards, showcase/listing, checkout subtotal/discount/final price, and voucher price displays to call `formatCurrency`. Do not alter API monetary values or discount calculations.

- [ ] **Step 4: Run consumer tests and type check**

Run `cd apps/frontend-consumer && npx vitest run` and `cd apps/frontend-consumer && npx tsc --noEmit`. Expected: all tests PASS and type checking succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend-consumer/src
git commit -m "feat: use tenant currency in consumer UI"
```

### Task 6: End-to-End Verification and Regression Coverage

**Files:**

- Modify relevant existing backend/frontend specs only where regression coverage is needed.
- Verify `database/migrations/20260807-create-client-settings.sql` against a local master database.

- [ ] **Step 1: Apply the migration to a clean and existing-tenant database**

Run the project’s documented PostgreSQL setup, apply the SQL migration, and verify `client_settings` exists with the foreign key and defaults. Insert two tenant settings rows with different locales/currencies and confirm they remain isolated.

- [ ] **Step 2: Run backend verification**

Run `yarn test --runInBand` and build the modified apps with `yarn nest build admin` and `yarn nest build product-consumer`. Expected: all relevant tests pass and both builds succeed.

- [ ] **Step 3: Run frontend verification**

Run `cd apps/frontend-cms && npx vitest run && npx tsc --noEmit && npm run build`, then `cd apps/frontend-consumer && npx vitest run && npx tsc --noEmit && npm run build`. Expected: all tests, type checks, and builds succeed.

- [ ] **Step 4: Verify the tenant boundary manually**

With two tenant hostnames and API keys, confirm admin GET/PUT and consumer GET return different settings for each tenant. Confirm a request cannot select another tenant through query/body/path input.

- [ ] **Step 5: Commit regression updates**

```bash
git add apps libs database
git commit -m "test: verify tenant currency settings integration"
```

## Self-Review Checklist

- Spec coverage: data model is Task 1; admin API and validation are Task 2; consumer API is Task 3; CMS UX and hardcoded USD replacement are Task 4; consumer integration is Task 5; security, isolation, migration, and verification are Task 6.
- Placeholder scan: no `TBD`, `TODO`, or unspecified “handle errors” steps remain; each task names files, interfaces, tests, commands, and expected outcomes.
- Type consistency: all tasks use `CurrencySettings`, `getCurrencySettings`, `updateCurrencySettings`, and `formatCurrency` with matching shapes.
- Scope: exchange rates, multi-currency pricing, and unrelated settings are explicitly excluded.
