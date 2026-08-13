import { useState } from 'react';
import { TierInput } from '../api/tiers';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Save } from 'lucide-react';

export default function TierForm({
  initial,
  onSubmit,
}: {
  initial?: Partial<TierInput>;
  onSubmit: (input: TierInput) => Promise<void>;
}) {
  const [form, setForm] = useState<TierInput>({
    name: initial?.name ?? '',
    level: Number(initial?.level ?? 1),
    min_points: Number(initial?.min_points ?? 0),
    point_multiplier: Number(initial?.point_multiplier ?? 1),
    extra_discount_percent: Number(initial?.extra_discount_percent ?? 0),
    exclusive_window_hours: Number(initial?.exclusive_window_hours ?? 0),
    is_active: initial?.is_active ?? true,
    category_overrides: initial?.category_overrides ?? [],
  });

  const set = (key: keyof TierInput, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(form);
      }}
      className="max-w-xl space-y-4"
    >
      <Input
        label="Name"
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        required
        placeholder="e.g. Gold"
      />
      <Input
        label="Level"
        type="number"
        value={form.level}
        onChange={(e) => set('level', Number(e.target.value))}
        required
      />
      <Input
        label="Min Points"
        type="number"
        step="0.01"
        value={form.min_points}
        onChange={(e) => set('min_points', Number(e.target.value))}
        required
      />
      <Input
        label="Point Multiplier"
        type="number"
        step="0.01"
        value={form.point_multiplier}
        onChange={(e) => set('point_multiplier', Number(e.target.value))}
        required
      />
      <Input
        label="Extra Discount %"
        type="number"
        step="0.01"
        value={form.extra_discount_percent}
        onChange={(e) => set('extra_discount_percent', Number(e.target.value))}
      />
      <Input
        label="Exclusive Window (hours)"
        type="number"
        value={form.exclusive_window_hours}
        onChange={(e) => set('exclusive_window_hours', Number(e.target.value))}
      />
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.is_active ?? true}
          onChange={(e) => set('is_active', e.target.checked)}
          className="h-4 w-4 accent-primary-500"
        />
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Active
        </span>
      </label>
      <Button type="submit" icon={Save} iconRight>
        Save
      </Button>
    </form>
  );
}
