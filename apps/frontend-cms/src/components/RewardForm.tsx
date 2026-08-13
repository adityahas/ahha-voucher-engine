import { useEffect, useState } from 'react';
import { RewardInput } from '../api/rewards';
import { getTiers, Tier } from '../api/tiers';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Save } from 'lucide-react';

export default function RewardForm({
  initial,
  onSubmit,
}: {
  initial?: Partial<RewardInput> & {
    min_tier?: { id: string; name: string } | null;
  };
  onSubmit: (input: RewardInput) => Promise<void>;
}) {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [minTierId, setMinTierId] = useState<string>(
    (initial as any)?.min_tier?.id ?? (initial as any)?.min_tier_id ?? '',
  );
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    type: initial?.type ?? '',
    stock: initial?.stock ?? -1,
    source_id: initial?.source_id ?? '',
    point_price: initial?.point_price ?? 0,
    exclusive_days: initial?.exclusive_days ?? 0,
  });

  useEffect(() => {
    getTiers()
      .then(setTiers)
      .catch(() => setTiers([]));
  }, []);

  const set = (key: keyof typeof form, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({
          ...form,
          point_price: Number(form.point_price) || 0,
          exclusive_days: Number(form.exclusive_days) || 0,
          ...(minTierId
            ? { min_tier_id: minTierId }
            : initial?.min_tier
              ? { min_tier_id: null }
              : {}),
        });
      }}
      className="max-w-xl space-y-4"
    >
      <Input
        label="Name"
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        required
        placeholder="e.g. GoPay 10k"
      />
      <Input
        label="Type"
        value={form.type}
        onChange={(e) => set('type', e.target.value)}
        required
        placeholder="e.g. gopay, pulsa"
      />
      <Input
        label="Source ID"
        value={form.source_id}
        onChange={(e) => set('source_id', e.target.value)}
        required
        placeholder="Reward source UUID"
      />
      <Input
        label="Stock (-1 = unlimited, 0 = out)"
        type="number"
        value={form.stock}
        onChange={(e) => set('stock', Number(e.target.value))}
        required
      />
      <Input
        label="Point Price"
        type="number"
        step="0.01"
        min="0"
        value={form.point_price}
        onChange={(e) => set('point_price', Number(e.target.value))}
        placeholder="0"
      />
      <Input
        label="Exclusive Days"
        type="number"
        min="0"
        value={form.exclusive_days}
        onChange={(e) => set('exclusive_days', Number(e.target.value))}
        placeholder="0"
      />
      <div className="space-y-1.5">
        <label
          htmlFor="min_tier"
          className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1"
        >
          Minimum Tier
        </label>
        <select
          id="min_tier"
          value={minTierId}
          onChange={(e) => setMinTierId(e.target.value)}
          className="w-full h-12 rounded-xl bg-slate-900/50 border border-slate-700/50 focus:border-primary-500/50 transition-all duration-300 px-4 text-sm text-slate-100 appearance-none focus:outline-none focus:ring-1 focus:ring-primary-500/50"
        >
          <option value="">No minimum tier</option>
          {tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" icon={Save} iconRight>
        Save
      </Button>
    </form>
  );
}
