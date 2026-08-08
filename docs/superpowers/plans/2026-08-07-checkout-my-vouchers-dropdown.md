# Checkout My Vouchers Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user clicks the voucher input on the Consumer checkout page, show a dropdown of the user's claimed vouchers ("My Vouchers"); selecting one fills the code and auto-applies the discount.

**Architecture:** Pure frontend change in `CheckoutView.tsx`. It reuses the existing `getClaimedVouchers()` API and existing `ClaimedVoucherInfo`/`Voucher` types. Adding local state + lazy-fetch on open + outside-click/ESC close, and reusing the existing `handleApplyVoucher` discount logic on item selection.

**Tech Stack:** React 18, Vite, TypeScript, Framer Motion (already used), Vitest + React Testing Library.

## Global Constraints

- Only modify `apps/frontend-consumer/src/pages/CheckoutView.tsx` and its spec `CheckoutView.spec.tsx`.
- No changes to backend API or to `types/voucher.ts` / `types/product.ts`.
- Reuse existing `getClaimedVouchers` and `calculateDiscount` from `../api/vouchers`.
- Select behavior is **auto-apply** (option B): no extra APPLY click required.
- Item shows **code + name + discount info** (option B).
- Data loaded **lazily on first click** (option B), with a loading indicator.
- Dropdown closes on: item select, outside click, ESC, or successful apply (option A).

---

### Task 1: Add lazy-load "My Vouchers" dropdown to Checkout

**Files:**

- Modify: `apps/frontend-consumer/src/pages/CheckoutView.tsx`
- Test: `apps/frontend-consumer/src/pages/CheckoutView.spec.tsx`

**Interfaces:**

- Consumes: `getClaimedVouchers(page, size): Promise<PaginatedResponse<ClaimedVoucherInfo>>`, `calculateDiscount(req): Promise<CalculateDiscountResponse>`, types `ClaimedVoucherInfo`/`Voucher`.
- Produces: internal state `voucherDropdownOpen`, `myVouchers`, `voucherLoading`, `voucherFetchError`; handlers `handleToggleVoucherDropdown`, `handleSelectVoucher`.

- [ ] **Step 1: Update the API mock in the spec to include `getClaimedVouchers`**

In `apps/frontend-consumer/src/pages/CheckoutView.spec.tsx`, update the `vi.mock('../api/vouchers', ...)` block and add a helper voucher fixture:

```ts
vi.mock('../api/vouchers', () => ({
  calculateDiscount: vi.fn(),
  getClaimedVouchers: vi.fn(),
}));
```

Add a fixture constant near `mockProduct`:

```ts
const mockClaimedVoucher = {
  id: 1,
  created_at: '2026-08-07T00:00:00.000Z',
  voucher: {
    voucher_type: 'CLAIMABLE',
    code: 'CHRISTMAS2030',
    name: 'Christmast discount voucher 222',
    description: 'desc',
    quota: 96,
    image: '',
    discount_type: 'FIXED_AMOUNT',
    discount_value: 10000,
    categories: [],
    bindings: [],
  },
};
```

- [ ] **Step 2: Run tests to confirm baseline passes**

Run: `cd apps/frontend-consumer && npx vitest run src/pages/CheckoutView.spec.tsx`
Expected: existing 6 tests PASS (mock change is additive; no behavior change yet).

- [ ] **Step 3: Add a discount formatter helper (inline in CheckoutView)**

Add a small helper (near `formatCurrency` usage) to render discount info from a `Voucher`. Place it above the component:

```ts
function formatVoucherDiscount(voucher: Voucher): string {
  const val = Number(voucher.discount_value);
  if (voucher.discount_type === 'PERCENTAGE') {
    return `-${val}%`;
  }
  return `-Rp ${val.toLocaleString('id-ID')}`;
}
```

> **Note for implementer:** This helper intentionally avoids the `formatCurrency` dependency (which requires `useCurrencySettings`), keeping it simple and testable. Verify `Voucher` is already imported in CheckoutView; add `type { Voucher }` to the type import if not present. The `Voucher` type declares `discount_value: number`; the fixture uses a number.

- [ ] **Step 4: Add state, refs, and handler logic**

In `CheckoutView` add new state and a `voucherWrapRef`:

```ts
const [voucherDropdownOpen, setVoucherDropdownOpen] = useState(false);
const [myVouchers, setMyVouchers] = useState<ClaimedVoucherInfo[] | null>(null);
const [voucherLoading, setVoucherLoading] = useState(false);
const [voucherFetchError, setVoucherFetchError] = useState<string | null>(null);
const voucherWrapRef = useRef<HTMLDivElement | null>(null);
```

Update the import line for `react` to include `useRef`:

```ts
import React, { useEffect, useRef, useState } from 'react';
```

Add `ClaimedVoucherInfo` and `Voucher` type imports:

```ts
import type { ClaimedVoucherInfo, Voucher } from '../types/voucher';
```

Add the fetch helper:

```ts
const fetchMyVouchers = async () => {
  if (myVouchers !== null) return;
  setVoucherLoading(true);
  setVoucherFetchError(null);
  try {
    const res = await getClaimedVouchers(0, 50);
    setMyVouchers(res.data);
  } catch (err: any) {
    setVoucherFetchError(err.message || 'Failed to load my vouchers');
  } finally {
    setVoucherLoading(false);
  }
};
```

Add the toggle handler:

```ts
const handleToggleVoucherDropdown = () => {
  if (!voucherDropdownOpen) {
    fetchMyVouchers();
  }
  setVoucherDropdownOpen((prev) => !prev);
};
```

Add the select handler that reuses the apply logic. Refactor `handleApplyVoucher` so the apply-on-code logic is reusable:

```ts
const applyVoucherCode = async (code: string) => {
  if (!product) return;
  try {
    setCalculating(true);
    setVoucherError(null);
    setCalculation(null);
    const result = await calculateDiscount({
      voucher_code: code,
      product_id: product.id,
      quantity,
    });
    if (!result.isValid) {
      setVoucherError(result.message);
      setCalculation(null);
    } else {
      setCalculation(result);
    }
  } catch (err: any) {
    setVoucherError(err.message || 'Failed to validate voucher');
    setCalculation(null);
  } finally {
    setCalculating(false);
  }
};

const handleSelectVoucher = (claimed: ClaimedVoucherInfo) => {
  const code = claimed.voucher.code.toUpperCase();
  setVoucherCode(code);
  setVoucherDropdownOpen(false);
  applyVoucherCode(code);
};
```

Update `handleApplyVoucher` to delegate:

```ts
const handleApplyVoucher = async () => {
  if (!product || !voucherCode) return;
  await applyVoucherCode(voucherCode);
};
```

Add outside-click + ESC effect:

```ts
useEffect(() => {
  if (!voucherDropdownOpen) return;
  const onPointerDown = (e: MouseEvent) => {
    if (
      voucherWrapRef.current &&
      !voucherWrapRef.current.contains(e.target as Node)
    ) {
      setVoucherDropdownOpen(false);
    }
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setVoucherDropdownOpen(false);
  };
  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('keydown', onKeyDown);
  return () => {
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('keydown', onKeyDown);
  };
}, [voucherDropdownOpen]);
```

- [ ] **Step 5: Wire the dropdown UI into the voucher field**

Inside the voucher field block (the `div.relative group`), wrap it with `voucherWrapRef` and add click-to-open on the input. Locate the input and add `onFocus={handleToggleVoucherDropdown}` and `onClick={handleToggleVoucherDropdown}`. Then, inside the same wrapper, render the dropdown after the APPLY button:

```tsx
<div
  ref={voucherWrapRef}
  className="relative group"
  onFocus={() => setVoucherOpen(true)}
>
  {/* existing Tag icon */}
  {/* existing input (add onFocus/onClick toggle) */}
  <AnimatePresence>
    {voucherDropdownOpen && (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15 }}
        className="absolute z-30 mt-2 w-full rounded-2xl border border-white/10 bg-[#0d1220]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        {voucherLoading && (
          <div className="px-4 py-3 text-xs text-slate-400">
            Loading my vouchers...
          </div>
        )}
        {voucherFetchError && (
          <div className="px-4 py-3 text-xs text-rose-400">
            {voucherFetchError}
          </div>
        )}
        {!voucherLoading &&
          !voucherFetchError &&
          myVouchers &&
          myVouchers.length === 0 && (
            <div className="px-4 py-3 text-xs text-slate-400">
              No claimed vouchers yet.
            </div>
          )}
        {!voucherLoading &&
          !voucherFetchError &&
          myVouchers?.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectVoucher(c)}
              className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center justify-between gap-2 group/item"
            >
              <span className="font-bold text-white">{c.voucher.code}</span>
              <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                {c.voucher.name}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                {formatVoucherDiscount(c.voucher)}
              </span>
            </button>
          ))}
      </motion.div>
    )}
  </AnimatePresence>
</div>
```

Note: Use `onClick` on the input to toggle; avoid `onFocus` if it conflicts with the APPLY button focus behavior. Keep the existing structure and `data-testid`s intact so existing tests still pass.

- [ ] **Step 6: Add the new test cases to the spec**

Append these tests (with the existing `renderComponent`):

```ts
it('opens my-vouchers dropdown on field click and lists codes', async () => {
  (productsApi.getProductById as any).mockResolvedValue(mockProduct);
  (vouchersApi.getClaimedVouchers as any).mockResolvedValue({
    code: 'SUCCESS',
    message: 'ok',
    data: [mockClaimedVoucher],
    pagination: { page: 0, size: 50, total: 1 },
  });
  renderComponent();
  await waitFor(() =>
    expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByPlaceholderText(/Enter code/i));
  await waitFor(() => {
    expect(vouchersApi.getClaimedVouchers).toHaveBeenCalled();
    expect(screen.getByText('CHRISTMAS2030')).toBeInTheDocument();
  });
});

it('applies the selected voucher automatically on item click', async () => {
  (productsApi.getProductById as any).mockResolvedValue(mockProduct);
  (vouchersApi.getClaimedVouchers as any).mockResolvedValue({
    code: 'SUCCESS',
    message: 'ok',
    data: [mockClaimedVoucher],
    pagination: { page: 0, size: 50, total: 1 },
  });
  (vouchersApi.calculateDiscount as any).mockResolvedValue({
    isValid: true,
    discountAmount: 10000,
    finalPrice: 0,
    message: 'Voucher applied successfully!',
  });
  renderComponent();
  await waitFor(() =>
    expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByPlaceholderText(/Enter code/i));
  await waitFor(() =>
    expect(screen.getByText('CHRISTMAS2030')).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByText('CHRISTMAS2030'));
  await waitFor(() => {
    expect(vouchersApi.calculateDiscount).toHaveBeenCalledWith({
      voucher_code: 'CHRISTMAS2030',
      product_id: 'prod-123',
      quantity: 1,
    });
    expect(
      screen.getByText(/Voucher Applied Successfully!/i),
    ).toBeInTheDocument();
  });
});

it('closes the dropdown on outside click', async () => {
  (productsApi.getProductById as any).mockResolvedValue(mockProduct);
  (vouchersApi.getClaimedVouchers as any).mockResolvedValue({
    code: 'SUCCESS',
    message: 'ok',
    data: [mockClaimedVoucher],
    pagination: { page: 0, size: 50, total: 1 },
  });
  renderComponent();
  await waitFor(() =>
    expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByPlaceholderText(/Enter code/i));
  await waitFor(() =>
    expect(screen.getByText('CHRISTMAS2030')).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByText('Order Summary'));
  await waitFor(() => {
    expect(screen.queryByText('CHRISTMAS2030')).not.toBeInTheDocument();
  });
});

it('shows error message when fetch fails', async () => {
  (productsApi.getProductById as any).mockResolvedValue(mockProduct);
  (vouchersApi.getClaimedVouchers as any).mockRejectedValue(
    new Error('Network error'),
  );
  renderComponent();
  await waitFor(() =>
    expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByPlaceholderText(/Enter code/i));
  await waitFor(() => {
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
  });
});
```

Ensure the `// Mock API modules` block for `../api/vouchers` includes `getClaimedVouchers` (Step 1 did this).

- [ ] **Step 7: Run the full spec and type-check**

Run: `cd apps/frontend-consumer && npx vitest run src/pages/CheckoutView.spec.tsx`
Expected: All tests (6 existing + 4 new = 10) PASS.

Run: `cd apps/frontend-consumer && npx tsc --noEmit`
Expected: no type errors.

Fix any failing test or type error before committing.

- [ ] **Step 8: Commit**

```bash
git add apps/frontend-consumer/src/pages/CheckoutView.tsx apps/frontend-consumer/src/pages/CheckoutView.spec.tsx
git commit -m "feat(consumer): add My Vouchers dropdown to checkout voucher field"
```
