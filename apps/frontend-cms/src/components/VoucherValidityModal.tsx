import React, { useEffect } from 'react';
import {
  X,
  Save,
  AlertCircle,
  Gift,
  Calendar,
  Clock,
  Repeat,
  Zap,
  CalendarDays,
} from 'lucide-react';
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

const VALIDITY_TYPES = [
  { value: 'daily', label: 'DAILY' },
  { value: 'birthday', label: 'BIRTHDAY' },
  { value: 'weekly', label: 'WEEKLY' },
  { value: 'custom_day_weekly', label: 'CUSTOM DAY WEEKLY' },
  { value: 'monthly', label: 'MONTHLY' },
  { value: 'one_time', label: 'ONE TIME' },
];

const DAYS_OF_WEEK = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

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
  const [selectedDays, setSelectedDays] = React.useState<string[]>([
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
  ]);

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
        if (
          validity.valid_days &&
          Array.isArray(validity.valid_days) &&
          validity.valid_days.length > 0
        ) {
          setSelectedDays(validity.valid_days);
        } else {
          setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri']);
        }
      } else {
        setType('daily');
        setStartDate('');
        setEndDate('');
        setStartTime('00:00:00');
        setEndTime('23:59:59');
        setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri']);
      }
      setError(null);
    }
  }, [isOpen, validity]);

  if (!isOpen) return null;

  const isBirthday = type === 'birthday';
  const isOneTime = type === 'one_time';
  const isDaily = type === 'daily';
  const isWeekly = type === 'weekly';
  const isCustomDayWeekly = type === 'custom_day_weekly';
  const isMonthly = type === 'monthly';

  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBirthday) {
      // Birthday does not require date/time input validation
    } else if (isCustomDayWeekly && selectedDays.length === 0) {
      setError(
        'Please select at least one day of the week for Custom Day Weekly',
      );
      return;
    } else if (isOneTime) {
      if (!startDate || !endDate) {
        setError(
          'Both Start Date and End Date are required for One Time campaigns',
        );
        return;
      }
      if (!startTime || !endTime) {
        setError('Start Time and End Time are required');
        return;
      }
    } else {
      // daily, weekly, custom_day_weekly, monthly
      if (!startDate) {
        setError('Start Date is required');
        return;
      }
      if (!startTime || !endTime) {
        setError('Start Time and End Time are required');
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    try {
      const formattedStartDate = isBirthday
        ? startDate
          ? new Date(startDate).toISOString()
          : new Date().toISOString()
        : new Date(startDate).toISOString();

      await onSave({
        type,
        start_date: formattedStartDate,
        end_date: isBirthday
          ? null
          : endDate
            ? new Date(endDate).toISOString()
            : null,
        start_time: isBirthday
          ? '00:00:00'
          : startTime.length === 5
            ? `${startTime}:00`
            : startTime,
        end_time: isBirthday
          ? '23:59:59'
          : endTime.length === 5
            ? `${endTime}:00`
            : endTime,
        valid_days: isCustomDayWeekly ? selectedDays : null,
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
                className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none font-medium text-sm"
              >
                {VALIDITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
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

          {/* Context Banners */}
          {isBirthday && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-start gap-3">
              <Gift className="text-purple-400 shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <span className="font-bold block text-purple-200">
                  Birthday Reward Schedule
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Voucher will automatically apply on the target user's
                  birthdate (00:00:00 - 23:59:59). No date or time range
                  selection required.
                </p>
              </div>
            </div>
          )}

          {isCustomDayWeekly && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-3">
                <CalendarDays
                  className="text-indigo-400 shrink-0 mt-0.5"
                  size={18}
                />
                <div className="space-y-1">
                  <span className="font-bold block text-indigo-200">
                    Custom Day Weekly Schedule
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    Select specific days of the week when the voucher is active
                    during the chosen time range.
                  </p>
                </div>
              </div>

              {/* Day of Week Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Active Days of Week *
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = selectedDays.includes(d.id);
                    return (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => toggleDay(d.id)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {isOneTime && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
              <Zap className="text-amber-400 shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <span className="font-bold block text-amber-200">
                  One-Time Campaign Window
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Requires both Start Date and End Date. The voucher will
                  strictly expire after the End Date window.
                </p>
              </div>
            </div>
          )}

          {isDaily && (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-3">
              <Repeat className="text-blue-400 shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <span className="font-bold block text-blue-200">
                  Daily Recurrence Schedule
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Voucher recurs every day during the specified active hours.
                  End Date is optional.
                </p>
              </div>
            </div>
          )}

          {isWeekly && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-3">
              <Calendar
                className="text-emerald-400 shrink-0 mt-0.5"
                size={18}
              />
              <div className="space-y-1">
                <span className="font-bold block text-emerald-200">
                  Weekly Recurrence Schedule
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Voucher recurs every week during the specified active hours.
                  End Date is optional.
                </p>
              </div>
            </div>
          )}

          {isMonthly && (
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-start gap-3">
              <Clock className="text-cyan-400 shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <span className="font-bold block text-cyan-200">
                  Monthly Recurrence Schedule
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Voucher recurs every month during the specified active hours.
                  End Date is optional.
                </p>
              </div>
            </div>
          )}

          {/* Date & Time Selection (Hidden for Birthday) */}
          {!isBirthday && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="startDate"
                    className="text-xs font-bold text-slate-400 uppercase tracking-widest"
                  >
                    Start Date {isOneTime ? '*' : ''}
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
                    End Date {isOneTime ? '*' : '(Optional)'}
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
            </>
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
              {isSaving ? 'Saving...' : 'Save Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoucherValidityModal;
