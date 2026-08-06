import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader2,
  SearchX,
  Tag,
  Ticket,
} from 'lucide-react';
import { ConsumerLayout } from '../components/layout/ConsumerLayout';
import { Button } from '../components/ui/Button';
import { claimVoucher, findEligibleVoucherByCode } from '../api/vouchers';
import type { Voucher } from '../types/voucher';
import { useCurrencySettings } from '../context/CurrencyContext';
import { formatVoucherDiscount } from '../lib/voucher-discount-format';

interface VoucherDetailLocationState {
  voucher?: Voucher;
}

export default function VoucherDetailView() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as VoucherDetailLocationState | null;

  const [voucher, setVoucher] = useState<Voucher | null>(
    state?.voucher && state.voucher.code === code ? state.voucher : null,
  );
  const [isLoading, setIsLoading] = useState(!voucher);
  const [error, setError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const currencySettings = useCurrencySettings();

  useEffect(() => {
    if (!code) {
      setError('Voucher code is missing.');
      setIsLoading(false);
      return;
    }

    if (voucher?.code === code) {
      return;
    }

    let isMounted = true;
    const loadVoucher = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const found = await findEligibleVoucherByCode(code);
        if (!found) {
          throw new Error(
            'This voucher is not currently available to your account.',
          );
        }
        if (isMounted) {
          setVoucher(found);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load voucher details.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadVoucher();
    return () => {
      isMounted = false;
    };
  }, [code, voucher?.code]);

  const quotaStatus = useMemo(() => {
    if (!voucher) {
      return 'Unavailable';
    }
    return voucher.quota > 0 ? `${voucher.quota} Left` : 'Fully Claimed';
  }, [voucher]);

  const handleClaim = async () => {
    if (!voucher || voucher.quota <= 0 || isClaiming || isClaimed) {
      return;
    }

    setIsClaiming(true);
    setError(null);
    try {
      await claimVoucher(voucher.code);
      setIsClaimed(true);
      setVoucher((prev) =>
        prev
          ? {
              ...prev,
              quota: Math.max(0, prev.quota - 1),
            }
          : prev,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to claim voucher.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <ConsumerLayout>
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12 pb-24 md:pb-12">
        <motion.button
          type="button"
          onClick={() => navigate('/')}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition-all hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Eligible Rewards
        </motion.button>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel animate-pulse rounded-3xl p-8 md:p-10"
            >
              <div className="mb-6 h-8 w-2/3 rounded-xl bg-white/10" />
              <div className="mb-3 h-4 w-1/2 rounded-lg bg-white/10" />
              <div className="mb-8 h-4 w-5/6 rounded-lg bg-white/10" />
              <div className="h-28 rounded-2xl bg-slate-800/60" />
            </motion.div>
          ) : error || !voucher ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-red-500/20 p-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                <SearchX className="h-7 w-7" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-white">
                Voucher Not Found
              </h1>
              <p className="mx-auto mb-6 max-w-lg text-sm text-slate-300">
                {error || 'Unable to locate this voucher detail.'}
              </p>
              <Button
                className="bg-white/10 hover:bg-white/20"
                onClick={() => navigate('/')}
              >
                Browse Eligible Rewards
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel overflow-hidden rounded-3xl"
            >
              <div className="relative border-b border-white/10 p-8 md:p-10">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-fuchsia-500/10 to-transparent" />
                <div className="relative z-10">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                      <Ticket className="h-3.5 w-3.5" />
                      {voucher.voucher_type?.replace('_', ' ') || 'CLAIMABLE'}
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        voucher.quota > 0
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                      }`}
                    >
                      {quotaStatus}
                    </span>
                  </div>

                  <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">
                    {voucher.name}
                  </h1>
                  <p className="mb-4 font-mono text-xs text-slate-400">
                    Code: {voucher.code}
                  </p>
                  <p className="max-w-3xl text-slate-200">
                    {voucher.description || 'No description available.'}
                  </p>
                  <p className="mt-4 text-lg font-semibold text-cyan-300">
                    {formatVoucherDiscount(
                      voucher.discount_type,
                      voucher.discount_value,
                      currencySettings,
                    )}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 p-8 md:grid-cols-2 md:p-10">
                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h2 className="mb-3 text-lg font-semibold text-white">
                    Categories
                  </h2>
                  {voucher.categories?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {voucher.categories.map((category) => (
                        <span
                          key={category.id}
                          className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-slate-200"
                        >
                          <Tag className="h-3 w-3 text-slate-400" />
                          {category.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      No categories assigned.
                    </p>
                  )}
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h2 className="mb-3 text-lg font-semibold text-white">
                    Eligible Bindings
                  </h2>
                  {voucher.bindings?.length ? (
                    <ul className="space-y-2">
                      {voucher.bindings.map((binding, index) => (
                        <li
                          key={`${binding.bind_type}-${binding.bind_value}-${index}`}
                          className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200"
                        >
                          <span className="font-semibold uppercase tracking-wide text-cyan-300">
                            {binding.bind_type.replace('_', ' ')}
                          </span>
                          {' - '}
                          <span>{binding.bind_value}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400">
                      This voucher has no specific binding requirements.
                    </p>
                  )}
                </section>
              </div>

              <div className="border-t border-white/10 bg-slate-900/30 p-8 md:p-10">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleClaim}
                    disabled={voucher.quota <= 0 || isClaiming || isClaimed}
                    className={`min-w-[180px] ${
                      isClaimed
                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        : 'bg-cyan-500 hover:bg-cyan-400'
                    }`}
                  >
                    {isClaiming ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Claiming...
                      </span>
                    ) : isClaimed ? (
                      <span className="inline-flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Claimed Successfully
                      </span>
                    ) : (
                      'Claim Voucher'
                    )}
                  </Button>

                  <Button
                    onClick={() => navigate('/my-vouchers')}
                    className="min-w-[160px] border border-white/15 bg-white/10 hover:bg-white/20"
                  >
                    Go to My Vouchers
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ConsumerLayout>
  );
}
