# Loyalty HTTP-Only Guardrail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an ESLint `no-restricted-imports` guardrail that blocks any non-loyalty backend app from importing `@core/loyalty`, forcing loyalty access through its HTTP API.

**Architecture:** A scoped flat-config block appended to the existing root `eslint.config.js` enumerates the six non-loyalty backend apps and errors whenever any of their files imports `@core/loyalty` or a subpath. No runtime, product, or loyalty code changes.

**Tech Stack:** ESLint 9 (flat config), `no-restricted-imports` (ESLint core rule), Yarn scripts.

## Global Constraints

- Blocked apps (files globs): `apps/admin`, `apps/product-admin`, `apps/product-consumer`, `apps/redistro`, `apps/user-admin`, `apps/user-consumer` — all under `**/*.ts`.
- `loyalty-admin`/`loyalty-consumer` must remain able to import `@core/loyalty`.
- The custom violation message must be: `Loyalty must be called through its HTTP API only. Do not import @core/loyalty directly.`
- Do not modify `eslint.config.js` sections outside the new block; do not touch `linterOptions`, `globalIgnores`, or other rules.
- `yarn lint` must pass on the unmodified tree and fail on a probe file importing `@core/loyalty`.

---

### Task 1: Add the `no-restricted-imports` guardrail

**Files:**

- Modify: `eslint.config.js` (append a new config object to the array, after the `globalIgnores` call, before the closing `]);`)

**Interfaces:**

- Consumes: existing `defineConfig`/flat-config array in `eslint.config.js`.
- Produces: a flat config object that errors on restricted imports in the six non-loyalty app directories.

- [ ] **Step 1: Read the current config to confirm structure**

Run: `npx eslint --version` then open `eslint.config.js`.
Expected: ESLint 9.x; file ends with `globalIgnores([...]);` (no trailing object).

- [ ] **Step 2: Append the guardrail config block**

Add the following object as the last element of the `defineConfig([...])` array, immediately before the final `]` and after the `globalIgnores(...)` call:

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
  },
```

Note: since `globalIgnores` is a spread element and config blocks are array elements, the closing structure is `module.exports = defineConfig([..., globalIgnores([...]), { ...guardrail... }]);`. Ensure the object added above sits inside the array.

- [ ] **Step 3: Verify lint passes on the clean tree**

```bash
yarn lint
```

Expected: exits 0, no violations reported.

- [ ] **Step 4: Negative control — confirm the rule fires**

Create a probe file:

`apps/product-consumer/src/_guardrail_probe.ts`

```ts
export { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';
```

Then run, expecting the restricted-import error with the custom message:

```bash
yarn lint 2>&1 | rg 'guardrail_probe|Loyalty must be called'
```

Expected: non-zero exit; output contains both `_guardrail_probe.ts` and the message.

- [ ] **Step 5: Remove the probe and re-verify**

Delete `apps/product-consumer/src/_guardrail_probe.ts`, then:

```bash
yarn lint
```

Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add eslint.config.js
git commit -m "lint: block direct @core/loyalty imports outside loyalty apps"
```

---

### Task 2: Confirm coverage via the spec self-review

**Files:**

- None modified.

**Interfaces:**

- Consumes: the completed Task 1.
- Produces: confirmation the spec is fully implemented.

- [ ] **Step 1: Verify allowed apps still import freely**

Run a lint pass over the two loyalty apps specifically:

```bash
npx eslint "apps/loyalty-consumer/**/*.ts" "apps/loyalty-admin/**/*.ts"
```

Expected: exits 0 (no `no-restricted-imports` errors because the guard block's `files` excludes these dirs).

- [ ] **Step 2: Commit any formatting drift (none expected)**

```bash
git status --porcelain
```

Expected: clean working tree. Do NOT commit anything here unless showing a diff.

---

## Self-Review Notes

- **Spec coverage:** Enforcement rule (Task 1), verification/negative control (Task 1 Step 4), explicit blocked-apps list and pricing of allowed apps (Task 1 rule `files`), non-goals unchanged (nothing touched outside `eslint.config.js`).
- **Placeholder scan:** No TBD/TODO; every step has exact code or commands.
- **Type/namespace consistency:** Only ESLint config block churn; no runtime identifiers introduced.
