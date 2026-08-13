import { PointsProfile } from '../api/points';

export default function LoyaltyBadge({ profile }: { profile: PointsProfile }) {
  const tier = profile.tier;
  const next = profile.next_tier;
  const currentMin = tier ? Number(tier.min_points) || 0 : 0;
  const progress =
    next && next.min_points > currentMin
      ? Math.min(
          100,
          ((profile.lifetime_points - currentMin) /
            (next.min_points - currentMin)) *
            100,
        )
      : 100;

  return (
    <div className="glass-panel rounded-2xl p-5 mb-6 border-white/10 bg-white/5">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-lg text-white">
          {tier ? `${tier.name} Member` : 'Member'}
        </span>
        <span className="text-sm text-slate-400">
          Balance: {profile.balance_points} pts
        </span>
      </div>
      {next ? (
        <>
          <div className="h-2 bg-slate-700 rounded-full">
            <div
              className="h-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {profile.lifetime_points} / {next.min_points} pts to {next.name}
          </p>
        </>
      ) : (
        <p className="text-xs text-slate-500 mt-1">Top tier reached!</p>
      )}
    </div>
  );
}
