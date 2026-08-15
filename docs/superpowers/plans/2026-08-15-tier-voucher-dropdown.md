# Eligible Voucher Dropdown for Tier Level-Up Reward — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the free-text "Level-Up Voucher Code" input on the CMS tier form with a strict dropdown of eligible vouchers, preventing typos while never orphaning an already-configured code on edit.

**Architecture:** `TierForm.tsx` self-fetches the voucher list on mount via `getVouchers()` (existing `src/api/vouchers.ts`), filters to eligible vouchers (`deleted_at === null && quota !== 0`), and renders a native `<select>` (same pattern/styling as the reward-source select in `RewardForm.tsx`). The select always offers "No voucher" (clears the field) and, when editing an existing tier whose code is no longer eligible, a `code — (inactive)` option so the saved value stays visible. If `getVouchers()` fails, the select renders disabled with helper text and the form remains submittable.

**Tech Stack:** React 18, TypeScript, Vitest + @testing-library/react (apps/frontend-cms is a standalone Vite app with its own package.json).

## Global Constraints

- Work only inside `apps/frontend-cms` (standalone app — `cd apps/frontend-cms` before every command).
- No backend changes (no DTO/entity/migration/API edits). The API continues to store `level_up_voucher_code: string`.
- No new runtime dependencies — use the native `<select>`.
- Mock `../api/vouchers` in tests via `vi.mock('../api/vouchers', () => ({ getVouchers: vi.fn() }))` and set `(vouchersApi.getVouchers as any).mockResolvedValue([...])` in `beforeEach`, following `RewardForm.spec.tsx`.
- Voucher eligibility: `v.deleted_at === null && v.quota !== 0` (any voucher type / claim period). `quota` `-1` = unlimited, `0` = out of stock.
- Select styling must match the reward-source select in `RewardForm.tsx:172` (same className string + `disabled:opacity-60`).
- Copy: helper text below the select reads "Auto-granted free voucher when a user reaches this tier."; on load failure it reads "Failed to load vouchers".
- Existing repo-wide failure baseline: 3 pre-existing CMS test failures (`Login`, `VoucherBindingList` spec, `VoucherValidityList` spec) must remain unchanged; zero new failures.

---

### Task 1: Fetch eligible vouchers and render strict dropdown

**Files:**

- Modify: `apps/frontend-cms/src/components/TierForm.tsx` (replace the `level_up_voucher_code` `<Input>` at lines 80-86)
- Test: `apps/frontend-cms/src/components/TierForm.spec.tsx` (rewrite)

**Interfaces:**

- Consumes: `getVouchers(): Promise<Voucher[]>` from `../api/vouchers` (`Voucher` = `{ code: string; name: string; quota: number; deleted_at: string | null; ... }`); `TierInput` from `../api/tiers` (has `level_up_voucher_code?: string | null`).
- Produces: `TierForm` now renders a `<select id="level_up_voucher_code">` with options: `""` (No voucher), eligible additions `code — name`, and — when the initial `level_up_voucher_code` is non-empty and not eligible — `code — (inactive)`. Setting an option sets `form.level_up_voucher_code` to the `code` string (or `''`). Form `onSubmit(form)` unchanged.

- [ ] **Step 1: Rewrite `TierForm.spec.tsx` with the dropdown tests and verify they FAIL**

Replace the entire contents of `apps/frontend-cms/src/components/TierForm.spec.tsx` with:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import TierForm from './TierForm';
import * as vouchersApi from '../api/vouchers';

vi.mock('../api/vouchers', () => ({ getVouchers: vi.fn() }));

const eligibleVouchers = [
  { code: 'GOLD2030', name: 'Gold 30%', quota: 100, deleted_at: null },
  { code: 'PLAT100', name: 'Platinum Rp100k', quota: -1, deleted_at: null },
];

describe('TierForm', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (vouchersApi.getVouchers as any).mockResolvedValue(eligibleVouchers);
    onSubmit.mockResolvedValue(undefined);
  });

  it('submits the selected eligible voucher code', async () => {
    render(<TierForm initial={{ name: 'Gold' }} onSubmit={onSubmit} />);

    const select = await screen.findByLabelText(/Level-Up Voucher Code/i);
    expect(select).toHaveValue('');

    // Wait for the voucher options to render before changing the select; a
    // controlled <select> snaps back to an existing option otherwise.
    await screen.findByRole('option', { name: /GOLD2030.*Gold 30%/i });

    fireEvent.change(select, { target: { value: 'GOLD2030' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ level_up_voucher_code: 'GOLD2030' }),
      ),
    );
  });

  it('excludes deleted and exhausted vouchers from the options', async () => {
    (vouchersApi.getVouchers as any).mockResolvedValue([
      ...eligibleVouchers,
      { code: 'DELETED', name: 'Gone', quota: 5, deleted_at: '2026-01-01' },
      { code: 'SOLD', name: 'Sold out', quota: 0, deleted_at: null },
    ]);
    render(
      <TierForm
        initial={{ name: 'Gold', level_up_voucher_code: 'GOLD2030' }}
        onSubmit={onSubmit}
      />,
    );

    // Await the mocked getVouchers resolution via findByRole (positive finds
    // first) so the option assertions below are not racy.
    expect(
      await screen.findByRole('option', { name: /GOLD2030.*Gold 30%/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /PLAT100.*Platinum/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /DELETED/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /SOLD/i }),
    ).not.toBeInTheDocument();
  });

  it('keeps a current non-eligible code visible as inactive on edit', async () => {
    (vouchersApi.getVouchers as any).mockResolvedValue(eligibleVouchers);
    render(
      <TierForm
        initial={{ name: 'Gold', level_up_voucher_code: 'GONE2020' }}
        onSubmit={onSubmit}
      />,
    );

    const select = screen.getByLabelText(/Level-Up Voucher Code/i);
    // Await the mocked getVouchers resolution so the inactive option exists
    // (toHaveValue on a select requires a matching <option>).
    expect(
      await screen.findByRole('option', { name: /GONE2020.*inactive/i }),
    ).toBeInTheDocument();
    expect(select).toHaveValue('GONE2020');
  });

  it('clears the reward when No Voucher is selected', async () => {
    render(
      <TierForm
        initial={{ name: 'Gold', level_up_voucher_code: 'GOLD2030' }}
        onSubmit={onSubmit}
      />,
    );

    const select = await screen.findByLabelText(/Level-Up Voucher Code/i);
    fireEvent.change(select, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ level_up_voucher_code: '' }),
      ),
    );
  });
});
```

Run:

```bash
cd apps/frontend-cms && npx vitest run src/components/TierForm.spec.tsx
```

Expected: FAIL — the original spec (compiled with the new test file) references a removed placeholder and `getVouchers` does not exist in `../api/vouchers`' mock yet. Verify the failures are in `TierForm.spec.tsx` (mocking/rendering) before implementing.

- [ ] **Step 2: Implement the dropdown in `TierForm.tsx`**

Replace the import line at `TierForm.tsx:1`:

```tsx
import { useState } from 'react';
```

with:

```tsx
import { useEffect, useState } from 'react';
import { getVouchers, Voucher } from '../api/vouchers';
```

After the `const [form, setForm] = useState<TierInput>({...});` block (after line 24), insert:

```tsx
const [vouchers, setVouchers] = useState<Voucher[]>([]);

useEffect(() => {
  let active = true;
  getVouchers()
    .then((value) => active && setVouchers(value))
    .catch(() => {
      // handled in Task 2
    });
  return () => {
    active = false;
  };
}, []);
```

Replace the `level_up_voucher_code` `<Input>` block (currently `TierForm.tsx:80-86`):

```tsx
<Input
  label="Level-Up Voucher Code"
  value={form.level_up_voucher_code ?? ''}
  onChange={(e) => set('level_up_voucher_code', e.target.value)}
  placeholder="e.g. GOLD2030"
  helperText="Auto-granted free voucher when a user reaches this tier."
/>
```

with:

```tsx
<div className="space-y-1.5">
  <label
    htmlFor="level_up_voucher_code"
    className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1"
  >
    Level-Up Voucher Code
  </label>
  <select
    id="level_up_voucher_code"
    value={form.level_up_voucher_code ?? ''}
    onChange={(e) => set('level_up_voucher_code', e.target.value)}
    className="w-full h-12 rounded-xl bg-slate-900/50 border border-slate-700/50 focus:border-primary-500/50 transition-all duration-300 px-4 text-sm text-slate-100 appearance-none focus:outline-none focus:ring-1 focus:ring-primary-500/50"
  >
    <option value="">No voucher</option>
    {vouchers
      .filter((v) => v.deleted_at === null && v.quota !== 0)
      .map((v) => (
        <option key={v.code} value={v.code}>
          {v.code} — {v.name}
        </option>
      ))}
    {form.level_up_voucher_code &&
      !vouchers.some(
        (v) =>
          v.code === form.level_up_voucher_code &&
          v.deleted_at === null &&
          v.quota !== 0,
      ) && (
        <option value={form.level_up_voucher_code}>
          {form.level_up_voucher_code} — (inactive)
        </option>
      )}
  </select>
  <p className="text-xs text-slate-500 ml-1 mt-1">
    Auto-granted free voucher when a user reaches this tier.
  </p>
</div>
```

(Leave the `import { Input } from './ui/Input';` line — `Input` is still used by the other fields.)

- [ ] **Step 3: Run the tests and verify they PASS**

```bash
cd apps/frontend-cms && npx vitest run src/components/TierForm.spec.tsx
```

Expected: 4 passing tests in `TierForm.spec.tsx`. If the "keeps a current non-eligible code" test fails, verify the `(inactive)` option is actually rendered with value `GONE2020`.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend-cms/src/components/TierForm.tsx apps/frontend-cms/src/components/TierForm.spec.tsx
git commit -m "feat(cms): eligible voucher dropdown for tier level-up reward"
```

---

### Task 2: Handle voucher-load failure gracefully

**Files:**

- Modify: `apps/frontend-cms/src/components/TierForm.tsx` (add `vouchersError` state, `disabled` on select, error helper text)
- Test: `apps/frontend-cms/src/components/TierForm.spec.tsx` (add one test)

**Interfaces:**

- Consumes: Task 1's `TierForm` with `vouchers` state and the dropdown select.
- Produces: when `getVouchers()` rejects, the select renders `disabled` and the helper text reads "Failed to load vouchers"; the form still submits (with the preserved `level_up_voucher_code` from `initial`, if any).

- [ ] **Step 1: Add the failing test**

Append this test inside the `describe('TierForm')` block in `apps/frontend-cms/src/components/TierForm.spec.tsx` (after the last `it(...)` of Task 1):

```tsx
it('disables the dropdown and shows a failure note when vouchers fail to load', async () => {
  (vouchersApi.getVouchers as any).mockRejectedValueOnce(
    new Error('network failure'),
  );
  render(
    <TierForm
      initial={{ name: 'Gold', level_up_voucher_code: 'GOLD2030' }}
      onSubmit={onSubmit}
    />,
  );

  const select = screen.getByLabelText(/Level-Up Voucher Code/i);
  // Wait for the rejection to settle (error text appears) before asserting
  // the disabled state.
  expect(
    await screen.findByText(/Failed to load vouchers/i),
  ).toBeInTheDocument();
  expect(select).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: /save/i }));
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ level_up_voucher_code: 'GOLD2030' }),
    ),
  );
});
```

Run:

```bash
cd apps/frontend-cms && npx vitest run src/components/TierForm.spec.tsx
```

Expected: FAIL — select is not disabled and "Failed to load vouchers" is absent.

- [ ] **Step 2: Implement load-failure handling**

In `TierForm.tsx`, change the Task 1 `useEffect` to:

```tsx
const [vouchers, setVouchers] = useState<Voucher[]>([]);
const [vouchersError, setVouchersError] = useState(false);

useEffect(() => {
  let active = true;
  getVouchers()
    .then((value) => active && setVouchers(value))
    .catch(() => active && setVouchersError(true));
  return () => {
    active = false;
  };
}, []);
```

Add `disabled={vouchersError}` to the `<select>` and change the helper `<p>` to:

```tsx
<p className="text-xs ml-1 mt-1 text-slate-500">
  {vouchersError
    ? 'Failed to load vouchers'
    : 'Auto-granted free voucher when a user reaches this tier.'}
</p>
```

Also add `disabled:opacity-60` to the select className string (appended at the end, before the closing quote) so a disabled state is visually distinguishable.

- [ ] **Step 3: Run the tests and verify they PASS**

```bash
cd apps/frontend-cms && npx vitest run src/components/TierForm.spec.tsx
```

Expected: 5 passing tests.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend-cms/src/components/TierForm.tsx apps/frontend-cms/src/components/TierForm.spec.tsx
git commit -m "feat(cms): graceful failure state for voucher load on tier form"
```

---

## Verification (final gate, after all tasks)

```bash
cd apps/frontend-cms && npx vitest run src/components/TierForm.spec.tsx
cd apps/frontend-cms && npx tsc --noEmit
cd apps/frontend-cms && npx vitest run
```

Expected:

- `TierForm.spec.tsx`: 5 tests pass.
- `tsc --noEmit`: no errors.
- Full CMS suite: only the 3 known pre-existing failures (`Login` spec, `VoucherBindingList` spec, `VoucherValidityList` spec) — zero new failures.
