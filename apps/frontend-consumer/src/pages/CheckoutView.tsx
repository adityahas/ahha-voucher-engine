import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Info, ShoppingBag, Tag } from 'lucide-react';
import { getProductById } from '../api/products';
import { executePurchase } from '../api/purchase';
import { calculateDiscount } from '../api/vouchers';
import { FeedbackOverlay } from '../components/FeedbackOverlay';
import type { Product } from '../types/product';
import type { CalculateDiscountResponse } from '../types/voucher';
import {
  formatCurrency,
  useCurrencySettings,
} from '../context/currency-settings';

export const CheckoutView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currencySettings = useCurrencySettings();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [voucherCode, setVoucherCode] = useState('');
  const [calculation, setCalculation] =
    useState<CalculateDiscountResponse | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [txnStatus, setTxnStatus] = useState<
    'idle' | 'processing' | 'success' | 'error'
  >('idle');
  const [txnMessage, setTxnMessage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getProductById(id);
        setProduct(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    // Reset calculation if quantity changes OR voucher is manually changed without applying
    setCalculation(null);
    setVoucherError(null);
  }, [quantity]);

  const handleApplyVoucher = async () => {
    if (!product || !voucherCode) return;

    try {
      setCalculating(true);
      setVoucherError(null);
      const result = await calculateDiscount({
        voucher_code: voucherCode,
        product_id: product.id,
        quantity,
      });

      if (!result.isValid) {
        setVoucherError(result.message);
        setCalculation(null);
      } else {
        setCalculation(result);
      }
    } catch (err: any) {
      setVoucherError(err.message || 'Failed to validate voucher');
      setCalculation(null);
    } finally {
      setCalculating(false);
    }
  };

  const handlePurchase = async () => {
    if (!product) return;

    try {
      setTxnStatus('processing');
      await executePurchase({
        product_id: product.id,
        quantity,
        voucher_code: voucherCode || undefined,
      });
      setTxnStatus('success');
      setTxnMessage(
        `You've successfully purchased ${quantity}x ${product.name}!`,
      );
    } catch (err: any) {
      setTxnStatus('error');
      setTxnMessage(
        err.message ||
          'Transaction failed. Please check your balance or voucher validity.',
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] text-white font-black text-2xl animate-pulse">
        Initializing Secure Checkout...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6 text-center">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-6">
          {error || 'Product not found'}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:underline flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Back to Showcase
        </button>
      </div>
    );
  }

  const subtotal = product.price * quantity;
  const discount = calculation?.discountAmount || 0;
  const total = calculation?.finalPrice || subtotal;
  const isVoucherApplied = !!calculation && calculation.isValid;
  const effectiveApplied = isVoucherApplied && discount > 0;

  return (
    <div className="relative min-h-[calc(100vh-80px)] p-6 overflow-hidden flex items-center justify-center">
      {/* Animated Mesh Gradients */}
      <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-8"
      >
        {/* Left Column: Product Summary */}
        <div className="lg:col-span-3 space-y-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Showcase
          </button>

          <div className="glass-panel p-8 rounded-[32px] overflow-hidden group">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden bg-slate-800/50 border border-white/5">
                <img
                  src={
                    product.image ||
                    product.image_url ||
                    'https://via.placeholder.com/300?text=Product'
                  }
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">
                    {product.name}
                  </h2>
                  <p className="text-slate-400 text-sm line-clamp-2 mt-1">
                    {product.description}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div
                    data-testid="product-price"
                    className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400"
                  >
                    {formatCurrency(product.price, currencySettings)}
                  </div>
                  <div className="flex items-center gap-4 bg-white/5 rounded-xl p-1 border border-white/10">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-white font-bold">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3 text-cyan-400 mb-2">
                <ShoppingBag size={20} />
                <span className="font-bold text-sm uppercase tracking-wider">
                  Fast Delivery
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                Instant digital key delivery to your email and dashboard.
              </p>
            </div>
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3 text-fuchsia-400 mb-2">
                <Info size={20} />
                <span className="font-bold text-sm uppercase tracking-wider">
                  Secure Payment
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                All transactions are encrypted and secured via standard
                protocols.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel backdrop-blur-xl p-8 rounded-[32px] border-white/10 bg-white/5 shadow-2xl space-y-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="text-indigo-400" />
              Order Summary
            </h3>

            {/* Voucher Field */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                Voucher Code
              </label>
              <div className="relative group">
                <Tag
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    isVoucherApplied
                      ? 'text-emerald-400'
                      : 'text-slate-500 group-focus-within:text-indigo-400'
                  }`}
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Enter code..."
                  value={voucherCode}
                  onChange={(e) => {
                    setVoucherCode(e.target.value.toUpperCase());
                    if (calculation) setCalculation(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()}
                  className={`w-full pl-11 pr-24 py-4 rounded-2xl bg-black/20 border transition-all outline-none font-bold placeholder:text-slate-600 ${
                    effectiveApplied
                      ? 'border-emerald-500/50 text-emerald-400 ring-2 ring-emerald-500/10'
                      : voucherError
                        ? 'border-rose-500/50 text-rose-400 ring-2 ring-rose-500/10'
                        : 'border-white/10 focus:border-indigo-500/50 text-white'
                  }`}
                />
                <button
                  onClick={handleApplyVoucher}
                  disabled={calculating || !voucherCode}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all disabled:opacity-30"
                >
                  {calculating ? '...' : 'APPLY'}
                </button>
                {effectiveApplied && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-6 left-1 text-[10px] text-emerald-400 font-bold uppercase tracking-tight"
                  >
                    Voucher Applied Successfully!
                  </motion.div>
                )}
                {voucherError && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute -bottom-6 left-1 text-[10px] text-rose-400 font-bold uppercase tracking-tight"
                  >
                    {voucherError}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span data-testid="subtotal-amount">
                  {formatCurrency(subtotal, currencySettings)}
                </span>
              </div>
              <AnimatePresence>
                {effectiveApplied && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <div className="flex items-center gap-2">
                        <Tag size={14} />
                        <span>Voucher Savings</span>
                      </div>
                      <span>-{formatCurrency(discount, currencySettings)}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex justify-between text-white font-black text-2xl pt-2">
                <span>Total</span>
                <span
                  data-testid="total-amount"
                  className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400"
                >
                  {formatCurrency(total, currencySettings)}
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePurchase}
              disabled={txnStatus === 'processing'}
              className="w-full py-5 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-600 to-fuchsia-600 text-white font-black text-lg shadow-[0_10px_40px_rgba(99,102,241,0.3)] hover:shadow-[0_15px_50px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Purchase
            </motion.button>

            <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">
              By completing this purchase, you agree to our{' '}
              <span className="text-indigo-400 underline cursor-pointer">
                Terms of Service
              </span>{' '}
              and{' '}
              <span className="text-indigo-400 underline cursor-pointer">
                Consumer Rights
              </span>
              .
            </p>
          </div>
        </div>
      </motion.div>

      <FeedbackOverlay
        status={txnStatus}
        message={txnMessage}
        onClose={() => {
          if (txnStatus === 'success') {
            navigate('/my-vouchers');
          } else {
            setTxnStatus('idle');
          }
        }}
      />
    </div>
  );
};
