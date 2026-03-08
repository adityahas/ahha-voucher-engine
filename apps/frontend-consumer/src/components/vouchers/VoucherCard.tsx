import { motion } from 'framer-motion';
import { Ticket, Tag } from 'lucide-react';
import type { Voucher } from '../../types/voucher';
import { Button } from '../ui/Button';

interface VoucherCardProps {
  voucher: Voucher;
  index: number;
}

export function VoucherCard({ voucher, index }: VoucherCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass-panel group relative overflow-hidden rounded-2xl transition-all hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-fuchsia-500/0 to-transparent transition-all duration-500 group-hover:from-cyan-500/10 group-hover:via-fuchsia-500/10" />
      
      <div className="relative z-10 p-6 flex flex-col h-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            {voucher.quota > 0 ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {voucher.quota} Left
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">
                Fully Claimed
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-1 leading-tight">
            {voucher.name}
          </h3>
          <p className="text-xs text-slate-500 mb-4 font-mono">{voucher.code}</p>
          
          <p className="text-sm text-slate-400 mb-4 line-clamp-2">
            {voucher.description}
          </p>
          
          <div className="space-y-3">
            {voucher.categories?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <Tag className="w-3 h-3 text-slate-500 mr-1" />
                {voucher.categories.map((cat) => (
                  <span key={cat.id} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10">
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            {voucher.bindings?.length > 0 && (
              <div className="pt-2 border-t border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-bold">Active Bindings</p>
                <div className="flex flex-wrap gap-1.5">
                  {voucher.bindings.map((bind, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {bind.bind_type.replace('_', ' ')}: {bind.bind_value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
            <Button className="w-full py-2.5 bg-white/10 hover:bg-cyan-500 shadow-none hover:shadow-cyan-500/25 transition-all duration-300">
               Claim Voucher
            </Button>
        </div>
      </div>
    </motion.div>
  );
}
