import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { VoucherBinding } from '../../types/voucher';

interface BindingTagProps {
  binding: VoucherBinding;
  onRemove: () => void;
}

export function BindingTag({ binding, onRemove }: BindingTagProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium backdrop-blur-sm"
    >
      <span className="opacity-60">{binding.bind_type.replace('_', ' ')}:</span>
      <span>{binding.bind_value}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:text-white transition-colors p-0.5 rounded-full hover:bg-white/10"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}
