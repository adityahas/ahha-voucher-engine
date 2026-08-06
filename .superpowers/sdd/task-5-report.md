# Task 5 Review Fixes

## Changes

- Added the stored consumer JWT to the tenant currency settings request while retaining runtime API URL, API key, and tenant configuration. No `client1` fallback is used.
- Made percentage discount detection trim and compare case-insensitively.
- Added fixed-discount coverage for claimed voucher and voucher detail displays, alongside the existing voucher card and formatter coverage.
- Removed the generated `apps/frontend-consumer/tsconfig.app.tsbuildinfo` artifact after verification.

## Verification

- `cd apps/frontend-consumer && npx vitest run`: 11 test files, 38 tests passed.
- `cd apps/frontend-consumer && npx tsc --noEmit`: passed.
- `cd apps/frontend-consumer && npm run build`: passed; Vite production bundle generated successfully.

## Concerns

- Vitest emits existing React prop warnings from mocked Framer Motion components (`layout`, `whileHover`, and `whileTap`); these are unrelated to Task 5.
- Existing untracked `dump.rdb` and other `.superpowers/` files were not staged.
