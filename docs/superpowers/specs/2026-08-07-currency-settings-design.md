# Tenant Currency and Number Format Settings

## Goal

Add a CMS settings page that lets every tenant admin configure the currency and number formatting used by both the CMS and consumer applications. Each tenant must have an isolated configuration stored in the master database.

## Scope

### In scope

- Tenant-specific currency code using any valid ISO 4217 code.
- Tenant-specific BCP 47 locale, such as `id-ID` or `en-US`.
- Optional overrides for supported `Intl.NumberFormat` options.
- CMS page with a two-column configuration form and live preview.
- Admin read/update API and public read-only consumer API.
- Shared frontend formatting utility used by CMS and consumer displays.
- Validation, fallback behavior, tenant isolation, and automated tests.

### Out of scope

- Exchange-rate conversion between currencies.
- Multi-currency prices for a single tenant.
- Per-user, per-product, or per-voucher formatting overrides.
- Currency symbol or locale management outside the tenant settings page.

## Data Model

Create `ClientSettingsEntity` in the master database, with a one-to-one relationship to `ClientEntity`.

Suggested fields:

- `client_database_name`: foreign key to `clients.database_name`, unique.
- `currency_code`: uppercase ISO 4217 code, for example `IDR` or `USD`.
- `locale`: valid BCP 47 locale, for example `id-ID` or `en-US`.
- `number_format_options`: JSONB containing allowlisted `Intl.NumberFormat` overrides.
- `created_at`, `updated_at`: standard base timestamps.

Defaults when a tenant has no settings row:

- `currency_code`: `IDR`
- `locale`: `id-ID`
- `number_format_options`: `{}`

The service should resolve defaults before returning a response. A migration should create the table and support existing tenants without requiring destructive schema synchronization.

## API

### Admin API

`GET /admin/settings/currency`

- Requires admin JWT and ACL authorization.
- Resolves the active tenant from request context.
- Returns the tenant's effective currency settings.

`PUT /admin/settings/currency`

- Requires admin JWT and ACL authorization.
- All authenticated tenant admins may update the active tenant's settings.
- Validates ISO 4217 currency, BCP 47 locale, and supported number format options.
- Normalizes currency codes to uppercase.
- Returns the persisted effective settings.

### Consumer API

`GET /settings/currency`

- Read-only endpoint for CMS/consumer formatting consumers that do not use the admin API.
- Resolves the tenant from subdomain/middleware context.
- Returns only public formatting configuration; never credentials or unrelated master tenant fields.

The exact application ownership of the consumer endpoint should follow the existing consumer API routing conventions, while keeping the response contract identical to the admin GET response.

## Configuration Contract

```ts
interface CurrencySettings {
  currency_code: string;
  locale: string;
  number_format_options: Intl.NumberFormatOptions;
}
```

The backend must validate `number_format_options` against an explicit allowlist and expected primitive types. Supported options include:

- `style`
- `currencyDisplay`
- `currencySign`
- `useGrouping`
- `minimumFractionDigits`
- `maximumFractionDigits`
- `minimumIntegerDigits`
- `notation`
- `compactDisplay`

The implementation must reject incompatible combinations or invalid values rather than persisting settings that can fail at runtime.

## CMS UX

Add a `/settings/currency` route and replace the current Settings sidebar placeholder with a `NavLink`.

Use the existing CMS visual language and `MainLayout` shell. The page uses the selected two-column live-preview layout:

- Left panel: currency code, locale, advanced `Intl.NumberFormat` options, reset overrides, Save, and Cancel.
- Right panel: live preview for product price, discounted price, subtotal, discount, final price, and large/compact numbers.
- Preview uses draft values immediately and labels the active locale/currency.
- Desktop uses two columns; mobile stacks panels vertically.
- Loading, field-level validation, dirty state, save success, save failure, and unsaved-navigation confirmation are explicit states.

The formatter utility must combine locale/currency defaults with draft or persisted overrides deterministically. Monetary API values remain decimal/string values and are formatted only at the UI boundary.

## Frontend Integration

Create or extend a shared settings API wrapper and formatter utility in the frontend codebase. Both CMS and consumer must use the same response shape and formatting rules. Replace hardcoded currency formatting, including the current product list `USD` formatter, with tenant settings.

If settings cannot be loaded, the UI must use the documented safe defaults and surface the load error. It must not overwrite persisted settings with defaults.

## Security and Tenant Isolation

- Tenant identity comes only from request context/middleware, never from a client-supplied tenant identifier.
- Admin endpoints enforce the existing JWT and ACL guards.
- All reads and writes must be scoped to the active tenant.
- Consumer responses contain only public formatting fields.
- No database credentials or unrelated `ClientEntity` fields may be serialized.

## Error Handling

- Invalid currency code, locale, or override returns a validation error with field-level details.
- Missing settings row returns effective defaults and may be lazily created on update.
- Database/API failure keeps the existing frontend settings state, displays an error, and does not report a false save success.
- Formatter failures should fall back to the effective default formatter without crashing the page.

## Testing

### Backend

- Entity/service tests for defaults, create, update, normalization, and validation.
- Tenant isolation tests proving one tenant cannot read or update another tenant's settings.
- Controller tests for authentication, ACL, response shape, and validation errors.
- Migration or repository integration coverage for existing tenants.

### Frontend

- CMS page tests for loading, editing, live preview, reset overrides, save success, save failure, and unsaved changes.
- Consumer formatter tests for `IDR`/`id-ID`, `USD`/`en-US`, alternate locales, and override combinations.
- Regression coverage ensuring product, voucher, checkout, subtotal, discount, and final price displays use tenant settings rather than hardcoded `USD`.

Before completion, run the modified backend application build, CMS/consumer Vitest suites, and relevant TypeScript checks.

## Acceptance Criteria

- Every tenant can store different currency, locale, and formatting overrides.
- Any valid ISO 4217 currency code can be saved after validation.
- Locale determines the default number format automatically.
- Admins can override supported `Intl.NumberFormat` options.
- CMS shows a working live preview before save.
- CMS and consumer display prices using the active tenant's settings.
- Tenant boundaries, admin authorization, and public response boundaries are enforced.
- Missing settings use safe defaults without data loss.
- Automated tests cover the main success, validation, failure, and isolation paths.
