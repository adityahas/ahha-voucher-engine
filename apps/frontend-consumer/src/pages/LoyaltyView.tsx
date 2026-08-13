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
