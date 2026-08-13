import React, { useEffect, useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { VoucherBinding } from '../api/vouchers';
import { getTiers, Tier } from '../api/tiers';

interface VoucherBindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (binding: Partial<VoucherBinding>) => Promise<void>;
  binding?: VoucherBinding | null;
  voucherId: string;
}

const BIND_TYPES = [
  'role',
  'user_group',
  'product_type',
  'product_sku',
  'product_vendor',
  'tier',
];

export const VoucherBindingModal: React.FC<VoucherBindingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  binding,
}) => {
  const [bindType, setBindType] = React.useState<string>('role');
  const [bindValue, setBindValue] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    getTiers()
      .then(setTiers)
      .catch(() => setTiers([]));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (binding) {
        setBindType(binding.bind_type);
        setBindValue(binding.bind_value);
      } else {
        setBindType('role');
        setBindValue('');
      }
      setError(null);
    }
  }, [isOpen, binding]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bindValue.trim()) {
      setError('Binding Value is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        bind_type: bindType,
        bind_value: bindValue,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save binding');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-100">
            {binding ? 'Edit Constraint' : 'Add Constraint'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
            <p className="text-sm font-medium text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="bindType"
              className="text-xs font-bold text-slate-400 uppercase tracking-widest"
            >
              Binding Type
            </label>
            <div className="relative">
              <select
                id="bindType"
                value={bindType}
                onChange={(e) => setBindType(e.target.value)}
                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none"
              >
                {BIND_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.toUpperCase().replace('_', ' ')}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {bindType === 'tier' ? (
            <div className="space-y-2">
              <label
                htmlFor="bindValue"
                className="text-xs font-bold text-slate-400 uppercase tracking-widest"
              >
                Binding Tier
              </label>
              <div className="relative">
                <select
                  id="bindValue"
                  value={bindValue}
                  onChange={(e) => setBindValue(e.target.value)}
                  className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none"
                >
                  <option value="">Select tier...</option>
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label
                htmlFor="bindValue"
                className="text-xs font-bold text-slate-400 uppercase tracking-widest"
              >
                Binding Value
              </label>
              <Input
                id="bindValue"
                value={bindValue}
                onChange={(e) => setBindValue(e.target.value)}
                placeholder="e.g., admin, electronics, SKU123"
                className="bg-slate-800 border-none focus:ring-primary-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="border-slate-700 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              icon={Save}
            >
              {isSaving ? 'Saving...' : 'Save Constraint'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoucherBindingModal;
