import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { AlertCircle, LogOut, Ticket, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { findEligibleVouchers } from '../api/vouchers';
import type { Voucher, VoucherBinding } from '../types/voucher';
import { VoucherCard } from '../components/vouchers/VoucherCard';
import { BindingSelector } from '../components/vouchers/BindingSelector';

export default function VoucherDashboardView() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVouchers = useCallback(async (bindings: VoucherBinding[] = []) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use dynamic bindings, identity is handled via JWT on backend
      const data = await findEligibleVouchers(bindings);
      setVouchers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load eligible vouchers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <nav className="glass-panel sticky top-0 z-50 flex h-16 items-center justify-between px-6 border-b border-white/5 bg-slate-950/50 rounded-none shadow-none">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center">
            <Ticket className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">
            Ahha Rewards
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
            <User className="w-4 h-4" />
            <span>{user?.email || 'User'}</span>
          </div>
          <button
            onClick={clearAuth}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
                Eligible Rewards
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl">
              Discover and claim exclusive vouchers curated just for you.
            </p>
          </div>

          <BindingSelector onFind={fetchVouchers} isLoading={isLoading} />
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {vouchers.map((voucher, index) => (
                <VoucherCard key={voucher.code} voucher={voucher} index={index} />
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
                <Ticket className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-2 text-white">
                No Vouchers Found
              </h3>
              <p className="text-slate-400 max-w-sm">
                You don't have any eligible vouchers right now. Check back later
                for new offers!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
