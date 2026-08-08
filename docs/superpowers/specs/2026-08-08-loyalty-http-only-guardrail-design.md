# Loyalty HTTP-Only Guardrail Design

**Date:** 2026-08-08
**Status:** Approved
**Scope:** Root ESLint configuration only; no runtime, no product, or loyalty code changes.

## Problem

The loyalty engine is a multi-tenant SaaS backend. Consumer apps (`product-consumer`,
`product-admin`, `admin`, `user-consumer`, `user-admin`, `redistro`) integrate with
loyalty **exclusively via HTTP API** (`purchase-consumer.service.ts` proxies to
`/loyalty/purchase`). Nothing in the code today draws a separate service into the
loyalty domain — but nothing prevents it either. A future contributor could import
`@core/loyalty` in a non-loyalty app, silently coupling a service boundary that must
stay behind an HTTP contract.

Because every cross-service call must remain an API call, we need a guardrail that
fails the build/lint whenever a non-loyalty app imports `@core/loyalty` in-process.

## Non-Goals

- No runtime changes to any app.
- No removal of the existing reverse coupling (`loyalty-consumer` importing
  `@core/product`) — that is a separate future decision.
- No frontend (`apps/frontend-*`) changes; those already have their own ESLint
  configs and are globally ignored by the root config.
- Does not police dynamic `require()` / stringized import paths — nothing uses them
  today.

## Enforcement

### Rule

Add a scoped flat-config block to the root `eslint.config.js`:

```js
{
  files: [
    'apps/admin/**/*.ts',
    'apps/product-admin/**/*.ts',
    'apps/product-consumer/**/*.ts',
    'apps/redistro/**/*.ts',
    'apps/user-admin/**/*.ts',
    'apps/user-consumer/**/*.ts',
  ],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@core/loyalty', '@core/loyalty/*'],
            message:
              'Loyalty must be called through its HTTP API only. Do not import @core/loyalty directly.',
          },
        ],
      },
    ],
  },
}
```

- Uses ESLint core rule `no-restricted-imports` (`error` severity).
- `patterns.group` matches both the exact alias and subpaths
  (`@core/loyalty/voucher/...`).
- Blocked apps are listed explicitly. `loyalty-admin`/`loyalty-consumer` are
  intentionally excluded so they keep sole access to the loyalty domain.

### Why flat-config + explicit file list

Flat config does not support reliable negative globs (`!`) across app dirs, so we
enumerate the six blocked apps. This keeps the allowlist contract explicit and
readable: "any backend app other than loyalty-admin/loyalty-consumer".

## Verification

1. `yarn lint` passes on the current tree — no existing import violates the rule.
2. Negative control (manual, not committed): temporarily add
   `apps/product-consumer/src/_probe.ts` containing
   `export { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';`,
   run `yarn lint`, confirm it fails with the custom message, then delete the probe.

Covered by existing tooling: `yarn lint` (GitHub CI `lint` job),
`lint-staged` (pre-commit hooks).
