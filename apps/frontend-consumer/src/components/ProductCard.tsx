import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import type { Product } from '../types/product';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useCurrencySettings } from '../context/currency-settings';
import { formatCurrency } from '../lib/currency-format';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProductCardProps {
  product: Product;
  onBuy?: (product: Product) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onBuy,
  className,
}) => {
  const currencySettings = useCurrencySettings();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -5,
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      className={cn(
        'glass-panel relative overflow-hidden group flex flex-col h-full rounded-2xl transition-all duration-300',
        'hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]',
        className,
      )}
    >
      {/* Product Image Area */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-800/50">
        {product.image || product.image_url ? (
          <img
            src={product.image || product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20">
            <ShoppingBag className="w-12 h-12 text-slate-400 opacity-50" />
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute top-3 right-3 glass-panel px-3 py-1 rounded-full text-sm font-bold border-cyan-500/30 text-cyan-400">
          {formatCurrency(product.price, currencySettings)}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">
          {product.name}
        </h3>
        <p className="text-slate-400 text-sm mb-6 flex-grow line-clamp-3">
          {product.description ||
            'No description available for this premium item.'}
        </p>

        <button
          onClick={() => onBuy?.(product)}
          className="w-full mt-auto py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 
                     bg-gradient-to-r from-cyan-600 to-fuchsia-600 
                     hover:from-cyan-500 hover:to-fuchsia-500 
                     text-white shadow-[0_4px_15px_rgba(6,182,212,0.3)]
                     active:scale-[0.98] transition-all duration-200"
        >
          <ShoppingCart className="w-4 h-4" />
          Purchase Now
        </button>
      </div>

      {/* Decorative Gradient Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/0 via-fuchsia-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity pointer-events-none" />
    </motion.div>
  );
};
