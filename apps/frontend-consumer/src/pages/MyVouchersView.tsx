import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, List } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getClaimedVouchers } from '../api/vouchers';
import type { ClaimedVoucherInfo } from '../types/voucher';
import { ClaimedVoucherCard } from '../components/vouchers/ClaimedVoucherCard';
import { ConsumerLayout } from '../components/layout/ConsumerLayout';

export default function MyVouchersView() {
  const [vouchers, setVouchers] = useState<ClaimedVoucherInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVouchers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getClaimedVouchers(0, 50); // Get first 50 for now
      setVouchers(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load claimed vouchers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  return (
    <ConsumerLayout>
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              My{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                Vouchers
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl">
              View and manage the exclusive rewards you have claimed.
            </p>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-500 backdrop-blur-md"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="glass-panel h-[240px] rounded-2xl p-6 animate-pulse bg-slate-800/40"
                />
              ))}
            </motion.div>
          ) : vouchers.length > 0 ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 md:pb-0" // Add padding for mobile nav if needed
            >
              {vouchers.map((claimed, index) => (
                <ClaimedVoucherCard 
                  key={claimed.id} 
                  claimedVoucher={claimed} 
                  index={index} 
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl border-dashed border-white/20 mt-8"
            >
              <div className="h-20 w-20 rounded-full bg-slate-800/50 flex flex-col items-center justify-center mb-6">
                <List className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-2 text-white">
                No Claimed Vouchers
              </h3>
              <p className="text-slate-400 max-w-sm">
                You haven't claimed any vouchers yet. Head back to Explore Rewards to find amazing offers!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ConsumerLayout>
  );
}
