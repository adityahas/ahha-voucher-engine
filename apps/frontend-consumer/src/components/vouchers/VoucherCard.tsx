import React from 'react';
import { motion } from 'framer-motion';
import { Ticket, Calendar, Tag } from 'lucide-react';
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
      {/* Hover Gradient Sweep */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-fuchsia-500/0 to-transparent transition-all duration-500 group-hover:from-cyan-500/10 group-hover:via-fuchsia-500/10" />
      
      <div className="relative z-10 p-6 flex flex-col h-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            {voucher.quota > 0 ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Available
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">
                Fully Claimed
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2 leading-tight">
            {voucher.name}
          </h3>
          
          <div className="flex flex-col gap-2 mt-4 text-sm text-slate-400">
             <div className="flex items-center gap-2">
               <Calendar className="w-4 h-4 text-slate-500" />
               <span>Valid until: {new Date(voucher.end_date).toLocaleDateString()}</span>
             </div>
             {voucher.categories?.length > 0 && (
               <div className="flex items-center gap-2">
                 <Tag className="w-4 h-4 text-slate-500" />
                 <span className="truncate">{voucher.categories.map(c => c.name).join(', ')}</span>
               </div>
             )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Quota: {voucher.quota}
            </div>
            <Button className="py-2 px-4 h-auto text-sm bg-white/10 hover:bg-cyan-500 shadow-none hover:shadow-cyan-500/25">
               Claim Now
            </Button>
        </div>
      </div>
    </motion.div>
  );
}
