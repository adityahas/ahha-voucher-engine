# Eligible Voucher Dropdown for Tier Level-Up Reward — Design

> **Status:** Approved (2026-08-15, AI-recommended decisions; user delegated all confirmations while asleep).

## Goal

Replace the free-text "Level-Up Voucher Code" field on the CMS tier form (`TierForm.tsx`) with a **strict dropdown** of eligible vouchers, so admins pick a reward voucher without risking typos, while never orphaning an already-configured code on edit.

## Context

- The tier level-up reward (built 2026-08-15) stores `level_up_voucher_code: string | null` on `loyalty_tiers`. The consumer/`grantLevelUpVoucher` looks the code up as-is (case-sensitive).
- Currently the field is a plain `<Input>` text box (`TierForm.tsx:80-86`). The original plan deliberately left autocomplete/datalist out of scope ("implementer may add it later"). This spec is that follow-up.
- The CMS already exposes `getVouchers()` in `src/api/vouchers.ts` → `GET /loyalty-admin/vouchers`, returning `Voucher[]` with `code`, `name`, `quota`, `deleted_at`, `voucher_type`, `claim_period`.
- `TierForm` is used by both `TierCreate.tsx` and `TierEdit.tsx` (shared, no other consumers).

## Decisions

1. **Eligibility:** vouchers with `deleted_at === null` AND `quota !== 0`, **any** `voucher_type` or `claim_period`. (The grant inserts a `voucher_claims` row for any voucher, so filtering by type would silently hide grantable vouchers.)
2. **UX: strict dropdown** replacing the text input. `onChange` sets `form.level_up_voucher_code` to the selected voucher's `code`, or `''` for "No voucher".
3. **Dropdown always includes "No voucher"** (empty value) so a configured reward can be removed.
4. **Current value always preserved:** if the tier's existing `level_up_voucher_code` doesn't match any eligible option (voucher deleted / quota exhausted), render an extra option for it (value = saved code, label `code — (inactive)`), so Edit never silently drops an existing config. Note: this option is not re-submittable as a _new_ selection if it would fail validation — it is only retained when preselected as the initial value.
5. **Load failure:** if `getVouchers()` rejects, render the dropdown disabled with helperText "Failed to load vouchers"; the form stays submittable with whatever `level_up_voucher_code` was initialized (e.g. the tier's current value).

## Architecture / Data Flow

```
TierForm (mount) ──getVouchers()──▶ vouchers state
   │
   ├─ eligible = vouchers.filter(v => v.deleted_at === null && v.quota !== 0)
   ├─ options   = [ {code:''} ] + eligible.map(code — name)
   │              + (currentCode not in eligible ? [{code: currentCode, label: 'code — (inactive)'}] : [])
   ├─ <select value={form.level_up_voucher_code ?? ''} disabled={loadFailed}>
   │        onChange → set('level_up_voucher_code', e.target.value)
   └─ form submit sends level_up_voucher_code (code or '')
```

No backend change: DTO/entity/migration untouched.

## Components

- `apps/frontend-cms/src/components/TierForm.tsx` — add `vouchers` + `vouchersError` state; `useEffect` calling `getVouchers()`; replace the `<Input>` at lines 80-86 with the `<select>` described above. No new component files (YAGNI — single consumer).
- `apps/frontend-cms/src/components/TierForm.spec.tsx` — mock `../api/vouchers` (`vi.mock`), update the existing test, add new tests.

## Testing

Cases in `TierForm.spec.tsx` (mock `getVouchers`):

1. **Existing test updated:** submitting after selecting an eligible voucher from the dropdown → `onSubmit` receives `level_up_voucher_code: 'GOLD2030'`.
2. **Eligible filter:** a deleted voucher (`deleted_at` set) and a quota-0 voucher do NOT appear as options; an eligible one does.
3. **"No voucher" clears:** select "No voucher" → submit → `level_up_voucher_code === ''`.
4. **Current value preserved on edit:** `initial={{ name: 'Gold', level_up_voucher_code: 'GONE' }}` with `getVouchers` returning only non-matching vouchers → the `GONE (inactive)` option is present and preselected; form still submittable.
5. **Load failure:** `getVouchers` rejects → select is disabled and shows "Failed to load vouchers".

Note: the `ui/Input` component does not associate label with input (existing repo-wide gap), so queries should use selector-stable means (option text / select by role) rather than `getByLabelText` — the existing spec already uses `getByPlaceholderText`; with a `<select>` there is no placeholder, so use `getByRole('combobox')` / option text.

## Error Handling

- `getVouchers` rejection → `select` disabled + helperText "Failed to load vouchers" (decision 5). Non-blocking — form remains usable.
- Empty eligible list (no vouchers at all) → dropdown shows only "No voucher" (+ the preserved current value if present). Not an error state.

## Out of Scope

- No backend/API/entity/DTO/migration changes.
- No datalist/autocomplete, no searchable combobox (strict `<select>` per decision 2).
- No TierList column changes, no UserDetail changes, no changes to other forms.
- No new runtime dependencies (native `<select>`).

## Verification

- `cd apps/frontend-cms && npx vitest run src/components/TierForm.spec.tsx`
- `cd apps/frontend-cms && npx tsc --noEmit`
- Full CMS suite: only the 3 known pre-existing failures (Login, VoucherBindingList, VoucherValidityList); zero new failures.
