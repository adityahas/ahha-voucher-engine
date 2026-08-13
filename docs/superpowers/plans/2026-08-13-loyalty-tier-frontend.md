# Loyalty Tier Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the frontend for the Loyalty Tier System — consumer loyalty profile page (tier badge + balance + 5 recent ledger entries), consumer rewards page (grid with claim flow and disabled hints), and CMS sidebar navigation for the existing tier/reward pages.

**Architecture:** Pure frontend; zero backend changes. Re-uses existing consumer wrappers (`api/points.ts`, `api/rewards.ts`), the already-built `LoyaltyBadge` component, and existing page/layout patterns (ConsumerLayout pill nav + mobile bottom nav; CMS MainLayout sidebar). New pages follow the sibling-page structure (ConsumerLayout wrapper, glass-panel/slate/gradient aesthetic for consumer; border-gradient NavLink pattern for CMS).

**Tech Stack:** React 18 + Vite + TypeScript, react-router-dom v6/v7 (App.tsx Routes / MainLayout NavLink), Tailwind CSS, lucide-react icons, Vitest + React Testing Library.

## Global Constraints

- Frontend standalone: run all commands with workdir `apps/frontend-consumer` or `apps/frontend-cms` — never run vitest from the repo root.
- Auth: all data fetches use `useAuthStore` headers via the existing `getHeaders()` patterns in `api/points.ts` / `api/rewards.ts` — never invent a new auth mechanism.
- Routes go inside `ProtectedRoute` in `apps/frontend-consumer/src/App.tsx` (consumer) — no changes to CMS router (routes already exist).
- Aesthetic must match existing pages: consumer uses glass-panel/`bg-white/5`/slate + gradient accents (`from-cyan-400 to-fuchsia-400`); CMS uses the isActive border-gradient NavLink pattern. Mobile bottom nav active colors are per-item (cyan/fuchsia/amber — follow the pattern; the D3 fix standardized amber for Points).
- No backend changes, no new API endpoints, no new dependencies.
- Tests: Vitest + RTL, `*.spec.tsx` next to the page, run from the app dir.
- Baseline suites must stay green: consumer 57 passing, CMS 87 passing / 2 pre-existing failures (Login.spec collection, VoucherBindingList/VoucherValidityList delete asserts).

---

## File Structure

| File                                                                       | Responsibility                                             |
| -------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `apps/frontend-consumer/src/pages/LoyaltyView.tsx` (new)                   | Loyalty profile: LoyaltyBadge + 5 recent ledger entries    |
| `apps/frontend-consumer/src/pages/LoyaltyView.spec.tsx` (new)              | Test LoyaltyView                                           |
| `apps/frontend-consumer/src/pages/RewardsView.tsx` (new)                   | Rewards grid + claim flow + disabled hints                 |
| `apps/frontend-consumer/src/pages/RewardsView.spec.tsx` (new)              | Test RewardsView                                           |
| `apps/frontend-consumer/src/components/layout/ConsumerLayout.tsx` (modify) | Add 2 pill nav links (desktop) + 2 mobile bottom-nav items |
| `apps/frontend-consumer/src/App.tsx` (modify)                              | Add `/loyalty` and `/rewards` routes                       |
| `apps/frontend-cms/src/components/layout/MainLayout.tsx` (modify)          | Add "Loyalty" section label + Tier/Reward NavLinks         |

---

## Task 1: Consumer LoyaltyView page

**Files:**

- Create: `apps/frontend-consumer/src/pages/LoyaltyView.tsx`
- Create: `apps/frontend-consumer/src/pages/LoyaltyView.spec.tsx`

**Interfaces:**

- Consumes: `getPointsProfile()` → `PointsProfile` (`{ tier: {id,name,min_points} | null; lifetime_points; balance_points; next_tier: {id,name,min_points} | null }`), `getPointsHistory(page, size)` → `{ code, message, data: LedgerEntry[], pagination }` where `LedgerEntry` = `{ id, event_type, amount, balance_after, occurred_at, reference_id? }` — from `../api/points`; `LoyaltyBadge` (`{ profile }: { profile: PointsProfile }`) from `../components/LoyaltyBadge`.
- Produces: default-exported `LoyaltyView` page component rendering `ConsumerLayout` wrapper.

- [ ] **Step 1: Write the failing spec**

`apps/frontend-consumer/src/pages/LoyaltyView.spec.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoyaltyView from './LoyaltyView';
import * as pointsApi from '../api/points';

vi.mock('../api/points', () => ({
  getPointsProfile: vi.fn(),
  getPointsHistory: vi.fn(),
}));

const profile = {
  tier: { id: 'g', name: 'Gold', min_points: 50000 },
  lifetime_points: 60000,
  balance_points: 120,
  next_tier: null,
};

const history = {
  code: 'SUCCESS',
  data: [
    {
      id: 'l1',
      event_type: 'EARN',
      amount: 150,
      balance_after: 150,
      occurred_at: '2026-08-01T00:00:00Z',
      reference_id: 'order-1',
    },
  ],
  pagination: { page: 0, size: 10, total: 1 },
};

describe('LoyaltyView', () => {
  beforeEach(() => {
    (pointsApi.getPointsProfile as any).mockResolvedValue(profile);
    (pointsApi.getPointsHistory as any).mockResolvedValue(history);
  });

  it('renders tier badge and recent ledger entries', async () => {
    render(<LoyaltyView />);
    expect(await screen.findByText('Gold Member')).toBeTruthy();
    expect(await screen.findByText('EARN')).toBeTruthy();
    expect(await screen.findByText('+150')).toBeTruthy();
  });

  it('shows error state with retry when profile fetch fails', async () => {
    (pointsApi.getPointsProfile as any).mockRejectedValue(
      new Error('Network error'),
    );
    render(<LoyaltyView />);
    expect(
      await screen.findByText(/unable to load your loyalty profile/i),
    ).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run spec to verify it fails**

Run (workdir `apps/frontend-consumer`): `npx vitest run src/pages/LoyaltyView.spec.tsx 2>&1 | tail -6`
Expected: FAIL — module `./LoyaltyView` not found.

- [ ] **Step 3: Implement LoyaltyView**

`apps/frontend-consumer/src/pages/LoyaltyView.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { ConsumerLayout } from '../components/layout/ConsumerLayout';
import LoyaltyBadge from '../components/LoyaltyBadge';
import {
  getPointsHistory,
  getPointsProfile,
  PointsProfile,
} from '../api/points';

export default function LoyaltyView() {
  const [profile, setProfile] = useState<PointsProfile | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const load = () => {
    setProfileError(null);
    setHistoryError(null);
    getPointsProfile()
      .then(setProfile)
      .catch((e: any) => setProfileError(e.message || 'Failed'));
    getPointsHistory(0, 5)
      .then((r) => setEntries(r.data ?? []))
      .catch((e: any) => setHistoryError(e.message || 'Failed'));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ConsumerLayout>
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Loyalty{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
              Profile
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl">
            Your tier, points, and recent activity.
          </p>
        </div>

        {profileError ? (
          <div className="glass-panel rounded-2xl border-white/10 bg-white/5 p-6 text-center">
            <p className="text-slate-300">
              Unable to load your loyalty profile. {profileError}
            </p>
            <button
              onClick={load}
              className="mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : profile ? (
          <LoyaltyBadge profile={profile} />
        ) : (
          <div className="glass-panel rounded-2xl border-white/10 bg-white/5 p-6 animate-pulse">
            Loading…
          </div>
        )}

        <h2 className="text-2xl font-bold tracking-tight mb-4 mt-10">
          Recent{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
            Activity
          </span>
        </h2>
        {historyError ? (
          <div className="glass-panel rounded-2xl border-white/10 bg-white/5 p-6 text-center">
            <p className="text-slate-300">
              Unable to load your point history. {historyError}
            </p>
            <button
              onClick={load}
              className="mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border-white/10 bg-white/5 divide-y divide-white/5">
            {entries.map((e) => (
              <div key={e.id} className="flex justify-between p-4">
                <div>
                  <span className="font-semibold text-white">
                    {e.event_type}
                  </span>
                  {e.reference_id && (
                    <span className="text-xs text-slate-500 ml-2">
                      ref: {e.reference_id}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={
                      Number(e.amount) < 0
                        ? 'text-rose-500'
                        : 'text-emerald-400'
                    }
                  >
                    {Number(e.amount) > 0 ? '+' : ''}
                    {e.amount}
                  </span>
                  <div className="text-xs text-slate-500">
                    Balance: {e.balance_after}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ConsumerLayout>
  );
}
```

- [ ] **Step 4: Run spec to verify it passes**

Run (workdir `apps/frontend-consumer`): `npx vitest run src/pages/LoyaltyView.spec.tsx 2>&1 | tail -6`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/frontend-consumer/src/pages/LoyaltyView.tsx apps/frontend-consumer/src/pages/LoyaltyView.spec.tsx
git commit -m "feat(consumer): loyalty profile page with tier badge and recent activity"
```

---

## Task 2: Consumer RewardsView page

**Files:**

- Create: `apps/frontend-consumer/src/pages/RewardsView.tsx`
- Create: `apps/frontend-consumer/src/pages/RewardsView.spec.tsx`

**Interfaces:**

- Consumes: `getRewards()` → `Reward[]` (raw array; `Reward` = `{ id, name, type, stock, point_price, exclusive_days, source_id, source?, min_tier?: { id, name } | null }`) from `../api/rewards`; `claimReward(rewardId)` → `{ status: 'SUCCESS', code? }` from `../api/rewards`; `getPointsProfile()` → `PointsProfile` from `../api/points`.
- Produces: default-exported `RewardsView` page component rendering `ConsumerLayout`.

- [ ] **Step 1: Write the failing spec**

`apps/frontend-consumer/src/pages/RewardsView.spec.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RewardsView from './RewardsView';
import * as rewardsApi from '../api/rewards';
import * as pointsApi from '../api/points';

vi.mock('../api/rewards', () => ({
  getRewards: vi.fn(),
  claimReward: vi.fn(),
}));
vi.mock('../api/points', () => ({
  getPointsProfile: vi.fn(),
}));

const rewards = [
  {
    id: 'r1',
    name: 'GoPay 10k',
    type: 'gopay',
    stock: 5,
    point_price: 1000,
    exclusive_days: 0,
    source_id: 's1',
    min_tier: null,
  },
  {
    id: 'r2',
    name: 'Gold Only',
    type: 'gopay',
    stock: 3,
    point_price: 2000,
    exclusive_days: 30,
    source_id: 's2',
    min_tier: { id: 'g', name: 'Gold' },
  },
  {
    id: 'r3',
    name: 'Out of stock item',
    type: 'gopay',
    stock: 0,
    point_price: 500,
    exclusive_days: 0,
    source_id: 's3',
    min_tier: null,
  },
];

const bronzeProfile = {
  tier: { id: 'b', name: 'Bronze', min_points: 0 },
  lifetime_points: 100,
  balance_points: 500,
  next_tier: { id: 's', name: 'Silver', min_points: 10000 },
};

describe('RewardsView', () => {
  beforeEach(() => {
    (rewardsApi.getRewards as any).mockResolvedValue(rewards);
    (pointsApi.getPointsProfile as any).mockResolvedValue(bronzeProfile);
  });

  it('renders reward cards', async () => {
    render(<RewardsView />);
    expect(await screen.findByText('GoPay 10k')).toBeTruthy();
    expect(await screen.findByText('Gold Only')).toBeTruthy();
  });

  it('disables claim for tier-gated reward with hint', async () => {
    render(<RewardsView />);
    const goldButtons = await screen.findAllByRole('button', {
      name: /requires gold/i,
    });
    expect(goldButtons.length).toBeGreaterThan(0);
  });

  it('disables claim for out of stock reward', async () => {
    render(<RewardsView />);
    const outButtons = await screen.findAllByRole('button', {
      name: /out of stock/i,
    });
    expect(outButtons.length).toBeGreaterThan(0);
  });

  it('claims a reward and shows the voucher code', async () => {
    (rewardsApi.claimReward as any).mockResolvedValue({
      status: 'SUCCESS',
      code: 'GOPAY-ABC123',
    });
    render(<RewardsView />);
    const claimButtons = await screen.findAllByRole('button', {
      name: /^claim$/i,
    });
    fireEvent.click(claimButtons[0]);
    expect(await screen.findByText(/GOPAY-ABC123/i)).toBeTruthy();
  });

  it('shows error message when claim fails', async () => {
    (rewardsApi.claimReward as any).mockRejectedValue(
      new Error('Insufficient points'),
    );
    render(<RewardsView />);
    const claimButtons = await screen.findAllByRole('button', {
      name: /^claim$/i,
    });
    fireEvent.click(claimButtons[0]);
    expect(await screen.findByText(/Insufficient points/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run spec to verify it fails**

Run (workdir `apps/frontend-consumer`): `npx vitest run src/pages/RewardsView.spec.tsx 2>&1 | tail -6`
Expected: FAIL — module `./RewardsView` not found.

- [ ] **Step 3: Implement RewardsView**

`apps/frontend-consumer/src/pages/RewardsView.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { ConsumerLayout } from '../components/layout/ConsumerLayout';
import { claimReward, getRewards } from '../api/rewards';
import { getPointsProfile, PointsProfile } from '../api/points';

interface Reward {
  id: string;
  name: string;
  type: string;
  stock: number;
  point_price: number;
  exclusive_days: number;
  source_id: string;
  min_tier?: { id: string; name: string } | null;
}

interface ClaimState {
  inFlight: string | null;
  success: string | null; // voucher code shown
  successRewardId: string | null; // card that owns the success feedback
  error: string | null;
  errorRewardId: string | null; // card that owns the error feedback
}

function tierRequirementMet(
  reward: Reward,
  profile: PointsProfile | null,
): boolean {
  if (!reward.min_tier) return true;
  if (!profile?.tier) return false;
  const inWindow =
    reward.exclusive_days > 0 &&
    new Date() <
      new Date(Date.now() + reward.exclusive_days * 24 * 60 * 60 * 1000);
  // Tier gate applies only during the exclusive window (I1 semantics);
  // without a window, the gate is not enforced.
  if (!inWindow) return true;
  return profile.tier.id === reward.min_tier.id;
}

function getClaimHint(reward: Reward, profile: PointsProfile | null) {
  if (reward.stock === 0) return 'Out of stock';
  if (!tierRequirementMet(reward, profile)) {
    return `Requires ${reward.min_tier?.name ?? 'higher tier'}`;
  }
  const balance = Number(profile?.balance_points ?? 0);
  if (Number(reward.point_price) > 0 && balance < Number(reward.point_price)) {
    return 'Insufficient points';
  }
  return null;
}

export default function RewardsView() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [profile, setProfile] = useState<PointsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claim, setClaim] = useState<ClaimState>({
    inFlight: null,
    success: null,
    successRewardId: null,
    error: null,
    errorRewardId: null,
  });

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([getRewards(), getPointsProfile()])
      .then(([r, p]) => {
        setRewards(r);
        setProfile(p);
      })
      .catch((e: any) => setError(e.message || 'Failed to load rewards'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleClaim = async (reward: Reward) => {
    setClaim({
      inFlight: reward.id,
      success: null,
      successRewardId: null,
      error: null,
      errorRewardId: null,
    });
    try {
      const result = await claimReward(reward.id);
      setClaim({
        inFlight: null,
        success: result?.code || 'Claimed successfully!',
        successRewardId: reward.id,
        error: null,
        errorRewardId: null,
      });
      // Refresh balance after a successful spend
      getPointsProfile()
        .then(setProfile)
        .catch(() => {});
    } catch (e: any) {
      setClaim({
        inFlight: null,
        success: null,
        successRewardId: null,
        error: e.message || 'Claim failed',
        errorRewardId: reward.id,
      });
    }
  };

  return (
    <ConsumerLayout>
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Rewards{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
              Vault
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl">
            Redeem your points for exclusive rewards.
          </p>
        </div>

        {error ? (
          <div className="glass-panel rounded-2xl border-white/10 bg-white/5 p-6 text-center">
            <p className="text-slate-300">{error}</p>
            <button
              onClick={load}
              className="mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="glass-panel rounded-2xl border-white/10 bg-white/5 p-6 animate-pulse">
            Loading…
          </div>
        ) : rewards.length === 0 ? (
          <div className="glass-panel rounded-2xl border-white/10 bg-white/5 p-6 text-center text-slate-400">
            No rewards available yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((r) => {
              const hint = getClaimHint(r, profile);
              const disabled = !!hint || claim.inFlight !== null;
              return (
                <div
                  key={r.id}
                  className="glass-panel rounded-2xl border-white/10 bg-white/5 p-5 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-white">{r.name}</h3>
                    {r.min_tier && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                        {r.min_tier.name}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">
                    {Number(r.point_price) > 0 ? (
                      <span className="text-cyan-300 font-medium">
                        {r.point_price} pts
                      </span>
                    ) : (
                      'Free'
                    )}
                    <span className="mx-2">•</span>
                    {r.stock === -1 ? '∞' : `${r.stock} left`}
                  </div>
                  <button
                    onClick={() => handleClaim(r)}
                    disabled={disabled}
                    className="mt-auto w-full px-4 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white"
                  >
                    {hint || (claim.inFlight === r.id ? 'Claiming…' : 'Claim')}
                  </button>
                  {claim.inFlight === null &&
                    claim.success &&
                    claim.successRewardId === r.id && (
                      <p className="text-xs text-emerald-400 text-center">
                        Voucher: {claim.success}
                      </p>
                    )}
                  {claim.inFlight === null &&
                    claim.error &&
                    claim.errorRewardId === r.id && (
                      <p className="text-xs text-rose-400 text-center">
                        {claim.error}
                      </p>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ConsumerLayout>
  );
}
```

- [ ] **Step 4: Run spec to verify it passes**

Run (workdir `apps/frontend-consumer`): `npx vitest run src/pages/RewardsView.spec.tsx 2>&1 | tail -6`
Expected: PASS (5 tests). Note: the success/error claim feedback renders only on the card whose id matches `claim.successRewardId` / `claim.errorRewardId` — the spec's `findByText` for the voucher code and error message works because only one card renders the feedback at a time.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend-consumer/src/pages/RewardsView.tsx apps/frontend-consumer/src/pages/RewardsView.spec.tsx
git commit -m "feat(consumer): rewards page with claim flow and tier gating hints"
```

---

## Task 3: Consumer routes + nav (App.tsx + ConsumerLayout)

**Files:**

- Modify: `apps/frontend-consumer/src/App.tsx`
- Modify: `apps/frontend-consumer/src/components/layout/ConsumerLayout.tsx`

**Interfaces:**

- Consumes: `LoyaltyView` (default export, Task 1), `RewardsView` (default export, Task 2).
- Produces: routes `/loyalty`, `/rewards`; pill nav links + mobile bottom-nav items labeled "Loyalty" / "Rewards".

- [ ] **Step 1: Add the routes**

`apps/frontend-consumer/src/App.tsx` — add imports after the existing page imports (match file order):

```tsx
import LoyaltyView from './pages/LoyaltyView';
import RewardsView from './pages/RewardsView';
```

and add these two `<Route>` blocks after the `/points-history` route (match the existing ProtectedRoute pattern exactly):

```tsx
          <Route
            path="/loyalty"
            element={
              <ProtectedRoute>
                <LoyaltyView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rewards"
            element={
              <ProtectedRoute>
                <RewardsView />
              </ProtectedRoute>
            }
          />
```

- [ ] **Step 2: Add desktop pill nav links**

`apps/frontend-consumer/src/components/layout/ConsumerLayout.tsx` — check the imports at the top (lucide icons `Award`, `Gift` may need adding to the existing `lucide-react` import). Inside the desktop `<div className="hidden md:flex items-center gap-1 ...">` nav, after the `/points-history` NavLink, add:

```tsx
            <NavLink
              to="/loyalty"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-white shadow-inner shadow-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Award className="w-4 h-4" />
              Loyalty
            </NavLink>
            <NavLink
              to="/rewards"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-white shadow-inner shadow-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Gift className="w-4 h-4" />
              Rewards
            </NavLink>
```

- [ ] **Step 3: Add mobile bottom-nav items**

In the same file, inside the mobile `<div className="md:hidden fixed bottom-0 ...">` nav, after the `/points-history` NavLink (before the closing `</div>`), add:

```tsx
          <NavLink
            to="/loyalty"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-all ${
                isActive
                  ? 'text-cyan-400 bg-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
              }`
            }
          >
            <Award className="w-5 h-5" />
            <span className="text-[10px] font-medium">Loyalty</span>
          </NavLink>
          <NavLink
            to="/rewards"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-all ${
                isActive
                  ? 'text-fuchsia-400 bg-fuchsia-500/10'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
              }`
            }
          >
            <Gift className="w-5 h-5" />
            <span className="text-[10px] font-medium">Rewards</span>
          </NavLink>
```

(6 items total in the mobile nav — each keeps its per-item active color; labels stay short.)

- [ ] **Step 4: Verify no regressions**

Run (workdir `apps/frontend-consumer`): `npx vitest run 2>&1 | tail -6`
Expected: all pass (baseline 57 + LoyaltyView 2 + RewardsView 5 = 64). If any existing spec breaks from the nav change (e.g., a layout snapshot), fix it.

Also run `npx tsc --noEmit 2>&1 | tail -3` — expected: no errors in new/changed files.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend-consumer/src/App.tsx apps/frontend-consumer/src/components/layout/ConsumerLayout.tsx
git commit -m "feat(consumer): loyalty and rewards routes with nav links"
```

---

## Task 4: CMS sidebar — Loyalty section nav

**Files:**

- Modify: `apps/frontend-cms/src/components/layout/MainLayout.tsx`

**Interfaces:**

- Consumes: existing CMS routes `/tiers`, `/rewards` (already registered in `src/router/index.tsx` — no router change).
- Produces: sidebar "Loyalty" section label + two NavLinks ("Tier Management" → `/tiers`, "Reward Management" → `/rewards`).

- [ ] **Step 1: Add the section and NavLinks**

`apps/frontend-cms/src/components/layout/MainLayout.tsx` — read the file first. Add `Layers` and `Gift` to the lucide-react import (check what's already imported). Inside the `<nav className="flex-1 p-4 space-y-2">`, after the "Product Management" NavLink (before the settings link), add a section label + two NavLinks matching the existing isActive pattern:

```tsx
            <p className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Loyalty
            </p>
            <NavLink
              to="/tiers"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                }`
              }
            >
              <Layers size={20} />
              <span>Tier Management</span>
            </NavLink>
            <NavLink
              to="/rewards"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                }`
              }
            >
              <Gift size={20} />
              <span>Reward Management</span>
            </NavLink>
```

- [ ] **Step 2: Verify**

Run (workdir `apps/frontend-cms`): `npx vitest run 2>&1 | tail -6`
Expected: baseline 87 passed / 2 pre-existing failed (Login.spec collection + VoucherBindingList/VoucherValidityList delete asserts) — **no new failures**.
Also run `npx tsc --noEmit 2>&1 | tail -3` — expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend-cms/src/components/layout/MainLayout.tsx
git commit -m "feat(cms): loyalty section nav for tier and reward management"
```

---

## Appendix: Cross-references

| Spec requirement                                                   | Task   |
| ------------------------------------------------------------------ | ------ |
| Consumer `/loyalty` page: LoyaltyBadge + 5 ledger entries          | Task 1 |
| Consumer `/rewards` page: grid + claim + feedback                  | Task 2 |
| Disabled hints: tier gate (I1 semantics) / balance / stock         | Task 2 |
| Consumer nav: 2 pill links (desktop) + 2 bottom-nav items (mobile) | Task 3 |
| Consumer routes `/loyalty`, `/rewards` in ProtectedRoute           | Task 3 |
| CMS sidebar "Loyalty" section + Tier/Reward links                  | Task 4 |
| Out of scope: no backend changes, no new endpoints                 | —      |
