import { useEffect, useState } from 'react';
import { getPointsHistory } from '../api/points';
import { ConsumerLayout } from '../components/layout/ConsumerLayout';

export default function PointsHistoryView() {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    getPointsHistory()
      .then((r) => setEntries(r.data ?? []))
      .catch(() => setEntries([]));
  }, []);

  return (
    <ConsumerLayout>
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Point{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
              History
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl">
            Every point you've earned and spent, all in one place.
          </p>
        </div>

        <div className="glass-panel rounded-2xl border-white/10 bg-white/5 divide-y divide-white/5">
          {entries.map((e) => (
            <div key={e.id} className="flex justify-between p-4">
              <div>
                <span className="font-semibold text-white">{e.event_type}</span>
                {e.reference_id && (
                  <span className="text-xs text-slate-500 ml-2">
                    ref: {e.reference_id}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span
                  className={
                    Number(e.amount) < 0 ? 'text-rose-500' : 'text-emerald-400'
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
      </div>
    </ConsumerLayout>
  );
}
