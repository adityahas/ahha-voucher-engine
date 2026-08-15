import { useEffect, useState } from 'react';
import { getVouchers, Voucher } from '../api/vouchers';
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
    level_up_voucher_code: initial?.level_up_voucher_code ?? '',
    is_active: initial?.is_active ?? true,
    category_overrides: initial?.category_overrides ?? [],
  });

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
