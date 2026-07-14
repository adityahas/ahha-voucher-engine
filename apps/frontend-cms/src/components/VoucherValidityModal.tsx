import React, { useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { VoucherValidity } from '../api/vouchers';

interface VoucherValidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (validity: Partial<VoucherValidity>) => Promise<void>;
  validity?: VoucherValidity | null;
  voucherId: string;
}

const VALIDITY_TYPES = ['daily', 'birthday', 'weekly', 'monthly', 'one_time'];

export const VoucherValidityModal: React.FC<VoucherValidityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  validity,
}) => {
  const [type, setType] = React.useState<string>('daily');

  // Format dates for input type="date"
  const formatDateForInput = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');
  const [startTime, setStartTime] = React.useState<string>('00:00:00');
  const [endTime, setEndTime] = React.useState<string>('23:59:59');

  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (validity) {
        setType(validity.type);
        setStartDate(formatDateForInput(validity.start_date));
        setEndDate(formatDateForInput(validity.end_date));
        setStartTime(validity.start_time);
        setEndTime(validity.end_time);
      } else {
        setType('daily');
        setStartDate('');
        setEndDate('');
        setStartTime('00:00:00');
        setEndTime('23:59:59');
      }
      setError(null);
    }
  }, [isOpen, validity]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate) {
      setError('Start Date is required');
      return;
    }
    if (!startTime || !endTime) {
      setError('Start Time and End Time are required');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        type,
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime, // ensure HH:mm:ss
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save validity schedule');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-100">
            {validity ? 'Edit Schedule' : 'Add Schedule'}
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
              htmlFor="validityType"
              className="text-xs font-bold text-slate-400 uppercase tracking-widest"
            >
              Schedule Type
            </label>
            <div className="relative">
              <select
                id="validityType"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none"
              >
                {VALIDITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase().replace('_', ' ')}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="startDate"
                className="text-xs font-bold text-slate-400 uppercase tracking-widest"
              >
                Start Date
              </label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-800 border-none focus:ring-primary-500 w-full"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="endDate"
                className="text-xs font-bold text-slate-400 uppercase tracking-widest"
              >
                End Date (Optional)
              </label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-800 border-none focus:ring-primary-500 w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="startTime"
                className="text-xs font-bold text-slate-400 uppercase tracking-widest"
              >
                Start Time
              </label>
              <Input
                id="startTime"
                type="time"
                step="1"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-slate-800 border-none focus:ring-primary-500 w-full"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="endTime"
                className="text-xs font-bold text-slate-400 uppercase tracking-widest"
              >
                End Time
              </label>
              <Input
                id="endTime"
                type="time"
                step="1"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-slate-800 border-none focus:ring-primary-500 w-full"
              />
            </div>
          </div>

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
              {isSaving ? 'Saving...' : 'Save Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoucherValidityModal;
