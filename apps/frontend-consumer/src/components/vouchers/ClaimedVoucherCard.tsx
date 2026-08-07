import { motion } from 'framer-motion';
import { Ticket, Tag, CalendarClock, AlertCircle } from 'lucide-react';
import type { ClaimedVoucherInfo } from '../../types/voucher';
import { useCurrencySettings } from '../../context/currency-settings';
import { formatVoucherDiscount } from '../../lib/voucher-discount-format';
import { isVoucherExpired } from '../../lib/voucher-validity';

interface ClaimedVoucherCardProps {
  claimedVoucher: ClaimedVoucherInfo;
  index: number;
}

export function ClaimedVoucherCard({
  claimedVoucher,
  index,
}: ClaimedVoucherCardProps) {
  const { voucher, created_at } = claimedVoucher;
  const currencySettings = useCurrencySettings();
  const expired = isVoucherExpired(voucher.validities);
  let claimedDate = 'Unknown Date';
  if (created_at) {
    const d = new Date(created_at);
    if (!isNaN(d.getTime())) {
      claimedDate = d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`glass-panel group relative overflow-hidden rounded-2xl transition-all hover:-translate-y-1 hover:shadow-2xl ${
        expired
          ? 'border-red-500/40 opacity-70 hover:border-red-500/60 hover:shadow-red-500/10'
          : 'hover:border-fuchsia-500/50 hover:shadow-fuchsia-500/20'
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${
          expired
            ? 'from-red-500/5 via-slate-500/0 to-transparent'
            : 'from-fuchsia-500/0 via-cyan-500/0 to-transparent'
        } transition-all duration-500 group-hover:from-fuchsia-500/10 group-hover:via-cyan-500/10`}
      />
      {expired && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
          <AlertCircle className="w-3 h-3" />
          EXPIRED
        </div>
      )}

      <div className="relative z-10 p-6 flex flex-col h-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
              <Ticket className="w-6 h-6 text-white" />
            </div>

            <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
              <CalendarClock className="w-3 h-3" />
              Claimed {claimedDate}
            </span>
          </div>

          <h3 className="text-xl font-bold text-white mb-1 leading-tight">
            {voucher.name}
          </h3>
          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs text-slate-500 font-mono select-all bg-white/5 inline-block px-2 py-0.5 rounded border border-white/5">
              {voucher.code}
            </p>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 uppercase tracking-widest">
              {voucher.voucher_type?.replace('_', ' ') || 'CLAIMABLE'}
            </span>
          </div>

          <p className="text-sm text-slate-400 mb-4 line-clamp-2">
            {voucher.description}
          </p>

          <p className="mb-4 text-sm font-semibold text-cyan-300">
            {formatVoucherDiscount(
              voucher.discount_type,
              voucher.discount_value,
              currencySettings,
            )}
          </p>

          <div className="space-y-3">
            {voucher.categories?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center pb-2 border-b border-white/5">
                <Tag className="w-3 h-3 text-slate-500 mr-1" />
                {voucher.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          {/* Action buttons like 'Use' or 'Copy Code' could go here in the future */}
          <div
            className={`w-full py-2.5 border rounded-xl text-center text-sm font-medium ${
              expired
                ? 'bg-red-500/10 border-red-500/20 text-red-400 cursor-not-allowed'
                : 'bg-white/5 border-white/10 text-slate-300 cursor-not-allowed'
            }`}
          >
            {expired ? 'Expired' : 'Ready to Use'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
