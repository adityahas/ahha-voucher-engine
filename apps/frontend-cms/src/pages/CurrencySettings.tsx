import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrencySettings, updateCurrencySettings } from '../api/settings';
import { Button } from '../components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import {
  DEFAULT_CURRENCY_SETTINGS,
  CurrencySettings,
} from '../types/currency-settings';
import { formatCurrency } from '../lib/currency-format';

const optionFields = [
  ['minimumFractionDigits', 'Minimum fraction digits'],
  ['maximumFractionDigits', 'Maximum fraction digits'],
  ['minimumIntegerDigits', 'Minimum integer digits'],
] as const;

export const CurrencySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(DEFAULT_CURRENCY_SETTINGS);
  const [saved, setSaved] = useState(DEFAULT_CURRENCY_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  useEffect(() => {
    getCurrencySettings()
      .then((data) => {
        setDraft(data);
        setSaved(data);
        setLoaded(true);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load currency settings');
        setLoaded(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);

  const update = (field: keyof CurrencySettings, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));
  const updateOption = (field: string, value: string | boolean) =>
    setDraft((current) => {
      const options = { ...current.number_format_options } as Record<
        string,
        string | number | boolean
      >;
      if (value === '') {
        delete options[field];
      } else {
        options[field] =
          typeof value === 'string' && field.endsWith('Digits')
            ? Number(value)
            : value;
      }
      return { ...current, number_format_options: options };
    });
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const data = await updateCurrencySettings(draft);
      setDraft(data);
      setSaved(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save currency settings');
    } finally {
      setSaving(false);
    }
  };
  const cancel = () => {
    if (!dirty || window.confirm('Discard unsaved currency changes?')) {
      setDraft(saved);
      navigate('/products');
    }
  };

  if (loading)
    return (
      <div className="py-20 text-center text-slate-400">
        Loading currency settings...
      </div>
    );
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-extrabold text-white">
          Currency Settings
        </h1>
        <p className="text-slate-400">
          Configure how prices appear across your tenant.
        </p>
      </div>
      {error && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
        >
          <AlertCircle />
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="flex gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-300"
        >
          <CheckCircle2 />
          Currency settings saved.
        </div>
      )}
      <form onSubmit={save} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Use ISO currency and locale values.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              label="Currency code"
              value={draft.currency_code}
              maxLength={3}
              onChange={(e) =>
                update('currency_code', e.target.value.toUpperCase())
              }
            />
            <Input
              label="Locale"
              value={draft.locale}
              onChange={(e) => update('locale', e.target.value)}
            />
            <details open>
              <summary className="mb-4 flex cursor-pointer items-center gap-2 font-bold text-slate-200">
                <Settings2 size={18} />
                Advanced options
              </summary>
              <div className="space-y-4">
                {optionFields.map(([field, label]) => (
                  <Input
                    key={field}
                    label={label}
                    type="number"
                    value={(draft.number_format_options as any)[field] ?? ''}
                    onChange={(e) => updateOption(field, e.target.value)}
                  />
                ))}
                <label className="flex items-center gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={draft.number_format_options.useGrouping !== false}
                    onChange={(e) =>
                      updateOption('useGrouping', e.target.checked)
                    }
                  />{' '}
                  Use digit grouping
                </label>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Currency display
                  <select
                    className="mt-2 block w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-white"
                    value={
                      draft.number_format_options.currencyDisplay || 'symbol'
                    }
                    onChange={(e) =>
                      updateOption('currencyDisplay', e.target.value)
                    }
                  >
                    <option value="symbol">Symbol</option>
                    <option value="code">Code</option>
                    <option value="name">Name</option>
                  </select>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      number_format_options: {},
                    }))
                  }
                >
                  Reset overrides
                </Button>
              </div>
            </details>
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                isLoading={saving}
                disabled={!loaded || !dirty}
              >
                Save changes
              </Button>
              <Button type="button" variant="outline" onClick={cancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
            <CardDescription>
              {draft.locale} · {draft.currency_code}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            {[
              ['Product price', 12500],
              ['Discount', -1250],
              ['Subtotal', 250000],
              ['Final price', 248750],
              ['Large value', 123456789],
              ['Compact value', 1250000],
            ].map(([label, value]) => (
              <div
                key={label as string}
                className="flex justify-between border-b border-slate-800/60 py-3"
              >
                <span>{label}</span>
                <strong className="text-white">
                  {formatCurrency(value as number, draft)}
                </strong>
              </div>
            ))}
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default CurrencySettingsPage;
