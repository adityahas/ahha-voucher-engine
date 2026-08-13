import { useState } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import {
  RewardItemSource,
  RewardItemSourceInput,
} from '../api/reward-item-sources';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export default function RewardItemSourceForm({
  initial,
  onSubmit,
}: {
  initial?: Partial<RewardItemSource>;
  onSubmit: (input: RewardItemSourceInput) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    source_type: initial?.source_type ?? '',
    api_endpoint: initial?.api_endpoint ?? '',
    apiKey: '',
  });
  const [showKey, setShowKey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const nextErrors: Record<string, string> = {};
        if (!form.name.trim()) nextErrors.name = 'Name is required';
        if (!form.source_type.trim())
          nextErrors.source_type = 'Type is required';
        setErrors(nextErrors);
        setApiError('');
        if (Object.keys(nextErrors).length) return;
        const input: RewardItemSourceInput = {
          name: form.name.trim(),
          source_type: form.source_type.trim(),
        };
        if (form.api_endpoint.trim())
          input.api_endpoint = form.api_endpoint.trim();
        if (form.apiKey.trim()) input.apiKey = form.apiKey;
        try {
          await onSubmit(input);
        } catch (error: any) {
          setApiError(error.message || 'Failed to save reward source');
        }
      }}
    >
      <Input
        label="Name"
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        error={errors.name}
      />
      <Input
        label="Type"
        value={form.source_type}
        onChange={(e) => set('source_type', e.target.value)}
        error={errors.source_type}
      />
      <Input
        label="API Endpoint"
        value={form.api_endpoint}
        onChange={(e) => set('api_endpoint', e.target.value)}
      />
      <div className="relative">
        <Input
          label="API Key"
          type={showKey ? 'text' : 'password'}
          value={form.apiKey}
          onChange={(e) => set('apiKey', e.target.value)}
          helperText={
            initial?.apiKey
              ? 'Leave blank to keep the existing key.'
              : undefined
          }
        />
        <button
          type="button"
          aria-label={`${showKey ? 'Hide' : 'Show'} API key`}
          onClick={() => setShowKey((value) => !value)}
          className="absolute right-3 top-9 text-slate-400 hover:text-white"
        >
          {showKey ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {apiError && <p className="text-sm text-red-400">{apiError}</p>}
      <Button type="submit" icon={Save} iconRight>
        Save
      </Button>
    </form>
  );
}
