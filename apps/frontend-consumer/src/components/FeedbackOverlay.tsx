import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2 } from 'lucide-react';

interface FeedbackOverlayProps {
  status: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
  onClose?: () => void;
}

export const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({ status, message, onClose }) => {
  if (status === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm overflow-hidden bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center"
        >
          {/* Background Highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex justify-center">
              {status === 'processing' && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-20 h-20 rounded-full flex items-center justify-center bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                >
                  <Loader2 className="w-10 h-10" />
                </motion.div>
              )}
              {status === 'success' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_40px_rgba(52,211,153,0.3)]"
                >
                  <Check className="w-10 h-10" />
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div
                  animate={{ x: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.3)]"
                >
                  <X className="w-10 h-10" />
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {status === 'processing' && 'Processing Transaction'}
                {status === 'success' && 'Purchase Successful!'}
                {status === 'error' && 'Transaction Failed'}
              </h3>
              {message && (
                <p className="text-white/70 text-sm leading-relaxed max-w-[240px] mx-auto">
                  {message}
                </p>
              )}
            </div>

            {status !== 'processing' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className={`w-full py-4 rounded-2xl font-semibold text-white transition-all shadow-lg ${
                  status === 'success'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-rose-500 to-pink-600 shadow-rose-500/25'
                }`}
              >
                {status === 'success' ? 'Continue' : 'Try Again'}
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
