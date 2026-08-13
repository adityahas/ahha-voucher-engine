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
