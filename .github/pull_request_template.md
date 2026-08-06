## Summary

<!-- Brief description of the change. What problem does it solve? -->

## Type

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Chore (CI, docs, deps)
- [ ] Hotfix

## Evidence

### Automated Checks

<!-- CI will populate these. Verify all pass before marking ready for review. -->

- [ ] Lint passes (`yarn lint`)
- [ ] Type check passes (`yarn type-check`)
- [ ] Backend unit tests pass (`yarn test`)
- [ ] Frontend tests pass (`npx vitest run` per app)
- [ ] Build succeeds (`yarn build`)

### Test Results

<!-- Attach screenshots or link to CI artifacts. -->

| Test Suite                 | Status | Coverage |
| -------------------------- | ------ | -------- |
| Backend (Jest)             |        |          |
| Frontend CMS (Vitest)      |        |          |
| Frontend Consumer (Vitest) |        |          |
| E2E (Playwright)           |        |          |

### Screenshots / API Responses

<!-- For UI changes: before/after screenshots. For API changes: curl + response. -->

<details>
<summary>Evidence</summary>

```
<!-- paste terminal output, API responses, or link to CI artifacts here -->
```

</details>

## Architecture Review

<!-- CTO review focus areas -->

- [ ] Database-per-tenant isolation maintained
- [ ] Middleware ordering preserved (SubdomainMiddleware → CredentialMiddleware)
- [ ] Path aliases used correctly (`@core/auth`, `@core/database`, etc.)
- [ ] Monetary values use `decimal(12,2)` — never `float`
- [ ] Transactional voucher usage when tied to purchase/order creation
- [ ] JWT + ACL guards on admin endpoints
- [ ] No debug artifacts (`console.log`, commented-out code)
